/**
 * MarkupManager - Sidebar Component
 * Filter navigation and stats - matching SessionManager style
 */

import React from "react";
import { Star, Edit, AlertCircle, EyeOff, Search, X } from "lucide-react";
import type { FilterMode, SortBy } from "./types";

interface SidebarProps {
  activeFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
  stats: {
    total: number;
    configured: number;
    favorites: number;
    custom: number;
    sessionItems: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
}

export function Sidebar({
  activeFilter,
  onFilterChange,
  activeCategory,
  onCategoryChange,
  categories,
  stats,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: SidebarProps) {
  const filters: Array<{
    mode: FilterMode;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      mode: "custom",
      label: "Custom",
      icon: <Edit size={16} />,
      count: stats.custom,
    },
    {
      mode: "favorites",
      label: "Favorites",
      icon: <Star size={16} />,
      count: stats.favorites,
    },
    { mode: "missing", label: "Needs Markup", icon: <AlertCircle size={16} /> },
    { mode: "ignored", label: "Ignored", icon: <EyeOff size={16} /> },
  ];

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: "name", label: "Name A-Z" },
    { value: "category", label: "Category" },
    { value: "markup-high", label: "Markup: High → Low" },
    { value: "markup-low", label: "Markup: Low → High" },
    { value: "recent", label: "Recently Updated" },
  ];

  return (
    <div style={styles.container}>
      {/* Search */}
      <div style={styles.section}>
        <div style={styles.searchWrapper}>
          <Search size={14} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              style={styles.clearButton}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>FILTERS</div>
        {filters.map((filter) => (
          <button
            key={filter.mode}
            onClick={() => onFilterChange(filter.mode)}
            style={{
              ...styles.filterButton,
              ...(activeFilter === filter.mode
                ? styles.filterButtonActive
                : {}),
            }}
          >
            {filter.icon}
            <span style={styles.filterLabel}>{filter.label}</span>
            {filter.count !== undefined && (
              <span style={styles.filterCount}>{filter.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>SORT BY</div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
          style={styles.sortSelect}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories Section */}
      {categories.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>CATEGORIES</div>
          <div style={styles.categoryList}>
            <button
              onClick={() => onCategoryChange(null)}
              style={{
                ...styles.categoryButton,
                ...(activeCategory === null ? styles.categoryButtonActive : {}),
              }}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                style={{
                  ...styles.categoryButton,
                  ...(activeCategory === category
                    ? styles.categoryButtonActive
                    : {}),
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
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
  categoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxHeight: "300px",
    overflow: "auto",
  },
  categoryButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    width: "100%",
    padding: "8px 10px",
    backgroundColor: "hsl(220 13% 12%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(220 13% 18%)",
    borderRadius: "6px",
    color: "hsl(220 13% 65%)",
    fontSize: "12px",
    fontWeight: 500,
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  categoryButtonActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.4)",
    color: "#a5b4fc",
  },
};
