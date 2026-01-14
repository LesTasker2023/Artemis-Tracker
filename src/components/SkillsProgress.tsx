/**
 * ARTEMIS v3 - Skills Progress
 * Streamlined view for character development tracking
 *
 * Top 10 Character Development Stats:
 * 1. Total Skill Points Gained
 * 2. Skill Points Per Hour
 * 3. Skill Points Per PED Spent
 * 4. Skills Per Kill
 * 5. Top 3 Skills Gained
 * 6. Rank Ups
 * 7. New Skills Unlocked
 * 8. Hit Rate % (improving)
 * 9. Kills (volume)
 * 10. Critical Rate %
 */

import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  Skull,
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

interface SkillsProgressProps {
  stats: SessionStats | null;
}

export function SkillsProgress({ stats }: SkillsProgressProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  if (!stats || Object.keys(stats.skills.bySkill).length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No Skills Tracked Yet"
        subtitle="Skills will appear here as you gain them during hunting"
      />
    );
  }

  // Get all skills sorted by total gain
  const allSkills = Object.values(stats.skills.bySkill).sort(
    (a, b) => b.totalGain - a.totalGain
  );
  const topSkills = allSkills.slice(0, 5);
  const remainingSkills = allSkills.slice(5);
  const maxGain = topSkills[0]?.totalGain || 1;

  // Combat stats
  const hitRate = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
  const critRate = stats.hits > 0 ? (stats.criticals / stats.hits) * 100 : 0;

  return (
    <div style={styles.container}>
      {/* Hero Stats - The 4 Most Important for Progress */}
      <HeroGrid>
        <HeroCard
          icon={TrendingUp}
          label="SKILLS GAINED"
          value={`+${stats.skills.totalSkillGains.toFixed(4)}`}
          unit="total points"
          color={colors.purple}
          highlight
          glow
        />
        <HeroCard
          icon={Clock}
          label="PER HOUR"
          value={`+${stats.skillEfficiency.skillPerHour.toFixed(4)}`}
          unit="skill/hr"
          color={colors.success}
        />
        <HeroCard
          icon={DollarSign}
          label="PER PED"
          value={`+${stats.skillEfficiency.skillPerPedSpent.toFixed(6)}`}
          unit="skill/PED"
          color={colors.info}
        />
        <HeroCard
          icon={Skull}
          label="PER KILL"
          value={`+${stats.skillEfficiency.skillPerKill.toFixed(6)}`}
          unit="skill/kill"
          color={colors.warning}
        />
      </HeroGrid>

      {/* Progress Summary */}
      <div style={styles.summaryPanel}>
        <div style={styles.summaryGrid}>
          <SummaryStat
            icon={<Zap size={16} color={colors.warning} />}
            label="Skill Events"
            value={stats.skills.totalSkillEvents}
          />
          <SummaryStat
            icon={<Award size={16} color={colors.purple} />}
            label="Rank Ups"
            value={stats.skills.skillRanks}
          />
          <SummaryStat
            icon={<TrendingUp size={16} color={colors.success} />}
            label="New Skills"
            value={stats.skills.newSkillsUnlocked}
          />
          <SummaryStat
            icon={<Target size={16} color={colors.info} />}
            label="Unique Skills"
            value={Object.keys(stats.skills.bySkill).length}
          />
        </div>
      </div>

      {/* Combat Progress Indicators */}
      <div style={styles.combatPanel}>
        <div style={styles.panelHeader}>
          <Crosshair size={14} />
          <span style={styles.panelTitle}>COMBAT IMPROVEMENT</span>
        </div>
        <div style={styles.combatGrid}>
          <CombatProgressBar
            label="Hit Rate"
            value={hitRate}
            maxValue={100}
            color={
              hitRate >= 70
                ? colors.success
                : hitRate >= 50
                ? colors.warning
                : colors.danger
            }
            unit={`${stats.hits}/${stats.shots}`}
          />
          <CombatProgressBar
            label="Crit Rate"
            value={critRate}
            maxValue={30} // Most players cap around 20-30%
            color={colors.warning}
            unit={`${stats.criticals} crits`}
          />
        </div>
        <div style={styles.combatStats}>
          <span style={styles.combatStat}>
            <Skull size={14} /> {stats.kills} Kills
          </span>
          <span style={styles.combatStat}>
            <Zap size={14} /> {stats.combat.dps.toFixed(1)} DPS
          </span>
        </div>
      </div>

      {/* Top Skills Visual */}
      <div style={styles.skillsPanel}>
        <div style={styles.panelHeader}>
          <TrendingUp size={14} />
          <span style={styles.panelTitle}>TOP SKILLS GAINED</span>
          <span style={styles.panelSubtitle}>
            {allSkills.length} skills total
          </span>
        </div>
        <div style={styles.skillBars}>
          {topSkills.map((skill, idx) => {
            const pct = (skill.totalGain / maxGain) * 100;
            const avgGain =
              skill.gainCount > 0 ? skill.totalGain / skill.gainCount : 0;
            const barColor =
              idx === 0 ? colors.purple : idx < 3 ? "#a78bfa" : "#c4b5fd";
            return (
              <div key={skill.skillName} style={styles.skillBarRow}>
                <div style={styles.skillRank}>#{idx + 1}</div>
                <div style={styles.skillInfo}>
                  <div style={styles.skillNameRow}>
                    <span style={styles.skillName}>{skill.skillName}</span>
                    <span style={styles.skillGain}>
                      +{skill.totalGain.toFixed(4)}
                    </span>
                  </div>
                  <div style={styles.skillBar}>
                    <div
                      style={{
                        ...styles.skillBarFill,
                        width: `${pct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <div style={styles.skillMeta}>
                    <span>{skill.gainCount} events</span>
                    <span>•</span>
                    <span>{avgGain.toFixed(6)}/event</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Show More Toggle */}
      {remainingSkills.length > 0 && (
        <>
          <button
            style={styles.toggleButton}
            onClick={() => setShowAllSkills(!showAllSkills)}
          >
            {showAllSkills ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
            <span>
              {showAllSkills ? "Hide" : "Show"} {remainingSkills.length} More
              Skills
            </span>
          </button>

          {showAllSkills && (
            <div style={styles.allSkillsPanel}>
              {remainingSkills.map((skill, idx) => (
                <div key={skill.skillName} style={styles.skillListRow}>
                  <span style={styles.listRank}>#{idx + 6}</span>
                  <span style={styles.listName}>{skill.skillName}</span>
                  <span style={styles.listEvents}>{skill.gainCount}</span>
                  <span style={styles.listGain}>
                    +{skill.totalGain.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==================== Local Components ====================

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div style={styles.summaryStat}>
      {icon}
      <div style={styles.summaryStatContent}>
        <span style={styles.summaryValue}>{value}</span>
        <span style={styles.summaryLabel}>{label}</span>
      </div>
    </div>
  );
}

function CombatProgressBar({
  label,
  value,
  maxValue,
  color,
  unit,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  unit: string;
}) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div style={styles.combatProgressItem}>
      <div style={styles.combatProgressHeader}>
        <span style={styles.combatProgressLabel}>{label}</span>
        <span style={{ ...styles.combatProgressValue, color }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div style={styles.combatProgressBar}>
        <div
          style={{
            ...styles.combatProgressFill,
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span style={styles.combatProgressUnit}>{unit}</span>
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

  // Summary Panel
  summaryPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: spacing.md,
  },
  summaryStat: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryStatContent: {
    display: "flex",
    flexDirection: "column",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textPrimary,
    fontFamily: typography.mono,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
  },

  // Combat Panel
  combatPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  panelSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: "auto",
  },
  combatGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  combatProgressItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  combatProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  combatProgressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  combatProgressValue: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: typography.mono,
  },
  combatProgressBar: {
    height: 8,
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  combatProgressFill: {
    height: "100%",
    borderRadius: radius.sm,
    transition: "width 0.3s ease",
  },
  combatProgressUnit: {
    fontSize: 10,
    color: colors.textMuted,
  },
  combatStats: {
    display: "flex",
    justifyContent: "center",
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.borderSubtle}`,
  },
  combatStat: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Skills Panel
  skillsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  skillBars: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  },
  skillBarRow: {
    display: "flex",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  skillRank: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textMuted,
    width: 24,
    textAlign: "center",
    paddingTop: 2,
  },
  skillInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  skillNameRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skillName: {
    fontSize: 13,
    fontWeight: 500,
    color: colors.textPrimary,
  },
  skillGain: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.purple,
    fontFamily: typography.mono,
  },
  skillBar: {
    height: 6,
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  skillBarFill: {
    height: "100%",
    borderRadius: radius.sm,
    transition: "width 0.3s ease",
  },
  skillMeta: {
    display: "flex",
    gap: spacing.sm,
    fontSize: 10,
    color: colors.textMuted,
  },

  // Toggle Button
  toggleButton: {
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

  // All Skills Panel
  allSkillsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.md,
    border: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  },
  skillListRow: {
    display: "grid",
    gridTemplateColumns: "30px 1fr 60px 80px",
    alignItems: "center",
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: radius.sm,
    backgroundColor: colors.bgHover,
  },
  listRank: {
    fontSize: 11,
    color: colors.textMuted,
  },
  listName: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  listEvents: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
  },
  listGain: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.purple,
    fontFamily: typography.mono,
    textAlign: "right",
  },
};
