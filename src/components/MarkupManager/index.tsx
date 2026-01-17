/**
 * MarkupManager - Main Component
 * Clean 3-column layout for managing item markup library
 * Matching SessionManager UI style
 */

import React, { useState, useMemo } from "react";
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
    mode: null,
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

    // If no filter selected and no search query, show nothing
    if (!filters.mode && !filters.searchQuery.trim()) return [];

    const items = library.items;
    const sessionKeys = sessionLoot ? new Set(Object.keys(sessionLoot)) : null;
    let results: ItemWithMeta[] = [];

    // Pre-filter at raw level to avoid enriching everything
    for (const [name, item] of Object.entries(items)) {
      // Quick filter checks before enrichment
      const isInSession = sessionKeys?.has(name) ?? false;
      const needsMarkup = !item.markupPercent || item.markupPercent === 100;

      // Check filter mode (if set)
      let passesFilter = true;
      if (filters.mode) {
        switch (filters.mode) {
          case "session":
            passesFilter = isInSession;
            break;
          case "custom":
            passesFilter = item.isCustom || item.source === "manual";
            break;
          case "favorites":
            passesFilter = !!item.favorite;
            break;
          case "missing":
            passesFilter = needsMarkup;
            break;
          case "hasMarkup":
            passesFilter = !needsMarkup; // Has markup = not missing markup
            break;
          case "ignored":
            passesFilter = !!item.ignored;
            break;
        }
      }

      if (!passesFilter) continue;

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

  const handleSortChange = (sortBy: SortBy) => {
    setFilters({ ...filters, sortBy });
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
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left Sidebar */}
      <Sidebar
        activeFilter={filters.mode}
        onFilterChange={handleFilterChange}
        activeCategory={filters.category}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        stats={stats}
        searchQuery={filters.searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
      />

      {/* Middle - Item List */}
      <div style={styles.listPanel}>
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

      {/* Right - Detail Panel */}
      <DetailPanel
        item={selectedItem}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    height: "100%",
    backgroundColor: "hsl(220 13% 8%)",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    color: "hsl(220 13% 50%)",
    fontSize: "14px",
  },
  listPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  truncationNote: {
    padding: "8px 12px",
    backgroundColor: "hsl(220 13% 12%)",
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    textAlign: "center" as const,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "hsl(220 13% 15%)",
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
