/**
 * LoadoutManager - Loadout List Component
 * Middle panel showing list of loadout cards - matching SessionList style
 */

import React from "react";
import { Plus } from "lucide-react";
import { LoadoutCard } from "./LoadoutCard";
import type { Loadout } from "../../core/loadout";

interface LoadoutListProps {
  loadouts: Loadout[];
  selectedLoadoutId: string | null;
  activeLoadoutId: string | null;
  favoriteIds: Set<string>;
  onSelectLoadout: (id: string) => void;
  onToggleFavorite: (loadout: Loadout) => void;
  onCreateNew: () => void;
}

export function LoadoutList({
  loadouts,
  selectedLoadoutId,
  activeLoadoutId,
  favoriteIds,
  onSelectLoadout,
  onToggleFavorite,
  onCreateNew,
}: LoadoutListProps) {
  const [isHoveredNew, setIsHoveredNew] = React.useState(false);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Loadouts ({loadouts.length})</span>
        <button
          style={{
            ...styles.newButton,
            ...(isHoveredNew ? styles.newButtonHover : {}),
          }}
          onClick={onCreateNew}
          onMouseEnter={() => setIsHoveredNew(true)}
          onMouseLeave={() => setIsHoveredNew(false)}
        >
          <Plus size={14} />
          <span>New</span>
        </button>
      </div>

      {/* Column Headers */}
      <div style={styles.columnHeaders}>
        <span style={styles.columnHeaderName}>Name / Weapon</span>
        <span style={styles.columnHeaderStat}>Cost</span>
        <span style={styles.columnHeaderStat}>DPP</span>
      </div>

      {/* Scrollable List */}
      <div style={styles.list}>
        {loadouts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyText}>No loadouts found</span>
            <button onClick={onCreateNew} style={styles.emptyButton}>
              Create your first loadout
            </button>
          </div>
        ) : (
          loadouts.map((loadout) => (
            <LoadoutCard
              key={loadout.id}
              loadout={loadout}
              isSelected={selectedLoadoutId === loadout.id}
              isActive={activeLoadoutId === loadout.id}
              isFavorite={favoriteIds.has(loadout.id)}
              onSelect={onSelectLoadout}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    backgroundColor: "hsl(220 13% 7%)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid hsl(220 13% 16%)",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(0 0% 90%)",
  },
  newButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 600,
    color: "hsl(217 91% 60%)",
    backgroundColor: "transparent",
    border: "1px solid hsl(217 91% 60%)",
    borderRadius: "6px",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.15s ease",
  },
  newButtonHover: {
    backgroundColor: "hsl(217 91% 60% / 0.1)",
  },
  columnHeaders: {
    display: "grid",
    gridTemplateColumns: "1fr 60px 60px",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px 8px 42px",
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid hsl(220 13% 14%)",
    flexShrink: 0,
  },
  columnHeaderName: {
    textAlign: "left",
  },
  columnHeaderStat: {
    textAlign: "right",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "40px 20px",
  },
  emptyText: {
    fontSize: "14px",
    color: "hsl(220 13% 45%)",
  },
  emptyButton: {
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: 600,
    color: "hsl(217 91% 60%)",
    backgroundColor: "hsl(217 91% 60% / 0.1)",
    border: "1px solid hsl(217 91% 60%)",
    borderRadius: "8px",
    cursor: "pointer",
    outline: "none",
  },
};
