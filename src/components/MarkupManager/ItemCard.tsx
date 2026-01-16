/**
 * MarkupManager - Item Card Component
 * Card view for items in the grid
 */

import React from "react";
import { Star, StarOff, ExternalLink } from "lucide-react";
import type { ItemWithMeta } from "./types";
import { formatMarkup, getMarkupColor } from "./utils";

interface ItemCardProps {
  item: ItemWithMeta;
  isSelected: boolean;
  onSelect: (item: ItemWithMeta) => void;
  onToggleFavorite: (item: ItemWithMeta) => void;
}

export function ItemCard({
  item,
  isSelected,
  onSelect,
  onToggleFavorite,
}: ItemCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const markupColor = getMarkupColor(item);
  const markupText = formatMarkup(item);
  const isFavorite = item.favorite ?? false;

  // Map category to Project Delta URL path
  const getCategoryPath = (category?: string): string | null => {
    if (!category) return null;
    const cat = category.toLowerCase();
    if (cat === "material" || cat === "materials") return "materials";
    if (cat === "weapon" || cat === "weapons") return "weapons";
    if (cat === "blueprint" || cat === "blueprints") return "blueprints";
    return null;
  };

  const categoryPath = getCategoryPath(item.category);

  const handleViewOnDelta = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!categoryPath) return;
    const url = `https://www.thedeltaproject.net/${categoryPath}/${encodeURIComponent(item.itemName)}`;
    window.electron?.shell?.openExternal(url);
  };

  return (
    <div
      style={{
        ...styles.row,
        ...(isSelected ? styles.rowSelected : {}),
        ...(isHovered ? styles.rowHover : {}),
      }}
      onClick={() => onSelect(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(item);
        }}
        style={{
          ...styles.favoriteButton,
          color: isFavorite ? "hsl(45 93% 60%)" : "hsl(220 13% 45%)",
        }}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? (
          <Star size={14} fill="currentColor" />
        ) : (
          <StarOff size={14} />
        )}
      </button>

      {/* Item Name */}
      <div style={styles.name} title={item.itemName}>
        {item.itemName}
      </div>

      {/* Badges */}
      <div style={styles.badges}>
        {item.isInSession && <span style={styles.badgeSession}>Looted</span>}
        {(item.isCustom || item.source === "manual") && (
          <span style={styles.badgeCustom}>Custom</span>
        )}
        {item.ignored && <span style={styles.badgeIgnored}>Ignored</span>}
      </div>

      {/* Category */}
      {item.category && <div style={styles.category}>{item.category}</div>}

      {/* TT Value */}
      <div style={styles.ttValue}>
        {item.ttValue !== undefined ? item.ttValue.toFixed(2) : "0.00"}
      </div>

      {/* Markup */}
      <div style={{ ...styles.markup, color: markupColor }}>{markupText}</div>

      {/* View on Project Delta - only for supported categories */}
      {categoryPath ? (
        <button
          onClick={handleViewOnDelta}
          style={styles.viewButton}
          title="View on The Delta Project"
        >
          <ExternalLink size={14} />
        </button>
      ) : (
        <div style={styles.viewPlaceholder} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.1s",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    outline: "none",
  },
  rowHover: {
    backgroundColor: "hsl(220 13% 13%)",
  },
  rowSelected: {
    borderColor: "hsl(217 91% 60%)",
    backgroundColor: "hsl(220 13% 14%)",
  },
  favoriteButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    outline: "none",
  },
  name: {
    flex: 1,
    fontSize: "13px",
    fontWeight: 500,
    color: "hsl(0 0% 95%)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  badges: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  badgeSession: {
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: 500,
    backgroundColor: "hsl(217 91% 60% / 0.2)",
    color: "hsl(217 91% 70%)",
  },
  badgeCustom: {
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: 500,
    backgroundColor: "hsl(142 71% 45% / 0.2)",
    color: "hsl(142 71% 55%)",
  },
  badgeIgnored: {
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: 500,
    backgroundColor: "hsl(220 13% 25%)",
    color: "hsl(220 13% 55%)",
  },
  category: {
    fontSize: "11px",
    color: "hsl(220 13% 50%)",
    minWidth: "80px",
    flexShrink: 0,
  },
  ttValue: {
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    minWidth: "50px",
    textAlign: "right",
    flexShrink: 0,
  },
  markup: {
    fontSize: "13px",
    fontWeight: 600,
    minWidth: "70px",
    textAlign: "right",
    flexShrink: 0,
  },
  viewButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    outline: "none",
    color: "hsl(217 91% 60%)",
    transition: "color 0.1s",
  },
  viewPlaceholder: {
    width: "22px",
    flexShrink: 0,
  },
};
