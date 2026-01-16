/**
 * Developer Debug Page
 * Hidden page showing event patterns and historical statistics
 * Only visible in dev mode (import.meta.env.DEV)
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  Bug,
  Copy,
  Download,
  Calendar,
  TrendingUp,
  FileText,
  Activity,
} from "lucide-react";
import type { LogEvent } from "../../core/types";
import { getStoredPlayerName } from "../../hooks/usePlayerName";
import type { RunningStats } from "../../core/session";

interface DevDebugPageProps {
  events: LogEvent[];
}

interface HistoricalStats {
  period: string;
  eventCount: number;
  kills: number;
  shots: number;
  hits: number;
  accuracy: number;
  damage: number;
  lootValue: number;
  skillGains: number;
  globals: number;
  criticals: number;
}

// Progress tracking for historical loading
interface LoadingProgress {
  sessionsLoaded: number;
  totalSessions: number;
  eventsProcessed: number;
}

// Chat log stats (from raw file parsing)
interface ChatLogStats {
  period: string;
  totalLines: number;
  linesInRange: number;
  kills: number;
  shots: number;
  hits: number;
  misses: number;
  accuracy: number;
  damage: number;
  criticals: number;
  lootItems: number;
  lootValue: number;
  skillGains: number;
  globals: number;
  hofs: number;
  damageTaken: number;
  deaths: number;
  // New stats
  selfHealing: number;
  healCount: number;
  enhancerBreaks: number;
  enhancerShrapnel: number;
  deflects: number;
  playerDodges: number;
  playerEvades: number;
  targetEvades: number;
  targetResists: number;
  tierUps: number;
}

// Progress for chat log parsing
interface ChatLogProgress {
  linesProcessed: number;
  totalLines: number;
}

export function DevDebugPage({ events }: DevDebugPageProps) {
  const [copiedPattern, setCopiedPattern] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "patterns" | "history" | "chatlog" | "running"
  >("patterns");
  const [runningStats, setRunningStats] = useState<RunningStats | null>(null);
  const [sessionName, setSessionName] = useState<string>("");
  const [historicalStats, setHistoricalStats] =
    useState<HistoricalStats | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] =
    useState<LoadingProgress | null>(null);

  // Chat log tab state
  const [chatLogStats, setChatLogStats] = useState<ChatLogStats | null>(null);
  const [isLoadingChatLog, setIsLoadingChatLog] = useState(false);
  const [chatLogLoadingPeriod, setChatLogLoadingPeriod] = useState<
    number | null
  >(null);
  const [chatLogProgress, setChatLogProgress] =
    useState<ChatLogProgress | null>(null);

  // Load running stats from latest active session
  useEffect(() => {
    const loadRunningStats = async () => {
      try {
        // Get list of all sessions
        const sessionList = await window.electron?.session?.list();
        if (!sessionList || sessionList.length === 0) return;

        // Find the most recent active session
        const activeSession = sessionList.find((s: any) => !s.endedAt);
        if (!activeSession) {
          // If no active session, get the most recent ended session
          const sorted = sessionList.sort(
            (a: any, b: any) =>
              new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          );
          if (sorted[0]) {
            const session = await window.electron?.session?.load(sorted[0].id);
            if (session?.runningStats) {
              setRunningStats(session.runningStats);
              setSessionName(session.name);
            }
          }
        } else {
          const session = await window.electron?.session?.load(
            activeSession.id
          );
          if (session?.runningStats) {
            setRunningStats(session.runningStats);
            setSessionName(session.name);
          }
        }
      } catch (err) {
        console.error("Failed to load running stats:", err);
      }
    };

    loadRunningStats();
    // Poll every 2 seconds for updates
    const interval = setInterval(loadRunningStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // Extract patterns from all events grouped by their raw log line patterns
  const patterns = useMemo(() => {
    const patternMap = new Map<
      string,
      {
        count: number;
        examples: Set<string>;
        lastSeen: string;
        category: string;
      }
    >();

    events.forEach((event) => {
      // Extract a pattern from the raw log line (first ~80 chars)
      const pattern = extractPattern(event.raw);
      const key = `${pattern}|${event.category}`;

      if (!patternMap.has(key)) {
        patternMap.set(key, {
          count: 0,
          examples: new Set(),
          lastSeen: new Date().toLocaleString(),
          category: event.category,
        });
      }

      const entry = patternMap.get(key)!;
      entry.count++;
      entry.lastSeen = new Date(event.timestamp || Date.now()).toLocaleString();

      // Keep up to 5 examples
      if (entry.examples.size < 5) {
        entry.examples.add(event.raw);
      }
    });

    // Convert to sorted array
    return Array.from(patternMap.entries())
      .map(([key, data]) => {
        const [pattern] = key.split("|");
        return {
          pattern,
          ...data,
          examples: Array.from(data.examples),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [events]);

  const handleCopyPattern = (pattern: string) => {
    navigator.clipboard.writeText(pattern);
    setCopiedPattern(pattern);
    setTimeout(() => setCopiedPattern(null), 2000);
  };

  const handleExportPatterns = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      totalPatterns: patterns.length,
      patterns,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-patterns-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadHistoricalData = async (hours: number) => {
    setIsLoadingHistory(true);
    setLoadingPeriod(hours);
    setLoadingProgress(null);

    const periodLabel =
      hours === 24
        ? "Last 24h"
        : hours === 168
        ? "Last 7d"
        : hours === 720
        ? "Last 30d"
        : `Last ${hours}h`;

    try {
      const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

      // Load all sessions from storage
      const sessionList = await window.electron?.session?.list();
      if (!sessionList || sessionList.length === 0) {
        setHistoricalStats({
          period: periodLabel,
          eventCount: 0,
          kills: 0,
          shots: 0,
          hits: 0,
          accuracy: 0,
          damage: 0,
          lootValue: 0,
          skillGains: 0,
          globals: 0,
          criticals: 0,
        });
        return;
      }

      // Filter sessions within the time range
      const relevantSessions = sessionList.filter((s) => {
        const sessionStart = new Date(s.startedAt).getTime();
        return sessionStart >= cutoffTime;
      });

      const totalSessions = relevantSessions.length;
      console.log(
        `[DevDebug] Loading ${totalSessions} sessions for ${hours}h period`
      );

      // Initialize progress and running totals
      setLoadingProgress({
        sessionsLoaded: 0,
        totalSessions,
        eventsProcessed: 0,
      });

      // Running totals for live updates
      let runningStats = {
        eventCount: 0,
        kills: 0,
        shots: 0,
        hits: 0,
        damage: 0,
        lootValue: 0,
        skillGains: 0,
        globals: 0,
        criticals: 0,
      };

      // Process sessions in batches to keep UI responsive
      const BATCH_SIZE = 5;

      for (let i = 0; i < relevantSessions.length; i += BATCH_SIZE) {
        const batch = relevantSessions.slice(i, i + BATCH_SIZE);

        // Load this batch of sessions in parallel
        const sessionPromises = batch.map((meta) =>
          window.electron?.session?.load(meta.id)
        );
        const sessions = await Promise.all(sessionPromises);

        // Process each session's events
        for (const session of sessions) {
          if (session?.events) {
            for (const event of session.events) {
              runningStats.eventCount++;
              switch (event.type) {
                case "kill":
                  runningStats.kills++;
                  runningStats.shots++;
                  runningStats.hits++;
                  runningStats.damage += event.amount ?? 0;
                  break;
                case "kill.critical":
                  runningStats.kills++;
                  runningStats.shots++;
                  runningStats.hits++;
                  runningStats.criticals++;
                  runningStats.damage += event.amount ?? 0;
                  break;
                case "miss":
                  runningStats.shots++;
                  break;
                case "skill.gain":
                  runningStats.skillGains += event.value ?? 0;
                  break;
                case "loot.global":
                  runningStats.globals++;
                  runningStats.lootValue += event.value ?? 0;
                  break;
                case "loot.item":
                case "loot.hof":
                  runningStats.lootValue += event.value ?? 0;
                  break;
              }
            }
          }
        }

        // Update progress and live stats
        const sessionsLoaded = Math.min(i + BATCH_SIZE, totalSessions);
        setLoadingProgress({
          sessionsLoaded,
          totalSessions,
          eventsProcessed: runningStats.eventCount,
        });

        // Update stats with current totals (live update)
        const accuracy =
          runningStats.shots > 0
            ? (runningStats.hits / runningStats.shots) * 100
            : 0;
        setHistoricalStats({
          period: periodLabel,
          ...runningStats,
          accuracy,
        });

        // Yield to UI thread between batches
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      console.log(
        `[DevDebug] Completed: ${runningStats.eventCount} events from ${totalSessions} sessions`
      );
    } catch (err) {
      console.error("Failed to load historical data:", err);
    } finally {
      setIsLoadingHistory(false);
      setLoadingPeriod(null);
      setLoadingProgress(null);
    }
  };

  // Load and parse raw chat.log file
  const loadChatLogData = async (hours: number) => {
    setIsLoadingChatLog(true);
    setChatLogLoadingPeriod(hours);
    setChatLogProgress(null);

    const periodLabel =
      hours === 24
        ? "Last 24h"
        : hours === 168
        ? "Last 7d"
        : hours === 720
        ? "Last 30d"
        : hours === 8760
        ? "Last 12mo"
        : `Last ${hours}h`;
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    // Get player name for filtering globals
    const playerName = getStoredPlayerName();
    console.log(`[DevDebug] Using player name for globals: "${playerName}"`);

    try {
      // Read raw chat.log file
      const result = await window.electron?.log?.readRaw();
      if (!result?.success || !result.lines) {
        console.error("[DevDebug] Failed to read chat.log:", result?.error);
        setChatLogStats({
          period: periodLabel,
          totalLines: 0,
          linesInRange: 0,
          kills: 0,
          shots: 0,
          hits: 0,
          misses: 0,
          accuracy: 0,
          damage: 0,
          criticals: 0,
          lootItems: 0,
          lootValue: 0,
          skillGains: 0,
          globals: 0,
          hofs: 0,
          damageTaken: 0,
          deaths: 0,
          selfHealing: 0,
          healCount: 0,
          enhancerBreaks: 0,
          enhancerShrapnel: 0,
          deflects: 0,
          playerDodges: 0,
          playerEvades: 0,
          targetEvades: 0,
          targetResists: 0,
          tierUps: 0,
        });
        return;
      }

      const lines: string[] = result.lines;
      const totalLines = lines.length;
      console.log(`[DevDebug] Parsing ${totalLines} lines from chat.log`);

      // Initialize running totals
      let stats = {
        linesInRange: 0,
        kills: 0,
        shots: 0,
        hits: 0,
        misses: 0,
        damage: 0,
        criticals: 0,
        lootItems: 0,
        lootValue: 0,
        skillGains: 0,
        globals: 0,
        hofs: 0,
        damageTaken: 0,
        deaths: 0,
        selfHealing: 0,
        healCount: 0,
        enhancerBreaks: 0,
        enhancerShrapnel: 0,
        deflects: 0,
        playerDodges: 0,
        playerEvades: 0,
        targetEvades: 0,
        targetResists: 0,
        tierUps: 0,
      };

      // Process in batches
      const BATCH_SIZE = 5000;

      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);

        for (const line of batch) {
          // Extract timestamp from line
          const timestampMatch = line.match(
            /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
          );
          if (!timestampMatch) continue;

          const lineTime = new Date(timestampMatch[1]).getTime();
          if (lineTime < cutoffTime) continue;

          stats.linesInRange++;

          // ==================== Combat - Offensive ====================
          // Damage dealt (hits)
          const hitMatch = line.match(/You inflicted ([\d.]+) points of dama/);
          if (hitMatch) {
            stats.hits++;
            stats.shots++;
            stats.damage += parseFloat(hitMatch[1]);
            if (line.includes("Critical hit")) {
              stats.criticals++;
            }
          }

          // Misses (all types count as shots)
          if (line.includes("You missed")) {
            stats.misses++;
            stats.shots++;
          }
          if (line.includes("target Dodged")) {
            stats.shots++;
          }
          if (line.includes("target Evaded")) {
            stats.targetEvades++;
            stats.shots++;
          }
          if (line.includes("target resisted all damage")) {
            stats.targetResists++;
            stats.shots++;
          }

          // ==================== Combat - Defensive ====================
          // Damage taken
          const dmgTakenMatch = line.match(/You took ([\d.]+) points of dama/);
          if (dmgTakenMatch) {
            stats.damageTaken += parseFloat(dmgTakenMatch[1]);
          }

          // Deflects
          if (line.includes("Damage deflected")) {
            stats.deflects++;
          }

          // Player dodges/evades
          if (line.includes("You Dodged the attack")) {
            stats.playerDodges++;
          }
          if (line.includes("You Evaded the attack")) {
            stats.playerEvades++;
          }

          // ==================== Healing ====================
          const selfHealMatch = line.match(
            /You healed yourself ([\d.]+) points/
          );
          if (selfHealMatch) {
            stats.selfHealing += parseFloat(selfHealMatch[1]);
            stats.healCount++;
          }

          // ==================== Loot ====================
          // Standard format: "You received ItemName x (123) Value: 1.23 PED"
          const lootValueMatch = line.match(/Value: ([\d.]+) PED/);
          if (lootValueMatch && line.includes("You received")) {
            stats.lootItems++;
            stats.lootValue += parseFloat(lootValueMatch[1]);
          }

          // ==================== Skills ====================
          const skillMatch = line.match(/You have gained ([\d.]+) experience/);
          if (skillMatch) {
            stats.skillGains += parseFloat(skillMatch[1]);
          }

          // ==================== Globals (filtered by player name) ====================
          if (line.includes("[Globals]") && playerName) {
            // Check if this global is OURS by matching player name at start of message
            // Format: "[Globals] [] PlayerName killed a creature..."
            const globalPlayerMatch = line.match(
              /\[Globals\] \[\] (.+?) (?:killed|found|constructed)/
            );
            if (globalPlayerMatch) {
              const globalPlayer = globalPlayerMatch[1].trim();
              if (globalPlayer === playerName) {
                stats.globals++;
                if (line.includes("Hall of Fame")) {
                  stats.hofs++;
                }
              }
            }
          }

          // ==================== Deaths ====================
          if (
            line.includes("You were killed by") ||
            line.includes("You have been killed")
          ) {
            stats.deaths++;
          }

          // ==================== Equipment ====================
          // Enhancer breaks: "Your enhancer X on your Y broke. You have Z enhancers remaining...You received W PED Shrapnel"
          const enhancerMatch = line.match(
            /Your enhancer .+ broke.*You received ([\d.]+) PED Shrapnel/
          );
          if (enhancerMatch) {
            stats.enhancerBreaks++;
            stats.enhancerShrapnel += parseFloat(enhancerMatch[1]);
          }

          // Tier ups
          if (line.includes("has reached tier")) {
            stats.tierUps++;
          }
        }

        // Update progress
        const linesProcessed = Math.min(i + BATCH_SIZE, totalLines);
        setChatLogProgress({ linesProcessed, totalLines });

        // Update stats live
        const accuracy = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
        setChatLogStats({
          period: periodLabel,
          totalLines,
          ...stats,
          accuracy,
        });

        // Yield to UI
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      console.log(
        `[DevDebug] Chat log parsed: ${stats.linesInRange} lines in range, ${stats.kills} kills, ${stats.globals} globals (player: ${playerName})`
      );
    } catch (err) {
      console.error("Failed to load chat log data:", err);
    } finally {
      setIsLoadingChatLog(false);
      setChatLogLoadingPeriod(null);
      setChatLogProgress(null);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Bug size={20} style={{ color: "#a855f7" }} />
          <h1 style={styles.title}>Developer Debug</h1>
        </div>
        <button
          onClick={handleExportPatterns}
          style={styles.exportButton}
          title="Export all patterns as JSON"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Tab Buttons */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab("patterns")}
          style={activeTab === "patterns" ? styles.tabActive : styles.tab}
        >
          <Bug size={14} />
          Event Patterns
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={activeTab === "history" ? styles.tabActive : styles.tab}
        >
          <Calendar size={14} />
          Session Stats
        </button>
        <button
          onClick={() => setActiveTab("chatlog")}
          style={activeTab === "chatlog" ? styles.tabActive : styles.tab}
        >
          <FileText size={14} />
          Chat Log
        </button>
        <button
          onClick={() => setActiveTab("running")}
          style={activeTab === "running" ? styles.tabActive : styles.tab}
        >
          <Activity size={14} />
          Running Stats
        </button>
      </div>

      {/* Content */}
      {activeTab === "patterns" ? (
        <HistoryPatternsTab
          patterns={patterns}
          copiedPattern={copiedPattern}
          onCopyPattern={handleCopyPattern}
          events={events}
          chatLogStats={chatLogStats}
        />
      ) : activeTab === "history" ? (
        <HistoryStatsTab
          stats={historicalStats}
          isLoading={isLoadingHistory}
          loadingPeriod={loadingPeriod}
          loadingProgress={loadingProgress}
          onLoad={loadHistoricalData}
        />
      ) : activeTab === "chatlog" ? (
        <ChatLogStatsTab
          stats={chatLogStats}
          isLoading={isLoadingChatLog}
          loadingPeriod={chatLogLoadingPeriod}
          loadingProgress={chatLogProgress}
          onLoad={loadChatLogData}
        />
      ) : (
        <RunningStatsTab stats={runningStats} sessionName={sessionName} />
      )}
    </div>
  );
}

/**
 * Extract a pattern from a raw log line by taking first ~80 chars
 * and normalizing variable parts (numbers, item names, etc.)
 */
function extractPattern(rawLine: string): string {
  // Take first 80 chars or full line if shorter
  let pattern = rawLine.substring(0, 80);

  // Normalize common variable patterns
  pattern = pattern
    // Replace timestamps
    .replace(/\[[\d:]+\]/g, "[TIME]")
    // Replace numbers (PED amounts, damage, etc)
    .replace(/\b\d+\.?\d*\b/g, "NUM")
    // Replace item names that start with capitals (MindArk, Omegaton, etc)
    .replace(/[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*/g, "ITEM")
    // Replace character names (all caps or specific format)
    .replace(/\b[A-Z][A-Z0-9]+\b/g, "CHAR");

  // Collapse repeated patterns
  pattern = pattern.replace(/\s+/g, " ");

  return pattern || "[EMPTY]";
}

/**
 * Get a color for the category badge
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    combat: "rgba(59, 130, 246, 0.2)", // blue
    loot: "rgba(34, 197, 94, 0.2)", // green
    skill: "rgba(168, 85, 247, 0.2)", // purple
    global: "rgba(245, 158, 11, 0.2)", // amber
    mining: "rgba(139, 92, 246, 0.2)", // violet
    healing: "rgba(236, 72, 153, 0.2)", // pink
    death: "rgba(239, 68, 68, 0.2)", // red
    equipment: "rgba(6, 182, 212, 0.2)", // cyan
    effect: "rgba(99, 102, 241, 0.2)", // indigo
    social: "rgba(14, 165, 233, 0.2)", // sky
    vehicle: "rgba(107, 114, 128, 0.2)", // gray
    position: "rgba(96, 165, 250, 0.2)", // lightblue
    transaction: "rgba(34, 197, 94, 0.2)", // green
    system: "rgba(120, 113, 108, 0.2)", // stone
  };
  return colors[category] || "rgba(99, 102, 241, 0.2)";
}

// Sub-component: Patterns Tab
function HistoryPatternsTab({
  patterns,
  copiedPattern,
  onCopyPattern,
  events,
  chatLogStats,
}: {
  patterns: any[];
  copiedPattern: string | null;
  onCopyPattern: (pattern: string) => void;
  events: LogEvent[];
  chatLogStats: ChatLogStats | null;
}) {
  return (
    <>
      {/* Stats Summary */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Total Events</div>
          <div style={styles.statValue}>{events.length.toLocaleString()}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Unique Patterns</div>
          <div style={styles.statValue}>{patterns.length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Categories</div>
          <div style={styles.statValue}>
            {new Set(events.map((e) => e.category)).size}
          </div>
        </div>
      </div>

      {/* Chat Log Stats Card - shows when data is loaded */}
      {chatLogStats && (
        <div style={styles.chatLogStatsCard}>
          <div style={styles.chatLogStatsHeader}>
            <FileText size={14} style={{ color: "#60a5fa" }} />
            <span style={styles.chatLogStatsTitle}>
              Chat Log Data ({chatLogStats.period})
            </span>
            <span style={styles.chatLogStatsBadge}>
              {chatLogStats.linesInRange.toLocaleString()} lines
            </span>
          </div>

          {/* Combat Row */}
          <div style={{ ...styles.chatLogStatsGrid, marginBottom: "8px" }}>
            <div style={styles.chatLogStatItem}>
              <span style={styles.chatLogStatValue}>
                {chatLogStats.kills.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Kills</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={styles.chatLogStatValue}>
                {chatLogStats.shots.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Shots</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#22c55e" }}>
                {chatLogStats.hits.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Hits</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={styles.chatLogStatValue}>
                {chatLogStats.accuracy.toFixed(1)}%
              </span>
              <span style={styles.chatLogStatLabel}>Accuracy</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#f59e0b" }}>
                {chatLogStats.criticals.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Crits</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#ef4444" }}>
                {chatLogStats.damage.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Damage</span>
            </div>
          </div>

          {/* Loot & Skills Row */}
          <div style={{ ...styles.chatLogStatsGrid, marginBottom: "8px" }}>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#22c55e" }}>
                {chatLogStats.lootValue.toFixed(2)}
              </span>
              <span style={styles.chatLogStatLabel}>Loot PED</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#22c55e" }}>
                {chatLogStats.lootItems.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Loot Items</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#8b5cf6" }}>
                {chatLogStats.skillGains.toFixed(2)}
              </span>
              <span style={styles.chatLogStatLabel}>Skills</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#f59e0b" }}>
                {chatLogStats.globals}
              </span>
              <span style={styles.chatLogStatLabel}>Globals</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#a855f7" }}>
                {chatLogStats.hofs}
              </span>
              <span style={styles.chatLogStatLabel}>HOFs</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#a855f7" }}>
                {chatLogStats.tierUps}
              </span>
              <span style={styles.chatLogStatLabel}>Tier Ups</span>
            </div>
          </div>

          {/* Defense & Healing Row */}
          <div style={{ ...styles.chatLogStatsGrid, marginBottom: "8px" }}>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#ef4444" }}>
                {chatLogStats.damageTaken.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Dmg Taken</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#ec4899" }}>
                {chatLogStats.selfHealing.toFixed(0)}
              </span>
              <span style={styles.chatLogStatLabel}>Healed</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#06b6d4" }}>
                {chatLogStats.deflects}
              </span>
              <span style={styles.chatLogStatLabel}>Deflects</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#06b6d4" }}>
                {chatLogStats.playerDodges + chatLogStats.playerEvades}
              </span>
              <span style={styles.chatLogStatLabel}>Dodges</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#ef4444" }}>
                {chatLogStats.deaths}
              </span>
              <span style={styles.chatLogStatLabel}>Deaths</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#f97316" }}>
                {chatLogStats.enhancerBreaks}
              </span>
              <span style={styles.chatLogStatLabel}>Enh Breaks</span>
            </div>
          </div>

          {/* Combat Misses Row */}
          <div style={styles.chatLogStatsGrid}>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#94a3b8" }}>
                {chatLogStats.misses.toLocaleString()}
              </span>
              <span style={styles.chatLogStatLabel}>Misses</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#94a3b8" }}>
                {chatLogStats.targetEvades}
              </span>
              <span style={styles.chatLogStatLabel}>Target Evades</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#94a3b8" }}>
                {chatLogStats.targetResists}
              </span>
              <span style={styles.chatLogStatLabel}>Target Resists</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#f97316" }}>
                {chatLogStats.enhancerShrapnel.toFixed(2)}
              </span>
              <span style={styles.chatLogStatLabel}>Shrapnel PED</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={{ ...styles.chatLogStatValue, color: "#ec4899" }}>
                {chatLogStats.healCount}
              </span>
              <span style={styles.chatLogStatLabel}>Heal Count</span>
            </div>
            <div style={styles.chatLogStatItem}>
              <span style={styles.chatLogStatValue}>
                {chatLogStats.healCount > 0
                  ? (chatLogStats.selfHealing / chatLogStats.healCount).toFixed(
                      1
                    )
                  : "0"}
              </span>
              <span style={styles.chatLogStatLabel}>Avg Heal</span>
            </div>
          </div>
        </div>
      )}

      {/* Patterns List */}
      <div style={styles.patternsContainer}>
        {patterns.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✓</div>
            <div style={styles.emptyText}>No events captured yet</div>
            <div style={styles.emptySubtext}>
              Start a session to see event patterns and statistics.
            </div>
          </div>
        ) : (
          patterns.map((item, idx) => (
            <div key={idx} style={styles.patternCard}>
              {/* Pattern Header */}
              <div style={styles.patternHeader}>
                <div style={styles.patternInfo}>
                  <div style={styles.patternText}>{item.pattern}</div>
                  <div style={styles.patternMeta}>
                    <span style={styles.countBadge}>{item.count}x</span>
                    <span
                      style={{
                        ...styles.categoryBadge,
                        backgroundColor: getCategoryColor(item.category),
                      }}
                    >
                      {item.category}
                    </span>
                    <span style={styles.lastSeen}>Last: {item.lastSeen}</span>
                  </div>
                </div>
                <button
                  onClick={() => onCopyPattern(item.pattern)}
                  style={{
                    ...styles.copyButton,
                    backgroundColor:
                      copiedPattern === item.pattern
                        ? "#22c55e"
                        : "transparent",
                  }}
                  title="Copy pattern"
                >
                  <Copy size={14} />
                </button>
              </div>

              {/* Examples */}
              <div style={styles.examples}>
                <div style={styles.examplesLabel}>
                  Examples ({item.examples.length}):
                </div>
                {item.examples.map((example: string, exIdx: number) => (
                  <div key={exIdx} style={styles.exampleLine}>
                    <code style={styles.exampleCode}>{example}</code>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// Sub-component: Historical Stats Tab
function HistoryStatsTab({
  stats,
  isLoading,
  loadingPeriod,
  loadingProgress,
  onLoad,
}: {
  stats: HistoricalStats | null;
  isLoading: boolean;
  loadingPeriod: number | null;
  loadingProgress: LoadingProgress | null;
  onLoad: (hours: number) => void;
}) {
  // Calculate progress percentage
  const progressPercent = loadingProgress
    ? Math.round(
        (loadingProgress.sessionsLoaded / loadingProgress.totalSessions) * 100
      )
    : 0;

  return (
    <div style={styles.patternsContainer}>
      {/* Time Range Buttons */}
      <div style={styles.timeRangeButtons}>
        <button
          onClick={() => onLoad(24)}
          disabled={isLoading}
          style={{
            ...styles.timeButton,
            opacity: isLoading && loadingPeriod !== 24 ? 0.5 : 1,
          }}
        >
          {loadingPeriod === 24 ? "Loading..." : "Last 24h"}
        </button>
        <button
          onClick={() => onLoad(168)}
          disabled={isLoading}
          style={{
            ...styles.timeButton,
            opacity: isLoading && loadingPeriod !== 168 ? 0.5 : 1,
          }}
        >
          {loadingPeriod === 168 ? "Loading..." : "Last 7d"}
        </button>
        <button
          onClick={() => onLoad(720)}
          disabled={isLoading}
          style={{
            ...styles.timeButton,
            opacity: isLoading && loadingPeriod !== 720 ? 0.5 : 1,
          }}
        >
          {loadingPeriod === 720 ? "Loading..." : "Last 30d"}
        </button>
      </div>

      {/* Progress Bar - shown while loading */}
      {isLoading && loadingProgress && (
        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressText}>
              Loading sessions: {loadingProgress.sessionsLoaded} /{" "}
              {loadingProgress.totalSessions}
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
          <div style={styles.progressEvents}>
            {loadingProgress.eventsProcessed.toLocaleString()} events processed
          </div>
        </div>
      )}

      {stats ? (
        <div style={styles.statsContent}>
          <div style={styles.statsPeriod}>
            <TrendingUp size={16} style={{ color: "#a855f7" }} />
            <h3 style={styles.statsPeriodTitle}>{stats.period}</h3>
          </div>

          {/* Combat Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Events</div>
              <div style={styles.statValue}>
                {stats.eventCount.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Kills</div>
              <div style={styles.statValue}>{stats.kills.toLocaleString()}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Shots</div>
              <div style={styles.statValue}>{stats.shots.toLocaleString()}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Hits</div>
              <div style={{ ...styles.statValue, color: "#22c55e" }}>
                {stats.hits.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Accuracy & Damage */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Accuracy</div>
              <div style={styles.statValue}>{stats.accuracy.toFixed(1)}%</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Damage</div>
              <div style={styles.statValue}>
                {stats.damage.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Criticals</div>
              <div style={{ ...styles.statValue, color: "#f59e0b" }}>
                {stats.criticals.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Loot Value</div>
              <div style={{ ...styles.statValue, color: "#22c55e" }}>
                {stats.lootValue.toFixed(2)} PED
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Skill Gains</div>
              <div style={{ ...styles.statValue, color: "#8b5cf6" }}>
                {stats.skillGains.toFixed(4)}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Globals</div>
              <div style={{ ...styles.statValue, color: "#f59e0b" }}>
                {stats.globals}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📊</div>
          <div style={styles.emptyText}>No data loaded</div>
          <div style={styles.emptySubtext}>
            Select a time range to view historical statistics
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Chat Log Stats Tab (parses raw chat.log file)
function ChatLogStatsTab({
  stats,
  isLoading,
  loadingPeriod,
  loadingProgress,
  onLoad,
}: {
  stats: ChatLogStats | null;
  isLoading: boolean;
  loadingPeriod: number | null;
  loadingProgress: ChatLogProgress | null;
  onLoad: (hours: number) => void;
}) {
  const progressPercent = loadingProgress
    ? Math.round(
        (loadingProgress.linesProcessed / loadingProgress.totalLines) * 100
      )
    : 0;

  return (
    <div style={styles.patternsContainer}>
      {/* Description */}
      <div style={styles.tabDescription}>
        <FileText size={14} style={{ color: "#60a5fa" }} />
        <span>
          Parse raw chat.log file directly — includes data from when tracker
          wasn't running
        </span>
      </div>

      {/* Time Range Buttons */}
      <div style={styles.timeRangeButtons}>
        <button
          onClick={() => onLoad(24)}
          disabled={isLoading}
          style={{
            ...styles.timeButton,
            opacity: isLoading && loadingPeriod !== 24 ? 0.5 : 1,
          }}
        >
          {loadingPeriod === 24 ? "Loading..." : "Last 24h"}
        </button>
        <button
          onClick={() => onLoad(168)}
          disabled={isLoading}
          style={{
            ...styles.timeButton,
            opacity: isLoading && loadingPeriod !== 168 ? 0.5 : 1,
          }}
        >
          {loadingPeriod === 168 ? "Loading..." : "Last 7d"}
        </button>
        <button
          onClick={() => onLoad(720)}
          disabled={isLoading}
          style={{
            ...styles.timeButton,
            opacity: isLoading && loadingPeriod !== 720 ? 0.5 : 1,
          }}
        >
          {loadingPeriod === 720 ? "Loading..." : "Last 30d"}
        </button>
        <button
          onClick={() => onLoad(8760)}
          disabled={isLoading}
          style={{
            ...styles.timeButton,
            opacity: isLoading && loadingPeriod !== 8760 ? 0.5 : 1,
          }}
        >
          {loadingPeriod === 8760 ? "Loading..." : "Last 12mo"}
        </button>
      </div>

      {/* Progress Bar */}
      {isLoading && loadingProgress && (
        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressText}>
              Parsing lines: {loadingProgress.linesProcessed.toLocaleString()} /{" "}
              {loadingProgress.totalLines.toLocaleString()}
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

      {stats ? (
        <div style={styles.statsContent}>
          <div style={styles.statsPeriod}>
            <FileText size={16} style={{ color: "#60a5fa" }} />
            <h3 style={{ ...styles.statsPeriodTitle, color: "#60a5fa" }}>
              {stats.period}
            </h3>
            <span style={styles.periodSubtext}>
              ({stats.linesInRange.toLocaleString()} /{" "}
              {stats.totalLines.toLocaleString()} lines)
            </span>
          </div>

          {/* Combat Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Kills</div>
              <div style={styles.statValue}>{stats.kills.toLocaleString()}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Shots</div>
              <div style={styles.statValue}>{stats.shots.toLocaleString()}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Hits</div>
              <div style={{ ...styles.statValue, color: "#22c55e" }}>
                {stats.hits.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Misses</div>
              <div style={{ ...styles.statValue, color: "#ef4444" }}>
                {stats.misses.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Accuracy & Damage */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Accuracy</div>
              <div style={styles.statValue}>{stats.accuracy.toFixed(1)}%</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Damage Dealt</div>
              <div style={styles.statValue}>
                {stats.damage.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Criticals</div>
              <div style={{ ...styles.statValue, color: "#f59e0b" }}>
                {stats.criticals.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Damage Taken</div>
              <div style={{ ...styles.statValue, color: "#ef4444" }}>
                {stats.damageTaken.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Loot & Economy */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Loot Items</div>
              <div style={styles.statValue}>
                {stats.lootItems.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Loot Value</div>
              <div style={{ ...styles.statValue, color: "#22c55e" }}>
                {stats.lootValue.toFixed(2)} PED
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Skill Gains</div>
              <div style={{ ...styles.statValue, color: "#8b5cf6" }}>
                {stats.skillGains.toFixed(4)}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Deaths</div>
              <div style={{ ...styles.statValue, color: "#ef4444" }}>
                {stats.deaths}
              </div>
            </div>
          </div>

          {/* Healing & Defense */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Self Healing</div>
              <div style={{ ...styles.statValue, color: "#ec4899" }}>
                {stats.selfHealing.toFixed(1)}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Heal Count</div>
              <div style={{ ...styles.statValue, color: "#ec4899" }}>
                {stats.healCount.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Deflects</div>
              <div style={{ ...styles.statValue, color: "#06b6d4" }}>
                {stats.deflects.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Dodges/Evades</div>
              <div style={{ ...styles.statValue, color: "#06b6d4" }}>
                {(stats.playerDodges + stats.playerEvades).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Enhancer Breaks</div>
              <div style={{ ...styles.statValue, color: "#f97316" }}>
                {stats.enhancerBreaks.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Enhancer Shrapnel</div>
              <div style={{ ...styles.statValue, color: "#22c55e" }}>
                {stats.enhancerShrapnel.toFixed(2)} PED
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Tier Ups</div>
              <div style={{ ...styles.statValue, color: "#a855f7" }}>
                {stats.tierUps.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Target Evades</div>
              <div style={{ ...styles.statValue, color: "#94a3b8" }}>
                {(stats.targetEvades + stats.targetResists).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Globals & HOFs */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Your Globals</div>
              <div style={{ ...styles.statValue, color: "#f59e0b" }}>
                {stats.globals}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Your HOFs</div>
              <div style={{ ...styles.statValue, color: "#a855f7" }}>
                {stats.hofs}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📄</div>
          <div style={styles.emptyText}>No data loaded</div>
          <div style={styles.emptySubtext}>
            Select a time range to parse your chat.log file
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Running Stats Tab - Shows real-time running stats from active/latest session
 */
function RunningStatsTab({
  stats,
  sessionName,
}: {
  stats: RunningStats | null;
  sessionName: string;
}) {
  if (!stats) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>⏱️</div>
          <div style={styles.emptyText}>No running stats available</div>
          <div style={styles.emptySubtext}>
            Start a session to see real-time running stats
          </div>
        </div>
      </div>
    );
  }

  const StatGroup = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );

  const StatCard = ({
    label,
    value,
    unit = "",
    color = "hsl(0 0% 95%)",
  }: {
    label: string;
    value: string | number;
    unit?: string;
    color?: string;
  }) => (
    <div style={styles.statCard}>
      <div style={styles.runningStatLabel}>{label}</div>
      <div style={{ ...styles.runningStatValue, color }}>{value}</div>
      {unit && <div style={styles.runningStatUnit}>{unit}</div>}
    </div>
  );

  return (
    <div style={{ ...styles.container, overflow: "auto", padding: "24px" }}>
      {/* Header */}
      <div style={styles.runningStatsHeader}>
        <div>
          <h3 style={styles.runningSessionName}>{sessionName}</h3>
          <div style={styles.runningSessionMeta}>
            ⏱️ Session running • Updated every 2 seconds
          </div>
        </div>
      </div>

      {/* Combat - Offensive */}
      <StatGroup
        title="COMBAT - OFFENSIVE"
        icon={<span style={{ marginRight: "8px" }}>🎯</span>}
      >
        <div style={styles.statsGrid}>
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
            unit="PED"
          />
          <StatCard
            label="Max Hit"
            value={stats.maxDamageHit.toFixed(1)}
            unit="PED"
          />
          <StatCard
            label="Target Dodged"
            value={stats.targetDodged.toLocaleString()}
          />
          <StatCard
            label="Target Evaded"
            value={stats.targetEvaded.toLocaleString()}
          />
          <StatCard
            label="Target Resisted"
            value={stats.targetResisted.toLocaleString()}
          />
          <StatCard
            label="Out of Range"
            value={stats.outOfRange.toLocaleString()}
          />
        </div>
      </StatGroup>

      {/* Combat - Defensive */}
      <StatGroup
        title="COMBAT - DEFENSIVE"
        icon={<span style={{ marginRight: "8px" }}>🛡️</span>}
      >
        <div style={styles.statsGrid}>
          <StatCard
            label="Damage Taken"
            value={stats.damageTaken.toFixed(1)}
            unit="PED"
          />
          <StatCard
            label="Crit Damage Taken"
            value={stats.criticalDamageTaken.toFixed(1)}
            unit="PED"
          />
          <StatCard
            label="Damage Reduced"
            value={stats.damageReduced.toFixed(1)}
            unit="PED"
          />
          <StatCard
            label="Player Dodges"
            value={stats.playerDodges.toLocaleString()}
          />
          <StatCard
            label="Player Evades"
            value={stats.playerEvades.toLocaleString()}
          />
          <StatCard
            label="Deflects"
            value={stats.deflects.toLocaleString()}
            color="#06b6d4"
          />
          <StatCard
            label="Enemy Misses"
            value={stats.enemyMisses.toLocaleString()}
          />
        </div>
      </StatGroup>

      {/* Healing */}
      <StatGroup
        title="HEALING"
        icon={<span style={{ marginRight: "8px" }}>💊</span>}
      >
        <div style={styles.statsGrid}>
          <StatCard
            label="Self Healing"
            value={stats.selfHealing.toFixed(1)}
            unit="PED"
            color="#ec4899"
          />
          <StatCard
            label="Heal Count"
            value={stats.healCount.toLocaleString()}
          />
          <StatCard
            label="Healed By Others"
            value={stats.healedByOthers.toFixed(1)}
            unit="PED"
          />
          <StatCard
            label="Healing Given"
            value={stats.healingGiven.toFixed(1)}
            unit="PED"
          />
        </div>
      </StatGroup>

      {/* Loot & Kills */}
      <StatGroup
        title="LOOT & KILLS"
        icon={<span style={{ marginRight: "8px" }}>💰</span>}
      >
        <div style={styles.statsGrid}>
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
          <StatCard label="Kills" value={stats.kills.toLocaleString()} />
          <StatCard label="Deaths" value={stats.deaths.toLocaleString()} />
        </div>
      </StatGroup>

      {/* Skills */}
      <StatGroup
        title="SKILLS"
        icon={<span style={{ marginRight: "8px" }}>📚</span>}
      >
        <div style={styles.statsGrid}>
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
            label="Skill Ranks"
            value={stats.skillRanks.toLocaleString()}
          />
          <StatCard
            label="New Skills Unlocked"
            value={stats.newSkillsUnlocked.toLocaleString()}
          />
        </div>
      </StatGroup>

      {/* Globals & HOFs */}
      <StatGroup
        title="GLOBALS & HOFS"
        icon={<span style={{ marginRight: "8px" }}>🏆</span>}
      >
        <div style={styles.statsGrid}>
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
        </div>
      </StatGroup>

      {/* Equipment */}
      <StatGroup
        title="EQUIPMENT"
        icon={<span style={{ marginRight: "8px" }}>⚙️</span>}
      >
        <div style={styles.statsGrid}>
          <StatCard
            label="Tier Ups"
            value={stats.tierUps.toLocaleString()}
            color="#a855f7"
          />
          <StatCard
            label="Enhancer Breaks"
            value={stats.enhancerBreaks.toLocaleString()}
            color="#f97316"
          />
          <StatCard
            label="Enhancer Shrapnel"
            value={stats.enhancerShrapnel.toFixed(2)}
            unit="PED"
            color="#22c55e"
          />
        </div>
      </StatGroup>

      {/* Mining */}
      <StatGroup
        title="MINING"
        icon={<span style={{ marginRight: "8px" }}>⛏️</span>}
      >
        <div style={styles.statsGrid}>
          <StatCard
            label="Mining Claims"
            value={stats.miningClaims.toLocaleString()}
          />
          <StatCard
            label="Claim Value"
            value={stats.miningClaimValue.toFixed(2)}
            unit="PED"
          />
          <StatCard
            label="No Finds"
            value={stats.miningNoFinds.toLocaleString()}
          />
          <StatCard
            label="Resources Depleted"
            value={stats.resourceDepleted.toLocaleString()}
          />
        </div>
      </StatGroup>

      {/* Effects */}
      <StatGroup
        title="EFFECTS"
        icon={<span style={{ marginRight: "8px" }}>✨</span>}
      >
        <div style={styles.statsGrid}>
          <StatCard
            label="Buffs Received"
            value={stats.buffsReceived.toLocaleString()}
            color="#22c55e"
          />
          <StatCard
            label="Debuffs Received"
            value={stats.debuffsReceived.toLocaleString()}
            color="#ef4444"
          />
        </div>
      </StatGroup>

      {/* Death/Revival */}
      <StatGroup
        title="DEATH & REVIVAL"
        icon={<span style={{ marginRight: "8px" }}>💀</span>}
      >
        <div style={styles.statsGrid}>
          <StatCard
            label="Revives"
            value={stats.revives.toLocaleString()}
            color="#06b6d4"
          />
          <StatCard
            label="Divine Interventions"
            value={stats.divineInterventions.toLocaleString()}
            color="#fbbf24"
          />
        </div>
      </StatGroup>
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
    padding: "20px 24px",
    borderBottom: "1px solid hsl(220 13% 18%)",
    backgroundColor: "hsl(220 13% 8%)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    color: "#a855f7",
  },
  exportButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "hsl(217 91% 60%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    padding: "16px 24px",
    backgroundColor: "hsl(220 13% 10%)",
  },
  statBox: {
    padding: "12px 16px",
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "8px",
    border: "1px solid hsl(220 13% 18%)",
  },
  statLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#a855f7",
  },
  patternsContainer: {
    flex: 1,
    padding: "16px 24px",
    overflow: "auto",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "300px",
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
    color: "#22c55e",
    marginBottom: "4px",
  },
  emptySubtext: {
    fontSize: "13px",
    color: "hsl(220 13% 50%)",
  },
  patternCard: {
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 18%)",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px",
  },
  patternHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },
  patternInfo: {
    flex: 1,
    minWidth: 0,
  },
  patternText: {
    fontSize: "12px",
    fontFamily: "monospace",
    backgroundColor: "hsl(220 13% 8%)",
    padding: "8px 10px",
    borderRadius: "6px",
    color: "#60a5fa",
    wordBreak: "break-all",
    marginBottom: "6px",
  },
  patternMeta: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "hsl(220 13% 50%)",
  },
  countBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    color: "#a855f7",
    borderRadius: "4px",
    fontWeight: "600",
  },
  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#60a5fa",
  },
  lastSeen: {
    color: "hsl(220 13% 50%)",
  },
  copyButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    backgroundColor: "transparent",
    color: "hsl(220 13% 50%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  examples: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid hsl(220 13% 18%)",
  },
  examplesLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  exampleLine: {
    marginBottom: "6px",
    padding: "6px 8px",
    backgroundColor: "hsl(220 13% 8%)",
    borderRadius: "4px",
    overflow: "auto",
  },
  exampleCode: {
    fontSize: "10px",
    fontFamily: "monospace",
    color: "#60a5fa",
    wordBreak: "break-all",
    whiteSpace: "pre-wrap",
  },
  instructions: {
    padding: "16px 24px",
    backgroundColor: "hsl(220 13% 10%)",
    borderTop: "1px solid hsl(220 13% 18%)",
  },
  instructionsTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  instructionsList: {
    margin: 0,
    paddingLeft: "20px",
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
  },
  tabBar: {
    display: "flex",
    gap: "0",
    borderBottom: "1px solid hsl(220 13% 18%)",
    backgroundColor: "hsl(220 13% 8%)",
    padding: "0 24px",
    flexShrink: 0,
  },
  tab: {
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "transparent",
    color: "hsl(220 13% 45%)",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  tabActive: {
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "transparent",
    color: "hsl(217 91% 68%)",
    border: "none",
    borderBottom: "2px solid hsl(217 91% 68%)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  timeRangeButtons: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  timeButton: {
    padding: "10px 16px",
    backgroundColor: "hsl(217 91% 60%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  statsContent: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  statsPeriod: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  statsPeriodTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#a855f7",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
  },
  statCard: {
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "center",
    border: "1px solid hsl(220 13% 18%)",
  },
  runningStatLabel: {
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    fontWeight: "500",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  runningStatValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "hsl(0 0% 95%)",
    marginBottom: "2px",
  },
  runningStatUnit: {
    fontSize: "11px",
    color: "hsl(220 13% 50%)",
    fontWeight: "400",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#60a5fa",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid hsl(220 13% 18%)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  runningStatsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid hsl(220 13% 18%)",
  },
  runningSessionName: {
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 4px 0",
    color: "#a855f7",
  },
  runningSessionMeta: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
  },
  // Progress bar styles
  progressContainer: {
    padding: "16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid hsl(220 13% 18%)",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  progressText: {
    fontSize: "13px",
    color: "hsl(220 13% 70%)",
    fontWeight: "500",
  },
  progressPercent: {
    fontSize: "14px",
    color: "#a855f7",
    fontWeight: "600",
  },
  progressBarBg: {
    width: "100%",
    height: "8px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#a855f7",
    borderRadius: "4px",
    transition: "width 0.2s ease-out",
  },
  progressEvents: {
    marginTop: "8px",
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    textAlign: "center" as const,
  },
  // Chat log tab specific styles
  tabDescription: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    border: "1px solid hsl(220 13% 18%)",
  },
  periodSubtext: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    fontWeight: "400",
    marginLeft: "8px",
  },
  // Chat log stats card in Event Patterns tab
  chatLogStatsCard: {
    backgroundColor: "hsl(220 13% 10%)",
    border: "1px solid hsl(217 91% 40% / 0.3)",
    borderRadius: "8px",
    padding: "12px 16px",
    margin: "0 24px 16px",
  },
  chatLogStatsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  chatLogStatsTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#60a5fa",
    flex: 1,
  },
  chatLogStatsBadge: {
    fontSize: "11px",
    fontWeight: "500",
    color: "hsl(220 13% 50%)",
    padding: "2px 8px",
    backgroundColor: "hsl(220 13% 15%)",
    borderRadius: "4px",
  },
  chatLogStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "12px",
  },
  chatLogStatItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "2px",
  },
  chatLogStatValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "hsl(0 0% 90%)",
  },
  chatLogStatLabel: {
    fontSize: "10px",
    fontWeight: "500",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase" as const,
  },
};
