/**
 * LoadoutManager - Main Index Component
 * 3-column layout matching SessionManager and MarkupManager
 *
 * Layout: Sidebar (220px) | LoadoutList (flex) | DetailPanel (360px)
 */

import React from "react";
import { Sidebar } from "./Sidebar";
import { LoadoutList } from "./LoadoutList";
import { DetailPanel } from "./DetailPanel";
import type { FilterState } from "./types";
import { useLoadouts } from "../../hooks/useLoadouts";
import { createLoadout, type Loadout } from "../../core/loadout";

export function LoadoutManager() {
  // Loadout data
  const { loadouts, activeLoadout, setActive, save, remove } = useLoadouts();

  // UI State
  const [selectedLoadoutId, setSelectedLoadoutId] = React.useState<
    string | null
  >(null);
  const [newLoadoutId, setNewLoadoutId] = React.useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(() => {
    // Load favorites from localStorage
    try {
      const stored = localStorage.getItem("loadout-favorites");
      if (stored) return new Set(JSON.parse(stored));
    } catch {
      // ignore
    }
    return new Set();
  });

  // Filter/Sort State
  const [filters, setFilters] = React.useState<FilterState>({
    searchQuery: "",
    mode: "all",
    sortBy: "name-asc",
  });

  // Save favorites to localStorage
  React.useEffect(() => {
    localStorage.setItem("loadout-favorites", JSON.stringify([...favoriteIds]));
  }, [favoriteIds]);

  // Auto-select first loadout if none selected
  React.useEffect(() => {
    if (loadouts.length > 0 && !selectedLoadoutId) {
      setSelectedLoadoutId(loadouts[0].id);
    }
  }, [loadouts, selectedLoadoutId]);

  // Filter and sort loadouts
  const filteredLoadouts = React.useMemo(() => {
    let result = [...loadouts];

    // Search filter
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.weapon?.name.toLowerCase().includes(q) ||
          l.amp?.name.toLowerCase().includes(q)
      );
    }

    // Mode filter
    if (filters.mode === "active") {
      result = result.filter((l) => l.id === activeLoadout?.id);
    } else if (filters.mode === "favorites") {
      result = result.filter((l) => favoriteIds.has(l.id));
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "cost-high": {
          const costA = getCostForSort(a);
          const costB = getCostForSort(b);
          return costB - costA;
        }
        case "cost-low": {
          const costA = getCostForSort(a);
          const costB = getCostForSort(b);
          return costA - costB;
        }
        case "newest":
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        case "oldest":
          return (a.createdAt ?? 0) - (b.createdAt ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [loadouts, filters, activeLoadout, favoriteIds]);

  // Get selected loadout
  const selectedLoadout = React.useMemo(
    () => loadouts.find((l) => l.id === selectedLoadoutId) ?? null,
    [loadouts, selectedLoadoutId]
  );

  // Handlers
  const handleSelectLoadout = (id: string) => {
    setSelectedLoadoutId(id);
  };

  const handleToggleFavorite = (loadout: Loadout) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(loadout.id)) {
        next.delete(loadout.id);
      } else {
        next.add(loadout.id);
      }
      return next;
    });
  };

  const handleCreateNew = () => {
    const newLoadout = createLoadout("New Loadout");
    save(newLoadout);
    setSelectedLoadoutId(newLoadout.id);
    setNewLoadoutId(newLoadout.id);
  };

  const handleSaveLoadout = (loadout: Loadout) => {
    save(loadout);
    // Clear new loadout flag after first save
    if (loadout.id === newLoadoutId) {
      setNewLoadoutId(null);
    }
  };

  const handleDeleteLoadout = (id: string) => {
    if (confirm("Delete this loadout?")) {
      remove(id);
      if (selectedLoadoutId === id) {
        setSelectedLoadoutId(loadouts.find((l) => l.id !== id)?.id ?? null);
      }
    }
  };

  const handleSetActive = (id: string) => {
    setActive(id);
  };

  const handleDuplicate = (loadout: Loadout) => {
    const copy = createLoadout(`${loadout.name} (Copy)`);
    // Copy all properties except id and name
    const cloned: Loadout = {
      ...loadout,
      id: copy.id,
      name: copy.name,
      createdAt: Date.now(),
    };
    save(cloned);
    setSelectedLoadoutId(cloned.id);
    setNewLoadoutId(cloned.id);
  };

  const handleCloseDetail = () => {
    setSelectedLoadoutId(null);
  };

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // Count loadouts by category
  const loadoutCounts = {
    all: loadouts.length,
    active: activeLoadout ? 1 : 0,
    favorites: loadouts.filter((l) => favoriteIds.has(l.id)).length,
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        loadoutCounts={loadoutCounts}
      />

      {/* Loadout List (middle) */}
      <LoadoutList
        loadouts={filteredLoadouts}
        selectedLoadoutId={selectedLoadoutId}
        activeLoadoutId={activeLoadout?.id ?? null}
        favoriteIds={favoriteIds}
        onSelectLoadout={handleSelectLoadout}
        onToggleFavorite={handleToggleFavorite}
        onCreateNew={handleCreateNew}
      />

      {/* Detail Panel (right) */}
      <DetailPanel
        loadout={selectedLoadout}
        isActive={selectedLoadout?.id === activeLoadout?.id}
        isNewLoadout={selectedLoadoutId === newLoadoutId}
        onSave={handleSaveLoadout}
        onDelete={handleDeleteLoadout}
        onSetActive={handleSetActive}
        onDuplicate={handleDuplicate}
        onClose={handleCloseDetail}
        onClearNew={() => setNewLoadoutId(null)}
      />
    </div>
  );
}

// Helper to get cost for sorting
function getCostForSort(loadout: Loadout): number {
  if (!loadout.weapon) return 0;
  const decay = loadout.weapon.economy?.decay ?? 0;
  const ammoBurn = loadout.weapon.economy?.ammoBurn ?? 0;
  return decay + ammoBurn / 10000;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    display: "flex",
    backgroundColor: "#090d13",
    color: "hsl(0 0% 95%)",
    overflow: "hidden",
  },
};

// Re-export for backward compatibility
export default LoadoutManager;

// Re-export LoadoutDropdown for use elsewhere
export { LoadoutDropdown } from "./LoadoutDropdown";
