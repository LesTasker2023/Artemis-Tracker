/**
 * ARTEMIS v3 - Session Charts
 * Visual analytics for hunting sessions with loadout breakdown support
 * Ported from v2's Chart.js implementation to React Recharts
 */

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import type { Session, SessionStats, LoadoutBreakdown } from "../core/session";
import { TrendingUp, Target, Zap, Award, BarChart3 } from "lucide-react";

// ==================== Types ====================

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  subtitle?: string;
}

interface ProfitOverTimeData {
  time: string;
  profit: number;
  loot: number;
  cost: number;
}

interface DamageDistributionData {
  range: string;
  count: number;
}

interface KillsTimelineData {
  time: string;
  kills: number;
}

interface SkillsVsProfitData {
  time: string;
  profit: number;
  skills: number;
}

// ==================== Color Constants ====================

const COLORS = {
  profit: "#22c55e", // Green
  loss: "#ef4444", // Red
  loot: "#3b82f6", // Blue
  cost: "#ef4444", // Red
  skills: "#8b5cf6", // Purple
  kills: "#10b981", // Emerald
  hits: "#22c55e", // Green
  misses: "#ef4444", // Red
  criticals: "#f59e0b", // Amber
  primary: "#f59e0b", // Amber (Project Delta brand)
  gridLine: "#374151",
  text: "#9ca3af",
  background: "hsl(220 13% 12%)",
  border: "hsl(220 13% 18%)",
};

// Loadout colors for breakdown charts
const LOADOUT_COLORS = [
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
];

// ==================== Chart Card Wrapper ====================

function ChartCard({ title, icon, children, subtitle }: ChartCardProps) {
  return (
    <div style={chartStyles.card}>
      <div style={chartStyles.cardHeader}>
        <div style={chartStyles.cardTitleGroup}>
          <span style={chartStyles.cardIcon}>{icon}</span>
          <h3 style={chartStyles.cardTitle}>{title}</h3>
        </div>
        {subtitle && <span style={chartStyles.cardSubtitle}>{subtitle}</span>}
      </div>
      <div style={chartStyles.chartContainer}>{children}</div>
    </div>
  );
}

// ==================== Profit Over Time Chart ====================

interface ProfitOverTimeChartProps {
  session: Session;
  stats: SessionStats;
}

export function ProfitOverTimeChart({
  session,
  stats,
}: ProfitOverTimeChartProps) {
  const data = useMemo<ProfitOverTimeData[]>(() => {
    const lootEvents = session.events.filter((e) => e.type === "loot");

    if (lootEvents.length === 0 && stats.shots === 0) {
      return [];
    }

    // Group into 5-minute buckets
    const bucketMinutes = 5;
    const numBuckets = Math.max(
      1,
      Math.ceil(stats.duration / 60 / bucketMinutes)
    );
    const costPerBucket = stats.totalSpend / numBuckets;
    const startTime = new Date(session.startedAt).getTime();

    const buckets: ProfitOverTimeData[] = [];
    let cumulativeLoot = 0;
    let cumulativeCost = 0;

    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = startTime + i * bucketMinutes * 60 * 1000;
      const bucketEnd = bucketStart + bucketMinutes * 60 * 1000;

      const bucketLoot = lootEvents
        .filter((e) => {
          const eventTime = e.timestamp ?? 0;
          return eventTime >= bucketStart && eventTime < bucketEnd;
        })
        .reduce((sum, e) => sum + (e.value ?? 0), 0);

      cumulativeLoot += bucketLoot;
      cumulativeCost += costPerBucket;

      buckets.push({
        time: `${i * bucketMinutes}m`,
        profit: parseFloat((cumulativeLoot - cumulativeCost).toFixed(2)),
        loot: parseFloat(cumulativeLoot.toFixed(2)),
        cost: parseFloat(cumulativeCost.toFixed(2)),
      });
    }

    return buckets;
  }, [session, stats]);

  if (data.length === 0) {
    return (
      <ChartCard title="Profit Over Time" icon={<TrendingUp size={18} />}>
        <div style={chartStyles.emptyState}>No economic data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Profit Over Time" icon={<TrendingUp size={18} />}>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
          <XAxis dataKey="time" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <YAxis
            tick={{ fill: COLORS.text, fontSize: 11 }}
            tickFormatter={(v) => `${v} PED`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#f8fafc" }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} PED`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          <ReferenceLine y={0} stroke={COLORS.text} strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="profit"
            fill={COLORS.profit}
            fillOpacity={0.3}
            stroke={COLORS.profit}
            strokeWidth={2}
            name="Profit"
          />
          <Line
            type="monotone"
            dataKey="loot"
            stroke={COLORS.loot}
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name="Total Loot"
          />
          <Line
            type="monotone"
            dataKey="cost"
            stroke={COLORS.cost}
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name="Total Cost"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ==================== Combat Performance (Pie/Doughnut) ====================

interface CombatPerformanceChartProps {
  stats: SessionStats;
}

export function CombatPerformanceChart({ stats }: CombatPerformanceChartProps) {
  const data = useMemo(() => {
    const totalMisses = stats.misses || stats.shots - stats.hits;
    return [
      { name: "Hits", value: stats.hits, color: COLORS.hits },
      { name: "Misses", value: totalMisses, color: COLORS.misses },
      { name: "Criticals", value: stats.criticals, color: COLORS.criticals },
    ].filter((d) => d.value > 0);
  }, [stats]);

  if (stats.shots === 0) {
    return (
      <ChartCard title="Combat Performance" icon={<Target size={18} />}>
        <div style={chartStyles.emptyState}>No combat data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Combat Performance"
      icon={<Target size={18} />}
      subtitle={`${stats.shots} total shots`}
    >
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={{ stroke: COLORS.text }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
            }}
            formatter={(value: number) => [
              `${value} (${((value / stats.shots) * 100).toFixed(1)}%)`,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ==================== Damage Distribution Chart ====================

interface DamageDistributionChartProps {
  session: Session;
}

export function DamageDistributionChart({
  session,
}: DamageDistributionChartProps) {
  const data = useMemo<DamageDistributionData[]>(() => {
    const hitEvents = session.events.filter((e) => e.type === "damage_dealt");

    if (hitEvents.length === 0) {
      return [];
    }

    const ranges = [
      { label: "0-10", min: 0, max: 10, count: 0 },
      { label: "11-25", min: 11, max: 25, count: 0 },
      { label: "26-50", min: 26, max: 50, count: 0 },
      { label: "51-100", min: 51, max: 100, count: 0 },
      { label: "100+", min: 101, max: Infinity, count: 0 },
    ];

    hitEvents.forEach((e) => {
      const damage = e.amount ?? 0;
      const range = ranges.find((r) => damage >= r.min && damage <= r.max);
      if (range) range.count++;
    });

    return ranges.map((r) => ({ range: r.label, count: r.count }));
  }, [session]);

  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <ChartCard title="Damage Distribution" icon={<Zap size={18} />}>
        <div style={chartStyles.emptyState}>No damage data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Damage Distribution" icon={<Zap size={18} />}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
          <XAxis dataKey="range" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <YAxis tick={{ fill: COLORS.text, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${value} hits`]}
          />
          <Bar dataKey="count" fill={COLORS.loot} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ==================== Kills Timeline Chart ====================

interface KillsTimelineChartProps {
  session: Session;
  stats: SessionStats;
}

export function KillsTimelineChart({
  session,
  stats,
}: KillsTimelineChartProps) {
  const data = useMemo<KillsTimelineData[]>(() => {
    const killEvents = session.events.filter((e) => e.type === "kill");

    if (killEvents.length === 0) {
      return [];
    }

    const startTime = new Date(session.startedAt).getTime();
    const intervalMinutes = 5;
    const intervals = Math.max(
      1,
      Math.ceil(stats.duration / 60 / intervalMinutes)
    );
    const buckets = Array(intervals).fill(0);

    killEvents.forEach((e) => {
      const eventTime = e.timestamp ?? startTime;
      const minutesElapsed = Math.floor((eventTime - startTime) / 60000);
      const bucketIndex = Math.min(
        Math.floor(minutesElapsed / intervalMinutes),
        buckets.length - 1
      );
      buckets[bucketIndex]++;
    });

    return buckets.map((kills, i) => ({
      time: `${i * intervalMinutes}-${(i + 1) * intervalMinutes}m`,
      kills,
    }));
  }, [session, stats]);

  if (data.length === 0 || data.every((d) => d.kills === 0)) {
    return (
      <ChartCard title="Kills Timeline" icon={<Target size={18} />}>
        <div style={chartStyles.emptyState}>No kill data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Kills Timeline" icon={<Target size={18} />}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
          <XAxis dataKey="time" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <YAxis
            tick={{ fill: COLORS.text, fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${value} kills`]}
          />
          <Bar dataKey="kills" fill={COLORS.kills} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ==================== Skills vs Profit Chart ====================

interface SkillsVsProfitChartProps {
  session: Session;
  stats: SessionStats;
}

export function SkillsVsProfitChart({
  session,
  stats,
}: SkillsVsProfitChartProps) {
  const data = useMemo<SkillsVsProfitData[]>(() => {
    const lootEvents = session.events.filter((e) => e.type === "loot");
    const skillEvents = session.events.filter((e) => e.type === "skill_gain");

    if (lootEvents.length === 0 && skillEvents.length === 0) {
      return [];
    }

    const startTime = new Date(session.startedAt).getTime();
    const bucketMinutes = 5;
    const numBuckets = Math.max(
      1,
      Math.ceil(stats.duration / 60 / bucketMinutes)
    );
    const costPerBucket = stats.totalSpend / numBuckets;

    const buckets: SkillsVsProfitData[] = [];
    let cumulativeLoot = 0;
    let cumulativeCost = 0;

    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = startTime + i * bucketMinutes * 60 * 1000;
      const bucketEnd = bucketStart + bucketMinutes * 60 * 1000;

      const bucketLoot = lootEvents
        .filter((e) => {
          const eventTime = e.timestamp ?? 0;
          return eventTime >= bucketStart && eventTime < bucketEnd;
        })
        .reduce((sum, e) => sum + (e.value ?? 0), 0);

      const bucketSkills = skillEvents.filter((e) => {
        const eventTime = e.timestamp ?? 0;
        return eventTime >= bucketStart && eventTime < bucketEnd;
      }).length;

      cumulativeLoot += bucketLoot;
      cumulativeCost += costPerBucket;

      buckets.push({
        time: `${i * bucketMinutes}m`,
        profit: parseFloat((cumulativeLoot - cumulativeCost).toFixed(2)),
        skills: bucketSkills,
      });
    }

    return buckets;
  }, [session, stats]);

  if (data.length === 0) {
    return null; // Don't show if no data
  }

  return (
    <ChartCard
      title="Skills vs Profit Over Time"
      icon={<Award size={18} />}
      subtitle="Track skill gains alongside profit"
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
          <XAxis dataKey="time" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            tick={{ fill: COLORS.profit, fontSize: 11 }}
            tickFormatter={(v) => `${v}`}
            label={{
              value: "Profit (PED)",
              angle: -90,
              position: "insideLeft",
              style: { fill: COLORS.profit, fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: COLORS.skills, fontSize: 11 }}
            allowDecimals={false}
            label={{
              value: "Skill Gains",
              angle: 90,
              position: "insideRight",
              style: { fill: COLORS.skills, fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              name === "profit" ? `${value.toFixed(2)} PED` : value,
              name === "profit" ? "Profit" : "Skills",
            ]}
          />
          <Legend />
          <ReferenceLine
            yAxisId="left"
            y={0}
            stroke={COLORS.text}
            strokeDasharray="3 3"
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="profit"
            fill={COLORS.profit}
            fillOpacity={0.2}
            stroke={COLORS.profit}
            strokeWidth={2}
            name="Profit"
          />
          <Bar
            yAxisId="right"
            dataKey="skills"
            fill={COLORS.skills}
            opacity={0.8}
            radius={[4, 4, 0, 0]}
            name="Skills"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ==================== Loadout Breakdown Chart ====================

interface LoadoutBreakdownChartProps {
  breakdown: LoadoutBreakdown[];
}

export function LoadoutBreakdownChart({
  breakdown,
}: LoadoutBreakdownChartProps) {
  if (breakdown.length === 0) {
    return null;
  }

  // Prepare data for stacked bar visualization
  const chartData = breakdown.map((lb, idx) => ({
    name: lb.loadoutName,
    spend: -lb.spend, // Negative for visual effect
    loot: lb.lootValue,
    profit: lb.profit,
    color: LOADOUT_COLORS[idx % LOADOUT_COLORS.length],
  }));

  // Prepare pie chart data for profit distribution
  const profitData = breakdown
    .filter((lb) => Math.abs(lb.profit) > 0.01)
    .map((lb, idx) => ({
      name: lb.loadoutName,
      value: Math.abs(lb.profit),
      isProfit: lb.profit >= 0,
      color: LOADOUT_COLORS[idx % LOADOUT_COLORS.length],
    }));

  return (
    <ChartCard
      title="Loadout Performance"
      icon={<BarChart3 size={18} />}
      subtitle={`${breakdown.length} loadout${
        breakdown.length > 1 ? "s" : ""
      } used`}
    >
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* Per-loadout profit bars */}
        <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 60, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
              <XAxis
                type="number"
                tick={{ fill: COLORS.text, fontSize: 11 }}
                tickFormatter={(v) => `${v.toFixed(0)}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: COLORS.text, fontSize: 11 }}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  `${Math.abs(value).toFixed(2)} PED`,
                  name === "spend"
                    ? "Spend"
                    : name === "loot"
                    ? "Loot"
                    : "Profit",
                ]}
              />
              <ReferenceLine x={0} stroke={COLORS.text} />
              <Bar
                dataKey="spend"
                fill={COLORS.cost}
                name="Spend"
                stackId="stack"
              />
              <Bar
                dataKey="loot"
                fill={COLORS.loot}
                name="Loot"
                stackId="stack"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit distribution pie */}
        {profitData.length > 1 && (
          <div style={{ flex: "0 0 180px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={profitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  dataKey="value"
                  label={({ name }) => name}
                  labelLine={{ stroke: COLORS.text }}
                >
                  {profitData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={entry.isProfit ? 1 : 0.6}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: COLORS.background,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} PED`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Loadout summary table */}
      <div style={chartStyles.loadoutTable}>
        {breakdown.map((lb, idx) => (
          <div key={lb.loadoutId ?? idx} style={chartStyles.loadoutTableRow}>
            <div style={chartStyles.loadoutIndicator}>
              <span
                style={{
                  ...chartStyles.loadoutDot,
                  backgroundColor: LOADOUT_COLORS[idx % LOADOUT_COLORS.length],
                }}
              />
              <span>{lb.loadoutName}</span>
            </div>
            <div style={chartStyles.loadoutMetrics}>
              <span style={{ color: COLORS.text }}>
                {lb.shots} shots @ {lb.costPerShot.toFixed(4)}
              </span>
              <span style={{ color: COLORS.cost }}>-{lb.spend.toFixed(2)}</span>
              <span style={{ color: COLORS.loot }}>
                +{lb.lootValue.toFixed(2)}
              </span>
              <span
                style={{
                  color: lb.profit >= 0 ? COLORS.profit : COLORS.loss,
                  fontWeight: 600,
                }}
              >
                {lb.profit >= 0 ? "+" : ""}
                {lb.profit.toFixed(2)} PED
              </span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ==================== All Charts Container ====================

interface SessionChartsProps {
  session: Session;
  stats: SessionStats;
}

export function SessionCharts({ session, stats }: SessionChartsProps) {
  return (
    <div style={chartStyles.chartsGrid}>
      {/* 2x2 grid for main charts */}
      <div style={chartStyles.chartRow}>
        <ProfitOverTimeChart session={session} stats={stats} />
        <CombatPerformanceChart stats={stats} />
      </div>
      <div style={chartStyles.chartRow}>
        <DamageDistributionChart session={session} />
        <KillsTimelineChart session={session} stats={stats} />
      </div>

      {/* Full-width charts */}
      <SkillsVsProfitChart session={session} stats={stats} />

      {/* Loadout breakdown (if multiple loadouts) */}
      {stats.loadoutBreakdown.length > 0 && (
        <LoadoutBreakdownChart breakdown={stats.loadoutBreakdown} />
      )}
    </div>
  );
}

// ==================== Styles ====================

const chartStyles: Record<string, React.CSSProperties> = {
  chartsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  chartRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: "12px",
    padding: "16px",
    border: `1px solid ${COLORS.border}`,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  cardTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cardIcon: {
    color: COLORS.primary,
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: 0,
  },
  cardSubtitle: {
    fontSize: "12px",
    color: COLORS.text,
  },
  chartContainer: {
    width: "100%",
  },
  emptyState: {
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: COLORS.text,
    fontSize: "14px",
  },
  loadoutTable: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: "12px",
  },
  loadoutTableRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "#090d13",
    borderRadius: "8px",
    flexWrap: "wrap",
    gap: "8px",
  },
  loadoutIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#f8fafc",
  },
  loadoutDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
  },
  loadoutMetrics: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', monospace",
  },
};

export default SessionCharts;
