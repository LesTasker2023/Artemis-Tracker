/**
 * SessionManager - Detail Panel Component
 * Right panel showing selected session details and loadout breakdown
 */

import React, { useMemo } from "react";
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
} from "lucide-react";
import type { Session, LoadoutBreakdown } from "../../core/session";
import { calculateSessionStats } from "../../core/session";
import { getStoredPlayerName } from "../../hooks/usePlayerName";

interface DetailPanelProps {
  session: Session | null;
  onDelete?: (session: Session) => void;
  onViewInTabs?: (session: Session) => void;
  onResume?: (session: Session) => void;
  isActiveSession?: boolean;
}

export function DetailPanel({
  session,
  onDelete,
  onViewInTabs,
  onResume,
  isActiveSession,
}: DetailPanelProps) {
  const stats = useMemo(() => {
    if (!session) return null;
    const playerName = getStoredPlayerName();
    return calculateSessionStats(session, playerName || undefined);
  }, [session]);

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
  const killsPerHour = stats.duration > 0 ? (stats.kills / stats.duration) * 3600 : 0;

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
            <div style={{
              ...styles.statValue,
              color: stats.profit >= 0 ? "#22c55e" : "#ef4444",
            }}>
              {stats.profit >= 0 ? "+" : ""}{stats.profit.toFixed(2)}
            </div>
            <div style={styles.statUnit}>PED</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Return</div>
            <div style={{
              ...styles.statValue,
              color: stats.returnRate >= 90 ? "#22c55e" : stats.returnRate >= 80 ? "#f59e0b" : "#ef4444",
            }}>
              {stats.returnRate.toFixed(1)}%
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
            <span style={styles.statRowValue}>{stats.shots.toLocaleString()}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Hits</span>
            <span style={{ ...styles.statRowValue, color: "#22c55e" }}>{stats.hits.toLocaleString()}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Accuracy</span>
            <span style={styles.statRowValue}>{accuracy.toFixed(1)}%</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Criticals</span>
            <span style={{ ...styles.statRowValue, color: "#f59e0b" }}>{stats.criticals}</span>
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
              -{stats.totalSpend.toFixed(2)} PED
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Loot Value</span>
            <span style={{ ...styles.statRowValue, color: "#22c55e" }}>
              +{stats.lootValue.toFixed(2)} PED
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statRowLabel}>Loot Items</span>
            <span style={styles.statRowValue}>{stats.lootCount}</span>
          </div>
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
        <span style={styles.loadoutStat}>
          {breakdown.shots} shots
        </span>
        <span style={{ ...styles.loadoutStat, color: "#ef4444" }}>
          -{breakdown.spend.toFixed(2)}
        </span>
        <span style={{ ...styles.loadoutStat, color: "#22c55e" }}>
          +{breakdown.lootValue.toFixed(2)}
        </span>
        <span style={{
          ...styles.loadoutStat,
          fontWeight: 600,
          color: breakdown.profit >= 0 ? "#22c55e" : "#ef4444",
        }}>
          {breakdown.profit >= 0 ? "+" : ""}{breakdown.profit.toFixed(2)}
        </span>
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
};
