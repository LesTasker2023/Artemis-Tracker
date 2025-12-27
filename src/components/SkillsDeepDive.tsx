/**
 * ARTEMIS v3 - Skills Deep Dive
 * Focus: How fast am I skilling? What's growing the most?
 */

import React, { useState } from "react";
import {
  BookOpen,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Target,
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

interface SkillsDeepDiveProps {
  stats: SessionStats | null;
}

export function SkillsDeepDive({ stats }: SkillsDeepDiveProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  if (!stats || Object.keys(stats.skills.bySkill).length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Skills Tracked Yet"
        subtitle="Skills will appear here as you gain them during hunting"
      />
    );
  }

  // Get all skills sorted by total gain
  const allSkills = Object.values(stats.skills.bySkill).sort(
    (a, b) => b.totalGain - a.totalGain
  );
  const topSkills = allSkills.slice(0, 8);
  const remainingSkills = allSkills.slice(8);
  const maxGain = topSkills[0]?.totalGain || 1;

  return (
    <div style={styles.container}>
      {/* Hero Stats */}
      <HeroGrid>
        <HeroCard
          icon={TrendingUp}
          label="TOTAL GAINED"
          value={`+${stats.skills.totalSkillGains.toFixed(4)}`}
          unit="skill points"
          color={colors.purple}
        />
        <HeroCard
          icon={Zap}
          label="SKILL EVENTS"
          value={stats.skills.totalSkillEvents}
          unit={`${stats.skills.skillRanks} rank ups`}
          color={colors.warning}
        />
        <HeroCard
          icon={Clock}
          label="PER HOUR"
          value={`+${stats.skillEfficiency.skillPerHour.toFixed(4)}`}
          unit="skill/hr"
          color={colors.success}
        />
        <HeroCard
          icon={Target}
          label="PER KILL"
          value={`+${stats.skillEfficiency.skillPerKill.toFixed(6)}`}
          unit="skill/kill"
          color={colors.info}
        />
      </HeroGrid>

      {/* Efficiency Quick View */}
      <div style={styles.efficiencyRow}>
        <EfficiencyItem
          label="Per PED Spent"
          value={`+${stats.skillEfficiency.skillPerPedSpent.toFixed(6)}`}
        />
        <EfficiencyItem
          label="Per Shot"
          value={`+${stats.skillEfficiency.skillPerShot.toFixed(8)}`}
        />
        <EfficiencyItem
          label="Avg Per Event"
          value={`+${stats.skillEfficiency.avgSkillPerEvent.toFixed(6)}`}
        />
        <EfficiencyItem
          label="Unique Skills"
          value={Object.keys(stats.skills.bySkill).length.toString()}
        />
      </div>

      {/* Top Skills Visual */}
      <div style={styles.topSkillsPanel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelTitle}>TOP SKILLS GAINED</span>
          <span style={styles.panelSubtitle}>
            {topSkills.length} of {allSkills.length} skills
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

      {/* Show All Toggle */}
      {remainingSkills.length > 0 && (
        <>
          <button
            style={styles.collapseToggle}
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
              <div style={styles.skillListHeader}>
                <span style={{ flex: 2 }}>SKILL</span>
                <span style={{ flex: 1, textAlign: "right" }}>EVENTS</span>
                <span style={{ flex: 1, textAlign: "right" }}>AVG/EVENT</span>
                <span style={{ flex: 1, textAlign: "right" }}>TOTAL</span>
              </div>
              <div style={styles.skillList}>
                {remainingSkills.map((skill, idx) => {
                  const avgGain =
                    skill.gainCount > 0 ? skill.totalGain / skill.gainCount : 0;
                  return (
                    <div key={skill.skillName} style={styles.skillListRow}>
                      <div
                        style={{
                          flex: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: spacing.sm,
                        }}
                      >
                        <span style={styles.listRank}>#{idx + 9}</span>
                        <span style={styles.listName}>{skill.skillName}</span>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          textAlign: "right",
                          color: colors.textMuted,
                        }}
                      >
                        {skill.gainCount}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          textAlign: "right",
                          color: colors.textSecondary,
                        }}
                      >
                        {avgGain.toFixed(6)}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          textAlign: "right",
                          color: colors.purple,
                          fontWeight: 600,
                        }}
                      >
                        +{skill.totalGain.toFixed(4)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* New Skills Banner */}
      {stats.skills.newSkillsUnlocked > 0 && (
        <div style={styles.newSkillsBanner}>
          <BookOpen size={16} style={{ color: colors.warning }} />
          <span>
            <b>{stats.skills.newSkillsUnlocked}</b> new skill
            {stats.skills.newSkillsUnlocked > 1 ? "s" : ""} unlocked this
            session!
          </span>
        </div>
      )}
    </div>
  );
}

// ==================== Local Components ====================

function EfficiencyItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.efficiencyItem}>
      <span style={styles.efficiencyLabel}>{label}</span>
      <span style={styles.efficiencyValue}>{value}</span>
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

  // Efficiency Row
  efficiencyRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: spacing.md,
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
  },
  efficiencyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  efficiencyLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  efficiencyValue: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    fontFamily: typography.mono,
  },

  // Top Skills Panel
  topSkillsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  panelTitle: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
  },
  panelSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
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
    fontWeight: 700,
    color: colors.warning,
    width: 24,
    paddingTop: 2,
  },
  skillInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  },
  skillNameRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skillName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: 500,
  },
  skillGain: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.purple,
    fontFamily: typography.mono,
  },
  skillBar: {
    height: 6,
    backgroundColor: colors.bgHover,
    borderRadius: 3,
    overflow: "hidden",
  },
  skillBarFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  skillMeta: {
    display: "flex",
    gap: spacing.sm,
    fontSize: 10,
    color: colors.textMuted,
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

  // All Skills Panel
  allSkillsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  skillListHeader: {
    display: "flex",
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgHover,
    borderRadius: `${radius.md}px ${radius.md}px 0 0`,
    fontSize: 10,
    fontWeight: 700,
    color: colors.textMuted,
    letterSpacing: "0.05em",
  },
  skillList: {
    maxHeight: 250,
    overflow: "auto",
  },
  skillListRow: {
    display: "flex",
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.bgHover}`,
    fontSize: 12,
    fontFamily: typography.mono,
  },
  listRank: {
    fontSize: 11,
    color: colors.textMuted,
    width: 28,
  },
  listName: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
  },

  // New Skills Banner
  newSkillsBanner: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    border: `1px solid rgba(245, 158, 11, 0.3)`,
    borderRadius: radius.md,
    color: colors.warning,
    fontSize: 13,
  },
};
