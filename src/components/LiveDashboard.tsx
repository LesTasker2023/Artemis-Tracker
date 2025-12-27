/**
 * ARTEMIS v3 - Live Dashboard
 * Clean, focused real-time hunting analytics
 */

import React, { useState } from "react";
import {
  Activity,
  Target,
  DollarSign,
  Skull,
  Clock,
  ChevronDown,
  ChevronUp,
  Swords,
  Shield,
  BookOpen,
  Award,
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

interface LiveDashboardProps {
  stats: SessionStats | null;
  isActive: boolean;
}

export function LiveDashboard({ stats, isActive }: LiveDashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!stats) {
    return (
      <EmptyState
        icon={Activity}
        title="No Active Session"
        subtitle="Start tracking to see live analytics"
      />
    );
  }

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

  const hitRate = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;

  // Color helpers
  const profitColor = stats.profit >= 0 ? colors.success : colors.danger;
  const returnColor =
    stats.returnRate >= 95
      ? colors.success
      : stats.returnRate >= 85
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
        <div style={styles.statusItem}>
          <div
            style={{
              ...styles.statusDot,
              backgroundColor: isActive ? colors.success : colors.danger,
            }}
          />
          <span>{isActive ? "TRACKING" : "PAUSED"}</span>
        </div>
        <div style={styles.statusItem}>
          <Clock size={14} />
          <span>{formatDuration(stats.duration)}</span>
        </div>
      </div>

      {/* Hero Stats */}
      <HeroGrid>
        <HeroCard
          icon={DollarSign}
          label="PROFIT"
          value={`${stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(
            2
          )} PED`}
          color={profitColor}
          glow
        />
        <HeroCard
          icon={Target}
          label="RETURN"
          value={`${stats.returnRate.toFixed(1)}%`}
          color={returnColor}
        />
        <HeroCard
          icon={Skull}
          label="KILLS"
          value={stats.kills}
          color={colors.warning}
        />
        <HeroCard
          icon={Crosshair}
          label="ACCURACY"
          value={`${hitRate.toFixed(1)}%`}
          color={hitRateColor}
        />
      </HeroGrid>

      {/* Quick Summary */}
      <div style={styles.quickSummary}>
        <QuickStat label="Shots" value={stats.shots} />
        <QuickStat label="Hits" value={stats.hits} />
        <QuickStat label="Loot" value={`${stats.lootValue.toFixed(2)} PED`} />
        <QuickStat label="Spent" value={`${stats.totalSpend.toFixed(2)} PED`} />
        <QuickStat
          label="Skills"
          value={`+${stats.skills.totalSkillGains.toFixed(4)}`}
        />
      </div>

      {/* Profit Visualization */}
      <div style={styles.profitViz}>
        <div style={styles.profitBarContainer}>
          <div style={styles.profitBarLabels}>
            <span style={{ color: colors.danger }}>
              Spent: {stats.totalSpend.toFixed(2)}
            </span>
            <span style={{ color: colors.success }}>
              Loot: {stats.lootValue.toFixed(2)}
            </span>
          </div>
          <div style={styles.profitBarTrack}>
            <div
              style={{
                ...styles.profitBarFill,
                width: `${Math.min(stats.returnRate, 150)}%`,
                maxWidth: "100%",
                backgroundColor: returnColor,
              }}
            />
            <div style={styles.profitMarker} />
          </div>
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

      {/* Collapsible Sections */}
      <div style={styles.sections}>
        <CollapsibleSection
          title="Combat Details"
          icon={<Swords size={16} />}
          color={colors.warning}
          isOpen={expandedSections.has("combat")}
          onToggle={() => toggleSection("combat")}
        >
          <div style={styles.detailGrid}>
            <DetailStat
              label="Hits"
              value={stats.hits}
              color={colors.success}
            />
            <DetailStat
              label="Misses"
              value={stats.misses}
              color={colors.danger}
            />
            <DetailStat
              label="Criticals"
              value={stats.criticals}
              color={colors.warning}
            />
            <DetailStat
              label="Crit Rate"
              value={`${
                stats.hits > 0
                  ? ((stats.criticals / stats.hits) * 100).toFixed(1)
                  : 0
              }%`}
            />
            <DetailStat
              label="Damage Dealt"
              value={stats.damageDealt.toFixed(0)}
              color={colors.warning}
            />
            <DetailStat
              label="Avg/Hit"
              value={stats.combat.averageDamagePerHit.toFixed(1)}
            />
            <DetailStat
              label="Combat DPS"
              value={stats.combat.dps.toFixed(1)}
              color="#ec4899"
            />
            <DetailStat
              label="Out of Range"
              value={stats.combat.outOfRange}
              color={colors.textMuted}
            />
          </div>
          <div style={styles.subDetail}>
            <span style={styles.subDetailTitle}>Miss Breakdown</span>
            <div style={styles.subDetailRow}>
              <span>
                Dodged:{" "}
                <b style={{ color: colors.danger }}>
                  {stats.combat.targetDodged}
                </b>
              </span>
              <span>
                Evaded:{" "}
                <b style={{ color: colors.danger }}>
                  {stats.combat.targetEvaded}
                </b>
              </span>
              <span>
                Resisted:{" "}
                <b style={{ color: colors.warning }}>
                  {stats.combat.targetResisted}
                </b>
              </span>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Defense & Healing"
          icon={<Shield size={16} />}
          color={colors.info}
          isOpen={expandedSections.has("defense")}
          onToggle={() => toggleSection("defense")}
        >
          <div style={styles.detailGrid}>
            <DetailStat
              label="Damage Taken"
              value={stats.damageTaken.toFixed(0)}
              color={colors.danger}
            />
            <DetailStat
              label="Crit Dmg Taken"
              value={stats.combat.criticalDamageTaken.toFixed(0)}
              color="#dc2626"
            />
            <DetailStat
              label="Dmg Reduced"
              value={stats.combat.damageReduced.toFixed(0)}
              color={colors.success}
            />
            <DetailStat
              label="Your Dodges"
              value={stats.combat.playerDodges}
              color={colors.success}
            />
            <DetailStat
              label="Your Evades"
              value={stats.combat.playerEvades}
              color={colors.success}
            />
            <DetailStat
              label="Enemy Miss"
              value={stats.combat.enemyMisses}
              color={colors.success}
            />
            <DetailStat
              label="Deaths"
              value={stats.deaths}
              color={colors.danger}
            />
            <DetailStat
              label="Self Healed"
              value={stats.combat.selfHealing.toFixed(0)}
              color={colors.success}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Skills Gained"
          icon={<BookOpen size={16} />}
          color={colors.purple}
          isOpen={expandedSections.has("skills")}
          onToggle={() => toggleSection("skills")}
        >
          <div style={styles.skillsSummary}>
            <div style={styles.skillsTotal}>
              <span style={styles.skillsTotalValue}>
                {stats.skills.totalSkillGains.toFixed(4)}
              </span>
              <span style={styles.skillsTotalLabel}>Total Skill Points</span>
            </div>
            <div style={styles.skillsMeta}>
              <span>{stats.skills.totalSkillEvents} events</span>
              <span>•</span>
              <span>{stats.skills.skillRanks} ranks</span>
              <span>•</span>
              <span>{stats.skills.newSkillsUnlocked} new</span>
            </div>
          </div>
          {Object.keys(stats.skills.bySkill).length > 0 && (
            <div style={styles.topSkills}>
              {Object.values(stats.skills.bySkill)
                .sort((a, b) => b.totalGain - a.totalGain)
                .slice(0, 6)
                .map((skill) => (
                  <div key={skill.skillName} style={styles.topSkillItem}>
                    <span style={styles.topSkillName}>{skill.skillName}</span>
                    <span style={styles.topSkillValue}>
                      +{skill.totalGain.toFixed(4)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Loot Breakdown"
          icon={<DollarSign size={16} />}
          color={colors.success}
          isOpen={expandedSections.has("loot")}
          onToggle={() => toggleSection("loot")}
        >
          <div style={styles.detailGrid}>
            <DetailStat label="Total Items" value={stats.loot.totalItems} />
            <DetailStat label="Unique Items" value={stats.loot.uniqueItems} />
            <DetailStat
              label="Shrapnel"
              value={`${stats.loot.shrapnelValue.toFixed(2)} PED`}
              color={colors.textMuted}
            />
            <DetailStat
              label="Ammo Return"
              value={`${stats.loot.ammoValue.toFixed(2)} PED`}
              color={colors.info}
            />
          </div>
        </CollapsibleSection>

        {stats.loadoutBreakdown.length > 0 && (
          <CollapsibleSection
            title="Loadout Performance"
            icon={<Crosshair size={16} />}
            color={colors.info}
            isOpen={expandedSections.has("loadouts")}
            onToggle={() => toggleSection("loadouts")}
          >
            <div style={styles.loadoutGrid}>
              {stats.loadoutBreakdown.map((lb, idx) => {
                const lbReturn =
                  lb.spend > 0 ? (lb.lootValue / lb.spend) * 100 : 0;
                const lbReturnColor =
                  lbReturn >= 100
                    ? colors.success
                    : lbReturn >= 85
                    ? colors.warning
                    : colors.danger;
                return (
                  <div key={lb.loadoutId ?? idx} style={styles.loadoutItem}>
                    <div style={styles.loadoutHeader}>
                      <span style={styles.loadoutName}>{lb.loadoutName}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            lb.profit >= 0 ? colors.success : colors.danger,
                        }}
                      >
                        {lb.profit >= 0 ? "+" : ""}
                        {lb.profit.toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.loadoutMeta}>
                      <span>{lb.shots} shots</span>
                      <span style={{ color: lbReturnColor }}>
                        {lbReturn.toFixed(1)}% return
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

// ==================== Local Components ====================

function QuickStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={styles.quickStat}>
      <span style={styles.quickStatLabel}>{label}</span>
      <span style={styles.quickStatValue}>{value}</span>
    </div>
  );
}

function DetailStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={styles.detailStat}>
      <div style={styles.detailStatLabel}>{label}</div>
      <div
        style={{
          ...styles.detailStatValue,
          color: color ?? colors.textPrimary,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  color,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.collapsible}>
      <button onClick={onToggle} style={styles.collapsibleHeader}>
        <div style={styles.collapsibleTitle}>
          <span style={{ color }}>{icon}</span>
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && <div style={styles.collapsibleContent}>{children}</div>}
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
    alignItems: "center",
    gap: spacing.xl,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    fontFamily: typography.mono,
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },

  // Quick Summary
  quickSummary: {
    display: "flex",
    justifyContent: "space-around",
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
  },
  quickStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
    fontFamily: typography.mono,
  },

  // Profit Visualization
  profitViz: {
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
  },
  profitBarContainer: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  profitBarLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 500,
  },
  profitBarTrack: {
    height: 12,
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    overflow: "hidden",
    position: "relative",
  },
  profitBarFill: {
    height: "100%",
    borderRadius: radius.sm,
    transition: "width 0.3s ease",
  },
  profitMarker: {
    position: "absolute",
    left: "100%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.textPrimary,
    transform: "translateX(-100%)",
  },

  // Globals
  globalsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    padding: spacing.lg,
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
    fontSize: 24,
    fontWeight: 700,
    color: colors.textPrimary,
    fontFamily: typography.mono,
  },
  globalLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Sections
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  collapsible: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
    overflow: "hidden",
  },
  collapsibleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: "transparent",
    border: "none",
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  collapsibleTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  collapsibleContent: {
    padding: `0 ${spacing.lg}px ${spacing.lg}px ${spacing.lg}px`,
  },

  // Detail Grid
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: spacing.md,
  },
  detailStat: {
    textAlign: "center",
  },
  detailStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: typography.mono,
  },
  subDetail: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.border}`,
  },
  subDetailTitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: 600,
    marginBottom: spacing.sm,
    display: "block",
  },
  subDetailRow: {
    display: "flex",
    justifyContent: "space-around",
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Skills
  skillsSummary: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  skillsTotal: {
    display: "flex",
    flexDirection: "column",
  },
  skillsTotalValue: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.purple,
    fontFamily: typography.mono,
  },
  skillsTotalLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  skillsMeta: {
    display: "flex",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
  topSkills: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: spacing.sm,
  },
  topSkillItem: {
    display: "flex",
    flexDirection: "column",
    padding: spacing.sm,
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    textAlign: "center",
  },
  topSkillName: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  topSkillValue: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.purple,
    fontFamily: typography.mono,
  },

  // Loadouts
  loadoutGrid: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  loadoutItem: {
    padding: spacing.md,
    backgroundColor: colors.bgHover,
    borderRadius: radius.md,
  },
  loadoutHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  loadoutName: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  loadoutMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: colors.textMuted,
  },
};
