/**
 * ARTEMIS v3 - Session Management
 * Comprehensive tracking for hunting sessions
 * 
 * Features:
 * - Loadout-aware cost calculation
 * - Full skill breakdown with categories
 * - Detailed loot tracking
 * - Combat statistics with all miss types
 * - Efficiency metrics (skill/loot per PED spent)
 */

import { ParsedEvent, isAmmoConsumingEvent } from "./parser";
import { Loadout, getEffectiveCostPerShot, calculateArmorDecayPerHit, calculateSinglePlateDecayPerHit, isLimitedItem } from "./loadout";
import { 
  SkillBreakdown, 
  SkillStats, 
  SkillCategory, 
  SkillEfficiency,
  LootBreakdown,
  CombatBreakdown,
  getSkillCategory 
} from "./types";

// ==================== Types ====================

/**
 * Snapshot of a loadout's cost at a point in time
 */
export interface LoadoutSnapshot {
  id: string;
  name: string;
  costPerShot: number;
}

/**
 * Event with loadout context
 */
export interface SessionEvent extends ParsedEvent {
  loadoutId?: string;
}

/**
 * A hunting session with all events and loadout tracking
 */
export interface Session {
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  events: SessionEvent[];
  loadoutSnapshots: Record<string, LoadoutSnapshot>;
  manualCostPerShot: number;
}

/**
 * Per-loadout breakdown
 */
export interface LoadoutBreakdown {
  loadoutId: string | null;
  loadoutName: string;
  costPerShot: number;
  shots: number;
  spend: number;
  lootValue: number;
  profit: number;
}

/**
 * Complete session statistics
 */
export interface SessionStats {
  // Time
  duration: number;
  
  // Combat
  shots: number;
  hits: number;
  misses: number;
  kills: number;
  criticals: number;
  damageDealt: number;
  damageTaken: number;
  
  // Defense
  dodges: number;
  evades: number;
  deflects: number;
  healed: number;
  
  // Economy
  lootCount: number;
  lootValue: number;
  totalSpend: number;    // Ammo burn + enhancer costs only (NO decay)
  profit: number;        // lootValue - totalSpend (gross profit before decay)
  netProfit: number;     // lootValue - totalSpend - decay (net profit after all costs)
  returnRate: number;    // lootValue / totalSpend as percentage
  decay: number;         // Total equipment decay (weapon + armor, L and UL)
  repairBill: number;    // Repair cost for UL items only (L items = TT loss, not repair)
  
  // Gains (backwards compatible)
  skillGains: number;  // Total skill point value
  globalCount: number;
  hofs: number;
  deaths: number;
  
  // Detailed breakdowns (NEW)
  combat: CombatBreakdown;
  skills: SkillBreakdown;
  skillEfficiency: SkillEfficiency;
  loot: LootBreakdown;
  
  // Per-loadout breakdown
  loadoutBreakdown: LoadoutBreakdown[];
}

// ==================== Session Creation ====================

/**
 * Create a new session
 */
export function createSession(name?: string): Session {
  const now = new Date();
  return {
    id: `session-${now.getTime()}`,
    name: name || `Hunt ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    startedAt: now.toISOString(),
    events: [],
    loadoutSnapshots: {},
    manualCostPerShot: 0.05, // Default fallback
  };
}

/**
 * Add an event to a session with loadout tagging
 * @param session The session to add to
 * @param event The log event
 * @param activeLoadout Currently active loadout (if any)
 * @returns Updated session (immutable)
 */
export function addEventToSession(
  session: Session,
  event: ParsedEvent,
  activeLoadout: Loadout | null
): Session {
  const loadoutId = activeLoadout?.id;
  
  // Create session event with loadout tag
  const sessionEvent: SessionEvent = {
    ...event,
    loadoutId,
  };
  
  // Snapshot loadout if not already captured
  let loadoutSnapshots = session.loadoutSnapshots;
  if (activeLoadout && !loadoutSnapshots[activeLoadout.id]) {
    loadoutSnapshots = {
      ...loadoutSnapshots,
      [activeLoadout.id]: {
        id: activeLoadout.id,
        name: activeLoadout.name,
        costPerShot: getEffectiveCostPerShot(activeLoadout),
      },
    };
  }
  
  return {
    ...session,
    events: [...session.events, sessionEvent],
    loadoutSnapshots,
  };
}

/**
 * End a session
 */
export function endSession(session: Session): Session {
  return {
    ...session,
    endedAt: new Date().toISOString(),
  };
}

// ==================== Statistics Calculation ====================

/**
 * Calculate comprehensive session statistics
 * @param session The session to calculate stats for
 * @param playerName Optional player name to filter globals (only count player's own globals)
 * @param activeLoadout Optional loadout for accurate armor decay calculation
 */
export function calculateSessionStats(session: Session, playerName?: string, activeLoadout?: Loadout | null): SessionStats {
  const events = session.events;
  
  // Time
  const startTime = new Date(session.startedAt).getTime();
  const endTime = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  const duration = Math.floor((endTime - startTime) / 1000);
  
  // Initialize combat breakdown
  const combat: CombatBreakdown = {
    totalShots: 0,
    hits: 0,
    misses: 0,
    criticals: 0,
    targetDodged: 0,
    targetEvaded: 0,
    targetResisted: 0,
    targetMissed: 0,
    outOfRange: 0,
    damageDealt: 0,
    criticalDamage: 0,
    averageDamagePerHit: 0,
    maxDamageHit: 0,
    dps: 0,
    ammoConsumed: 0,
    damageTaken: 0,
    criticalDamageTaken: 0,
    playerDodges: 0,
    playerEvades: 0,
    deflects: 0,
    enemyMisses: 0,
    damageReduced: 0,
    totalIncomingAttacks: 0,
    armorHits: 0,
    selfHealing: 0,
    healingReceived: 0,
    healingGiven: 0,
    healthRegen: 0,
    kills: 0,
    deaths: 0,
    killsInferred: 0,
  };
  
  // Initialize skill tracking
  const skillByName: Record<string, SkillStats> = {};
  const skillByCategory: Record<SkillCategory, number> = {
    combat: 0,
    attributes: 0,
    profession: 0,
    support: 0,
    other: 0,
  };
  let totalSkillGains = 0;
  let totalSkillEvents = 0;
  let skillRanks = 0;
  let newSkillsUnlocked = 0;
  
  // Initialize loot tracking
  const lootByItem: Record<string, { itemName: string; count: number; totalValue: number; quantity: number }> = {};
  let totalLootValue = 0;
  let totalLootItems = 0;
  let shrapnelValue = 0;
  let ammoValue = 0;
  
  // Globals/HOFs
  let globalCount = 0;
  let hofs = 0;
  
  // Per-loadout tracking
  const loadoutData: Record<string, { shots: number; lootValue: number }> = {};
  let lastShotLoadoutId: string | undefined;
  
  const ensureLoadout = (loadoutId: string | undefined) => {
    const key = loadoutId ?? "__manual__";
    if (!loadoutData[key]) {
      loadoutData[key] = { shots: 0, lootValue: 0 };
    }
    return key;
  };
  
  // Track damage events for kill inference
  let damageEventsSinceLastLoot = 0;
  
  // Track combat time (first to last combat event)
  let firstCombatTime: number | null = null;
  let lastCombatTime: number | null = null;
  
  // Process all events
  for (const event of events) {
    const type = event.type;
    const eventTime = event.timestamp;
    
    // ==================== Combat - Check if ammo consuming ====================
    if (isAmmoConsumingEvent(type)) {
      combat.totalShots++;
      combat.ammoConsumed++;  // Track ammo
      ensureLoadout(event.loadoutId);
      loadoutData[ensureLoadout(event.loadoutId)].shots++;
      lastShotLoadoutId = event.loadoutId;
      damageEventsSinceLastLoot++;
      
      // Track combat time window
      if (firstCombatTime === null) firstCombatTime = eventTime;
      lastCombatTime = eventTime;
    }
    
    switch (type) {
      // ==================== Combat - Offensive ====================
      case "damage_dealt":
        combat.hits++;
        const dmg = event.amount ?? 0;
        combat.damageDealt += dmg;
        if (dmg > combat.maxDamageHit) {
          combat.maxDamageHit = dmg;  // Track max hit
        }
        if (event.critical) {
          combat.criticals++;
          combat.criticalDamage += dmg;
        }
        break;
        
      case "miss":
        combat.misses++;
        combat.targetMissed++;  // Simple miss (not dodge/evade)
        break;
        
      case "target_dodged":
        combat.targetDodged++;
        combat.misses++;
        break;
        
      case "target_evaded":
        combat.targetEvaded++;
        combat.misses++;
        break;
        
      case "target_resisted":
        combat.targetResisted++;
        break;
        
      case "out_of_range":
        combat.outOfRange++;
        combat.misses++;
        break;
      
      // ==================== Combat - Defensive ====================
      case "damage_taken":
        combat.damageTaken += event.amount ?? 0;
        combat.totalIncomingAttacks++;  // Track incoming attacks
        combat.armorHits++;  // Armor decays on actual hits
        if (event.critical) {
          combat.criticalDamageTaken += event.amount ?? 0;
        }
        break;
        
      case "damage_reduced":
        combat.damageReduced += event.amount ?? 0;
        break;
      
      case "deflect":
        combat.deflects++;
        combat.totalIncomingAttacks++;
        // NOTE: Deflects do NOT cause armor/plate decay - only damage_taken does
        // A deflect means armor blocked 100% of damage, no wear occurred
        break;
        
      case "player_dodged":
        combat.playerDodges++;
        combat.totalIncomingAttacks++;
        break;
        
      case "player_evaded":
        combat.playerEvades++;
        combat.totalIncomingAttacks++;
        break;
        
      case "enemy_missed":
        combat.enemyMisses++;
        combat.totalIncomingAttacks++;
        break;
      
      // ==================== Death ====================
      case "death":
        combat.deaths++;
        break;
      
      // ==================== Healing ====================
      case "self_heal":
        combat.selfHealing += event.amount ?? 0;
        break;
        
      case "healed_by":
        combat.healingReceived += event.amount ?? 0;
        break;
        
      case "heal_other":
        combat.healingGiven += event.amount ?? 0;
        break;
      
      // ==================== Loot ====================
      case "loot": {
        const itemName = event.itemName || "Unknown";
        const value = event.value ?? 0;
        const quantity = event.quantity ?? 1;

        // Skip Universal Ammo - it's a false positive (consumed ammo, not actual loot)
        if (itemName.toLowerCase().includes("universal ammo")) {
          ammoValue += value;  // Track for reference but don't count as loot
          break;
        }

        totalLootItems++;
        totalLootValue += value;

        // Track by item
        if (!lootByItem[itemName]) {
          lootByItem[itemName] = { itemName, count: 0, totalValue: 0, quantity: 0 };
        }
        lootByItem[itemName].count++;
        lootByItem[itemName].totalValue += value;
        lootByItem[itemName].quantity += quantity;

        // Special item tracking
        if (itemName.toLowerCase().includes("shrapnel")) {
          shrapnelValue += value;
        }

        // Attribute loot to last shot's loadout
        if (lastShotLoadoutId !== undefined || loadoutData["__manual__"]) {
          loadoutData[ensureLoadout(lastShotLoadoutId)].lootValue += value;
        }

        // Infer kill if we had damage events and now got loot
        if (damageEventsSinceLastLoot > 0) {
          combat.killsInferred++;
          combat.kills++;
          damageEventsSinceLastLoot = 0;
        }
        break;
      }
      
      case "mining_claim": {
        totalLootItems++;
        const claimValue = event.value ?? 0;
        totalLootValue += claimValue;
        break;
      }
      
      // ==================== Skills ====================
      case "skill_gain": {
        const skillName = event.skillName || "Unknown";
        const amount = event.amount ?? 0;
        const category = event.skillCategory || getSkillCategory(skillName);
        
        totalSkillGains += amount;
        totalSkillEvents++;
        skillByCategory[category] += amount;
        
        // Per-skill tracking
        if (!skillByName[skillName]) {
          skillByName[skillName] = {
            skillName,
            category,
            totalGain: 0,
            gainCount: 0,
            averageGain: 0,
            firstGain: event.timestamp,
            lastGain: event.timestamp,
          };
        }
        skillByName[skillName].totalGain += amount;
        skillByName[skillName].gainCount++;
        skillByName[skillName].lastGain = event.timestamp;
        skillByName[skillName].averageGain = 
          skillByName[skillName].totalGain / skillByName[skillName].gainCount;
        break;
      }
      
      case "attribute_gain": {
        const attrName = event.skillName || "Unknown";
        const amount = event.amount ?? 0;
        
        totalSkillGains += amount;
        totalSkillEvents++;
        skillByCategory.attributes += amount;
        
        if (!skillByName[attrName]) {
          skillByName[attrName] = {
            skillName: attrName,
            category: 'attributes',
            totalGain: 0,
            gainCount: 0,
            averageGain: 0,
            firstGain: event.timestamp,
            lastGain: event.timestamp,
          };
        }
        skillByName[attrName].totalGain += amount;
        skillByName[attrName].gainCount++;
        skillByName[attrName].lastGain = event.timestamp;
        skillByName[attrName].averageGain = 
          skillByName[attrName].totalGain / skillByName[attrName].gainCount;
        break;
      }
      
      case "skill_rank":
        skillRanks++;
        totalSkillEvents++;
        break;
        
      case "skill_acquired":
        newSkillsUnlocked++;
        totalSkillEvents++;
        break;
      
      // ==================== Globals ====================
      // Only count globals if they belong to the player (or if no player name is set, count all)
      case "global":
      case "global_mining":
      case "global_craft": {
        const isPlayerGlobal = !playerName || 
          (event.player && event.player.toLowerCase() === playerName.toLowerCase());
        if (isPlayerGlobal) {
          globalCount++;
        }
        break;
      }
        
      case "hof":
      case "hof_mining": {
        const isPlayerHof = !playerName || 
          (event.player && event.player.toLowerCase() === playerName.toLowerCase());
        if (isPlayerHof) {
          hofs++;
          globalCount++;
        }
        break;
      }
    }
  }
  
  // Calculate derived combat stats
  if (combat.hits > 0) {
    combat.averageDamagePerHit = combat.damageDealt / combat.hits;
  }
  
  // Calculate combat DPS using actual combat time window (first shot to last shot)
  // This excludes idle time and gives a more accurate damage rate
  if (firstCombatTime !== null && lastCombatTime !== null) {
    const combatDuration = (lastCombatTime - firstCombatTime) / 1000; // Convert to seconds
    // Use at least 1 second to avoid division by zero for single shots
    combat.dps = combatDuration > 0 ? combat.damageDealt / combatDuration : combat.damageDealt;
  }
  
  // Calculate total healing
  const totalHealed = combat.selfHealing + combat.healingReceived;
  
  // Calculate spend with per-loadout costs
  let totalSpend = 0;
  const loadoutBreakdown: LoadoutBreakdown[] = [];
  
  for (const [key, data] of Object.entries(loadoutData)) {
    let costPerShot: number;
    let loadoutName: string;
    let loadoutId: string | null;
    
    if (key === "__manual__") {
      costPerShot = session.manualCostPerShot;
      loadoutName = "Manual";
      loadoutId = null;
    } else {
      const snapshot = session.loadoutSnapshots[key];
      costPerShot = snapshot?.costPerShot ?? session.manualCostPerShot;
      loadoutName = snapshot?.name ?? "Unknown";
      loadoutId = key;
    }
    
    const spend = data.shots * costPerShot;
    totalSpend += spend;
    
    loadoutBreakdown.push({
      loadoutId,
      loadoutName,
      costPerShot,
      shots: data.shots,
      spend,
      lootValue: data.lootValue,
      profit: data.lootValue - spend,
    });
  }
  
  const profit = totalLootValue - totalSpend;
  const returnRate = totalSpend > 0 ? (totalLootValue / totalSpend) * 100 : 0;
  
  // ==================== Decay Calculation ====================
  // Two types of decay:
  // 1. Per-shot decay: weapon, amp, scope, sight
  // 2. Per-hit decay: armor set (1 piece), armor plate (1 plate)
  //
  // Repair Bill = UL items only (L items lose TT, can't be repaired)
  // Total Decay = ALL items (UL + L)
  
  // --- OFFENSIVE DECAY (per shot) ---
  let totalOffensiveDecayPerShot = 0;  // All items
  let ulOffensiveDecayPerShot = 0;     // UL items only (for repair bill)
  
  if (activeLoadout) {
    // Weapon
    if (activeLoadout.weapon?.economy.decay) {
      const decay = activeLoadout.weapon.economy.decay;
      totalOffensiveDecayPerShot += decay;
      if (!isLimitedItem(activeLoadout.weapon.name)) {
        ulOffensiveDecayPerShot += decay;
      }
    }
    // Amp
    if (activeLoadout.amp?.economy.decay) {
      const decay = activeLoadout.amp.economy.decay;
      totalOffensiveDecayPerShot += decay;
      if (!isLimitedItem(activeLoadout.amp.name)) {
        ulOffensiveDecayPerShot += decay;
      }
    }
    // Scope
    if (activeLoadout.scope?.economy.decay) {
      const decay = activeLoadout.scope.economy.decay;
      totalOffensiveDecayPerShot += decay;
      if (!isLimitedItem(activeLoadout.scope.name)) {
        ulOffensiveDecayPerShot += decay;
      }
    }
    // Sight
    if (activeLoadout.sight?.economy.decay) {
      const decay = activeLoadout.sight.economy.decay;
      totalOffensiveDecayPerShot += decay;
      if (!isLimitedItem(activeLoadout.sight.name)) {
        ulOffensiveDecayPerShot += decay;
      }
    }
  }
  
  // Calculate total offensive decay
  const DEFAULT_WEAPON_DECAY_RATE = 0.003; // 0.3 PEC fallback if no loadout
  const effectiveOffensiveRate = totalOffensiveDecayPerShot > 0 ? totalOffensiveDecayPerShot : DEFAULT_WEAPON_DECAY_RATE;
  const totalOffensiveDecay = combat.totalShots * effectiveOffensiveRate;
  const ulOffensiveDecay = combat.totalShots * ulOffensiveDecayPerShot;
  
  // --- DEFENSIVE DECAY (per hit/deflect) ---
  // armorHits = damage_taken + deflects (dodges/evades/misses don't decay armor)
  
  // Armor set: 1 piece decays per hit
  const armorSetDecayPerHit = activeLoadout?.armor 
    ? calculateArmorDecayPerHit(activeLoadout.armor) 
    : 0;
  const isArmorLimited = activeLoadout?.armor?.isLimited ?? false;
  
  // Armor plates: 1 plate decays per hit (average across equipped plates)
  const plateDecayPerHit = activeLoadout?.armorPlates?.length 
    ? calculateSinglePlateDecayPerHit(activeLoadout.armorPlates) 
    : 0;
  
  // Total defensive decay per hit (armor set + 1 plate)
  const totalDefensiveDecayPerHit = armorSetDecayPerHit + plateDecayPerHit;
  const totalDefensiveDecay = combat.armorHits * totalDefensiveDecayPerHit;
  
  // UL defensive decay per hit (non-L armor + plates, plates are always UL)
  const ulDefensiveDecayPerHit = (isArmorLimited ? 0 : armorSetDecayPerHit) + plateDecayPerHit;
  const ulDefensiveDecay = combat.armorHits * ulDefensiveDecayPerHit;
  
  // --- TOTALS ---
  // Total decay: all items (UL + L) - shows total TT lost
  const decay = totalOffensiveDecay + totalDefensiveDecay;
  
  // Repair bill: UL items only - what you'll pay at repair terminal
  // NOTE: Currently disabled in UI - decay calculation needs work
  const repairBill = ulOffensiveDecay + ulDefensiveDecay;
  
  // Build skill breakdown
  const skills: SkillBreakdown = {
    totalSkillGains,
    totalSkillEvents,
    skillRanks,
    newSkillsUnlocked,
    bySkill: skillByName,
    byCategory: skillByCategory,
  };
  
  // Calculate skill efficiency
  const hoursPlayed = duration / 3600;
  const skillEfficiency: SkillEfficiency = {
    skillPerPedSpent: totalSpend > 0 ? totalSkillGains / totalSpend : 0,
    skillPerShot: combat.totalShots > 0 ? totalSkillGains / combat.totalShots : 0,
    skillPerHour: hoursPlayed > 0 ? totalSkillGains / hoursPlayed : 0,
    skillPerKill: combat.kills > 0 ? totalSkillGains / combat.kills : 0,
    skillPerLoot: totalLootValue > 0 ? totalSkillGains / totalLootValue : 0,
    skillToLootRatio: totalLootValue > 0 ? totalSkillGains / totalLootValue : 0,
    avgSkillPerEvent: totalSkillEvents > 0 ? totalSkillGains / totalSkillEvents : 0,
  };
  
  // Build loot breakdown
  const loot: LootBreakdown = {
    totalValue: totalLootValue,
    totalItems: totalLootItems,
    uniqueItems: Object.keys(lootByItem).length,
    byItem: lootByItem,
    shrapnelValue,
    ammoValue,
  };
  
  return {
    // Time
    duration,
    
    // Combat summary (backwards compatible)
    shots: combat.totalShots,
    hits: combat.hits,
    misses: combat.misses,
    kills: combat.kills,
    criticals: combat.criticals,
    damageDealt: combat.damageDealt,
    damageTaken: combat.damageTaken,
    dodges: combat.playerDodges,
    evades: combat.playerEvades,
    deflects: combat.deflects,
    healed: totalHealed,
    deaths: combat.deaths,
    
    // Economy
    lootCount: totalLootItems,
    lootValue: totalLootValue,
    totalSpend,
    profit,
    netProfit: profit - decay,  // True profit after ALL decay (UL repair + L TT loss)
    returnRate,
    decay,
    repairBill,
    
    // Skills (backwards compatible - total points)
    skillGains: totalSkillGains,
    globalCount,
    hofs,
    
    // Detailed breakdowns
    combat,
    skills,
    skillEfficiency,
    loot,
    
    // Per-loadout
    loadoutBreakdown,
  };
}

// ==================== Serialization ====================

/**
 * Serialize session for storage (JSON-compatible)
 */
export function serializeSession(session: Session): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Deserialize session from storage
 */
export function deserializeSession(json: string): Session {
  return JSON.parse(json) as Session;
}

// ==================== Skill Analysis Helpers ====================

/**
 * Get top skills by total gain
 */
export function getTopSkills(stats: SessionStats, limit: number = 10): SkillStats[] {
  return Object.values(stats.skills.bySkill)
    .sort((a, b) => b.totalGain - a.totalGain)
    .slice(0, limit);
}

/**
 * Get skills grouped by category
 */
export function getSkillsByCategory(stats: SessionStats): Record<SkillCategory, SkillStats[]> {
  const grouped: Record<SkillCategory, SkillStats[]> = {
    combat: [],
    attributes: [],
    profession: [],
    support: [],
    other: [],
  };
  
  for (const skill of Object.values(stats.skills.bySkill)) {
    grouped[skill.category].push(skill);
  }
  
  // Sort each category by total gain
  for (const category of Object.keys(grouped) as SkillCategory[]) {
    grouped[category].sort((a, b) => b.totalGain - a.totalGain);
  }
  
  return grouped;
}

/**
 * Calculate skill gain rate over time periods
 */
export function getSkillGainRate(stats: SessionStats, periodMinutes: number = 60): number {
  if (stats.duration === 0) return 0;
  const periods = stats.duration / (periodMinutes * 60);
  return stats.skills.totalSkillGains / periods;
}
