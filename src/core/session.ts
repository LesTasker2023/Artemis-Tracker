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
import { Loadout, getEffectiveCostPerShot } from "./loadout";
import { 
  SkillBreakdown, 
  SkillStats, 
  SkillCategory, 
  SkillEfficiency,
  LootBreakdown,
  CombatBreakdown,
  getSkillCategory 
} from "./types";
import type { MarkupLibrary } from "./markup";
import { calculateLootMarkup } from "./markup";

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
 * Running stats - incrementally updated on each event for O(1) performance
 * These are stored on the session to avoid recalculating from all events
 */
export interface RunningStats {
  // Combat - Offensive
  shots: number;
  hits: number;
  misses: number;           // Simple misses
  criticals: number;
  damageDealt: number;
  criticalDamage: number;
  maxDamageHit: number;
  targetDodged: number;     // Target dodged your attack
  targetEvaded: number;     // Target evaded your attack
  targetResisted: number;   // Target resisted all damage
  outOfRange: number;       // Shot was out of range
  // Combat - Defensive
  damageTaken: number;
  criticalDamageTaken: number;
  damageReduced: number;    // Armor damage reduction amount
  playerDodges: number;
  playerEvades: number;
  deflects: number;
  enemyMisses: number;      // Enemy attack missed you
  // Healing
  selfHealing: number;
  healCount: number;
  healedByOthers: number;
  healingGiven: number;
  // Loot
  lootValue: number;
  lootCount: number;
  // Kills (inferred from loot)
  kills: number;
  deaths: number;
  // Skills
  skillGains: number;
  skillEvents: number;
  skillRanks: number;       // New ranks achieved
  newSkillsUnlocked: number;
  // Globals
  globalCount: number;
  hofs: number;
  // Equipment
  tierUps: number;
  enhancerBreaks: number;
  enhancerShrapnel: number; // PED value from enhancer breaks
  // Mining
  miningClaims: number;
  miningClaimValue: number;
  miningNoFinds: number;
  resourceDepleted: number;
  // Effects
  buffsReceived: number;
  debuffsReceived: number;
  // Death/Revival
  revives: number;
  divineInterventions: number;
  // Per-loadout shots and loot
  loadoutShots: Record<string, number>;
  loadoutLoot: Record<string, number>;
  // Timestamps for duration calc
  firstEventTime: number | null;
  lastEventTime: number | null;
  // Track damage since last loot (for kill inference)
  damageEventsSinceLastLoot: number;
}

/**
 * Create empty running stats
 */
export function createRunningStats(): RunningStats {
  return {
    // Combat - Offensive
    shots: 0,
    hits: 0,
    misses: 0,
    criticals: 0,
    damageDealt: 0,
    criticalDamage: 0,
    maxDamageHit: 0,
    targetDodged: 0,
    targetEvaded: 0,
    targetResisted: 0,
    outOfRange: 0,
    // Combat - Defensive
    damageTaken: 0,
    criticalDamageTaken: 0,
    damageReduced: 0,
    playerDodges: 0,
    playerEvades: 0,
    deflects: 0,
    enemyMisses: 0,
    // Healing
    selfHealing: 0,
    healCount: 0,
    healedByOthers: 0,
    healingGiven: 0,
    // Loot
    lootValue: 0,
    lootCount: 0,
    // Kills
    kills: 0,
    deaths: 0,
    // Skills
    skillGains: 0,
    skillEvents: 0,
    skillRanks: 0,
    newSkillsUnlocked: 0,
    // Globals
    globalCount: 0,
    hofs: 0,
    // Equipment
    tierUps: 0,
    enhancerBreaks: 0,
    enhancerShrapnel: 0,
    // Mining
    miningClaims: 0,
    miningClaimValue: 0,
    miningNoFinds: 0,
    resourceDepleted: 0,
    // Effects
    buffsReceived: 0,
    debuffsReceived: 0,
    // Death/Revival
    revives: 0,
    divineInterventions: 0,
    // Per-loadout
    loadoutShots: {},
    loadoutLoot: {},
    // Timestamps
    firstEventTime: null,
    lastEventTime: null,
    damageEventsSinceLastLoot: 0,
  };
}

/**
 * A hunting session with all events and loadout tracking
 */
export interface Session {
  id: string;
  name: string;
  tags: string[];
  startedAt: string;
  endedAt?: string;
  events: SessionEvent[];
  loadoutSnapshots: Record<string, LoadoutSnapshot>;
  manualCostPerShot: number;
  // Manual expense tracking
  manualArmorCost?: number;
  manualFapCost?: number;
  manualMiscCost?: number;
  // Pause tracking
  pausedAt?: string;
  totalPausedTime?: number; // milliseconds spent paused
  // Performance: Running stats updated incrementally (O(1) per event)
  runningStats?: RunningStats;
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
  
  // Economy (TT values - base)
  lootCount: number;
  lootValue: number;        // Total loot in TT value
  totalSpend: number;       // Ammo burn + weapon/amp/scope/sight decay + enhancer costs
  weaponCost: number;       // Same as totalSpend (ammo + weapon decay + enhancers)
  armorCost: number;        // Armor decay cost (manual)
  fapCost: number;          // FAP decay cost (manual)
  miscCost: number;         // Miscellaneous costs (manual)
  totalCost: number;        // weaponCost + armorCost + fapCost + miscCost
  profit: number;           // lootValue - totalCost (profit after all costs)
  netProfit: number;        // lootValue - totalSpend - armor decay (net profit after all costs)
  returnRate: number;       // lootValue / totalCost as percentage
  decay: number;            // Total defensive decay (armor + FAP)
  armorDecay: number;       // Armor decay only (from hits)
  fapDecay: number;         // FAP decay only (from heals)
  repairBill: number;       // Repair cost for UL items only (L items = TT loss, not repair)
  
  // Markup-adjusted economy (NEW)
  markupValue: number;      // Total markup value (value above TT)
  lootValueWithMarkup: number;  // lootValue + markupValue
  profitWithMarkup: number;     // profit adjusted for markup
  netProfitWithMarkup: number;  // netProfit adjusted for markup
  returnRateWithMarkup: number; // Return rate using markup-adjusted loot value
  markupEnabled: boolean;   // Whether markup calculations were applied
  
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
export function createSession(name?: string, tags?: string[]): Session {
  const now = new Date();
  return {
    id: `session-${now.getTime()}`,
    name: name || `Hunt ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    tags: tags || [],
    startedAt: now.toISOString(),
    events: [],
    loadoutSnapshots: {},
    manualCostPerShot: 0.05, // Default fallback
    runningStats: createRunningStats(), // Initialize incremental stats
  };
}

/**
 * Rebuild running stats from all events in a session
 * Use this when loading a legacy session without runningStats
 * @param session Session to rebuild stats for
 * @param playerName Optional player name for global filtering
 * @returns Session with rebuilt runningStats
 */
export function rebuildRunningStats(session: Session, playerName?: string): Session {
  const stats = createRunningStats();
  
  for (const event of session.events) {
    const timestamp = new Date(event.timestamp).getTime();
    const loadoutKey = event.loadoutId ?? "__manual__";
    
    // Track first/last event times
    if (stats.firstEventTime === null || timestamp < stats.firstEventTime) {
      stats.firstEventTime = timestamp;
    }
    if (stats.lastEventTime === null || timestamp > stats.lastEventTime) {
      stats.lastEventTime = timestamp;
    }
    
    // Track ammo consuming events
    if (isAmmoConsumingEvent(event.type)) {
      stats.shots++;
      stats.loadoutShots[loadoutKey] = (stats.loadoutShots[loadoutKey] || 0) + 1;
      stats.damageEventsSinceLastLoot++;
    }
    
    switch (event.type) {
      // ==================== Combat - Offensive ====================
      case "damage_dealt":
      case "hit":
        stats.hits++;
        stats.damageDealt += event.amount ?? 0;
        if (event.amount && event.amount > stats.maxDamageHit) {
          stats.maxDamageHit = event.amount;
        }
        if (event.critical) {
          stats.criticals++;
          stats.criticalDamage += event.amount ?? 0;
        }
        break;
        
      case "miss":
        stats.misses++;
        break;
        
      case "target_dodged":
        stats.targetDodged++;
        stats.misses++;
        break;
        
      case "target_evaded":
        stats.targetEvaded++;
        stats.misses++;
        break;
        
      case "target_resisted":
        stats.targetResisted++;
        stats.misses++;
        break;
        
      case "out_of_range":
        stats.outOfRange++;
        stats.misses++;
        break;
        
      // ==================== Combat - Defensive ====================
      case "damage_taken":
        stats.damageTaken += event.amount ?? 0;
        if (event.critical) {
          stats.criticalDamageTaken += event.amount ?? 0;
        }
        break;
        
      case "damage_reduced":
        stats.damageReduced += event.amount ?? 0;
        break;
        
      case "player_dodged":
        stats.playerDodges++;
        break;
        
      case "player_evaded":
      case "player_evade":
        stats.playerEvades++;
        break;
        
      case "deflect":
        stats.deflects++;
        break;
        
      case "enemy_missed":
        stats.enemyMisses++;
        break;
        
      // ==================== Healing ====================
      case "self_heal":
        stats.selfHealing += event.amount ?? 0;
        stats.healCount++;
        break;
        
      case "healed_by":
        stats.healedByOthers += event.amount ?? 0;
        break;
        
      case "heal_other":
        stats.healingGiven += event.amount ?? 0;
        break;
        
      // ==================== Loot ====================
      case "loot": {
        const itemName = event.itemName || "";
        if (!itemName.toLowerCase().includes("universal ammo") && 
            !itemName.toLowerCase().includes("nanocube")) {
          stats.lootValue += event.value ?? 0;
          stats.lootCount++;
          stats.loadoutLoot[loadoutKey] = (stats.loadoutLoot[loadoutKey] || 0) + (event.value ?? 0);
          if (stats.damageEventsSinceLastLoot > 0) {
            stats.kills++;
            stats.damageEventsSinceLastLoot = 0;
          }
        }
        break;
      }
      
      // ==================== Mining ====================
      case "mining_claim":
        stats.miningClaims++;
        stats.miningClaimValue += event.value ?? 0;
        break;
        
      case "no_find":
        stats.miningNoFinds++;
        break;
        
      case "resource_depleted":
        stats.resourceDepleted++;
        break;
        
      // ==================== Skills ====================
      case "skill_gain":
      case "attribute_gain":
        stats.skillGains += event.amount ?? 0;
        stats.skillEvents++;
        break;
        
      case "skill_rank":
        stats.skillRanks++;
        break;
        
      case "skill_acquired":
        stats.newSkillsUnlocked++;
        break;
        
      // ==================== Equipment ====================
      case "tier_up":
        stats.tierUps++;
        break;
        
      case "enhancer_broke":
        stats.enhancerBreaks++;
        break;
        
      // ==================== Effects ====================
      case "buff":
        stats.buffsReceived++;
        break;
        
      case "debuff":
        stats.debuffsReceived++;
        break;
        
      // ==================== Death/Revival ====================
      case "death":
        stats.deaths++;
        break;
        
      case "revived":
        stats.revives++;
        break;
        
      case "divine_intervention":
        stats.divineInterventions++;
        break;
        
      // ==================== Globals ====================
      case "global":
      case "global_mining":
      case "global_craft":
        if (!playerName || (event.player && event.player === playerName)) {
          stats.globalCount++;
        }
        break;
        
      case "hof":
      case "hof_mining":
        if (!playerName || (event.player && event.player === playerName)) {
          stats.hofs++;
          stats.globalCount++;
        }
        break;
    }
  }
  
  return {
    ...session,
    runningStats: stats,
  };
}

/**
 * Add an event to a session with loadout tagging
 * Also incrementally updates running stats for O(1) performance
 * @param session The session to add to
 * @param event The log event
 * @param activeLoadout Currently active loadout (if any)
 * @param playerName Optional player name for global filtering
 * @returns Updated session (immutable)
 */
export function addEventToSession(
  session: Session,
  event: ParsedEvent,
  activeLoadout: Loadout | null,
  playerName?: string
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
  
  // Incrementally update running stats (O(1) per event)
  const stats = session.runningStats ? { ...session.runningStats } : createRunningStats();
  const loadoutKey = loadoutId ?? "__manual__";
  
  // Update timestamps
  if (stats.firstEventTime === null) stats.firstEventTime = event.timestamp;
  stats.lastEventTime = event.timestamp;
  
  // Process event type
  const type = event.type;
  
  // Combat - ammo consuming events
  if (isAmmoConsumingEvent(type)) {
    stats.shots++;
    stats.loadoutShots[loadoutKey] = (stats.loadoutShots[loadoutKey] || 0) + 1;
    stats.damageEventsSinceLastLoot++;
  }
  
  switch (type) {
    // ==================== Combat - Offensive ====================
    // Hits
    case "damage_dealt":
    case "hit":
    case "critical":
      stats.hits++;
      const dmg = event.amount ?? 0;
      stats.damageDealt += dmg;
      if (dmg > stats.maxDamageHit) stats.maxDamageHit = dmg;
      if (event.critical || type === "critical") {
        stats.criticals++;
        stats.criticalDamage += dmg;
      }
      break;
      
    // Misses (simple)
    case "miss":
      stats.misses++;
      break;
      
    // Target dodged your attack
    case "target_dodged":
    case "target_dodge":
      stats.targetDodged++;
      stats.misses++;
      break;
      
    // Target evaded your attack  
    case "target_evaded":
    case "target_evade":
      stats.targetEvaded++;
      stats.misses++;
      break;
      
    // Target resisted all damage
    case "target_resisted":
      stats.targetResisted++;
      stats.misses++;
      break;
      
    // Out of range
    case "out_of_range":
      stats.outOfRange++;
      stats.misses++;
      break;
      
    // ==================== Combat - Defensive ====================
    // Damage taken
    case "damage_taken":
      const dmgTaken = event.amount ?? 0;
      stats.damageTaken += dmgTaken;
      if (event.critical) {
        stats.criticalDamageTaken += dmgTaken;
      }
      break;
      
    // Damage reduced by armor
    case "damage_reduced":
      stats.damageReduced += event.amount ?? 0;
      break;
      
    // Player dodged
    case "player_dodged":
    case "player_dodge":
      stats.playerDodges++;
      break;
      
    // Player evaded
    case "player_evaded":
    case "player_evade":
      stats.playerEvades++;
      break;
      
    // Deflect
    case "deflect":
      stats.deflects++;
      break;
      
    // Enemy missed
    case "enemy_missed":
      stats.enemyMisses++;
      break;
      
    // ==================== Healing ====================
    case "self_heal":
    case "heal":
      stats.selfHealing += event.amount ?? 0;
      stats.healCount++;
      break;
      
    case "healed_by":
      stats.healedByOthers += event.amount ?? 0;
      break;
      
    case "heal_other":
      stats.healingGiven += event.amount ?? 0;
      break;
      
    // ==================== Loot ====================
    case "loot": {
      const itemName = event.itemName || "";
      // Skip universal ammo and nanocubes (false positives)
      if (!itemName.toLowerCase().includes("universal ammo") && 
          !itemName.toLowerCase().includes("nanocube")) {
        stats.lootValue += event.value ?? 0;
        stats.lootCount++;
        stats.loadoutLoot[loadoutKey] = (stats.loadoutLoot[loadoutKey] || 0) + (event.value ?? 0);
        // Infer kill if we had damage events
        if (stats.damageEventsSinceLastLoot > 0) {
          stats.kills++;
          stats.damageEventsSinceLastLoot = 0;
        }
      }
      break;
    }
    
    // ==================== Mining ====================
    case "mining_claim":
      stats.miningClaims++;
      stats.miningClaimValue += event.value ?? 0;
      break;
      
    case "no_find":
      stats.miningNoFinds++;
      break;
      
    case "resource_depleted":
      stats.resourceDepleted++;
      break;
      
    // ==================== Skills ====================
    case "skill_gain":
    case "attribute_gain":
      stats.skillGains += event.amount ?? 0;
      stats.skillEvents++;
      break;
      
    case "skill_rank":
      stats.skillRanks++;
      break;
      
    case "skill_acquired":
      stats.newSkillsUnlocked++;
      break;
      
    // ==================== Equipment ====================
    case "tier_up":
      stats.tierUps++;
      break;
      
    case "enhancer_broke":
      stats.enhancerBreaks++;
      // Shrapnel value would need to be extracted from event data
      // The event should have a shrapnel field if parsed correctly
      break;
      
    // ==================== Effects ====================
    case "buff":
      stats.buffsReceived++;
      break;
      
    case "debuff":
      stats.debuffsReceived++;
      break;
      
    // ==================== Death/Revival ====================
    case "death":
      stats.deaths++;
      break;
      
    case "revived":
      stats.revives++;
      break;
      
    case "divine_intervention":
      stats.divineInterventions++;
      break;
      
    // ==================== Globals ====================
    case "global":
    case "global_mining":
    case "global_craft":
      // Only count if player name matches (or no filter)
      if (!playerName || (event.player && event.player.toLowerCase() === playerName.toLowerCase())) {
        stats.globalCount++;
      }
      break;
      
    // HOFs
    case "hof":
    case "hof_mining":
      if (!playerName || (event.player && event.player.toLowerCase() === playerName.toLowerCase())) {
        stats.hofs++;
        stats.globalCount++;
      }
      break;
  }
  
  return {
    ...session,
    events: [...session.events, sessionEvent],
    loadoutSnapshots,
    runningStats: stats,
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

/**
 * Quick stats from running stats - O(1) operation
 * Use this for real-time display instead of full calculateSessionStats
 * Returns null if running stats not available (legacy session)
 */
export interface QuickStats {
  duration: number;
  // Combat - Offensive
  shots: number;
  hits: number;
  misses: number;
  criticals: number;
  damageDealt: number;
  targetDodged: number;
  targetEvaded: number;
  targetResisted: number;
  outOfRange: number;
  // Combat - Defensive
  damageTaken: number;
  criticalDamageTaken: number;
  damageReduced: number;
  playerDodges: number;
  playerEvades: number;
  deflects: number;
  enemyMisses: number;
  // Healing
  selfHealing: number;
  healCount: number;
  healedByOthers: number;
  healingGiven: number;
  // Loot
  lootValue: number;
  lootCount: number;
  kills: number;
  deaths: number;
  // Skills
  skillGains: number;
  skillRanks: number;
  newSkillsUnlocked: number;
  // Globals
  globalCount: number;
  hofs: number;
  // Equipment
  tierUps: number;
  enhancerBreaks: number;
  // Mining
  miningClaims: number;
  miningClaimValue: number;
  miningNoFinds: number;
  // Effects
  buffsReceived: number;
  debuffsReceived: number;
  // Death/Revival
  revives: number;
  divineInterventions: number;
  // Calculated rates
  hitRate: number;
  critRate: number;
}

export function getQuickStats(session: Session): QuickStats | null {
  const stats = session.runningStats;
  if (!stats) return null; // Legacy session without running stats
  
  // Calculate duration
  const startTime = new Date(session.startedAt).getTime();
  const endTime = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  const totalPausedMs = session.totalPausedTime || 0;
  const currentPauseDuration = session.pausedAt 
    ? Date.now() - new Date(session.pausedAt).getTime() 
    : 0;
  const duration = Math.floor((endTime - startTime - totalPausedMs - currentPauseDuration) / 1000);
  
  // Calculate rates
  const hitRate = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
  const critRate = stats.hits > 0 ? (stats.criticals / stats.hits) * 100 : 0;
  
  return {
    duration,
    // Combat - Offensive
    shots: stats.shots,
    hits: stats.hits,
    misses: stats.misses,
    criticals: stats.criticals,
    damageDealt: stats.damageDealt,
    targetDodged: stats.targetDodged,
    targetEvaded: stats.targetEvaded,
    targetResisted: stats.targetResisted,
    outOfRange: stats.outOfRange,
    // Combat - Defensive
    damageTaken: stats.damageTaken,
    criticalDamageTaken: stats.criticalDamageTaken,
    damageReduced: stats.damageReduced,
    playerDodges: stats.playerDodges,
    playerEvades: stats.playerEvades,
    deflects: stats.deflects,
    enemyMisses: stats.enemyMisses,
    // Healing
    selfHealing: stats.selfHealing,
    healCount: stats.healCount,
    healedByOthers: stats.healedByOthers,
    healingGiven: stats.healingGiven,
    // Loot
    lootValue: stats.lootValue,
    lootCount: stats.lootCount,
    kills: stats.kills,
    deaths: stats.deaths,
    // Skills
    skillGains: stats.skillGains,
    skillRanks: stats.skillRanks,
    newSkillsUnlocked: stats.newSkillsUnlocked,
    // Globals
    globalCount: stats.globalCount,
    hofs: stats.hofs,
    // Equipment
    tierUps: stats.tierUps,
    enhancerBreaks: stats.enhancerBreaks,
    // Mining
    miningClaims: stats.miningClaims,
    miningClaimValue: stats.miningClaimValue,
    miningNoFinds: stats.miningNoFinds,
    // Effects
    buffsReceived: stats.buffsReceived,
    debuffsReceived: stats.debuffsReceived,
    // Death/Revival
    revives: stats.revives,
    divineInterventions: stats.divineInterventions,
    // Rates
    hitRate,
    critRate,
  };
}

// ==================== Statistics Calculation ====================

/**
 * Calculate comprehensive session statistics
 * @param session The session to calculate stats for
 * @param playerName Optional player name to filter globals (only count player's own globals)
 * @param activeLoadout Optional loadout for accurate armor decay calculation
 * @param markupLibrary Optional markup library for calculating markup-adjusted values
 * @param defaultMarkupPercent Default markup to apply if item not in library (default 100 = no markup)
 */
export function calculateSessionStats(
  session: Session, 
  playerName?: string, 
  activeLoadout?: Loadout | null,
  markupLibrary?: MarkupLibrary | null,
  defaultMarkupPercent: number = 100
): SessionStats {
  const events = session.events;
  
  // Time - subtract any paused time from duration
  const startTime = new Date(session.startedAt).getTime();
  const endTime = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  const totalPausedMs = session.totalPausedTime || 0;
  // If currently paused, add the current pause duration
  const currentPauseDuration = session.pausedAt 
    ? Date.now() - new Date(session.pausedAt).getTime() 
    : 0;
  const duration = Math.floor((endTime - startTime - totalPausedMs - currentPauseDuration) / 1000);
  
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
    healCount: 0,
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
        combat.armorHits++;  // Deflects also cause armor/plate decay - armor absorbed the hit
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
        combat.healCount++;  // Track heal actions for FAP decay
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

        // Skip Universal Ammo and Nanocubes - false positives (consumed items, not actual loot)
        if (
          itemName.toLowerCase().includes("universal ammo") ||
          itemName.toLowerCase().includes("nanocube")
        ) {
          ammoValue += value; // Track for reference but don't count as loot
          break;
        }

        // Skip ignored items - user has marked them to be excluded from tracking
        if (markupLibrary?.items[itemName]?.ignored) {
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
  
  // ==================== Decay Calculation ====================
  // NOTE: Weapon/amp/scope/sight decay is now included in totalSpend (via costPerShot)
  // The "decay" stat now ONLY tracks armor decay (per-hit), not weapon decay (per-shot)
  //
  // Armor decay types:
  // 1. Per-hit decay: armor set (1 piece), armor plate (1 plate)
  // 2. Per-heal decay: FAP decay per heal action
  //
  // Repair Bill = UL armor only (L items lose TT, can't be repaired)
  // Decay stat = Armor decay + FAP decay (weapon decay is in totalSpend)
  
  // --- DEFENSIVE DECAY (per hit/deflect) ---
  // armorHits = damage_taken + deflects (dodges/evades/misses don't decay armor)
  
  // Use manual decayPerHit if set, otherwise use calculated values (for backwards compatibility)
  const manualDecayPerHit = activeLoadout?.decayPerHit ?? 0;
  const manualDecayPerHeal = activeLoadout?.decayPerHeal ?? 0;
  
  // Armor decay from hits (manual input in PEC, convert to PED)
  const hitDecay = combat.armorHits * (manualDecayPerHit / 100);
  
  // FAP decay from heals (manual input in PEC, convert to PED)
  const healDecay = combat.healCount * (manualDecayPerHeal / 100);
  
  // Total defensive decay
  const totalDefensiveDecay = hitDecay + healDecay;
  
  // --- TOTALS ---
  // Decay stat: ARMOR + FAP decay (weapon decay is in totalSpend)
  const decay = totalDefensiveDecay;

  // Repair bill: same as decay for now (all UL items)
  const repairBill = totalDefensiveDecay;
  
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
  
  // ==================== Markup Calculation ====================
  // Calculate markup-adjusted values if markup library is provided
  let markupValue = 0;
  let lootValueWithMarkup = totalLootValue;
  const markupEnabled = markupLibrary !== null && markupLibrary !== undefined;
  
  if (markupEnabled && markupLibrary) {
    // Convert loot items to format expected by calculateLootMarkup
    const lootItemsForMarkup = Object.values(lootByItem).map(item => ({
      itemName: item.itemName,
      value: item.totalValue,
    }));
    
    const markupResult = calculateLootMarkup(lootItemsForMarkup, markupLibrary, defaultMarkupPercent);
    markupValue = markupResult.totalMarkup;
    lootValueWithMarkup = markupResult.totalWithMarkup;
  }
  
  // Markup-adjusted profit calculations
  const manualCosts = (session.manualArmorCost ?? 0) + (session.manualFapCost ?? 0) + (session.manualMiscCost ?? 0);
  const totalCostWithManual = totalSpend + manualCosts;
  const profitWithMarkup = lootValueWithMarkup - totalCostWithManual;
  const netProfitWithMarkup = profitWithMarkup - decay;
  const returnRateWithMarkup = totalCostWithManual > 0 ? (lootValueWithMarkup / totalCostWithManual) * 100 : 0;
  
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
    
    // Economy (TT values)
    lootCount: totalLootItems,
    lootValue: totalLootValue,
    totalSpend,
    weaponCost: totalSpend,
    armorCost: session.manualArmorCost ?? 0,
    fapCost: session.manualFapCost ?? 0,
    miscCost: session.manualMiscCost ?? 0,
    totalCost: totalSpend + (session.manualArmorCost ?? 0) + (session.manualFapCost ?? 0) + (session.manualMiscCost ?? 0),
    profit: totalLootValue - (totalSpend + (session.manualArmorCost ?? 0) + (session.manualFapCost ?? 0) + (session.manualMiscCost ?? 0)),
    netProfit: totalLootValue - (totalSpend + (session.manualArmorCost ?? 0) + (session.manualFapCost ?? 0) + (session.manualMiscCost ?? 0)) - decay,  // True profit after ALL decay (UL repair + L TT loss)
    returnRate: (totalSpend + (session.manualArmorCost ?? 0) + (session.manualFapCost ?? 0) + (session.manualMiscCost ?? 0)) > 0 
      ? (totalLootValue / (totalSpend + (session.manualArmorCost ?? 0) + (session.manualFapCost ?? 0) + (session.manualMiscCost ?? 0))) * 100 
      : 0,
    decay,
    armorDecay: hitDecay,
    fapDecay: healDecay,
    repairBill,
    
    // Markup-adjusted economy
    markupValue,
    lootValueWithMarkup,
    profitWithMarkup,
    netProfitWithMarkup,
    returnRateWithMarkup,
    markupEnabled,
    
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
