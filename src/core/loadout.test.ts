import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateWeaponCost,
  calculateAttachmentCost,
  calculateLoadoutCosts,
  calculateWeaponEnhancerCost,
  getEffectiveCostPerShot,
  calculateEnhancedDamage,
  calculateDPP,
  createLoadout,
  loadLoadouts,
  saveLoadouts,
  saveLoadout,
  deleteLoadout,
  Equipment,
} from './loadout';

// Helper to create equipment for tests
function createEquipment(name: string, decay: number, ammoBurn: number = 0): Equipment {
  return { name, economy: { decay, ammoBurn } };
}

function createWeaponWithDamage(name: string, decay: number, ammoBurn: number, totalDamage: number): Equipment {
  return {
    name,
    economy: { decay, ammoBurn },
    damage: {
      stab: 0, cut: 0, impact: totalDamage, penetration: 0, shrapnel: 0,
      burn: 0, cold: 0, acid: 0, electric: 0,
    },
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('loadout calculations', () => {
  describe('calculateWeaponCost', () => {
    it('returns 0 for undefined equipment', () => {
      expect(calculateWeaponCost(undefined)).toBe(0);
    });

    it('calculates decay-only cost correctly', () => {
      // Decay is already in PED (converted at source)
      const weapon = createEquipment('Test Gun', 0.10, 0);
      expect(calculateWeaponCost(weapon)).toBeCloseTo(0.10, 4);
    });

    it('calculates ammo burn cost correctly', () => {
      const weapon = createEquipment('Test Gun', 0, 100);
      // 100 ammo burn * 0.0001 = 0.01 PED
      expect(calculateWeaponCost(weapon)).toBeCloseTo(0.01, 4);
    });

    it('calculates combined decay + ammo burn', () => {
      // Decay 0.2016 PED + ammoBurn 105.6 * 0.0001 = 0.2016 + 0.01056 = 0.21216 PED
      const weapon = createEquipment('Herman ARK-35', 0.2016, 105.6);
      expect(calculateWeaponCost(weapon)).toBeCloseTo(0.21216, 4);
    });
  });

  describe('calculateAttachmentCost', () => {
    it('returns decay only (no ammo burn)', () => {
      const scope = createEquipment('Test Scope', 0.05, 100);
      // Should ignore ammoBurn for attachments
      expect(calculateAttachmentCost(scope)).toBeCloseTo(0.05, 4);
    });
  });

  describe('calculateLoadoutCosts', () => {
    it('returns zero costs for empty loadout', () => {
      const loadout = createLoadout('Empty');
      const costs = calculateLoadoutCosts(loadout);
      
      expect(costs.weaponCost).toBe(0);
      expect(costs.ampCost).toBe(0);
      expect(costs.totalPerShot).toBe(0);
    });

    it('sums all equipment costs correctly', () => {
      const loadout = createLoadout('Full');
      // Decay values are in PED (pre-converted)
      loadout.weapon = createEquipment('Gun', 0.10, 0);     // 0.10 PED
      loadout.amp = createEquipment('Amp', 0.05, 50);       // 0.05 + 0.005 = 0.055 PED
      loadout.scope = createEquipment('Scope', 0.02, 100);  // 0.02 PED (decay only)
      
      const costs = calculateLoadoutCosts(loadout);
      
      expect(costs.weaponCost).toBeCloseTo(0.10, 4);
      expect(costs.ampCost).toBeCloseTo(0.055, 4);
      expect(costs.scopeCost).toBeCloseTo(0.02, 4);  // Scope uses decay only
      expect(costs.totalPerShot).toBeCloseTo(0.175, 4);
    });

    it('includes enhancer costs (auto-calculated)', () => {
      const loadout = createLoadout('With Enhancers');
      loadout.weapon = createEquipment('Gun', 0.10, 0);
      loadout.weaponEnhancerSlots = 5;  // 5 enhancers = 5 * 0.0103 = 0.0515 PED
      
      const costs = calculateLoadoutCosts(loadout);
      // weapon 0.10 + enhancers 0.0515 = 0.1515
      expect(costs.weaponEnhancerCost).toBeCloseTo(0.0515, 4);
      expect(costs.totalPerShot).toBeCloseTo(0.1515, 4);
    });

    it('10 enhancers cost 0.103 PED per shot', () => {
      const loadout = createLoadout('Max Enhancers');
      loadout.weaponEnhancerSlots = 10;
      
      const costs = calculateLoadoutCosts(loadout);
      expect(costs.weaponEnhancerCost).toBeCloseTo(0.103, 4);
    });
  });

  describe('calculateWeaponEnhancerCost', () => {
    it('returns 0 for 0 slots', () => {
      expect(calculateWeaponEnhancerCost(0)).toBe(0);
    });

    it('returns 0.0103 PED per enhancer', () => {
      expect(calculateWeaponEnhancerCost(1)).toBeCloseTo(0.0103, 4);
      expect(calculateWeaponEnhancerCost(5)).toBeCloseTo(0.0515, 4);
      expect(calculateWeaponEnhancerCost(10)).toBeCloseTo(0.103, 4);
    });

    it('respects override when provided', () => {
      expect(calculateWeaponEnhancerCost(10, 0.05)).toBe(0.05);
    });
  });

  describe('getEffectiveCostPerShot', () => {
    it('returns calculated cost when manual override disabled', () => {
      const loadout = createLoadout('Test');
      loadout.weapon = createEquipment('Gun', 0.10, 0);
      loadout.useManualCost = false;
      
      expect(getEffectiveCostPerShot(loadout)).toBeCloseTo(0.10, 4);
    });

    it('returns manual cost when override enabled', () => {
      const loadout = createLoadout('Test');
      loadout.weapon = createEquipment('Gun', 0.10, 0);
      loadout.useManualCost = true;
      loadout.manualCostPerShot = 0.25;
      
      expect(getEffectiveCostPerShot(loadout)).toBe(0.25);
    });

    it('falls back to calculated if manual enabled but no value', () => {
      const loadout = createLoadout('Test');
      loadout.weapon = createEquipment('Gun', 0.10, 0);
      loadout.useManualCost = true;
      // manualCostPerShot is undefined
      
      expect(getEffectiveCostPerShot(loadout)).toBeCloseTo(0.10, 4);
    });
  });

  describe('calculateEnhancedDamage', () => {
    it('returns zero for no weapon', () => {
      const loadout = createLoadout('Empty');
      const damage = calculateEnhancedDamage(loadout);
      expect(damage.min).toBe(0);
      expect(damage.max).toBe(0);
    });

    it('calculates base weapon damage range', () => {
      const loadout = createLoadout('Test');
      loadout.weapon = createWeaponWithDamage('Gun', 0.10, 0, 100);
      
      const damage = calculateEnhancedDamage(loadout);
      expect(damage.min).toBe(50);   // 50% of 100
      expect(damage.max).toBe(100);  // 100% of 100
    });

    it('applies enhancer multiplier correctly', () => {
      const loadout = createLoadout('Test');
      loadout.weapon = createWeaponWithDamage('Gun', 0.10, 0, 100);
      loadout.weaponEnhancerSlots = 5;  // +50% damage
      
      const damage = calculateEnhancedDamage(loadout);
      expect(damage.min).toBe(75);   // 50 * 1.5
      expect(damage.max).toBe(150);  // 100 * 1.5
    });

    it('10 enhancer slots doubles damage', () => {
      const loadout = createLoadout('Test');
      loadout.weapon = createWeaponWithDamage('Gun', 0.10, 0, 100);
      loadout.weaponEnhancerSlots = 10;  // +100% damage
      
      const damage = calculateEnhancedDamage(loadout);
      expect(damage.min).toBe(100);  // 50 * 2
      expect(damage.max).toBe(200);  // 100 * 2
    });
  });

  describe('calculateDPP', () => {
    it('returns 0 if no cost', () => {
      const loadout = createLoadout('Free');
      const dpp = calculateDPP(loadout);
      expect(dpp).toBe(0);
    });

    it('calculates damage per PED correctly', () => {
      const loadout = createLoadout('Test');
      loadout.weapon = createWeaponWithDamage('Gun', 0.10, 0, 100);
      
      const dpp = calculateDPP(loadout);
      // Avg damage = (50 + 100) / 2 = 75
      // Cost = 0.10 PED
      // DPP = 75 / 0.10 = 750
      expect(dpp).toBe(750);
    });
  });
});

describe('loadout factories', () => {
  it('createLoadout generates valid loadout', () => {
    const loadout = createLoadout('My Loadout');
    
    expect(loadout.id).toBeDefined();
    expect(loadout.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(loadout.name).toBe('My Loadout');
    expect(loadout.useManualCost).toBe(false);
    expect(loadout.weaponEnhancerSlots).toBe(0);
    expect(loadout.createdAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('loadout storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('loadLoadouts returns empty array when no data', () => {
    expect(loadLoadouts()).toEqual([]);
  });

  it('saveLoadouts persists to localStorage', () => {
    const loadout = createLoadout('Test');
    saveLoadouts([loadout]);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'artemis-loadouts',
      expect.any(String)
    );
  });

  it('saveLoadout adds new loadout', () => {
    const loadout = createLoadout('New');
    const result = saveLoadout(loadout);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('New');
  });

  it('saveLoadout updates existing loadout', () => {
    const loadout = createLoadout('Original');
    saveLoadout(loadout);
    
    loadout.name = 'Updated';
    const result = saveLoadout(loadout);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Updated');
    expect(result[0].updatedAt).toBeGreaterThanOrEqual(loadout.createdAt);
  });

  it('deleteLoadout removes by ID', () => {
    const loadout1 = createLoadout('Keep');
    const loadout2 = createLoadout('Delete');
    saveLoadouts([loadout1, loadout2]);
    
    const result = deleteLoadout(loadout2.id);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Keep');
  });
});
