/**
 * ARTEMIS v3 - Unified Dashboard
 * Streamlined view with the most important stats for not losing money
 *
 * Top 10 Economy Stats:
 * 1. Return Rate % - THE core metric
 * 2. Net Profit/Loss - Bottom line
 * 3. Markup Value - Where real profit comes from
 * 4. Return Rate w/ Markup - True return
 * 5. Cost Per Kill - Efficiency check
 * 6. Loot Per Kill - Margin indicator
 * 7. PED/Hour - Time efficiency
 * 8. Total Spent - Burn rate
 * 9. Armor Decay - Hidden cost
 * 10. Cost Per Shot - Loadout efficiency
 */

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Skull,
  Clock,
  Crosshair,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Award,
  Zap,
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

interface DashboardProps {
  stats: SessionStats | null;
  isActive: boolean;
  showMarkup: boolean;
  onToggleMarkup: () => void;
}

export function Dashboard({
  stats,
  isActive,
  showMarkup,
  onToggleMarkup,
}: DashboardProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!stats) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No Active Session"
        subtitle="Start tracking to see your economy stats"
      />
    );
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Determine which values to show based on markup toggle
  const returnRate =
    showMarkup && stats.markupEnabled
      ? stats.returnRateWithMarkup
      : stats.returnRate;
  const profit =
    showMarkup && stats.markupEnabled
      ? stats.netProfitWithMarkup
      : stats.netProfit;
  const lootValue =
    showMarkup && stats.markupEnabled
      ? stats.lootValueWithMarkup
      : stats.lootValue;

  // Derived stats
  const profitPerHour =
    stats.duration > 0 ? (profit / stats.duration) * 3600 : 0;
  const costPerKill = stats.kills > 0 ? stats.totalSpend / stats.kills : 0;
  const lootPerKill = stats.kills > 0 ? lootValue / stats.kills : 0;
  const costPerShot = stats.shots > 0 ? stats.totalSpend / stats.shots : 0;
  const hitRate = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;

  // Color helpers
  const profitColor = profit >= 0 ? colors.success : colors.danger;
  const returnColor =
    returnRate >= 100
      ? colors.success
      : returnRate >= 90
      ? colors.warning
      : colors.danger;
  const hitRateColor =
    hitRate >= 70
      ? colors.success
      : hitRate >= 50
      ? colors.warning
      : colors.danger;

  return (
    <div style={styles.container}>
      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <div
            style={{
              ...styles.statusDot,
              backgroundColor: isActive ? colors.success : colors.danger,
            }}
          />
          <span style={styles.statusText}>
            {isActive ? "TRACKING" : "PAUSED"}
          </span>
          <Clock size={14} style={{ marginLeft: spacing.md }} />
          <span style={styles.statusText}>
            {formatDuration(stats.duration)}
          </span>
        </div>

        {/* Markup Toggle */}
        <button onClick={onToggleMarkup} style={styles.markupToggle}>
          {showMarkup ? (
            <ToggleRight size={18} color={colors.success} />
          ) : (
            <ToggleLeft size={18} />
          )}
          <span
            style={{ color: showMarkup ? colors.success : colors.textMuted }}
          >
            {showMarkup ? "Markup" : "TT Only"}
          </span>
          {showMarkup && stats.markupEnabled && stats.markupValue > 0 && (
            <span style={styles.markupBadge}>
              +{stats.markupValue.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Hero Stats - The 4 Most Important */}
      <HeroGrid>
        <HeroCard
          icon={returnRate >= 100 ? TrendingUp : TrendingDown}
          label="RETURN RATE"
          value={`${returnRate.toFixed(1)}%`}
          unit={showMarkup && stats.markupEnabled ? "with markup" : "TT value"}
          color={returnColor}
          highlight
          glow={returnRate >= 100}
        />
        <HeroCard
          icon={DollarSign}
          label={profit >= 0 ? "PROFIT" : "LOSS"}
          value={`${profit >= 0 ? "+" : ""}${profit.toFixed(2)}`}
          unit="PED"
          color={profitColor}
          glow={profit > 0}
        />
        <HeroCard
          icon={Skull}
          label="KILLS"
          value={stats.kills}
          unit={`${(stats.kills / (stats.duration / 3600) || 0).toFixed(0)}/hr`}
          color={colors.warning}
        />
        <HeroCard
          icon={Target}
          label="HIT RATE"
          value={`${hitRate.toFixed(1)}%`}
          unit={`${stats.hits}/${stats.shots}`}
          color={hitRateColor}
        />
      </HeroGrid>

      {/* Economy Summary - Key Numbers */}
      <div style={styles.economyPanel}>
        <div style={styles.economyHeader}>
          <span style={styles.panelTitle}>ECONOMY</span>
        </div>
        <div style={styles.economyGrid}>
          <EconomyStat
            label="Total Spent"
            value={`-${stats.totalSpend.toFixed(2)}`}
            color={colors.danger}
          />
          <EconomyStat
            label="Total Loot"
            value={`+${lootValue.toFixed(2)}`}
            color={colors.success}
          />
          <EconomyStat
            label="PED/Hour"
            value={`${profitPerHour >= 0 ? "+" : ""}${profitPerHour.toFixed(
              2
            )}`}
            color={profitPerHour >= 0 ? colors.success : colors.danger}
          />
          <EconomyStat
            label="Cost/Kill"
            value={costPerKill.toFixed(4)}
            color={colors.textPrimary}
          />
          <EconomyStat
            label="Loot/Kill"
            value={lootPerKill.toFixed(4)}
            color={colors.textPrimary}
          />
          <EconomyStat
            label="Armor Decay"
            value={stats.decay.toFixed(2)}
            color={colors.warning}
          />
        </div>
      </div>

      {/* Return Rate Visualization */}
      <div style={styles.returnPanel}>
        <div style={styles.returnHeader}>
          <span style={styles.panelTitle}>SESSION PERFORMANCE</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: returnColor }}>
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
          <span style={{ color: colors.warning }}>90%</span>
          <span style={{ color: colors.success }}>100%</span>
          <span>150%</span>
        </div>
      </div>

      {/* Globals & HOFs */}
      {(stats.globalCount > 0 || stats.hofs > 0) && (
        <div style={styles.globalsRow}>
          <div style={styles.globalItem}>
            <Award size={20} style={{ color: "#ec4899" }} />
            <span style={styles.globalValue}>{stats.globalCount}</span>
            <span style={styles.globalLabel}>Globals</span>
          </div>
          {stats.hofs > 0 && (
            <div style={styles.globalItem}>
              <Award size={20} style={{ color: colors.warning }} />
              <span style={styles.globalValue}>{stats.hofs}</span>
              <span style={styles.globalLabel}>HOFs</span>
            </div>
          )}
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={styles.detailsToggle}
      >
        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showDetails ? "Hide" : "Show"} Combat & Efficiency Details
      </button>

      {showDetails && (
        <div style={styles.detailsPanel}>
          <div style={styles.detailsGrid}>
            {/* Combat Column */}
            <div style={styles.detailsColumn}>
              <div style={styles.detailsColumnHeader}>
                <Crosshair size={14} />
                <span>COMBAT</span>
              </div>
              <DetailRow
                label="Criticals"
                value={stats.criticals}
                color={colors.warning}
              />
              <DetailRow
                label="Crit Rate"
                value={`${
                  stats.hits > 0
                    ? ((stats.criticals / stats.hits) * 100).toFixed(1)
                    : 0
                }%`}
              />
              <DetailRow
                label="Damage Dealt"
                value={stats.damageDealt.toFixed(0)}
                color={colors.danger}
              />
              <DetailRow label="DPS" value={stats.combat.dps.toFixed(1)} />
              <DetailRow
                label="Deaths"
                value={stats.deaths}
                color={stats.deaths > 0 ? colors.danger : colors.success}
              />
            </div>

            {/* Efficiency Column */}
            <div style={styles.detailsColumn}>
              <div style={styles.detailsColumnHeader}>
                <Zap size={14} />
                <span>EFFICIENCY</span>
              </div>
              <DetailRow label="Cost/Shot" value={costPerShot.toFixed(4)} />
              <DetailRow label="Ammo Used" value={stats.combat.ammoConsumed} />
              <DetailRow
                label="Avg Dmg/Hit"
                value={stats.combat.averageDamagePerHit.toFixed(1)}
              />
              <DetailRow
                label="Dmg Reduced"
                value={stats.combat.damageReduced.toFixed(0)}
                color={colors.success}
              />
              <DetailRow
                label="Self Healed"
                value={stats.combat.selfHealing.toFixed(0)}
                color={colors.info}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loadout Performance (if multiple) */}
      {stats.loadoutBreakdown.length > 1 && (
        <div style={styles.loadoutPanel}>
          <div style={styles.panelTitle}>LOADOUT COMPARISON</div>
          <div style={styles.loadoutList}>
            {stats.loadoutBreakdown.map((lb, idx) => {
              const lbReturn =
                lb.spend > 0 ? (lb.lootValue / lb.spend) * 100 : 0;
              const lbReturnColor =
                lbReturn >= 100
                  ? colors.success
                  : lbReturn >= 90
                  ? colors.warning
                  : colors.danger;
              return (
                <div key={lb.loadoutId ?? idx} style={styles.loadoutRow}>
                  <span style={styles.loadoutName}>{lb.loadoutName}</span>
                  <span style={{ color: colors.textMuted }}>
                    {lb.shots} shots
                  </span>
                  <span style={{ color: lbReturnColor, fontWeight: 600 }}>
                    {lbReturn.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Local Components ====================

function EconomyStat({
  label,
  value,
  color = colors.textPrimary,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={styles.economyStat}>
      <span style={styles.economyLabel}>{label}</span>
      <span style={{ ...styles.economyValue, color }}>{value}</span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  color = colors.textPrimary,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{ ...styles.detailValue, color }}>{value}</span>
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

  // Status Bar
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.mono,
  },
  markupToggle: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    backgroundColor: "transparent",
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: radius.sm,
    cursor: "pointer",
    fontSize: 12,
    color: colors.textSecondary,
  },
  markupBadge: {
    fontSize: 10,
    color: colors.success,
    backgroundColor: `${colors.success}20`,
    padding: "2px 6px",
    borderRadius: radius.sm,
    fontWeight: 600,
  },

  // Economy Panel
  economyPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  economyHeader: {
    marginBottom: spacing.md,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  economyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: spacing.md,
  },
  economyStat: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  economyLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  economyValue: {
    fontSize: 16,
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
    left: "66.67%", // 100/150 = 66.67%
    top: -2,
    bottom: -2,
    width: 2,
    backgroundColor: colors.textMuted,
  },
  returnLegend: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    fontSize: 10,
    color: colors.textMuted,
  },

  // Globals Row
  globalsRow: {
    display: "flex",
    justifyContent: "center",
    gap: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
  },
  globalItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  globalValue: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  globalLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Details Toggle
  detailsToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "transparent",
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: radius.md,
    cursor: "pointer",
    color: colors.textSecondary,
    fontSize: 12,
    width: "100%",
  },

  // Details Panel
  detailsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.lg,
  },
  detailsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  detailsColumnHeader: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing.xs}px 0`,
    borderBottom: `1px solid ${colors.borderSubtle}`,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: typography.mono,
  },

  // Loadout Panel
  loadoutPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  loadoutList: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loadoutRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
  },
  loadoutName: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textPrimary,
    flex: 1,
  },
};
