/**
 * Equipment Database - Loads and indexes equipment data for autocomplete
 * Data sourced from Entropia Universe item database
 */

// ==================== Types ====================

export interface DamageRecord {
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

export interface EquipmentRecord {
  id: number;
  name: string;
  type?: string;
  category?: string;
  decay: number;       // PED per shot (stored internally, displayed as PEC in UI)
  ammoBurn: number;    // Raw ammo burn (multiply by 0.0001 for PED)
  damage?: DamageRecord;
}

interface RawDamageData {
  Stab?: number | null;
  Cut?: number | null;
  Impact?: number | null;
  Penetration?: number | null;
  Shrapnel?: number | null;
  Burn?: number | null;
  Cold?: number | null;
  Acid?: number | null;
  Electric?: number | null;
}

interface RawEquipmentData {
  Id: number;
  ItemId?: number;
  Name: string;
  Properties?: {
    Type?: string;
    Category?: string;
    Economy?: {
      Decay?: number;
      AmmoBurn?: number;
    };
    Damage?: RawDamageData;
  };
}

// ==================== Equipment Database ====================

class EquipmentDB {
  private weapons: EquipmentRecord[] = [];
  private amps: EquipmentRecord[] = [];
  private scopes: EquipmentRecord[] = [];
  private sights: EquipmentRecord[] = [];
  private loaded = false;

  /**
   * Load all equipment data (call from main process, send to renderer)
   */
  async loadFromFiles(): Promise<void> {
    if (this.loaded) return;

    try {
      // These will be loaded via IPC from main process
      const [weaponsData, ampsData, scopesData, sightsData] = await Promise.all([
        this.fetchJson('weapons'),
        this.fetchJson('amps'),
        this.fetchJson('scopes'),
        this.fetchJson('sights'),
      ]);

      this.weapons = this.parseEquipment(weaponsData, 'weapon');
      this.amps = this.parseEquipment(ampsData, 'amp');
      this.scopes = this.parseEquipment(scopesData, 'scope');
      this.sights = this.parseEquipment(sightsData, 'sight');
      this.loaded = true;
    } catch (err) {
      // Failed to load equipment data
    }
  }

  /**
   * Initialize from pre-loaded data (renderer process)
   */
  initFromData(data: {
    weapons: EquipmentRecord[];
    amps: EquipmentRecord[];
    scopes: EquipmentRecord[];
    sights: EquipmentRecord[];
  }): void {
    this.weapons = data.weapons;
    this.amps = data.amps;
    this.scopes = data.scopes;
    this.sights = data.sights;
    this.loaded = true;
  }

  private async fetchJson(type: string): Promise<RawEquipmentData[]> {
    // In renderer, request via IPC
    if (window.electron?.equipment) {
      return window.electron.equipment.load(type) as Promise<RawEquipmentData[]>;
    }
    return [];
  }

  private parseEquipment(data: RawEquipmentData[], equipType: string): EquipmentRecord[] {
    return data
      .filter(item => item.Name && item.Properties?.Economy)
      .map(item => {
        const record: EquipmentRecord = {
          id: item.Id,
          name: item.Name,
          type: item.Properties?.Type ?? equipType,
          category: item.Properties?.Category,
          decay: (item.Properties?.Economy?.Decay ?? 0) / 100,  // Convert PEC to PED at source
          ammoBurn: item.Properties?.Economy?.AmmoBurn ?? 0,
        };
        
        // Add damage properties if present (weapons and amps)
        const dmg = item.Properties?.Damage;
        if (dmg) {
          record.damage = {
            stab: dmg.Stab ?? 0,
            cut: dmg.Cut ?? 0,
            impact: dmg.Impact ?? 0,
            penetration: dmg.Penetration ?? 0,
            shrapnel: dmg.Shrapnel ?? 0,
            burn: dmg.Burn ?? 0,
            cold: dmg.Cold ?? 0,
            acid: dmg.Acid ?? 0,
            electric: dmg.Electric ?? 0,
          };
        }
        
        return record;
      });
  }

  /**
   * Search equipment by name (fuzzy match)
   */
  search(query: string, type: 'weapon' | 'amp' | 'scope' | 'sight'): EquipmentRecord[] {
    if (!query.trim()) return [];
    
    const list = this.getList(type);
    const q = query.toLowerCase();
    
    return list
      .filter(item => item.name.toLowerCase().includes(q))
      .slice(0, 20);
  }

  /**
   * Find exact equipment by name
   */
  findByName(name: string, type: 'weapon' | 'amp' | 'scope' | 'sight'): EquipmentRecord | undefined {
    const list = this.getList(type);
    return list.find(item => item.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Get all names for a type (for autocomplete suggestions)
   */
  getAllNames(type: 'weapon' | 'amp' | 'scope' | 'sight'): string[] {
    return this.getList(type).map(item => item.name);
  }

  private getList(type: 'weapon' | 'amp' | 'scope' | 'sight'): EquipmentRecord[] {
    switch (type) {
      case 'weapon': return this.weapons;
      case 'amp': return this.amps;
      case 'scope': return this.scopes;
      case 'sight': return this.sights;
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

// Singleton instance
export const equipmentDB = new EquipmentDB();
