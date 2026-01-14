/**
 * Loadout System - Cost-per-shot calculation
 * Based on V2 ARTEMIS LoadoutService calculations
 * No external dependencies, pure TypeScript
 */

// ==================== Types ====================

export interface EquipmentEconomy {
  decay: number;      // PED per shot (stored internally, displayed as PEC in UI)
  ammoBurn: number;   // Raw ammo burn value (multiply by 0.0001 for PED)
}

export interface DamageProperties {
  stab: number;
  cut: number;
  impact: number;
  penetration: number;
  shrapnel: number;
  burn: number;
  cold: number;
  acid: number;
  electric: number;
}

export interface Equipment {
  name: string;
  economy: EquipmentEconomy;
  damage?: DamageProperties;
}

/**
 * Armor set with decay calculation
 */
export interface ArmorSet {
  name: string;
  maxTT: number;        // Max TT value in PED
  durability: number;   // Durability (hits until broken)
  isLimited: boolean;   // L items cannot be repaired
}

/**
 * Armor plate for per-hit decay tracking
 */
export interface ArmorPlate {
  name: string;
  maxTT: number;        // TT value in PED (used for decay calculation)
  durability?: number;  // Durability from data (hits before broken)
}

export interface Loadout {
  id: string;
  name: string;
  
  // Equipment slots
  weapon?: Equipment;
  amp?: Equipment;
  scope?: Equipment;
  sight?: Equipment;
  
  // Armor - for decay tracking
  armor?: ArmorSet;
  
  // Armor plates (enhancers) - decay when hit
  armorPlates: ArmorPlate[];
  
  // Weapon enhancers: 10 total slots, mix and match between types
  damageEnhancers: number;      // Each adds +10% damage
  accuracyEnhancers: number;    // Each adds accuracy bonus
  rangeEnhancers: number;       // Each adds +5% range
  economyEnhancers: number;     // Each reduces decay
  
  // Legacy field for backward compatibility
  weaponEnhancerSlots?: number;
  
  // Armor enhancers: No per-shot cost, they decay when you take damage
  armorEnhancerSlots: number;   // 0-10 slots filled (for tracking only)
  
  // Manual override for enhancer cost (optional)
  weaponEnhancerCostOverride?: number;
  armorEnhancerCostOverride?: number;
  
  // Manual override bypasses calculation
  manualCostPerShot?: number;
  useManualCost: boolean;
  
  // Player skills (0-100) - affects damage range, hit rate, and crit rate
  // Default to 100 (maxed skills) for backwards compatibility
  hitProfession?: number;      // Affects hit rate and crit rate
  damageProfession?: number;   // Affects damage range (min damage)
  
  createdAt: number;
  updatedAt: number;
}

export interface LoadoutCosts {
  weaponCost: number;
  ampCost: number;
  scopeCost: number;
  sightCost: number;
  weaponEnhancerCost: number;
  armorEnhancerCost: number;
  totalPerShot: number;
  // Armor decay per hit (for repair bill calculation)
  armorDecayPerHit: number;
}

export interface DamageRange {
  min: number;
  max: number;
}

// ==================== Constants ====================

const AMMOBURN_TO_PED = 0.0001;     // Ammo burn units to PED (1/10000)

// Enhancer constants (from Entropia Universe game mechanics)
// Each weapon enhancer adds:
//   - +10% damage to weapon
//   - 103 PEC ammo burn cost (0.0103 PED) per shot
// Armor enhancers have no per-shot cost (they decay when you take damage)
const WEAPON_ENHANCER_AMMOBURN_PEC = 103;  // PEC per enhancer per shot
const WEAPON_ENHANCER_COST_PED = WEAPON_ENHANCER_AMMOBURN_PEC * AMMOBURN_TO_PED;  // 0.0103 PED

// ==================== Pure Functions ====================

/**
 * Calculate weapon/amp cost per shot (ammo burn + decay)
 * Note: ammoBurn needs conversion to PED (multiply by 0.0001), decay is already in PED
 */
export function calculateWeaponCost(equipment?: Equipment): number {
  if (!equipment) return 0;
  const { ammoBurn, decay } = equipment.economy;
  return ammoBurn * AMMOBURN_TO_PED + decay;
}

/**
 * Calculate scope/sight cost per shot (decay only, no ammo burn)
 */
export function calculateAttachmentCost(equipment?: Equipment): number {
  if (!equipment) return 0;
  return equipment.economy.decay;
}

/**
 * Calculate weapon enhancer cost based on slots filled
 * Each damage enhancer: 103 PEC ammo burn = 0.0103 PED per shot
 * Economy enhancers reduce total cost by 1.1% each (multiplicative)
 */
export function calculateWeaponEnhancerCost(damageSlots: number, economySlots: number, override?: number): number {
  if (override !== undefined && override > 0) return override;
  const baseCost = damageSlots * WEAPON_ENHANCER_COST_PED;
  // Economy enhancers: each reduces cost by 1.1% (multiply by 0.989 per enhancer)
  const economyMultiplier = Math.pow(0.989, economySlots);
  return baseCost * economyMultiplier;
}

/**
 * Calculate armor set decay per hit/deflect
 * Formula: MaxTT / Durability = PED per hit
 * One armor piece gets hit at a time, this gives the per-hit decay for the set
 */
export function calculateArmorDecayPerHit(armor?: ArmorSet): number {
  if (!armor) return 0;
  if (armor.durability <= 0) return 0;
  return armor.maxTT / armor.durability;
}

/**
 * Calculate single armor plate decay per hit/deflect
 * Only ONE plate gets hit at a time - we return average decay across plates
 * since we don't know which specific plate is hit
 */
const DEFAULT_PLATE_DURABILITY = 1000; // Fallback if no durability data
export function calculateSinglePlateDecayPerHit(plates: ArmorPlate[]): number {
  if (!plates || plates.length === 0) return 0;
  
  // Calculate decay for each plate, then average (1 random plate hit per attack)
  let totalDecayRates = 0;
  for (const plate of plates) {
    const maxTT = plate.maxTT || 0;
    const durability = plate.durability || DEFAULT_PLATE_DURABILITY;
    if (durability > 0) {
      totalDecayRates += maxTT / durability;
    }
  }
  
  // Average decay per hit (one plate per hit)
  return totalDecayRates / plates.length;
}

/**
 * Check if an item is Limited (L) based on name
 */
export function isLimitedItem(name: string): boolean {
  return name.includes("(L)") || name.endsWith(" L");
}

/**
 * Calculate full loadout costs breakdown
 * Includes ammo burn, decay, and enhancer costs for all equipment.
 * Damage enhancers increase weapon decay and ammo burn by 10% each.
 */
export function calculateLoadoutCosts(loadout: Loadout): LoadoutCosts {
  // Get base weapon and amp costs
  const baseWeaponCost = calculateWeaponCost(loadout.weapon);
  const ampCost = calculateWeaponCost(loadout.amp);

  // Scope and sight costs (decay only, no ammo burn)
  const scopeCost = calculateAttachmentCost(loadout.scope);
  const sightCost = calculateAttachmentCost(loadout.sight);
  
  // Damage enhancers increase weapon decay and ammo burn by 10% each
  // Support legacy weaponEnhancerSlots for backward compatibility
  const damageEnhancers = (loadout.damageEnhancers || 0) + (loadout.weaponEnhancerSlots || 0);
  const economyEnhancers = loadout.economyEnhancers || 0;
  
  // Apply damage enhancer multiplier to weapon cost (1 + 0.1 per enhancer)
  const damageMultiplier = 1 + (damageEnhancers * 0.1);
  const weaponCostWithDamage = baseWeaponCost * damageMultiplier;
  
  // Economy enhancers reduce weapon and amp costs by 1.1% each (multiplicative)
  const economyMultiplier = Math.pow(0.989, economyEnhancers);
  const finalWeaponCost = weaponCostWithDamage * economyMultiplier;
  const finalAmpCost = ampCost * economyMultiplier;
  
  // No separate enhancer cost line item - it's built into the weapon cost increase
  const weaponEnhancerCost = 0;
  
  // Armor enhancers: no per-shot cost (decay when hit)
  const armorEnhancerCost = loadout.armorEnhancerCostOverride ?? 0;
  
  // Armor decay per hit (for repair bill)
  const armorDecayPerHit = calculateArmorDecayPerHit(loadout.armor);
  
  return {
    weaponCost: finalWeaponCost,
    ampCost: finalAmpCost,
    scopeCost,
    sightCost,
    weaponEnhancerCost,
    armorEnhancerCost,
    totalPerShot: finalWeaponCost + finalAmpCost + scopeCost + sightCost + weaponEnhancerCost + armorEnhancerCost,
    armorDecayPerHit,
  };
}

/**
 * Calculate total damage from all damage types
 */
export function calculateTotalDamage(equipment?: Equipment): number {
  if (!equipment?.damage) return 0;
  const d = equipment.damage;
  return d.stab + d.cut + d.impact + d.penetration + d.shrapnel + d.burn + d.cold + d.acid + d.electric;
}

/**
 * Calculate enhanced damage range with enhancers and amp
 * Enhancers: Each slot adds +10% (10 slots = +100% = 2× damage)
 * Amp: Adds damage up to cap (weapon base min damage)
 */
export function calculateEnhancedDamage(loadout: Loadout): DamageRange {
  if (!loadout.weapon) {
    return { min: 0, max: 0 };
  }
  
  // 1. Base weapon damage
  const totalBaseDamage = calculateTotalDamage(loadout.weapon);
  
  // Base weapon damage range - affected by damage profession skill
  // At 100 skill: 50% to 100% (0.25 + 0.25 * 1.0 = 0.5)
  // At 0 skill: 25% to 100% (0.25 + 0.25 * 0.0 = 0.25)
  const damageProfession = loadout.damageProfession ?? 100;
  const minDamageMultiplier = 0.25 + 0.25 * (damageProfession / 100);
  const weaponBaseMin = totalBaseDamage * minDamageMultiplier;
  const weaponBaseMax = totalBaseDamage * 1.0;
  
  // 2. Apply damage enhancer multiplier (1 + slots × 0.1)
  // Support legacy weaponEnhancerSlots for backward compatibility
  const damageEnhancers = (loadout.damageEnhancers || 0) + (loadout.weaponEnhancerSlots || 0);
  const enhancerMultiplier = 1 + (damageEnhancers * 0.1);
  
  let enhancedMin = weaponBaseMin * enhancerMultiplier;
  let enhancedMax = weaponBaseMax * enhancerMultiplier;
  
  // 3. Apply amp damage (capped at weapon base min)
  if (loadout.amp?.damage) {
    const ampDamage = calculateTotalDamage(loadout.amp);
    const ampCap = Math.min(ampDamage, weaponBaseMin);
    
    enhancedMin += ampCap * 0.5;  // 50% to min
    enhancedMax += ampCap * 1.0;  // 100% to max
  }
  
  return {
    min: Math.round(enhancedMin * 10) / 10,
    max: Math.round(enhancedMax * 10) / 10,
  };
}

/**
 * Calculate effective damage accounting for hit rate and critical hits
 * Based on entropia-calc formula with skill-based calculations
 * - Hit rate: 0.8 + (hitProf / 100) / 10 (90% at 100 skill, 80% at 0 skill)
 * - Crit rate: (sqrt(hitProf) / 10 + 1) / 100 (2% at 100 skill, 1% at 0 skill)
 * - Effective damage: avgDamage × hitRate + (maxDamage × critRate)
 */
export function calculateEffectiveDamage(loadout: Loadout): number {
  if (!loadout.weapon) {
    return 0;
  }

  const damage = calculateEnhancedDamage(loadout);
  const avgDamage = (damage.min + damage.max) / 2;
  
  // Use player's actual hit profession (default to 100 for maxed skills)
  const hitProf = loadout.hitProfession ?? 100;
  
  // Hit rate: 0.8 + (hitProf / 100) / 10
  // At 100 skill: 0.8 + 1.0/10 = 0.9 (90%)
  // At 0 skill: 0.8 + 0.0/10 = 0.8 (80%)
  const hitAbility = hitProf / 100;
  const hitRate = 0.8 + hitAbility / 10;
  
  // Crit rate: (sqrt(hitProf) / 10 + 1) / 100 + accuracy enhancers
  // At 100 skill: (10/10 + 1) / 100 = 0.02 (2%)
  // At 0 skill: (0/10 + 1) / 100 = 0.01 (1%)
  // Accuracy enhancers: +0.2% (0.002) per enhancer
  const critAbility = Math.sqrt(hitProf) / 10;
  const baseCritRate = (critAbility + 1) / 100;
  const accuracyBonus = (loadout.accuracyEnhancers || 0) * 0.002;
  const critRate = baseCritRate + accuracyBonus;
  const critDamage = damage.max * critRate;
  
  return avgDamage * hitRate + critDamage;
}

/**
 * Get player's actual hit rate based on hit profession skill
 */
export function getHitRate(loadout: Loadout): number {
  const hitProf = loadout.hitProfession ?? 100;
  const hitAbility = hitProf / 100;
  return 0.8 + hitAbility / 10;
}

/**
 * Get player's actual crit rate based on hit profession skill and accuracy enhancers
 */
export function getCritRate(loadout: Loadout): number {
  const hitProf = loadout.hitProfession ?? 100;
  const critAbility = Math.sqrt(hitProf) / 10;
  const baseCritRate = (critAbility + 1) / 100;
  const accuracyBonus = (loadout.accuracyEnhancers || 0) * 0.002;
  return baseCritRate + accuracyBonus;
}

/**
 * Get modified weapon decay (PEC) with damage and economy enhancers applied
 */
export function getModifiedDecay(loadout: Loadout): number {
  if (!loadout.weapon) return 0;
  
  const baseDecay = loadout.weapon.economy.decay;
  const damageEnhancers = (loadout.damageEnhancers || 0) + (loadout.weaponEnhancerSlots || 0);
  const economyEnhancers = loadout.economyEnhancers || 0;
  
  // Damage enhancers increase decay by 10% each
  const damageMultiplier = 1 + (damageEnhancers * 0.1);
  // Economy enhancers reduce by 1.1% each
  const economyMultiplier = Math.pow(0.989, economyEnhancers);
  
  return baseDecay * damageMultiplier * economyMultiplier;
}

/**
 * Get modified ammo burn with damage and economy enhancers applied
 */
export function getModifiedAmmo(loadout: Loadout): number {
  if (!loadout.weapon) return 0;
  
  const baseAmmo = loadout.weapon.economy.ammoBurn;
  const damageEnhancers = (loadout.damageEnhancers || 0) + (loadout.weaponEnhancerSlots || 0);
  const economyEnhancers = loadout.economyEnhancers || 0;
  
  // Damage enhancers increase ammo by 10% each
  const damageMultiplier = 1 + (damageEnhancers * 0.1);
  // Economy enhancers reduce by 1.1% each
  const economyMultiplier = Math.pow(0.989, economyEnhancers);
  
  return baseAmmo * damageMultiplier * economyMultiplier;
}

/**
 * Calculate Damage per PED (DPP) - key efficiency metric
 * Uses effective damage (accounting for hit rate and crits)
 */
export function calculateDPP(loadout: Loadout): number {
  const costPerShot = getEffectiveCostPerShot(loadout);
  if (costPerShot <= 0) return 0;
  
  const effectiveDamage = calculateEffectiveDamage(loadout);
  
  return effectiveDamage / costPerShot;
}

/**
 * Get effective cost per shot (respects manual override)
 */
export function getEffectiveCostPerShot(loadout: Loadout): number {
  if (loadout.useManualCost && loadout.manualCostPerShot !== undefined) {
    return loadout.manualCostPerShot;
  }
  return calculateLoadoutCosts(loadout).totalPerShot;
}

/**
 * Create a new empty loadout
 */
export function createLoadout(name: string): Loadout {
  return {
    id: crypto.randomUUID(),
    name,
    armorPlates: [],
    damageEnhancers: 0,
    accuracyEnhancers: 0,
    rangeEnhancers: 0,
    economyEnhancers: 0,
    armorEnhancerSlots: 0,
    useManualCost: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Create equipment from raw values
 */
export function createEquipment(
  name: string,
  decay: number,
  ammoBurn: number = 0
): Equipment {
  return {
    name,
    economy: { decay, ammoBurn },
  };
}

// ==================== Storage ====================

const STORAGE_KEY = 'artemis-loadouts';

/**
 * Load all loadouts from localStorage
 */
export function loadLoadouts(): Loadout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save all loadouts to localStorage
 */
export function saveLoadouts(loadouts: Loadout[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadouts));
  } catch {
    // Silently fail - localStorage may be unavailable
  }
}

/**
 * Save single loadout (add or update)
 */
export function saveLoadout(loadout: Loadout): Loadout[] {
  const loadouts = loadLoadouts();
  const index = loadouts.findIndex(l => l.id === loadout.id);
  
  const updated = { ...loadout, updatedAt: Date.now() };
  
  if (index >= 0) {
    loadouts[index] = updated;
  } else {
    loadouts.push(updated);
  }
  
  saveLoadouts(loadouts);
  return loadouts;
}

/**
 * Delete loadout by ID
 */
export function deleteLoadout(id: string): Loadout[] {
  const loadouts = loadLoadouts().filter(l => l.id !== id);
  saveLoadouts(loadouts);
  return loadouts;
}

/**
 * Get active loadout ID from storage
 */
export function getActiveLoadoutId(): string | null {
  return localStorage.getItem('artemis-active-loadout');
}

/**
 * Set active loadout ID
 */
export function setActiveLoadoutId(id: string | null): void {
  if (id) {
    localStorage.setItem('artemis-active-loadout', id);
  } else {
    localStorage.removeItem('artemis-active-loadout');
  }
}

/**
 * Get the currently active loadout (reads fresh from storage)
 * Use this when you need the most up-to-date active loadout
 */
export function getActiveLoadout(): Loadout | null {
  const activeId = getActiveLoadoutId();
  if (!activeId) return null;
  
  const loadouts = loadLoadouts();
  return loadouts.find(l => l.id === activeId) ?? null;
}
