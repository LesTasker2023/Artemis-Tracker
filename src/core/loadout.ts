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
  
  // Weapon enhancers: Each adds +10% damage and 0.0103 PED cost per shot
  weaponEnhancerSlots: number;  // 0-10 slots filled
  
  // Armor enhancers: No per-shot cost, they decay when you take damage
  armorEnhancerSlots: number;   // 0-10 slots filled (for tracking only)
  
  // Manual override for enhancer cost (optional)
  weaponEnhancerCostOverride?: number;
  armorEnhancerCostOverride?: number;
  
  // Manual override bypasses calculation
  manualCostPerShot?: number;
  useManualCost: boolean;
  
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
 * Each enhancer: 103 PEC ammo burn = 0.0103 PED per shot
 */
export function calculateWeaponEnhancerCost(slots: number, override?: number): number {
  if (override !== undefined && override > 0) return override;
  return slots * WEAPON_ENHANCER_COST_PED;
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
 */
export function calculateLoadoutCosts(loadout: Loadout): LoadoutCosts {
  // Weapon and amp costs (ammo burn + decay)
  const weaponCost = calculateWeaponCost(loadout.weapon);
  const ampCost = calculateWeaponCost(loadout.amp);

  // Scope and sight costs (decay only, no ammo burn)
  const scopeCost = calculateAttachmentCost(loadout.scope);
  const sightCost = calculateAttachmentCost(loadout.sight);
  
  // Weapon enhancer cost: auto-calculated unless overridden
  const weaponEnhancerCost = calculateWeaponEnhancerCost(
    loadout.weaponEnhancerSlots ?? 0,
    loadout.weaponEnhancerCostOverride
  );
  
  // Armor enhancers: no per-shot cost (decay when hit)
  const armorEnhancerCost = loadout.armorEnhancerCostOverride ?? 0;
  
  // Armor decay per hit (for repair bill)
  const armorDecayPerHit = calculateArmorDecayPerHit(loadout.armor);
  
  return {
    weaponCost,
    ampCost,
    scopeCost,
    sightCost,
    weaponEnhancerCost,
    armorEnhancerCost,
    totalPerShot: weaponCost + ampCost + scopeCost + sightCost + weaponEnhancerCost + armorEnhancerCost,
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
  const weaponBaseMin = totalBaseDamage * 0.5;  // Min hit = 50% of max
  const weaponBaseMax = totalBaseDamage * 1.0;
  
  // 2. Apply enhancer multiplier (1 + slots × 0.1)
  const enhancerSlots = loadout.weaponEnhancerSlots ?? 0;
  const enhancerMultiplier = 1 + (enhancerSlots * 0.1);
  
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
 * Calculate Damage per PED (DPP) - key efficiency metric
 */
export function calculateDPP(loadout: Loadout): number {
  const costPerShot = getEffectiveCostPerShot(loadout);
  if (costPerShot <= 0) return 0;
  
  const damage = calculateEnhancedDamage(loadout);
  const avgDamage = (damage.min + damage.max) / 2;
  
  return avgDamage / costPerShot;
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
    weaponEnhancerSlots: 0,
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
