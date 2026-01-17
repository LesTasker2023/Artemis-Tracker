import React, { useState } from "react";
import { Session, SessionStats } from "../../core/session";
import { Loadout } from "../../core/loadout";
import { Info, ChevronRight } from "lucide-react";
import type { SkillCategory } from "../../core/types";

interface StatDefinition {
  label: string;
  description: string;
  getValue: (
    stats: SessionStats,
    adjustedLoot: number,
    adjustedSpend: number,
    totalDamage: number,
    totalShots: number,
    totalHits: number,
    totalSkillValue: number,
    combatTime: number,
    dps: number,
    dpp: number,
    eventCount: number
  ) => string | number;
  format?: (value: number) => string;
  color?: (value: number) => string;
}

const allStats: Record<string, StatDefinition> = {
  "Return Rate": {
    label: "Return Rate",
    description: "Percentage of total loot vs total spend (higher is better)",
    getValue: (_stats, adjustedLoot, adjustedSpend) =>
      adjustedSpend > 0 ? (adjustedLoot / adjustedSpend) * 100 : 0,
    format: (v) => `${v.toFixed(1)}%`,
    color: (v) => (v >= 90 ? "#4ade80" : v >= 80 ? "#fbbf24" : "#ef4444"),
  },
  "Profit/Loss": {
    label: "Profit/Loss",
    description: "Net profit or loss (Total Loot - Total Spend)",
    getValue: (_stats, adjustedLoot, adjustedSpend) =>
      adjustedLoot - adjustedSpend,
    format: (v) => `${v.toFixed(2)} PED`,
    color: (v) => (v >= 0 ? "#4ade80" : "#ef4444"),
  },
  "Total Kills": {
    label: "Total Kills",
    description: "Total number of mobs killed",
    getValue: (stats) => stats.kills ?? 0,
    format: (v) => v.toString(),
  },
  "Skills/PED": {
    label: "Skills/PED",
    description: "Skill gains per PED spent (efficiency measure)",
    getValue: (
      _stats,
      _adjustedLoot,
      adjustedSpend,
      _totalDamage,
      _totalShots,
      _totalHits,
      totalSkillValue
    ) => (adjustedSpend > 0 ? totalSkillValue / adjustedSpend : 0),
    format: (v) => v.toFixed(4),
  },
  "Hit Rate": {
    label: "Hit Rate",
    description: "Percentage of shots that hit the target",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      totalShots,
      totalHits
    ) => (totalShots > 0 ? (totalHits / totalShots) * 100 : 0),
    format: (v) => `${v.toFixed(1)}%`,
    color: (v) => (v >= 80 ? "#4ade80" : v >= 60 ? "#fbbf24" : "#ef4444"),
  },
  "Crit Rate": {
    label: "Crit Rate",
    description: "Percentage of hits that were critical hits",
    getValue: (stats) =>
      stats.hits > 0 ? (stats.criticals / stats.hits) * 100 : 0,
    format: (v) => `${v.toFixed(1)}%`,
  },
  "Total Events": {
    label: "Total Events",
    description: "Total number of events recorded in session",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      _totalShots,
      _totalHits,
      _totalSkillValue,
      _combatTime,
      _dps,
      _dpp,
      eventCount
    ) => eventCount,
    format: (v) => v.toString(),
  },
  "Total Loot": {
    label: "Total Loot",
    description: "Total PED value of all loot received",
    getValue: (_stats, adjustedLoot) => adjustedLoot,
    format: (v) => `${v.toFixed(2)} PED`,
    color: () => "#4ade80",
  },
  "Total Spend": {
    label: "Total Spend",
    description: "Total PED spent on ammunition and decay",
    getValue: (_stats, _adjustedLoot, adjustedSpend) => adjustedSpend,
    format: (v) => `${v.toFixed(2)} PED`,
    color: () => "#ef4444",
  },
  "Cost/Kill": {
    label: "Cost/Kill",
    description: "Average cost per mob killed",
    getValue: (stats, _adjustedLoot, adjustedSpend) =>
      stats.kills > 0 ? adjustedSpend / stats.kills : 0,
    format: (v) => `${v.toFixed(2)} PED`,
  },
  "Loot/Kill": {
    label: "Loot/Kill",
    description: "Average loot received per mob killed",
    getValue: (stats, adjustedLoot) =>
      stats.kills > 0 ? adjustedLoot / stats.kills : 0,
    format: (v) => `${v.toFixed(2)} PED`,
  },
  DPP: {
    label: "DPP",
    description: "Damage Per PEC - efficiency of damage vs cost",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      _totalShots,
      _totalHits,
      _totalSkillValue,
      _combatTime,
      _dps,
      dpp
    ) => dpp,
    format: (v) => v.toFixed(2),
  },
  DPS: {
    label: "DPS",
    description: "Damage Per Second - your damage output rate",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      _totalShots,
      _totalHits,
      _totalSkillValue,
      _combatTime,
      dps
    ) => dps,
    format: (v) => v.toFixed(1),
  },
  "Kills/PED": {
    label: "Kills/PED",
    description: "Number of kills per PED spent",
    getValue: (stats, _adjustedLoot, adjustedSpend) =>
      adjustedSpend > 0 ? stats.kills / adjustedSpend : 0,
    format: (v) => v.toFixed(2),
  },
  "Kills/Hour": {
    label: "Kills/Hour",
    description: "Projected kills per hour based on current rate",
    getValue: (stats) =>
      stats.duration > 0 ? (stats.kills / stats.duration) * 3600 : 0,
    format: (v) => v.toFixed(1),
  },
  "Avg Dmg/Hit": {
    label: "Avg Dmg/Hit",
    description: "Average damage dealt per successful hit",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      totalDamage,
      _totalShots,
      totalHits
    ) => (totalHits > 0 ? totalDamage / totalHits : 0),
    format: (v) => v.toFixed(1),
  },
  "Shots/Kill": {
    label: "Shots/Kill",
    description: "Average number of shots needed per kill",
    getValue: (
      stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      totalShots
    ) => (stats.kills > 0 ? totalShots / stats.kills : 0),
    format: (v) => v.toFixed(1),
  },
  "Total Gains": {
    label: "Total Gains",
    description: "Total skill value gained in the session",
    getValue: (stats) => stats.skills?.totalSkillGains ?? 0,
    format: (v) => v.toFixed(4),
  },
  "Skill Events": {
    label: "Skill Events",
    description: "Number of times skills increased",
    getValue: (stats) => stats.skills?.totalSkillEvents ?? 0,
    format: (v) => v.toString(),
  },
  "Skills/Hour": {
    label: "Skills/Hour",
    description: "Projected skill gains per hour",
    getValue: (stats) =>
      stats.duration > 0
        ? ((stats.skills?.totalSkillGains ?? 0) / stats.duration) * 3600
        : 0,
    format: (v) => v.toFixed(2),
  },
  "Skills/Kill": {
    label: "Skills/Kill",
    description: "Average skill gains per kill",
    getValue: (stats) =>
      stats.kills > 0 ? (stats.skills?.totalSkillGains ?? 0) / stats.kills : 0,
    format: (v) => v.toFixed(4),
  },
  "Avg Skill Value": {
    label: "Avg Skill Value",
    description: "Average skill value per skill event",
    getValue: (stats) =>
      (stats.skills?.totalSkillEvents ?? 0) > 0
        ? (stats.skills?.totalSkillGains ?? 0) /
          (stats.skills?.totalSkillEvents ?? 1)
        : 0,
    format: (v) => v.toFixed(4),
  },
  "Total Damage": {
    label: "Total Damage",
    description: "Total damage dealt in the session",
    getValue: (_stats, _adjustedLoot, _adjustedSpend, totalDamage) =>
      totalDamage,
    format: (v) => v.toFixed(0),
  },
  "Total Shots": {
    label: "Total Shots",
    description: "Total number of shots fired",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      totalShots
    ) => totalShots,
    format: (v) => v.toString(),
  },
  "Total Hits": {
    label: "Total Hits",
    description: "Total number of successful hits",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      _totalShots,
      totalHits
    ) => totalHits,
    format: (v) => v.toString(),
  },
  Deaths: {
    label: "Deaths",
    description: "Number of times you died",
    getValue: (stats) => stats.deaths ?? 0,
    format: (v) => v.toString(),
  },
  "Loot/Hour": {
    label: "Loot/Hour",
    description: "Projected loot per hour based on current rate",
    getValue: (
      _stats,
      adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      _totalShots,
      _totalHits,
      _totalSkillValue,
      combatTime
    ) => (combatTime > 0 ? (adjustedLoot / combatTime) * 3600 : 0),
    format: (v) => `${v.toFixed(2)} PED`,
  },
  "Spend/Hour": {
    label: "Spend/Hour",
    description: "Projected spend per hour based on current rate",
    getValue: (
      _stats,
      _adjustedLoot,
      adjustedSpend,
      _totalDamage,
      _totalShots,
      _totalHits,
      _totalSkillValue,
      combatTime
    ) => (combatTime > 0 ? (adjustedSpend / combatTime) * 3600 : 0),
    format: (v) => `${v.toFixed(2)} PED`,
  },
  "Dmg/Hour": {
    label: "Dmg/Hour",
    description: "Projected damage per hour based on current rate",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      totalDamage,
      _totalShots,
      _totalHits,
      _totalSkillValue,
      combatTime
    ) => (combatTime > 0 ? (totalDamage / combatTime) * 3600 : 0),
    format: (v) => v.toFixed(0),
  },
  "Combat Time": {
    label: "Combat Time",
    description: "Total time spent in combat",
    getValue: (
      _stats,
      _adjustedLoot,
      _adjustedSpend,
      _totalDamage,
      _totalShots,
      _totalHits,
      _totalSkillValue,
      combatTime
    ) => combatTime,
    format: (v) => `${Math.floor(v / 60)}m ${Math.floor(v % 60)}s`,
  },
};

const statDescriptions: Record<string, string> = Object.fromEntries(
  Object.entries(allStats).map(([key, stat]) => [key, stat.description])
);

const formatPED = (value: number): string => `${value.toFixed(2)} PED`;
const formatPercentage = (value: number): string => `${value.toFixed(1)}%`;
const formatDecimal = (value: number, decimals: number): string =>
  value.toFixed(decimals);

interface MainContentProps {
  session: Session | null;
  stats: SessionStats | null;
  loadout: Loadout | null;
  applyMarkup: boolean;
  applyAdditionalExpenses: boolean;
  heroStats: [string, string, string];
  onHeroStatsChange: (stats: [string, string, string]) => void;
  onNavigateToPage?: (page: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  session,
  stats,
  loadout,
  applyMarkup,
  applyAdditionalExpenses,
  heroStats,
  onHeroStatsChange,
  onNavigateToPage,
}) => {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Use provided stats or create empty default with all 0s for initial render or when session ends
  const displayStats: SessionStats =
    stats && !session?.endedAt
      ? stats
      : ({
          lootValue: 0,
          totalSpend: 0,
          damageDealt: 0,
          shots: 0,
          hits: 0,
          criticals: 0,
          kills: 0,
          skillGains: 0,
          duration: 0,
          returnRate: 0,
          netProfit: 0,
          armor: 0,
          markupEnabled: false,
          markupValue: 0,
          misses: 0,
          damageTaken: 0,
          dodges: 0,
          evades: 0,
          deflects: 0,
          deaths: 0,
          targetDodged: 0,
          targetEvaded: 0,
          targetResisted: 0,
          outOfRange: 0,
          selfHealing: 0,
          healCount: 0,
          healedByOthers: 0,
          healingGiven: 0,
          lootCount: 0,
          skillEvents: 0,
          globalCount: 0,
          hofs: 0,
          tierUps: 0,
          enhancerBreaks: 0,
          enhancerShrapnel: 0,
          miningClaims: 0,
          miningClaimValue: 0,
          miningNoFinds: 0,
          resourceDepleted: 0,
          buffsReceived: 0,
          debuffsReceived: 0,
          revives: 0,
          divineInterventions: 0,
          skills: {
            total: 0,
            totalSkillGains: 0,
            totalSkillEvents: 0,
            categories: {} as Record<string, SkillCategory>,
          },
        } as unknown as SessionStats);

  // Calculate key metrics with safe defaults
  const totalLoot = displayStats.lootValue ?? 0;
  const totalSpend = displayStats.totalSpend ?? 0;
  const totalDamage = displayStats.damageDealt ?? 0;
  const totalShots = displayStats.shots ?? 0;
  const totalHits = displayStats.hits ?? 0;
  const totalSkillValue = displayStats.skillGains ?? 0;
  const combatTime = displayStats.duration ?? 0;

  // Apply markup and additional expenses if toggles are enabled
  const markupMultiplier = applyMarkup ? 1.05 : 1; // 5% markup example
  const additionalExpensesAmount = applyAdditionalExpenses
    ? totalSpend * 0.02
    : 0; // 2% additional expenses example

  const adjustedLoot = totalLoot * markupMultiplier;
  const adjustedSpend = totalSpend + additionalExpensesAmount;

  const returnRate =
    adjustedSpend > 0 ? (adjustedLoot / adjustedSpend) * 100 : 0;
  const profitLoss = adjustedLoot - adjustedSpend;
  const skillsPerPED = adjustedSpend > 0 ? totalSkillValue / adjustedSpend : 0;
  const hitRate = totalShots > 0 ? (totalHits / totalShots) * 100 : 0;

  // DPS and DPP with realistic calculations
  const dps =
    loadout?.weapon?.usesPerMinute && totalShots > 0
      ? (totalDamage / totalShots) * (loadout.weapon.usesPerMinute / 60)
      : combatTime > 0
      ? totalDamage / combatTime
      : 0;

  const dpp =
    loadout?.weapon?.usesPerMinute && totalShots > 0
      ? totalDamage / totalShots / ((adjustedSpend / totalShots) * 100)
      : adjustedSpend > 0
      ? totalDamage / (adjustedSpend * 100)
      : 0;

  const StatRow = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: string;
    color?: string;
  }) => {
    const handleMouseLeave = () => {
      setTooltip(null);
    };

    return (
      <div style={styles.statRow} onMouseLeave={handleMouseLeave}>
        <div style={styles.statLabelRow}>
          <span style={styles.statLabel}>{label}</span>
          <Info
            size={12}
            style={styles.infoIcon}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                text: statDescriptions[label] || "No description available",
                x: rect.left + rect.width / 2,
                y: rect.top - 8,
              });
            }}
          />
        </div>
        <span
          style={{
            ...styles.statValue,
            color: color || styles.statValue.color,
          }}
        >
          {value}
        </span>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {tooltip && (
        <div
          style={{
            ...styles.tooltip,
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          {tooltip.text}
        </div>
      )}

      {isConfiguring && (
        <div style={styles.configModal} onClick={() => setIsConfiguring(false)}>
          <div
            style={styles.configContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.configTitle}>Configure Hero Stats</h3>
            <p style={styles.configSubtitle}>
              Select 3 stats to display in the hero row
            </p>
            <div style={styles.configGrid}>
              {Object.keys(allStats).map((statKey) => (
                <button
                  key={statKey}
                  style={{
                    ...styles.configButton,
                    ...(heroStats.includes(statKey)
                      ? styles.configButtonSelected
                      : {}),
                  }}
                  onClick={() => {
                    if (heroStats.includes(statKey)) {
                      // Remove if already selected
                      const newStats = heroStats.filter((s) => s !== statKey);
                      // Pad with empty strings to maintain tuple length
                      while (newStats.length < 3) {
                        newStats.push("");
                      }
                      onHeroStatsChange(newStats as [string, string, string]);
                    } else {
                      // Add if less than 3 selected
                      const currentStats = heroStats.filter((s) => s !== "");
                      if (currentStats.length < 3) {
                        const emptyIndex = heroStats.indexOf("");
                        if (emptyIndex !== -1) {
                          const newStats = [...heroStats];
                          newStats[emptyIndex] = statKey;
                          onHeroStatsChange(
                            newStats as [string, string, string]
                          );
                        } else {
                          onHeroStatsChange([
                            heroStats[0],
                            heroStats[1],
                            statKey,
                          ]);
                        }
                      }
                    }
                  }}
                >
                  {statKey}
                  {heroStats.includes(statKey) && (
                    <span style={styles.configBadge}>
                      {heroStats.indexOf(statKey) + 1}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              style={styles.configCloseButton}
              onClick={() => setIsConfiguring(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div style={styles.content}>
        {/* Hero Stats Row */}
        <div style={styles.heroRow}>
          <div style={styles.heroHeader}>
            <h3 style={styles.heroTitle}>Key Metrics</h3>
            <button
              style={styles.configIcon}
              onClick={() => setIsConfiguring(true)}
            >
              ⚙️
            </button>
          </div>
        </div>
        <div style={styles.heroRow}>
          {heroStats
            .filter((s) => s !== "")
            .map((statKey, index) => {
              const statDef = allStats[statKey];
              if (!statDef) return null;

              const rawValue = statDef.getValue(
                displayStats,
                adjustedLoot,
                adjustedSpend,
                totalDamage,
                totalShots,
                totalHits,
                totalSkillValue,
                combatTime,
                dps,
                dpp,
                session?.events?.length ?? 0
              );
              const numValue = typeof rawValue === "number" ? rawValue : 0;
              const displayValue = statDef.format
                ? statDef.format(numValue)
                : rawValue.toString();
              const color = statDef.color
                ? statDef.color(numValue)
                : "hsl(0 0% 95%)";

              return (
                <div key={index} style={styles.heroCard}>
                  <div style={styles.heroLabel}>{statDef.label}</div>
                  <div style={{ ...styles.heroValue, color }}>
                    {displayValue}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Category Grid */}
        <div style={styles.grid}>
          {/* Performance */}
          <div style={styles.categoryCard}>
            <button
              onClick={() => onNavigateToPage?.("performance")}
              style={styles.categoryTitleButton}
              title="View Performance details"
            >
              <h3 style={styles.categoryTitle}>Performance</h3>
              <ChevronRight size={16} />
            </button>
            <div style={styles.statGroup}>
              <StatRow
                label="Return Rate"
                value={formatPercentage(returnRate)}
                color={
                  returnRate >= 90
                    ? "#4ade80"
                    : returnRate >= 80
                    ? "#fbbf24"
                    : "#ef4444"
                }
              />
              <StatRow
                label="Profit/Loss"
                value={formatPED(profitLoss)}
                color={profitLoss >= 0 ? "#4ade80" : "#ef4444"}
              />
              <StatRow
                label="Skills/PED"
                value={formatDecimal(skillsPerPED, 4)}
              />
              <StatRow
                label="Hit Rate"
                value={formatPercentage(hitRate)}
                color={
                  hitRate >= 80
                    ? "#4ade80"
                    : hitRate >= 60
                    ? "#fbbf24"
                    : "#ef4444"
                }
              />
              <StatRow
                label="Crit Rate"
                value={formatPercentage(
                  (stats?.hits ?? 0) > 0
                    ? ((stats?.criticals ?? 0) / (stats?.hits ?? 0)) * 100
                    : 0
                )}
              />
              <StatRow
                label="Total Events"
                value={(session?.events?.length ?? 0).toString()}
              />
            </div>
          </div>

          {/* Economy */}
          <div style={styles.categoryCard}>
            <button
              onClick={() => onNavigateToPage?.("economy")}
              style={styles.categoryTitleButton}
              title="View Economy details"
            >
              <h3 style={styles.categoryTitle}>Economy</h3>
              <ChevronRight size={16} />
            </button>
            <div style={styles.statGroup}>
              <StatRow
                label="Total Loot"
                value={formatPED(adjustedLoot)}
                color="#4ade80"
              />
              <StatRow
                label="Total Spend"
                value={formatPED(adjustedSpend)}
                color="#ef4444"
              />
              <StatRow
                label="Cost/Kill"
                value={formatPED(
                  displayStats.kills > 0
                    ? adjustedSpend / displayStats.kills
                    : 0
                )}
              />
              <StatRow
                label="Loot/Kill"
                value={formatPED(
                  displayStats.kills > 0 ? adjustedLoot / displayStats.kills : 0
                )}
              />
              <StatRow
                label="Net P/L"
                value={formatPED(profitLoss)}
                color={profitLoss >= 0 ? "#4ade80" : "#ef4444"}
              />
              <StatRow
                label="Loot/PED"
                value={formatDecimal(
                  adjustedSpend > 0 ? adjustedLoot / adjustedSpend : 0,
                  3
                )}
              />
            </div>
          </div>

          {/* Efficiency */}
          <div style={styles.categoryCard}>
            <button
              onClick={() => onNavigateToPage?.("efficiency")}
              style={styles.categoryTitleButton}
              title="View Efficiency details"
            >
              <h3 style={styles.categoryTitle}>Efficiency</h3>
              <ChevronRight size={16} />
            </button>
            <div style={styles.statGroup}>
              <StatRow label="DPP" value={formatDecimal(dpp, 2)} />
              <StatRow label="DPS" value={formatDecimal(dps, 1)} />
              <StatRow
                label="Kills/PED"
                value={formatDecimal(
                  adjustedSpend > 0 ? displayStats.kills / adjustedSpend : 0,
                  2
                )}
              />
              <StatRow
                label="Kills/Hour"
                value={formatDecimal(
                  displayStats.duration > 0
                    ? (displayStats.kills / displayStats.duration) * 3600
                    : 0,
                  1
                )}
              />
              <StatRow
                label="Avg Dmg/Hit"
                value={formatDecimal(
                  totalHits > 0 ? totalDamage / totalHits : 0,
                  1
                )}
              />
              <StatRow
                label="Shots/Kill"
                value={formatDecimal(
                  displayStats.kills > 0 ? totalShots / displayStats.kills : 0,
                  1
                )}
              />
            </div>
          </div>

          {/* Skills */}
          <div style={styles.categoryCard}>
            <button
              onClick={() => onNavigateToPage?.("skills")}
              style={styles.categoryTitleButton}
              title="View Skills details"
            >
              <h3 style={styles.categoryTitle}>Skills</h3>
              <ChevronRight size={16} />
            </button>
            <div style={styles.statGroup}>
              <StatRow
                label="Total Gains"
                value={formatDecimal(
                  displayStats.skills?.totalSkillGains ?? 0,
                  4
                )}
              />
              <StatRow
                label="Skill Events"
                value={(displayStats.skills?.totalSkillEvents ?? 0).toString()}
              />
              <StatRow
                label="Skills/PED"
                value={formatDecimal(skillsPerPED, 4)}
              />
              <StatRow
                label="Skills/Hour"
                value={formatDecimal(
                  displayStats.duration > 0
                    ? ((displayStats.skills?.totalSkillGains ?? 0) /
                        displayStats.duration) *
                        3600
                    : 0,
                  2
                )}
              />
              <StatRow
                label="Skills/Kill"
                value={formatDecimal(
                  displayStats.kills > 0
                    ? (displayStats.skills?.totalSkillGains ?? 0) /
                        displayStats.kills
                    : 0,
                  4
                )}
              />
              <StatRow
                label="Avg Skill Value"
                value={formatDecimal(
                  (displayStats.skills?.totalSkillEvents ?? 0) > 0
                    ? (displayStats.skills?.totalSkillGains ?? 0) /
                        (displayStats.skills?.totalSkillEvents ?? 1)
                    : 0,
                  4
                )}
              />
            </div>
          </div>

          {/* Combat */}
          <div style={styles.categoryCard}>
            <button
              onClick={() => onNavigateToPage?.("combat")}
              style={styles.categoryTitleButton}
              title="View Combat details"
            >
              <h3 style={styles.categoryTitle}>Combat</h3>
              <ChevronRight size={16} />
            </button>
            <div style={styles.statGroup}>
              <StatRow
                label="Kills"
                value={(displayStats.kills ?? 0).toString()}
              />
              <StatRow
                label="Total Damage"
                value={formatDecimal(totalDamage, 0)}
              />
              <StatRow label="Total Shots" value={totalShots.toString()} />
              <StatRow label="Total Hits" value={totalHits.toString()} />
              <StatRow label="Hit Rate" value={formatPercentage(hitRate)} />
              <StatRow
                label="Deaths"
                value={(displayStats.deaths ?? 0).toString()}
              />
            </div>
          </div>

          {/* Hourly Rates */}
          <div style={styles.categoryCard}>
            <button
              onClick={() => onNavigateToPage?.("hourly-rates")}
              style={styles.categoryTitleButton}
              title="View Hourly Rates details"
            >
              <h3 style={styles.categoryTitle}>Hourly Rates</h3>
              <ChevronRight size={16} />
            </button>
            <div style={styles.statGroup}>
              <StatRow
                label="Loot/Hour"
                value={formatPED(
                  combatTime > 0 ? (adjustedLoot / combatTime) * 3600 : 0
                )}
              />
              <StatRow
                label="Spend/Hour"
                value={formatPED(
                  combatTime > 0 ? (adjustedSpend / combatTime) * 3600 : 0
                )}
              />
              <StatRow
                label="Skills/Hour"
                value={formatDecimal(
                  displayStats.duration > 0
                    ? ((displayStats.skills?.totalSkillGains ?? 0) /
                        displayStats.duration) *
                        3600
                    : 0,
                  2
                )}
              />
              <StatRow
                label="Kills/Hour"
                value={formatDecimal(
                  displayStats.duration > 0
                    ? (displayStats.kills / displayStats.duration) * 3600
                    : 0,
                  1
                )}
              />
              <StatRow
                label="Dmg/Hour"
                value={formatDecimal(
                  combatTime > 0 ? (totalDamage / combatTime) * 3600 : 0,
                  0
                )}
              />
              <StatRow
                label="Combat Time"
                value={`${Math.floor(combatTime / 60)}m ${Math.floor(
                  combatTime % 60
                )}s`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: "hsl(220 13% 9%)",
    overflowY: "auto" as const,
  },
  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  heroRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  heroCard: {
    backgroundColor: "hsl(220 13% 11%)",
    border: "2px solid hsl(220 13% 20%)",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
  },
  heroLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "12px",
  },
  heroValue: {
    fontSize: "36px",
    fontWeight: 700,
    color: "hsl(0 0% 95%)",
    fontVariantNumeric: "tabular-nums" as const,
    lineHeight: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  empty: {
    flex: 1,
    backgroundColor: "hsl(220 13% 9%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContent: {
    textAlign: "center" as const,
  },
  emptyTitle: {
    color: "hsl(220 13% 45%)",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "12px",
    color: "hsl(220 13% 35%)",
  },
  categoryCard: {
    backgroundColor: "hsl(220 13% 11%)",
    border: "1px solid hsl(220 13% 18%)",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  cardLink: {
    background: "none",
    border: "none",
    color: "hsl(220 13% 45%)",
    cursor: "pointer",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    fontSize: "16px",
  },
  categoryTitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#3b82f6",
    margin: 0,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  statGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 8px",
    backgroundColor: "hsl(220 13% 9%)",
    borderRadius: "4px",
  },
  statLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statLabel: {
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    fontWeight: 500,
  },
  infoIcon: {
    color: "#3b82f6",
    opacity: 0.6,
    cursor: "help",
    transition: "opacity 0.2s ease",
  },
  tooltip: {
    position: "fixed" as const,
    transform: "translate(-50%, -100%)",
    backgroundColor: "hsl(220 13% 15%)",
    color: "hsl(0 0% 95%)",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    maxWidth: "250px",
    border: "1px solid hsl(220 13% 25%)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    pointerEvents: "none" as const,
    zIndex: 1000,
    whiteSpace: "normal" as const,
    lineHeight: 1.4,
  },
  statValue: {
    fontSize: "13px",
    color: "hsl(0 0% 95%)",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums" as const,
  },
  heroHeader: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "-8px",
  },
  heroTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    margin: 0,
  },
  configIcon: {
    background: "hsl(220 13% 15%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "14px",
    color: "hsl(220 13% 70%)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "hsl(220 13% 18%)",
      borderColor: "#3b82f6",
      color: "#3b82f6",
    },
  },
  configModal: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  configContent: {
    backgroundColor: "hsl(220 13% 11%)",
    border: "1px solid hsl(220 13% 20%)",
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto" as const,
  },
  configTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    marginBottom: "8px",
    margin: 0,
  },
  configSubtitle: {
    fontSize: "13px",
    color: "hsl(220 13% 55%)",
    marginBottom: "20px",
    margin: "8px 0 20px 0",
  },
  configGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginBottom: "20px",
  },
  configButton: {
    backgroundColor: "hsl(220 13% 15%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "12px",
    fontWeight: 500,
    color: "hsl(220 13% 70%)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left" as const,
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  configButtonSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "#3b82f6",
    color: "#3b82f6",
  },
  configBadge: {
    backgroundColor: "#3b82f6",
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 600,
  },
  configCloseButton: {
    width: "100%",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: 600,
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  categoryTitleButton: {
    background: "none",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    color: "#3b82f6",
    marginBottom: "12px",
  },
};

export default MainContent;
