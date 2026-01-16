/**
 * MarkupManager - Utility Functions
 */

import type { ItemMarkupEntry } from "../../core/markup";
import type { FilterState, ItemWithMeta, SessionLootItem, SortBy } from "./types";

/**
 * Enrich items with metadata (session presence, needs markup, etc.)
 */
export function enrichItems(
  items: Record<string, ItemMarkupEntry>,
  sessionLoot?: Record<string, SessionLootItem>
): ItemWithMeta[] {
  return Object.values(items).map((item) => ({
    ...item,
    isInSession: sessionLoot ? item.itemName in sessionLoot : false,
    needsMarkup: !item.markupPercent || item.markupPercent === 100,
  }));
}

/**
 * Filter items based on current filter state
 */
export function filterItems(
  items: ItemWithMeta[],
  filters: FilterState
): ItemWithMeta[] {
  let filtered = [...items];

  // Apply mode filter
  switch (filters.mode) {
    case "session":
      filtered = filtered.filter((item) => item.isInSession);
      break;
    case "custom":
      filtered = filtered.filter((item) => item.isCustom || item.source === "manual");
      break;
    case "favorites":
      filtered = filtered.filter((item) => item.favorite);
      break;
    case "missing":
      filtered = filtered.filter((item) => item.needsMarkup);
      break;
    case "ignored":
      filtered = filtered.filter((item) => item.ignored);
      break;
  }

  // Apply category filter
  if (filters.category) {
    filtered = filtered.filter((item) => item.category === filters.category);
  }

  // Apply search query
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter((item) =>
      item.itemName.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Sort items based on sort option
 */
export function sortItems(items: ItemWithMeta[], sortBy: SortBy): ItemWithMeta[] {
  const sorted = [...items];

  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => a.itemName.localeCompare(b.itemName));
      break;
    case "category":
      sorted.sort((a, b) => {
        const catA = a.category || "";
        const catB = b.category || "";
        return catA.localeCompare(catB) || a.itemName.localeCompare(b.itemName);
      });
      break;
    case "markup-high":
      sorted.sort((a, b) => {
        const markupA = a.markupPercent ?? 100;
        const markupB = b.markupPercent ?? 100;
        return markupB - markupA;
      });
      break;
    case "markup-low":
      sorted.sort((a, b) => {
        const markupA = a.markupPercent ?? 100;
        const markupB = b.markupPercent ?? 100;
        return markupA - markupB;
      });
      break;
    case "recent":
      sorted.sort((a, b) => {
        const dateA = new Date(a.lastUpdated).getTime();
        const dateB = new Date(b.lastUpdated).getTime();
        return dateB - dateA;
      });
      break;
  }

  return sorted;
}

/**
 * Get unique categories from items
 */
export function getCategories(items: ItemMarkupEntry[]): string[] {
  const categories = new Set<string>();
  items.forEach((item) => {
    if (item.category && item.category !== "Unknown") {
      categories.add(item.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Calculate stats for the library
 */
export function calculateStats(items: ItemMarkupEntry[], sessionLoot?: Record<string, SessionLootItem>) {
  const total = items.length;
  const configured = items.filter((item) => item.markupPercent && item.markupPercent !== 100).length;
  const favorites = items.filter((item) => item.favorite).length;
  const custom = items.filter((item) => item.isCustom || item.source === "manual").length;
  const sessionItems = sessionLoot ? items.filter((item) => item.itemName in sessionLoot).length : 0;

  return { total, configured, favorites, custom, sessionItems };
}

/**
 * Format markup display
 */
export function formatMarkup(item: ItemMarkupEntry): string {
  if (item.useFixed && item.markupValue !== undefined) {
    return `+${item.markupValue.toFixed(2)} PED`;
  }
  const percent = item.markupPercent ?? 100;
  return `${percent.toFixed(1)}%`;
}

/**
 * Get markup badge color based on value
 */
export function getMarkupColor(item: ItemMarkupEntry): string {
  const percent = item.markupPercent ?? 100;
  
  if (item.ignored) return "hsl(220 13% 40%)"; // Gray
  if (percent === 100) return "hsl(220 13% 50%)"; // Default gray
  if (percent > 100) return "hsl(142 71% 45%)"; // Green (profit)
  return "hsl(0 84% 60%)"; // Red (loss)
}
