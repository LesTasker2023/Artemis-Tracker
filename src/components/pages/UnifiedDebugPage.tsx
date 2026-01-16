/**
 * Unified Debug Page
 * Single page for raw chat log analysis with full 48-stat display
 * Combines chat log parsing with comprehensive running stats visualization
 */

import React, { useState, useCallback } from "react";
import { Bug, FileText, Download, RefreshCw } from "lucide-react";
import { getStoredPlayerName } from "../../hooks/usePlayerName";

/**
 * Format large numbers with K/M/B suffixes
 * 1000 -> "1.0K", 1500000 -> "1.5M", etc.
 */
function formatCompactNumber(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (!isFinite(n)) return "0";
  if (n === 0) return "0";

  const absN = Math.abs(n);

  if (absN >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1) + "B";
  }
  if (absN >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + "M";
  }
  if (absN >= 1_000) {
    return (n / 1_000).toFixed(1) + "K";
  }

  // For decimals less than 1000, show 2 decimal places if not a whole number
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

// All 48 running stats interface (mirrors session.ts)
interface FullStats {
  // Combat - Offensive
  shots: number;
  hits: number;
  misses: number;
  criticals: number;
  damageDealt: number;
  criticalDamage: number;
  maxDamageHit: number;
  targetDodged: number;
  targetEvaded: number;
  targetResisted: number;
  outOfRange: number;

  // Combat - Defensive
  damageTaken: number;
  criticalDamageTaken: number;
  damageReduced: number;
  playerDodges: number;
  playerEvades: number;
  deflects: number;
  enemyMisses: number;

  // Healing
  selfHealing: number;
  healCount: number;
  healedByOthers: number;
  healingGiven: number;

  // Loot & Kills
  lootValue: number;
  lootCount: number;
  kills: number;
  deaths: number;

  // Skills
  skillGains: number;
  skillEvents: number;
  skillRanks: number;
  newSkillsUnlocked: number;

  // Globals & HOFs
  globalCount: number;
  hofs: number;

  // Equipment
  tierUps: number;
  enhancerBreaks: number;
  enhancerShrapnel: number;

  // Mining
  miningClaims: number;
  miningClaimValue: number;
  miningNoFinds: number;
  resourceDepleted: number;

  // Effects
  buffsReceived: number;
  debuffsReceived: number;

  // Death/Revival
  revives: number;
  divineInterventions: number;

  // Meta
  totalLines: number;
  linesInRange: number;
  accuracy: number;
}

// Progress for chat log parsing
interface ParseProgress {
  linesProcessed: number;
  totalLines: number;
}

// Duration options
const DURATION_OPTIONS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
  { label: "12mo", hours: 8760 },
] as const;

function createEmptyStats(): FullStats {
  return {
    shots: 0,
    hits: 0,
    misses: 0,
    criticals: 0,
    damageDealt: 0,
    criticalDamage: 0,
    maxDamageHit: 0,
    targetDodged: 0,
    targetEvaded: 0,
    targetResisted: 0,
    outOfRange: 0,
    damageTaken: 0,
    criticalDamageTaken: 0,
    damageReduced: 0,
    playerDodges: 0,
    playerEvades: 0,
    deflects: 0,
    enemyMisses: 0,
    selfHealing: 0,
    healCount: 0,
    healedByOthers: 0,
    healingGiven: 0,
    lootValue: 0,
    lootCount: 0,
    kills: 0,
    deaths: 0,
    skillGains: 0,
    skillEvents: 0,
    skillRanks: 0,
    newSkillsUnlocked: 0,
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
    totalLines: 0,
    linesInRange: 0,
    accuracy: 0,
  };
}

export function UnifiedDebugPage() {
  const [stats, setStats] = useState<FullStats>(createEmptyStats());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState<string | null>(null);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("24h");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Parse raw chat.log file - ALL 48 STATS
  const loadChatLogData = useCallback(async (hours: number, label: string) => {
    setIsLoading(true);
    setLoadingPeriod(label);
    setProgress(null);
    setSelectedPeriod(label);

    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const playerName = getStoredPlayerName();
    console.log(
      `[UnifiedDebug] Parsing chat.log for ${label}, player: "${playerName}"`
    );

    try {
      const result = await window.electron?.log?.readRaw();
      if (!result?.success || !result.lines) {
        console.error("[UnifiedDebug] Failed to read chat.log:", result?.error);
        setStats(createEmptyStats());
        return;
      }

      const lines: string[] = result.lines;
      const totalLines = lines.length;
      console.log(`[UnifiedDebug] Processing ${totalLines} lines`);

      // Initialize all 48 stats
      const s = createEmptyStats();
      s.totalLines = totalLines;

      // Show initial state immediately so UI renders
      setStats(s);
      setProgress({ linesProcessed: 0, totalLines });

      const BATCH_SIZE = 5000;

      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);

        for (const line of batch) {
          // Extract timestamp
          const timestampMatch = line.match(
            /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
          );
          if (!timestampMatch) continue;

          const lineTime = new Date(timestampMatch[1]).getTime();
          if (lineTime < cutoffTime) continue;

          s.linesInRange++;

          // ==================== COMBAT - OFFENSIVE ====================
          // Damage dealt (hits)
          const hitMatch = line.match(
            /You inflicted ([\d.]+) points of damage/
          );
          if (hitMatch) {
            s.hits++;
            s.shots++;
            const dmg = parseFloat(hitMatch[1]);
            s.damageDealt += dmg;
            if (dmg > s.maxDamageHit) s.maxDamageHit = dmg;
            if (line.includes("Critical hit")) {
              s.criticals++;
              s.criticalDamage += dmg;
            }
          }

          // Kills (with critical)
          if (
            line.includes("You killed") ||
            line.includes("has been killed by you")
          ) {
            s.kills++;
          }

          // Misses
          if (line.includes("You missed")) {
            s.misses++;
            s.shots++;
          }

          // Target dodged
          if (line.includes("target Dodged")) {
            s.targetDodged++;
            s.shots++;
          }

          // Target evaded
          if (line.includes("target Evaded")) {
            s.targetEvaded++;
            s.shots++;
          }

          // Target resisted
          if (line.includes("target resisted all damage")) {
            s.targetResisted++;
            s.shots++;
          }

          // Out of range
          if (line.includes("out of range") || line.includes("Out of range")) {
            s.outOfRange++;
            s.shots++;
          }

          // ==================== COMBAT - DEFENSIVE ====================
          // Damage taken (normal and critical)
          const dmgTakenMatch = line.match(
            /You took ([\d.]+) points of damage/
          );
          if (dmgTakenMatch) {
            const dmg = parseFloat(dmgTakenMatch[1]);
            s.damageTaken += dmg;
            if (line.includes("Critical hit")) {
              s.criticalDamageTaken += dmg;
            }
          }

          // Damage reduced/absorbed
          const reducedMatch = line.match(
            /(\d+\.?\d*) points? (?:of damage )?(?:absorbed|reduced)/i
          );
          if (reducedMatch) {
            s.damageReduced += parseFloat(reducedMatch[1]);
          }

          // Deflects
          if (
            line.includes("Damage deflected") ||
            line.includes("deflected the attack")
          ) {
            s.deflects++;
          }

          // Player dodges
          if (
            line.includes("You Dodged the attack") ||
            line.includes("You dodged")
          ) {
            s.playerDodges++;
          }

          // Player evades
          if (
            line.includes("You Evaded the attack") ||
            line.includes("You evaded")
          ) {
            s.playerEvades++;
          }

          // Enemy misses
          if (
            line.includes("The attack missed you") ||
            line.includes("missed you")
          ) {
            s.enemyMisses++;
          }

          // ==================== HEALING ====================
          // Self healing
          const selfHealMatch = line.match(
            /You healed yourself ([\d.]+) points/
          );
          if (selfHealMatch) {
            s.selfHealing += parseFloat(selfHealMatch[1]);
            s.healCount++;
          }

          // Healed by others
          const healedByMatch = line.match(/(.+) healed you ([\d.]+) points/);
          if (healedByMatch && !healedByMatch[1].includes("yourself")) {
            s.healedByOthers += parseFloat(healedByMatch[2]);
          }

          // Healing given to others
          const healGivenMatch = line.match(/You healed (.+) ([\d.]+) points/);
          if (healGivenMatch && !healGivenMatch[1].includes("yourself")) {
            s.healingGiven += parseFloat(healGivenMatch[2]);
          }

          // ==================== LOOT ====================
          const lootValueMatch = line.match(/Value: ([\d.]+) PED/);
          if (lootValueMatch && line.includes("You received")) {
            s.lootCount++;
            s.lootValue += parseFloat(lootValueMatch[1]);
          }

          // ==================== SKILLS ====================
          // Skill gains (experience)
          const skillMatch = line.match(
            /You have gained ([\d.]+) experience in (.+)/
          );
          if (skillMatch) {
            s.skillGains += parseFloat(skillMatch[1]);
            s.skillEvents++;
          }

          // Skill rank/level
          if (
            line.includes("has reached level") ||
            line.includes("skill has increased")
          ) {
            s.skillRanks++;
          }

          // New skill unlocked
          if (
            line.includes("You have unlocked") ||
            line.includes("new skill")
          ) {
            s.newSkillsUnlocked++;
          }

          // ==================== GLOBALS & HOFS ====================
          if (line.includes("[Globals]") && playerName) {
            const globalPlayerMatch = line.match(
              /\[Globals\] \[\] (.+?) (?:killed|found|constructed)/
            );
            if (globalPlayerMatch) {
              const globalPlayer = globalPlayerMatch[1].trim();
              if (globalPlayer === playerName) {
                s.globalCount++;
                if (line.includes("Hall of Fame")) {
                  s.hofs++;
                }
              }
            }
          }

          // ==================== EQUIPMENT ====================
          // Tier ups
          if (
            line.includes("has reached tier") ||
            line.includes("tier increased")
          ) {
            s.tierUps++;
          }

          // Enhancer breaks with shrapnel
          const enhancerMatch = line.match(
            /Your enhancer .+ broke.*You received ([\d.]+) PED Shrapnel/
          );
          if (enhancerMatch) {
            s.enhancerBreaks++;
            s.enhancerShrapnel += parseFloat(enhancerMatch[1]);
          } else if (line.includes("enhancer") && line.includes("broke")) {
            s.enhancerBreaks++;
          }

          // ==================== MINING ====================
          // Mining claims
          if (
            line.includes("You found a deposit") ||
            line.includes("claim found")
          ) {
            s.miningClaims++;
            const claimValueMatch = line.match(/Value: ([\d.]+) PED/);
            if (claimValueMatch) {
              s.miningClaimValue += parseFloat(claimValueMatch[1]);
            }
          }

          // No find
          if (
            line.includes("No resources found") ||
            line.includes("nothing found")
          ) {
            s.miningNoFinds++;
          }

          // Resource depleted
          if (
            line.includes("Resource depleted") ||
            line.includes("claim is empty")
          ) {
            s.resourceDepleted++;
          }

          // ==================== EFFECTS ====================
          // Buffs
          if (
            line.includes("buff") &&
            (line.includes("received") ||
              line.includes("applied") ||
              line.includes("activated"))
          ) {
            s.buffsReceived++;
          }

          // Debuffs
          if (
            line.includes("debuff") ||
            (line.includes("effect") &&
              (line.includes("negative") || line.includes("harmful")))
          ) {
            s.debuffsReceived++;
          }

          // ==================== DEATH/REVIVAL ====================
          // Deaths
          if (
            line.includes("You were killed by") ||
            line.includes("You have been killed")
          ) {
            s.deaths++;
          }

          // Revives
          if (
            line.includes("has revived you") ||
            line.includes("You have been revived")
          ) {
            s.revives++;
          }

          // Divine intervention
          if (
            line.includes("Divine Intervention") ||
            line.includes("divine intervention")
          ) {
            s.divineInterventions++;
          }
        }

        // Update progress
        const linesProcessed = Math.min(i + BATCH_SIZE, totalLines);
        setProgress({ linesProcessed, totalLines });

        // Calculate accuracy
        s.accuracy = s.shots > 0 ? (s.hits / s.shots) * 100 : 0;

        // Update stats live
        setStats({ ...s });

        // Yield to UI
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setLastUpdated(new Date());
      console.log(
        `[UnifiedDebug] Complete: ${s.linesInRange} lines, ${s.kills} kills, ${s.globalCount} globals`
      );
    } catch (err) {
      console.error("[UnifiedDebug] Parse error:", err);
    } finally {
      setIsLoading(false);
      setLoadingPeriod(null);
      setProgress(null);
    }
  }, []);

  // Export stats as JSON
  const handleExport = () => {
    if (!stats) return;
    const data = {
      exported: new Date().toISOString(),
      period: selectedPeriod,
      stats,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-log-stats-${selectedPeriod}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPercent = progress
    ? Math.round((progress.linesProcessed / progress.totalLines) * 100)
    : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Bug size={20} style={{ color: "#a855f7" }} />
          <h1 style={styles.title}>Debug Stats</h1>
          <span style={styles.subtitle}>Raw Chat Log Analysis</span>
        </div>
        {stats && (
          <button
            onClick={handleExport}
            style={styles.exportButton}
            title="Export stats"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {/* Duration Selector */}
      <div style={styles.controls}>
        <div style={styles.durationLabel}>
          <FileText size={14} style={{ color: "#60a5fa" }} />
          <span>Parse chat.log for:</span>
        </div>
        <div style={styles.durationButtons}>
          {DURATION_OPTIONS.map(({ label, hours }) => (
            <button
              key={label}
              onClick={() => loadChatLogData(hours, label)}
              disabled={isLoading}
              style={{
                ...styles.durationButton,
                ...(selectedPeriod === label && !isLoading
                  ? styles.durationButtonActive
                  : {}),
                opacity: isLoading && loadingPeriod !== label ? 0.5 : 1,
              }}
            >
              {loadingPeriod === label ? (
                <>
                  <RefreshCw
                    size={12}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Loading...
                </>
              ) : (
                label
              )}
            </button>
          ))}
        </div>
        {lastUpdated && (
          <span style={styles.lastUpdated}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {isLoading && progress && (
        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressText}>
              Parsing: {progress.linesProcessed.toLocaleString()} /{" "}
              {progress.totalLines.toLocaleString()} lines
            </span>
            <span style={styles.progressPercent}>{progressPercent}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stats Display */}
      <div style={styles.statsContainer}>
        {/* Summary Bar */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryValue}>
              {formatCompactNumber(stats.linesInRange)}
            </span>
            <span style={styles.summaryLabel}>Lines Parsed</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryValue, color: "#22c55e" }}>
              {stats.accuracy.toFixed(1)}%
            </span>
            <span style={styles.summaryLabel}>Accuracy</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryValue, color: "#f59e0b" }}>
              {formatCompactNumber(stats.kills)}
            </span>
            <span style={styles.summaryLabel}>Kills</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryValue, color: "#22c55e" }}>
              {formatCompactNumber(stats.lootValue)}
            </span>
            <span style={styles.summaryLabel}>Loot PED</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryValue, color: "#f59e0b" }}>
              {formatCompactNumber(stats.globalCount)}
            </span>
            <span style={styles.summaryLabel}>Globals</span>
          </div>
        </div>

        {/* Stat Groups Grid - 2 columns on larger screens */}
        <div style={styles.groupsContainer}>
          {/* Combat - Offensive */}
          <StatGroup title="COMBAT - OFFENSIVE" icon="🎯">
            <StatCard label="Shots" value={stats.shots.toLocaleString()} />
            <StatCard
              label="Hits"
              value={stats.hits.toLocaleString()}
              color="#22c55e"
            />
            <StatCard
              label="Misses"
              value={stats.misses.toLocaleString()}
              color="#ef4444"
            />
            <StatCard
              label="Criticals"
              value={stats.criticals.toLocaleString()}
              color="#f59e0b"
            />
            <StatCard
              label="Damage"
              value={stats.damageDealt.toFixed(1)}
              unit="DMG"
            />
            <StatCard
              label="Critical Dmg"
              value={stats.criticalDamage.toFixed(1)}
              color="#f59e0b"
            />
            <StatCard label="Max Hit" value={stats.maxDamageHit.toFixed(1)} />
            <StatCard
              label="Tgt Dodged"
              value={stats.targetDodged.toLocaleString()}
              color="#94a3b8"
            />
            <StatCard
              label="Tgt Evaded"
              value={stats.targetEvaded.toLocaleString()}
              color="#94a3b8"
            />
            <StatCard
              label="Tgt Resisted"
              value={stats.targetResisted.toLocaleString()}
              color="#94a3b8"
            />
            <StatCard
              label="Out of Range"
              value={stats.outOfRange.toLocaleString()}
              color="#94a3b8"
            />
          </StatGroup>

          {/* Combat - Defensive */}
          <StatGroup title="COMBAT - DEFENSIVE" icon="🛡️">
            <StatCard
              label="Dmg Taken"
              value={stats.damageTaken.toFixed(1)}
              unit="DMG"
              color="#ef4444"
            />
            <StatCard
              label="Crit Dmg Taken"
              value={stats.criticalDamageTaken.toFixed(1)}
              color="#ef4444"
            />
            <StatCard
              label="Dmg Reduced"
              value={stats.damageReduced.toFixed(1)}
              color="#06b6d4"
            />
            <StatCard
              label="Dodges"
              value={stats.playerDodges.toLocaleString()}
              color="#06b6d4"
            />
            <StatCard
              label="Evades"
              value={stats.playerEvades.toLocaleString()}
              color="#06b6d4"
            />
            <StatCard
              label="Deflects"
              value={stats.deflects.toLocaleString()}
              color="#06b6d4"
            />
            <StatCard
              label="Enemy Miss"
              value={stats.enemyMisses.toLocaleString()}
              color="#22c55e"
            />
          </StatGroup>

          {/* Healing */}
          <StatGroup title="HEALING" icon="💊">
            <StatCard
              label="Self Heal"
              value={stats.selfHealing.toFixed(1)}
              unit="HP"
              color="#ec4899"
            />
            <StatCard
              label="Heal Count"
              value={stats.healCount.toLocaleString()}
            />
            <StatCard
              label="Avg Heal"
              value={
                stats.healCount > 0
                  ? (stats.selfHealing / stats.healCount).toFixed(1)
                  : "0"
              }
            />
            <StatCard
              label="Healed By Others"
              value={stats.healedByOthers.toFixed(1)}
              color="#ec4899"
            />
            <StatCard
              label="Healing Given"
              value={stats.healingGiven.toFixed(1)}
              color="#ec4899"
            />
          </StatGroup>

          {/* Loot & Kills */}
          <StatGroup title="LOOT & KILLS" icon="💰">
            <StatCard
              label="Loot Value"
              value={stats.lootValue.toFixed(2)}
              unit="PED"
              color="#22c55e"
            />
            <StatCard
              label="Loot Items"
              value={stats.lootCount.toLocaleString()}
            />
            <StatCard
              label="Kills"
              value={stats.kills.toLocaleString()}
              color="#f59e0b"
            />
            <StatCard
              label="Deaths"
              value={stats.deaths.toLocaleString()}
              color="#ef4444"
            />
            <StatCard
              label="K/D Ratio"
              value={
                stats.deaths > 0
                  ? (stats.kills / stats.deaths).toFixed(2)
                  : stats.kills.toString()
              }
            />
          </StatGroup>

          {/* Skills */}
          <StatGroup title="SKILLS" icon="📚">
            <StatCard
              label="Skill Gains"
              value={stats.skillGains.toFixed(4)}
              color="#8b5cf6"
            />
            <StatCard
              label="Skill Events"
              value={stats.skillEvents.toLocaleString()}
            />
            <StatCard
              label="Rank Ups"
              value={stats.skillRanks.toLocaleString()}
              color="#a855f7"
            />
            <StatCard
              label="New Skills"
              value={stats.newSkillsUnlocked.toLocaleString()}
              color="#22c55e"
            />
          </StatGroup>

          {/* Globals & HOFs */}
          <StatGroup title="GLOBALS & HOFS" icon="🏆">
            <StatCard
              label="Globals"
              value={stats.globalCount.toLocaleString()}
              color="#f59e0b"
            />
            <StatCard
              label="HOFs"
              value={stats.hofs.toLocaleString()}
              color="#a855f7"
            />
          </StatGroup>

          {/* Equipment */}
          <StatGroup title="EQUIPMENT" icon="⚙️">
            <StatCard
              label="Tier Ups"
              value={stats.tierUps.toLocaleString()}
              color="#a855f7"
            />
            <StatCard
              label="Enh. Breaks"
              value={stats.enhancerBreaks.toLocaleString()}
              color="#f97316"
            />
            <StatCard
              label="Shrapnel"
              value={stats.enhancerShrapnel.toFixed(2)}
              unit="PED"
              color="#22c55e"
            />
          </StatGroup>

          {/* Mining */}
          <StatGroup title="MINING" icon="⛏️">
            <StatCard
              label="Claims"
              value={stats.miningClaims.toLocaleString()}
            />
            <StatCard
              label="Claim Value"
              value={stats.miningClaimValue.toFixed(2)}
              unit="PED"
              color="#22c55e"
            />
            <StatCard
              label="No Finds"
              value={stats.miningNoFinds.toLocaleString()}
              color="#ef4444"
            />
            <StatCard
              label="Depleted"
              value={stats.resourceDepleted.toLocaleString()}
            />
          </StatGroup>

          {/* Effects */}
          <StatGroup title="EFFECTS" icon="✨">
            <StatCard
              label="Buffs"
              value={stats.buffsReceived.toLocaleString()}
              color="#22c55e"
            />
            <StatCard
              label="Debuffs"
              value={stats.debuffsReceived.toLocaleString()}
              color="#ef4444"
            />
          </StatGroup>

          {/* Death & Revival */}
          <StatGroup title="DEATH & REVIVAL" icon="💀">
            <StatCard
              label="Deaths"
              value={stats.deaths.toLocaleString()}
              color="#ef4444"
            />
            <StatCard
              label="Revives"
              value={stats.revives.toLocaleString()}
              color="#06b6d4"
            />
            <StatCard
              label="Divine Int."
              value={stats.divineInterventions.toLocaleString()}
              color="#fbbf24"
            />
          </StatGroup>
        </div>
      </div>

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper Components
function StatGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.statGroup}>
      <div style={styles.statGroupTitle}>
        <span style={{ marginRight: "8px" }}>{icon}</span>
        {title}
      </div>
      <div style={styles.statGroupGrid}>{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit = "",
  color = "hsl(0 0% 95%)",
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>
        {formatCompactNumber(value)}
      </div>
      {unit && <div style={styles.statUnit}>{unit}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#090d13",
    color: "hsl(0 0% 95%)",
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid hsl(220 13% 18%)",
    backgroundColor: "hsl(220 13% 8%)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
    color: "#a855f7",
  },
  subtitle: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    paddingLeft: "12px",
    borderLeft: "1px solid hsl(220 13% 25%)",
  },
  exportButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "hsl(217 91% 60%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px 24px",
    backgroundColor: "hsl(220 13% 10%)",
    borderBottom: "1px solid hsl(220 13% 18%)",
    flexWrap: "wrap",
  },
  durationLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "hsl(220 13% 60%)",
  },
  durationButtons: {
    display: "flex",
    gap: "8px",
  },
  durationButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    backgroundColor: "hsl(220 13% 15%)",
    color: "hsl(220 13% 70%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  durationButtonActive: {
    backgroundColor: "hsl(217 91% 60%)",
    color: "white",
    borderColor: "hsl(217 91% 60%)",
  },
  lastUpdated: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
    marginLeft: "auto",
  },
  progressContainer: {
    padding: "12px 24px",
    backgroundColor: "hsl(220 13% 8%)",
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  progressText: {
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
  },
  progressPercent: {
    fontSize: "13px",
    color: "#a855f7",
    fontWeight: "600",
  },
  progressBarBg: {
    width: "100%",
    height: "6px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#a855f7",
    borderRadius: "3px",
    transition: "width 0.2s ease-out",
  },
  statsContainer: {
    flex: 1,
    padding: "20px 24px",
    overflow: "auto",
  },
  summaryBar: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "12px",
    padding: "16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid hsl(220 13% 18%)",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  summaryValue: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#a855f7",
  },
  summaryLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  groupsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  statGroup: {
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    border: "1px solid hsl(220 13% 18%)",
    overflow: "hidden",
  },
  statGroupTitle: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    backgroundColor: "hsl(220 13% 12%)",
    borderBottom: "1px solid hsl(220 13% 18%)",
    fontSize: "11px",
    fontWeight: "700",
    color: "#60a5fa",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statGroupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
    gap: "1px",
    backgroundColor: "hsl(220 13% 15%)",
    padding: "1px",
  },
  statCard: {
    backgroundColor: "hsl(220 13% 10%)",
    padding: "10px 8px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "9px",
    fontWeight: "600",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    marginBottom: "4px",
    letterSpacing: "0.3px",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "hsl(0 0% 95%)",
    marginBottom: "2px",
  },
  statUnit: {
    fontSize: "9px",
    color: "hsl(220 13% 45%)",
    fontWeight: "500",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.7,
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "hsl(220 13% 60%)",
    marginBottom: "4px",
  },
  emptySubtext: {
    fontSize: "13px",
    color: "hsl(220 13% 45%)",
    maxWidth: "300px",
  },
};
