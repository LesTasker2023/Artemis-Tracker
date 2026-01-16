/**
 * ARTEMIS v3 - Sessions Page
 * List and view saved hunting sessions with full analytics
 * UI based on artemis-v2 session viewer with loadout-aware charts
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Target,
  TrendingUp,
  DollarSign,
  Trash2,
  ArrowLeft,
  Crosshair,
  Heart,
  Zap,
  Award,
  BarChart3,
  ChevronRight,
  LineChart,
  Eye,
  RotateCcw,
  AlertTriangle,
  Tag,
  Filter,
  ArrowUpDown,
  X,
  Shield,
  Wrench,
} from "lucide-react";
import type { Session, LoadoutBreakdown } from "../core/session";
import { calculateSessionStats } from "../core/session";
import type { SessionMeta } from "../types/electron";
import { SessionCharts } from "./SessionCharts";
import { getStoredPlayerName } from "../hooks/usePlayerName";

// ==================== Types ====================

interface SessionsPageProps {
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

// ==================== Session List ====================

interface SessionListProps {
  sessions: SessionMeta[];
  onSelect: (id: string) => void;
  onDeleteAll: () => void;
  loading: boolean;
}

function SessionList({
  sessions,
  onSelect,
  onDeleteAll,
  loading,
}: SessionListProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name-asc" | "name-desc"
  >("newest");

  // Extract all unique tags from all sessions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sessions.forEach((session) => {
      session.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [sessions]);

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by tags (if any tags selected, session must have at least one of them)
    if (selectedTags.length > 0) {
      filtered = sessions.filter((session) =>
        selectedTags.some((tag) => session.tags?.includes(tag))
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return sorted;
  }, [sessions, selectedTags, sortBy]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleDeleteAllClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteAll();
    setConfirmDelete(false);
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  if (loading) {
    return (
      <div style={listStyles.empty}>
        <div style={listStyles.emptyIcon}>
          <Clock size={48} />
        </div>
        <p>Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={listStyles.empty}>
        <div style={listStyles.emptyIcon}>
          <Target size={48} />
        </div>
        <p style={listStyles.emptyTitle}>No sessions yet</p>
        <p style={listStyles.emptySubtitle}>
          Start a hunting session to track your stats
        </p>
      </div>
    );
  }

  return (
    <div style={listStyles.wrapper}>
      {/* Header with title, filters, sort, and delete */}
      <div style={listStyles.header}>
        <h2 style={listStyles.headerTitle}>Sessions</h2>

        {sessions.length > 0 && (
          <>
            {/* Sort */}
            <div style={listStyles.filterGroup}>
              <ArrowUpDown size={14} style={{ color: "#64748b" }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={listStyles.sortSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div style={listStyles.filterGroup}>
                <Filter size={14} style={{ color: "#64748b" }} />
                <div style={listStyles.tagFilters}>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        ...listStyles.filterTag,
                        ...(selectedTags.includes(tag)
                          ? listStyles.filterTagActive
                          : {}),
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {selectedTags.length > 0 && (
              <button
                onClick={clearFilters}
                style={listStyles.clearFiltersButton}
              >
                <X size={12} />
                Clear ({selectedTags.length})
              </button>
            )}

            {/* Results Count */}
            <div style={listStyles.resultsCount}>
              {filteredAndSortedSessions.length} of {sessions.length}
            </div>

            {/* Delete All */}
            <div style={listStyles.headerActions}>
              {confirmDelete ? (
                <>
                  <button
                    onClick={handleDeleteAllClick}
                    style={{
                      ...listStyles.deleteButton,
                      ...listStyles.deleteButtonConfirm,
                    }}
                  >
                    <AlertTriangle size={14} />
                    Confirm Delete All
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    style={listStyles.cancelButton}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDeleteAllClick}
                  style={listStyles.deleteButton}
                >
                  <Trash2 size={14} />
                  Delete All
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Session list */}
      <div style={listStyles.container}>
        {filteredAndSortedSessions.length === 0 ? (
          <div style={listStyles.empty}>
            <div style={listStyles.emptyIcon}>
              <Filter size={48} />
            </div>
            <p style={listStyles.emptyTitle}>No sessions match filters</p>
            <p style={listStyles.emptySubtitle}>
              Try adjusting your tag filters
            </p>
          </div>
        ) : (
          filteredAndSortedSessions.map((meta) => (
            <div
              key={meta.id}
              style={listStyles.card}
              onClick={() => onSelect(meta.id)}
            >
              <div style={listStyles.cardHeader}>
                <div>
                  <h3 style={listStyles.cardTitle}>{meta.name}</h3>
                  <div style={listStyles.cardMeta}>
                    <Clock size={12} />
                    <span>{formatDate(meta.startedAt)}</span>
                    <span style={listStyles.dot}>•</span>
                    <span>{formatDuration(meta.startedAt, meta.endedAt)}</span>
                  </div>
                  {meta.tags && meta.tags.length > 0 && (
                    <div style={listStyles.tagContainer}>
                      {meta.tags.map((tag) => (
                        <span key={tag} style={listStyles.tag}>
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight size={20} style={{ color: "#64748b" }} />
              </div>
              <div style={listStyles.cardStats}>
                <div style={listStyles.statItem}>
                  <Zap size={14} style={{ color: "#f59e0b" }} />
                  <span>{meta.eventCount} events</span>
                </div>
                {meta.endedAt ? (
                  <span style={listStyles.badge}>Completed</span>
                ) : (
                  <span
                    style={{ ...listStyles.badge, ...listStyles.badgeActive }}
                  >
                    Active
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const listStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "16px",
    borderBottom: "1px solid hsl(220 13% 18%)",
    backgroundColor: "hsl(220 13% 10%)",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "8px",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sortSelect: {
    padding: "6px 10px",
    backgroundColor: "hsl(220 13% 15%)",
    color: "hsl(0 0% 85%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
  },
  tagFilters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  filterTag: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 10px",
    backgroundColor: "hsl(220 13% 15%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    color: "hsl(0 0% 70%)",
    fontSize: "12px",
    fontWeight: "500",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterTagActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.4)",
    color: "#a5b4fc",
  },
  clearFiltersButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 10px",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "6px",
    color: "#ef4444",
    fontSize: "12px",
    fontWeight: "500",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  resultsCount: {
    marginLeft: "auto",
    fontSize: "12px",
    color: "hsl(220 13% 45%)",
    fontWeight: "500",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "hsl(220 13% 15%)",
    color: "hsl(0 0% 85%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  deleteButtonConfirm: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
    color: "#ef4444",
  },
  cancelButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "hsl(220 13% 15%)",
    color: "hsl(0 0% 85%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    overflow: "auto",
    flex: 1,
  },
  card: {
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "12px",
    padding: "16px",
    cursor: "pointer",
    border: "1px solid hsl(220 13% 18%)",
    transition: "border-color 0.2s, background-color 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: 0,
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "hsl(220 13% 45%)",
    marginTop: "6px",
  },
  dot: {
    color: "hsl(220 13% 25%)",
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "8px",
  },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "10px",
    color: "#a5b4fc",
    fontSize: "11px",
    fontWeight: "500",
  },
  cardStats: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid hsl(220 13% 18%)",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "hsl(220 13% 70%)",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(220 13% 70%)",
  },
  badgeActive: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 24px",
    color: "hsl(220 13% 45%)",
    textAlign: "center",
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "500",
    margin: "0 0 8px 0",
    color: "hsl(220 13% 70%)",
  },
  emptySubtitle: {
    fontSize: "14px",
    margin: 0,
    color: "hsl(220 13% 45%)",
  },
};

// ==================== Session Detail ====================

interface SessionDetailProps {
  session: Session;
  onBack: () => void;
  onDelete: () => void;
  onUpdate: (session: Session) => void;
  onViewInTabs?: (session: Session) => void;
  onResume?: (session: Session) => void;
  isActiveSession?: boolean;
  onExpenseUpdate?: (expenses: {
    armorCost: number;
    fapCost: number;
    miscCost: number;
  }) => void;
}

function SessionDetail({
  session,
  onBack,
  onDelete,
  onUpdate,
  onViewInTabs,
  onResume,
  isActiveSession,
  onExpenseUpdate,
}: SessionDetailProps) {
  const [showResumeWarning, setShowResumeWarning] = useState(false);
  const [showMarkup, setShowMarkup] = useState(false);
  const [armorCost, setArmorCost] = useState(session.manualArmorCost ?? 0);
  const [fapCost, setFapCost] = useState(session.manualFapCost ?? 0);
  const [miscCost, setMiscCost] = useState(session.manualMiscCost ?? 0);

  // Sync local state when session props change (e.g., from popout updates)
  useEffect(() => {
    setArmorCost(session.manualArmorCost ?? 0);
    setFapCost(session.manualFapCost ?? 0);
    setMiscCost(session.manualMiscCost ?? 0);
  }, [session.manualArmorCost, session.manualFapCost, session.manualMiscCost]);

  // Create session with current manual costs for stats calculation
  const sessionWithCosts = useMemo(
    () => ({
      ...session,
      manualArmorCost: armorCost,
      manualFapCost: fapCost,
      manualMiscCost: miscCost,
    }),
    [session, armorCost, fapCost, miscCost]
  );

  const stats = useMemo(() => {
    const playerName = getStoredPlayerName();
    return calculateSessionStats(sessionWithCosts, playerName || undefined);
  }, [sessionWithCosts]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${session.name}"? This cannot be undone.`)) {
      onDelete();
    }
  };

  const handleResumeClick = () => {
    setShowResumeWarning(true);
  };

  const handleConfirmResume = () => {
    setShowResumeWarning(false);
    onResume?.(session);
  };

  // Save manual costs when they change
  const handleCostChange = (field: "armor" | "fap" | "misc", value: number) => {
    const setter =
      field === "armor"
        ? setArmorCost
        : field === "fap"
        ? setFapCost
        : setMiscCost;
    setter(value);

    const newArmorCost = field === "armor" ? value : armorCost;
    const newFapCost = field === "fap" ? value : fapCost;
    const newMiscCost = field === "misc" ? value : miscCost;

    // Update session with new expenses
    const updatedSession = {
      ...session,
      manualArmorCost: newArmorCost,
      manualFapCost: newFapCost,
      manualMiscCost: newMiscCost,
    };
    onUpdate(updatedSession);

    // Sync expenses to popout via IPC
    const expenses = {
      armorCost: newArmorCost,
      fapCost: newFapCost,
      miscCost: newMiscCost,
    };

    // Always update popout if it's open (regardless of active status)
    window.electron?.popout?.updateExpenses(expenses);

    // Also call the callback if provided (for active session)
    if (isActiveSession && onExpenseUpdate) {
      onExpenseUpdate(expenses);
    }
  };

  // Calculated derived stats
  const accuracy = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
  const critRate = stats.hits > 0 ? (stats.criticals / stats.hits) * 100 : 0;
  const killsPerHour =
    stats.duration > 0 ? (stats.kills / stats.duration) * 3600 : 0;
  const damagePerShot = stats.shots > 0 ? stats.damageDealt / stats.shots : 0;
  const damagePerHit = stats.hits > 0 ? stats.damageDealt / stats.hits : 0;
  const profitPerHour =
    stats.duration > 0 ? (stats.profit / stats.duration) * 3600 : 0;
  const costPerKill = stats.kills > 0 ? stats.totalSpend / stats.kills : 0;
  const lootPerKill = stats.kills > 0 ? stats.lootValue / stats.kills : 0;

  return (
    <div style={detailStyles.container}>
      {/* Resume Warning Banner */}
      {showResumeWarning && (
        <div style={detailStyles.resumeWarning}>
          <div style={detailStyles.resumeWarningContent}>
            <AlertTriangle
              size={18}
              style={{ color: "#f59e0b", flexShrink: 0 }}
            />
            <div>
              <strong>Resume this session?</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#94a3b8",
                }}
              >
                If using different equipment, cost-per-shot and profit
                calculations may be inaccurate.
              </p>
            </div>
          </div>
          <div style={detailStyles.resumeWarningButtons}>
            <button
              onClick={() => setShowResumeWarning(false)}
              style={detailStyles.resumeCancelButton}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmResume}
              style={detailStyles.resumeConfirmButton}
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Compact Header with Title */}
      <div style={detailStyles.headerCompact}>
        <div style={detailStyles.headerLeft}>
          <button onClick={onBack} style={detailStyles.backButtonCompact}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={detailStyles.titleCompact}>{session.name}</h1>
            <div style={detailStyles.metaRow}>
              <Clock size={12} style={{ color: "hsl(220 13% 45%)" }} />
              <span style={detailStyles.metaText}>
                {formatDate(session.startedAt)}
              </span>
              <span style={detailStyles.metaDot}>•</span>
              <span style={detailStyles.metaText}>
                {formatDuration(stats.duration)}
              </span>
              {session.tags && session.tags.length > 0 && (
                <>
                  <span style={detailStyles.metaDot}>•</span>
                  {session.tags.map((tag) => (
                    <span key={tag} style={detailStyles.tagInline}>
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
        <div style={detailStyles.headerActions}>
          {onResume && (session.endedAt || !isActiveSession) && (
            <button
              onClick={handleResumeClick}
              style={detailStyles.actionButton}
              title="Resume Session"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {onViewInTabs && (
            <button
              onClick={() => onViewInTabs(session)}
              style={detailStyles.actionButton}
              title="View in Data Tabs"
            >
              <Eye size={14} />
            </button>
          )}
          <button
            onClick={handleDelete}
            style={detailStyles.actionButtonDanger}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Additional Expenses - Inline under header */}
      <div style={detailStyles.expensesInline}>
        <span style={detailStyles.expensesTitleInline}>
          Additional Expenses
        </span>
        <button
          onClick={() => setShowMarkup(!showMarkup)}
          style={{
            ...detailStyles.muToggle,
            color: showMarkup ? "#06b6d4" : "hsl(220 13% 50%)",
            backgroundColor: showMarkup
              ? "rgba(6, 182, 212, 0.1)"
              : "transparent",
          }}
          title="Toggle Markup View"
        >
          MU
        </button>
        <div style={detailStyles.expenseInputInline}>
          <Shield size={12} style={{ color: "#06b6d4" }} />
          <span style={detailStyles.expenseLabelInline}>Armor</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={armorCost || ""}
            onChange={(e) =>
              handleCostChange("armor", parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
            style={detailStyles.inputInline}
          />
        </div>
        <div style={detailStyles.expenseInputInline}>
          <Heart size={12} style={{ color: "#ef4444" }} />
          <span style={detailStyles.expenseLabelInline}>FAP</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={fapCost || ""}
            onChange={(e) =>
              handleCostChange("fap", parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
            style={detailStyles.inputInline}
          />
        </div>
        <div style={detailStyles.expenseInputInline}>
          <Wrench size={12} style={{ color: "#f59e0b" }} />
          <span style={detailStyles.expenseLabelInline}>Misc</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={miscCost || ""}
            onChange={(e) =>
              handleCostChange("misc", parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
            style={detailStyles.inputInline}
          />
        </div>
        {(armorCost > 0 || fapCost > 0 || miscCost > 0) && (
          <div style={detailStyles.expenseTotalInline}>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>
              -{(armorCost + fapCost + miscCost).toFixed(2)}
            </span>
            <span style={{ color: "hsl(220 13% 50%)", fontSize: "10px" }}>
              PED
            </span>
          </div>
        )}
      </div>

      {/* Hero Stats - Key Metrics */}
      <div style={detailStyles.heroSection}>
        <div style={detailStyles.heroPrimary}>
          <div style={detailStyles.heroCard}>
            <div style={detailStyles.heroLabel}>Profit</div>
            <div
              style={{
                ...detailStyles.heroValue,
                color: stats.profit >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              {stats.profit >= 0 ? "+" : ""}
              {stats.profit.toFixed(2)}
              <span style={detailStyles.heroUnit}>PED</span>
            </div>
            <div style={detailStyles.heroSubtext}>
              {profitPerHour >= 0 ? "+" : ""}
              {profitPerHour.toFixed(2)} PED/hr
            </div>
          </div>
          <div style={detailStyles.heroCard}>
            <div style={detailStyles.heroLabel}>Return Rate</div>
            <div
              style={{
                ...detailStyles.heroValue,
                color:
                  stats.returnRate >= 90
                    ? "#22c55e"
                    : stats.returnRate >= 80
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              {stats.returnRate.toFixed(1)}
              <span style={detailStyles.heroUnit}>%</span>
            </div>
            <div style={detailStyles.heroSubtext}>
              {stats.lootValue.toFixed(2)} / {stats.totalSpend.toFixed(2)} PED
            </div>
          </div>
        </div>

        <div style={detailStyles.heroSecondary}>
          <div style={detailStyles.miniStat}>
            <Target size={14} style={{ color: "#f59e0b" }} />
            <span style={detailStyles.miniLabel}>Accuracy</span>
            <span style={detailStyles.miniValue}>{accuracy.toFixed(1)}%</span>
          </div>
          <div style={detailStyles.miniStat}>
            <Zap size={14} style={{ color: "#8b5cf6" }} />
            <span style={detailStyles.miniLabel}>Crit Rate</span>
            <span style={detailStyles.miniValue}>{critRate.toFixed(1)}%</span>
          </div>
          <div style={detailStyles.miniStat}>
            <Crosshair size={14} style={{ color: "#22c55e" }} />
            <span style={detailStyles.miniLabel}>Kills</span>
            <span style={detailStyles.miniValue}>{stats.kills}</span>
          </div>
          <div style={detailStyles.miniStat}>
            <Clock size={14} style={{ color: "#06b6d4" }} />
            <span style={detailStyles.miniLabel}>Kills/hr</span>
            <span style={detailStyles.miniValue}>
              {killsPerHour.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Three Column Layout for Stats */}
      <div style={detailStyles.statsColumns}>
        {/* Combat Column */}
        <div style={detailStyles.statsColumn}>
          <div style={detailStyles.columnHeader}>
            <Crosshair size={16} style={{ color: "#f59e0b" }} />
            <h3 style={detailStyles.columnTitle}>Combat</h3>
          </div>
          <div style={detailStyles.statsList}>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Total Shots</span>
              <span style={detailStyles.statValue}>
                {stats.shots.toLocaleString()}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Hits</span>
              <span style={{ ...detailStyles.statValue, color: "#22c55e" }}>
                {stats.hits.toLocaleString()}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Misses</span>
              <span style={{ ...detailStyles.statValue, color: "#ef4444" }}>
                {stats.misses.toLocaleString()}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Criticals</span>
              <span style={{ ...detailStyles.statValue, color: "#f59e0b" }}>
                {stats.criticals.toLocaleString()}
              </span>
            </div>
            <div style={detailStyles.statDivider} />
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Kills</span>
              <span style={detailStyles.statValue}>
                {stats.kills.toLocaleString()}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Deaths</span>
              <span style={{ ...detailStyles.statValue, color: "#ef4444" }}>
                {stats.deaths}
              </span>
            </div>
            <div style={detailStyles.statDivider} />
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Damage Dealt</span>
              <span style={detailStyles.statValue}>
                {stats.damageDealt.toFixed(1)}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>DMG/Shot</span>
              <span style={detailStyles.statValueSmall}>
                {damagePerShot.toFixed(2)}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>DMG/Hit</span>
              <span style={detailStyles.statValueSmall}>
                {damagePerHit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Defense Column */}
        <div style={detailStyles.statsColumn}>
          <div style={detailStyles.columnHeader}>
            <Heart size={16} style={{ color: "#ef4444" }} />
            <h3 style={detailStyles.columnTitle}>Defense</h3>
          </div>
          <div style={detailStyles.statsList}>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Damage Taken</span>
              <span style={{ ...detailStyles.statValue, color: "#ef4444" }}>
                {stats.damageTaken.toFixed(1)}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Healed</span>
              <span style={{ ...detailStyles.statValue, color: "#22c55e" }}>
                {stats.healed.toFixed(1)}
              </span>
            </div>
            <div style={detailStyles.statDivider} />
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Dodges</span>
              <span style={detailStyles.statValue}>{stats.dodges}</span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Evades</span>
              <span style={detailStyles.statValue}>{stats.evades}</span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Deflects</span>
              <span style={detailStyles.statValue}>{stats.deflects}</span>
            </div>
          </div>
        </div>

        {/* Economy Column */}
        <div style={detailStyles.statsColumn}>
          <div style={detailStyles.columnHeader}>
            <DollarSign size={16} style={{ color: "#22c55e" }} />
            <h3 style={detailStyles.columnTitle}>Economy</h3>
          </div>
          <div style={detailStyles.statsList}>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Total Spend</span>
              <span style={{ ...detailStyles.statValue, color: "#ef4444" }}>
                {stats.totalSpend.toFixed(2)}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Loot Value (TT)</span>
              <span style={{ ...detailStyles.statValue, color: "#22c55e" }}>
                {stats.lootValue.toFixed(2)}
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Loot Items</span>
              <span style={detailStyles.statValue}>{stats.lootCount}</span>
            </div>
            <div style={detailStyles.statDivider} />
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Cost/Kill</span>
              <span style={detailStyles.statValueSmall}>
                {costPerKill.toFixed(4)} PED
              </span>
            </div>
            <div style={detailStyles.statRow}>
              <span style={detailStyles.statLabel}>Loot/Kill</span>
              <span style={detailStyles.statValueSmall}>
                {lootPerKill.toFixed(4)} PED
              </span>
            </div>
            {stats.markupEnabled && (
              <>
                <div style={detailStyles.statDivider} />
                <div style={detailStyles.statRow}>
                  <span style={detailStyles.statLabel}>Markup Value</span>
                  <span style={{ ...detailStyles.statValue, color: "#8b5cf6" }}>
                    +{stats.markupValue.toFixed(2)}
                  </span>
                </div>
                <div style={detailStyles.statRow}>
                  <span style={detailStyles.statLabel}>With Markup</span>
                  <span
                    style={{
                      ...detailStyles.statValue,
                      color:
                        stats.profitWithMarkup >= 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {stats.profitWithMarkup >= 0 ? "+" : ""}
                    {stats.profitWithMarkup.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gains & Skills Section */}
      <div style={detailStyles.gainsSection}>
        <div style={detailStyles.gainCard}>
          <Award size={18} style={{ color: "#8b5cf6" }} />
          <div style={detailStyles.gainInfo}>
            <span style={detailStyles.gainLabel}>Skill Gains</span>
            <span style={detailStyles.gainValue}>
              {stats.skillGains.toFixed(4)}
            </span>
          </div>
        </div>
        <div style={detailStyles.gainCard}>
          <Zap size={18} style={{ color: "#ec4899" }} />
          <div style={detailStyles.gainInfo}>
            <span style={detailStyles.gainLabel}>Globals</span>
            <span style={detailStyles.gainValue}>{stats.globalCount}</span>
          </div>
        </div>
        <div style={detailStyles.gainCard}>
          <TrendingUp size={18} style={{ color: "#f59e0b" }} />
          <div style={detailStyles.gainInfo}>
            <span style={detailStyles.gainLabel}>HOFs</span>
            <span style={detailStyles.gainValue}>{stats.hofs}</span>
          </div>
        </div>
      </div>

      {/* Loadout Breakdown */}
      {stats.loadoutBreakdown.length > 0 && (
        <div style={detailStyles.card}>
          <div style={detailStyles.cardHeader}>
            <BarChart3 size={18} style={{ color: "#06b6d4" }} />
            <h2 style={detailStyles.cardTitle}>Loadout Breakdown</h2>
          </div>
          <div style={detailStyles.loadoutList}>
            {stats.loadoutBreakdown.map((lb, idx) => (
              <LoadoutRow key={lb.loadoutId ?? idx} breakdown={lb} />
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div style={detailStyles.chartsSection}>
        <div style={detailStyles.chartsSectionHeader}>
          <LineChart size={20} style={{ color: "#f59e0b" }} />
          <h2 style={detailStyles.chartsSectionTitle}>Session Analytics</h2>
        </div>
        <SessionCharts session={session} stats={stats} />
      </div>
    </div>
  );
}

// ==================== Shared Components ====================

interface LoadoutRowProps {
  breakdown: LoadoutBreakdown;
}

function LoadoutRow({ breakdown }: LoadoutRowProps) {
  return (
    <div style={detailStyles.loadoutRow}>
      <div style={detailStyles.loadoutName}>
        <Crosshair size={14} style={{ color: "#f59e0b" }} />
        <span>{breakdown.loadoutName}</span>
      </div>
      <div style={detailStyles.loadoutStats}>
        <span style={{ color: "#64748b" }}>
          {breakdown.shots} shots @ {breakdown.costPerShot.toFixed(4)} PED
        </span>
        <span style={{ color: "#ef4444" }}>
          -{breakdown.spend.toFixed(2)} PED
        </span>
        <span style={{ color: "#22c55e" }}>
          +{breakdown.lootValue.toFixed(2)} PED
        </span>
        <span
          style={{
            color: breakdown.profit >= 0 ? "#22c55e" : "#ef4444",
            fontWeight: 600,
          }}
        >
          {breakdown.profit >= 0 ? "+" : ""}
          {breakdown.profit.toFixed(2)} PED
        </span>
      </div>
    </div>
  );
}

const detailStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "auto",
    flex: 1,
  },
  // Compact Header
  headerCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "12px",
    border: "1px solid hsl(220 13% 18%)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  backButtonCompact: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    backgroundColor: "hsl(220 13% 14%)",
    color: "hsl(0 0% 85%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  titleCompact: {
    fontSize: "18px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: 0,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
  },
  metaText: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
  },
  metaDot: {
    color: "hsl(220 13% 30%)",
  },
  tagInline: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: "6px",
    color: "#a5b4fc",
    fontSize: "11px",
    fontWeight: "500",
  },
  headerActions: {
    display: "flex",
    gap: "6px",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    backgroundColor: "hsl(220 13% 15%)",
    color: "hsl(0 0% 75%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  actionButtonDanger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  // Hero Section
  heroSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  heroPrimary: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  heroCard: {
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid hsl(220 13% 18%)",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
  },
  heroLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "8px",
    textAlign: "left",
  },
  heroValue: {
    fontSize: "48px",
    fontWeight: "700",
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1,
    textAlign: "left",
  },
  heroUnit: {
    fontSize: "21px",
    fontWeight: "500",
    marginLeft: "4px",
    opacity: 0.7",
  },
  heroSubtext: {
    fontSize: "18px",
    color: "hsl(220 13% 45%)",
    marginTop: "8px",
    textAlign: "left",
  },
  heroSecondary: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  miniStat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    border: "1px solid hsl(220 13% 16%)",
  },
  miniLabel: {
    fontSize: "11px",
    color: "hsl(220 13% 50%)",
    flex: 1,
  },
  miniValue: {
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "'JetBrains Mono', monospace",
    color: "hsl(0 0% 90%)",
  },
  // Stats Columns
  statsColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  statsColumn: {
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "12px",
    border: "1px solid hsl(220 13% 18%)",
    overflow: "hidden",
  },
  columnHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    backgroundColor: "hsl(220 13% 8%)",
    borderBottom: "1px solid hsl(220 13% 16%)",
  },
  columnTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "hsl(0 0% 90%)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  statsList: {
    padding: "8px 0",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 14px",
  },
  statLabel: {
    fontSize: "12px",
    color: "hsl(220 13% 55%)",
  },
  statValue: {
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "'JetBrains Mono', monospace",
    color: "hsl(0 0% 90%)",
  },
  statValueSmall: {
    fontSize: "12px",
    fontWeight: "500",
    fontFamily: "'JetBrains Mono', monospace",
    color: "hsl(220 13% 70%)",
  },
  statDivider: {
    height: "1px",
    backgroundColor: "hsl(220 13% 16%)",
    margin: "6px 14px",
  },
  // Gains Section
  gainsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  gainCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "10px",
    border: "1px solid hsl(220 13% 18%)",
  },
  gainInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  gainLabel: {
    fontSize: "11px",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  gainValue: {
    fontSize: "18px",
    fontWeight: "600",
    fontFamily: "'JetBrains Mono', monospace",
    color: "hsl(0 0% 90%)",
  },
  // Inline expenses (under header)
  expensesInline: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "10px 16px",
    backgroundColor: "hsl(220 13% 8%)",
    borderRadius: "10px",
    border: "1px solid hsl(220 13% 16%)",
  },
  expensesTitleInline: {
    fontSize: "11px",
    fontWeight: "600",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    paddingRight: "8px",
    borderRight: "1px solid hsl(220 13% 20%)",
  },
  muToggle: {
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "600",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.15s",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  expenseInputInline: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  expenseLabelInline: {
    fontSize: "11px",
    fontWeight: "500",
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase",
  },
  inputInline: {
    width: "80px",
    padding: "6px 8px",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'JetBrains Mono', monospace",
    color: "hsl(0 0% 90%)",
    outline: "none",
    textAlign: "right",
  },
  expenseTotalInline: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    marginLeft: "auto",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
  },
  // Resume Warning (keep existing)
  resumeWarning: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "hsl(38 92% 50% / 0.15)",
    border: "1px solid hsl(38 92% 50% / 0.3)",
    borderRadius: "8px",
  },
  resumeWarningContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    color: "#f8fafc",
    fontSize: "13px",
  },
  resumeWarningButtons: {
    display: "flex",
    gap: "8px",
    flexShrink: 0,
  },
  resumeCancelButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(220 13% 85%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  resumeConfirmButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "hsl(142 76% 36%)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  // Loadout & Charts (keep existing style names for compatibility)
  card: {
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid hsl(220 13% 18%)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid hsl(220 13% 16%)",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "hsl(0 0% 90%)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  loadoutList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  loadoutRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#090d13",
    borderRadius: "8px",
    flexWrap: "wrap",
    gap: "8px",
  },
  loadoutName: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "hsl(0 0% 95%)",
  },
  loadoutStats: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  chartsSection: {
    marginTop: "8px",
  },
  chartsSectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  chartsSectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: 0,
  },
};

// ==================== Main Component ====================

const ACTIVE_SESSION_KEY = "artemis-active-session-id";

export function SessionsPage({
  onViewSession,
  onResumeSession,
  activeSessionId,
  activeSession,
  onExpenseUpdate,
}: SessionsPageProps) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Load session list on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const list = await window.electron?.session.list();
      if (list) {
        // Get the currently active session ID from localStorage
        const activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY);

        // Auto-complete any orphaned sessions (no endedAt and not the active one)
        const updatedList: SessionMeta[] = [];
        for (const meta of list) {
          if (!meta.endedAt && meta.id !== activeSessionId) {
            // This session is orphaned - load it, end it, and save it
            try {
              const session = await window.electron?.session.load(meta.id);
              if (session && !session.endedAt) {
                const ended = {
                  ...session,
                  endedAt:
                    session.events.length > 0
                      ? new Date(
                          session.events[session.events.length - 1].timestamp
                        ).toISOString()
                      : session.startedAt, // Use last event time or start time
                };
                await window.electron?.session.save(ended);
                console.log(
                  `[SessionsPage] Auto-completed orphaned session: ${meta.id}`
                );
                updatedList.push({ ...meta, endedAt: ended.endedAt });
              } else {
                updatedList.push(meta);
              }
            } catch (e) {
              console.error(
                `[SessionsPage] Failed to auto-complete session ${meta.id}:`,
                e
              );
              updatedList.push(meta);
            }
          } else {
            updatedList.push(meta);
          }
        }

        // Sort by most recent first
        setSessions(
          updatedList.sort(
            (a, b) =>
              new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          )
        );
      }
    } catch (err) {
      console.error("[SessionsPage] Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      const session = await window.electron?.session.load(id);
      if (session) {
        setSelectedSession(session);
      }
    } catch (err) {
      console.error("[SessionsPage] Failed to load session:", err);
    }
  };

  const handleBack = () => {
    setSelectedSession(null);
  };

  const handleDelete = async () => {
    if (!selectedSession) return;
    try {
      await window.electron?.session.delete(selectedSession.id);
      setSelectedSession(null);
      loadSessions();
    } catch (err) {
      console.error("[SessionsPage] Failed to delete session:", err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      // Delete all sessions
      for (const session of sessions) {
        await window.electron?.session.delete(session.id);
      }
      // Reload the session list
      loadSessions();
    } catch (err) {
      console.error("[SessionsPage] Failed to delete all sessions:", err);
    }
  };

  const handleUpdateSession = async (updatedSession: Session) => {
    try {
      await window.electron?.session.save(updatedSession);
      setSelectedSession(updatedSession);

      // Update sessions list to reflect changes
      setSessions((prev) =>
        prev.map((s) =>
          s.id === updatedSession.id
            ? { ...s, name: updatedSession.name, tags: updatedSession.tags }
            : s
        )
      );
    } catch (err) {
      console.error("[SessionsPage] Failed to update session:", err);
    }
  };

  if (selectedSession) {
    // Use activeSession from props when viewing the active session (for live updates)
    const isActive = selectedSession.id === activeSessionId;
    const sessionToShow =
      isActive && activeSession ? activeSession : selectedSession;

    return (
      <SessionDetail
        session={sessionToShow}
        onBack={handleBack}
        onDelete={handleDelete}
        onUpdate={handleUpdateSession}
        onViewInTabs={onViewSession}
        onResume={onResumeSession}
        isActiveSession={isActive}
        onExpenseUpdate={onExpenseUpdate}
      />
    );
  }

  return (
    <SessionList
      sessions={sessions}
      onSelect={handleSelectSession}
      onDeleteAll={handleDeleteAll}
      loading={loading}
    />
  );
}
