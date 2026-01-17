/**
 * SessionManager - Type Definitions
 */

import type { Session } from "../../core/session";
import type { SessionMeta } from "../../types/electron";
import type { MarkupLibrary } from "../../core/markup";

export type SortBy =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "duration-high"
  | "duration-low"
  | "profit-high"
  | "profit-low"
  | "return-high"
  | "return-low";
export type FilterMode = "all" | "active" | "completed";

export interface SessionManagerProps {
  onViewSession?: (session: Session) => void;
  onResumeSession?: (session: Session) => void;
  onForceStopAll?: () => Promise<void>;
  onStop?: () => void;
  activeSessionId?: string;
  activeSession?: Session | null;
  markupLibrary?: MarkupLibrary | null;
  onExpenseUpdate?: (expenses: {
    armorCost: number;
    fapCost: number;
    miscCost: number;
  }) => void;
}

export interface FilterState {
  mode: FilterMode;
  selectedTags: string[];
  selectedLoadoutIds: string[];
  searchQuery: string;
  sortBy: SortBy;
}

export interface SessionWithMeta extends SessionMeta {
  isActive?: boolean;
}
