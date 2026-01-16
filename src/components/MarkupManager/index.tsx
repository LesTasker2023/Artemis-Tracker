/**
 * MarkupManager - Main Component
 * Clean 3-column layout for managing item markup library
 */

import React, { useState, useMemo } from "react";
import { Search, RefreshCw } from "lucide-react";
import { useMarkupLibrary } from "../../hooks/useMarkupLibrary";
import { Sidebar } from "./Sidebar";
import { ItemGrid } from "./ItemGrid";
import { DetailPanel } from "./DetailPanel";
import type {
  MarkupManagerProps,
  FilterState,
  ItemWithMeta,
  SortBy,
  FilterMode,
} from "./types";
import { sortItems } from "./utils";

const MAX_DISPLAY_ITEMS = 100;

export function MarkupManager({
  onMarkupChange,
  sessionLoot,
}: MarkupManagerProps) {
  const { library, config, refresh, updateItem, syncFromAPI, loading } =
    useMarkupLibrary();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    mode: "missing",
    category: null,
    searchQuery: "",
    sortBy: "name",
  });

  // Selection state
  const [selectedItem, setSelectedItem] = useState<ItemWithMeta | null>(null);

  // Ready state - only load items after user interaction
  const [isReady, setIsReady] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Get categories directly from library without enrichment (fast)
  const categories = useMemo(() => {
    if (!library?.items) return [];
    const cats = new Set<string>();
    for (const item of Object.values(library.items)) {
      if (item.category && item.category !== "Unknown") {
        cats.add(item.category);
      }
    }
    return Array.from(cats).sort();
  }, [library?.items]);

  // Process items - filter RAW items first, THEN enrich only matching ones
  const displayItems = useMemo(() => {
    if (!isReady || !library?.items) return [];

    const items = library.items;
    const sessionKeys = sessionLoot ? new Set(Object.keys(sessionLoot)) : null;
    let results: ItemWithMeta[] = [];

    // Pre-filter at raw level to avoid enriching everything
    for (const [name, item] of Object.entries(items)) {
      // Quick filter checks before enrichment
      const isInSession = sessionKeys?.has(name) ?? false;
      const needsMarkup = !item.markupPercent || item.markupPercent === 100;

      let passes = false;
      switch (filters.mode) {
        case "session":
          passes = isInSession;
          break;
        case "custom":
          passes = item.isCustom || item.source === "manual";
          break;
        case "favorites":
          passes = !!item.favorite;
          break;
        case "missing":
          passes = needsMarkup;
          break;
        case "ignored":
          passes = !!item.ignored;
          break;
      }

      if (!passes) continue;

      // Category filter
      if (filters.category && item.category !== filters.category) continue;

      // Search filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (!item.itemName.toLowerCase().includes(query)) continue;
      }

      // Enrich only items that pass all filters
      results.push({
        ...item,
        isInSession,
        needsMarkup,
      });

      // Stop early if we have enough
      if (results.length >= MAX_DISPLAY_ITEMS * 2) break;
    }

    return results;
  }, [library?.items, sessionLoot, filters, isReady]);

  // Sort and limit
  const sortedItems = useMemo(
    () => sortItems(displayItems, filters.sortBy).slice(0, MAX_DISPLAY_ITEMS),
    [displayItems, filters.sortBy]
  );

  const stats = useMemo(() => {
    if (!library?.items)
      return {
        total: 0,
        configured: 0,
        favorites: 0,
        custom: 0,
        sessionItems: 0,
      };
    const items = Object.values(library.items);
    const sessionKeys = sessionLoot ? new Set(Object.keys(sessionLoot)) : null;
    return {
      total: items.length,
      configured: items.filter(
        (i) => i.markupPercent && i.markupPercent !== 100
      ).length,
      favorites: items.filter((i) => i.favorite).length,
      custom: items.filter((i) => i.isCustom || i.source === "manual").length,
      sessionItems: sessionKeys
        ? items.filter((i) => sessionKeys.has(i.itemName)).length
        : 0,
    };
  }, [library?.items, sessionLoot]);

  // Track if results are truncated
  const isTruncated = displayItems.length > MAX_DISPLAY_ITEMS;

  // Handlers
  const handleFilterChange = (mode: FilterMode) => {
    setIsReady(true);
    setSelectedItem(null);
    setFilters({ ...filters, mode });
  };

  const handleCategoryChange = (category: string | null) => {
    setIsReady(true);
    setSelectedItem(null);
    setFilters({ ...filters, category });
  };

  const handleSearchChange = (searchQuery: string) => {
    if (searchQuery.trim()) setIsReady(true);
    setFilters({ ...filters, searchQuery });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncFromAPI(true);
      if (onMarkupChange) onMarkupChange();
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateItem = async (
    itemName: string,
    updates: Partial<ItemWithMeta>
  ) => {
    try {
      await updateItem(itemName, updates);
      await refresh(); // Force refresh to update list
      if (onMarkupChange) onMarkupChange();

      // Clear selection if item no longer matches current filter
      if (selectedItem?.itemName === itemName) {
        const shouldClear =
          (filters.mode === "favorites" && updates.favorite === false) ||
          (filters.mode === "ignored" && updates.ignored === false);

        if (shouldClear) {
          setSelectedItem(null);
        } else if (library?.items?.[itemName]) {
          // Update selected item with new data
          const item = library.items[itemName];
          setSelectedItem({
            ...item,
            ...updates,
            isInSession: sessionLoot ? itemName in sessionLoot : false,
            needsMarkup: !item.markupPercent || item.markupPercent === 100,
          } as ItemWithMeta);
        }
      }
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteItem = async (itemName: string) => {
    try {
      // Delete via IPC since not exposed in hook yet
      if (window.electron?.markup.deleteItem) {
        await window.electron.markup.deleteItem(itemName);
        await refresh();
        if (onMarkupChange) onMarkupChange();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleToggleFavorite = async (item: ItemWithMeta) => {
    await handleUpdateItem(item.itemName, { favorite: !item.favorite });
  };

  if (loading || !library || !config) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={32} style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div style={styles.title}>Item Library</div>
          <div style={styles.subtitle}>
            Manage item markup for profit calculations
          </div>
        </div>

        <div style={styles.topBarRight}>
          {/* Search */}
          <div style={styles.searchContainer}>
            <Search size={14} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search items..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: e.target.value as SortBy })
            }
            style={styles.sortSelect}
          >
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="markup-high">Markup (High)</option>
            <option value="markup-low">Markup (Low)</option>
            <option value="recent">Recently Updated</option>
          </select>

          {/* Sync */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={styles.button}
            title="Sync from database"
          >
            <RefreshCw
              size={14}
              style={isSyncing ? styles.spinner : undefined}
            />
          </button>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div style={styles.content}>
        {/* Left: Sidebar */}
        <Sidebar
          activeFilter={filters.mode}
          onFilterChange={handleFilterChange}
          activeCategory={filters.category}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          stats={stats}
        />

        {/* Center: Item Grid */}
        <div style={styles.centerColumn}>
          <ItemGrid
            items={sortedItems}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onToggleFavorite={handleToggleFavorite}
            emptyMessage={
              !isReady
                ? "Select a filter, category, or search to view items"
                : filters.mode === "session"
                ? "No items from current session"
                : filters.searchQuery
                ? "No items match your search"
                : "No items to display"
            }
          />
          {isTruncated && (
            <div style={styles.truncationNote}>
              Showing {MAX_DISPLAY_ITEMS} of {displayItems.length}+ items. Use
              search to narrow results.
            </div>
          )}
        </div>

        {/* Right: Detail Panel */}
        <DetailPanel
          item={selectedItem}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    backgroundColor: "hsl(220 13% 8%)",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  spinner: {
    color: "hsl(217 91% 60%)",
    animation: "spin 1s linear infinite",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  topBarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
  },
  subtitle: {
    fontSize: "13px",
    color: "hsl(220 13% 55%)",
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  searchContainer: {
    position: "relative",
    minWidth: "240px",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "hsl(220 13% 45%)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px 8px 34px",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    color: "hsl(0 0% 95%)",
    fontSize: "13px",
    outline: "none",
  },
  sortSelect: {
    padding: "8px 12px",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    color: "hsl(0 0% 95%)",
    fontSize: "13px",
    cursor: "pointer",
    outline: "none",
  },
  button: {
    padding: "8px 12px",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 22%)",
    borderRadius: "6px",
    color: "hsl(0 0% 90%)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  content: {
    display: "flex",
    gap: "16px",
    flex: 1,
    overflow: "hidden",
  },
  centerColumn: {
    flex: 1,
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    padding: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  truncationNote: {
    padding: "8px 12px",
    marginTop: "8px",
    backgroundColor: "hsl(220 13% 15%)",
    borderRadius: "6px",
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    textAlign: "center" as const,
  },
};

// Add spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
