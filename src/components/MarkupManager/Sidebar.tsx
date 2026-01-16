/**
 * MarkupManager - Sidebar Component
 * Filter navigation and stats
 */

import React from "react";
import { Package, Star, Edit, AlertCircle, EyeOff, List } from "lucide-react";
import type { FilterMode } from "./types";

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
}

export function Sidebar({
  activeFilter,
  onFilterChange,
  activeCategory,
  onCategoryChange,
  categories,
  stats,
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

  return (
    <div style={styles.container}>
      {/* Filters Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>FILTERS</div>
        <div style={styles.filterList}>
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
              <span style={styles.filterIcon}>{filter.icon}</span>
              <span style={styles.filterLabel}>{filter.label}</span>
              {filter.count !== undefined && (
                <span style={styles.filterCount}>{filter.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Section */}
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

      {/* Stats Summary */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats.configured}</span>
          <span style={styles.statLabel}>Configured</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats.total}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "220px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    height: "100%",
    overflow: "auto",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "10px",
    fontWeight: 600,
    color: "hsl(220 13% 50%)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  filterList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  filterButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "hsl(220 13% 70%)",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
  },
  filterButtonActive: {
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(0 0% 95%)",
  },
  filterIcon: {
    display: "flex",
    alignItems: "center",
    color: "hsl(220 13% 55%)",
  },
  filterLabel: {
    flex: 1,
    fontWeight: 500,
  },
  filterCount: {
    fontSize: "11px",
    color: "hsl(220 13% 50%)",
    backgroundColor: "hsl(220 13% 14%)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: 600,
  },
  categoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    maxHeight: "300px",
    overflow: "auto",
  },
  categoryButton: {
    padding: "8px 12px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "hsl(220 13% 70%)",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
  },
  categoryButtonActive: {
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(0 0% 95%)",
  },
  stats: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "hsl(220 13% 8%)",
    borderRadius: "6px",
    marginTop: "auto",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: "18px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
  },
  statLabel: {
    fontSize: "10px",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statDivider: {
    width: "1px",
    height: "30px",
    backgroundColor: "hsl(220 13% 20%)",
  },
};
