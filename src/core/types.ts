/**
 * ARTEMIS v3 - Shared Types
 * Comprehensive event tracking for hunting sessions
 */

export type EventCategory =
  | 'combat'
  | 'loot'
  | 'skill'
  | 'mining'
  | 'healing'
  | 'death'
  | 'equipment'
  | 'effect'
  | 'global'
  | 'social'
  | 'vehicle'
  | 'position'
  | 'transaction'
  | 'system';

export interface LogEvent {
  timestamp: number;
  raw: string;
  category: EventCategory;
  type: string;
  data: Record<string, unknown>;
}

// ==================== Skill Tracking ====================

/**
 * Skill categories for grouping and analysis
 */
export type SkillCategory = 
  | 'combat'       // Ranged, melee, defense skills
  | 'attributes'   // Agility, Strength, etc.
  | 'profession'   // Mining, crafting, etc.
  | 'support'      // Healing, vehicle, etc.
  | 'other';

/**
 * Individual skill gain event data
 */
export interface SkillGainEntry {
  timestamp: number;
  skillName: string;
  amount: number;
  category: SkillCategory;
}

/**
 * Aggregated stats for a single skill
 */
export interface SkillStats {
  skillName: string;
  category: SkillCategory;
  totalGain: number;
  gainCount: number;
  averageGain: number;
  firstGain: number;  // timestamp
  lastGain: number;   // timestamp
}

/**
 * Full skill breakdown for a session
 */
export interface SkillBreakdown {
  totalSkillGains: number;       // Total skill point value gained
  totalSkillEvents: number;      // Number of skill gain events
  skillRanks: number;            // New ranks achieved
  newSkillsUnlocked: number;     // New skills acquired
  bySkill: Record<string, SkillStats>;  // Per-skill breakdown
  byCategory: Record<SkillCategory, number>; // Total by category
}

/**
 * Skill efficiency metrics
 */
export interface SkillEfficiency {
  skillPerPedSpent: number;      // Skill points per PED spent
  skillPerShot: number;          // Skill points per shot fired
  skillPerHour: number;          // Skill points per hour
  skillPerKill: number;          // Skill points per kill (if applicable)
  skillPerLoot: number;          // Skill points per PED of loot
  skillToLootRatio: number;      // Skill value vs loot value comparison
  avgSkillPerEvent: number;      // Average skill gain per event
}

// ==================== Loot Tracking ====================

/**
 * Individual loot item entry
 */
export interface LootEntry {
  timestamp: number;
  itemName: string;
  quantity: number;
  value: number;  // PED value
  tier?: number;  // Item tier if applicable
}

/**
 * Aggregated loot stats
 */
export interface LootBreakdown {
  totalValue: number;
  totalItems: number;
  uniqueItems: number;
  byItem: Record<string, { itemName: string; count: number; totalValue: number; quantity: number }>;
  shrapnelValue: number;  // Shrapnel is special - always received
  ammoValue: number;      // Universal ammo received
}

// ==================== Combat Tracking ====================

/**
 * Detailed combat breakdown
 */
export interface CombatBreakdown {
  // Offensive
  totalShots: number;
  hits: number;
  misses: number;
  criticals: number;
  targetDodged: number;    // Your attacks dodged by target
  targetEvaded: number;    // Your attacks evaded by target
  targetResisted: number;  // Your attacks resisted by target
  targetMissed: number;    // Simple misses (not dodge/evade)
  outOfRange: number;      // Shots that were out of range
  
  // Damage dealt
  damageDealt: number;
  criticalDamage: number;
  averageDamagePerHit: number;
  maxDamageHit: number;    // Highest single hit damage
  dps: number;  // Damage per second (active combat time)
  
  // Ammo
  ammoConsumed: number;    // Total ammo units consumed
  
  // Defensive
  damageTaken: number;
  criticalDamageTaken: number;
  playerDodges: number;    // You dodged incoming attacks
  playerEvades: number;    // You evaded incoming attacks
  deflects: number;        // Armor fully deflected the attack
  enemyMisses: number;     // Enemy missed you
  damageReduced: number;   // Armor/buff damage reduction
  totalIncomingAttacks: number;  // Total attacks against you
  armorHits: number;       // Attacks that hit armor (damage_taken + deflects)
  
  // Healing
  selfHealing: number;
  healingReceived: number;
  healingGiven: number;
  healthRegen: number;     // Natural/passive regeneration
  healCount: number;       // Number of heal actions (for FAP decay)
  
  // Results
  kills: number;
  deaths: number;
  killsInferred: number;  // Kills inferred from loot patterns
}

// ==================== Basic Totals ====================

export interface Totals {
  damageDealt: number;
  damageTaken: number;
  healed: number;
  lootValue: number;
  skillGains: number;
  kills: number;
  deaths: number;
  shots: number;
}

export const INITIAL_TOTALS: Totals = {
  damageDealt: 0,
  damageTaken: 0,
  healed: 0,
  lootValue: 0,
  skillGains: 0,
  kills: 0,
  deaths: 0,
  shots: 0,
};

// ==================== Skill Classification ====================

/**
 * Map skill names to categories for classification
 */
export const SKILL_CATEGORIES: Record<string, SkillCategory> = {
  // Combat - Ranged
  'Aim': 'combat',
  'Marksmanship': 'combat',
  'Rifle': 'combat',
  'Handgun': 'combat',
  'Weapons Handling': 'combat',
  'Ranged Damage Assessment': 'combat',
  'Inflict Ranged Damage': 'combat',
  'BLP Weaponry Technology': 'combat',
  'Laser Weaponry Technology': 'combat',
  'Plasma Weaponry Technology': 'combat',
  'Gauss Weaponry Technology': 'combat',
  'Explosive Projectile Weaponry Technology': 'combat',
  'Heavy Weapons': 'combat',
  'Support Weapon Systems': 'combat',
  
  // Combat - Melee
  'Melee Combat': 'combat',
  'Inflict Melee Damage': 'combat',
  'Light Melee Weapons': 'combat',
  'Heavy Melee Weapons': 'combat',
  'Clubs': 'combat',
  'Whip': 'combat',
  'Power Fist': 'combat',
  
  // Combat - Defense
  'Combat Reflexes': 'combat',
  'Dodge': 'combat',
  'Evade': 'combat',
  'Concentration': 'combat',
  
  // Attributes
  'Agility': 'attributes',
  'Strength': 'attributes',
  'Stamina': 'attributes',
  'Intelligence': 'attributes',
  'Psyche': 'attributes',
  'Dexterity': 'attributes',
  'Perception': 'attributes',
  'Alertness': 'attributes',
  'Serendipity': 'attributes',
  'Courage': 'attributes',
  'Bravado': 'attributes',
  
  // Profession - Mining
  'Mining': 'profession',
  'Surveying': 'profession',
  'Prospecting': 'profession',
  'Probing': 'profession',
  'Drilling': 'profession',
  'Extraction': 'profession',
  'Mining Laser Operator': 'profession',
  'Mining Laser Technology': 'profession',
  'Geology': 'profession',
  
  // Profession - Crafting
  'Blueprint Comprehension': 'profession',
  'Manufacture Attachments': 'profession',
  'Manufacture Mechanical Equipment': 'profession',
  'Manufacture Metal Equipment': 'profession',
  'Carpentry': 'profession',
  'Tailoring': 'profession',
  'Texture Engineering': 'profession',
  'Electronics': 'profession',
  'Mechanics': 'profession',
  'Machinery': 'profession',
  'Engineering': 'profession',
  
  // Profession - Hunting related
  'Anatomy': 'profession',
  'Analysis': 'profession',
  'Animal Lore': 'profession',
  'Zoology': 'profession',
  'Skinning': 'profession',
  'Scan Animal': 'profession',
  'Scan Human': 'profession',
  'Scan Robot': 'profession',
  
  // Support
  'First Aid': 'support',
  'Diagnosis': 'support',
  'Bioregenesis': 'support',
  'Jamming': 'support',
  'Animal Taming': 'support',
  'Sweat Gatherer': 'support',
  'Athletics': 'support',
  'Vehicle Repairing': 'support',
  'Vehicle Technology': 'support',
  'Spacecraft Systems': 'support',
  'Computer': 'support',
  'Translocation': 'support',
  
  // Others
  'Reclaiming': 'other',
  'Fragmentating': 'other',
  'Scourging': 'other',
};

/**
 * Get the category for a skill name
 */
export function getSkillCategory(skillName: string): SkillCategory {
  return SKILL_CATEGORIES[skillName] || 'other';
}
