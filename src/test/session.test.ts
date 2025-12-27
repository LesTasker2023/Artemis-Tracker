/**
 * Tests for session management
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  Session,
  createSession,
  addEventToSession,
  endSession,
  calculateSessionStats,
} from "../core/session";
import { Loadout, createLoadout } from "../core/loadout";
import { ParsedEvent } from "../core/parser";

describe("Session", () => {
  describe("createSession", () => {
    it("creates session with default name", () => {
      const session = createSession();
      expect(session.id).toMatch(/^session-\d+$/);
      expect(session.name).toMatch(/^Hunt \d+/);
      expect(session.startedAt).toBeDefined();
      expect(session.endedAt).toBeUndefined();
      expect(session.events).toEqual([]);
      expect(session.loadoutSnapshots).toEqual({});
      expect(session.manualCostPerShot).toBe(0.05);
    });

    it("creates session with custom name", () => {
      const session = createSession("Atrox Hunt");
      expect(session.name).toBe("Atrox Hunt");
    });
  });

  describe("addEventToSession", () => {
    let session: Session;
    let loadout: Loadout;

    beforeEach(() => {
      session = createSession("Test Hunt");
      loadout = createLoadout("Test Loadout");
      loadout.weapon = {
        name: "Test Gun",
        economy: { decay: 0.05, ammoBurn: 10 },
      };
    });

    it("adds event with loadout tag", () => {
      const event: ParsedEvent = {
        timestamp: Date.now(),
        raw: "test",
        type: "damage_dealt",
        amount: 50,
      };

      const updated = addEventToSession(session, event, loadout);
      
      expect(updated.events).toHaveLength(1);
      expect(updated.events[0].loadoutId).toBe(loadout.id);
    });

    it("snapshots loadout on first use", () => {
      const event: ParsedEvent = {
        timestamp: Date.now(),
        raw: "test",
        type: "damage_dealt",
        amount: 50,
      };

      const updated = addEventToSession(session, event, loadout);
      
      expect(updated.loadoutSnapshots[loadout.id]).toBeDefined();
      expect(updated.loadoutSnapshots[loadout.id].name).toBe("Test Loadout");
      expect(updated.loadoutSnapshots[loadout.id].costPerShot).toBeGreaterThan(0);
    });

    it("handles null loadout (manual mode)", () => {
      const event: ParsedEvent = {
        timestamp: Date.now(),
        raw: "test",
        type: "damage_dealt",
        amount: 50,
      };

      const updated = addEventToSession(session, event, null);
      
      expect(updated.events[0].loadoutId).toBeUndefined();
      expect(Object.keys(updated.loadoutSnapshots)).toHaveLength(0);
    });

    it("preserves existing loadout snapshots", () => {
      const event1: ParsedEvent = {
        timestamp: Date.now(),
        raw: "test1",
        type: "damage_dealt",
        amount: 50,
      };

      const updated1 = addEventToSession(session, event1, loadout);

      // Create a different loadout
      const loadout2 = createLoadout("Loadout 2");
      loadout2.weapon = {
        name: "Gun 2",
        economy: { decay: 0.03, ammoBurn: 8 },
      };

      const event2: ParsedEvent = {
        timestamp: Date.now(),
        raw: "test2",
        type: "damage_dealt",
        amount: 60,
      };

      const updated2 = addEventToSession(updated1, event2, loadout2);

      expect(Object.keys(updated2.loadoutSnapshots)).toHaveLength(2);
      expect(updated2.loadoutSnapshots[loadout.id]).toBeDefined();
      expect(updated2.loadoutSnapshots[loadout2.id]).toBeDefined();
    });
  });

  describe("endSession", () => {
    it("sets endedAt timestamp", () => {
      const session = createSession();
      const ended = endSession(session);
      
      expect(ended.endedAt).toBeDefined();
      expect(new Date(ended.endedAt!).getTime()).toBeGreaterThan(0);
    });
  });

  describe("calculateSessionStats", () => {
    it("calculates basic combat stats", () => {
      let session = createSession();
      
      // Add some combat events
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 },
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 60, critical: true },
        { timestamp: Date.now(), raw: "", type: "miss" },
        { timestamp: Date.now(), raw: "", type: "loot", value: 10, itemName: "Shrapnel" }, // Infers kill
        { timestamp: Date.now(), raw: "", type: "damage_taken", amount: 25 },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      expect(stats.shots).toBe(3); // 2 hits + 1 miss
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.kills).toBe(1); // Inferred from loot
      expect(stats.criticals).toBe(1);
      expect(stats.damageDealt).toBe(110);
      expect(stats.damageTaken).toBe(25);
      
      // Check combat breakdown
      expect(stats.combat.totalShots).toBe(3);
      expect(stats.combat.hits).toBe(2);
      expect(stats.combat.killsInferred).toBe(1);
    });

    it("calculates economy with manual cost", () => {
      let session = createSession();
      session.manualCostPerShot = 0.10;
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 },
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 60 },
        { timestamp: Date.now(), raw: "", type: "miss" },
        { timestamp: Date.now(), raw: "", type: "loot", value: 5.50, itemName: "Shrapnel" },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      expect(stats.shots).toBe(3);
      expect(stats.totalSpend).toBeCloseTo(0.30); // 3 shots * 0.10
      expect(stats.lootValue).toBeCloseTo(5.50);
      expect(stats.lootCount).toBe(1);
      expect(stats.profit).toBeCloseTo(5.20); // 5.50 - 0.30
    });

    it("calculates per-loadout breakdown", () => {
      let session = createSession();
      
      // Loadout 1
      const loadout1 = createLoadout("Cheap Gun");
      loadout1.weapon = {
        name: "Cheap",
        economy: { decay: 0.01, ammoBurn: 5 },
      };
      
      // Loadout 2
      const loadout2 = createLoadout("Expensive Gun");
      loadout2.weapon = {
        name: "Expensive",
        economy: { decay: 0.05, ammoBurn: 20 },
      };

      // Events with loadout 1
      session = addEventToSession(session, { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 }, loadout1);
      session = addEventToSession(session, { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 }, loadout1);
      
      // Switch to loadout 2
      session = addEventToSession(session, { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 100 }, loadout2);
      session = addEventToSession(session, { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 100 }, loadout2);

      const stats = calculateSessionStats(session);
      
      expect(stats.loadoutBreakdown).toHaveLength(2);
      
      const breakdown1 = stats.loadoutBreakdown.find(b => b.loadoutName === "Cheap Gun");
      const breakdown2 = stats.loadoutBreakdown.find(b => b.loadoutName === "Expensive Gun");
      
      expect(breakdown1).toBeDefined();
      expect(breakdown1!.shots).toBe(2);
      
      expect(breakdown2).toBeDefined();
      expect(breakdown2!.shots).toBe(2);
      
      // Expensive gun should have higher spend
      expect(breakdown2!.spend).toBeGreaterThan(breakdown1!.spend);
    });

    it("tracks defense stats", () => {
      let session = createSession();
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "player_dodged" },
        { timestamp: Date.now(), raw: "", type: "player_evaded" },
        { timestamp: Date.now(), raw: "", type: "enemy_missed" },
        { timestamp: Date.now(), raw: "", type: "self_heal", amount: 100 },
        { timestamp: Date.now(), raw: "", type: "healed_by", amount: 50 },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      expect(stats.dodges).toBe(1);
      expect(stats.evades).toBe(1);
      expect(stats.healed).toBe(150);
      expect(stats.combat.playerDodges).toBe(1);
      expect(stats.combat.playerEvades).toBe(1);
      expect(stats.combat.enemyMisses).toBe(1);
      expect(stats.combat.selfHealing).toBe(100);
      expect(stats.combat.healingReceived).toBe(50);
    });

    it("tracks skill gains with breakdown", () => {
      let session = createSession();
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "skill_gain", amount: 0.5, skillName: "Rifle", skillCategory: "combat" },
        { timestamp: Date.now(), raw: "", type: "skill_gain", amount: 0.3, skillName: "Rifle", skillCategory: "combat" },
        { timestamp: Date.now(), raw: "", type: "skill_gain", amount: 0.2, skillName: "Anatomy", skillCategory: "profession" },
        { timestamp: Date.now(), raw: "", type: "attribute_gain", amount: 0.1, skillName: "Agility", skillCategory: "attributes" },
        { timestamp: Date.now(), raw: "", type: "skill_rank", skillName: "Rifle" },
        { timestamp: Date.now(), raw: "", type: "global" },
        { timestamp: Date.now(), raw: "", type: "hof" },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      // Total skill point value
      expect(stats.skillGains).toBeCloseTo(1.1); // 0.5 + 0.3 + 0.2 + 0.1
      expect(stats.globalCount).toBe(2); // global + hof
      expect(stats.hofs).toBe(1);
      
      // Detailed breakdown
      expect(stats.skills.totalSkillGains).toBeCloseTo(1.1);
      expect(stats.skills.totalSkillEvents).toBe(5); // 3 skill_gain + 1 attribute + 1 rank
      expect(stats.skills.skillRanks).toBe(1);
      
      // By skill
      expect(stats.skills.bySkill["Rifle"].totalGain).toBeCloseTo(0.8);
      expect(stats.skills.bySkill["Rifle"].gainCount).toBe(2);
      expect(stats.skills.bySkill["Anatomy"].totalGain).toBeCloseTo(0.2);
      
      // By category
      expect(stats.skills.byCategory.combat).toBeCloseTo(0.8);
      expect(stats.skills.byCategory.profession).toBeCloseTo(0.2);
      expect(stats.skills.byCategory.attributes).toBeCloseTo(0.1);
    });

    it("calculates return rate", () => {
      let session = createSession();
      session.manualCostPerShot = 1.00; // 1 PED per shot
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 },
        { timestamp: Date.now(), raw: "", type: "loot", value: 0.90, itemName: "Shrapnel" }, // 90% return
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      expect(stats.returnRate).toBeCloseTo(90);
    });

    it("tracks all miss types as shots", () => {
      let session = createSession();
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 },
        { timestamp: Date.now(), raw: "", type: "miss" },
        { timestamp: Date.now(), raw: "", type: "target_dodged" },
        { timestamp: Date.now(), raw: "", type: "target_evaded" },
        { timestamp: Date.now(), raw: "", type: "target_resisted" },
        { timestamp: Date.now(), raw: "", type: "out_of_range" },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      expect(stats.shots).toBe(6); // All events count as shots
      expect(stats.hits).toBe(1);
      // miss + dodged + evaded + out_of_range = 4 (resisted counts separately, still did damage calc)
      expect(stats.misses).toBe(4);
      
      expect(stats.combat.targetDodged).toBe(1);
      expect(stats.combat.targetEvaded).toBe(1);
      expect(stats.combat.targetResisted).toBe(1);
      expect(stats.combat.outOfRange).toBe(1);
    });

    it("tracks deaths", () => {
      let session = createSession();
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "death" },
        { timestamp: Date.now(), raw: "", type: "death" },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      expect(stats.deaths).toBe(2);
      expect(stats.combat.deaths).toBe(2);
    });

    it("tracks loot breakdown", () => {
      let session = createSession();
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 },
        { timestamp: Date.now(), raw: "", type: "loot", value: 2.50, itemName: "Shrapnel", quantity: 250 },
        { timestamp: Date.now(), raw: "", type: "loot", value: 1.00, itemName: "Animal Hide", quantity: 5 },
        { timestamp: Date.now(), raw: "", type: "loot", value: 0.50, itemName: "Universal Ammo", quantity: 50 },
        { timestamp: Date.now(), raw: "", type: "loot", value: 3.00, itemName: "Shrapnel", quantity: 300 },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }

      const stats = calculateSessionStats(session);
      
      expect(stats.lootCount).toBe(4);
      expect(stats.lootValue).toBeCloseTo(7.00);
      
      // Loot breakdown
      expect(stats.loot.totalItems).toBe(4);
      expect(stats.loot.uniqueItems).toBe(3);
      expect(stats.loot.shrapnelValue).toBeCloseTo(5.50); // 2.50 + 3.00
      expect(stats.loot.ammoValue).toBeCloseTo(0.50);
      
      expect(stats.loot.byItem["Shrapnel"].count).toBe(2);
      expect(stats.loot.byItem["Shrapnel"].totalValue).toBeCloseTo(5.50);
      expect(stats.loot.byItem["Shrapnel"].quantity).toBe(550);
    });

    it("calculates skill efficiency", () => {
      let session = createSession();
      session.manualCostPerShot = 0.10;
      
      // Set session to have run for 1 hour
      const oneHourAgo = new Date(Date.now() - 3600000);
      session.startedAt = oneHourAgo.toISOString();
      
      const events: ParsedEvent[] = [
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 },
        { timestamp: Date.now(), raw: "", type: "damage_dealt", amount: 50 },
        { timestamp: Date.now(), raw: "", type: "loot", value: 1.00, itemName: "Loot" }, // Infers kill
        { timestamp: Date.now(), raw: "", type: "skill_gain", amount: 1.0, skillName: "Rifle" },
      ];

      for (const event of events) {
        session = addEventToSession(session, event, null);
      }
      session = endSession(session);

      const stats = calculateSessionStats(session);
      
      // 2 shots * 0.10 = 0.20 PED spent
      // 1.0 skill gained
      expect(stats.skillEfficiency.skillPerPedSpent).toBeCloseTo(5.0); // 1.0 / 0.20
      expect(stats.skillEfficiency.skillPerShot).toBeCloseTo(0.5); // 1.0 / 2
      expect(stats.skillEfficiency.skillPerKill).toBeCloseTo(1.0); // 1.0 / 1
      expect(stats.skillEfficiency.skillPerHour).toBeCloseTo(1.0); // ~1 hour
    });
  });
});
