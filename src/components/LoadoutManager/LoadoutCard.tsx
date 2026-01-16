/**
 * LoadoutManager - Loadout Card Component
 * Compact row-based card with stats display - matching SessionCard style
 */

import React from "react";
import { Star, StarOff } from "lucide-react";
import type { Loadout } from "../../core/loadout";
import { getEffectiveCostPerShot, calculateDPP } from "../../core/loadout";

interface LoadoutCardProps {
  loadout: Loadout;
  isSelected: boolean;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (loadout: Loadout) => void;
}

export function LoadoutCard({
  loadout,
  isSelected,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: LoadoutCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const costPerShot = getEffectiveCostPerShot(loadout);
  const dpp = loadout.weapon ? calculateDPP(loadout) : 0;

  return (
    <div
      style={{
        ...styles.row,
        ...(isSelected ? styles.rowSelected : {}),
        ...(isHovered ? styles.rowHover : {}),
      }}
      onClick={() => onSelect(loadout.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(loadout);
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

      {/* Left: Name + Weapon */}
      <div style={styles.infoCol}>
        <div style={styles.nameRow}>
          <span style={styles.name}>{loadout.name}</span>
          {isActive && <span style={styles.badgeActive}>ACTIVE</span>}
        </div>
        <div style={styles.metaRow}>
          <span style={styles.weaponName}>
            {loadout.weapon?.name ?? "No weapon"}
          </span>
          {loadout.amp && (
            <>
              <span style={styles.separator}>+</span>
              <span style={styles.ampName}>{loadout.amp.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Stats */}
      <div style={styles.statsCol}>
        {/* Cost/Shot */}
        <div style={styles.statBox}>
          <span style={{ ...styles.statValue, color: "#60a5fa" }}>
            {(costPerShot * 100).toFixed(3)}
          </span>
          <span style={styles.statLabel}>PEC</span>
        </div>

        {/* DPP */}
        <div style={styles.statBox}>
          <span style={{ ...styles.statValue, color: "#22c55e" }}>
            {(dpp / 100).toFixed(3)}
          </span>
          <span style={styles.statLabel}>DPP</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "8px",
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    transition: "all 0.15s ease",
    gap: "12px",
  },
  rowHover: {
    backgroundColor: "hsl(220 13% 12%)",
    borderColor: "hsl(220 13% 22%)",
  },
  rowSelected: {
    borderColor: "hsl(217 91% 60%)",
    backgroundColor: "hsl(217 91% 60% / 0.08)",
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
  infoCol: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  name: {
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
  },
  weaponName: {
    color: "hsl(220 13% 60%)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  separator: {
    color: "hsl(220 13% 30%)",
  },
  ampName: {
    color: "hsl(220 13% 55%)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  badgeActive: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
    flexShrink: 0,
  },
  statsCol: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    minWidth: "50px",
  },
  statValue: {
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "9px",
    fontWeight: 500,
    color: "hsl(220 13% 40%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};
