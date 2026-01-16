/**
 * ARTEMIS v3 - Markup Storage
 * Persists markup library and config to JSON files
 */

import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import type {
  MarkupLibrary,
  MarkupConfig,
  APIItem,
  ItemMarkupEntry,
  DefaultMarkupConfig,
} from "../src/core/markup";

const MARKUP_DIR = "markup";
const LIBRARY_FILE = "markupLibrary.json";
const CONFIG_FILE = "markupConfig.json";

// Static items data file shipped with the app
const ITEMS_DATA_FILE = "entropia-items.json";

// Default values
const DEFAULT_MARKUP_CONFIG: DefaultMarkupConfig = {
  percent: 0,
  fallbackStrategy: "tt",
};

const EMPTY_MARKUP_LIBRARY: MarkupLibrary = {
  items: {},
  lastSynced: 0,
  version: 1,
  defaultMarkup: DEFAULT_MARKUP_CONFIG,
};

const EMPTY_MARKUP_CONFIG: MarkupConfig = {
  customItems: {},
  defaultMarkup: DEFAULT_MARKUP_CONFIG,
  lastModified: 0,
  enabled: true,
  defaultMarkupPercent: 100,
  showMarkupInUI: true,
  autoSyncEnabled: false,
  lastSynced: null,
};

// ==================== Path Helpers ====================

function getMarkupDir(): string {
  const userDataPath = app.getPath("userData");
  const markupPath = path.join(userDataPath, MARKUP_DIR);

  if (!fs.existsSync(markupPath)) {
    fs.mkdirSync(markupPath, { recursive: true });
  }

  return markupPath;
}

function getLibraryPath(): string {
  return path.join(getMarkupDir(), LIBRARY_FILE);
}

function getConfigPath(): string {
  return path.join(getMarkupDir(), CONFIG_FILE);
}

// ==================== Library Operations ====================

/**
 * Map raw API item types to friendly display names
 */
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  Absorber: "Absorbers",
  Armor: "Armor",
  ArmorPlating: "Armor Plates",
  Blueprint: "Blueprints",
  BlueprintBook: "Blueprint Books",
  Capsule: "Capsules",
  Clothing: "Clothing",
  Consumable: "Consumables",
  Decoration: "Decorations",
  EffectChip: "Effect Chips",
  Enhancer: "Enhancer",
  Excavator: "Excavators",
  Finder: "Finders",
  FinderAmplifier: "Finder Amps",
  Furniture: "Furniture",
  Material: "Materials",
  MedicalChip: "Heal Chips",
  MedicalTool: "F.A.Ps",
  MindforceImplant: "Mindforce Implants",
  MiscTool: "Misc Tools",
  Pet: "Pets",
  Refiner: "Refiners",
  Scanner: "Scanners",
  Sign: "Signs",
  StorageContainer: "Storage Container",
  TeleportationChip: "TP Chips",
  Vehicle: "Vehicles",
  Weapon: "Weapons",
  WeaponAmplifier: "Weapon Amps",
  WeaponVisionAttachment: "Scopes & Sights",
};

function getCategoryDisplayName(rawType: string | undefined): string {
  if (!rawType) return "Unknown";
  return CATEGORY_DISPLAY_NAMES[rawType] ?? rawType;
}

/**
 * Migrate old raw category names to friendly display names
 */
function migrateCategories(library: MarkupLibrary): boolean {
  let migrated = false;
  for (const item of Object.values(library.items)) {
    // If category matches a raw type name, convert it
    if (item.category && CATEGORY_DISPLAY_NAMES[item.category]) {
      item.category = CATEGORY_DISPLAY_NAMES[item.category];
      migrated = true;
    }
    // Also migrate itemType to category if category is missing
    if (!item.category && item.itemType) {
      item.category = getCategoryDisplayName(item.itemType);
      migrated = true;
    }
  }
  return migrated;
}

/**
 * Load markup library from disk
 */
export function loadMarkupLibrary(): MarkupLibrary {
  const filePath = getLibraryPath();

  if (!fs.existsSync(filePath)) {
    return EMPTY_MARKUP_LIBRARY;
  }

  try {
    const json = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(json) as MarkupLibrary;
    
    // Ensure version compatibility
    if (!data.version) {
      data.version = 1;
    }
    if (!data.defaultMarkup) {
      data.defaultMarkup = DEFAULT_MARKUP_CONFIG;
    }
    
    // Migrate old raw category names to friendly names
    if (migrateCategories(data)) {
      console.log("[MarkupStore] Migrated category names to friendly format");
      saveMarkupLibrary(data);
    }
    
    return data;
  } catch (err) {
    console.error("[MarkupStore] Failed to load library:", err);
    return EMPTY_MARKUP_LIBRARY;
  }
}

/**
 * Save markup library to disk
 */
export function saveMarkupLibrary(library: MarkupLibrary): void {
  const filePath = getLibraryPath();
  fs.writeFileSync(filePath, JSON.stringify(library, null, 2), "utf8");
}

// ==================== Config Operations ====================

/**
 * Load user markup config from disk
 */
export function loadMarkupConfig(): MarkupConfig {
  const filePath = getConfigPath();

  if (!fs.existsSync(filePath)) {
    return EMPTY_MARKUP_CONFIG;
  }

  try {
    const json = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(json) as MarkupConfig;
    
    // Ensure required fields exist
    if (!data.defaultMarkup) {
      data.defaultMarkup = DEFAULT_MARKUP_CONFIG;
    }
    if (!data.customItems) {
      data.customItems = {};
    }
    
    return data;
  } catch (err) {
    console.error("[MarkupStore] Failed to load config:", err);
    return EMPTY_MARKUP_CONFIG;
  }
}

/**
 * Save user markup config to disk
 */
export function saveMarkupConfig(config: MarkupConfig): void {
  const filePath = getConfigPath();
  config.lastModified = Date.now();
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
}

/**
 * Update a single item's markup in both config and library
 * Returns the updated ItemMarkupEntry
 */
export function updateItemMarkup(
  itemName: string,
  markup: Partial<ItemMarkupEntry>
): ItemMarkupEntry | null {
  // Update config (for persistence of user customizations)
  const config = loadMarkupConfig();
  
  config.customItems[itemName] = {
    ...config.customItems[itemName],
    ...markup,
  };
  config.lastModified = Date.now();
  
  saveMarkupConfig(config);

  // Also update the library file so changes are reflected immediately
  const library = loadMarkupLibrary();
  
  if (library.items[itemName]) {
    library.items[itemName] = {
      ...library.items[itemName],
      ...markup,
    };
    saveMarkupLibrary(library);
    return library.items[itemName];
  }
  
  return null;
}

/**
 * Remove a custom item markup from config
 */
export function removeItemMarkup(itemName: string): MarkupConfig {
  const config = loadMarkupConfig();
  
  delete config.customItems[itemName];
  config.lastModified = Date.now();
  
  saveMarkupConfig(config);
  return config;
}

/**
 * Update default markup settings
 */
export function updateDefaultMarkup(
  defaultMarkup: DefaultMarkupConfig
): MarkupConfig {
  const config = loadMarkupConfig();
  config.defaultMarkup = defaultMarkup;
  config.lastModified = Date.now();
  
  saveMarkupConfig(config);
  return config;
}

// ==================== API Sync ====================

/**
 * Transform API item to library entry
 */
function apiItemToEntry(apiItem: APIItem): ItemMarkupEntry {
  const itemName = apiItem.Name;
  const rawType = apiItem.Properties.Type;
  return {
    itemId: apiItem.Id.toString(),
    itemName,
    name: itemName,  // UI alias
    ttValue: apiItem.Properties.Economy?.Value ?? undefined,
    markupPercent: 100,  // Default 100% = TT value only
    itemType: rawType,
    category: getCategoryDisplayName(rawType),
    weight: apiItem.Properties.Weight ?? undefined,
    source: "static",
    lastUpdated: new Date().toISOString(),
    favorite: false,
    isCustom: false,
  };
}

/**
 * Get the path to the static items data file shipped with the app
 */
function getStaticItemsPath(): string {
  // In development: look in the data folder in the workspace
  // In production: look in the resources/data folder
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(app.getAppPath(), "data", ITEMS_DATA_FILE);
  } else {
    return path.join(process.resourcesPath, "data", ITEMS_DATA_FILE);
  }
}

/**
 * Load items from static JSON file shipped with the app
 */
export function loadItemsFromStaticFile(): {
  success: boolean;
  items?: APIItem[];
  error?: string;
} {
  try {
    const filePath = getStaticItemsPath();
    console.log("[MarkupStore] Loading items from static file:", filePath);
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Items file not found: ${filePath}` };
    }

    const json = fs.readFileSync(filePath, "utf8");
    const items = JSON.parse(json) as APIItem[];
    console.log(`[MarkupStore] Loaded ${items.length} items from static file`);
    
    return { success: true, items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MarkupStore] Failed to load items file:", message);
    return { success: false, error: message };
  }
}

/**
 * Sync library from static items file
 * This loads the bundled items database and updates the markup library
 */
export async function syncFromAPI(): Promise<{
  success: boolean;
  itemCount?: number;
  error?: string;
}> {
  const result = loadItemsFromStaticFile();
  
  if (!result.success || !result.items) {
    return { success: false, error: result.error };
  }

  // Load existing library to preserve user customizations
  const existingLibrary = loadMarkupLibrary();
  
  // Build new items map
  const newItems: Record<string, ItemMarkupEntry> = {};
  
  for (const apiItem of result.items) {
    const entry = apiItemToEntry(apiItem);
    
    // Preserve any existing markup settings from the old library
    const existing = existingLibrary.items[entry.itemName];
    if (existing) {
      entry.markupPercent = existing.markupPercent;
      entry.markupValue = existing.markupValue;
      entry.userNotes = existing.userNotes;
      entry.favorite = existing.favorite;
      // Keep manual source if it was manually edited
      if (existing.source === "manual") {
        entry.source = "manual";
      }
    }
    
    newItems[entry.itemName] = entry;
  }

  // Create updated library
  const updatedLibrary: MarkupLibrary = {
    items: newItems,
    lastSynced: Date.now(),
    version: existingLibrary.version,
    defaultMarkup: existingLibrary.defaultMarkup,
  };

  saveMarkupLibrary(updatedLibrary);
  
  return { success: true, itemCount: Object.keys(newItems).length };
}

// ==================== Bulk Operations ====================

/**
 * Import markup config from CSV
 */
export function importFromCSV(csvContent: string): {
  success: boolean;
  imported?: number;
  error?: string;
} {
  try {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      return { success: false, error: "CSV file is empty or has no data rows" };
    }

    const config = loadMarkupConfig();
    let imported = 0;

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Parse CSV line (handles quoted strings)
      const parts: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          parts.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      const itemName = parts[0]?.replace(/^"|"$/g, "");
      if (!itemName) continue;

      const markupPercent = parts[2] ? parseFloat(parts[2]) : undefined;
      const markupValue = parts[3] ? parseFloat(parts[3]) : undefined;

      if (
        (markupPercent !== undefined && !isNaN(markupPercent)) ||
        (markupValue !== undefined && !isNaN(markupValue))
      ) {
        config.customItems[itemName] = {
          ...config.customItems[itemName],
          markupPercent: markupPercent !== undefined && !isNaN(markupPercent) ? markupPercent : undefined,
          markupValue: markupValue !== undefined && !isNaN(markupValue) ? markupValue : undefined,
        };
        imported++;
      }
    }

    config.lastModified = Date.now();
    saveMarkupConfig(config);

    return { success: true, imported };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Export library to CSV
 */
export function exportToCSV(): string {
  const library = loadMarkupLibrary();
  const config = loadMarkupConfig();
  
  const headers = ["Item Name", "TT Value", "Markup %", "Markup PED", "Item Type", "Source"];
  const rows = [headers.join(",")];

  for (const item of Object.values(library.items)) {
    // Apply user config overrides
    const override = config.customItems[item.itemName];
    const markupPercent = override?.markupPercent ?? item.markupPercent;
    const markupValue = override?.markupValue ?? item.markupValue;
    
    const row = [
      `"${item.itemName.replace(/"/g, '""')}"`,
      item.ttValue?.toFixed(4) ?? "",
      markupPercent?.toString() ?? "",
      markupValue?.toFixed(4) ?? "",
      item.itemType ?? "",
      override ? "manual" : item.source,
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Apply default markup to all unconfigured items
 */
export function applyDefaultToAll(markupPercent: number): {
  success: boolean;
  updated: number;
} {
  const library = loadMarkupLibrary();
  const config = loadMarkupConfig();
  let updated = 0;

  for (const item of Object.values(library.items)) {
    // Skip items that already have markup configured
    const hasExisting = 
      config.customItems[item.itemName]?.markupPercent !== undefined ||
      config.customItems[item.itemName]?.markupValue !== undefined ||
      item.markupPercent !== undefined ||
      item.markupValue !== undefined;
    
    if (!hasExisting) {
      config.customItems[item.itemName] = {
        ...config.customItems[item.itemName],
        markupPercent,
      };
      updated++;
    }
  }

  config.lastModified = Date.now();
  saveMarkupConfig(config);

  return { success: true, updated };
}

/**
 * Apply markup to items of a specific type
 */
export function applyMarkupByType(
  itemType: string,
  markupPercent: number
): {
  success: boolean;
  updated: number;
} {
  const library = loadMarkupLibrary();
  const config = loadMarkupConfig();
  let updated = 0;

  for (const item of Object.values(library.items)) {
    if (item.itemType === itemType) {
      config.customItems[item.itemName] = {
        ...config.customItems[item.itemName],
        markupPercent,
      };
      updated++;
    }
  }

  config.lastModified = Date.now();
  saveMarkupConfig(config);

  return { success: true, updated };
}

/**
 * Clear all custom markup settings
 */
export function clearAllCustomMarkup(): void {
  const config: MarkupConfig = {
    ...EMPTY_MARKUP_CONFIG,
    customItems: {},
    lastModified: Date.now(),
  };
  saveMarkupConfig(config);
}

// ==================== Search & Query ====================

/**
 * Search items in library
 */
export function searchItems(
  query: string,
  options?: {
    limit?: number;
    category?: string;
    hasMarkup?: boolean;
  }
): ItemMarkupEntry[] {
  const library = loadMarkupLibrary();
  const config = loadMarkupConfig();
  const lowerQuery = query.toLowerCase();
  
  let results = Object.values(library.items).filter((item) =>
    item.itemName.toLowerCase().includes(lowerQuery)
  );

  // Filter by category (friendly display name)
  if (options?.category) {
    results = results.filter((item) => item.category === options.category);
  }

  if (options?.hasMarkup !== undefined) {
    results = results.filter((item) => {
      const override = config.customItems[item.itemName];
      const hasMarkup =
        (override?.markupPercent !== undefined && override.markupPercent > 0) ||
        (override?.markupValue !== undefined && override.markupValue > 0) ||
        (item.markupPercent !== undefined && item.markupPercent > 0) ||
        (item.markupValue !== undefined && item.markupValue > 0);
      return options.hasMarkup ? hasMarkup : !hasMarkup;
    });
  }

  // Sort by relevance
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

  // Apply config overrides to results
  return results.map((item) => {
    const override = config.customItems[item.itemName];
    if (override) {
      return { ...item, ...override, source: "manual" as const };
    }
    return item;
  });
}

/**
 * Get unique item types from library
 */
export function getItemTypes(): string[] {
  const library = loadMarkupLibrary();
  const types = new Set<string>();
  
  for (const item of Object.values(library.items)) {
    if (item.itemType) {
      types.add(item.itemType);
    }
  }
  
  return Array.from(types).sort();
}

/**
 * Get markup statistics
 */
export function getMarkupStats(): {
  totalItems: number;
  customItems: number;
  categoryCounts: Record<string, number>;
  averageMarkup: number;
  lastSynced: string | null;
} {
  const library = loadMarkupLibrary();
  const config = loadMarkupConfig();
  const items = Object.values(library.items);

  let customItems = 0;
  const categoryCounts: Record<string, number> = {};
  let totalMarkup = 0;
  let markupCount = 0;

  for (const item of items) {
    // Count custom items (user-modified or manually added)
    const override = config.customItems[item.itemName];
    if (override || item.source === "manual") {
      customItems++;
    }
    
    // Count by category
    const category = item.category || item.itemType || "Unknown";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    
    // Calculate average markup
    const markup = override?.markupPercent ?? item.markupPercent ?? 100;
    if (markup !== 100) {
      totalMarkup += markup;
      markupCount++;
    }
  }

  return {
    totalItems: items.length,
    customItems,
    categoryCounts,
    averageMarkup: markupCount > 0 ? totalMarkup / markupCount : 100,
    lastSynced: library.lastSynced ? new Date(library.lastSynced).toISOString() : null,
  };
}

/**
 * Check if an item exists in the library
 */
export function itemExists(itemName: string): boolean {
  const library = loadMarkupLibrary();
  return !!library.items[itemName];
}

/**
 * Manually add a new item to the markup library
 * Used for items discovered in-game that don't exist in the database
 */
export function addManualItem(
  itemName: string,
  ttValue: number,
  markupPercent?: number,
  markupValue?: number
): {
  success: boolean;
  item?: ItemMarkupEntry;
  error?: string;
} {
  try {
    const library = loadMarkupLibrary();
    
    // Check if item already exists
    if (library.items[itemName]) {
      return { 
        success: false, 
        error: 'Item already exists in library' 
      };
    }
    
    // Create new entry
    const newEntry: ItemMarkupEntry = {
      itemName,
      name: itemName,
      ttValue,
      markupPercent: markupPercent ?? 100,
      markupValue: markupValue,
      useFixed: markupValue !== undefined,
      itemType: 'Unknown',
      category: 'Unknown',
      source: 'manual',
      lastUpdated: new Date().toISOString(),
      favorite: false,
      isCustom: true,
      ignored: false,
    };
    
    // Add to library
    library.items[itemName] = newEntry;
    saveMarkupLibrary(library);
    
    console.log(`[MarkupStore] Manually added item: ${itemName}`);
    
    return { success: true, item: newEntry };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[MarkupStore] Failed to add manual item:', message);
    return { success: false, error: message };
  }
}

/**
 * Delete an item from the markup library
 * Used for testing or removing unwanted items
 */
export function deleteItem(itemName: string): {
  success: boolean;
  error?: string;
} {
  try {
    const library = loadMarkupLibrary();
    
    // Check if item exists
    if (!library.items[itemName]) {
      return { 
        success: false, 
        error: 'Item does not exist in library' 
      };
    }
    
    // Delete from library
    delete library.items[itemName];
    saveMarkupLibrary(library);
    
    // Also remove from config if present
    const config = loadMarkupConfig();
    if (config.customItems[itemName]) {
      delete config.customItems[itemName];
      saveMarkupConfig(config);
    }
    
    console.log(`[MarkupStore] Deleted item: ${itemName}`);
    
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[MarkupStore] Failed to delete item:', message);
    return { success: false, error: message };
  }
}
