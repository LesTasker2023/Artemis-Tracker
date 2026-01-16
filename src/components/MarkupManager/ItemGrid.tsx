/**
 * MarkupManager - Item Grid Component
 * Main grid view of items
 */

import React from "react";
import { Package } from "lucide-react";
import type { ItemWithMeta } from "./types";
import { ItemCard } from "./ItemCard";

interface ItemGridProps {
  items: ItemWithMeta[];
  selectedItem: ItemWithMeta | null;
  onSelectItem: (item: ItemWithMeta) => void;
  onToggleFavorite: (item: ItemWithMeta) => void;
  emptyMessage?: string;
}

export function ItemGrid({
  items,
  selectedItem,
  onSelectItem,
  onToggleFavorite,
  emptyMessage = "No items found",
}: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div style={styles.empty}>
        <Package size={48} style={styles.emptyIcon} />
        <div style={styles.emptyTitle}>{emptyMessage}</div>
        <div style={styles.emptySubtitle}>
          Try adjusting your filters or search query
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Row */}
      <div style={styles.header}>
        <div style={styles.headerFavorite}></div>
        <div style={styles.headerName}>Name</div>
        <div style={styles.headerBadges}></div>
        <div style={styles.headerCategory}>Category</div>
        <div style={styles.headerTT}>TT Value</div>
        <div style={styles.headerMarkup}>Markup</div>
        <div style={styles.headerView}>View</div>
      </div>
      <div style={styles.grid}>
        {items.map((item) => (
          <ItemCard
            key={item.itemName}
            item={item}
            isSelected={selectedItem?.itemName === item.itemName}
            onSelect={onSelectItem}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
      <div style={styles.footer}>
        Showing {items.length} item{items.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: "8px",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    overflow: "auto",
    padding: "4px",
  },
  footer: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    textAlign: "center",
    padding: "8px",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "48px 24px",
    textAlign: "center",
  },
  emptyIcon: {
    color: "hsl(220 13% 35%)",
    marginBottom: "16px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: 500,
    color: "hsl(220 13% 60%)",
    marginBottom: "8px",
  },
  emptySubtitle: {
    fontSize: "13px",
    color: "hsl(220 13% 50%)",
    maxWidth: "300px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "hsl(220 13% 20%)",
    marginLeft: "4px",
    marginRight: "4px",
  },
  headerFavorite: {
    width: "22px",
    flexShrink: 0,
  },
  headerName: {
    flex: 1,
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  headerBadges: {
    minWidth: "120px",
    flexShrink: 0,
  },
  headerCategory: {
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minWidth: "80px",
    flexShrink: 0,
  },
  headerTT: {
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minWidth: "50px",
    textAlign: "right",
    flexShrink: 0,
  },
  headerMarkup: {
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minWidth: "70px",
    textAlign: "right",
    flexShrink: 0,
  },
  headerView: {
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    width: "22px",
    flexShrink: 0,
    textAlign: "center",
  },
};
