/**
 * ARTEMIS v3 - Event Parser Types
 * Internal event format for session tracking
 * Converts LogEvents from main process to ParsedEvents for session
 */

import { getSkillCategory, SkillCategory } from './types';

/**
 * Parsed event - internal format for session tracking
 * Different from LogEvent which comes from the main process
 */
export interface ParsedEvent {
  timestamp: number;
  raw: string;
  type: string;
  amount?: number;
  value?: number;
  critical?: boolean;
  
  // Skill-specific fields
  skillName?: string;
  skillCategory?: SkillCategory;
  
  // Loot-specific fields
  itemName?: string;
  quantity?: number;
  
  // Combat-specific fields
  creature?: string;
  damageType?: string;  // 'critical' | 'armor_piercing' | 'normal'
  
  // Global-specific fields
  player?: string;      // Player name for global events
}

/**
 * Convert LogEvent (from main process) to ParsedEvent (for session)
 */
export function logEventToParsedEvent(logEvent: {
  timestamp: number;
  raw: string;
  type: string;
  data: Record<string, unknown>;
}): ParsedEvent {
  const { timestamp, raw, type, data } = logEvent;
  
  const parsed: ParsedEvent = {
    timestamp,
    raw,
    type: normalizeEventType(type),
  };
  
  // Extract amount based on event type
  if (data.damage !== undefined) {
    parsed.amount = Number(data.damage);
  }
  if (data.amount !== undefined) {
    parsed.amount = Number(data.amount);
  }
  if (data.value !== undefined) {
    parsed.value = Number(data.value);
  }
  if (data.critical !== undefined) {
    parsed.critical = Boolean(data.critical);
  }
  
  // Extract skill-specific data
  if (data.skill !== undefined) {
    const skillName = String(data.skill);
    parsed.skillName = skillName;
    parsed.skillCategory = getSkillCategory(skillName);
  }
  if (data.attribute !== undefined) {
    const attrName = String(data.attribute);
    parsed.skillName = attrName;
    parsed.skillCategory = getSkillCategory(attrName);
  }
  
  // Extract loot-specific data
  if (data.item !== undefined) {
    parsed.itemName = String(data.item);
  }
  if (data.quantity !== undefined) {
    parsed.quantity = Number(data.quantity);
  }
  
  // Extract combat-specific data
  if (data.creature !== undefined) {
    parsed.creature = String(data.creature);
  }
  if (data.damageType !== undefined) {
    parsed.damageType = String(data.damageType);
  }
  
  // Extract global-specific data (player name, resource for mining)
  if (data.player !== undefined) {
    parsed.player = String(data.player);
  }
  // Map resource to itemName for mining globals
  if (data.resource !== undefined) {
    parsed.itemName = String(data.resource);
  }
  
  return parsed;
}

/**
 * Normalize event type from LogEvent to ParsedEvent format
 * Maps all main process event types to session-friendly types
 */
function normalizeEventType(type: string): string {
  const mapping: Record<string, string> = {
    // ==================== Combat - Offensive ====================
    "HIT": "damage_dealt",
    "CRITICAL_HIT": "damage_dealt",  // critical flag set separately
    "MISS": "miss",
    "TARGET_DODGED": "target_dodged",
    "TARGET_EVADED": "target_evaded", 
    "TARGET_RESISTED": "target_resisted",
    "OUT_OF_RANGE": "out_of_range",
    
    // ==================== Combat - Defensive ====================
    "DAMAGE_TAKEN": "damage_taken",
    "CRITICAL_DAMAGE_TAKEN": "damage_taken",  // critical flag set separately
    "DAMAGE_REDUCED": "damage_reduced",
    "DAMAGE_DEFLECTED": "deflect",
    "DEFLECT": "deflect",
    "PLAYER_DODGED": "player_dodged",
    "PLAYER_EVADED": "player_evaded",
    "ENEMY_MISSED": "enemy_missed",
    
    // ==================== Death ====================
    "PLAYER_DEATH": "death",
    "DEATH_LOCATION": "death_location",
    "REVIVED": "revived",
    "DIVINE_INTERVENTION": "divine_intervention",
    
    // ==================== Healing ====================
    "SELF_HEAL": "self_heal",
    "HEAL_OTHER": "heal_other",
    "HEALED_BY": "healed_by",
    "HEAL_DIMINISHED": "heal_diminished",
    "HEAL": "self_heal",  // Fallback
    
    // ==================== Loot ====================
    "LOOT": "loot",
    "CLAIM": "mining_claim",  // Mining claim is different from combat loot
    
    // ==================== Skills ====================
    "SKILL_GAIN": "skill_gain",
    "SKILL_RANK": "skill_rank",
    "SKILL_ACQUIRED": "skill_acquired",
    "ATTRIBUTE_GAIN": "attribute_gain",
    "ATTRIBUTE_IMPROVE": "attribute_gain",
    "SKILL_INCREASE": "skill_gain",
    "ATTRIBUTE_INCREASE": "attribute_gain",
    
    // ==================== Mining ====================
    "DEPLETED": "resource_depleted",
    "NO_FIND": "no_find",
    
    // ==================== Effects ====================
    "BUFF": "buff",
    "DEBUFF": "debuff",
    
    // ==================== Equipment ====================
    "TIER_UP": "tier_up",
    "LOW_CONDITION": "low_condition",
    "LOW_CONDITION_LIMITED": "low_condition_limited",
    "ENHANCER_BROKE": "enhancer_broke",
    "REPAIRED": "repaired",
    
    // ==================== Globals ====================
    "GLOBAL_KILL": "global",
    "GLOBAL_HOF": "hof",
    "GLOBAL_MINING": "global_mining",
    "GLOBAL_MINING_HOF": "hof_mining",
    "GLOBAL_CRAFT": "global_craft",
    "GLOBAL": "global",
    "HOF": "hof",
    
    // ==================== Vehicles ====================
    "VEHICLE_DAMAGE": "vehicle_damage",
    "VEHICLE_RETURNED": "vehicle_returned",
    "VEHICLE_REPAIRED": "vehicle_repaired",
    "VEHICLE_OVERLOADED": "vehicle_overloaded",
    "VEHICLE_NOT_OVERLOADED": "vehicle_not_overloaded",
    
    // ==================== Social ====================
    "PLAYER_LOGIN": "player_login",
    "PLAYER_LOGOUT": "player_logout",
    "FRIEND_ADDED": "friend_added",
    "TRADE_COMPLETE": "trade_complete",
    
    // ==================== Transactions ====================
    "PED_TRANSFER": "ped_transfer",
    "ITEM_BOUGHT": "item_bought",
    "TRANSACTION_COMPLETE": "transaction_complete",
    
    // ==================== System ====================
    "SESSION_TIME": "session_time",
    "AFK_ON": "afk_on",
    "AFK_OFF": "afk_off",
    "ROBOT_ATTACK": "robot_attack",
    "CREATURE_IMMUNE": "creature_immune",
    
    // ==================== Position ====================
    "POSITION": "position",
    "WAYPOINT_ADDED": "waypoint_added",
    "WAYPOINT_REMOVED": "waypoint_removed",
  };
  
  return mapping[type] || type.toLowerCase();
}

/**
 * Check if LogEvent type indicates a critical hit
 */
export function isCriticalHit(type: string): boolean {
  return type === "CRITICAL_HIT" || type === "CRITICAL_DAMAGE_TAKEN";
}

/**
 * Check if event type consumes ammo (counts as a "shot")
 */
export function isAmmoConsumingEvent(type: string): boolean {
  const ammoEvents = [
    "damage_dealt", "miss", "target_dodged", "target_evaded", 
    "target_resisted", "out_of_range"
  ];
  return ammoEvents.includes(type);
}

/**
 * Check if event type is a skill-related event
 */
export function isSkillEvent(type: string): boolean {
  return ["skill_gain", "skill_rank", "skill_acquired", "attribute_gain"].includes(type);
}

/**
 * Check if event type is a loot event
 */
export function isLootEvent(type: string): boolean {
  return ["loot", "mining_claim"].includes(type);
}
