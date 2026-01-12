/**
 * PopoutStats - Minimal, focused overlay for hunting and economy stats
 * Clean layout with hero stat, primary/secondary metrics, and skills
 */

import React, { useEffect, useState } from "react";
import { GripHorizontal, Settings, RotateCcw, Activity } from "lucide-react";
import type { LiveStats } from "../types/electron";
import { colors, spacing, radius } from "./ui";
import { STAT_MAP, type StatData } from "./popout/stat-definitions";
import { AsteroidPanel } from "./popout/AsteroidPanel";
import { LoadoutDropdown } from "./LoadoutManager";
import { useLoadouts } from "../hooks/useLoadouts";

// Storage key for persisted config
const STORAGE_KEY = "artemis-popout-config";

type PopoutMode = "stats" | "asteroid";

interface PopoutConfig {
  mode: PopoutMode;
  hero: string; // single hero stat key
  primary: string[]; // 3 primary stats
  secondary: string[]; // 3 secondary stats
  skills: string[]; // 2 skill stats
}

const DEFAULT_CONFIG: PopoutConfig = {
  mode: "stats",
  hero: "netProfit",
  primary: ["returnRate", "kills", "hitRate"],
  secondary: ["lootValue", "totalSpend", "damageDealt"],
  skills: ["skillGains", "skillEvents"],
};

// Load config from localStorage
function loadConfig(): PopoutConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // Ignore errors
  }
  return DEFAULT_CONFIG;
}

// Save config to localStorage
function saveConfig(config: PopoutConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore errors
  }
}

// Format duration as HH:MM:SS or MM:SS
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PopoutStats() {
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

  const [config, setConfig] = useState<PopoutConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);

  // Loadout state management
  const {
    loadouts,
    activeLoadout,
    setActive: setActiveLoadout,
  } = useLoadouts();

  // Listen for stats updates
  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onStatsUpdate(
      (data: LiveStats) => {
        setStats(data);
      }
    );
    window.electron?.popout?.requestStats();
    return () => {
      unsubscribe?.();
    };
  }, []);

  // Listen for session status updates
  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onSessionStatusUpdate((isActive: boolean) => {
      setSessionActive(isActive);
    });
    // Request initial session status
    window.electron?.popout?.requestSessionStatus();
    return () => unsubscribe?.();
  }, []);

  // Save config whenever it changes
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const handleModeChange = (mode: PopoutMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  };

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleSwitchVersion = () => {
    localStorage.setItem("artemis-popout-version", "v2");
    window.location.reload();
  };

  const handleChangeHero = (newStatKey: string) => {
    setConfig((prev) => ({ ...prev, hero: newStatKey }));
  };

  const handleChangePrimary = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newPrimary = [...prev.primary];
      newPrimary[index] = newStatKey;
      return { ...prev, primary: newPrimary };
    });
  };

  const handleChangeSecondary = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newSecondary = [...prev.secondary];
      newSecondary[index] = newStatKey;
      return { ...prev, secondary: newSecondary };
    });
  };

  const handleChangeSkills = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newSkills = [...prev.skills];
      newSkills[index] = newStatKey;
      return { ...prev, skills: newSkills };
    });
  };

  const statData: StatData = stats;

  // Calculate kills per hour
  const killsPerHour =
    stats.duration > 0 ? (stats.kills / stats.duration) * 3600 : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.modeTabs}>
          <button
            onClick={() => handleModeChange("stats")}
            style={{
              ...styles.modeTab,
              backgroundColor:
                config.mode === "stats" ? colors.bgCard : "transparent",
              color:
                config.mode === "stats" ? colors.textPrimary : colors.textMuted,
            }}
          >
            <Activity size={10} />
          </button>
        </div>
        {config.mode === "stats" && (
          <div style={styles.loadoutDropdownContainer}>
            <LoadoutDropdown
              loadouts={loadouts}
              activeLoadout={activeLoadout}
              onSelect={setActiveLoadout}
              compact
            />
          </div>
        )}
        <div style={styles.dragHandle}>
          <GripHorizontal size={14} style={{ color: colors.textMuted }} />
        </div>
        {config.mode === "stats" && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              ...styles.settingsButton,
              backgroundColor: showSettings ? colors.bgCard : "transparent",
            }}
          >
            <Settings size={12} />
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {config.mode === "stats" && showSettings && (
        <div style={styles.settingsPanel}>
          <div style={styles.settingsRow}>
            <button onClick={handleResetConfig} style={styles.resetButton}>
              <RotateCcw size={12} />
              Reset to Defaults
            </button>
            <button onClick={handleSwitchVersion} style={styles.versionButton}>
              Switch to V2
            </button>
          </div>
          <div style={{ ...styles.settingsRow, marginTop: spacing.xs }}>
            <span style={{ ...styles.settingsLabel, fontSize: "9px" }}>
              Click stat labels to change
            </span>
          </div>
        </div>
      )}

      {/* Always render AsteroidPanel so it keeps listening for events */}
      <div
        style={{
          display: config.mode === "asteroid" ? "block" : "none",
          flex: 1,
        }}
      >
        <AsteroidPanel />
      </div>

      {/* Stats Mode */}
      {config.mode === "stats" && (
        <div style={styles.statsContent}>
          {/* Hero Stat */}
          <HeroStat
            statKey={config.hero}
            data={statData}
            onChange={handleChangeHero}
            settingsMode={showSettings}
          />

          {/* Primary Stats Row */}
          <div style={styles.statsRow}>
            {config.primary.map((statKey, index) => (
              <StatTile
                key={`primary-${index}`}
                statKey={statKey}
                data={statData}
                onChange={(newKey) => handleChangePrimary(index, newKey)}
                settingsMode={showSettings}
                size="medium"
              />
            ))}
          </div>

          {/* Secondary Stats Row */}
          <div style={styles.statsRow}>
            {config.secondary.map((statKey, index) => (
              <StatTile
                key={`secondary-${index}`}
                statKey={statKey}
                data={statData}
                onChange={(newKey) => handleChangeSecondary(index, newKey)}
                settingsMode={showSettings}
                size="small"
              />
            ))}
          </div>

          {/* Skills Row */}
          <div style={styles.skillsRow}>
            {config.skills.map((statKey, index) => {
              const stat = STAT_MAP.get(statKey);
              if (!stat) return null;
              const value = stat.getValue(statData);
              return (
                <div key={`skill-${index}`} style={styles.skillItem}>
                  {showSettings ? (
                    <StatSelector
                      currentKey={statKey}
                      onSelect={(newKey) => handleChangeSkills(index, newKey)}
                    />
                  ) : (
                    <>
                      <span style={styles.skillLabel}>{stat.label}:</span>
                      <span style={styles.skillValue}>
                        {value.value}
                        {value.unit && ` ${value.unit}`}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <div style={styles.footerItem}>
              <span style={styles.footerLabel}>Duration:</span>
              <span style={styles.footerValue}>
                {formatDuration(stats.duration)}
              </span>
            </div>
            <div style={styles.footerSeparator} />
            <div style={styles.footerItem}>
              <span style={styles.footerValue}>
                {killsPerHour.toFixed(0)} kills/hr
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hero Stat Component
function HeroStat({
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
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;

  const value = stat.getValue(data);
  const Icon = stat.icon;

  return (
    <div style={styles.heroStat}>
      <Icon
        size={40}
        style={{
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.1,
          color: colors.textMuted,
        }}
      />
      {settingsMode ? (
        <div style={{ width: "100%" }}>
          <StatSelector currentKey={statKey} onSelect={onChange} />
        </div>
      ) : (
        <>
          <div style={styles.heroLabel}>{stat.label}</div>
          <div style={{ ...styles.heroValue, color: value.color }}>
            {value.value}
            {value.unit && <span style={styles.heroUnit}> {value.unit}</span>}
          </div>
        </>
      )}
    </div>
  );
}

// Stat Tile Component
function StatTile({
  statKey,
  data,
  onChange,
  settingsMode,
  size,
}: {
  statKey: string;
  data: StatData;
  onChange: (newKey: string) => void;
  settingsMode: boolean;
  size: "medium" | "small";
}) {
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;

  const value = stat.getValue(data);
  const Icon = stat.icon;

  const isMedium = size === "medium";

  return (
    <div style={isMedium ? styles.statTileMedium : styles.statTileSmall}>
      <Icon
        size={isMedium ? 24 : 20}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.08,
          color: colors.textMuted,
        }}
      />
      {settingsMode ? (
        <StatSelector currentKey={statKey} onSelect={onChange} />
      ) : (
        <>
          <div style={isMedium ? styles.tileLabel : styles.tileLabelSmall}>
            {stat.label}
          </div>
          <div style={isMedium ? styles.tileValue : styles.tileValueSmall}>
            {value.value}
            {value.unit && <span style={styles.tileUnit}> {value.unit}</span>}
          </div>
        </>
      )}
    </div>
  );
}

// Stat Selector Component (for settings mode)
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
          <div
            style={styles.selectorOverlay}
            onClick={() => setIsOpen(false)}
          />
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
                    stat.key === currentKey
                      ? "hsl(217 91% 68% / 0.15)"
                      : "transparent",
                }}
              >
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
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    height: 20,
    backgroundColor: colors.bgPanel,
    cursor: "grab",
    // @ts-expect-error Electron specific
    WebkitAppRegion: "drag",
  },
  modeTabs: {
    position: "absolute",
    left: spacing.xs,
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
    height: 16,
    border: "none",
    borderRadius: radius.sm,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  loadoutDropdownContainer: {
    position: "absolute",
    left: 32,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  dragHandle: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 20,
    pointerEvents: "none",
  },
  sessionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 20,
    border: "none",
    borderRadius: radius.xs,
    backgroundColor: "transparent",
    color: colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  settingsButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 20,
    border: "none",
    color: colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  settingsPanel: {
    padding: spacing.sm,
    backgroundColor: colors.bgPanel,
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  },
  settingsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  settingsLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  resetButton: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    backgroundColor: "transparent",
    color: colors.textMuted,
    fontSize: 10,
    cursor: "pointer",
  },
  versionButton: {
    padding: `${spacing.xs}px ${spacing.sm}px`,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    color: "#06b6d4",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: "auto",
  },
  statsContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  heroStat: {
    position: "relative",
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: spacing.md,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    overflow: "hidden",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: spacing.xs,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "monospace",
    lineHeight: 1,
  },
  heroUnit: {
    fontSize: 16,
    fontWeight: 600,
    opacity: 0.7,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: spacing.xs,
  },
  statTileMedium: {
    position: "relative",
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: spacing.sm,
    display: "flex",
    flexDirection: "column",
    minHeight: 50,
    overflow: "hidden",
  },
  statTileSmall: {
    position: "relative",
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: spacing.xs,
    display: "flex",
    flexDirection: "column",
    minHeight: 40,
    overflow: "hidden",
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
  },
  tileLabelSmall: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  tileValueSmall: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  tileUnit: {
    fontSize: "0.7em",
    fontWeight: 600,
    opacity: 0.7,
  },
  skillsRow: {
    display: "flex",
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  skillItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  skillLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textMuted,
  },
  skillValue: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    backgroundColor: colors.bgPanel,
    borderRadius: radius.sm,
    marginTop: "auto",
  },
  footerItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textMuted,
  },
  footerValue: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  footerSeparator: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  selectorButton: {
    width: "100%",
    padding: "6px 8px",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: radius.sm,
    color: colors.textPrimary,
    fontSize: 11,
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
    zIndex: 999,
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
    zIndex: 1000,
  },
  selectorOption: {
    width: "100%",
    padding: "6px 8px",
    border: "none",
    backgroundColor: "transparent",
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "background-color 0.1s ease",
  },
};

export default PopoutStats;
