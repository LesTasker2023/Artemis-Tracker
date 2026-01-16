/**
 * SessionManager - Type Definitions
 */

import type { Session, LoadoutBreakdown } from "../../core/session";
import type { SessionMeta } from "../../types/electron";

export type SortBy = "newest" | "oldest" | "name-asc" | "name-desc";
export type FilterMode = "all" | "active" | "completed";

export interface SessionManagerProps {
  onViewSession?: (session: Session) => void;
  onResumeSession?: (session: Session) => void;
  activeSessionId?: string;
  activeSession?: Session | null;
  onExpenseUpdate?: (expenses: {
    armorCost: number;
    fapCost: number;
    miscCost: number;
  }) => void;
}

export interface FilterState {
  mode: FilterMode;
  selectedTags: string[];
  searchQuery: string;
  sortBy: SortBy;
}

export interface SessionWithMeta extends SessionMeta {
  isActive?: boolean;
}
