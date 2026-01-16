/**
 * LoadoutManager - Type Definitions
 */

import type { Loadout } from "../../core/loadout";

export type SortBy = "name-asc" | "name-desc" | "cost-high" | "cost-low" | "newest" | "oldest";
export type FilterMode = "all" | "active" | "favorites";

export interface LoadoutManagerProps {
  onLoadoutChange?: () => void;
}

export interface FilterState {
  mode: FilterMode;
  searchQuery: string;
  sortBy: SortBy;
}

export interface LoadoutWithMeta extends Loadout {
  isFavorite?: boolean;
  isActive?: boolean;
}