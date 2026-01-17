/**
 * SessionManager - Session List Component
 * Middle panel showing the list of sessions
 */

import React from "react";
import { Clock, Target, Filter, Check, Trash2, Layers } from "lucide-react";
import type { SessionMeta } from "../../types/electron";
import { SessionCard } from "./SessionCard";

interface SessionStats {
  profit: number;
  profitWithMarkup: number;
  returnRate: number;
  returnRateWithMarkup: number;
  duration: number;
  lootValue?: number;
  totalCost?: number;
  manualExpenses?: number;
}

interface SessionListProps {
  sessions: SessionMeta[];
  selectedSessionId: string | null;
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  loading: boolean;
  totalCount: number;
  statsCache: Record<string, SessionStats>;
  showMarkup: boolean;
  applyExpenses: boolean;
  // Selection mode props
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelectionMode: () => void;
  onCheckChange: (id: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMassDelete: () => void;
  onMassCombine: () => void;
}

export function SessionList({
  sessions,
  selectedSessionId,
  activeSessionId,
  onSelectSession,
  loading,
  totalCount,
  statsCache,
  showMarkup,
  applyExpenses,
  selectionMode,
  selectedIds,
  onToggleSelectionMode,
  onCheckChange,
  onSelectAll,
  onDeselectAll,
  onMassDelete,
  onMassCombine,
}: SessionListProps) {
  if (loading) {
    return (
      <div style={styles.empty}>
        <Clock size={48} style={styles.emptyIcon} />
        <div style={styles.emptyTitle}>Loading sessions...</div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div style={styles.empty}>
        <Target size={48} style={styles.emptyIcon} />
        <div style={styles.emptyTitle}>No sessions yet</div>
        <div style={styles.emptySubtitle}>
          Start a hunting session to track your stats
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={styles.empty}>
        <Filter size={48} style={styles.emptyIcon} />
        <div style={styles.emptyTitle}>No sessions match filters</div>
        <div style={styles.emptySubtitle}>
          Try adjusting your filters or search query
        </div>
      </div>
    );
  }

  const allSelected =
    sessions.length > 0 && sessions.every((s) => selectedIds.has(s.id));

  return (
    <div style={styles.container}>
      {/* Selection toolbar */}
      {selectionMode && (
        <div style={styles.selectionToolbar}>
          <div style={styles.selectionLeft}>
            <div
              style={{
                ...styles.headerCheckbox,
                ...(allSelected ? styles.headerCheckboxChecked : {}),
              }}
              onClick={allSelected ? onDeselectAll : onSelectAll}
            >
              {allSelected && <Check size={12} strokeWidth={3} />}
            </div>
            <span style={styles.selectionCount}>
              {selectedIds.size} selected
            </span>
          </div>
          <div style={styles.selectionActions}>
            {selectedIds.size >= 2 && (
              <button
                style={styles.actionButton}
                onClick={onMassCombine}
                title="Combine selected sessions"
              >
                <Layers size={14} />
                Combine
              </button>
            )}
            {selectedIds.size >= 1 && (
              <button
                style={{ ...styles.actionButton, ...styles.deleteButton }}
                onClick={onMassDelete}
                title="Delete selected sessions"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
            <button style={styles.cancelButton} onClick={onToggleSelectionMode}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Column headers */}
      <div style={styles.header}>
        {!selectionMode && (
          <button
            style={styles.selectModeButton}
            onClick={onToggleSelectionMode}
            title="Select multiple sessions"
          >
            <Check size={14} />
          </button>
        )}
        <div style={styles.headerName}>Session</div>
        <div
          style={styles.headerStats}
          title={showMarkup ? "Profit with Markup" : "TT Profit"}
        >
          Profit
        </div>
        <div
          style={styles.headerStats}
          title={showMarkup ? "Return with Markup" : "TT Return"}
        >
          Return
        </div>
      </div>
      <div style={styles.list}>
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isSelected={selectedSessionId === session.id}
            isActive={activeSessionId === session.id}
            onSelect={onSelectSession}
            stats={statsCache[session.id]}
            showMarkup={showMarkup}
            applyExpenses={applyExpenses}
            selectionMode={selectionMode}
            isChecked={selectedIds.has(session.id)}
            onCheckChange={onCheckChange}
          />
        ))}
      </div>
      <div style={styles.footer}>
        Showing {sessions.length} of {totalCount} session
        {totalCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  selectionToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    backgroundColor: "hsl(217 91% 60% / 0.15)",
    borderBottom: "1px solid hsl(217 91% 60% / 0.3)",
  },
  selectionLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  selectionCount: {
    fontSize: "13px",
    fontWeight: 600,
    color: "hsl(217 91% 70%)",
  },
  selectionActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: "hsl(217 91% 60%)",
    border: "none",
    borderRadius: "4px",
    color: "white",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  deleteButton: {
    backgroundColor: "hsl(0 72% 51%)",
  },
  cancelButton: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: "1px solid hsl(220 13% 35%)",
    borderRadius: "4px",
    color: "hsl(220 13% 70%)",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
  },
  headerCheckbox: {
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    border: "2px solid hsl(220 13% 50%)",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
  },
  headerCheckboxChecked: {
    backgroundColor: "hsl(217 91% 60%)",
    borderColor: "hsl(217 91% 60%)",
  },
  selectModeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    backgroundColor: "transparent",
    border: "1px solid hsl(220 13% 30%)",
    borderRadius: "4px",
    color: "hsl(220 13% 50%)",
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    gap: "12px",
    fontSize: "10px",
    fontWeight: 600,
    color: "hsl(220 13% 40%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "hsl(220 13% 15%)",
    marginLeft: "16px",
    marginRight: "16px",
    marginTop: "8px",
  },
  headerName: {
    flex: 1,
  },
  headerStats: {
    width: "44px",
    textAlign: "right",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    overflow: "auto",
    padding: "8px 16px",
  },
  footer: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
    textAlign: "center",
    padding: "10px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "hsl(220 13% 15%)",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "48px 24px",
    textAlign: "center",
  },
  emptyIcon: {
    color: "hsl(220 13% 35%)",
    marginBottom: "16px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: 500,
    color: "hsl(220 13% 60%)",
    marginBottom: "8px",
  },
  emptySubtitle: {
    fontSize: "13px",
    color: "hsl(220 13% 50%)",
    maxWidth: "300px",
  },
};
