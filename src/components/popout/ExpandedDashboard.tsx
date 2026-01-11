/**
 * ExpandedDashboard - Full dashboard view for larger popout sizes
 * Shows rich charts and detailed stats when window is expanded
 */

import React from "react";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Crosshair,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { colors, spacing, radius } from "../ui";
import type { LiveStats } from "../../types/electron";
import { STAT_MAP, type StatData } from "./stat-definitions";

interface ExpandedDashboardProps {
  stats: LiveStats;
  history: Record<string, number[]>;
  formatDuration: (seconds: number) => string;
  heroStats: string[]; // configurable hero stat keys
  gridStats: string[]; // configurable grid stat keys
  showCharts: boolean; // show/hide charts
  onChangeHeroStat?: (index: number, newStatKey: string) => void;
  onChangeGridStat?: (index: number, newStatKey: string) => void;
  settingsMode?: boolean; // enable stat selection dropdowns
}

// Color palette
const CHART_COLORS = {
  profit: "#22c55e",
  loss: "#ef4444",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  accent: "#f59e0b",
  muted: "#6b7280",
  text: "#f3f4f6",
};

export function ExpandedDashboard({
  stats,
  history,
  formatDuration,
  heroStats,
  gridStats,
  showCharts,
  onChangeHeroStat,
  onChangeGridStat,
  settingsMode = false,
}: ExpandedDashboardProps) {
  const statData: StatData = stats;
  const misses = Math.max(0, stats.shots - stats.hits);

  // Prepare profit history for chart
  const profitData = (history.netProfit || history.profit || []).map(
    (value, i) => ({
      time: i,
      profit: value,
    })
  );

  // Take last 100 points for smoother chart
  const chartData = profitData.slice(-100);

  // Accuracy pie data
  const accuracyData = [
    { name: "Hits", value: stats.hits, color: CHART_COLORS.primary },
    { name: "Misses", value: misses, color: CHART_COLORS.muted },
  ];

  return (
    <div style={styles.container}>
      {/* Hero Stats Row - Configurable */}
      <div style={styles.heroRow}>
        {heroStats.map((statKey, index) => {
          const statDef = STAT_MAP.get(statKey);
          if (!statDef) return null;
          const statValue = statDef.getValue(statData);
          return (
            <HeroStat
              key={statKey}
              icon={statDef.icon}
              label={statDef.label}
              value={statValue.value}
              unit={statValue.unit}
              color={statValue.color}
              settingsMode={settingsMode}
              statKey={statKey}
              onChangeStat={
                onChangeHeroStat
                  ? (newKey) => onChangeHeroStat(index, newKey)
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Charts Row - Conditional */}
      {showCharts && <div style={styles.chartsRow}>
        {/* Profit Timeline */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <Activity size={14} style={{ color: colors.textMuted }} />
            <span style={styles.chartTitle}>Profit Over Time</span>
          </div>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <defs>
                  <linearGradient
                    id="profitGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={
                        stats.netProfit >= 0
                          ? CHART_COLORS.profit
                          : CHART_COLORS.loss
                      }
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        stats.netProfit >= 0
                          ? CHART_COLORS.profit
                          : CHART_COLORS.loss
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={
                    stats.netProfit >= 0
                      ? CHART_COLORS.profit
                      : CHART_COLORS.loss
                  }
                  fill="url(#profitGradient)"
                  strokeWidth={2}
                  dot={false}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    `${value.toFixed(2)} PED`,
                    "Profit",
                  ]}
                  labelFormatter={() => ""}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accuracy Pie */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <Crosshair size={14} style={{ color: colors.textMuted }} />
            <span style={styles.chartTitle}>Hit Distribution</span>
          </div>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={accuracyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {accuracyData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.pieLegend}>
            <span style={{ color: CHART_COLORS.primary }}>
              ● Hits: {stats.hits}
            </span>
            <span style={{ color: CHART_COLORS.muted }}>● Miss: {misses}</span>
          </div>
        </div>
      </div>}

      {/* Stats Grid - Configurable */}
      <div style={styles.statsGrid}>
        {gridStats.map((statKey, index) => {
          const statDef = STAT_MAP.get(statKey);
          if (!statDef) return null;
          const statValue = statDef.getValue(statData);
          return (
            <StatCard
              key={statKey}
              label={statDef.label}
              value={statValue.value}
              subtext={statValue.unit}
              icon={statDef.icon}
              color={statValue.color}
              settingsMode={settingsMode}
              statKey={statKey}
              onChangeStat={
                onChangeGridStat
                  ? (newKey) => onChangeGridStat(index, newKey)
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Session Info Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          Session: {formatDuration(stats.duration)}
        </span>
        <span style={styles.footerText}>
          {stats.kills > 0 && stats.duration > 0
            ? `${((stats.kills / stats.duration) * 3600).toFixed(1)} kills/hr`
            : "—"}
        </span>
        <span style={styles.footerText}>
          {stats.lootValue > 0 && stats.duration > 0
            ? `${((stats.lootValue / stats.duration) * 3600).toFixed(
                0
              )} PED/hr loot`
            : "—"}
        </span>
      </div>
    </div>
  );
}

// Hero stat component
function HeroStat({
  icon: Icon,
  label,
  value,
  unit,
  color,
  trend,
  settingsMode,
  statKey,
  onChangeStat,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  trend?: "up" | "down";
  settingsMode?: boolean;
  statKey?: string;
  onChangeStat?: (newStatKey: string) => void;
}) {
  return (
    <div style={styles.heroStat}>
      <div style={styles.heroIcon}>
        <Icon size={16} style={{ color }} />
      </div>
      <div style={styles.heroContent}>
        {settingsMode && onChangeStat ? (
          <select
            value={statKey}
            onChange={(e) => onChangeStat(e.target.value)}
            style={styles.statSelect}
          >
            {Array.from(STAT_MAP.entries()).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>
        ) : (
          <span style={styles.heroLabel}>{label}</span>
        )}
        <div style={styles.heroValue}>
          <span style={{ color, fontSize: "20px", fontWeight: 700 }}>
            {value}
          </span>
          {unit && <span style={styles.heroUnit}>{unit}</span>}
          {trend &&
            (trend === "up" ? (
              <TrendingUp
                size={14}
                style={{ color: CHART_COLORS.profit, marginLeft: 4 }}
              />
            ) : (
              <TrendingDown
                size={14}
                style={{ color: CHART_COLORS.loss, marginLeft: 4 }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// Small stat card
function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
  settingsMode,
  statKey,
  onChangeStat,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color?: string;
  settingsMode?: boolean;
  statKey?: string;
  onChangeStat?: (newStatKey: string) => void;
}) {
  return (
    <div style={styles.statCard}>
      <Icon size={12} style={{ color: color || colors.textMuted }} />
      <div style={styles.statContent}>
        {settingsMode && onChangeStat ? (
          <select
            value={statKey}
            onChange={(e) => onChangeStat(e.target.value)}
            style={styles.statSelectSmall}
          >
            {Array.from(STAT_MAP.entries()).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>
        ) : (
          <span style={styles.statLabel}>{label}</span>
        )}
        <span
          style={{ ...styles.statValue, color: color || CHART_COLORS.text }}
        >
          {value}
          {subtext && <span style={styles.statSubtext}> {subtext}</span>}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
    padding: spacing.md,
    overflow: "auto",
  },
  heroRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: spacing.sm,
  },
  heroStat: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    background: colors.bgCard,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    background: colors.bgPanel,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    display: "flex",
    flexDirection: "column",
  },
  heroLabel: {
    fontSize: "10px",
    fontWeight: 600,
    color: colors.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  heroValue: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
  },
  heroUnit: {
    fontSize: "12px",
    color: colors.textMuted,
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: spacing.sm,
  },
  chartCard: {
    background: colors.bgCard,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    padding: spacing.md,
  },
  chartHeader: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chartTitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  chartContainer: {
    height: 120,
  },
  pieLegend: {
    display: "flex",
    justifyContent: "center",
    gap: spacing.md,
    fontSize: "10px",
    marginTop: spacing.xs,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: spacing.xs,
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    background: colors.bgCard,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: "9px",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  statValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: CHART_COLORS.text,
    fontFamily: "monospace",
  },
  statSubtext: {
    fontSize: "10px",
    color: colors.textMuted,
  },
  statSelect: {
    fontSize: "10px",
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: "2px 4px",
    cursor: "pointer",
  },
  statSelectSmall: {
    fontSize: "9px",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: "1px 2px",
    cursor: "pointer",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    padding: `${spacing.sm} ${spacing.md}`,
    background: colors.bgPanel,
    borderRadius: radius.md,
    marginTop: "auto",
  },
  footerText: {
    fontSize: "10px",
    color: colors.textMuted,
    fontFamily: "monospace",
  },
};
