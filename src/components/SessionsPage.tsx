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
}

// ==================== Session List ====================

interface SessionListProps {
  sessions: SessionMeta[];
  onSelect: (id: string) => void;
  onDeleteAll: () => void;
  loading: boolean;
}

function SessionList({ sessions, onSelect, onDeleteAll, loading }: SessionListProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      {/* Header with Delete All button */}
      <div style={listStyles.header}>
        <h2 style={listStyles.headerTitle}>Sessions</h2>
        {sessions.length > 0 && (
          <div style={listStyles.headerActions}>
            {confirmDelete ? (
              <>
                <button
                  onClick={handleDeleteAllClick}
                  style={{ ...listStyles.deleteButton, ...listStyles.deleteButtonConfirm }}
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
        )}
      </div>

      {/* Session list */}
      <div style={listStyles.container}>
        {sessions.map((meta) => (
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
              <span style={{ ...listStyles.badge, ...listStyles.badgeActive }}>
                Active
              </span>
            )}
          </div>
        </div>
      ))}
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
    justifyContent: "space-between",
    alignItems: "center",
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
  onViewInTabs?: (session: Session) => void;
  onResume?: (session: Session) => void;
}

function SessionDetail({
  session,
  onBack,
  onDelete,
  onViewInTabs,
  onResume,
}: SessionDetailProps) {
  const [showResumeWarning, setShowResumeWarning] = useState(false);

  const stats = useMemo(() => {
    const playerName = getStoredPlayerName();
    return calculateSessionStats(session, playerName || undefined);
  }, [session]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

      {/* Header */}
      <div style={detailStyles.header}>
        <button onClick={onBack} style={detailStyles.backButton}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          {onResume && session.endedAt && (
            <button
              onClick={handleResumeClick}
              style={detailStyles.resumeButton}
            >
              <RotateCcw size={16} />
              Resume
            </button>
          )}
          {onViewInTabs && (
            <button
              onClick={() => onViewInTabs(session)}
              style={detailStyles.viewButton}
            >
              <Eye size={16} />
              View in Data Tabs
            </button>
          )}
          <button onClick={handleDelete} style={detailStyles.deleteButton}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={detailStyles.titleSection}>
        <h1 style={detailStyles.title}>{session.name}</h1>
        <p style={detailStyles.subtitle}>{formatDate(session.startedAt)}</p>
      </div>

      {/* Hero Stats Grid */}
      <div style={detailStyles.heroGrid}>
        <StatCard
          icon={<DollarSign size={20} />}
          label="Profit"
          value={`${stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(
            2
          )} PED`}
          positive={stats.profit >= 0}
          large
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Return Rate"
          value={`${stats.returnRate.toFixed(1)}%`}
          positive={stats.returnRate >= 90}
          large
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Duration"
          value={formatDuration(stats.duration)}
          large
        />
        <StatCard
          icon={<Target size={20} />}
          label="Accuracy"
          value={`${
            stats.shots > 0 ? ((stats.hits / stats.shots) * 100).toFixed(1) : 0
          }%`}
          large
        />
      </div>

      {/* Combat Statistics Card */}
      <div style={detailStyles.card}>
        <div style={detailStyles.cardHeader}>
          <Crosshair size={18} style={{ color: "#f59e0b" }} />
          <h2 style={detailStyles.cardTitle}>Combat Statistics</h2>
        </div>
        <div style={detailStyles.statsGrid}>
          <StatItem label="Total Shots" value={stats.shots} />
          <StatItem label="Hits" value={stats.hits} color="#22c55e" />
          <StatItem label="Misses" value={stats.misses} color="#ef4444" />
          <StatItem label="Criticals" value={stats.criticals} color="#f59e0b" />
          <StatItem label="Kills" value={stats.kills} />
          <StatItem label="Damage Dealt" value={stats.damageDealt.toFixed(0)} />
        </div>
      </div>

      {/* Defense Statistics Card */}
      <div style={detailStyles.card}>
        <div style={detailStyles.cardHeader}>
          <Heart size={18} style={{ color: "#ef4444" }} />
          <h2 style={detailStyles.cardTitle}>Defense Statistics</h2>
        </div>
        <div style={detailStyles.statsGrid}>
          <StatItem
            label="Damage Taken"
            value={stats.damageTaken.toFixed(0)}
            color="#ef4444"
          />
          <StatItem
            label="Healed"
            value={stats.healed.toFixed(0)}
            color="#22c55e"
          />
          <StatItem label="Dodges" value={stats.dodges} />
          <StatItem label="Evades" value={stats.evades} />
          <StatItem label="Deflects" value={stats.deflects} />
        </div>
      </div>

      {/* Economy Card */}
      <div style={detailStyles.card}>
        <div style={detailStyles.cardHeader}>
          <DollarSign size={18} style={{ color: "#22c55e" }} />
          <h2 style={detailStyles.cardTitle}>Economy</h2>
        </div>
        <div style={detailStyles.statsGrid}>
          <StatItem label="Loot Count" value={stats.lootCount} />
          <StatItem
            label="Loot Value"
            value={`${stats.lootValue.toFixed(2)} PED`}
            color="#22c55e"
          />
          <StatItem
            label="Total Spend"
            value={`${stats.totalSpend.toFixed(2)} PED`}
            color="#ef4444"
          />
          <StatItem
            label="Profit"
            value={`${stats.profit.toFixed(2)} PED`}
            color={stats.profit >= 0 ? "#22c55e" : "#ef4444"}
          />
          <StatItem
            label="Return Rate"
            value={`${stats.returnRate.toFixed(1)}%`}
            color={stats.returnRate >= 90 ? "#22c55e" : "#ef4444"}
          />
        </div>
      </div>

      {/* Gains Card */}
      <div style={detailStyles.card}>
        <div style={detailStyles.cardHeader}>
          <Award size={18} style={{ color: "#8b5cf6" }} />
          <h2 style={detailStyles.cardTitle}>Gains</h2>
        </div>
        <div style={detailStyles.statsGrid}>
          <StatItem
            label="Skill Gains"
            value={stats.skillGains}
            color="#06b6d4"
          />
          <StatItem label="Globals" value={stats.globalCount} color="#ec4899" />
          <StatItem label="HOFs" value={stats.hofs} color="#f59e0b" />
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
  large?: boolean;
}

function StatCard({ icon, label, value, positive, large }: StatCardProps) {
  return (
    <div style={detailStyles.statCard}>
      <div style={detailStyles.statCardIcon}>{icon}</div>
      <div style={detailStyles.statCardLabel}>{label}</div>
      <div
        style={{
          ...detailStyles.statCardValue,
          fontSize: large ? "24px" : "18px",
          color:
            positive === undefined
              ? "#f8fafc"
              : positive
              ? "#22c55e"
              : "#ef4444",
        }}
      >
        {value}
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <div style={detailStyles.statItem}>
      <div style={detailStyles.statItemLabel}>{label}</div>
      <div
        style={{
          ...detailStyles.statItemValue,
          color: color ?? "#f8fafc",
        }}
      >
        {value}
      </div>
    </div>
  );
}

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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "hsl(220 13% 14%)",
    color: "hsl(0 0% 95%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "hsl(217 91% 68% / 0.2)",
    color: "hsl(217 91% 75%)",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  resumeButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "hsl(142 76% 36% / 0.2)",
    color: "hsl(142 76% 60%)",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
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
  titleSection: {
    marginBottom: "8px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "hsl(0 0% 95%)",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "hsl(220 13% 45%)",
    marginTop: "4px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },
  statCard: {
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid hsl(220 13% 18%)",
    textAlign: "center",
  },
  statCardIcon: {
    color: "hsl(33 100% 50%)",
    marginBottom: "8px",
  },
  statCardLabel: {
    fontSize: "12px",
    color: "hsl(220 13% 45%)",
    marginBottom: "4px",
  },
  statCardValue: {
    fontWeight: "700",
    fontFamily: "monospace",
  },
  card: {
    backgroundColor: "hsl(220 13% 12%)",
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
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: 0,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "16px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statItemLabel: {
    fontSize: "12px",
    color: "hsl(220 13% 45%)",
  },
  statItemValue: {
    fontSize: "20px",
    fontWeight: "700",
    fontFamily: "'JetBrains Mono', monospace",
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

  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={handleBack}
        onDelete={handleDelete}
        onViewInTabs={onViewSession}
        onResume={onResumeSession}
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
