/**
 * ARTEMIS PopoutStats V2 - Clean Multi-Layout Design
 * Supports: Mini Bar, Horizontal Bar, Vertical Bar, Grid modes
 * Features: Drag & drop, stat selection, markup toggle, loadout selector
 */

import React, { useEffect, useState } from "react";
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
};

const PRESETS = {
  economy: [
    "netProfit",
    "lootValue",
    "totalSpend",
    "returnRate",
    "decay",
    "lootPerHour",
  ],
  efficiency: [
    "avgLootPerKill",
    "lootPerHour",
    "costPerKill",
    "costPerHour",
    "hitRate",
    "critRate",
  ],
  combat: ["kills", "deaths", "kdr", "hitRate", "critRate", "damageDealt"],
  skills: [
    "skillGains",
    "skillEvents",
    "avgSkillPerEvent",
    "kills",
    "hitRate",
    "kdr",
  ],
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

  // Listen for stats
  useEffect(() => {
    const unsubscribe = window.electron?.popout?.onStatsUpdate(
      (data: LiveStats) => setStats(data)
    );
    window.electron?.popout?.requestStats();
    return () => unsubscribe?.();
  }, []);

  // Persist config
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const statData: StatData = { ...stats, showMarkup: config.showMarkup };

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

  const handleAddStat = () =>
    setConfig((prev) => ({ ...prev, stats: [...prev.stats, "kills"] }));
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
            {config.stats.slice(0, 6).map((key) => {
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
            <span style={s.miniStat}>
              <Clock size={9} style={{ opacity: 0.5 }} />
              <span style={s.miniValue}>{formatDuration(stats.duration)}</span>
            </span>
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
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Horizontal Bar Layout
  // ─────────────────────────────────────────────────────────────────────────

  if (config.layout === "horizontal") {
    const sortingStrategy = horizontalListSortingStrategy;
    return (
      <div style={s.horzContainer}>
        {/* Header */}
        <div style={s.horzHeader}>
          <div style={s.headerLeft}>
            <div style={s.duration}>
              <Clock size={10} style={{ opacity: 0.5 }} />
              <span>{formatDuration(stats.duration)}</span>
            </div>
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
              onClick={() => setShowSettings(!showSettings)}
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
              {showSettings && config.stats.length < 8 && (
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
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Vertical Bar Layout
  // ─────────────────────────────────────────────────────────────────────────

  if (config.layout === "vertical") {
    const sortingStrategy = verticalListSortingStrategy;
    return (
      <div style={s.vertContainer}>
        {/* Header */}
        <div style={s.vertHeader}>
          <div style={s.headerLeft}>
            <div style={s.duration}>
              <Clock size={10} style={{ opacity: 0.5 }} />
              <span>{formatDuration(stats.duration)}</span>
            </div>
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
              onClick={() => setShowSettings(!showSettings)}
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
              {showSettings && config.stats.length < 10 && (
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
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Grid Layout (Default)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={s.gridContainer}>
      {/* Header */}
      <div style={s.gridHeader}>
        <div style={s.headerLeft}>
          <div style={s.duration}>
            <Clock size={10} style={{ opacity: 0.5 }} />
            <span>{formatDuration(stats.duration)}</span>
          </div>
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
            onClick={() => setShowSettings(!showSettings)}
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
}: {
  onPreset: (p: string[]) => void;
  onSaveCustom: () => void;
  onLoadCustom: () => void;
  onReset: () => void;
}) {
  const hasCustom = !!loadCustomLayout();
  return (
    <div style={s.settingsPanel}>
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
  const statsList = Array.from(STAT_MAP.values());
  const groups = statsList.reduce((acc, stat) => {
    const last = acc[acc.length - 1];
    if (!last || last.category !== stat.category)
      acc.push({ category: stat.category, items: [stat] });
    else last.items.push(stat);
    return acc;
  }, [] as Array<{ category: string; items: typeof statsList }>);

  // Category colors
  const categoryColors: Record<string, string> = {
    combat: colors.danger,
    economy: colors.success,
    skills: colors.info,
    efficiency: colors.warning,
    time: colors.textMuted,
  };

  return ReactDOM.createPortal(
    <>
      <div style={s.modalBackdrop} onClick={onClose} />
      <div style={s.selectorModal}>
        <div style={s.selectorHeader}>Select Stat</div>
        <div style={s.selectorDropdown}>
          {groups.map((group, idx) => (
            <div
              key={group.category}
              style={idx > 0 ? { marginTop: 8 } : undefined}
            >
              <div
                style={{
                  ...s.selectorGroupHeader,
                  background: `${
                    categoryColors[group.category] || colors.textMuted
                  }15`,
                  borderLeft: `3px solid ${
                    categoryColors[group.category] || colors.textMuted
                  }`,
                }}
              >
                {group.category.toUpperCase()}
              </div>
              {group.items.map((stat) => (
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
                      stat.key === currentKey
                        ? colors.success
                        : colors.textPrimary,
                  }}
                >
                  <span style={{ flex: 1 }}>{stat.label}</span>
                  {stat.key === currentKey && (
                    <Check size={12} style={{ color: colors.success }} />
                  )}
                </button>
              ))}
            </div>
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
  settingsSpacer: {
    flex: 1,
    minWidth: 8,
  },
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
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
    zIndex: 1,
  },
  cardValue: {
    fontSize: "clamp(14px, 3.5vw, 18px)",
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
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
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
    fontSize: 8,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  chipValue: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  chipUnit: { fontSize: 8, fontWeight: 500, opacity: 0.6, marginLeft: 1 },
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
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: "uppercase",
    flex: 1,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  rowUnit: { fontSize: 9, fontWeight: 500, opacity: 0.6 },
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
    width: "90%",
    maxWidth: 300,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    boxShadow: `0 8px 32px ${colors.bgBase}`,
    overflow: "hidden",
  },
  selectorHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.textPrimary,
    padding: "12px 14px 10px",
    borderBottom: `1px solid ${colors.border}`,
    background: colors.bgPanel,
  },
  selectorDropdown: {
    maxHeight: 280,
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
