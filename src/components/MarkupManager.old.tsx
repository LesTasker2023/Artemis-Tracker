/**
 * MarkupManager - Item Markup Library Manager
 * Allows users to manage item markup percentages for profit calculations
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Star,
  StarOff,
  Package,
  Percent,
  Filter,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  Clock,
  Edit2,
  Plus,
  EyeOff,
  Eye,
} from "lucide-react";
import { useMarkupLibrary } from "../hooks/useMarkupLibrary";
import type { ItemMarkupEntry } from "../core/markup";

// ==================== Types ====================

/** Loot item from session */
export interface SessionLootItem {
  itemName: string;
  count: number;
  totalValue: number;
  quantity: number;
}

interface MarkupManagerProps {
  onClose?: () => void;
  compact?: boolean;
  onMarkupChange?: () => void;
  /** Loot items from current session (byItem from stats.loot) */
  sessionLoot?: Record<string, SessionLootItem>;
}

type ViewMode = "browse" | "favorites" | "custom" | "recent" | "ignored";
type SortOption = "name" | "markup-high" | "markup-low" | "category" | "recent";

// ==================== Styles ====================

const styles = {
  container: {
    padding: "16px",
    backgroundColor: "hsl(220 13% 8%)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    height: "100%",
    overflow: "hidden",
  },
  // Single unified toolbar combining everything
  unifiedToolbar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    flexWrap: "wrap" as const,
  },
  // Compact title in toolbar
  toolbarTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    marginRight: "8px",
    whiteSpace: "nowrap" as const,
  },
  // Divider between sections
  toolbarDivider: {
    width: "1px",
    height: "20px",
    backgroundColor: "hsl(220 13% 25%)",
    margin: "0 4px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  subtitle: {
    fontSize: "13px",
    color: "hsl(220 13% 55%)",
    marginTop: "4px",
  },
  toolbar: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  searchContainer: {
    flex: 1,
    minWidth: "140px",
    maxWidth: "280px",
    position: "relative" as const,
  },
  searchInput: {
    width: "100%",
    padding: "6px 10px 6px 32px",
    backgroundColor: "hsl(220 13% 14%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    color: "hsl(0 0% 95%)",
    fontSize: "12px",
    outline: "none",
  },
  searchIcon: {
    position: "absolute" as const,
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "hsl(220 13% 45%)",
  },
  button: {
    padding: "6px 10px",
    backgroundColor: "hsl(220 13% 15%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    color: "hsl(0 0% 90%)",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap" as const,
  },
  buttonPrimary: {
    backgroundColor: "hsl(142 71% 35%)",
    border: "1px solid hsl(142 71% 45%)",
    color: "white",
  },
  buttonActive: {
    backgroundColor: "hsl(220 13% 22%)",
    borderColor: "hsl(220 13% 35%)",
  },
  buttonIcon: {
    padding: "6px",
    backgroundColor: "hsl(220 13% 15%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    color: "hsl(0 0% 90%)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  tabs: {
    display: "flex",
    gap: "2px",
  },
  tab: {
    padding: "5px 10px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    color: "hsl(220 13% 55%)",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  tabActive: {
    backgroundColor: "hsl(220 13% 20%)",
    color: "hsl(0 0% 95%)",
  },
  content: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  // Compact inline stats
  inlineStats: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "11px",
    color: "hsl(220 13% 55%)",
    marginLeft: "auto",
  },
  inlineStat: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  inlineStatValue: {
    fontWeight: 600,
    color: "hsl(0 0% 85%)",
  },
  statsBar: {
    display: "flex",
    gap: "24px",
    padding: "12px 16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
  },
  stat: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  statLabel: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "15px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
  },
  itemList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    transition: "all 0.15s ease",
    cursor: "pointer",
  },
  itemRowHover: {
    backgroundColor: "hsl(220 13% 14%)",
  },
  itemName: {
    flex: 1,
    fontSize: "14px",
    fontWeight: 500,
    color: "hsl(0 0% 95%)",
  },
  itemCategory: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
    marginTop: "2px",
  },
  itemMarkup: {
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(142 71% 55%)",
    minWidth: "80px",
    textAlign: "right" as const,
  },
  markupInput: {
    width: "80px",
    padding: "6px 10px",
    backgroundColor: "hsl(220 13% 15%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    color: "hsl(0 0% 95%)",
    fontSize: "13px",
    textAlign: "right" as const,
    outline: "none",
  },
  favoriteButton: {
    padding: "6px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    color: "hsl(220 13% 45%)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  favoriteActive: {
    color: "hsl(45 93% 60%)",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    textAlign: "center" as const,
    color: "hsl(220 13% 45%)",
    minHeight: "100%",
  },
  emptyIcon: {
    marginBottom: "16px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "15px",
    fontWeight: 500,
    color: "hsl(0 0% 75%)",
    marginBottom: "8px",
  },
  emptyDescription: {
    fontSize: "13px",
    maxWidth: "280px",
  },
  settingsSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
  },
  settingLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  settingTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "hsl(0 0% 95%)",
  },
  settingDescription: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
  },
  toggle: {
    width: "44px",
    height: "24px",
    backgroundColor: "hsl(220 13% 20%)",
    borderRadius: "12px",
    position: "relative" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  toggleActive: {
    backgroundColor: "hsl(142 71% 40%)",
  },
  toggleHandle: {
    width: "18px",
    height: "18px",
    backgroundColor: "white",
    borderRadius: "50%",
    position: "absolute" as const,
    top: "3px",
    left: "3px",
    transition: "all 0.2s ease",
  },
  toggleHandleActive: {
    left: "23px",
  },
  loadingOverlay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
  },
  spinner: {
    animation: "spin 1s linear infinite",
  },
  filterDropdown: {
    position: "relative" as const,
  },
  dropdownMenu: {
    position: "absolute" as const,
    top: "100%",
    right: 0,
    marginTop: "4px",
    padding: "4px",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 20%)",
    borderRadius: "8px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    zIndex: 50,
    minWidth: "160px",
  },
  dropdownItem: {
    padding: "8px 12px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "hsl(220 13% 70%)",
    fontSize: "13px",
    cursor: "pointer",
    width: "100%",
    textAlign: "left" as const,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.1s ease",
  },
  dropdownItemActive: {
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(0 0% 95%)",
  },
};

// ==================== Components ====================

interface ItemRowProps {
  item: ItemMarkupEntry;
  onUpdate: (updates: {
    markupPercent?: number;
    markupValue?: number;
    useFixed?: boolean;
    favorite?: boolean;
    ignored?: boolean;
  }) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  viewMode?: ViewMode;
}

function ItemRow({
  item,
  onUpdate,
  isEditing,
  onStartEdit,
  onEndEdit,
  viewMode,
}: ItemRowProps) {
  const markupPercent = item.markupPercent ?? 100;
  const markupValue = item.markupValue ?? 0;
  const useFixed = item.useFixed ?? false;

  const [localMarkupPercent, setLocalMarkupPercent] = useState(
    markupPercent.toString()
  );
  const [localMarkupValue, setLocalMarkupValue] = useState(
    markupValue.toString()
  );
  const [localUseFixed, setLocalUseFixed] = useState(useFixed);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLocalMarkupPercent(markupPercent.toString());
      setLocalMarkupValue(markupValue.toString());
      setLocalUseFixed(useFixed);
    }
  }, [isEditing, markupPercent, markupValue, useFixed]);

  const handleSave = () => {
    if (localUseFixed) {
      const fixed = parseFloat(localMarkupValue);
      if (!isNaN(fixed) && fixed >= 0) {
        onUpdate({ markupValue: fixed, useFixed: true });
      }
    } else {
      const percent = parseFloat(localMarkupPercent);
      if (!isNaN(percent) && percent >= 0) {
        onUpdate({ markupPercent: percent, useFixed: false });
      }
    }
    onEndEdit();
  };

  const handleCancel = () => {
    setLocalMarkupPercent(markupPercent.toString());
    setLocalMarkupValue(markupValue.toString());
    setLocalUseFixed(useFixed);
    onEndEdit();
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ favorite: !(item.favorite ?? false) });
  };

  const itemName = item.name || item.itemName;
  const isFavorite = item.favorite ?? false;
  const isCustom = item.isCustom ?? false;

  return (
    <div
      style={{
        ...styles.itemRow,
        ...(isHovered ? styles.itemRowHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        style={{
          ...styles.favoriteButton,
          ...(isFavorite ? styles.favoriteActive : {}),
        }}
        onClick={toggleFavorite}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? (
          <Star size={16} fill="currentColor" />
        ) : (
          <StarOff size={16} />
        )}
      </button>

      <div style={{ flex: 1 }}>
        <div style={styles.itemName}>{itemName}</div>
        {item.category && (
          <div style={styles.itemCategory}>{item.category}</div>
        )}
      </div>

      {item.ttValue !== undefined && item.ttValue > 0 && (
        <div
          style={{
            fontSize: "12px",
            color: "hsl(220 13% 50%)",
            minWidth: "60px",
            textAlign: "right",
          }}
        >
          TT: {item.ttValue.toFixed(2)}
        </div>
      )}

      {isEditing ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "10px",
              backgroundColor: "hsl(220 13% 10%)",
              borderRadius: "6px",
              border: "1px solid hsl(220 13% 22%)",
            }}
          >
            {/* Radio buttons for mode selection */}
            <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  checked={!localUseFixed}
                  onChange={() => setLocalUseFixed(false)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ color: "hsl(220 13% 70%)" }}>Percentage</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  checked={localUseFixed}
                  onChange={() => setLocalUseFixed(true)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ color: "hsl(220 13% 70%)" }}>Fixed PED</span>
              </label>
            </div>
            {/* Only show relevant input based on selection */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "12px",
                  color: "hsl(220 13% 50%)",
                  minWidth: "35px",
                }}
              >
                {localUseFixed ? "PED:" : "%:"}
              </span>
              <input
                type="number"
                value={localUseFixed ? localMarkupValue : localMarkupPercent}
                onChange={(e) =>
                  localUseFixed
                    ? setLocalMarkupValue(e.target.value)
                    : setLocalMarkupPercent(e.target.value)
                }
                style={{
                  width: "80px",
                  padding: "6px 10px",
                  backgroundColor: "hsl(220 13% 15%)",
                  border: "1px solid hsl(220 13% 25%)",
                  borderRadius: "6px",
                  color: "hsl(0 0% 95%)",
                  fontSize: "13px",
                  textAlign: "right",
                  outline: "none",
                }}
                step={localUseFixed ? "1" : "0.1"}
                min="0"
                placeholder={localUseFixed ? "0" : "100"}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={handleSave}
              style={{
                padding: "6px 10px",
                backgroundColor: "hsl(142 76% 36%)",
                border: "1px solid hsl(142 76% 46%)",
                borderRadius: "4px",
                color: "white",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Save"
            >
              <Check size={12} />
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: "6px 10px",
                backgroundColor: "hsl(220 13% 14%)",
                border: "1px solid hsl(220 13% 22%)",
                borderRadius: "4px",
                color: "hsl(220 13% 70%)",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.itemMarkup}>
            {useFixed
              ? `+${markupValue.toFixed(2)} PED`
              : `${markupPercent.toFixed(1)}%`}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            style={{
              padding: "4px 8px",
              backgroundColor: "hsl(220 13% 14%)",
              border: "1px solid hsl(220 13% 22%)",
              borderRadius: "4px",
              color: "hsl(220 70% 70%)",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s",
            }}
            title="Edit markup"
          >
            <Edit2 size={12} />
          </button>
          {viewMode === "ignored" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ ignored: false });
              }}
              style={{
                padding: "4px 8px",
                backgroundColor: "hsl(142 71% 35%)",
                border: "1px solid hsl(142 71% 45%)",
                borderRadius: "4px",
                color: "white",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s",
              }}
              title="Unignore item"
            >
              <Eye size={12} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ ignored: true });
              }}
              style={{
                padding: "4px 8px",
                backgroundColor: "hsl(220 13% 14%)",
                border: "1px solid hsl(220 13% 22%)",
                borderRadius: "4px",
                color: "hsl(0 60% 60%)",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s",
              }}
              title="Ignore item"
            >
              <EyeOff size={12} />
            </button>
          )}
        </>
      )}

      {isCustom && (
        <div
          style={{
            padding: "2px 6px",
            backgroundColor: "hsl(220 60% 30%)",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 500,
            color: "hsl(220 70% 80%)",
          }}
        >
          Custom
        </div>
      )}
    </div>
  );
}

// ==================== Settings View (disabled) ====================
/*
interface SettingsViewProps {
  config: MarkupConfig | null;
  onSaveConfig: (updates: Partial<MarkupConfig>) => Promise<boolean>;
}

function SettingsView({ config, onSaveConfig }: SettingsViewProps) {
  const [defaultMarkup, setDefaultMarkup] = useState(
    config?.defaultMarkupPercent?.toString() ?? "100"
  );

  const handleDefaultMarkupSubmit = async () => {
    const value = parseFloat(defaultMarkup);
    if (!isNaN(value) && value >= 0) {
      await onSaveConfig({ defaultMarkupPercent: value });
    }
  };

  if (!config) {
    return (
      <div style={styles.loadingOverlay}>
        <RefreshCw size={24} style={styles.spinner} />
      </div>
    );
  }

  const isEnabled = config.enabled ?? false;
  const showMarkupInUI = config.showMarkupInUI ?? true;

  return (
    <div style={styles.settingsSection}>
      <div style={styles.settingRow}>
        <div style={styles.settingLabel}>
          <span style={styles.settingTitle}>Enable Markup Calculations</span>
          <span style={styles.settingDescription}>
            Include markup values in profit calculations
          </span>
        </div>
        <div
          style={{
            ...styles.toggle,
            ...(isEnabled ? styles.toggleActive : {}),
          }}
          onClick={() => onSaveConfig({ enabled: !isEnabled })}
        >
          <div
            style={{
              ...styles.toggleHandle,
              ...(isEnabled ? styles.toggleHandleActive : {}),
            }}
          />
        </div>
      </div>

      <div style={styles.settingRow}>
        <div style={styles.settingLabel}>
          <span style={styles.settingTitle}>Show Markup in UI</span>
          <span style={styles.settingDescription}>
            Display markup-adjusted values alongside TT values
          </span>
        </div>
        <div
          style={{
            ...styles.toggle,
            ...(showMarkupInUI ? styles.toggleActive : {}),
          }}
          onClick={() => onSaveConfig({ showMarkupInUI: !showMarkupInUI })}
        >
          <div
            style={{
              ...styles.toggleHandle,
              ...(showMarkupInUI ? styles.toggleHandleActive : {}),
            }}
          />
        </div>
      </div>

      <div style={styles.settingRow}>
        <div style={styles.settingLabel}>
          <span style={styles.settingTitle}>Default Markup</span>
          <span style={styles.settingDescription}>
            Applied to items without custom markup set
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="number"
            value={defaultMarkup}
            onChange={(e) => setDefaultMarkup(e.target.value)}
            onBlur={handleDefaultMarkupSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleDefaultMarkupSubmit()}
            style={{ ...styles.markupInput, width: "70px" }}
            step="0.1"
            min="0"
          />
          <span style={{ color: "hsl(220 13% 50%)", fontSize: "13px" }}>%</span>
        </div>
      </div>
    </div>
  );
}
*/

// ==================== Main Component ====================

export function MarkupManager({
  onClose,
  onMarkupChange,
  sessionLoot,
}: MarkupManagerProps) {
  const { library, config, stats, loading, error, updateItem, searchItems } =
    useMarkupLibrary();

  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItemMarkupEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showAddItems, setShowAddItems] = useState(false);
  const [addItemsText, setAddItemsText] = useState("");
  const [addingItems, setAddingItems] = useState(false);

  // Calculate recent loot items that need markup attention
  const recentLootItems = useMemo(() => {
    if (!sessionLoot || !library) return { items: [], unmarkedCount: 0 };

    const items: Array<{
      itemName: string;
      count: number;
      totalValue: number;
      quantity: number;
      markupPercent: number;
      isCustom: boolean;
      hasCustomMarkup: boolean;
    }> = [];

    let unmarkedCount = 0;

    for (const [itemName, loot] of Object.entries(sessionLoot)) {
      // Skip shrapnel, universal ammo, and nanocubes - they're always 100%
      if (
        itemName === "Shrapnel" ||
        itemName === "Universal Ammo" ||
        itemName.toLowerCase().includes("nanocube")
      )
        continue;

      const libraryItem = library.items[itemName];
      const hasCustomMarkup = libraryItem?.isCustom === true;
      const markupPercent =
        libraryItem?.markupPercent ?? config?.defaultMarkupPercent ?? 100;

      if (!hasCustomMarkup) {
        unmarkedCount++;
      }

      items.push({
        itemName,
        count: loot.count,
        totalValue: loot.totalValue,
        quantity: loot.quantity,
        markupPercent,
        isCustom: hasCustomMarkup,
        hasCustomMarkup,
      });
    }

    // Sort: unmarked first, then by total value
    items.sort((a, b) => {
      if (a.hasCustomMarkup !== b.hasCustomMarkup) {
        return a.hasCustomMarkup ? 1 : -1; // Unmarked first
      }
      return b.totalValue - a.totalValue; // Then by value
    });

    return { items, unmarkedCount };
  }, [sessionLoot, library, config]);

  // Search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      // Strip square brackets from search query
      const cleanQuery = searchQuery.replace(/^\[|\]$/g, "").trim();
      const results = await searchItems(cleanQuery, {
        limit: 50,
        category: categoryFilter ?? undefined,
      });
      setSearchResults(results);
    }, 150);

    return () => clearTimeout(debounce);
  }, [searchQuery, categoryFilter, searchItems]);

  // Get displayed items
  const displayedItems = useMemo(() => {
    if (searchQuery.trim()) {
      // Merge search results with latest library data to show updated values
      if (library) {
        return searchResults.map((item) => {
          const itemKey = item.name || item.itemName;
          return library.items[itemKey] || item;
        });
      }
      return searchResults;
    }

    if (!library) return [];

    let items = Object.values(library.items);

    // Filter by view mode
    switch (viewMode) {
      case "recent":
        // Recent tab shows items from session loot
        // Convert session loot items to ItemMarkupEntry format
        return recentLootItems.items.map((loot) => {
          const libraryItem = library.items[loot.itemName];
          return {
            itemName: loot.itemName,
            name: loot.itemName,
            markupPercent: libraryItem?.markupPercent ?? loot.markupPercent,
            markupValue: libraryItem?.markupValue,
            useFixed: libraryItem?.useFixed,
            isCustom: loot.isCustom,
            ttValue: loot.totalValue,
            category: libraryItem?.category,
            favorite: libraryItem?.favorite,
            source: libraryItem?.source ?? "manual",
            lastUpdated: libraryItem?.lastUpdated ?? Date.now(),
          } as ItemMarkupEntry;
        });
      case "favorites":
        items = items.filter((item) => item.favorite === true);
        break;
      case "custom":
        items = items.filter((item) => item.isCustom === true);
        break;
      case "ignored":
        items = items.filter((item) => item.ignored === true);
        break;
      case "browse":
        // In browse mode, only show items when searching OR when a category is selected
        if (!categoryFilter) {
          // Return empty to show the welcome/search prompt state
          return [];
        }
        break;
      default:
        break;
    }

    // Filter out ignored items from non-ignored views
    if (viewMode !== "ignored") {
      items = items.filter((item) => !item.ignored);
    }

    // Filter by category
    if (categoryFilter) {
      items = items.filter((item) => item.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case "name":
        items.sort((a, b) =>
          (a.name || a.itemName).localeCompare(b.name || b.itemName)
        );
        break;
      case "markup-high":
        items.sort(
          (a, b) => (b.markupPercent ?? 100) - (a.markupPercent ?? 100)
        );
        break;
      case "markup-low":
        items.sort(
          (a, b) => (a.markupPercent ?? 100) - (b.markupPercent ?? 100)
        );
        break;
      case "category":
        items.sort((a, b) =>
          (a.category ?? "").localeCompare(b.category ?? "")
        );
        break;
      case "recent":
        items.sort((a, b) => {
          const dateA = a.lastUpdated
            ? new Date(a.lastUpdated.toString()).getTime()
            : 0;
          const dateB = b.lastUpdated
            ? new Date(b.lastUpdated.toString()).getTime()
            : 0;
          return dateB - dateA;
        });
        break;
    }

    // Limit for performance
    return items.slice(0, 200);
  }, [library, viewMode, searchQuery, searchResults, sortBy, categoryFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!library) return [];
    const cats = new Set<string>();
    Object.values(library.items).forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [library]);

  const handleItemUpdate = useCallback(
    async (
      itemName: string,
      updates: {
        markupPercent?: number;
        markupValue?: number;
        useFixed?: boolean;
        favorite?: boolean;
      }
    ) => {
      await updateItem(itemName, updates);
      // Notify parent that markup changed so session stats can recalculate
      onMarkupChange?.();
    },
    [updateItem, onMarkupChange]
  );

  const handleAddItems = useCallback(async () => {
    if (!addItemsText.trim()) return;

    setAddingItems(true);
    try {
      const lines = addItemsText.split("\n");
      const itemsToAdd: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Strip square brackets
        const itemName = trimmed.replace(/^\[|\]$/g, "").trim();
        if (!itemName) continue;

        // Check for duplicates in library
        if (library?.items[itemName]) {
          console.log(
            `[MarkupManager] Item "${itemName}" already exists, skipping`
          );
          continue;
        }

        itemsToAdd.push(itemName);
      }

      // Add all new items
      for (const itemName of itemsToAdd) {
        await updateItem(itemName, {
          markupPercent: config?.defaultMarkupPercent ?? 100,
        });
      }

      // Success - clear form and close
      setAddItemsText("");
      setShowAddItems(false);
      onMarkupChange?.();

      console.log(`[MarkupManager] Added ${itemsToAdd.length} new items`);
    } catch (e) {
      console.error("[MarkupManager] Failed to add items:", e);
    } finally {
      setAddingItems(false);
    }
  }, [addItemsText, library, config, updateItem, onMarkupChange]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingOverlay}>
          <RefreshCw
            size={24}
            style={styles.spinner}
            color="hsl(220 13% 55%)"
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Error display */}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "hsl(0 70% 20%)",
            borderRadius: "6px",
            color: "hsl(0 70% 80%)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Unified Single Toolbar */}
      <div style={styles.unifiedToolbar}>
        {/* Title */}
        <div style={styles.toolbarTitle}>
          <Package size={16} color="hsl(142 71% 55%)" />
          Markup Library
        </div>

        <div style={styles.toolbarDivider} />

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(viewMode === "browse" ? styles.tabActive : {}),
            }}
            onClick={() => setViewMode("browse")}
          >
            Browse
          </button>
          <button
            style={{
              ...styles.tab,
              ...(viewMode === "recent" ? styles.tabActive : {}),
              position: "relative",
            }}
            onClick={() => setViewMode("recent")}
          >
            <Clock size={12} /> Recent
            {recentLootItems.unmarkedCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "hsl(45 93% 50%)",
                  color: "hsl(220 13% 10%)",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={`${recentLootItems.unmarkedCount} items need markup`}
              >
                {recentLootItems.unmarkedCount > 9
                  ? "!"
                  : recentLootItems.unmarkedCount}
              </span>
            )}
          </button>
          <button
            style={{
              ...styles.tab,
              ...(viewMode === "favorites" ? styles.tabActive : {}),
            }}
            onClick={() => setViewMode("favorites")}
          >
            <Star size={12} /> Favs
          </button>
          <button
            style={{
              ...styles.tab,
              ...(viewMode === "custom" ? styles.tabActive : {}),
            }}
            onClick={() => setViewMode("custom")}
          >
            <Percent size={12} /> Custom
          </button>
          <button
            style={{
              ...styles.tab,
              ...(viewMode === "ignored" ? styles.tabActive : {}),
            }}
            onClick={() => setViewMode("ignored")}
          >
            <EyeOff size={12} /> Ignored
          </button>
        </div>

        <div style={styles.toolbarDivider} />

        {/* Inline Stats - left side */}
        {stats && (
          <div style={styles.inlineStat}>
            <span style={styles.inlineStatValue}>
              {(stats.totalItems ?? 0).toLocaleString()}
            </span>{" "}
            items
          </div>
        )}

        {/* Spacer to push search/filters right */}
        <div style={{ flex: 1 }} />

        {/* Search - hide on Recent tab */}
        {viewMode !== "recent" && (
          <div style={styles.searchContainer}>
            <Search size={14} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        )}

        {/* Category filter - hide on Recent tab */}
        {viewMode !== "recent" && categories.length > 0 && (
          <select
            value={categoryFilter ?? ""}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            style={{
              ...styles.button,
              cursor: "pointer",
              backgroundColor: categoryFilter
                ? "hsl(220 13% 22%)"
                : "hsl(220 13% 15%)",
              color: "hsl(0 0% 90%)",
              minWidth: "90px",
            }}
          >
            <option
              value=""
              style={{
                backgroundColor: "hsl(220 13% 12%)",
                color: "hsl(0 0% 90%)",
              }}
            >
              All
            </option>
            {categories.map((cat) => (
              <option
                key={cat}
                value={cat}
                style={{
                  backgroundColor: "hsl(220 13% 12%)",
                  color: "hsl(0 0% 90%)",
                }}
              >
                {cat}
              </option>
            ))}
          </select>
        )}

        {/* Sort dropdown - hide on Recent tab */}
        {viewMode !== "recent" && (
          <div style={styles.filterDropdown}>
            <button
              style={styles.button}
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <Filter size={12} />
              <ChevronDown size={10} />
            </button>
            {showSortMenu && (
              <div style={styles.dropdownMenu}>
                {[
                  { value: "name", label: "Name A-Z" },
                  { value: "markup-high", label: "Markup: High" },
                  { value: "markup-low", label: "Markup: Low" },
                  { value: "category", label: "Category" },
                  { value: "recent", label: "Recent" },
                ].map((option) => (
                  <button
                    key={option.value}
                    style={{
                      ...styles.dropdownItem,
                      ...(sortBy === option.value
                        ? styles.dropdownItemActive
                        : {}),
                    }}
                    onClick={() => {
                      setSortBy(option.value as SortOption);
                      setShowSortMenu(false);
                    }}
                  >
                    {sortBy === option.value && <Check size={12} />}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Items button */}
        <button
          style={{
            ...styles.button,
            backgroundColor: "hsl(142 71% 35%)",
            border: "1px solid hsl(142 71% 45%)",
            color: "white",
          }}
          onClick={() => setShowAddItems(true)}
          title="Add new items to library"
        >
          <Plus size={12} />
          Add Items
        </button>

        {/* Close button */}
        {onClose && (
          <button style={styles.buttonIcon} onClick={onClose}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {displayedItems.length === 0 ? (
          <div style={styles.emptyState}>
            {searchQuery ? (
              <>
                <Search size={48} style={styles.emptyIcon} />
                <div style={styles.emptyTitle}>No items found</div>
                <div style={styles.emptyDescription}>
                  Try a different search term or check the spelling
                </div>
              </>
            ) : viewMode === "recent" ? (
              <>
                <Clock size={48} style={styles.emptyIcon} />
                <div style={styles.emptyTitle}>No session loot yet</div>
                <div style={styles.emptyDescription}>
                  Start hunting! Loot items from your current session will
                  appear here automatically.
                </div>
              </>
            ) : viewMode === "favorites" ? (
              <>
                <Star size={48} style={styles.emptyIcon} />
                <div style={styles.emptyTitle}>No favorites yet</div>
                <div style={styles.emptyDescription}>
                  Search for items and click the star to add them here for quick
                  access
                </div>
              </>
            ) : viewMode === "custom" ? (
              <>
                <Percent size={48} style={styles.emptyIcon} />
                <div style={styles.emptyTitle}>No custom markups set</div>
                <div style={styles.emptyDescription}>
                  Search for items and edit their markup percentages to track
                  market values
                </div>
              </>
            ) : viewMode === "ignored" ? (
              <>
                <EyeOff size={48} style={styles.emptyIcon} />
                <div style={styles.emptyTitle}>No ignored items</div>
                <div style={styles.emptyDescription}>
                  Items you ignore will appear here. You can unignore them at
                  any time.
                </div>
              </>
            ) : (
              <>
                <Search
                  size={48}
                  style={{ ...styles.emptyIcon, opacity: 0.8 }}
                />
                <div
                  style={{
                    ...styles.emptyTitle,
                    fontSize: "18px",
                    marginBottom: "12px",
                  }}
                >
                  Search the Item Database
                </div>
                <div
                  style={{
                    ...styles.emptyDescription,
                    maxWidth: "340px",
                    lineHeight: "1.5",
                  }}
                >
                  Use the search box above to find items from the{" "}
                  {stats?.totalItems?.toLocaleString() || "15,000+"} item
                  database. Set markup percentages and save favorites for quick
                  access.
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "24px",
                    marginTop: "32px",
                    color: "hsl(220 13% 55%)",
                    fontSize: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Star size={14} color="hsl(45 93% 60%)" />
                    Star favorites
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Percent size={14} color="hsl(142 71% 55%)" />
                    Set markups
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={styles.itemList}>
            {displayedItems.map((item) => {
              const itemKey = item.name || item.itemName;
              return (
                <ItemRow
                  key={itemKey}
                  item={item}
                  onUpdate={(updates) => handleItemUpdate(itemKey, updates)}
                  isEditing={editingItem === itemKey}
                  onStartEdit={() => setEditingItem(itemKey)}
                  onEndEdit={() => setEditingItem(null)}
                  viewMode={viewMode}
                />
              );
            })}
            {displayedItems.length >= 200 && (
              <div
                style={{
                  padding: "12px",
                  textAlign: "center",
                  color: "hsl(220 13% 45%)",
                  fontSize: "12px",
                }}
              >
                Showing first 200 items. Use search to find specific items.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Items Modal */}
      {showAddItems && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddItems(false)}
        >
          <div
            style={{
              backgroundColor: "hsl(220 13% 12%)",
              borderRadius: "8px",
              padding: "20px",
              width: "500px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "hsl(0 0% 95%)",
                  margin: 0,
                }}
              >
                Add New Items
              </h3>
              <button
                style={{
                  ...styles.buttonIcon,
                  backgroundColor: "transparent",
                  border: "none",
                }}
                onClick={() => setShowAddItems(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "hsl(220 13% 55%)",
                marginBottom: "12px",
                lineHeight: "1.5",
              }}
            >
              Paste item names below, one per line. Square brackets will be
              automatically stripped.
              <br />
              Example:{" "}
              <code style={{ color: "hsl(142 71% 55%)" }}>
                [Animal Adrenal Oil]
              </code>
            </div>

            <textarea
              value={addItemsText}
              onChange={(e) => setAddItemsText(e.target.value)}
              placeholder="[Animal Adrenal Oil]&#10;[Lysterium Ingot]&#10;[Sweetstuff]"
              style={{
                width: "100%",
                minHeight: "200px",
                padding: "12px",
                backgroundColor: "hsl(220 13% 8%)",
                border: "1px solid hsl(220 13% 22%)",
                borderRadius: "6px",
                color: "hsl(0 0% 95%)",
                fontSize: "13px",
                fontFamily: "monospace",
                resize: "vertical",
                outline: "none",
                marginBottom: "16px",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                style={{
                  ...styles.button,
                  backgroundColor: "hsl(220 13% 14%)",
                  border: "1px solid hsl(220 13% 22%)",
                }}
                onClick={() => {
                  setAddItemsText("");
                  setShowAddItems(false);
                }}
                disabled={addingItems}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.button,
                  backgroundColor: "hsl(142 71% 35%)",
                  border: "1px solid hsl(142 71% 45%)",
                  color: "white",
                  opacity: addingItems || !addItemsText.trim() ? 0.5 : 1,
                  cursor:
                    addingItems || !addItemsText.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
                onClick={handleAddItems}
                disabled={addingItems || !addItemsText.trim()}
              >
                {addingItems ? "Adding..." : "Add Items"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkupManager;
