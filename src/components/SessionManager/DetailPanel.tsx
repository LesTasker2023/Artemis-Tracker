/**
 * SessionManager - Detail Panel Component
 * Right panel showing selected session details OR aggregate tag stats
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  Clock,
  Crosshair,
  DollarSign,
  Tag,
  Award,
  BarChart3,
  Trash2,
  Eye,
  RotateCcw,
  Layers,
  Shield,
  Heart,
  Wrench,
} from "lucide-react";
import type { Session, LoadoutBreakdown } from "../../core/session";
import { calculateSessionStats } from "../../core/session";
import { getStoredPlayerName } from "../../hooks/usePlayerName";
import type { MarkupLibrary } from "../../core/markup";

// Aggregate stats when viewing by tag
export interface AggregateStats {
  tagName: string;
  sessionCount: number;
  totalDuration: number;
  profit: number;
  profitWithMarkup: number;
  returnRate: number;
  returnRateWithMarkup: number;
  lootValue: number;
  lootValueWithMarkup: number;
  totalCost: number;
  manualExpenses: number;
  kills: number;
  shots: number;
  hits: number;
  criticals: number;
  skillGains: number;
  globalCount: number;
  hofs: number;
}

interface DetailPanelProps {
  session: Session | null;
  aggregateStats?: AggregateStats | null;
  onDelete?: (session: Session) => void;
  onViewInTabs?: (session: Session) => void;
  onResume?: (session: Session) => void;
  isActiveSession?: boolean;
  onExpenseUpdate?: (expenses: {
    armorCost: number;
    fapCost: number;
    miscCost: number;
  }) => void;
  showMarkup?: boolean;
  applyExpenses?: boolean;
  markupLibrary?: MarkupLibrary | null;
}

export function DetailPanel({
  session,
  aggregateStats,
  onDelete,
  onViewInTabs,
  onResume,
  isActiveSession,
  onExpenseUpdate,
  showMarkup = false,
  applyExpenses = true,
  markupLibrary,
}: DetailPanelProps) {
  const stats = useMemo(() => {
    if (!session) return null;
    const playerName = getStoredPlayerName();
    return calculateSessionStats(session, playerName || undefined, null, markupLibrary);
  }, [session, markupLibrary]);

  // Expense state
  const [armorCost, setArmorCost] = useState(0);
  const [fapCost, setFapCost] = useState(0);
  const [miscCost, setMiscCost] = useState(0);

  // Sync expense state when session changes
  useEffect(() => {
    if (session) {
      setArmorCost(session.manualArmorCost ?? 0);
      setFapCost(session.manualFapCost ?? 0);
      setMiscCost(session.manualMiscCost ?? 0);
    }
  }, [session?.id]);

  const handleCostChange = (type: "armor" | "fap" | "misc", value: number) => {
    const newArmorCost = type === "armor" ? value : armorCost;
    const newFapCost = type === "fap" ? value : fapCost;
    const newMiscCost = type === "misc" ? value : miscCost;

    if (type === "armor") setArmorCost(value);
    if (type === "fap") setFapCost(value);
    if (type === "misc") setMiscCost(value);

    onExpenseUpdate?.({
      armorCost: newArmorCost,
      fapCost: newFapCost,
      miscCost: newMiscCost,
    });
  };

  // Show aggregate stats view if provided
  if (aggregateStats) {
    return <AggregateDetailView stats={aggregateStats} showMarkup={showMarkup} applyExpenses={applyExpenses} />;
  }

  if (!session || !stats) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyText}>Select a session to view details</div>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${session.name}"? This cannot be undone.`)) {
      onDelete?.(session);
    }
  };

  // Calculated derived stats
  const accuracy = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
  const critRate = stats.hits > 0 ? (stats.criticals / stats.hits) * 100 : 0;
  const killsPerHour =
    stats.duration > 0 ? (stats.kills / stats.duration) * 3600 : 0;

  // Calculate display values based on MU/AE toggles
  const manualExpenses = (session.manualArmorCost ?? 0) + (session.manualFapCost ?? 0) + (session.manualMiscCost ?? 0);
  
  // Get base values (with or without markup)
  let displayProfit = showMarkup ? stats.profitWithMarkup : stats.profit;
  let displayLootValue = showMarkup ? stats.lootValueWithMarkup : stats.lootValue;
  let displayTotalSpend = stats.totalSpend;
  let displayReturnRate = showMarkup ? stats.returnRateWithMarkup : stats.returnRate;
  
  // If applyExpenses is OFF, add back manual expenses
  if (!applyExpenses && manualExpenses > 0) {
    displayProfit += manualExpenses;
    displayTotalSpend -= manualExpenses;
    displayReturnRate = displayTotalSpend > 0 ? (displayLootValue / displayTotalSpend) * 100 : 0;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <h2 style={styles.title}>{session.name}</h2>
          <div style={styles.meta}>
            <Clock size={12} />
            <span>{formatDate(session.startedAt)}</span>
            <span style={styles.dot}>•</span>
            <span>{formatDuration(stats.duration)}</span>
          </div>
          {session.tags && session.tags.length > 0 && (
            <div style={styles.tags}>
              {session.tags.map((tag) => (
                <span key={tag} style={styles.tag}>
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={styles.headerActions}>
          {onResume && session.endedAt && (
            <button
              onClick={() => onResume(session)}
              style={styles.actionButton}
              title="Resume Session"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {onViewInTabs && (
            <button
              onClick={() => onViewInTabs(session)}
              style={styles.actionButton}
              title="View in Data Tabs"
            >
              <Eye size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              style={styles.actionButtonDanger}
              title="Delete Session"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div style={styles.statusRow}>
        {session.endedAt ? (
          <span style={styles.badgeCompleted}>Completed</span>
        ) : (
          <span style={styles.badgeActive}>
            {isActiveSession ? "Recording" : "Active"}
          </span>
        )}
      </div>

      {/* Key Stats Grid */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>KEY STATS</div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Profit</div>
            <div
              style={{
                ...styles.statValue,
                color: displayProfit >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              {displayProfit >= 0 ? "+" : ""}
              {displayProfit.toFixed(2)}
            </div>
            <div style={styles.statUnit}>PED</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Return</div>
            <div
              style={{
                ...styles.statValue,
                color:
                  displayReturnRate >= 90
                    ? "#22c55e"
                    : displayReturnRate >= 80
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              {displayReturnRate.toFixed(1)}%
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Kills</div>
            <div style={styles.statValue}>{stats.kills}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Kills/hr</div>
            <div style={styles.statValue}>{killsPerHour.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Combat Stats */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Crosshair size={12} />
          COMBAT
        </div>
        <div style={styles.statsList}>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Shots</span>
            <span style={styles.statRowValue}>
              {stats.shots.toLocaleString()}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Hits</span>
            <span style={{ ...styles.statRowValue, color: "#22c55e" }}>
              {stats.hits.toLocaleString()}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Accuracy</span>
            <span style={styles.statRowValue}>{accuracy.toFixed(1)}%</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Criticals</span>
            <span style={{ ...styles.statRowValue, color: "#f59e0b" }}>
              {stats.criticals}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Crit Rate</span>
            <span style={styles.statRowValue}>{critRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Economy Stats */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <DollarSign size={12} />
          ECONOMY
        </div>
        <div style={styles.statsList}>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Total Spend</span>
            <span style={{ ...styles.statRowValue, color: "#ef4444" }}>
              -{displayTotalSpend.toFixed(2)} PED
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Loot Value</span>
            <span style={{ ...styles.statRowValue, color: "#22c55e" }}>
              +{displayLootValue.toFixed(2)} PED
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Loot Items</span>
            <span style={styles.statRowValue}>{stats.lootCount}</span>
          </div>
        </div>
      </div>

      {/* Additional Expenses */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Wrench size={12} />
          ADDITIONAL EXPENSES
        </div>
        <div style={styles.expensesList}>
          <div style={styles.expenseRow}>
            <Shield size={12} style={{ color: "#06b6d4" }} />
            <span style={styles.expenseLabel}>Armor</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={armorCost || ""}
              onChange={(e) =>
                handleCostChange("armor", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              style={styles.expenseInput}
            />
          </div>
          <div style={styles.expenseRow}>
            <Heart size={12} style={{ color: "#ef4444" }} />
            <span style={styles.expenseLabel}>FAP</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={fapCost || ""}
              onChange={(e) =>
                handleCostChange("fap", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              style={styles.expenseInput}
            />
          </div>
          <div style={styles.expenseRow}>
            <Wrench size={12} style={{ color: "#f59e0b" }} />
            <span style={styles.expenseLabel}>Misc</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={miscCost || ""}
              onChange={(e) =>
                handleCostChange("misc", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              style={styles.expenseInput}
            />
          </div>
          {(armorCost > 0 || fapCost > 0 || miscCost > 0) && (
            <div style={styles.expenseTotal}>
              <span style={styles.expenseTotalLabel}>Total Extra</span>
              <span style={styles.expenseTotalValue}>
                -{(armorCost + fapCost + miscCost).toFixed(2)} PED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Gains */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Award size={12} />
          GAINS
        </div>
        <div style={styles.statsList}>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Skill Gains</span>
            <span style={{ ...styles.statRowValue, color: "#8b5cf6" }}>
              {stats.skillGains.toFixed(4)}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Globals</span>
            <span style={styles.statRowValue}>{stats.globalCount}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>HOFs</span>
            <span style={styles.statRowValue}>{stats.hofs}</span>
          </div>
        </div>
      </div>

      {/* Loadout Breakdown */}
      {stats.loadoutBreakdown.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <BarChart3 size={12} />
            LOADOUTS
          </div>
          <div style={styles.loadoutList}>
            {stats.loadoutBreakdown.map((lb, idx) => (
              <LoadoutRow key={lb.loadoutId ?? idx} breakdown={lb} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadoutRowProps {
  breakdown: LoadoutBreakdown;
}

function LoadoutRow({ breakdown }: LoadoutRowProps) {
  return (
    <div style={styles.loadoutRow}>
      <div style={styles.loadoutHeader}>
        <Crosshair size={12} style={{ color: "#f59e0b" }} />
        <span style={styles.loadoutName}>{breakdown.loadoutName}</span>
      </div>
      <div style={styles.loadoutStats}>
        <span style={styles.loadoutStat}>{breakdown.shots} shots</span>
        <span style={{ ...styles.loadoutStat, color: "#ef4444" }}>
          -{breakdown.spend.toFixed(2)}
        </span>
        <span style={{ ...styles.loadoutStat, color: "#22c55e" }}>
          +{breakdown.lootValue.toFixed(2)}
        </span>
        <span
          style={{
            ...styles.loadoutStat,
            fontWeight: 600,
            color: breakdown.profit >= 0 ? "#22c55e" : "#ef4444",
          }}
        >
          {breakdown.profit >= 0 ? "+" : ""}
          {breakdown.profit.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// Aggregate view for tag stats
function AggregateDetailView({ 
  stats, 
  showMarkup, 
  applyExpenses 
}: { 
  stats: AggregateStats; 
  showMarkup: boolean; 
  applyExpenses: boolean;
}) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const accuracy = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
  const critRate = stats.hits > 0 ? (stats.criticals / stats.hits) * 100 : 0;
  const killsPerHour =
    stats.totalDuration > 0 ? (stats.kills / stats.totalDuration) * 3600 : 0;

  // Calculate adjusted values based on toggles
  const manualExpenses = stats.manualExpenses ?? 0;
  
  // Get base values (with or without markup)
  let baseProfit = showMarkup ? stats.profitWithMarkup : stats.profit;
  let baseLootValue = showMarkup ? stats.lootValueWithMarkup : stats.lootValue;
  let baseTotalCost = stats.totalCost;
  let baseReturnRate = showMarkup ? stats.returnRateWithMarkup : stats.returnRate;
  
  // If applyExpenses is OFF, add back manual expenses
  if (!applyExpenses && manualExpenses > 0) {
    baseProfit += manualExpenses;
    baseTotalCost -= manualExpenses;
    baseReturnRate = baseTotalCost > 0 ? (baseLootValue / baseTotalCost) * 100 : 0;
  }

  const displayProfit = baseProfit;
  const displayReturnRate = baseReturnRate;
  const displayLootValue = baseLootValue;
  const displayTotalCost = baseTotalCost;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.aggregateLabel}>
            <Layers size={14} />
            TAG AGGREGATE
          </div>
          <h2 style={styles.title}>{stats.tagName}</h2>
          <div style={styles.meta}>
            <Clock size={12} />
            <span>{stats.sessionCount} sessions</span>
            <span style={styles.dot}>•</span>
            <span>{formatDuration(stats.totalDuration)} total</span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>KEY STATS</div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Profit</div>
            <div
              style={{
                ...styles.statValue,
                color: displayProfit >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              {displayProfit >= 0 ? "+" : ""}
              {displayProfit.toFixed(3)}
            </div>
            <div style={styles.statUnit}>PED</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Return</div>
            <div
              style={{
                ...styles.statValue,
                color:
                  displayReturnRate >= 90
                    ? "#22c55e"
                    : displayReturnRate >= 80
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              {displayReturnRate.toFixed(3)}%
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Loot Value</div>
            <div style={{ ...styles.statValue, color: "#22c55e" }}>
              {displayLootValue.toFixed(3)}
            </div>
            <div style={styles.statUnit}>PED</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Cost</div>
            <div style={{ ...styles.statValue, color: "#ef4444" }}>
              {displayTotalCost.toFixed(3)}
            </div>
            <div style={styles.statUnit}>PED</div>
          </div>
        </div>
      </div>

      {/* Combat Stats */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Crosshair size={12} />
          COMBAT
        </div>
        <div style={styles.statsList}>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Kills</span>
            <span style={styles.statRowValue}>
              {stats.kills.toLocaleString()}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Kills/hr</span>
            <span style={styles.statRowValue}>{killsPerHour.toFixed(1)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Shots</span>
            <span style={styles.statRowValue}>
              {stats.shots.toLocaleString()}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Hits</span>
            <span style={{ ...styles.statRowValue, color: "#22c55e" }}>
              {stats.hits.toLocaleString()}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Accuracy</span>
            <span style={styles.statRowValue}>{accuracy.toFixed(1)}%</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Criticals</span>
            <span style={{ ...styles.statRowValue, color: "#f59e0b" }}>
              {stats.criticals.toLocaleString()}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Crit Rate</span>
            <span style={styles.statRowValue}>{critRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Other Stats */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Award size={12} />
          ACHIEVEMENTS
        </div>
        <div style={styles.statsList}>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Skill Gains</span>
            <span style={{ ...styles.statRowValue, color: "#60a5fa" }}>
              {stats.skillGains}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Globals</span>
            <span style={{ ...styles.statRowValue, color: "#f59e0b" }}>
              {stats.globalCount}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>HOFs</span>
            <span style={{ ...styles.statRowValue, color: "#a855f7" }}>
              {stats.hofs}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "360px",
    minWidth: "360px",
    backgroundColor: "hsl(220 13% 9%)",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: "hsl(220 13% 18%)",
    overflow: "auto",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "24px",
  },
  emptyText: {
    fontSize: "14px",
    color: "hsl(220 13% 45%)",
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "16px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "hsl(220 13% 15%)",
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    marginTop: "6px",
  },
  dot: {
    color: "hsl(220 13% 30%)",
  },
  aggregateLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: 600,
    color: "#a855f7",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "8px",
  },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: "6px",
    color: "#a5b4fc",
    fontSize: "11px",
    fontWeight: 500,
  },
  headerActions: {
    display: "flex",
    gap: "4px",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    backgroundColor: "hsl(220 13% 15%)",
    color: "hsl(0 0% 75%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(220 13% 22%)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  actionButtonDanger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  statusRow: {
    padding: "0 16px 12px",
  },
  badgeCompleted: {
    display: "inline-flex",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(220 13% 70%)",
  },
  badgeActive: {
    display: "inline-flex",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
  },
  section: {
    padding: "12px 16px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "hsl(220 13% 15%)",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "12px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  },
  statCard: {
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "10px",
    fontWeight: 500,
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: 700,
    color: "hsl(0 0% 90%)",
  },
  statUnit: {
    fontSize: "10px",
    color: "hsl(220 13% 45%)",
    marginTop: "2px",
  },
  statsList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
  },
  statRowLabel: {
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
  },
  statRowValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: "hsl(0 0% 90%)",
  },
  loadoutList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  loadoutRow: {
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "8px",
    padding: "10px",
  },
  loadoutHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px",
  },
  loadoutName: {
    fontSize: "12px",
    fontWeight: 600,
    color: "hsl(0 0% 90%)",
  },
  loadoutStats: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
  },
  loadoutStat: {
    fontSize: "11px",
    color: "hsl(220 13% 60%)",
  },
  expensesList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  expenseRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  expenseLabel: {
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    width: "50px",
  },
  expenseInput: {
    flex: 1,
    padding: "6px 10px",
    backgroundColor: "hsl(220 13% 12%)",
    color: "hsl(0 0% 90%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(220 13% 20%)",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    outline: "none",
    textAlign: "right",
  },
  expenseTotal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
    paddingTop: "8px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "hsl(220 13% 18%)",
  },
  expenseTotalLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "hsl(220 13% 60%)",
  },
  expenseTotalValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#ef4444",
  },
};
