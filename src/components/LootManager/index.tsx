/**
 * LootManager - Main Component
 * 3-column layout using MarkupManager components: Stats Sidebar | Loot Item List | Detail Panel
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { SessionStats } from "../../core/session";
import type { MarkupLibrary, MarkupConfig } from "../../core/markup";
import { Sidebar } from "./Sidebar";
import { ItemCard } from "../MarkupManager/ItemCard";
import { DetailPanel } from "../MarkupManager/DetailPanel";
import type { ItemWithMeta } from "../MarkupManager/types";
import { Search, ArrowUpDown, Package, Eye, EyeOff } from "lucide-react";

interface LootManagerProps {
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
      favorite?: boolean;
    }
  ) => void;
  onRefreshMarkup?: () => Promise<void>;
}

export function LootManager({
  stats,
  markupLibrary,
  markupConfig: _markupConfig,
  onUpdateMarkup,
  onRefreshMarkup: _onRefreshMarkup,
}: LootManagerProps) {
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"value" | "quantity" | "name">("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showIgnored, setShowIgnored] = useState(false);

  // Convert stats loot data to ItemWithMeta array
  const lootItems = useMemo((): ItemWithMeta[] => {
    if (!stats?.loot?.byItem) return [];

    return Object.entries(stats.loot.byItem).map(([name, data]) => {
      // Per-unit TT value (total value / quantity)
      const ttValuePerUnit =
        data.quantity > 0 ? data.totalValue / data.quantity : 0;
      const libraryEntry = markupLibrary?.items?.[name];

      const markupPercent = libraryEntry?.markupPercent || 100;
      const markupValue = libraryEntry?.markupValue || 0;
      const useFixed = libraryEntry?.useFixed || false;

      return {
        itemName: name,
        name: name, // UI alias for itemName
        ttValue: ttValuePerUnit,
        markupPercent,
        markupValue,
        useFixed,
        category: libraryEntry?.category || "Unknown",
        source: libraryEntry?.source || "manual",
        lastUpdated: libraryEntry?.lastUpdated || new Date().toISOString(),
        favorite: libraryEntry?.favorite || false,
        ignored: libraryEntry?.ignored || false,
        isCustom: libraryEntry?.isCustom || false,
        quantity: data.quantity,
        sessionValue: data.totalValue,
      };
    });
  }, [stats?.loot?.byItem, markupLibrary]);

  // Filter and sort items
  const displayItems = useMemo(() => {
    let filtered = showIgnored
      ? lootItems
      : lootItems.filter((item) => !item.ignored);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.itemName.toLowerCase().includes(query)
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      let compareA: number | string = 0;
      let compareB: number | string = 0;

      switch (sortBy) {
        case "value":
          compareA = a.sessionValue || 0;
          compareB = b.sessionValue || 0;
          break;
        case "quantity":
          compareA = a.quantity || 0;
          compareB = b.quantity || 0;
          break;
        case "name":
          compareA = a.itemName.toLowerCase();
          compareB = b.itemName.toLowerCase();
          break;
      }

      if (typeof compareA === "string" && typeof compareB === "string") {
        return sortDir === "asc"
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA);
      }

      return sortDir === "asc"
        ? (compareA as number) - (compareB as number)
        : (compareB as number) - (compareA as number);
    });
  }, [lootItems, searchQuery, sortBy, sortDir, showIgnored]);

  // Auto-select first item when list changes
  useEffect(() => {
    if (displayItems.length > 0 && !selectedItemName) {
      setSelectedItemName(displayItems[0].itemName);
    } else if (
      displayItems.length > 0 &&
      !displayItems.find((i) => i.itemName === selectedItemName)
    ) {
      setSelectedItemName(displayItems[0].itemName);
    }
  }, [displayItems, selectedItemName]);

  // Get selected item
  const selectedItem = useMemo(() => {
    return (
      displayItems.find((item) => item.itemName === selectedItemName) || null
    );
  }, [displayItems, selectedItemName]);

  const handleSort = useCallback((key: "value" | "quantity" | "name") => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("desc");
      return key;
    });
  }, []);

  const handleToggleFavorite = useCallback(
    (item: ItemWithMeta) => {
      if (onUpdateMarkup) {
        onUpdateMarkup(item.itemName, {
          favorite: !item.favorite,
        });
      }
    },
    [onUpdateMarkup]
  );

  const handleUpdate = useCallback(
    (itemName: string, updates: Partial<ItemWithMeta>) => {
      if (onUpdateMarkup) {
        onUpdateMarkup(itemName, updates);
      }
    },
    [onUpdateMarkup]
  );

  return (
    <div style={styles.container}>
      {/* Left - Stats Sidebar */}
      <Sidebar
        stats={stats}
        lootItems={lootItems}
        displayItems={displayItems}
        markupLibrary={markupLibrary}
      />

      {/* Middle - Loot List */}
      <div style={styles.listPanel}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.searchContainer}>
            <div style={styles.searchIcon}>
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.controls}>
            <button
              onClick={() => handleSort("value")}
              style={{
                ...styles.sortButton,
                ...(sortBy === "value" ? styles.sortButtonActive : {}),
              }}
              title="Sort by value"
            >
              <ArrowUpDown size={12} />
              Value
              {sortBy === "value" && (
                <span style={styles.sortDir}>
                  {sortDir === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSort("quantity")}
              style={{
                ...styles.sortButton,
                ...(sortBy === "quantity" ? styles.sortButtonActive : {}),
              }}
              title="Sort by quantity"
            >
              <ArrowUpDown size={12} />
              Qty
              {sortBy === "quantity" && (
                <span style={styles.sortDir}>
                  {sortDir === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSort("name")}
              style={{
                ...styles.sortButton,
                ...(sortBy === "name" ? styles.sortButtonActive : {}),
              }}
              title="Sort by name"
            >
              <ArrowUpDown size={12} />
              Name
              {sortBy === "name" && (
                <span style={styles.sortDir}>
                  {sortDir === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowIgnored(!showIgnored)}
              style={{
                ...styles.toggleButton,
                ...(showIgnored ? styles.toggleButtonActive : {}),
              }}
              title={showIgnored ? "Hide ignored items" : "Show ignored items"}
            >
              {showIgnored ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>

        {/* Item List */}
        <div style={styles.list}>
          {displayItems.length === 0 ? (
            <div style={styles.empty}>
              <Package size={32} style={{ opacity: 0.3 }} />
              <p style={styles.emptyText}>
                {searchQuery ? "No items match your search" : "No loot items"}
              </p>
            </div>
          ) : (
            displayItems.map((item) => (
              <ItemCard
                key={item.itemName}
                item={item}
                isSelected={selectedItemName === item.itemName}
                onSelect={(item) => setSelectedItemName(item.itemName)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))
          )}
        </div>
      </div>

      {/* Right - Detail Panel */}
      <DetailPanel item={selectedItem} onUpdate={handleUpdate} readOnlyTT />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    height: "100%",
    backgroundColor: "hsl(220 13% 8%)",
  },
  listPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    borderBottom: "1px solid hsl(220 13% 15%)",
    backgroundColor: "#14161a",
  },
  searchContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    color: "hsl(220 13% 45%)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    fontSize: "13px",
    backgroundColor: "hsl(220 13% 10%)",
    color: "hsl(0 0% 95%)",
    border: "1px solid hsl(220 13% 20%)",
    borderRadius: "6px",
    outline: "none",
  },
  controls: {
    display: "flex",
    gap: "8px",
  },
  sortButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "hsl(220 13% 12%)",
    color: "hsl(220 13% 70%)",
    border: "1px solid hsl(220 13% 20%)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  sortButtonActive: {
    backgroundColor: "hsl(217 91% 60% / 0.15)",
    color: "hsl(217 91% 68%)",
    borderColor: "hsl(217 91% 60% / 0.3)",
  },
  sortDir: {
    fontSize: "14px",
    marginLeft: "2px",
  },
  toggleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "hsl(220 13% 12%)",
    color: "hsl(220 13% 70%)",
    border: "1px solid hsl(220 13% 20%)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  toggleButtonActive: {
    backgroundColor: "hsl(33 100% 50% / 0.15)",
    color: "hsl(33 100% 50%)",
    borderColor: "hsl(33 100% 50% / 0.3)",
  },
  list: {
    flex: 1,
    overflow: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "24px",
    color: "hsl(220 13% 45%)",
  },
  emptyText: {
    fontSize: "13px",
    marginTop: "12px",
    textAlign: "center",
  },
};

export default LootManager;
