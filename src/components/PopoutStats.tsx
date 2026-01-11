/**
 * PopoutStats - Configurable overlay with customizable stat tiles
 * Users can choose which 4 stats to display plus see mini trend charts
 * Expands to full dashboard when window is resized larger
 * Includes Asteroid Tracker mode toggle
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  GripHorizontal,
  Settings,
  RotateCcw,
  Plus,
  Minus,
  Clock,
  Activity,
} from "lucide-react";
import type { LiveStats } from "../types/electron";
import { colors, spacing, radius } from "./ui";
import { ConfigurableTile } from "./popout/ConfigurableTile";
import {
  DEFAULT_TILE_CONFIG,
  DEFAULT_EXPANDED_HERO,
  DEFAULT_EXPANDED_GRID,
  type StatData,
} from "./popout/stat-definitions";
import { ExpandedDashboard } from "./popout/ExpandedDashboard";
import { AsteroidPanel } from "./popout/AsteroidPanel";
import { LoadoutDropdown } from "./LoadoutManager";
import { useLoadouts } from "../hooks/useLoadouts";

// Storage key for persisted config
const STORAGE_KEY = "artemis-popout-config";

// Threshold for expanded view (width x height)
const EXPANDED_WIDTH_THRESHOLD = 600;
const EXPANDED_HEIGHT_THRESHOLD = 400;

type PopoutMode = "stats" | "asteroid";

interface PopoutConfig {
  tiles: string[]; // stat keys for each tile (compact view)
  showCharts: boolean;
  mode: PopoutMode;
  expandedHero: string[]; // stat keys for hero row (expanded view)
  expandedGrid: string[]; // stat keys for stats grid (expanded view)
  showExpandedCharts: boolean; // show/hide charts in expanded view
}

const DEFAULT_CONFIG: PopoutConfig = {
  tiles: DEFAULT_TILE_CONFIG,
  showCharts: true,
  mode: "stats",
  expandedHero: DEFAULT_EXPANDED_HERO,
  expandedGrid: DEFAULT_EXPANDED_GRID,
  showExpandedCharts: true,
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Loadout state management
  const { loadouts, activeLoadout, setActive: setActiveLoadout } = useLoadouts();

  // Track window size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine if we should show expanded dashboard
  const isExpanded =
    windowWidth >= EXPANDED_WIDTH_THRESHOLD &&
    windowHeight >= EXPANDED_HEIGHT_THRESHOLD;

  // Calculate columns based on window width
  const getColumns = () => {
    if (windowWidth < 200) return 1;
    if (windowWidth < 350) return 2;
    if (windowWidth < 500) return 3;
    return 4;
  };

  const columns = getColumns();

  // Historical data for sparklines (last 60 samples)
  const historyRef = useRef<Record<string, number[]>>({});

  // Update history on each stats update - track ALL stats for full session
  const updateHistory = useCallback((newStats: StatData) => {
    const history = historyRef.current;

    // Track all stats for charts - no limit, keep full session
    Object.keys(newStats).forEach((key) => {
      if (!history[key]) history[key] = [];
      const value = newStats[key as keyof StatData] as number;
      if (typeof value === "number") {
        history[key].push(value);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onStatsUpdate(
      (data: LiveStats) => {
        setStats(data);
        updateHistory(data as StatData);
      }
    );
    window.electron?.popout?.requestStats();
    return () => {
      unsubscribe?.();
    };
  }, [updateHistory]);

  // Save config whenever it changes
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const handleChangeTileStat = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newTiles = [...prev.tiles];
      newTiles[index] = newStatKey;
      return { ...prev, tiles: newTiles };
    });
  };

  const handleAddTile = () => {
    if (config.tiles.length < 8) {
      setConfig((prev) => ({
        ...prev,
        tiles: [...prev.tiles, "kills"],
      }));
    }
  };

  const handleRemoveTile = () => {
    if (config.tiles.length > 1) {
      setConfig((prev) => ({
        ...prev,
        tiles: prev.tiles.slice(0, -1),
      }));
    }
  };

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleToggleCharts = () => {
    setConfig((prev) => ({ ...prev, showCharts: !prev.showCharts }));
  };

  const statData: StatData = stats;

  // Determine if tiles should be compact based on size
  const isCompact = columns >= 3 || config.tiles.length > 4;

  // Format duration as HH:MM:SS or MM:SS
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleModeChange = (mode: PopoutMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  };

  const handleChangeExpandedHeroStat = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newHero = [...prev.expandedHero];
      newHero[index] = newStatKey;
      return { ...prev, expandedHero: newHero };
    });
  };

  const handleChangeExpandedGridStat = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newGrid = [...prev.expandedGrid];
      newGrid[index] = newStatKey;
      return { ...prev, expandedGrid: newGrid };
    });
  };

  const handleToggleExpandedCharts = () => {
    setConfig((prev) => ({
      ...prev,
      showExpandedCharts: !prev.showExpandedCharts,
    }));
  };

  // Expanded dashboard view
  if (isExpanded) {
    return (
      <div style={styles.container}>
        {/* Drag Handle + Settings */}
        <div style={styles.header}>
          <div style={styles.modeTabs}>
            <button
              onClick={() => handleModeChange("stats")}
              style={{
                ...styles.modeTab,
                backgroundColor:
                  config.mode === "stats" ? colors.bgCard : "transparent",
                color:
                  config.mode === "stats"
                    ? colors.textPrimary
                    : colors.textMuted,
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
          {config.mode === "stats" && (
            <div style={styles.duration}>
              <Clock size={10} />
              <span>{formatDuration(stats.duration)}</span>
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

        {/* Settings Panel - expanded view */}
        {config.mode === "stats" && showSettings && (
          <div style={styles.settingsPanel}>
            <div style={styles.settingsRow}>
              <span style={styles.settingsLabel}>Charts</span>
              <button
                onClick={handleToggleExpandedCharts}
                style={styles.toggleButton}
              >
                {config.showExpandedCharts ? "On" : "Off"}
              </button>
            </div>
            <div style={styles.settingsRow}>
              <button
                onClick={handleResetConfig}
                style={styles.resetButton}
              >
                <RotateCcw size={12} />
                Reset
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
        {config.mode !== "asteroid" && (
          <ExpandedDashboard
            stats={stats}
            history={historyRef.current}
            formatDuration={formatDuration}
            heroStats={config.expandedHero}
            gridStats={config.expandedGrid}
            showCharts={config.showExpandedCharts}
            onChangeHeroStat={handleChangeExpandedHeroStat}
            onChangeGridStat={handleChangeExpandedGridStat}
            settingsMode={showSettings}
          />
        )}
      </div>
    );
  }

  // Compact tile view
  return (
    <div style={styles.container}>
      {/* Drag Handle + Settings + Mode Toggle */}
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
        {config.mode === "stats" && (
          <div style={styles.duration}>
            <Clock size={10} />
            <span>{formatDuration(stats.duration)}</span>
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

      {/* Settings Panel - only in stats mode */}
      {config.mode === "stats" && showSettings && (
        <div style={styles.settingsPanel}>
          <div style={styles.settingsRow}>
            <span style={styles.settingsLabel}>Tiles</span>
            <div style={styles.settingsActions}>
              <button
                onClick={handleRemoveTile}
                style={styles.iconButton}
                disabled={config.tiles.length <= 1}
              >
                <Minus size={12} />
              </button>
              <span style={styles.tileCount}>{config.tiles.length}</span>
              <button
                onClick={handleAddTile}
                style={styles.iconButton}
                disabled={config.tiles.length >= 8}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div style={styles.settingsRow}>
            <span style={styles.settingsLabel}>Charts</span>
            <button onClick={handleToggleCharts} style={styles.toggleButton}>
              {config.showCharts ? "On" : "Off"}
            </button>
          </div>
          <div style={styles.settingsRow}>
            <button onClick={handleResetConfig} style={styles.resetButton}>
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Content based on mode */}
      {/* Always render AsteroidPanel so it keeps listening for events */}
      <div style={{ display: config.mode === "asteroid" ? "block" : "none" }}>
        <AsteroidPanel />
      </div>
      {config.mode !== "asteroid" && (
        /* Tiles Grid */
        <div
          style={{
            ...styles.tilesGrid,
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
          }}
        >
          {config.tiles.map((statKey, index) => (
            <ConfigurableTile
              key={`${index}-${statKey}`}
              statKey={statKey}
              data={statData}
              history={historyRef.current[statKey] || []}
              onChangeStat={(newKey) => handleChangeTileStat(index, newKey)}
              showChart={config.showCharts}
              compact={isCompact}
              fullSessionChart
            />
          ))}
        </div>
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
  title: {
    position: "absolute",
    left: spacing.sm,
    fontSize: 10,
    fontWeight: 700,
    color: colors.textMuted,
    letterSpacing: "0.1em",
    pointerEvents: "none",
  },
  duration: {
    position: "absolute",
    left: 192,
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    fontFamily: "monospace",
    color: colors.textMuted,
    pointerEvents: "none",
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
  settingsActions: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    color: colors.textMuted,
    cursor: "pointer",
  },
  tileCount: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textPrimary,
    minWidth: 16,
    textAlign: "center",
  },
  toggleButton: {
    padding: `${spacing.xs}px ${spacing.sm}px`,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
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
    marginLeft: "auto",
  },
  tilesGrid: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.sm,
    flex: 1,
    alignContent: "start",
  },
};

export default PopoutStats;
