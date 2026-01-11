/**
 * ARTEMIS PopoutStats V2 - Complete Rebuild
 * Clean, modern design using proper UI components and design tokens
 */

import React, { useEffect, useState } from "react";
import { GripHorizontal, Settings, RotateCcw, Activity, X, Clock, Edit2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LiveStats } from "../types/electron";
import { colors, spacing, radius, typography } from "./ui";
import { STAT_MAP, type StatData } from "./popout/stat-definitions";
import { LoadoutDropdown } from "./LoadoutManager";
import { useLoadouts } from "../hooks/useLoadouts";
import { AsteroidPanel } from "./popout/AsteroidPanel";

// Storage keys
const CONFIG_KEY = "artemis-popout-v2-config";
const VERSION_KEY = "artemis-popout-version";

type PopoutMode = "stats" | "asteroid";

interface PopoutConfigV2 {
  mode: PopoutMode;
  hero: string;
  stats: string[]; // 6 stat tiles
}

const DEFAULT_CONFIG: PopoutConfigV2 = {
  mode: "stats",
  hero: "netProfit",
  stats: ["returnRate", "kills", "hitRate", "lootValue", "totalSpend", "damageDealt"],
};

// Load config from localStorage
function loadConfig(): PopoutConfigV2 {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_CONFIG;
}

// Save config to localStorage
function saveConfig(config: PopoutConfigV2) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

// Format duration
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PopoutStatsV2() {
  const [stats, setStats] = useState<LiveStats>({
    profit: 0,
    netProfit: 0,
    shots: 0,
    hits: 0,
    kills: 0,
    deaths: 0,
    criticals: 0,
    lootValue: 0,
    totalSpend: 0,
    returnRate: 0,
    damageDealt: 0,
    damageTaken: 0,
    damageReduced: 0,
    deflects: 0,
    decay: 0,
    repairBill: 0,
    skillGains: 0,
    skillEvents: 0,
    duration: 0,
  });

  const [config, setConfig] = useState<PopoutConfigV2>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Loadout management
  const { loadouts, activeLoadout, setActive: setActiveLoadout } = useLoadouts();

  // Track window size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for stats updates
  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onStatsUpdate((data: LiveStats) => {
      setStats(data);
    });
    window.electron?.popout?.requestStats();
    return () => unsubscribe?.();
  }, []);

  // Save config on change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const statData: StatData = stats;

  const handleModeChange = (mode: PopoutMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  };

  const handleChangeHero = (newStatKey: string) => {
    setConfig((prev) => ({ ...prev, hero: newStatKey }));
  };

  const handleChangeStat = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newStats = [...prev.stats];
      newStats[index] = newStatKey;
      return { ...prev, stats: newStats };
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleSwitchVersion = () => {
    localStorage.setItem(VERSION_KEY, "v1");
    window.location.reload();
  };

  const handleClose = () => {
    window.electron?.popout?.close();
  };

  // Calculate efficiency metrics
  const killsPerHour = stats.duration > 0 ? (stats.kills / stats.duration) * 3600 : 0;
  const lootPerHour = stats.duration > 0 ? (stats.lootValue / stats.duration) * 3600 : 0;

  // Calculate responsive columns based on window width
  const getColumns = () => {
    if (windowWidth < 220) return 1;
    if (windowWidth < 380) return 2;
    return 3;
  };

  const columns = getColumns();

  return (
    <div style={styles.container}>
      {/* Draggable Header */}
      <div style={styles.header}>
        {/* Mode Tabs */}
        <div style={styles.modeTabs}>
          <button
            onClick={() => handleModeChange("stats")}
            style={{
              ...styles.modeTab,
              backgroundColor: config.mode === "stats" ? colors.bgCard : "transparent",
              color: config.mode === "stats" ? colors.textPrimary : colors.textMuted,
            }}
            title="Stats Mode"
          >
            <Activity size={10} />
          </button>
        </div>

        {/* Duration Display */}
        {config.mode === "stats" && (
          <div style={styles.durationDisplay}>
            <Clock size={10} style={{ color: colors.textMuted }} />
            <span style={styles.durationText}>{formatDuration(stats.duration)}</span>
          </div>
        )}

        {/* Drag Handle */}
        <div style={styles.dragHandle}>
          <GripHorizontal size={14} style={{ color: colors.textMuted }} />
        </div>

        {/* Header Actions */}
        <div style={styles.headerActions}>
          {config.mode === "stats" && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                ...styles.headerButton,
                backgroundColor: showSettings ? colors.bgCard : "transparent",
              }}
              title="Settings"
            >
              <Settings size={12} />
            </button>
          )}
          <button
            onClick={handleClose}
            style={styles.headerButton}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {config.mode === "stats" && showSettings && (
        <div style={styles.settingsPanel}>
          <div style={styles.settingsRow}>
            <span style={styles.settingsLabel}>Configuration</span>
          </div>
          <div style={styles.settingsRow}>
            <button onClick={handleReset} style={styles.settingsActionButton}>
              <RotateCcw size={11} />
              Reset to Defaults
            </button>
          </div>
          <div style={styles.settingsRow}>
            <button onClick={handleSwitchVersion} style={styles.settingsActionButton}>
              Switch to V1
            </button>
          </div>
          <div style={styles.settingsDivider} />
          <div style={styles.settingsHint}>Click edit buttons on cards to change stats</div>
        </div>
      )}

      {/* Asteroid Mode */}
      <div style={{ display: config.mode === "asteroid" ? "block" : "none", flex: 1 }}>
        <AsteroidPanel />
      </div>

      {/* Stats Mode */}
      {config.mode === "stats" && (
        <div style={styles.content}>
          {/* Loadout Dropdown */}
          <div style={styles.loadoutRow}>
            <LoadoutDropdown
              loadouts={loadouts}
              activeLoadout={activeLoadout}
              onSelect={setActiveLoadout}
              compact
            />
          </div>

          {/* Hero Stat */}
          <HeroStatCard
            statKey={config.hero}
            data={statData}
            onChange={handleChangeHero}
            settingsMode={showSettings}
          />

          {/* Stats Grid */}
          <div
            style={{
              ...styles.statsGrid,
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
            }}
          >
            {config.stats.map((statKey, index) => (
              <StatCard
                key={`stat-${index}`}
                statKey={statKey}
                data={statData}
                onChange={(newKey) => handleChangeStat(index, newKey)}
                settingsMode={showSettings}
              />
            ))}
          </div>

          {/* Footer - Efficiency Metrics */}
          <div style={styles.footer}>
            <div style={styles.footerMetric}>
              <span style={styles.footerLabel}>Duration</span>
              <span style={styles.footerValue}>{formatDuration(stats.duration)}</span>
            </div>
            <div style={styles.footerDivider} />
            <div style={styles.footerMetric}>
              <span style={styles.footerLabel}>Kills/hr</span>
              <span style={styles.footerValue}>{killsPerHour.toFixed(0)}</span>
            </div>
            <div style={styles.footerDivider} />
            <div style={styles.footerMetric}>
              <span style={styles.footerLabel}>Loot/hr</span>
              <span style={styles.footerValue}>{lootPerHour.toFixed(0)} PEC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hero Stat Card Component
function HeroStatCard({
  statKey,
  data,
  onChange,
  settingsMode,
}: {
  statKey: string;
  data: StatData;
  onChange: (newKey: string) => void;
  settingsMode: boolean;
}) {
  const [showSelector, setShowSelector] = useState(false);
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;

  const value = stat.getValue(data);
  const Icon = stat.icon;

  return (
    <div style={styles.heroCard}>
      {/* Background Icon */}
      <div style={styles.heroIcon}>
        <Icon size={60} />
      </div>

      {/* Edit Button (only in settings mode) */}
      {settingsMode && (
        <button
          onClick={() => setShowSelector(!showSelector)}
          style={styles.editButton}
          title="Change stat"
        >
          <Edit2 size={11} />
        </button>
      )}

      {/* Stat Selector Dropdown */}
      {showSelector && (
        <div style={{ position: "absolute", top: spacing.md, left: spacing.md, right: spacing.md, zIndex: 1 }}>
          <StatSelector
            currentKey={statKey}
            onSelect={(newKey) => {
              onChange(newKey);
              setShowSelector(false);
            }}
          />
        </div>
      )}

      {/* Always show stat value */}
      <div style={styles.heroLabel}>{stat.label.toUpperCase()}</div>
      <div style={{ ...styles.heroValue, color: value.color }}>
        {value.value}
        {value.unit && <span style={styles.heroUnit}> {value.unit}</span>}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  statKey,
  data,
  onChange,
  settingsMode,
}: {
  statKey: string;
  data: StatData;
  onChange: (newKey: string) => void;
  settingsMode: boolean;
}) {
  const [showSelector, setShowSelector] = useState(false);
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;

  const value = stat.getValue(data);
  const Icon = stat.icon;

  return (
    <div style={styles.statCard}>
      {/* Background Icon */}
      <div style={styles.statIcon}>
        <Icon size={32} />
      </div>

      {/* Edit Button (only in settings mode) */}
      {settingsMode && (
        <button
          onClick={() => setShowSelector(!showSelector)}
          style={styles.editButtonSmall}
          title="Change stat"
        >
          <Edit2 size={10} />
        </button>
      )}

      {/* Stat Selector Dropdown */}
      {showSelector && (
        <div style={{ position: "absolute", top: spacing.xs, left: spacing.xs, right: spacing.xs, zIndex: 1 }}>
          <StatSelector
            currentKey={statKey}
            onSelect={(newKey) => {
              onChange(newKey);
              setShowSelector(false);
            }}
          />
        </div>
      )}

      {/* Always show stat value */}
      <div style={styles.statLabel}>{stat.label}</div>
      <div style={{ ...styles.statValue, color: value.color }}>
        {value.value}
        {value.unit && <span style={styles.statUnit}> {value.unit}</span>}
      </div>
    </div>
  );
}

// Stat Selector Dropdown
function StatSelector({
  currentKey,
  onSelect,
}: {
  currentKey: string;
  onSelect: (key: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentStat = STAT_MAP.get(currentKey);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.selectorButton}>
        {currentStat?.label || "Select..."}
      </button>
      {isOpen && (
        <>
          <div style={styles.selectorOverlay} onClick={() => setIsOpen(false)} />
          <div style={styles.selectorDropdown}>
            {Array.from(STAT_MAP.values()).map((stat) => (
              <button
                key={stat.key}
                onClick={() => {
                  onSelect(stat.key);
                  setIsOpen(false);
                }}
                style={{
                  ...styles.selectorOption,
                  backgroundColor:
                    stat.key === currentKey ? "hsl(217 91% 68% / 0.15)" : "transparent",
                }}
              >
                <span style={styles.selectorCategory}>{stat.category}</span>
                {stat.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: colors.bgBase,
    display: "flex",
    flexDirection: "column",
    fontFamily: typography.sans,
  },
  header: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 24,
    backgroundColor: colors.bgPanel,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    cursor: "grab",
    padding: `0 ${spacing.xs}px`,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "drag",
  },
  modeTabs: {
    display: "flex",
    gap: 2,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  modeTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 18,
    border: "none",
    borderRadius: radius.xs,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  durationDisplay: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.textSecondary,
    pointerEvents: "none",
  },
  durationText: {
    fontWeight: 600,
  },
  dragHandle: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 24,
    pointerEvents: "none",
  },
  headerActions: {
    display: "flex",
    gap: 2,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  headerButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 18,
    border: "none",
    borderRadius: radius.xs,
    color: colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  settingsPanel: {
    padding: spacing.md,
    backgroundColor: colors.bgPanel,
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  settingsRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingsLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  settingsActionButton: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    padding: `${spacing.xs}px ${spacing.md}px`,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    width: "100%",
    justifyContent: "center",
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    margin: `${spacing.xs}px 0`,
  },
  settingsHint: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  loadoutRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroCard: {
    position: "relative",
    backgroundColor: colors.bgCard,
    border: `2px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: spacing.lg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
    overflow: "hidden",
  },
  heroIcon: {
    position: "absolute",
    right: spacing.sm,
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.06,
    color: colors.iconWatermark,
    pointerEvents: "none",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.textSecondary,
    letterSpacing: "0.1em",
    marginBottom: spacing.xs,
    zIndex: 1,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: 700,
    fontFamily: typography.mono,
    lineHeight: 1,
    zIndex: 1,
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: 600,
    opacity: 0.7,
  },
  editButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xs,
    backgroundColor: colors.bgPanel,
    color: colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
    zIndex: 2,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  editButtonSmall: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xs,
    backgroundColor: colors.bgPanel,
    color: colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
    zIndex: 2,
    fontSize: 9,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: spacing.xs,
  },
  statCard: {
    position: "relative",
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: spacing.sm,
    display: "flex",
    flexDirection: "column",
    minHeight: 58,
    overflow: "hidden",
  },
  statIcon: {
    position: "absolute",
    right: spacing.xs,
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.05,
    color: colors.iconWatermark,
    pointerEvents: "none",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: spacing.xs,
    zIndex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: typography.mono,
    zIndex: 1,
  },
  statUnit: {
    fontSize: "0.7em",
    fontWeight: 600,
    opacity: 0.7,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: radius.sm,
    marginTop: "auto",
  },
  footerMetric: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  footerValue: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderSubtle,
  },
  selectorButton: {
    width: "100%",
    padding: `${spacing.xs}px ${spacing.sm}px`,
    backgroundColor: colors.bgBase,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xs,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
  },
  selectorOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  selectorDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    maxHeight: 200,
    overflowY: "auto",
    zIndex: 10000,
    boxShadow: `0 4px 12px ${colors.bgBase}80`,
  },
  selectorOption: {
    width: "100%",
    padding: `${spacing.xs}px ${spacing.sm}px`,
    border: "none",
    backgroundColor: "transparent",
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    transition: "background-color 0.1s ease",
  },
  selectorCategory: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: "uppercase",
    minWidth: 50,
  },
};

export default PopoutStatsV2;
