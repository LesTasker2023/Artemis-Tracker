/**
 * SessionManager - Session Card Component
 * Compact row-based card with stats display
 */

import React from "react";
import { Check } from "lucide-react";
import type { SessionMeta } from "../../types/electron";

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

interface SessionCardProps {
  session: SessionMeta;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
  stats?: SessionStats;
  showMarkup: boolean;
  applyExpenses: boolean;
  isChecked?: boolean;
  onCheckChange?: (id: string, checked: boolean) => void;
  selectionMode?: boolean;
}

export function SessionCard({
  session,
  isSelected,
  isActive,
  onSelect,
  stats,
  showMarkup,
  applyExpenses,
  isChecked = false,
  onCheckChange,
  selectionMode = false,
}: SessionCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

  const getStatusBadge = () => {
    // Only show badge for the actual active session
    if (isActive && !session.endedAt) {
      return <span style={styles.badgeActive}>LIVE</span>;
    }
    return null;
  };

  // Calculate adjusted values based on toggles
  const manualExpenses = stats?.manualExpenses ?? 0;

  // Get base profit (with or without markup)
  let baseProfit = showMarkup
    ? stats?.profitWithMarkup ?? 0
    : stats?.profit ?? 0;
  let baseReturnRate = showMarkup
    ? stats?.returnRateWithMarkup ?? 0
    : stats?.returnRate ?? 0;

  // If applyExpenses is OFF, add back manual expenses to profit
  if (!applyExpenses && manualExpenses > 0) {
    baseProfit += manualExpenses;
    // Recalculate return rate without manual expenses
    const adjustedCost = (stats?.totalCost ?? 0) - manualExpenses;
    const lootValue = showMarkup
      ? stats?.lootValue ?? 0
      : stats?.lootValue ?? 0;
    baseReturnRate = adjustedCost > 0 ? (lootValue / adjustedCost) * 100 : 0;
  }

  const profit = baseProfit;
  const returnRate = baseReturnRate;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckChange?.(session.id, !isChecked);
  };

  return (
    <div
      style={{
        ...styles.row,
        ...(isSelected ? styles.rowSelected : {}),
        ...(isHovered ? styles.rowHover : {}),
        ...(isChecked ? styles.rowChecked : {}),
      }}
      onClick={() => onSelect(session.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      {selectionMode && (
        <div
          style={{
            ...styles.checkbox,
            ...(isChecked ? styles.checkboxChecked : {}),
          }}
          onClick={handleCheckboxClick}
        >
          {isChecked && <Check size={12} strokeWidth={3} />}
        </div>
      )}

      {/* Left: Name + Date */}
      <div style={styles.infoCol}>
        <div style={styles.nameRow}>
          <span style={styles.name}>{session.name}</span>
          {getStatusBadge()}
        </div>
        <div style={styles.metaRow}>
          <span style={styles.date}>{formatDate(session.startedAt)}</span>
          <span style={styles.separator}>•</span>
          <span style={styles.duration}>
            {formatDuration(session.startedAt, session.endedAt)}
          </span>
        </div>
        {/* All Tags */}
        {session.tags && session.tags.length > 0 && (
          <div style={styles.tagsRow}>
            {session.tags.map((tag, idx) => (
              <span key={idx} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: Stats */}
      <div style={styles.statsCol}>
        {/* Profit */}
        <div style={styles.statBox}>
          <span
            style={{
              ...styles.statValue,
              color: profit >= 0 ? "#22c55e" : "#ef4444",
            }}
          >
            {profit >= 0 ? "+" : ""}
            {profit.toFixed(3)}
          </span>
          <span style={styles.statLabel}>PED</span>
        </div>

        {/* Return Rate */}
        <div style={styles.statBox}>
          <span
            style={{
              ...styles.statValue,
              color:
                returnRate >= 95
                  ? "#22c55e"
                  : returnRate >= 85
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          >
            {returnRate.toFixed(3)}%
          </span>
          <span style={styles.statLabel}>TT%</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    transition: "all 0.15s ease",
    gap: "12px",
  },
  rowHover: {
    backgroundColor: "hsl(220 13% 12%)",
    borderColor: "hsl(220 13% 22%)",
  },
  rowSelected: {
    borderColor: "hsl(217 91% 60%)",
    backgroundColor: "hsl(217 91% 60% / 0.08)",
  },
  rowChecked: {
    backgroundColor: "hsl(217 91% 60% / 0.12)",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    border: "2px solid hsl(220 13% 35%)",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    cursor: "pointer",
    transition: "all 0.15s ease",
    color: "white",
  },
  checkboxChecked: {
    backgroundColor: "hsl(217 91% 60%)",
    borderColor: "hsl(217 91% 60%)",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  name: {
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
  },
  date: {
    color: "hsl(220 13% 60%)",
  },
  separator: {
    color: "hsl(220 13% 30%)",
  },
  duration: {
    color: "hsl(220 13% 55%)",
  },
  tag: {
    padding: "1px 6px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "4px",
    color: "hsl(220 13% 65%)",
    fontSize: "10px",
    fontWeight: 500,
  },
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "2px",
  },
  badgeActive: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
    flexShrink: 0,
  },
  statsCol: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexShrink: 0,
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    minWidth: "70px",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};
