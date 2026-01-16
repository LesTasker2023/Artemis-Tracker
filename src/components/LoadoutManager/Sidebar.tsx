/**
 * LoadoutManager - Sidebar Component
 * Left sidebar with filters and search - matching SessionManager style
 */

import React from "react";
import { Search, X, CheckCircle, Star, Grid } from "lucide-react";
import type { FilterState, FilterMode, SortBy } from "./types";

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  loadoutCounts: {
    all: number;
    active: number;
    favorites: number;
  };
}

export function Sidebar({
  filters,
  onFilterChange,
  loadoutCounts,
}: SidebarProps) {
  const filterButtons: {
    mode: FilterMode;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      mode: "all",
      label: "All Loadouts",
      icon: <Grid size={16} />,
      count: loadoutCounts.all,
    },
    {
      mode: "active",
      label: "Active",
      icon: <CheckCircle size={16} />,
      count: loadoutCounts.active,
    },
    {
      mode: "favorites",
      label: "Favorites",
      icon: <Star size={16} />,
      count: loadoutCounts.favorites,
    },
  ];

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: "name-asc", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" },
    { value: "cost-high", label: "Cost: High → Low" },
    { value: "cost-low", label: "Cost: Low → High" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
  ];

  return (
    <div style={styles.container}>
      {/* Search */}
      <div style={styles.section}>
        <div style={styles.searchWrapper}>
          <Search size={14} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search loadouts..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            style={styles.searchInput}
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: "" })}
              style={styles.clearButton}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Modes */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>FILTERS</div>
        {filterButtons.map(({ mode, label, icon, count }) => (
          <button
            key={mode}
            onClick={() => onFilterChange({ mode })}
            style={{
              ...styles.filterButton,
              ...(filters.mode === mode ? styles.filterButtonActive : {}),
            }}
          >
            {icon}
            <span style={styles.filterLabel}>{label}</span>
            <span style={styles.filterCount}>{count}</span>
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>SORT BY</div>
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as SortBy })}
          style={styles.sortSelect}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "220px",
    minWidth: "220px",
    backgroundColor: "hsl(220 13% 9%)",
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: "hsl(220 13% 18%)",
    overflow: "auto",
  },
  section: {
    padding: "16px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "hsl(220 13% 15%)",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "12px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    color: "hsl(220 13% 40%)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "8px 30px 8px 32px",
    backgroundColor: "hsl(220 13% 12%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(220 13% 20%)",
    borderRadius: "6px",
    color: "hsl(0 0% 90%)",
    fontSize: "13px",
    outline: "none",
  },
  clearButton: {
    position: "absolute",
    right: "8px",
    background: "none",
    border: "none",
    color: "hsl(220 13% 45%)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  filterButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 12px",
    marginBottom: "4px",
    background: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: "6px",
    color: "hsl(220 13% 65%)",
    fontSize: "13px",
    fontWeight: 500,
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  filterButtonActive: {
    backgroundColor: "hsl(217 91% 60% / 0.15)",
    borderColor: "hsl(217 91% 60% / 0.3)",
    color: "hsl(217 91% 70%)",
  },
  filterLabel: {
    flex: 1,
  },
  filterCount: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
    backgroundColor: "hsl(220 13% 15%)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  sortSelect: {
    width: "100%",
    padding: "8px 10px",
    backgroundColor: "hsl(220 13% 12%)",
    color: "hsl(0 0% 85%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(220 13% 20%)",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
  },
};
