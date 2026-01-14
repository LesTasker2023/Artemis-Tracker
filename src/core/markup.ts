/**
 * ARTEMIS v3 - Markup System
 * Types and calculation logic for item markup tracking
 */

// ==================== Types ====================

/**
 * Individual item markup entry
 */
export interface ItemMarkupEntry {
  // Identifiers
  itemId?: string;              // Optional ID from API
  itemName: string;             // Display name (primary key)
  name: string;                 // Alias for itemName (for UI compatibility)
  
  // TT Reference
  ttValue?: number;             // TT buyback value (from API)
  
  // Markup Configuration
  markupValue?: number;         // Fixed markup in PED (absolute)
  markupPercent?: number;       // Percentage markup (0-100 where 100 = no markup, 150 = 50% markup)
  useFixed?: boolean;           // If true, use markupValue instead of markupPercent
  
  // Metadata
  itemType?: string;            // Material, Weapon, Armor, etc.
  category?: string;            // Category for grouping (alias for itemType)
  weight?: number;              // Weight in PU
  source: 'api' | 'manual' | 'static';  // Populated from bundled data, API, or user entry
  lastUpdated: string | number; // Timestamp
  userNotes?: string;           // Custom notes
  notes?: string;               // Alias for userNotes
  
  // UI State
  favorite?: boolean;           // User marked as favorite
  isCustom?: boolean;           // Has user-customized markup
}

/**
 * Stats about the markup library
 */
export interface MarkupStats {
  totalItems: number;
  customItems: number;
  categoryCounts: Record<string, number>;
  averageMarkup: number;
  lastSynced: string | null;
}

/**
 * Default markup configuration
 */
export interface DefaultMarkupConfig {
  percent: number;                                    // Default % if not specified (100 = no markup)
  fallbackStrategy: 'tt' | 'default' | 'zero';       // What to use if no markup configured
}

/**
 * Complete markup library structure
 */
export interface MarkupLibrary {
  items: Record<string, ItemMarkupEntry>;            // Keyed by itemName
  lastSynced: number;                                // When API was last fetched
  version: number;                                   // Schema version for migrations
  defaultMarkup: DefaultMarkupConfig;
}

/**
 * User's custom markup config
 */
export interface MarkupConfig {
  customItems: Record<string, Partial<ItemMarkupEntry>>;  // User overrides
  defaultMarkup: DefaultMarkupConfig;
  lastModified: number;
  // Additional settings for UI
  enabled: boolean;                                  // Whether markup is enabled
  defaultMarkupPercent: number;                      // Default markup % for unknown items
  showMarkupInUI: boolean;                           // Show markup values in UI
  autoSyncEnabled: boolean;                          // Auto-sync from API
  lastSynced: string | null;                         // ISO timestamp of last sync
}

/**
 * API response item structure from entropianexus
 */
export interface APIItem {
  Id: number;
  Name: string;
  Properties: {
    Type: string;
    Weight?: number | null;
    Economy?: {
      Value?: number | null;
    };
  };
  Links?: {
    $Url?: string;
  };
}

/**
 * Result of markup calculation
 */
export interface MarkupResult {
  ttValue: number;
  markupValue: number;
  totalValue: number;
  markupPercent: number;
  source: 'configured' | 'default' | 'none';
}

/**
 * Sync status for UI display
 */
export interface SyncStatus {
  syncing: boolean;
  lastSync: number | null;
  itemCount: number;
  error?: string;
}

// ==================== Default Values ====================

export const DEFAULT_MARKUP_CONFIG: DefaultMarkupConfig = {
  percent: 0,
  fallbackStrategy: 'tt',
};

export const EMPTY_MARKUP_LIBRARY: MarkupLibrary = {
  items: {},
  lastSynced: 0,
  version: 1,
  defaultMarkup: DEFAULT_MARKUP_CONFIG,
};

export const EMPTY_MARKUP_CONFIG: MarkupConfig = {
  customItems: {},
  defaultMarkup: DEFAULT_MARKUP_CONFIG,
  lastModified: 0,
  enabled: true,
  defaultMarkupPercent: 100,
  showMarkupInUI: true,
  autoSyncEnabled: false,
  lastSynced: null,
};

// ==================== Calculation Functions ====================

/**
 * Calculate markup value for a single item
 */
export function calculateMarkupValue(
  itemName: string,
  ttValue: number,
  library: MarkupLibrary,
  config: MarkupConfig
): MarkupResult {
  // Check for user override first
  const userOverride = config.customItems[itemName];
  const libraryEntry = library.items[itemName];
  
  // Merge: user override takes precedence
  const entry: Partial<ItemMarkupEntry> | undefined = userOverride 
    ? { ...libraryEntry, ...userOverride }
    : libraryEntry;
  
  // If item has specific markup configured
  if (entry) {
    // Check for percentage markup first
    // markupPercent is the TOTAL percentage (e.g., 120 = 120% of TT = 20% markup above TT)
    if (entry.markupPercent !== undefined && entry.markupPercent > 0) {
      // Total value is TT * (percent/100), markup is the difference from TT
      const totalValue = ttValue * (entry.markupPercent / 100);
      const markupValue = totalValue - ttValue;
      return {
        ttValue,
        markupValue,
        totalValue,
        markupPercent: entry.markupPercent,
        source: 'configured',
      };
    }
    
    // Check for fixed markup value
    if (entry.markupValue !== undefined && entry.markupValue > 0) {
      // Calculate effective percentage for display
      const effectivePercent = ttValue > 0 ? (entry.markupValue / ttValue) * 100 : 0;
      return {
        ttValue,
        markupValue: entry.markupValue,
        totalValue: ttValue + entry.markupValue,
        markupPercent: effectivePercent,
        source: 'configured',
      };
    }
  }
  
  // Fall back to default markup settings
  const defaultConfig = config.defaultMarkup.percent > 0 
    ? config.defaultMarkup 
    : library.defaultMarkup;
  
  if (defaultConfig.fallbackStrategy === 'default' && defaultConfig.percent > 0) {
    // defaultConfig.percent is the TOTAL percentage (e.g., 110 = 110% of TT)
    const totalValue = ttValue * (defaultConfig.percent / 100);
    const markupValue = totalValue - ttValue;
    return {
      ttValue,
      markupValue,
      totalValue,
      markupPercent: defaultConfig.percent,
      source: 'default',
    };
  }
  
  // No markup - return TT value only
  return {
    ttValue,
    markupValue: 0,
    totalValue: ttValue,
    markupPercent: 0,
    source: 'none',
  };
}

/**
 * Calculate total markup for a loot breakdown
 * Overloaded to support both detailed loot data and simple item/value pairs
 */
export function calculateLootMarkup(
  lootItems: Array<{ itemName: string; value: number }> | Record<string, { itemName: string; totalValue: number; quantity: number }>,
  library: MarkupLibrary,
  defaultMarkupPercent: number = 100
): {
  totalTT: number;
  totalMarkup: number;
  totalWithMarkup: number;
  itemBreakdown: Record<string, MarkupResult & { quantity: number }>;
} {
  let totalTT = 0;
  let totalMarkup = 0;
  const itemBreakdown: Record<string, MarkupResult & { quantity: number }> = {};
  
  // Create a simple config using the default markup percent
  const simpleConfig: MarkupConfig = {
    ...EMPTY_MARKUP_CONFIG,
    defaultMarkup: {
      percent: defaultMarkupPercent,
      fallbackStrategy: defaultMarkupPercent > 100 ? 'default' : 'tt',
    },
    defaultMarkupPercent,
  };
  
  // Handle array input (simple format from session.ts)
  if (Array.isArray(lootItems)) {
    for (const item of lootItems) {
      const result = calculateMarkupValue(item.itemName, item.value, library, simpleConfig);
      totalTT += result.ttValue;
      totalMarkup += result.markupValue;
      
      if (itemBreakdown[item.itemName]) {
        // Accumulate for same item
        itemBreakdown[item.itemName].ttValue += result.ttValue;
        itemBreakdown[item.itemName].markupValue += result.markupValue;
        itemBreakdown[item.itemName].totalValue += result.totalValue;
        itemBreakdown[item.itemName].quantity += 1;
      } else {
        itemBreakdown[item.itemName] = {
          ...result,
          quantity: 1,
        };
      }
    }
  } else {
    // Handle Record input (detailed format)
    for (const [itemName, item] of Object.entries(lootItems)) {
      const result = calculateMarkupValue(itemName, item.totalValue, library, simpleConfig);
      totalTT += result.ttValue;
      totalMarkup += result.markupValue;
      itemBreakdown[itemName] = {
        ...result,
        quantity: item.quantity,
      };
    }
  }
  
  return {
    totalTT,
    totalMarkup,
    totalWithMarkup: totalTT + totalMarkup,
    itemBreakdown,
  };
}

// ==================== API Transformation ====================

/**
 * Transform API response to ItemMarkupEntry
 */
export function apiItemToEntry(apiItem: APIItem): ItemMarkupEntry {
  const itemName = apiItem.Name;
  return {
    itemId: apiItem.Id.toString(),
    itemName,
    name: itemName,  // UI alias
    ttValue: apiItem.Properties.Economy?.Value ?? undefined,
    markupPercent: 100,  // Default 100% = TT value only (no markup)
    itemType: apiItem.Properties.Type,
    category: apiItem.Properties.Type,  // UI alias
    weight: apiItem.Properties.Weight ?? undefined,
    source: 'api',
    lastUpdated: new Date().toISOString(),
    favorite: false,
    isCustom: false,
  };
}

/**
 * Transform API response array to MarkupLibrary items
 */
export function apiItemsToLibrary(apiItems: APIItem[]): Record<string, ItemMarkupEntry> {
  const items: Record<string, ItemMarkupEntry> = {};
  
  for (const apiItem of apiItems) {
    const entry = apiItemToEntry(apiItem);
    items[entry.itemName] = entry;
  }
  
  return items;
}

/**
 * Get statistics about the markup library
 */
export function getMarkupStats(library: MarkupLibrary): MarkupStats {
  const items = Object.values(library.items);
  const customItems = items.filter(item => item.isCustom);
  
  // Count by category
  const categoryCounts: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  
  // Calculate average markup (excluding 100% which means no markup)
  const itemsWithMarkup = items.filter(item => item.markupPercent && item.markupPercent !== 100);
  const averageMarkup = itemsWithMarkup.length > 0
    ? itemsWithMarkup.reduce((sum, item) => sum + (item.markupPercent || 100), 0) / itemsWithMarkup.length
    : 100;
  
  return {
    totalItems: items.length,
    customItems: customItems.length,
    categoryCounts,
    averageMarkup,
    lastSynced: library.lastSynced ? new Date(library.lastSynced).toISOString() : null,
  };
}

// ==================== Merge Functions ====================

/**
 * Merge API library with user config
 */
export function mergeLibraryWithConfig(
  library: MarkupLibrary,
  config: MarkupConfig
): MarkupLibrary {
  const merged: MarkupLibrary = {
    ...library,
    defaultMarkup: config.defaultMarkup.percent > 0 
      ? config.defaultMarkup 
      : library.defaultMarkup,
  };
  
  // Apply user overrides to items
  for (const [itemName, override] of Object.entries(config.customItems)) {
    if (merged.items[itemName]) {
      merged.items[itemName] = {
        ...merged.items[itemName],
        ...override,
        source: 'manual', // Mark as manually modified
        isCustom: true,
      };
    } else {
      // New item added by user
      merged.items[itemName] = {
        itemName,
        name: itemName,  // Required field
        source: 'manual',
        lastUpdated: new Date(config.lastModified).toISOString(),
        markupPercent: 100,
        favorite: false,
        isCustom: true,
        ...override,
      };
    }
  }
  
  return merged;
}

// ==================== Utility Functions ====================

/**
 * Search items in library
 */
export function searchItems(
  library: MarkupLibrary,
  query: string,
  options?: {
    limit?: number;
    itemType?: string;
    hasMarkup?: boolean;
  }
): ItemMarkupEntry[] {
  const lowerQuery = query.toLowerCase();
  let results = Object.values(library.items)
    .filter(item => item.itemName.toLowerCase().includes(lowerQuery));
  
  if (options?.itemType) {
    results = results.filter(item => item.itemType === options.itemType);
  }
  
  if (options?.hasMarkup !== undefined) {
    if (options.hasMarkup) {
      results = results.filter(item => 
        (item.markupPercent !== undefined && item.markupPercent > 0) ||
        (item.markupValue !== undefined && item.markupValue > 0)
      );
    } else {
      results = results.filter(item => 
        (item.markupPercent === undefined || item.markupPercent === 0) &&
        (item.markupValue === undefined || item.markupValue === 0)
      );
    }
  }
  
  // Sort by relevance (exact match first, then alphabetical)
  results.sort((a, b) => {
    const aExact = a.itemName.toLowerCase() === lowerQuery;
    const bExact = b.itemName.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.itemName.localeCompare(b.itemName);
  });
  
  if (options?.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
}

/**
 * Get unique item types from library
 */
export function getItemTypes(library: MarkupLibrary): string[] {
  const types = new Set<string>();
  for (const item of Object.values(library.items)) {
    if (item.itemType) {
      types.add(item.itemType);
    }
  }
  return Array.from(types).sort();
}

/**
 * Export config to CSV format
 */
export function exportToCSV(library: MarkupLibrary): string {
  const headers = ['Item Name', 'TT Value', 'Markup %', 'Markup PED', 'Item Type', 'Source'];
  const rows = [headers.join(',')];
  
  for (const item of Object.values(library.items)) {
    const row = [
      `"${item.itemName.replace(/"/g, '""')}"`,
      item.ttValue?.toFixed(4) ?? '',
      item.markupPercent?.toString() ?? '',
      item.markupValue?.toFixed(4) ?? '',
      item.itemType ?? '',
      item.source,
    ];
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

/**
 * Parse CSV to config overrides
 */
export function parseCSV(csv: string): Record<string, Partial<ItemMarkupEntry>> {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) return {};
  
  const result: Record<string, Partial<ItemMarkupEntry>> = {};
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parsing (handles quoted strings with commas)
    const match = line.match(/^"([^"]+)"|^([^,]+)/);
    if (!match) continue;
    
    const parts = line.split(',');
    const itemName = (match[1] || match[2]).trim();
    
    if (itemName) {
      const entry: Partial<ItemMarkupEntry> = {};
      
      // Parse markup percent (column 3)
      if (parts[2] && parts[2].trim()) {
        entry.markupPercent = parseFloat(parts[2]);
      }
      
      // Parse markup value (column 4)
      if (parts[3] && parts[3].trim()) {
        entry.markupValue = parseFloat(parts[3]);
      }
      
      if (entry.markupPercent !== undefined || entry.markupValue !== undefined) {
        result[itemName] = entry;
      }
    }
  }
  
  return result;
}
