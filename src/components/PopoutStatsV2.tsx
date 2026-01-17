/**
 * ARTEMIS PopoutStats V2 - Clean Multi-Layout Design
 * Supports: Mini Bar, Horizontal Bar, Vertical Bar, Grid modes
 * Features: Drag & drop, stat selection, markup toggle, loadout selector
 */

import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  GripHorizontal,
  GripVertical,
  Settings,
  RotateCcw,
  X,
  Clock,
  Edit2,
  Columns,
  Rows,
  Minimize2,
  Grid3X3,
  ChevronDown,
  Crosshair,
  Check,
  Shield,
  Heart,
  Wrench,
  Play,
  Pause,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LiveStats } from "../types/electron";
import { colors, radius, typography } from "./ui";
import { STAT_MAP, type StatData } from "./popout/stat-definitions";
import { useLoadouts } from "../hooks/useLoadouts";
import type { Loadout } from "../core/loadout";

// ─────────────────────────────────────────────────────────────────────────────
// Config & Storage
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_KEY = "artemis-popout-v3-config";
const CUSTOM_LAYOUT_KEY = "artemis-popout-v3-custom";

type LayoutMode = "mini" | "horizontal" | "vertical" | "grid";

interface PopoutConfig {
  stats: string[];
  layout: LayoutMode;
  showMarkup: boolean;
  applyExpenses: boolean;
  fontSize: number; // Base font size multiplier (1 = default)
}

const DEFAULT_CONFIG: PopoutConfig = {
  stats: [
    "netProfit",
    "returnRate",
    "kills",
    "hitRate",
    "lootValue",
    "totalSpend",
  ],
  layout: "grid",
  showMarkup: true,
  applyExpenses: true,
  fontSize: 1.3,
};

const PRESETS = {
  all: [
    // Combat
    "kills",
    "shots",
    "hits",
    "hitRate",
    "criticals",
    "critRate",
    "deaths",
    "kdr",
    "damageDealt",
    "damageTaken",
    "damageReduced",
    "deflects",
    // Economy
    "netProfit",
    "lootValue",
    "returnRate",
    "weaponCost",
    "totalCost",
    // Skills
    "skillGains",
    "skillEvents",
    "avgSkillPerEvent",
    "skillsPerKill",
    "skillsPerPed",
    // Hourly
    "killsPerHour",
    "lootPerHour",
    "skillPerHour",
    "profitPerHour",
    "costPerHour",
    "dmgPerHour",
    // Efficiency
    "avgLootPerKill",
    "costPerKill",
    "dps",
    "dpp",
    "shotsPerKill",
    "avgDmgPerHit",
    "killsPerPed",
    // Time
    "duration",
    "totalEvents",
  ],
  economy: [
    "netProfit",
    "lootValue",
    "totalSpend",
    "returnRate",
    "decay",
    "totalCost",
  ],
  efficiency: [
    "avgLootPerKill",
    "costPerKill",
    "hitRate",
    "critRate",
    "dps",
    "dpp",
  ],
  combat: ["kills", "deaths", "kdr", "hitRate", "critRate", "damageDealt"],
  skills: [
    "skillGains",
    "skillEvents",
    "avgSkillPerEvent",
    "skillsPerKill",
    "skillsPerPed",
    "skillPerHour",
  ],
  hourly: [
    "killsPerHour",
    "lootPerHour",
    "profitPerHour",
    "costPerHour",
    "skillPerHour",
    "dmgPerHour",
  ],
  time: ["duration", "totalEvents", "kills", "shots", "hits", "deaths"],
};

function loadConfig(): PopoutConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: PopoutConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

function saveCustomLayout(stats: string[]) {
  try {
    localStorage.setItem(CUSTOM_LAYOUT_KEY, JSON.stringify(stats));
  } catch {}
}

function loadCustomLayout(): string[] | null {
  try {
    const stored = localStorage.getItem(CUSTOM_LAYOUT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

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
    weaponCost: 0,
    armorCost: 0,
    fapCost: 0,
    miscCost: 0,
    totalCost: 0,
    returnRate: 0,
    damageDealt: 0,
    damageTaken: 0,
    damageReduced: 0,
    deflects: 0,
    decay: 0,
    armorDecay: 0,
    fapDecay: 0,
    repairBill: 0,
    skillGains: 0,
    skillEvents: 0,
    duration: 0,
  });

  const [config, setConfig] = useState<PopoutConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddStatModal, setShowAddStatModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [previousSize, setPreviousSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Local expense state (updated from stats and user input)
  const [localExpenses, setLocalExpenses] = useState({
    armorCost: 0,
    fapCost: 0,
    miscCost: 0,
  });

  // Session state (synced from main window)
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [sessionName, setSessionName] = useState("");

  const {
    loadouts,
    activeLoadout,
    setActive: setActiveLoadout,
  } = useLoadouts();

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Track window size
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle settings with window resize
  const toggleSettings = () => {
    if (!showSettings) {
      // Opening settings - save current size and expand
      setPreviousSize({ width: window.innerWidth, height: window.innerHeight });
      window.electron?.popout?.resize(550, 550);
    } else {
      // Closing settings - restore previous size
      if (previousSize) {
        window.electron?.popout?.resize(
          previousSize.width,
          previousSize.height
        );
        setPreviousSize(null);
      }
    }
    setShowSettings(!showSettings);
  };

  // Listen for stats
  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onStatsUpdate(
      (data: LiveStats) => {
        setStats(data);
        // Sync expense values from main window
        setLocalExpenses({
          armorCost: data.manualArmorCost ?? 0,
          fapCost: data.manualFapCost ?? 0,
          miscCost: data.manualMiscCost ?? 0,
        });
        // Sync session state from main window
        setSessionActive(data.sessionActive ?? false);
        setSessionPaused(data.sessionPaused ?? false);
        setSessionName(data.sessionName ?? "");
      }
    );
    window.electron?.popout?.requestStats();
    return () => unsubscribe?.();
  }, []);

  // Session control handlers (pause/resume only - no start/stop from popout)
  const handlePauseSession = useCallback(() => {
    window.electron?.popout?.controlSession("pause");
  }, []);

  const handleResumeSession = useCallback(() => {
    window.electron?.popout?.controlSession("resume");
  }, []);

  // Handle expense change - update local state and notify main window
  const handleExpenseChange = useCallback(
    (type: "armor" | "fap" | "misc", value: number) => {
      const newExpenses = {
        ...localExpenses,
        [`${type}Cost`]: value,
      };
      setLocalExpenses(newExpenses);

      // Send update to main window
      window.electron?.popout?.updateExpenses({
        armorCost: newExpenses.armorCost,
        fapCost: newExpenses.fapCost,
        miscCost: newExpenses.miscCost,
      });
    },
    [localExpenses]
  );

  // Persist config
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Apply or remove manual expenses based on applyExpenses toggle
  const adjustedStats = { ...stats };
  if (
    !config.applyExpenses &&
    (localExpenses.armorCost || localExpenses.fapCost || localExpenses.miscCost)
  ) {
    const totalManualExpenses =
      localExpenses.armorCost + localExpenses.fapCost + localExpenses.miscCost;
    // Add back the expenses to profit/netProfit since they were subtracted in session.ts
    adjustedStats.profit = stats.profit + totalManualExpenses;
    adjustedStats.netProfit = stats.netProfit + totalManualExpenses;
    adjustedStats.totalCost = (stats.totalCost || 0) - totalManualExpenses;
    // Recalculate return rate without manual expenses
    adjustedStats.returnRate =
      adjustedStats.totalCost > 0
        ? (stats.lootValue / adjustedStats.totalCost) * 100
        : 0;
    // Also adjust markup versions if they exist
    if (stats.netProfitWithMarkup !== undefined) {
      adjustedStats.netProfitWithMarkup =
        stats.netProfitWithMarkup + totalManualExpenses;
    }
    if (
      stats.returnRateWithMarkup !== undefined &&
      adjustedStats.totalCost > 0
    ) {
      adjustedStats.returnRateWithMarkup =
        ((stats.lootValueWithMarkup || stats.lootValue) /
          adjustedStats.totalCost) *
        100;
    }
  }

  const statData: StatData = {
    ...adjustedStats,
    showMarkup: config.showMarkup,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleDragStart = (e: DragStartEvent) =>
    setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setConfig((prev) => {
        const oldIdx = prev.stats.indexOf(active.id as string);
        const newIdx = prev.stats.indexOf(over.id as string);
        return { ...prev, stats: arrayMove(prev.stats, oldIdx, newIdx) };
      });
    }
    setActiveId(null);
  };

  const handleChangeStat = (index: number, newKey: string) => {
    setConfig((prev) => {
      const newStats = [...prev.stats];
      newStats[index] = newKey;
      return { ...prev, stats: newStats };
    });
  };

  const handleAddStat = () => setShowAddStatModal(true);
  const handleAddStatSelect = (key: string) => {
    setConfig((prev) => ({ ...prev, stats: [...prev.stats, key] }));
    setShowAddStatModal(false);
  };
  const handleRemoveStat = (index: number) =>
    setConfig((prev) => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index),
    }));
  const handleReset = () => setConfig(DEFAULT_CONFIG);
  const handleLoadPreset = (preset: string[]) =>
    setConfig((prev) => ({ ...prev, stats: preset }));
  const handleSaveCustom = () => saveCustomLayout(config.stats);
  const handleLoadCustom = () => {
    const c = loadCustomLayout();
    if (c) setConfig((prev) => ({ ...prev, stats: c }));
  };
  const handleClose = () => window.electron?.popout?.close();
  const setLayout = (layout: LayoutMode) =>
    setConfig((prev) => ({ ...prev, layout }));
  const toggleMarkup = () =>
    setConfig((prev) => ({ ...prev, showMarkup: !prev.showMarkup }));
  const toggleExpenses = () =>
    setConfig((prev) => ({ ...prev, applyExpenses: !prev.applyExpenses }));

  // Responsive columns for grid
  const columns = windowWidth < 220 ? 1 : windowWidth < 380 ? 2 : 3;

  // ─────────────────────────────────────────────────────────────────────────
  // Mini Bar Layout
  // ─────────────────────────────────────────────────────────────────────────

  if (config.layout === "mini") {
    return (
      <div style={s.miniContainer}>
        <div style={s.miniBar}>
          {/* Stats */}
          <div style={s.miniStats}>
            {config.stats.map((key) => {
              const stat = STAT_MAP.get(key);
              if (!stat) return null;
              const val = stat.getValue(statData);
              return (
                <span key={key} style={s.miniStat}>
                  <span style={s.miniLabel}>{stat.label}</span>
                  <span style={{ ...s.miniValue, color: val.color }}>
                    {val.value}
                  </span>
                </span>
              );
            })}
          </div>

          {/* Actions */}
          <div style={s.miniActions}>
            <button
              onClick={toggleMarkup}
              style={{
                ...s.miniBtn,
                color: config.showMarkup ? colors.info : colors.textMuted,
              }}
              title="Toggle Markup"
            >
              MU
            </button>
            <button
              onClick={toggleExpenses}
              style={{
                ...s.miniBtn,
                color: config.applyExpenses ? colors.warning : colors.textMuted,
              }}
              title="Apply Additional Expenses"
            >
              AE
            </button>
            <button
              onClick={() => setLayout("horizontal")}
              style={s.miniBtn}
              title="Horizontal"
            >
              <Rows size={10} />
            </button>
            <button onClick={handleClose} style={s.miniBtn} title="Close">
              <X size={10} />
            </button>
          </div>
        </div>

        {/* Unified Footer */}
        <PopoutFooter
          duration={stats.duration}
          sessionActive={sessionActive}
          sessionPaused={sessionPaused}
          sessionName={sessionName}
          showSettings={showSettings}
          localExpenses={localExpenses}
          onPause={handlePauseSession}
          onResume={handleResumeSession}
          onExpenseChange={handleExpenseChange}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Horizontal Bar Layout
  // ─────────────────────────────────────────────────────────────────────────

  const fontScale = config.fontSize ?? 1;

  if (config.layout === "horizontal") {
    const sortingStrategy = horizontalListSortingStrategy;
    return (
      <div style={{ ...s.horzContainer, fontSize: `${11 * fontScale}px` }}>
        {/* Header */}
        <div style={s.horzHeader}>
          <div style={s.headerLeft}>
            <MiniLoadoutSelector
              loadouts={loadouts}
              activeLoadout={activeLoadout}
              onSelect={setActiveLoadout}
            />
          </div>
          <div style={s.dragHandle}>
            <GripHorizontal size={12} style={{ opacity: 0.3 }} />
          </div>
          <div style={s.headerActions}>
            <button
              onClick={toggleMarkup}
              style={{
                ...s.headerBtn,
                color: config.showMarkup ? colors.info : colors.textMuted,
                background: config.showMarkup
                  ? `${colors.info}20`
                  : "transparent",
              }}
              title="Toggle Markup"
            >
              MU
            </button>
            <button
              onClick={toggleExpenses}
              style={{
                ...s.headerBtn,
                color: config.applyExpenses ? colors.warning : colors.textMuted,
                background: config.applyExpenses
                  ? `${colors.warning}20`
                  : "transparent",
              }}
              title="Apply Additional Expenses"
            >
              AE
            </button>
            <button
              onClick={toggleSettings}
              style={{
                ...s.headerBtn,
                background: showSettings ? colors.bgCard : "transparent",
              }}
              title="Settings"
            >
              <Settings size={11} />
            </button>
            <LayoutSwitcher current={config.layout} onChange={setLayout} />
            <button onClick={handleClose} style={s.headerBtn} title="Close">
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            onPreset={handleLoadPreset}
            onSaveCustom={handleSaveCustom}
            onLoadCustom={handleLoadCustom}
            onReset={handleReset}
            fontSize={config.fontSize}
            onFontSizeChange={(size) =>
              setConfig((prev) => ({ ...prev, fontSize: size }))
            }
          />
        )}

        {/* Stats Row */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={config.stats} strategy={sortingStrategy}>
            <div style={s.horzStatsRow}>
              {config.stats.map((key, idx) => (
                <SortableStatChip
                  key={key}
                  id={key}
                  statKey={key}
                  data={statData}
                  onChange={(k) => handleChangeStat(idx, k)}
                  onRemove={() => handleRemoveStat(idx)}
                  settingsMode={showSettings}
                  canRemove={config.stats.length > 1}
                />
              ))}
              {showSettings && (
                <button onClick={handleAddStat} style={s.addChipBtn}>
                  +
                </button>
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId && <StatChipOverlay statKey={activeId} data={statData} />}
          </DragOverlay>
        </DndContext>

        {/* Add Stat Modal */}
        {showAddStatModal && (
          <StatSelectorModal
            currentKey=""
            onSelect={handleAddStatSelect}
            onClose={() => setShowAddStatModal(false)}
          />
        )}

        {/* Unified Footer */}
        <PopoutFooter
          duration={stats.duration}
          sessionActive={sessionActive}
          sessionPaused={sessionPaused}
          sessionName={sessionName}
          showSettings={showSettings}
          localExpenses={localExpenses}
          onPause={handlePauseSession}
          onResume={handleResumeSession}
          onExpenseChange={handleExpenseChange}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Vertical Bar Layout
  // ─────────────────────────────────────────────────────────────────────────

  if (config.layout === "vertical") {
    const sortingStrategy = verticalListSortingStrategy;
    return (
      <div style={{ ...s.vertContainer, fontSize: `${11 * fontScale}px` }}>
        {/* Header */}
        <div style={s.vertHeader}>
          <div style={s.headerLeft}>
            <MiniLoadoutSelector
              loadouts={loadouts}
              activeLoadout={activeLoadout}
              onSelect={setActiveLoadout}
            />
          </div>
          <div style={s.headerActions}>
            <button
              onClick={toggleMarkup}
              style={{
                ...s.headerBtn,
                color: config.showMarkup ? colors.info : colors.textMuted,
                background: config.showMarkup
                  ? `${colors.info}20`
                  : "transparent",
              }}
              title="Toggle Markup"
            >
              MU
            </button>
            <button
              onClick={toggleExpenses}
              style={{
                ...s.headerBtn,
                color: config.applyExpenses ? colors.warning : colors.textMuted,
                background: config.applyExpenses
                  ? `${colors.warning}20`
                  : "transparent",
              }}
              title="Apply Additional Expenses"
            >
              AE
            </button>
            <button
              onClick={toggleSettings}
              style={{
                ...s.headerBtn,
                color: showSettings ? colors.success : colors.textMuted,
                background: showSettings
                  ? `${colors.success}20`
                  : "transparent",
              }}
              title="Settings"
            >
              <Edit2 size={11} />
            </button>
            <LayoutSwitcher current={config.layout} onChange={setLayout} />
            <button
              onClick={handleClose}
              style={{ ...s.headerBtn, color: colors.danger }}
              title="Close"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            onPreset={handleLoadPreset}
            onSaveCustom={handleSaveCustom}
            onLoadCustom={handleLoadCustom}
            onReset={handleReset}
            fontSize={config.fontSize}
            onFontSizeChange={(size) =>
              setConfig((prev) => ({ ...prev, fontSize: size }))
            }
          />
        )}

        {/* Stats Column */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={config.stats} strategy={sortingStrategy}>
            <div style={s.vertStatsCol}>
              {config.stats.map((key, idx) => (
                <SortableStatRow
                  key={key}
                  id={key}
                  statKey={key}
                  data={statData}
                  onChange={(k) => handleChangeStat(idx, k)}
                  onRemove={() => handleRemoveStat(idx)}
                  settingsMode={showSettings}
                  canRemove={config.stats.length > 1}
                />
              ))}
              {showSettings && (
                <button onClick={handleAddStat} style={s.addRowBtn}>
                  + Add Stat
                </button>
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId && <StatRowOverlay statKey={activeId} data={statData} />}
          </DragOverlay>
        </DndContext>

        {/* Add Stat Modal */}
        {showAddStatModal && (
          <StatSelectorModal
            currentKey=""
            onSelect={handleAddStatSelect}
            onClose={() => setShowAddStatModal(false)}
          />
        )}

        {/* Unified Footer */}
        <PopoutFooter
          duration={stats.duration}
          sessionActive={sessionActive}
          sessionPaused={sessionPaused}
          sessionName={sessionName}
          showSettings={showSettings}
          localExpenses={localExpenses}
          onPause={handlePauseSession}
          onResume={handleResumeSession}
          onExpenseChange={handleExpenseChange}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Grid Layout (Default)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ ...s.gridContainer, fontSize: `${11 * fontScale}px` }}>
      {/* Header */}
      <div style={s.gridHeader}>
        <div style={s.headerLeft}>
          <MiniLoadoutSelector
            loadouts={loadouts}
            activeLoadout={activeLoadout}
            onSelect={setActiveLoadout}
          />
        </div>
        <div style={s.dragHandle}>
          <GripHorizontal size={12} style={{ opacity: 0.3 }} />
        </div>
        <div style={s.headerActions}>
          <button
            onClick={toggleMarkup}
            style={{
              ...s.headerBtn,
              color: config.showMarkup ? colors.info : colors.textMuted,
              background: config.showMarkup
                ? `${colors.info}20`
                : "transparent",
            }}
            title="Toggle Markup"
          >
            MU
          </button>
          <button
            onClick={toggleExpenses}
            style={{
              ...s.headerBtn,
              color: config.applyExpenses ? colors.warning : colors.textMuted,
              background: config.applyExpenses
                ? `${colors.warning}20`
                : "transparent",
            }}
            title="Apply Additional Expenses"
          >
            AE
          </button>
          <button
            onClick={toggleSettings}
            style={{
              ...s.headerBtn,
              color: showSettings ? colors.success : colors.textMuted,
              background: showSettings ? `${colors.success}20` : "transparent",
            }}
            title="Settings"
          >
            <Edit2 size={11} />
          </button>
          <LayoutSwitcher current={config.layout} onChange={setLayout} />
          <button
            onClick={handleClose}
            style={{ ...s.headerBtn, color: colors.danger }}
            title="Close"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          onPreset={handleLoadPreset}
          onSaveCustom={handleSaveCustom}
          onLoadCustom={handleLoadCustom}
          onReset={handleReset}
          fontSize={config.fontSize}
          onFontSizeChange={(size) =>
            setConfig((prev) => ({ ...prev, fontSize: size }))
          }
        />
      )}

      {/* Content */}
      <div style={s.gridContent}>
        {/* Stats Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={config.stats} strategy={rectSortingStrategy}>
            <div
              style={{
                ...s.statsGrid,
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
              }}
            >
              {config.stats.map((key, idx) => (
                <SortableStatCard
                  key={key}
                  id={key}
                  statKey={key}
                  data={statData}
                  onChange={(k) => handleChangeStat(idx, k)}
                  onRemove={() => handleRemoveStat(idx)}
                  settingsMode={showSettings}
                  canRemove={config.stats.length > 1}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId && <StatCardOverlay statKey={activeId} data={statData} />}
          </DragOverlay>
        </DndContext>

        {/* Add Button */}
        {showSettings && (
          <button onClick={handleAddStat} style={s.addCardBtn}>
            + Add Stat Card
          </button>
        )}

        {/* Add Stat Modal */}
        {showAddStatModal && (
          <StatSelectorModal
            currentKey=""
            onSelect={handleAddStatSelect}
            onClose={() => setShowAddStatModal(false)}
          />
        )}
      </div>

      {/* Unified Footer */}
      <PopoutFooter
        duration={stats.duration}
        sessionActive={sessionActive}
        sessionPaused={sessionPaused}
        sessionName={sessionName}
        showSettings={showSettings}
        localExpenses={localExpenses}
        onPause={handlePauseSession}
        onResume={handleResumeSession}
        onExpenseChange={handleExpenseChange}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Footer Component
// ─────────────────────────────────────────────────────────────────────────────

function PopoutFooter({
  duration,
  sessionActive,
  sessionPaused,
  sessionName,
  showSettings,
  localExpenses,
  onPause,
  onResume,
  onExpenseChange,
}: {
  duration: number;
  sessionActive: boolean;
  sessionPaused: boolean;
  sessionName: string;
  showSettings: boolean;
  localExpenses: { armorCost: number; fapCost: number; miscCost: number };
  onPause: () => void;
  onResume: () => void;
  onExpenseChange: (type: "armor" | "fap" | "misc", value: number) => void;
}) {
  const totalExpenses =
    localExpenses.armorCost + localExpenses.fapCost + localExpenses.miscCost;

  return (
    <div style={s.unifiedFooter}>
      {/* Additional Expenses - Show in settings mode */}
      {showSettings && (
        <div style={s.footerExpenses}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={s.footerExpensesTitle}>Additional Expenses</span>
            <span style={s.footerExpensesTotal}>
              Total:{" "}
              <span style={{ color: colors.warning }}>
                {totalExpenses.toFixed(2)} PED
              </span>
            </span>
          </div>
          <div style={s.footerExpensesRow}>
            <div style={s.footerExpenseItem}>
              <Shield size={11} style={{ color: "#06b6d4", opacity: 0.8 }} />
              <span style={s.footerExpenseLabel}>Armor</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={localExpenses.armorCost || ""}
                onChange={(e) =>
                  onExpenseChange("armor", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                style={s.footerExpenseInput}
                title="Additional Armor Cost"
              />
            </div>
            <div style={s.footerExpenseItem}>
              <Heart size={11} style={{ color: "#ef4444", opacity: 0.8 }} />
              <span style={s.footerExpenseLabel}>FAP</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={localExpenses.fapCost || ""}
                onChange={(e) =>
                  onExpenseChange("fap", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                style={s.footerExpenseInput}
                title="Additional FAP Cost"
              />
            </div>
            <div style={s.footerExpenseItem}>
              <Wrench size={11} style={{ color: "#f59e0b", opacity: 0.8 }} />
              <span style={s.footerExpenseLabel}>Misc</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={localExpenses.miscCost || ""}
                onChange={(e) =>
                  onExpenseChange("misc", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                style={s.footerExpenseInput}
                title="Misc Cost"
              />
            </div>
          </div>
        </div>
      )}

      {/* Time & Session Controls */}
      <div style={s.footerSession}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={9} style={{ opacity: 0.5, flexShrink: 0 }} />
          <span style={s.footerTimeValue}>{formatDuration(duration)}</span>
        </div>

        {sessionActive && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={s.footerSessionName}>
              {sessionPaused ? "⏸ " : ""}
              {sessionName || "Session"}
            </span>
            {sessionPaused ? (
              <button
                onClick={onResume}
                style={{ ...s.footerSessionBtn, ...s.sessionBtnResume }}
                title="Resume Session"
              >
                <Play size={9} />
              </button>
            ) : (
              <button
                onClick={onPause}
                style={{ ...s.footerSessionBtn, ...s.sessionBtnPause }}
                title="Pause Session"
              >
                <Pause size={9} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Switcher
// ─────────────────────────────────────────────────────────────────────────────

function LayoutSwitcher({
  current,
  onChange,
}: {
  current: LayoutMode;
  onChange: (l: LayoutMode) => void;
}) {
  const [open, setOpen] = useState(false);

  const layouts: { key: LayoutMode; icon: React.ReactNode; label: string }[] = [
    { key: "mini", icon: <Minimize2 size={10} />, label: "Mini" },
    { key: "horizontal", icon: <Rows size={10} />, label: "Horizontal" },
    { key: "vertical", icon: <Columns size={10} />, label: "Vertical" },
    { key: "grid", icon: <Grid3X3 size={10} />, label: "Grid" },
  ];
  const currentLayout = layouts.find((l) => l.key === current);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{ ...s.headerBtn, gap: 3 }}
        title="Change Layout"
      >
        {currentLayout?.icon}
      </button>
      {open &&
        ReactDOM.createPortal(
          <>
            <div style={s.modalBackdrop} onClick={() => setOpen(false)} />
            <div style={s.centeredModal}>
              <div style={s.modalHeader}>Select Layout</div>
              {layouts.map((l) => (
                <button
                  key={l.key}
                  onClick={() => {
                    onChange(l.key);
                    setOpen(false);
                  }}
                  style={{
                    ...s.modalOption,
                    background:
                      l.key === current ? `${colors.info}20` : "transparent",
                    color: l.key === current ? colors.info : colors.textPrimary,
                  }}
                >
                  {l.icon} {l.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Loadout Selector (for header)
// ─────────────────────────────────────────────────────────────────────────────

function MiniLoadoutSelector({
  loadouts,
  activeLoadout,
  onSelect,
}: {
  loadouts: Loadout[];
  activeLoadout: Loadout | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={s.loadoutBtn}
        title={activeLoadout ? activeLoadout.name : "Select Loadout"}
      >
        <Crosshair size={10} />
        <span style={s.loadoutName}>
          {activeLoadout ? activeLoadout.name : "None"}
        </span>
        <ChevronDown size={8} style={{ opacity: 0.5 }} />
      </button>
      {open &&
        ReactDOM.createPortal(
          <>
            <div style={s.modalBackdrop} onClick={() => setOpen(false)} />
            <div style={s.centeredModal}>
              <div style={s.modalHeader}>Select Loadout</div>
              <button
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                style={{
                  ...s.modalOption,
                  color: !activeLoadout ? colors.info : colors.textSecondary,
                }}
              >
                No Loadout
              </button>
              {loadouts.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    onSelect(l.id);
                    setOpen(false);
                  }}
                  style={{
                    ...s.modalOption,
                    background:
                      activeLoadout?.id === l.id
                        ? `${colors.info}15`
                        : "transparent",
                    color:
                      activeLoadout?.id === l.id
                        ? colors.info
                        : colors.textPrimary,
                  }}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Panel
// ─────────────────────────────────────────────────────────────────────────────

function SettingsPanel({
  onPreset,
  onSaveCustom,
  onLoadCustom,
  onReset,
  fontSize,
  onFontSizeChange,
}: {
  onPreset: (p: string[]) => void;
  onSaveCustom: () => void;
  onLoadCustom: () => void;
  onReset: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}) {
  const hasCustom = !!loadCustomLayout();
  return (
    <div style={s.settingsPanel}>
      {/* Font Size Controls */}
      <div style={s.fontSizeRow}>
        <span style={s.fontSizeLabel}>Font Size</span>
        <div style={s.fontSizeBtns}>
          <button
            onClick={() => onFontSizeChange(Math.max(0.6, fontSize - 0.1))}
            style={s.fontSizeBtn}
          >
            −
          </button>
          <span style={s.fontSizeValue}>{Math.round(fontSize * 100)}%</span>
          <button
            onClick={() => onFontSizeChange(Math.min(2, fontSize + 0.1))}
            style={s.fontSizeBtn}
          >
            +
          </button>
        </div>
      </div>
      <div style={s.presetBtns}>
        {Object.entries(PRESETS).map(([name, preset]) => (
          <button
            key={name}
            onClick={() => onPreset(preset)}
            style={s.presetBtn}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
        <button
          onClick={onLoadCustom}
          style={{ ...s.presetBtn, opacity: hasCustom ? 1 : 0.4 }}
          disabled={!hasCustom}
        >
          Custom
        </button>
      </div>
      <div style={s.settingsSpacer} />
      <div style={s.settingsActions}>
        <button onClick={onSaveCustom} style={s.actionBtn}>
          Save Custom
        </button>
        <button onClick={onReset} style={s.actionBtn}>
          <RotateCcw size={10} /> Reset
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Stat Card (Grid)
// ─────────────────────────────────────────────────────────────────────────────

function SortableStatCard({
  id,
  statKey,
  data,
  onChange,
  onRemove,
  settingsMode,
  canRemove,
}: {
  id: string;
  statKey: string;
  data: StatData;
  onChange: (k: string) => void;
  onRemove: () => void;
  settingsMode: boolean;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <StatCardInner
        statKey={statKey}
        data={data}
        onChange={onChange}
        onRemove={onRemove}
        settingsMode={settingsMode}
        canRemove={canRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function StatCardInner({
  statKey,
  data,
  onChange,
  onRemove,
  settingsMode,
  canRemove,
  dragHandleProps,
}: {
  statKey: string;
  data: StatData;
  onChange?: (k: string) => void;
  onRemove?: () => void;
  settingsMode: boolean;
  canRemove: boolean;
  dragHandleProps?: any;
}) {
  const [showSelector, setShowSelector] = useState(false);
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;
  const value = stat.getValue(data);
  const Icon = stat.icon;

  return (
    <div style={s.statCard}>
      {/* Background Icon */}
      <div style={s.cardIcon}>
        <Icon size={28} />
      </div>

      {/* Drag Handle */}
      {settingsMode && (
        <div {...dragHandleProps} style={s.cardDragHandle}>
          <GripVertical size={12} />
        </div>
      )}

      {/* Actions */}
      {settingsMode && (
        <div style={s.cardActions}>
          <button
            onClick={() => setShowSelector(true)}
            style={s.cardEditBtn}
            title="Change stat"
          >
            <Edit2 size={9} />
          </button>
          {canRemove && (
            <button onClick={onRemove} style={s.cardRemoveBtn} title="Remove">
              <X size={9} />
            </button>
          )}
        </div>
      )}

      {/* Selector Modal */}
      {showSelector && onChange && (
        <StatSelectorModal
          currentKey={statKey}
          onSelect={(k) => {
            onChange(k);
            setShowSelector(false);
          }}
          onClose={() => setShowSelector(false)}
        />
      )}

      {/* Content */}
      <div style={s.cardLabel}>{stat.label}</div>
      <div style={{ ...s.cardValue, color: value.color }}>
        {value.value}
        {value.unit && <span style={s.cardUnit}> {value.unit}</span>}
      </div>
    </div>
  );
}

function StatCardOverlay({
  statKey,
  data,
}: {
  statKey: string;
  data: StatData;
}) {
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;
  const value = stat.getValue(data);
  const Icon = stat.icon;

  return (
    <div
      style={{
        ...s.statCard,
        opacity: 0.9,
        cursor: "grabbing",
        boxShadow: `0 4px 16px ${colors.bgBase}80`,
      }}
    >
      <div style={s.cardIcon}>
        <Icon size={28} />
      </div>
      <div style={s.cardLabel}>{stat.label}</div>
      <div style={{ ...s.cardValue, color: value.color }}>
        {value.value}
        {value.unit && <span style={s.cardUnit}> {value.unit}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Stat Chip (Horizontal)
// ─────────────────────────────────────────────────────────────────────────────

function SortableStatChip({
  id,
  statKey,
  data,
  onChange,
  onRemove,
  settingsMode,
  canRemove,
}: {
  id: string;
  statKey: string;
  data: StatData;
  onChange: (k: string) => void;
  onRemove: () => void;
  settingsMode: boolean;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const [showSelector, setShowSelector] = useState(false);
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;
  const value = stat.getValue(data);

  return (
    <div ref={setNodeRef} style={{ ...style, ...s.statChip }}>
      {settingsMode && (
        <div {...attributes} {...listeners} style={s.chipDragHandle}>
          <GripVertical size={10} />
        </div>
      )}
      <span style={s.chipLabel}>{stat.label}</span>
      <span style={{ ...s.chipValue, color: value.color }}>
        {value.value}
        {value.unit && <span style={s.chipUnit}>{value.unit}</span>}
      </span>
      {settingsMode && (
        <div style={s.chipActions}>
          <button onClick={() => setShowSelector(true)} style={s.chipEditBtn}>
            <Edit2 size={8} />
          </button>
          {canRemove && (
            <button onClick={onRemove} style={s.chipRemoveBtn}>
              <X size={8} />
            </button>
          )}
        </div>
      )}
      {showSelector && (
        <StatSelectorModal
          currentKey={statKey}
          onSelect={(k) => {
            onChange(k);
            setShowSelector(false);
          }}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

function StatChipOverlay({
  statKey,
  data,
}: {
  statKey: string;
  data: StatData;
}) {
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;
  const value = stat.getValue(data);

  return (
    <div
      style={{
        ...s.statChip,
        opacity: 0.9,
        cursor: "grabbing",
        boxShadow: `0 2px 8px ${colors.bgBase}80`,
      }}
    >
      <span style={s.chipLabel}>{stat.label}</span>
      <span style={{ ...s.chipValue, color: value.color }}>{value.value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Stat Row (Vertical)
// ─────────────────────────────────────────────────────────────────────────────

function SortableStatRow({
  id,
  statKey,
  data,
  onChange,
  onRemove,
  settingsMode,
  canRemove,
}: {
  id: string;
  statKey: string;
  data: StatData;
  onChange: (k: string) => void;
  onRemove: () => void;
  settingsMode: boolean;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const [showSelector, setShowSelector] = useState(false);
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;
  const value = stat.getValue(data);
  const Icon = stat.icon;

  return (
    <div ref={setNodeRef} style={{ ...style, ...s.statRow }}>
      {settingsMode && (
        <div {...attributes} {...listeners} style={s.rowDragHandle}>
          <GripHorizontal size={10} />
        </div>
      )}
      <div style={s.rowIcon}>
        <Icon size={14} />
      </div>
      <span style={s.rowLabel}>{stat.label}</span>
      <span style={{ ...s.rowValue, color: value.color }}>
        {value.value}
        {value.unit && <span style={s.rowUnit}> {value.unit}</span>}
      </span>
      {settingsMode && (
        <div style={s.rowActions}>
          <button onClick={() => setShowSelector(true)} style={s.rowEditBtn}>
            <Edit2 size={9} />
          </button>
          {canRemove && (
            <button onClick={onRemove} style={s.rowRemoveBtn}>
              <X size={9} />
            </button>
          )}
        </div>
      )}
      {showSelector && (
        <StatSelectorModal
          currentKey={statKey}
          onSelect={(k) => {
            onChange(k);
            setShowSelector(false);
          }}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

function StatRowOverlay({
  statKey,
  data,
}: {
  statKey: string;
  data: StatData;
}) {
  const stat = STAT_MAP.get(statKey);
  if (!stat) return null;
  const value = stat.getValue(data);
  const Icon = stat.icon;

  return (
    <div
      style={{
        ...s.statRow,
        opacity: 0.9,
        cursor: "grabbing",
        boxShadow: `0 2px 8px ${colors.bgBase}80`,
      }}
    >
      <div style={s.rowIcon}>
        <Icon size={14} />
      </div>
      <span style={s.rowLabel}>{stat.label}</span>
      <span style={{ ...s.rowValue, color: value.color }}>{value.value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Selector Modal
// ─────────────────────────────────────────────────────────────────────────────

function StatSelectorModal({
  currentKey,
  onSelect,
  onClose,
}: {
  currentKey: string;
  onSelect: (k: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("combat");

  const statsList = Array.from(STAT_MAP.values());

  // Filter out time category and group by category
  const groups = statsList
    .filter((stat) => stat.category !== "time")
    .reduce((acc, stat) => {
      if (!acc[stat.category]) acc[stat.category] = [];
      acc[stat.category].push(stat);
      return acc;
    }, {} as Record<string, typeof statsList>);

  // Category colors and labels - now 5 categories (excluding time)
  const categories = [
    { key: "combat", label: "Combat", color: colors.danger },
    { key: "economy", label: "Economy", color: colors.success },
    { key: "skills", label: "Skills", color: colors.info },
    { key: "efficiency", label: "Efficiency", color: colors.warning },
    { key: "hourly", label: "Hourly", color: "#a855f7" }, // purple
  ];

  const activeStats = groups[activeTab] || [];

  return ReactDOM.createPortal(
    <>
      <div style={s.modalBackdrop} onClick={onClose} />
      <div style={s.selectorModal}>
        <div style={s.selectorHeader}>Select Stat</div>

        {/* Category Tabs */}
        <div style={s.selectorTabs}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              style={{
                ...s.selectorTab,
                color: activeTab === cat.key ? cat.color : colors.textMuted,
                borderBottom:
                  activeTab === cat.key
                    ? `2px solid ${cat.color}`
                    : "2px solid transparent",
                background:
                  activeTab === cat.key ? `${cat.color}10` : "transparent",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stats List for Active Tab */}
        <div style={s.selectorDropdown}>
          {activeStats.map((stat) => (
            <button
              key={stat.key}
              onClick={() => onSelect(stat.key)}
              style={{
                ...s.selectorOption,
                background:
                  stat.key === currentKey
                    ? `${colors.success}15`
                    : "transparent",
                color:
                  stat.key === currentKey ? colors.success : colors.textPrimary,
              }}
            >
              <span style={{ flex: 1 }}>{stat.label}</span>
              {stat.key === currentKey && (
                <Check size={12} style={{ color: colors.success }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

type ElectronCSSProperties = React.CSSProperties & {
  WebkitAppRegion?: "drag" | "no-drag";
};

const s: Record<string, ElectronCSSProperties> = {
  // ─── Mini Bar ───
  miniContainer: {
    background: colors.bgBase,
    fontFamily: typography.sans,
    width: "100%",
    height: "100%",
  },
  miniBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 26,
    background: colors.bgPanel,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    padding: "0 8px",
    cursor: "grab",
    WebkitAppRegion: "drag",
  },
  miniStats: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    overflow: "hidden",
    WebkitAppRegion: "no-drag",
  },
  miniStat: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    whiteSpace: "nowrap",
  },
  miniLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  miniValue: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  miniActions: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    WebkitAppRegion: "no-drag",
  },
  miniSessionControls: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    marginLeft: 4,
    paddingLeft: 4,
    borderLeft: `1px solid ${colors.border}`,
    WebkitAppRegion: "no-drag",
  },
  miniBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 18,
    border: "none",
    borderRadius: 3,
    background: "transparent",
    color: colors.textMuted,
    cursor: "pointer",
    fontSize: 8,
    fontWeight: 700,
  },

  // ─── Horizontal Bar ───
  horzContainer: {
    background: colors.bgBase,
    fontFamily: typography.sans,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  horzHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
    background: colors.bgPanel,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    padding: "0 8px",
    cursor: "grab",
    WebkitAppRegion: "drag",
  },
  horzLoadout: {
    padding: "6px 8px",
    borderBottom: `1px solid ${colors.borderSubtle}`,
  },
  horzStatsRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px",
    flexWrap: "wrap",
    flex: 1,
    overflowY: "auto",
    alignContent: "flex-start",
  },

  // ─── Vertical Bar ───
  vertContainer: {
    background: colors.bgBase,
    fontFamily: typography.sans,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  vertHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
    background: colors.bgPanel,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    padding: "0 8px",
    cursor: "grab",
    WebkitAppRegion: "drag",
  },
  vertLoadout: {
    padding: "6px 8px",
    borderBottom: `1px solid ${colors.borderSubtle}`,
  },
  vertStatsCol: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "6px 8px",
    flex: 1,
    overflowY: "auto",
  },

  // ─── Grid ───
  gridContainer: {
    background: colors.bgBase,
    fontFamily: typography.sans,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  gridHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
    background: colors.bgPanel,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    padding: "0 8px",
    cursor: "grab",
    WebkitAppRegion: "drag",
  },
  gridContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 8,
    gap: 8,
    overflow: "auto",
    minHeight: 0,
  },
  loadoutRow: { display: "flex", alignItems: "center", gap: 8 },
  statsGrid: {
    display: "grid",
    gap: 6,
    gridAutoRows: "minmax(50px, auto)",
  },

  // ─── Shared Header ───
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    WebkitAppRegion: "no-drag",
  },
  duration: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.textMuted,
    fontWeight: 600,
  },
  dragHandle: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    WebkitAppRegion: "no-drag",
  },
  headerBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 20,
    border: "none",
    borderRadius: 4,
    background: "transparent",
    color: colors.textMuted,
    cursor: "pointer",
    fontSize: 9,
    fontWeight: 700,
    transition: "all 0.15s",
  },

  // ─── Mini Loadout Selector ───
  loadoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 6px",
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: colors.bgCard,
    color: colors.textPrimary,
    cursor: "pointer",
    fontSize: 9,
    fontWeight: 600,
    maxWidth: 100,
    WebkitAppRegion: "no-drag",
  },
  loadoutName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    textAlign: "left",
  },
  loadoutDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 4,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    minWidth: 120,
    maxHeight: 200,
    overflowY: "auto",
    zIndex: 10000,
    boxShadow: `0 4px 12px ${colors.bgBase}80`,
  },
  loadoutOption: {
    display: "block",
    width: "100%",
    padding: "6px 10px",
    border: "none",
    background: "transparent",
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
  },

  // ─── Settings Panel ───
  settingsPanel: {
    padding: "6px 10px",
    background: colors.bgPanel,
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  fontSizeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
    paddingRight: 8,
    borderRight: `1px solid ${colors.border}`,
  },
  fontSizeLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.textSecondary,
  },
  fontSizeBtns: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  fontSizeBtn: {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    background: colors.bgCard,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  fontSizeValue: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textPrimary,
    minWidth: 32,
    textAlign: "center" as const,
  },
  settingsSpacer: {
    flex: 1,
    minWidth: 8,
  },

  // ─── Settings Panel Actions ───
  settingsActions: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  presetBtns: { display: "flex", gap: 4, flexWrap: "wrap" },
  presetBtn: {
    padding: "4px 8px",
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: colors.bgCard,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: 600,
    cursor: "pointer",
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: colors.bgCard,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
  },

  // ─── Stat Card (Grid) ───
  statCard: {
    position: "relative",
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 50,
    minWidth: 0,
    flex: "1 1 auto",
  },
  cardIcon: {
    position: "absolute",
    right: 6,
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.06,
    color: colors.iconWatermark,
    pointerEvents: "none",
  },
  cardDragHandle: {
    position: "absolute",
    left: "50%",
    top: 4,
    transform: "translateX(-50%)",
    color: colors.textMuted,
    cursor: "grab",
    opacity: 0.5,
    WebkitAppRegion: "no-drag",
  },
  cardActions: {
    position: "absolute",
    top: 4,
    right: 4,
    display: "flex",
    gap: 2,
    zIndex: 2,
  },
  cardEditBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    border: `1px solid ${colors.success}50`,
    borderRadius: 3,
    background: `${colors.success}15`,
    color: colors.success,
    cursor: "pointer",
    WebkitAppRegion: "no-drag",
  },
  cardRemoveBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    border: `1px solid ${colors.danger}50`,
    borderRadius: 3,
    background: `${colors.danger}15`,
    color: colors.danger,
    cursor: "pointer",
    WebkitAppRegion: "no-drag",
  },
  cardLabel: {
    fontSize: "0.82em",
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
    zIndex: 1,
  },
  cardValue: {
    fontSize: "1.45em",
    fontWeight: 700,
    fontFamily: typography.mono,
    zIndex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardUnit: { fontSize: "0.65em", fontWeight: 600, opacity: 0.7 },
  addCardBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.sm,
    background: "transparent",
    color: colors.textMuted,
    fontSize: "1em",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },

  // ─── Session Controls ───
  sessionControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px",
    borderTop: `1px solid ${colors.border}`,
    background: colors.bgPanel,
    flexShrink: 0,
  },
  sessionName: {
    fontSize: "0.85em",
    fontWeight: 600,
    color: colors.textSecondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: 120,
  },
  sessionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 12px",
    border: "none",
    borderRadius: radius.sm,
    fontSize: "0.85em",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  sessionBtnStart: {
    background: `${colors.success}20`,
    color: colors.success,
  },
  sessionBtnStop: {
    background: `${colors.danger}20`,
    color: colors.danger,
  },
  sessionBtnPause: {
    background: `${colors.warning}20`,
    color: colors.warning,
  },
  sessionBtnResume: {
    background: `${colors.success}20`,
    color: colors.success,
  },

  // ─── Unified Footer ───
  unifiedFooter: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
    borderTop: `1px solid ${colors.border}`,
    background: colors.bgPanel,
    flexShrink: 0,
  },
  footerTimeValue: {
    fontFamily: typography.mono,
    color: colors.textPrimary,
    fontSize: "0.85em",
    fontWeight: 600,
  },
  footerExpenses: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    padding: "10px 12px",
    borderBottom: `1px solid ${colors.borderSubtle}`,
    background: `${colors.bgCard}50`,
  },
  footerExpensesTitle: {
    fontSize: "0.7em",
    fontWeight: 700,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  footerExpensesRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
  },
  footerExpenseItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  footerExpenseLabel: {
    fontSize: "0.8em",
    fontWeight: 600,
    color: colors.textMuted,
    minWidth: 32,
  },
  footerExpenseInput: {
    width: 80,
    padding: "5px 8px",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    background: colors.bgBase,
    color: colors.textPrimary,
    fontSize: "0.85em",
    fontFamily: typography.mono,
    fontWeight: 600,
    textAlign: "right" as const,
    outline: "none",
    marginRight: 10,
  },
  footerExpensesTotal: {
    fontSize: "0.75em",
    fontWeight: 600,
    color: colors.textSecondary,
    fontFamily: typography.mono,
  },
  footerSession: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    padding: "6px 8px",
  },
  footerDivider: {
    width: 1,
    height: 14,
    background: colors.border,
    opacity: 0.5,
  },
  footerSessionName: {
    fontSize: "0.82em",
    fontWeight: 600,
    color: colors.textSecondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: 100,
  },
  footerSessionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    border: "none",
    borderRadius: radius.sm,
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
  },

  // ─── Inline Expenses ───
  expensesDivider: {
    width: 1,
    height: 20,
    background: colors.border,
    marginLeft: 4,
  },
  expensesBar: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "8px",
    borderTop: `1px solid ${colors.border}`,
    background: colors.bgPanel,
    flexShrink: 0,
  },
  expensesBarTitle: {
    fontSize: "0.75em",
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  expensesBarInputs: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  expensesInline: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  expenseInlineItem: {
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  expenseInlineInput: {
    width: 50,
    padding: "3px 5px",
    border: `1px solid ${colors.border}`,
    borderRadius: 3,
    background: colors.bgBase,
    color: colors.textPrimary,
    fontSize: "0.8em",
    fontFamily: typography.mono,
    fontWeight: 600,
    textAlign: "right",
    outline: "none",
  },

  // ─── Stat Chip (Horizontal) ───
  statChip: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
  },
  chipDragHandle: { color: colors.textMuted, cursor: "grab", opacity: 0.5 },
  chipLabel: {
    fontSize: "0.73em",
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  chipValue: {
    fontSize: "1em",
    fontWeight: 700,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  chipUnit: {
    fontSize: "0.73em",
    fontWeight: 500,
    opacity: 0.6,
    marginLeft: 1,
  },
  chipActions: { display: "flex", alignItems: "center", gap: 2, marginLeft: 2 },
  chipEditBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 14,
    height: 14,
    border: "none",
    borderRadius: 2,
    background: `${colors.success}15`,
    color: colors.success,
    cursor: "pointer",
  },
  chipRemoveBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 14,
    height: 14,
    border: "none",
    borderRadius: 2,
    background: `${colors.danger}15`,
    color: colors.danger,
    cursor: "pointer",
  },
  addChipBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.sm,
    background: "transparent",
    color: colors.textMuted,
    fontSize: 12,
    cursor: "pointer",
  },

  // ─── Stat Row (Vertical) ───
  statRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 8px",
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
  },
  rowDragHandle: { color: colors.textMuted, cursor: "grab", opacity: 0.5 },
  rowIcon: { color: colors.textMuted, opacity: 0.4, flexShrink: 0 },
  rowLabel: {
    fontSize: "0.82em",
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    flex: 1,
  },
  rowValue: {
    fontSize: "1.1em",
    fontWeight: 700,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  rowUnit: { fontSize: "0.82em", fontWeight: 500, opacity: 0.6 },
  rowActions: { display: "flex", alignItems: "center", gap: 2 },
  rowEditBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    border: "none",
    borderRadius: 2,
    background: `${colors.success}15`,
    color: colors.success,
    cursor: "pointer",
  },
  rowRemoveBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    border: "none",
    borderRadius: 2,
    background: `${colors.danger}15`,
    color: colors.danger,
    cursor: "pointer",
  },
  addRowBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px",
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.sm,
    background: "transparent",
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
  },

  // ─── Selector Modal ───
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  portalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    background: "transparent",
  },
  portalDropdown: {
    position: "fixed",
    zIndex: 100000,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    boxShadow: `0 4px 16px ${colors.bgBase}`,
    overflow: "hidden",
  },
  selectorModal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 100000,
    width: "80%",
    height: "80%",
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    boxShadow: `0 8px 32px ${colors.bgBase}`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  selectorHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.textPrimary,
    padding: "12px 14px 10px",
    borderBottom: `1px solid ${colors.border}`,
    background: colors.bgPanel,
  },
  selectorTabs: {
    display: "flex",
    borderBottom: `1px solid ${colors.border}`,
    background: colors.bgPanel,
  },
  selectorTab: {
    flex: 1,
    padding: "8px 4px",
    border: "none",
    background: "transparent",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  selectorDropdown: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  },
  selectorGroupHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.textSecondary,
    letterSpacing: "0.5px",
    padding: "8px 12px",
    marginBottom: 2,
  },
  selectorOption: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
  },

  // ─── Centered Modal (for dropdowns in small windows) ───
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `${colors.bgBase}90`,
    zIndex: 99999,
  },
  centeredModal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    minWidth: 150,
    maxWidth: "90%",
    maxHeight: "80%",
    overflowY: "auto",
    zIndex: 100000,
    boxShadow: `0 8px 32px ${colors.bgBase}`,
  },
  modalHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: "uppercase",
    padding: "10px 12px 6px",
    borderBottom: `1px solid ${colors.borderSubtle}`,
  },
  modalOption: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
  },

  // ─── Layout Dropdown (legacy, kept for reference) ───
  layoutDropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 4,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    overflow: "hidden",
    zIndex: 10000,
    boxShadow: `0 4px 12px ${colors.bgBase}80`,
  },
  layoutOption: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    padding: "6px 12px",
    border: "none",
    background: "transparent",
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default PopoutStatsV2;
