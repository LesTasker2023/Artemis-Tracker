/**
 * MarkupManager - Type Definitions
 */

import type { ItemMarkupEntry } from "../../core/markup";

export type FilterMode = "session" | "custom" | "favorites" | "missing" | "hasMarkup" | "ignored" | null;
export type SortBy = "name" | "category" | "markup-high" | "markup-low" | "recent";

export interface MarkupManagerProps {
  onClose?: () => void;
  compact?: boolean;
  onMarkupChange?: () => void;
  sessionLoot?: Record<string, SessionLootItem>;
}

export interface SessionLootItem {
  itemName: string;
  count: number;
  totalValue: number;
  quantity: number;
}

export interface FilterState {
  mode: FilterMode;
  category: string | null;
  searchQuery: string;
  sortBy: SortBy;
}

export interface ItemWithMeta extends ItemMarkupEntry {
  isInSession?: boolean;
  needsMarkup?: boolean;
  quantity?: number;
  sessionValue?: number;
}

export interface MarkupFormData {
  ttValue: string;
  markupPercent: string;
  markupValue: string;
  useFixed: boolean;
  favorite: boolean;
  ignored: boolean;
}
