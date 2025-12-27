/**
 * ARTEMIS v3 - Combat Analytics
 * Focus: Am I hitting? Am I efficient? Am I surviving?
 */

import React, { useState } from "react";
import {
  Crosshair,
  Target,
  Skull,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { SessionStats } from "../core/session";
import {
  HeroCard,
  HeroGrid,
  EmptyState,
  DetailRow,
  colors,
  spacing,
  radius,
  typography,
} from "./ui";

interface CombatAnalyticsProps {
  stats: SessionStats | null;
}

export function CombatAnalytics({ stats }: CombatAnalyticsProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!stats || stats.combat.totalShots === 0) {
    return (
      <EmptyState
        icon={Crosshair}
        title="No Combat Data Yet"
        subtitle="Combat stats will appear once you start shooting"
      />
    );
  }

  // Key combat metrics
  const hitRate = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
  const critRate = stats.hits > 0 ? (stats.criticals / stats.hits) * 100 : 0;
  const killsPerHour =
    stats.duration > 0 ? (stats.kills / stats.duration) * 3600 : 0;
  const kdr = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;

  // Efficiency metrics
  const dps = stats.combat.dps;
  const avgDmgPerHit = stats.combat.averageDamagePerHit;
  const damagePerKill = stats.kills > 0 ? stats.damageDealt / stats.kills : 0;

  // Color helpers
  const hitRateColor =
    hitRate >= 70
      ? colors.success
      : hitRate >= 50
      ? colors.warning
      : colors.danger;
  const critRateColor = critRate >= 10 ? colors.warning : colors.textPrimary;
  const kdrColor =
    kdr >= 10 ? colors.success : kdr >= 1 ? colors.warning : colors.danger;

  return (
    <div style={styles.container}>
      {/* Hero Stats - 4 key metrics */}
      <HeroGrid>
        <HeroCard
          icon={Target}
          label="HIT RATE"
          value={`${hitRate.toFixed(1)}%`}
          unit={`${stats.hits} / ${stats.shots} shots`}
          color={hitRateColor}
        />
        <HeroCard
          icon={Zap}
          label="CRIT RATE"
          value={`${critRate.toFixed(1)}%`}
          unit={`${stats.criticals} criticals`}
          color={critRateColor}
        />
        <HeroCard
          icon={Skull}
          label="KILLS"
          value={stats.kills}
          unit={`${killsPerHour.toFixed(1)} per hour`}
          color={colors.warning}
        />
        <HeroCard
          icon={Shield}
          label="K/D RATIO"
          value={kdr.toFixed(1)}
          unit={`${stats.kills}K / ${stats.deaths}D`}
          color={kdrColor}
        />
      </HeroGrid>

      {/* Accuracy Visualization */}
      <div style={styles.accuracyPanel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelTitle}>SHOT ACCURACY</span>
        </div>
        <div style={styles.accuracyBar}>
          <div
            style={{
              ...styles.accuracySegment,
              width: `${hitRate}%`,
              backgroundColor: colors.success,
            }}
          >
            {hitRate > 15 && <span>Hits {stats.hits}</span>}
          </div>
          <div
            style={{
              ...styles.accuracySegment,
              width: `${100 - hitRate}%`,
              backgroundColor: colors.danger,
            }}
          >
            {100 - hitRate > 15 && <span>Miss {stats.misses}</span>}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={styles.quickStatsRow}>
        <QuickStat label="Combat DPS" value={dps.toFixed(1)} />
        <QuickStat label="Avg Dmg/Hit" value={avgDmgPerHit.toFixed(1)} />
        <QuickStat label="Dmg/Kill" value={damagePerKill.toFixed(0)} />
        <QuickStat
          label="Total Damage"
          value={stats.damageDealt.toFixed(0)}
          color={colors.danger}
        />
        <QuickStat label="Ammo Used" value={stats.combat.ammoConsumed} />
      </div>

      {/* Collapsible Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={styles.collapseToggle}
      >
        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showDetails ? "Hide" : "Show"} Detailed Breakdown
      </button>

      {showDetails && (
        <div style={styles.detailsGrid}>
          {/* Offense Details */}
          <div style={styles.detailPanel}>
            <div style={styles.detailHeader}>
              <Crosshair size={14} style={{ color: colors.danger }} />
              <span>OFFENSE</span>
            </div>
            <div style={styles.detailRows}>
              <DetailRow label="Total Shots" value={stats.shots} />
              <DetailRow
                label="Hits"
                value={stats.hits}
                color={colors.success}
              />
              <DetailRow
                label="Misses"
                value={stats.misses}
                color={colors.danger}
              />
              <DetailRow
                label="Critical Hits"
                value={stats.criticals}
                color={colors.warning}
              />
              <DetailRow
                label="Critical Damage"
                value={stats.combat.criticalDamage.toFixed(0)}
                color={colors.warning}
              />
              <DetailRow
                label="Max Single Hit"
                value={stats.combat.maxDamageHit.toFixed(0)}
                color="#ec4899"
              />
            </div>
          </div>

          {/* Defense Details */}
          <div style={styles.detailPanel}>
            <div style={styles.detailHeader}>
              <Shield size={14} style={{ color: colors.info }} />
              <span>DEFENSE</span>
            </div>
            <div style={styles.detailRows}>
              <DetailRow
                label="Deaths"
                value={stats.deaths}
                color={stats.deaths > 0 ? colors.danger : colors.success}
              />
              <DetailRow
                label="Damage Taken"
                value={stats.damageTaken.toFixed(0)}
                color={colors.danger}
              />
              <DetailRow
                label="Damage Reduced"
                value={stats.combat.damageReduced.toFixed(0)}
                color={colors.success}
              />
              <DetailRow
                label="Your Dodges"
                value={stats.combat.playerDodges}
              />
              <DetailRow
                label="Your Evades"
                value={stats.combat.playerEvades}
              />
              <DetailRow
                label="Self Healed"
                value={stats.combat.selfHealing.toFixed(0)}
                color={colors.success}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Local Components ====================

function QuickStat({
  label,
  value,
  color = colors.textPrimary,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={styles.quickStat}>
      <span style={styles.quickStatLabel}>{label}</span>
      <span style={{ ...styles.quickStatValue, color }}>{value}</span>
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

  // Accuracy Panel
  accuracyPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  panelHeader: {
    marginBottom: spacing.md,
  },
  panelTitle: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
  },
  accuracyBar: {
    display: "flex",
    height: 36,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.bgHover,
  },
  accuracySegment: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    color: colors.bgBase,
    transition: "width 0.3s ease",
  },

  // Quick Stats Row
  quickStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: spacing.md,
  },
  quickStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: `${spacing.md}px ${spacing.sm}px`,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  quickStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: typography.mono,
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

  // Details Grid
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.lg,
  },
  detailPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.border}`,
  },
  detailRows: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
};
