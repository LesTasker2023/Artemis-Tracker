/**
 * ARTEMIS v3 - Economy Tracker
 * Focus: Am I making money? Where does it go?
 */

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Crosshair,
} from "lucide-react";
import type { SessionStats } from "../core/session";
import {
  HeroCard,
  HeroGrid,
  EmptyState,
  colors,
  spacing,
  radius,
  typography,
} from "./ui";

interface EconomyTrackerProps {
  stats: SessionStats | null;
}

export function EconomyTracker({ stats }: EconomyTrackerProps) {
  const [showLoadouts, setShowLoadouts] = useState(false);

  if (!stats) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No Economy Data Yet"
        subtitle="Track sessions to analyze your PED flow"
      />
    );
  }

  const profit = stats.profit;
  const returnRate = stats.returnRate;
  const isProfit = profit >= 0;

  // Key economy metrics
  const profitPerHour =
    stats.duration > 0 ? (profit / stats.duration) * 3600 : 0;
  const profitPerKill = stats.kills > 0 ? profit / stats.kills : 0;
  const costPerShot = stats.shots > 0 ? stats.totalSpend / stats.shots : 0;

  // Color helpers
  const profitColor = isProfit ? colors.success : colors.danger;
  const returnColor =
    returnRate >= 100
      ? colors.success
      : returnRate >= 85
      ? colors.warning
      : colors.danger;

  return (
    <div style={styles.container}>
      {/* Hero Stats */}
      <HeroGrid>
        <HeroCard
          icon={isProfit ? ArrowUpRight : ArrowDownRight}
          label={isProfit ? "PROFIT" : "LOSS"}
          value={`${isProfit ? "+" : ""}${profit.toFixed(2)}`}
          unit="PED"
          color={profitColor}
          highlight
          glow={isProfit}
        />
        <HeroCard
          icon={TrendingUp}
          label="RETURN RATE"
          value={`${returnRate.toFixed(1)}%`}
          unit="of spend recovered"
          color={returnColor}
        />
        <HeroCard
          icon={ArrowDownRight}
          label="TOTAL SPENT"
          value={stats.totalSpend.toFixed(2)}
          unit="PED"
          color={colors.danger}
        />
        <HeroCard
          icon={ArrowUpRight}
          label="TOTAL LOOT"
          value={stats.lootValue.toFixed(2)}
          unit="PED"
          color={colors.success}
        />
      </HeroGrid>

      {/* Secondary Stats Row */}
      <div style={styles.secondaryRow}>
        <SecondaryItem
          label="PED/Hour"
          value={`${profitPerHour >= 0 ? "+" : ""}${profitPerHour.toFixed(2)}`}
          color={profitPerHour >= 0 ? colors.success : colors.danger}
        />
        <SecondaryItem
          label="PED/Kill"
          value={`${profitPerKill >= 0 ? "+" : ""}${profitPerKill.toFixed(4)}`}
          color={profitPerKill >= 0 ? colors.success : colors.danger}
        />
        <SecondaryItem label="Cost/Shot" value={costPerShot.toFixed(4)} />
      </div>

      {/* Return Rate Bar */}
      <div style={styles.returnPanel}>
        <div style={styles.returnHeader}>
          <span style={styles.returnTitle}>SESSION PERFORMANCE</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: returnColor }}>
            {returnRate.toFixed(1)}%
          </span>
        </div>
        <div style={styles.returnBar}>
          <div
            style={{
              ...styles.returnFill,
              width: `${Math.min(returnRate, 150) / 1.5}%`,
              backgroundColor: returnColor,
            }}
          />
          <div style={styles.returnMarker} />
        </div>
        <div style={styles.returnLegend}>
          <span>0%</span>
          <span style={{ color: colors.textMuted }}>← Loss | Profit →</span>
          <span>150%</span>
        </div>
      </div>

      {/* Loadout Breakdown */}
      {stats.loadoutBreakdown.length > 1 && (
        <>
          <button
            onClick={() => setShowLoadouts(!showLoadouts)}
            style={styles.collapseToggle}
          >
            {showLoadouts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showLoadouts ? "Hide" : "Compare"} Loadout Performance (
            {stats.loadoutBreakdown.length} loadouts)
          </button>

          {showLoadouts && (
            <div style={styles.loadoutPanel}>
              <div style={styles.loadoutHeader}>LOADOUT COMPARISON</div>
              <div style={styles.loadoutList}>
                {stats.loadoutBreakdown.map((lb, idx) => {
                  const lbReturn =
                    lb.spend > 0 ? (lb.lootValue / lb.spend) * 100 : 0;
                  const isLbProfit = lb.profit >= 0;
                  const lbReturnColor =
                    lbReturn >= 100
                      ? colors.success
                      : lbReturn >= 85
                      ? colors.warning
                      : colors.danger;
                  return (
                    <div key={lb.loadoutId ?? idx} style={styles.loadoutRow}>
                      <div style={styles.loadoutName}>{lb.loadoutName}</div>
                      <div style={styles.loadoutMeta}>
                        {lb.shots} shots • {lb.costPerShot.toFixed(4)}/shot
                      </div>
                      <div style={styles.loadoutStats}>
                        <span style={{ color: colors.danger }}>
                          -{lb.spend.toFixed(2)}
                        </span>
                        <span style={{ color: colors.success }}>
                          +{lb.lootValue.toFixed(2)}
                        </span>
                        <span
                          style={{
                            color: isLbProfit ? colors.success : colors.danger,
                            fontWeight: 700,
                          }}
                        >
                          {isLbProfit ? "+" : ""}
                          {lb.profit.toFixed(2)}
                        </span>
                        <span style={{ color: lbReturnColor, fontWeight: 600 }}>
                          {lbReturn.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Single loadout display */}
      {stats.loadoutBreakdown.length === 1 && (
        <div style={styles.singleLoadout}>
          <Crosshair size={14} style={{ color: colors.textMuted }} />
          <span style={{ color: colors.textSecondary }}>Loadout: </span>
          <span style={{ color: colors.textPrimary }}>
            {stats.loadoutBreakdown[0].loadoutName}
          </span>
          <span style={{ color: colors.textMuted, marginLeft: "auto" }}>
            {stats.loadoutBreakdown[0].costPerShot.toFixed(4)} PED/shot
          </span>
        </div>
      )}
    </div>
  );
}

// ==================== Local Components ====================

function SecondaryItem({
  label,
  value,
  color = colors.textPrimary,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={styles.secondaryItem}>
      <span style={styles.secondaryLabel}>{label}</span>
      <span style={{ ...styles.secondaryValue, color }}>{value}</span>
    </div>
  );
}

// ==================== Styles ====================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
    overflow: "auto",
    flex: 1,
  },

  // Secondary Stats Row
  secondaryRow: {
    display: "flex",
    justifyContent: "space-around",
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
  },
  secondaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  secondaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  secondaryValue: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: typography.mono,
  },

  // Return Rate Panel
  returnPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  returnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  returnTitle: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
  },
  returnBar: {
    height: 12,
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    overflow: "hidden",
    position: "relative",
  },
  returnFill: {
    height: "100%",
    borderRadius: radius.sm,
    transition: "width 0.3s ease",
  },
  returnMarker: {
    position: "absolute",
    left: "66.67%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.textPrimary,
  },
  returnLegend: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Collapse Toggle
  collapseToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textSecondary,
    fontSize: 13,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },

  // Loadout Panel
  loadoutPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  loadoutHeader: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  loadoutList: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  loadoutRow: {
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
  },
  loadoutName: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  loadoutMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  loadoutStats: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    fontFamily: typography.mono,
  },

  // Single Loadout
  singleLoadout: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    fontSize: 13,
  },
};
