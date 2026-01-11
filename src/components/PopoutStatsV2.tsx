/**
 * ARTEMIS PopoutStats V2 - Complete Rebuild
 * Clean, modern design using proper UI components and design tokens
 */

import React, { useEffect, useState } from "react";
import {
  GripHorizontal,
  Settings,
  RotateCcw,
  X,
  Clock,
  Edit2,
} from "lucide-react";
import type { LiveStats } from "../types/electron";
import { colors, spacing, radius, typography } from "./ui";
import { STAT_MAP, type StatData } from "./popout/stat-definitions";
import { LoadoutDropdown } from "./LoadoutManager";
import { useLoadouts } from "../hooks/useLoadouts";

// Storage keys
const CONFIG_KEY = "artemis-popout-v2-config";

type PopoutMode = "stats" | "asteroid";

interface PopoutConfigV2 {
  mode: PopoutMode;
  stats: string[]; // configurable stat tiles
  collapsed: boolean; // collapsed minimal mode
}

const DEFAULT_CONFIG: PopoutConfigV2 = {
  mode: "stats",
  stats: [
    "netProfit",
    "returnRate",
    "kills",
    "hitRate",
    "lootValue",
    "totalSpend",
  ],
  collapsed: false,
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
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
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
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [sessionActive, setSessionActive] = useState(false);
  console.log(sessionActive);

  // Loadout management
  const {
    loadouts,
    activeLoadout,
    setActive: setActiveLoadout,
  } = useLoadouts();

  // Track window size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for stats updates
  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onStatsUpdate(
      (data: LiveStats) => {
        setStats(data);
      }
    );
    window.electron?.popout?.requestStats();
    return () => unsubscribe?.();
  }, []);

  // Listen for session status updates
  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onSessionStatusUpdate(
      (isActive: boolean) => {
        setSessionActive(isActive);
      }
    );
    // Request initial session status
    window.electron?.popout?.requestSessionStatus();
    return () => unsubscribe?.();
  }, []);

  // Save config on change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const statData: StatData = stats;

  const handleChangeStat = (index: number, newStatKey: string) => {
    setConfig((prev) => {
      const newStats = [...prev.stats];
      newStats[index] = newStatKey;
      return { ...prev, stats: newStats };
    });
  };

  const handleAddStat = () => {
    setConfig((prev) => ({
      ...prev,
      stats: [...prev.stats, "kills"], // Default to kills when adding
    }));
  };

  const handleRemoveStat = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index),
    }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleClose = () => {
    window.electron?.popout?.close();
  };

  const handleToggleCollapsed = () => {
    setConfig((prev) => ({ ...prev, collapsed: !prev.collapsed }));
  };

  const handleStartSession = () => {
    window.electron?.popout?.startSession();
  };

  const handleStopSession = () => {
    window.electron?.popout?.stopSession();
  };

  // Calculate responsive columns based on window width
  const getColumns = () => {
    if (windowWidth < 220) return 1;
    if (windowWidth < 380) return 2;
    return 3;
  };

  const columns = getColumns();

  const MIN_CONTENT_HEIGHT = 120;
  const isMinified = config.collapsed || windowHeight < MIN_CONTENT_HEIGHT;

  // When minified, remove page margins/padding and force a small document height so
  // the native window can shrink without showing any blank area around the bar.
  useEffect(() => {
    try {
      const html = document.documentElement as any;
      const body = document.body as any;

      if (isMinified) {
        // Save previous styles so we can restore them
        html.__prevStyle = {
          height: html.style.height,
          margin: html.style.margin,
          padding: html.style.padding,
          overflow: html.style.overflow,
        };
        body.__prevStyle = {
          height: body.style.height,
          margin: body.style.margin,
          padding: body.style.padding,
          overflow: body.style.overflow,
        };

        html.style.height = "20px";
        html.style.margin = "0";
        html.style.padding = "0";
        html.style.overflow = "hidden";

        body.style.height = "20px";
        body.style.margin = "0";
        body.style.padding = "0";
        body.style.overflow = "hidden";
      } else {
        // Restore previous styles if present
        if (html.__prevStyle) {
          html.style.height = html.__prevStyle.height || "";
          html.style.margin = html.__prevStyle.margin || "";
          html.style.padding = html.__prevStyle.padding || "";
          html.style.overflow = html.__prevStyle.overflow || "";
          delete html.__prevStyle;
        }
        if (body.__prevStyle) {
          body.style.height = body.__prevStyle.height || "";
          body.style.margin = body.__prevStyle.margin || "";
          body.style.padding = body.__prevStyle.padding || "";
          body.style.overflow = body.__prevStyle.overflow || "";
          delete body.__prevStyle;
        }
      }
    } catch (e) {
      // ignore DOM errors
    }
  }, [isMinified]);

  // Collapsed/minified minimal mode (automatic on small heights)
  if (isMinified) {
    return (
      <div style={styles.collapsedContainer}>
        {/* Collapsed Header Bar */}
        <div style={styles.collapsedBar}>
          {/* Minimal Stats Display */}
          <div style={styles.collapsedStats}>
            {/* User-configured stats in order */}
            {config.stats.slice(0, 4).map((statKey) => {
              const stat = STAT_MAP.get(statKey);
              if (!stat) return null;
              const value = stat.getValue(statData);
              return (
                <div key={statKey} style={styles.collapsedStat}>
                  <span style={styles.collapsedLabel}>{stat.label}:</span>
                  <span
                    style={{ ...styles.collapsedValue, color: value.color }}
                  >
                    {value.value}
                    {value.unit && ` ${value.unit}`}
                  </span>
                </div>
              );
            })}

            {/* Duration */}
            <div style={styles.collapsedStat}>
              <Clock size={10} style={{ color: colors.textMuted }} />
              <span style={styles.collapsedValue}>
                {formatDuration(stats.duration)}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            style={styles.collapseButton}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  // Expanded full mode
  return (
    <div style={styles.container}>
      {/* Draggable Header */}
      <div style={styles.header}>
        {/* Mode Tabs (hidden) */}
        <div style={styles.modeTabs} />

        {/* Duration Display */}
        {config.mode === "stats" && (
          <div style={styles.durationDisplay}>
            <Clock size={10} style={{ color: colors.textMuted }} />
            <span style={styles.durationText}>
              {formatDuration(stats.duration)}
            </span>
          </div>
        )}

        {/* Drag Handle */}
        <div style={styles.dragHandle}>
          <GripHorizontal size={14} style={{ color: colors.textMuted }} />
        </div>

        {/* Header Actions */}
        <div style={styles.headerActions}>
          {config.mode === "stats" && (
            <>
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
            </>
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

          <div style={styles.settingsDivider} />
          <div style={styles.settingsHint}>
            Click edit buttons on cards to change stats
          </div>
        </div>
      )}

      {/* Stats Mode */}
      {config.mode === "stats" && (
        <div style={styles.content}>
          {/* Loadout Dropdown and Session Controls */}
          <div style={styles.loadoutRow}>
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <div style={{ width: "100%" }}>
                <LoadoutDropdown
                  loadouts={loadouts}
                  activeLoadout={activeLoadout}
                  onSelect={setActiveLoadout}
                  compact
                />
              </div>
            </div>

            {/* Session Controls */}
            {/* <div style={styles.sessionControls}>
              {sessionActive ? (
                <button
                  onClick={handleStopSession}
                  style={styles.sessionButton}
                  title="Stop Session"
                >
                  <Square size={12} />
                </button>
              ) : (
                <button
                  onClick={handleStartSession}
                  style={styles.sessionButton}
                  title="Start Session"
                >
                  <Play size={12} />
                </button>
              )}
            </div> */}
          </div>

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
                onRemove={() => handleRemoveStat(index)}
                settingsMode={showSettings}
                canRemove={config.stats.length > 1}
              />
            ))}
          </div>

          {/* Add Card Button */}
          {showSettings && (
            <button onClick={handleAddStat} style={styles.addCardButton}>
              + Add Stat Card
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  statKey,
  data,
  onChange,
  onRemove,
  settingsMode,
  canRemove,
}: {
  statKey: string;
  data: StatData;
  onChange: (newKey: string) => void;
  onRemove: () => void;
  settingsMode: boolean;
  canRemove: boolean;
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

      {/* Card Actions (only in settings mode) */}
      {settingsMode && (
        <div style={styles.cardActions}>
          <button
            onClick={() => setShowSelector(true)}
            style={styles.editButtonSmall}
            title="Change stat"
          >
            <Edit2 size={10} />
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              style={styles.removeButton}
              title="Remove card"
            >
              <X size={10} />
            </button>
          )}
        </div>
      )}

      {showSelector && (
        <StatSelector
          currentKey={statKey}
          onSelect={(newKey) => {
            onChange(newKey);
            setShowSelector(false);
          }}
          open={true}
          modal
          onClose={() => setShowSelector(false)}
        />
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
  open,
  modal,
  onClose,
}: {
  currentKey: string;
  onSelect: (key: string) => void;
  open?: boolean;
  modal?: boolean;
  onClose?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentStat = STAT_MAP.get(currentKey);
  const controlled = open !== undefined;
  const visible = controlled ? !!open : isOpen;

  const statsList = Array.from(STAT_MAP.values());
  const groups = statsList.reduce((acc: any, stat) => {
    const last = acc[acc.length - 1];
    if (!last || last.category !== stat.category)
      acc.push({ category: stat.category, items: [stat] });
    else last.items.push(stat);
    return acc;
  }, [] as Array<{ category: string; items: any[] }>);

  // Modal mode: render a centered modal with overlay
  if (modal) {
    if (!visible) return null;
    return (
      <>
        <div
          style={styles.selectorOverlay}
          onClick={() => (onClose ? onClose() : setIsOpen(false))}
        />
        <div style={styles.selectorModal}>
          <div style={styles.selectorDropdown}>
            {groups.map((group: { category: string; items: any[] }) => (
              <div key={group.category}>
                <div style={styles.selectorGroupHeader}>{group.category}</div>
                {group.items.map((stat: any) => (
                  <button
                    key={stat.key}
                    onClick={() => {
                      onSelect(stat.key);
                      if (onClose) onClose();
                      else setIsOpen(false);
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
                <div style={styles.selectorGroupDivider} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Default dropdown behavior (unchanged)
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
            {groups.map((group: { category: string; items: any[] }) => (
              <div key={group.category}>
                <div style={styles.selectorGroupHeader}>{group.category}</div>
                {group.items.map((stat: any) => (
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
                <div style={styles.selectorGroupDivider} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: colors.bgBase,
    display: "flex",
    flexDirection: "column",
    fontFamily: typography.sans,
  },
  collapsedContainer: {
    minHeight: 24,
    background: colors.bgBase,
    display: "flex",
    flexDirection: "column",
    fontFamily: typography.sans,
  },
  collapsedBar: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    height: 24,
    backgroundColor: colors.bgPanel,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    padding: `0 ${spacing.xs}px`,
    cursor: "grab",
    // @ts-expect-error Electron specific
    WebkitAppRegion: "drag",
  },
  collapseButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    border: "none",
    borderRadius: radius.xs,
    backgroundColor: "transparent",
    color: colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
    flexShrink: 0,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  collapsedStats: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    overflow: "hidden",
    fontSize: 11,
    fontFamily: typography.mono,
  },
  collapsedStat: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    whiteSpace: "nowrap",
  },
  collapsedLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textMuted,
  },
  collapsedValue: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.textPrimary,
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
    marginRight: "auto",
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
    width: "100%",
  },
  sessionControls: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  sessionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  cardActions: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    display: "flex",
    gap: spacing.xs,
    zIndex: 2,
  },
  editButtonSmall: {
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
    fontSize: 9,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  removeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xs,
    backgroundColor: colors.bgPanel,
    color: colors.danger,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: 9,
    // @ts-expect-error Electron specific
    WebkitAppRegion: "no-drag",
  },
  addCardButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: `${spacing.sm}px ${spacing.md}px`,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.sm,
    backgroundColor: "transparent",
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    width: "100%",
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
  selectorModal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10001,
    width: "90%",
    maxWidth: 420,
    padding: spacing.xs,
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
    display: "none",
  },
  selectorGroupHeader: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.textSecondary,
    textTransform: "uppercase",
    padding: `${spacing.xs}px ${spacing.sm}px`,
  },
  selectorGroupDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    margin: `${spacing.xs}px 0`,
  },
};

export default PopoutStatsV2;
