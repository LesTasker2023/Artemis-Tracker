/**
 * ConfigurableTile - A single stat tile that can display any stat
 * Shows value, optional mini chart, and edit mode for configuration
 */

import React, { useState } from "react";
import { Settings, Check, X } from "lucide-react";
import { colors, spacing, radius } from "../ui";
import { STAT_MAP, STATS_BY_CATEGORY, type StatData } from "./stat-definitions";
import { MiniSparkline, TrendIndicator } from "./MiniSparkline";

interface ConfigurableTileProps {
  statKey: string;
  data: StatData;
  history?: number[]; // Historical values for sparkline
  onChangeStat?: (newStatKey: string) => void;
  showChart?: boolean;
  compact?: boolean;
  fullSessionChart?: boolean; // Show full session data, sampled down
}

// Sample an array down to target number of points
function sampleData(data: number[], targetPoints: number): number[] {
  if (data.length <= targetPoints) return data;

  const result: number[] = [];
  const step = (data.length - 1) / (targetPoints - 1);

  for (let i = 0; i < targetPoints; i++) {
    const index = Math.round(i * step);
    result.push(data[index]);
  }

  return result;
}

export function ConfigurableTile({
  statKey,
  data,
  history = [],
  onChangeStat,
  showChart = true,
  compact = false,
  fullSessionChart = false,
}: ConfigurableTileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;

  const statValue = stat.getValue(data);
  const Icon = stat.icon;

  // Get previous value for trend indicator
  const previousValue =
    history.length > 1 ? history[history.length - 2] : statValue.numericValue;

  const handleSelectStat = (newKey: string) => {
    onChangeStat?.(newKey);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={styles.editContainer}>
        <div style={styles.editHeader}>
          <span style={styles.editTitle}>Select Stat</span>
          <button
            onClick={() => setIsEditing(false)}
            style={styles.closeButton}
          >
            <X size={14} />
          </button>
        </div>
        <div style={styles.categoryList}>
          {Object.entries(STATS_BY_CATEGORY).map(([category, stats]) => (
            <div key={category} style={styles.categoryGroup}>
              <div style={styles.categoryLabel}>{category.toUpperCase()}</div>
              {stats.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleSelectStat(s.key)}
                  style={{
                    ...styles.statOption,
                    backgroundColor:
                      s.key === statKey ? colors.bgCard : "transparent",
                  }}
                >
                  <s.icon size={12} style={{ color: colors.textMuted }} />
                  <span>{s.label}</span>
                  {s.key === statKey && (
                    <Check size={12} style={{ color: colors.success }} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.tile,
        ...(compact ? styles.tileCompact : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edit button - shows on hover */}
      {isHovered && onChangeStat && (
        <button onClick={() => setIsEditing(true)} style={styles.editButton}>
          <Settings size={12} />
        </button>
      )}

      {/* Icon watermark */}
      <div style={styles.iconWatermark}>
        <Icon size={compact ? 32 : 48} strokeWidth={1} />
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.labelRow}>
          <span style={{ ...styles.label, fontSize: compact ? 8 : 9 }}>
            {stat.label}
          </span>
          {!compact && (
            <TrendIndicator
              current={statValue.numericValue}
              previous={previousValue}
            />
          )}
        </div>

        <div style={styles.valueRow}>
          <span
            style={{
              ...styles.value,
              fontSize: compact ? 16 : 20,
              color: statValue.color,
            }}
          >
            {statValue.value}
          </span>
          {statValue.unit && !compact && (
            <span style={styles.unit}>{statValue.unit}</span>
          )}
        </div>

        {/* Mini chart - full session history */}
        {showChart && history.length >= 3 && (
          <div style={styles.chartContainer}>
            <MiniSparkline
              data={
                fullSessionChart ? sampleData(history, 30) : history.slice(-20)
              }
              width={compact ? 40 : 70}
              height={compact ? 14 : 20}
              color={statValue.color}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tile: {
    position: "relative",
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    overflow: "hidden",
    minHeight: 70,
  },
  tileCompact: {
    padding: spacing.xs,
    minHeight: 50,
  },
  iconWatermark: {
    position: "absolute",
    right: 8,
    bottom: 8,
    color: colors.textMuted,
    opacity: 0.1,
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  valueRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1,
  },
  unit: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.textMuted,
  },
  chartContainer: {
    marginTop: 4,
  },
  editButton: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  editContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    overflow: "hidden",
    maxHeight: 300,
  },
  editHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgPanel,
    borderBottom: `1px solid ${colors.border}`,
  },
  editTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: colors.textMuted,
    cursor: "pointer",
    padding: 2,
  },
  categoryList: {
    maxHeight: 250,
    overflowY: "auto",
    padding: spacing.xs,
  },
  categoryGroup: {
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    letterSpacing: "0.1em",
    padding: `${spacing.xs}px ${spacing.sm}px`,
  },
  statOption: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
    padding: `${spacing.xs}px ${spacing.sm}px`,
    border: "none",
    borderRadius: radius.sm,
    fontSize: 11,
    color: colors.textPrimary,
    cursor: "pointer",
    textAlign: "left",
    transition: "background-color 0.1s ease",
  },
};
