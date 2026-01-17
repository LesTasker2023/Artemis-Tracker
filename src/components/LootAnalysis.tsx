/**
 * ARTEMIS v3 - Loot Analysis
 * Focus: What am I getting? What's worth farming?
 */

import React, { useState } from "react";
import {
  Package,
  DollarSign,
  TrendingUp,
  Search,
  ArrowUpDown,
  Edit2,
  Check,
  X,
  EyeOff,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import type { SessionStats } from "../core/session";
import type { MarkupLibrary, MarkupConfig } from "../core/markup";
import {
  HeroCard,
  HeroGrid,
  EmptyState,
  colors,
  spacing,
  radius,
  typography,
} from "./ui";

interface LootAnalysisProps {
  stats: SessionStats | null;
  markupLibrary?: MarkupLibrary | null;
  markupConfig?: MarkupConfig | null;
  onUpdateMarkup?: (
    itemName: string,
    updates: {
      markupPercent?: number;
      markupValue?: number;
      useFixed?: boolean;
      ignored?: boolean;
    }
  ) => void;
  onRefreshMarkup?: () => Promise<void>;
}

type SortKey = "value" | "quantity" | "name";

export function LootAnalysis({
  stats,
  markupLibrary,
  markupConfig,
  onUpdateMarkup,
  onRefreshMarkup,
}: LootAnalysisProps) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editMarkupPercent, setEditMarkupPercent] = useState("");
  const [editMarkupValue, setEditMarkupValue] = useState("");
  const [editUseFixed, setEditUseFixed] = useState(false);

  // Add to library modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [addTtValue, setAddTtValue] = useState("");
  const [addMarkupPercent, setAddMarkupPercent] = useState("100");
  const [addMarkupValue, setAddMarkupValue] = useState("");
  const [addUseFixed, setAddUseFixed] = useState(false);
  const [addingInProgress, setAddingInProgress] = useState(false);

  // TEST MODE: Set to true to test "Add to Library" button on all items
  const [testMode, setTestMode] = useState(false);

  if (!stats || stats.loot.totalItems === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No Loot Tracked Yet"
        subtitle="Loot will appear here as creatures drop items"
      />
    );
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleAddToLibrary = (itemName: string) => {
    setAddingItem(itemName);
    setAddTtValue("");
    setAddMarkupPercent("100");
    setAddMarkupValue("");
    setAddUseFixed(false);
    setShowAddModal(true);
  };

  const handleSaveNewItem = async () => {
    if (!addingItem) return;

    const ttValue = parseFloat(addTtValue);
    if (isNaN(ttValue) || ttValue < 0) {
      alert("Please enter a valid TT value");
      return;
    }

    setAddingInProgress(true);

    try {
      const result = await window.electron?.markup.addManualItem(
        addingItem,
        ttValue,
        addUseFixed ? undefined : parseFloat(addMarkupPercent),
        addUseFixed ? parseFloat(addMarkupValue) : undefined
      );

      if (result?.success) {
        // Refresh markup library
        if (onRefreshMarkup) {
          await onRefreshMarkup();
        }
        setShowAddModal(false);
        setAddingItem(null);
        alert(`✓ ${addingItem} has been added to the library!`);
      } else {
        alert(`Failed to add item: ${result?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("[LootAnalysis] Failed to add item:", error);
      alert("Failed to add item. See console for details.");
    } finally {
      setAddingInProgress(false);
    }
  };

  const handleCancelAddItem = () => {
    setShowAddModal(false);
    setAddingItem(null);
  };

  const handleDeleteItem = async (itemName: string) => {
    if (
      !confirm(
        `Delete "${itemName}" from the markup library?\n\nThis will remove all markup settings for this item.`
      )
    ) {
      return;
    }

    try {
      const result = await window.electron?.markup.deleteItem(itemName);

      if (result?.success) {
        // Refresh markup library
        if (onRefreshMarkup) {
          await onRefreshMarkup();
        }
        alert(`✓ ${itemName} has been removed from the library.`);
      } else {
        alert(`Failed to delete item: ${result?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("[LootAnalysis] Failed to delete item:", error);
      alert("Failed to delete item. See console for details.");
    }
  };

  // Key metrics
  const avgLootPerKill = stats.kills > 0 ? stats.lootValue / stats.kills : 0;
  const lootPerHour =
    stats.duration > 0 ? (stats.lootValue / stats.duration) * 3600 : 0;

  // Loot composition
  const shrapnelPct =
    stats.lootValue > 0
      ? (stats.loot.shrapnelValue / stats.lootValue) * 100
      : 0;
  const ammoPct =
    stats.lootValue > 0 ? (stats.loot.ammoValue / stats.lootValue) * 100 : 0;
  const resourcesPct = 100 - shrapnelPct - ammoPct;
  const resourcesValue =
    stats.lootValue - stats.loot.shrapnelValue - stats.loot.ammoValue;

  // Return rate color
  const returnColor =
    stats.returnRate >= 100
      ? colors.success
      : stats.returnRate >= 85
      ? colors.warning
      : colors.danger;

  // Sort items
  const sortedItems = Object.values(stats.loot.byItem)
    .filter((item) =>
      searchQuery
        ? item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "value":
          return (b.totalValue - a.totalValue) * dir;
        case "quantity":
          return (b.quantity - a.quantity) * dir;
        case "name":
          return a.itemName.localeCompare(b.itemName) * dir;
        default:
          return 0;
      }
    });

  // Top 5 valuable non-shrapnel items
  const topItems = sortedItems
    .filter((i) => !i.itemName.toLowerCase().includes("shrapnel"))
    .slice(0, 5);

  return (
    <div style={styles.container}>
      {/* Hero Stats */}
      <HeroGrid>
        <HeroCard
          icon={DollarSign}
          label="TOTAL LOOT"
          value={stats.lootValue.toFixed(2)}
          unit="PED"
          color={colors.success}
        />
        <HeroCard
          icon={TrendingUp}
          label="RETURN RATE"
          value={`${stats.returnRate.toFixed(1)}%`}
          color={returnColor}
        />
        <HeroCard
          icon={Package}
          label="PED / KILL"
          value={avgLootPerKill.toFixed(2)}
          color={colors.info}
        />
        <HeroCard
          icon={DollarSign}
          label="PED / HOUR"
          value={lootPerHour.toFixed(0)}
          color={colors.purple}
        />
      </HeroGrid>

      {/* Loot Composition Bar */}
      <div style={styles.compositionPanel}>
        <div style={styles.compositionHeader}>
          <span style={styles.compositionTitle}>LOOT COMPOSITION</span>
          <span style={styles.compositionSubtitle}>
            {resourcesPct.toFixed(0)}% real loot • {shrapnelPct.toFixed(0)}%
            shrapnel
          </span>
        </div>
        <div style={styles.compositionBar}>
          {resourcesPct > 0 && (
            <div
              style={{
                ...styles.compositionSegment,
                width: `${resourcesPct}%`,
                backgroundColor: colors.success,
              }}
              title={`Resources: ${resourcesValue.toFixed(2)} PED`}
            />
          )}
          {ammoPct > 0 && (
            <div
              style={{
                ...styles.compositionSegment,
                width: `${ammoPct}%`,
                backgroundColor: colors.info,
              }}
              title={`Ammo: ${stats.loot.ammoValue.toFixed(2)} PED`}
            />
          )}
          {shrapnelPct > 0 && (
            <div
              style={{
                ...styles.compositionSegment,
                width: `${shrapnelPct}%`,
                backgroundColor: colors.textMuted,
              }}
              title={`Shrapnel: ${stats.loot.shrapnelValue.toFixed(2)} PED`}
            />
          )}
        </div>
        <div style={styles.compositionLegend}>
          <span>
            <span style={{ color: colors.success }}>●</span> Resources{" "}
            {resourcesValue.toFixed(2)}
          </span>
          <span>
            <span style={{ color: colors.info }}>●</span> Ammo{" "}
            {stats.loot.ammoValue.toFixed(2)}
          </span>
          <span>
            <span style={{ color: colors.textMuted }}>●</span> Shrapnel{" "}
            {stats.loot.shrapnelValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Top Valuable Items */}
      {topItems.length > 0 && (
        <div style={styles.topItemsPanel}>
          <div style={styles.topItemsHeader}>TOP VALUABLE ITEMS</div>
          <div style={styles.topItemsList}>
            {topItems.map((item, idx) => {
              const pct =
                stats.lootValue > 0
                  ? (item.totalValue / stats.lootValue) * 100
                  : 0;
              return (
                <div key={item.itemName} style={styles.topItem}>
                  <div style={styles.topItemRank}>#{idx + 1}</div>
                  <div style={styles.topItemName}>{item.itemName}</div>
                  <div style={styles.topItemValue}>
                    {item.totalValue.toFixed(2)} PED
                  </div>
                  <div style={styles.topItemPct}>{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Item List */}
      <div style={styles.itemsPanel}>
        {/* Search & Sort */}
        <div style={styles.controls}>
          <div style={styles.searchBox}>
            <Search size={14} style={{ color: colors.textMuted }} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* TEST MODE TOGGLE */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: colors.warning,
              cursor: "pointer",
              padding: "6px 12px",
              backgroundColor: testMode
                ? "hsl(48 96% 53% / 0.15)"
                : "transparent",
              borderRadius: radius.sm,
              border: testMode
                ? "1px solid hsl(48 96% 53% / 0.3)"
                : "1px solid transparent",
            }}
          >
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            TEST MODE: Show "Add to Library" on all items
          </label>

          <div style={styles.sortButtons}>
            {(["value", "quantity", "name"] as SortKey[]).map((key) => (
              <button
                key={key}
                style={{
                  ...styles.sortButton,
                  backgroundColor:
                    sortKey === key ? "hsl(217 91% 60%)" : "transparent",
                  color: sortKey === key ? colors.bgBase : colors.textSecondary,
                }}
                onClick={() => toggleSort(key)}
              >
                {key === "value"
                  ? "Value"
                  : key === "quantity"
                  ? "Qty"
                  : "Name"}
                {sortKey === key && (
                  <ArrowUpDown size={10} style={{ marginLeft: 4 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div style={styles.itemsHeader}>
          <span style={{ flex: 3 }}>Item</span>
          <span style={{ flex: 1, textAlign: "right" }}>Qty</span>
          <span style={{ flex: 1, textAlign: "right" }}>Value</span>
          <span style={{ flex: 1, textAlign: "right" }}>%</span>
          <span style={{ flex: 1, textAlign: "right" }}>Markup</span>
        </div>
        <div style={styles.itemsList}>
          {sortedItems.map((item) => {
            const pct =
              stats.lootValue > 0
                ? (item.totalValue / stats.lootValue) * 100
                : 0;
            const isShrapnel = item.itemName.toLowerCase().includes("shrapnel");
            const isAmmo = item.itemName.toLowerCase().includes("ammo");
            const isEditing = editingItem === item.itemName;

            // Get markup info from library
            const libraryItem = markupLibrary?.items[item.itemName];
            const itemActuallyExists = !!libraryItem; // Real existence check
            const itemExistsInLibrary = testMode ? false : itemActuallyExists; // TEST MODE: force missing
            const markupPercent =
              libraryItem?.markupPercent ??
              markupConfig?.defaultMarkupPercent ??
              100;
            const markupValue = libraryItem?.markupValue ?? 0;
            const useFixed = libraryItem?.useFixed ?? false;
            const isIgnored = libraryItem?.ignored ?? false;

            const handleStartEdit = () => {
              setEditingItem(item.itemName);
              setEditMarkupPercent(markupPercent.toString());
              setEditMarkupValue(markupValue.toString());
              setEditUseFixed(useFixed);
            };

            const handleSave = () => {
              if (onUpdateMarkup) {
                if (editUseFixed) {
                  const value = parseFloat(editMarkupValue);
                  if (!isNaN(value) && value >= 0) {
                    onUpdateMarkup(item.itemName, {
                      markupValue: value,
                      useFixed: true,
                    });
                  }
                } else {
                  const percent = parseFloat(editMarkupPercent);
                  if (!isNaN(percent) && percent >= 0) {
                    onUpdateMarkup(item.itemName, {
                      markupPercent: percent,
                      useFixed: false,
                    });
                  }
                }
              }
              setEditingItem(null);
            };

            const handleCancel = () => {
              setEditingItem(null);
            };

            // Format markup display
            const markupDisplay = useFixed
              ? `+${markupValue.toFixed(2)} PED`
              : `${markupPercent.toFixed(1)}%`;

            return (
              <div key={item.itemName} style={styles.itemRow}>
                <div
                  style={{
                    flex: 3,
                    color: isShrapnel
                      ? colors.textMuted
                      : isAmmo
                      ? colors.info
                      : colors.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{item.itemName}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: colors.warning,
                      fontWeight: 500,
                    }}
                  >
                    {markupDisplay}
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "right",
                    color: colors.textSecondary,
                  }}
                >
                  {item.quantity.toLocaleString()}
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "right",
                    color: colors.success,
                    fontWeight: 600,
                  }}
                >
                  {item.totalValue.toFixed(2)}
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "right",
                    color: colors.textMuted,
                  }}
                >
                  {pct.toFixed(1)}%
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "right",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          padding: "8px",
                          backgroundColor: "hsl(220 13% 10%)",
                          borderRadius: "6px",
                          border: "1px solid hsl(220 13% 22%)",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <input
                            type="radio"
                            checked={!editUseFixed}
                            onChange={() => setEditUseFixed(false)}
                            style={{ cursor: "pointer" }}
                          />
                          <span
                            style={{
                              color: "hsl(220 13% 70%)",
                              minWidth: "30px",
                            }}
                          >
                            %
                          </span>
                          <input
                            type="number"
                            value={editMarkupPercent}
                            onChange={(e) =>
                              setEditMarkupPercent(e.target.value)
                            }
                            disabled={editUseFixed}
                            style={{
                              width: "60px",
                              padding: "4px 8px",
                              backgroundColor: editUseFixed
                                ? "hsl(220 13% 8%)"
                                : "hsl(220 13% 15%)",
                              border: "1px solid hsl(220 13% 25%)",
                              borderRadius: "4px",
                              color: editUseFixed
                                ? "hsl(220 13% 40%)"
                                : "hsl(0 0% 95%)",
                              fontSize: "12px",
                              outline: "none",
                            }}
                          />
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <input
                            type="radio"
                            checked={editUseFixed}
                            onChange={() => setEditUseFixed(true)}
                            style={{ cursor: "pointer" }}
                          />
                          <span
                            style={{
                              color: "hsl(220 13% 70%)",
                              minWidth: "30px",
                            }}
                          >
                            PED
                          </span>
                          <input
                            type="number"
                            value={editMarkupValue}
                            onChange={(e) => setEditMarkupValue(e.target.value)}
                            disabled={!editUseFixed}
                            style={{
                              width: "60px",
                              padding: "4px 8px",
                              backgroundColor: !editUseFixed
                                ? "hsl(220 13% 8%)"
                                : "hsl(220 13% 15%)",
                              border: "1px solid hsl(220 13% 25%)",
                              borderRadius: "4px",
                              color: !editUseFixed
                                ? "hsl(220 13% 40%)"
                                : "hsl(0 0% 95%)",
                              fontSize: "12px",
                              outline: "none",
                            }}
                          />
                        </label>
                      </div>
                      <button
                        onClick={handleSave}
                        style={{
                          padding: "4px",
                          backgroundColor: "hsl(142 76% 36%)",
                          border: "none",
                          borderRadius: "4px",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={handleCancel}
                        style={{
                          padding: "4px",
                          backgroundColor: "hsl(220 13% 14%)",
                          border: "none",
                          borderRadius: "4px",
                          color: colors.textSecondary,
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      {itemExistsInLibrary ? (
                        <>
                          <button
                            onClick={handleStartEdit}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "transparent",
                              border: "1px solid hsl(220 13% 25%)",
                              borderRadius: "4px",
                              color: colors.info,
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                            title="Edit markup"
                          >
                            <Edit2 size={12} />
                          </button>
                          {isIgnored ? (
                            <button
                              onClick={() => {
                                if (onUpdateMarkup) {
                                  onUpdateMarkup(item.itemName, {
                                    ignored: false,
                                  });
                                }
                              }}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "hsl(142 71% 35%)",
                                border: "1px solid hsl(142 71% 45%)",
                                borderRadius: "4px",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                              title="Unignore item"
                            >
                              <Eye size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (onUpdateMarkup) {
                                  onUpdateMarkup(item.itemName, {
                                    ignored: true,
                                  });
                                }
                              }}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "transparent",
                                border: "1px solid hsl(220 13% 25%)",
                                borderRadius: "4px",
                                color: "hsl(0 60% 60%)",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                              title="Ignore item"
                            >
                              <EyeOff size={12} />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddToLibrary(item.itemName)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "hsl(142 76% 36%)",
                            border: "1px solid hsl(142 76% 45%)",
                            borderRadius: "4px",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Add this item to markup library"
                        >
                          <Plus size={12} />
                          Add to Library
                        </button>
                      )}
                      {/* TEST MODE: Show delete button for items that actually exist */}
                      {testMode && itemActuallyExists && (
                        <button
                          onClick={() => handleDeleteItem(item.itemName)}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "hsl(0 84% 40%)",
                            border: "1px solid hsl(0 84% 50%)",
                            borderRadius: "4px",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "11px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Delete from library (TEST MODE)"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add to Library Modal */}
      {showAddModal && addingItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Item to Library</h3>
              <button onClick={handleCancelAddItem} style={styles.closeButton}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Item Name</label>
                <input
                  type="text"
                  value={addingItem}
                  disabled
                  style={{ ...styles.formInput, opacity: 0.6 }}
                />
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Max TT Value (PED)</label>
                <input
                  type="number"
                  step="0.01"
                  value={addTtValue}
                  onChange={(e) => setAddTtValue(e.target.value)}
                  placeholder="e.g., 10.50"
                  style={styles.formInput}
                  autoFocus
                />
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Markup</label>
                <div style={styles.markupOptions}>
                  <label style={styles.radioOption}>
                    <input
                      type="radio"
                      checked={!addUseFixed}
                      onChange={() => setAddUseFixed(false)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={styles.radioLabel}>Percentage</span>
                    <input
                      type="number"
                      step="0.1"
                      value={addMarkupPercent}
                      onChange={(e) => setAddMarkupPercent(e.target.value)}
                      disabled={addUseFixed}
                      placeholder="100"
                      style={{
                        ...styles.formInput,
                        width: "80px",
                        marginLeft: "8px",
                        opacity: addUseFixed ? 0.5 : 1,
                      }}
                    />
                    <span
                      style={{
                        ...styles.radioLabel,
                        marginLeft: "4px",
                      }}
                    >
                      %
                    </span>
                  </label>

                  <label style={styles.radioOption}>
                    <input
                      type="radio"
                      checked={addUseFixed}
                      onChange={() => setAddUseFixed(true)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={styles.radioLabel}>Fixed Value</span>
                    <input
                      type="number"
                      step="0.01"
                      value={addMarkupValue}
                      onChange={(e) => setAddMarkupValue(e.target.value)}
                      disabled={!addUseFixed}
                      placeholder="0.50"
                      style={{
                        ...styles.formInput,
                        width: "80px",
                        marginLeft: "8px",
                        opacity: !addUseFixed ? 0.5 : 1,
                      }}
                    />
                    <span
                      style={{
                        ...styles.radioLabel,
                        marginLeft: "4px",
                      }}
                    >
                      PED
                    </span>
                  </label>
                </div>
                <div style={styles.helpText}>
                  Percentage: 100% = TT only, 120% = 20% markup
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={handleCancelAddItem}
                style={styles.cancelButton}
                disabled={addingInProgress}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewItem}
                style={styles.saveButton}
                disabled={addingInProgress || !addTtValue}
              >
                {addingInProgress ? "Adding..." : "Save to Library"}
              </button>
            </div>
          </div>
        </div>
      )}
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

  // Composition Bar
  compositionPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  compositionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  compositionTitle: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
  },
  compositionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  compositionBar: {
    display: "flex",
    height: 24,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.bgHover,
  },
  compositionSegment: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  compositionLegend: {
    display: "flex",
    gap: spacing.lg,
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Top Items
  topItemsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  topItemsHeader: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  topItemsList: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  topItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
  },
  topItemRank: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.warning,
    width: 24,
  },
  topItemName: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  topItemValue: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.success,
    fontFamily: typography.mono,
  },
  topItemPct: {
    fontSize: 12,
    color: colors.textMuted,
    width: 50,
    textAlign: "right",
  },

  // Collapse Toggle
  collapseToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textSecondary,
    fontSize: 13,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },

  // Items Panel (Collapsible)
  itemsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
  },
  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: colors.textPrimary,
    fontSize: 13,
    width: 150,
  },
  sortButtons: {
    display: "flex",
    gap: spacing.xs,
  },
  sortButton: {
    padding: `${spacing.xs + 2}px ${spacing.md}px`,
    borderRadius: radius.xs,
    border: "none",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  itemsHeader: {
    display: "flex",
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgHover,
    borderRadius: `${radius.md}px ${radius.md}px 0 0`,
    fontSize: 10,
    fontWeight: 700,
    color: colors.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  itemsList: {
    maxHeight: 300,
    overflow: "auto",
  },
  itemRow: {
    display: "flex",
    padding: `10px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.bgHover}`,
    fontSize: 13,
  },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    width: "90%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.textPrimary,
    margin: 0,
  },
  closeButton: {
    backgroundColor: "transparent",
    border: "none",
    color: colors.textMuted,
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  formInput: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.textPrimary,
    fontSize: 14,
    outline: "none",
  },
  markupOptions: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
  },
  radioOption: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    cursor: "pointer",
    fontSize: 14,
  },
  radioLabel: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  helpText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: spacing.md,
    padding: spacing.lg,
    borderTop: `1px solid ${colors.border}`,
  },
  cancelButton: {
    padding: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  saveButton: {
    padding: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: "hsl(142 76% 36%)",
    border: "1px solid hsl(142 76% 45%)",
    borderRadius: radius.sm,
    color: "white",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
