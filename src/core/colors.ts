/**
 * Project Delta - Event Colors
 * Aligned with Project Delta design system
 */

export const categoryColors: Record<string, string> = {
  combat: '#22c55e',      // status-success green
  loot: '#fbbf24',        // amber/gold
  skill: '#60a5fa',       // surface-interactive blue
  mining: '#14b8a6',      // teal
  healing: '#10b981',     // emerald
  death: '#ef4444',       // status-error red
  equipment: '#a855f7',   // violet
  effect: '#c084fc',      // purple
  global: '#f472b6',      // pink
  social: '#64748b',      // slate
  vehicle: '#f97316',     // surface-clickable orange
  position: '#6366f1',    // indigo
  transaction: '#fbbf24', // amber
  system: '#475569',      // slate muted
};

export const typeColors: Record<string, string> = {
  // Combat
  HIT: '#22c55e',
  CRITICAL_HIT: '#16a34a',
  MISS: '#94a3b8',
  DAMAGE_TAKEN: '#ef4444',
  CRITICAL_DAMAGE_TAKEN: '#dc2626',
  DAMAGE_REDUCED: '#84cc16',
  TARGET_DODGED: '#a855f7',
  TARGET_EVADED: '#a855f7',
  TARGET_RESISTED: '#9333ea',
  PLAYER_EVADED: '#3b82f6',
  PLAYER_DODGED: '#3b82f6',
  ENEMY_MISSED: '#60a5fa',
  OUT_OF_RANGE: '#94a3b8',
  // Death
  PLAYER_DEATH: '#dc2626',
  DEATH_LOCATION: '#b91c1c',
  REVIVED: '#22c55e',
  DIVINE_INTERVENTION: '#fbbf24',
  // Loot
  LOOT: '#eab308',
  // Skill
  SKILL_GAIN: '#06b6d4',
  SKILL_RANK: '#0891b2',
  SKILL_ACQUIRED: '#0e7490',
  ATTRIBUTE_GAIN: '#14b8a6',
  ATTRIBUTE_IMPROVE: '#0d9488',
  // Mining
  CLAIM: '#14b8a6',
  DEPLETED: '#64748b',
  NO_FIND: '#475569',
  // Healing
  SELF_HEAL: '#10b981',
  HEAL_OTHER: '#34d399',
  HEALED_BY: '#6ee7b7',
  HEAL_DIMINISHED: '#94a3b8',
  // Effects
  BUFF: '#a855f7',
  DEBUFF: '#f43f5e',
  // Equipment
  TIER_UP: '#8b5cf6',
  LOW_CONDITION: '#f97316',
  LOW_CONDITION_LIMITED: '#ea580c',
  ENHANCER_BROKE: '#dc2626',
  REPAIRED: '#22c55e',
  // Globals
  GLOBAL_KILL: '#ec4899',
  GLOBAL_HOF: '#f472b6',
  GLOBAL_MINING: '#2dd4bf',
  GLOBAL_MINING_HOF: '#5eead4',
  GLOBAL_CRAFT: '#c084fc',
  // Vehicle
  VEHICLE_DAMAGE: '#f97316',
  VEHICLE_RETURNED: '#64748b',
  VEHICLE_REPAIRED: '#22c55e',
  // Social
  PLAYER_LOGIN: '#64748b',
  PLAYER_LOGOUT: '#475569',
  TRADE_COMPLETE: '#fbbf24',
  // Position
  POSITION: '#6366f1',
  WAYPOINT_ADDED: '#818cf8',
  WAYPOINT_REMOVED: '#64748b',
  // Transaction
  PED_TRANSFER: '#fbbf24',
  ITEM_BOUGHT: '#f59e0b',
  // System
  SESSION_TIME: '#94a3b8',
  AFK_ON: '#475569',
  AFK_OFF: '#64748b',
  UNKNOWN: '#334155',
};
