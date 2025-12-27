/**
 * ARTEMIS v3 - Loot Analysis
 * Focus: What am I getting? What's worth farming?
 */

import React, { useState } from "react";
import {
  Package,
  DollarSign,
  TrendingUp,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { SessionStats } from "../core/session";
import {
  HeroCard,
  HeroGrid,
  EmptyState,
  colors,
  spacing,
  radius,
  typography,
} from "./ui";

interface LootAnalysisProps {
  stats: SessionStats | null;
}

type SortKey = "value" | "quantity" | "name";

export function LootAnalysis({ stats }: LootAnalysisProps) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllItems, setShowAllItems] = useState(false);

  if (!stats || stats.loot.totalItems === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No Loot Tracked Yet"
        subtitle="Loot will appear here as creatures drop items"
      />
    );
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Key metrics
  const avgLootPerKill = stats.kills > 0 ? stats.lootValue / stats.kills : 0;
  const lootPerHour =
    stats.duration > 0 ? (stats.lootValue / stats.duration) * 3600 : 0;

  // Loot composition
  const shrapnelPct =
    stats.lootValue > 0
      ? (stats.loot.shrapnelValue / stats.lootValue) * 100
      : 0;
  const ammoPct =
    stats.lootValue > 0 ? (stats.loot.ammoValue / stats.lootValue) * 100 : 0;
  const resourcesPct = 100 - shrapnelPct - ammoPct;
  const resourcesValue =
    stats.lootValue - stats.loot.shrapnelValue - stats.loot.ammoValue;

  // Return rate color
  const returnColor =
    stats.returnRate >= 100
      ? colors.success
      : stats.returnRate >= 85
      ? colors.warning
      : colors.danger;

  // Sort items
  const sortedItems = Object.values(stats.loot.byItem)
    .filter((item) =>
      searchQuery
        ? item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "value":
          return (b.totalValue - a.totalValue) * dir;
        case "quantity":
          return (b.quantity - a.quantity) * dir;
        case "name":
          return a.itemName.localeCompare(b.itemName) * dir;
        default:
          return 0;
      }
    });

  // Top 5 valuable non-shrapnel items
  const topItems = sortedItems
    .filter((i) => !i.itemName.toLowerCase().includes("shrapnel"))
    .slice(0, 5);

  return (
    <div style={styles.container}>
      {/* Hero Stats */}
      <HeroGrid>
        <HeroCard
          icon={DollarSign}
          label="TOTAL LOOT"
          value={stats.lootValue.toFixed(2)}
          unit="PED"
          color={colors.success}
        />
        <HeroCard
          icon={TrendingUp}
          label="RETURN RATE"
          value={`${stats.returnRate.toFixed(1)}%`}
          color={returnColor}
        />
        <HeroCard
          icon={Package}
          label="PED / KILL"
          value={avgLootPerKill.toFixed(2)}
          color={colors.info}
        />
        <HeroCard
          icon={DollarSign}
          label="PED / HOUR"
          value={lootPerHour.toFixed(0)}
          color={colors.purple}
        />
      </HeroGrid>

      {/* Loot Composition Bar */}
      <div style={styles.compositionPanel}>
        <div style={styles.compositionHeader}>
          <span style={styles.compositionTitle}>LOOT COMPOSITION</span>
          <span style={styles.compositionSubtitle}>
            {resourcesPct.toFixed(0)}% real loot • {shrapnelPct.toFixed(0)}%
            shrapnel
          </span>
        </div>
        <div style={styles.compositionBar}>
          {resourcesPct > 0 && (
            <div
              style={{
                ...styles.compositionSegment,
                width: `${resourcesPct}%`,
                backgroundColor: colors.success,
              }}
              title={`Resources: ${resourcesValue.toFixed(2)} PED`}
            />
          )}
          {ammoPct > 0 && (
            <div
              style={{
                ...styles.compositionSegment,
                width: `${ammoPct}%`,
                backgroundColor: colors.info,
              }}
              title={`Ammo: ${stats.loot.ammoValue.toFixed(2)} PED`}
            />
          )}
          {shrapnelPct > 0 && (
            <div
              style={{
                ...styles.compositionSegment,
                width: `${shrapnelPct}%`,
                backgroundColor: colors.textMuted,
              }}
              title={`Shrapnel: ${stats.loot.shrapnelValue.toFixed(2)} PED`}
            />
          )}
        </div>
        <div style={styles.compositionLegend}>
          <span>
            <span style={{ color: colors.success }}>●</span> Resources{" "}
            {resourcesValue.toFixed(2)}
          </span>
          <span>
            <span style={{ color: colors.info }}>●</span> Ammo{" "}
            {stats.loot.ammoValue.toFixed(2)}
          </span>
          <span>
            <span style={{ color: colors.textMuted }}>●</span> Shrapnel{" "}
            {stats.loot.shrapnelValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Top Valuable Items */}
      {topItems.length > 0 && (
        <div style={styles.topItemsPanel}>
          <div style={styles.topItemsHeader}>TOP VALUABLE ITEMS</div>
          <div style={styles.topItemsList}>
            {topItems.map((item, idx) => {
              const pct =
                stats.lootValue > 0
                  ? (item.totalValue / stats.lootValue) * 100
                  : 0;
              return (
                <div key={item.itemName} style={styles.topItem}>
                  <div style={styles.topItemRank}>#{idx + 1}</div>
                  <div style={styles.topItemName}>{item.itemName}</div>
                  <div style={styles.topItemValue}>
                    {item.totalValue.toFixed(2)} PED
                  </div>
                  <div style={styles.topItemPct}>{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsible Full Item List */}
      <button
        onClick={() => setShowAllItems(!showAllItems)}
        style={styles.collapseToggle}
      >
        {showAllItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showAllItems ? "Hide" : "Show"} All Items ({stats.loot.uniqueItems}{" "}
        unique)
      </button>

      {showAllItems && (
        <div style={styles.itemsPanel}>
          {/* Search & Sort */}
          <div style={styles.controls}>
            <div style={styles.searchBox}>
              <Search size={14} style={{ color: colors.textMuted }} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.sortButtons}>
              {(["value", "quantity", "name"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  style={{
                    ...styles.sortButton,
                    backgroundColor:
                      sortKey === key ? "hsl(217 91% 60%)" : "transparent",
                    color:
                      sortKey === key ? colors.bgBase : colors.textSecondary,
                  }}
                  onClick={() => toggleSort(key)}
                >
                  {key === "value"
                    ? "Value"
                    : key === "quantity"
                    ? "Qty"
                    : "Name"}
                  {sortKey === key && (
                    <ArrowUpDown size={10} style={{ marginLeft: 4 }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div style={styles.itemsHeader}>
            <span style={{ flex: 3 }}>Item</span>
            <span style={{ flex: 1, textAlign: "right" }}>Qty</span>
            <span style={{ flex: 1, textAlign: "right" }}>Value</span>
            <span style={{ flex: 1, textAlign: "right" }}>%</span>
          </div>
          <div style={styles.itemsList}>
            {sortedItems.map((item) => {
              const pct =
                stats.lootValue > 0
                  ? (item.totalValue / stats.lootValue) * 100
                  : 0;
              const isShrapnel = item.itemName
                .toLowerCase()
                .includes("shrapnel");
              const isAmmo = item.itemName.toLowerCase().includes("ammo");
              return (
                <div key={item.itemName} style={styles.itemRow}>
                  <div
                    style={{
                      flex: 3,
                      color: isShrapnel
                        ? colors.textMuted
                        : isAmmo
                        ? colors.info
                        : colors.textPrimary,
                    }}
                  >
                    {item.itemName}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      textAlign: "right",
                      color: colors.textSecondary,
                    }}
                  >
                    {item.quantity.toLocaleString()}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      textAlign: "right",
                      color: colors.success,
                      fontWeight: 600,
                    }}
                  >
                    {item.totalValue.toFixed(2)}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      textAlign: "right",
                      color: colors.textMuted,
                    }}
                  >
                    {pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Styles ====================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
    overflow: "auto",
    flex: 1,
  },

  // Composition Bar
  compositionPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  compositionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  compositionTitle: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
  },
  compositionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  compositionBar: {
    display: "flex",
    height: 24,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.bgHover,
  },
  compositionSegment: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  compositionLegend: {
    display: "flex",
    gap: spacing.lg,
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Top Items
  topItemsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  topItemsHeader: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  topItemsList: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  topItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
  },
  topItemRank: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.warning,
    width: 24,
  },
  topItemName: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  topItemValue: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.success,
    fontFamily: typography.mono,
  },
  topItemPct: {
    fontSize: 12,
    color: colors.textMuted,
    width: 50,
    textAlign: "right",
  },

  // Collapse Toggle
  collapseToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textSecondary,
    fontSize: 13,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },

  // Items Panel (Collapsible)
  itemsPanel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
  },
  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: colors.textPrimary,
    fontSize: 13,
    width: 150,
  },
  sortButtons: {
    display: "flex",
    gap: spacing.xs,
  },
  sortButton: {
    padding: `${spacing.xs + 2}px ${spacing.md}px`,
    borderRadius: radius.xs,
    border: "none",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  itemsHeader: {
    display: "flex",
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bgHover,
    borderRadius: `${radius.md}px ${radius.md}px 0 0`,
    fontSize: 10,
    fontWeight: 700,
    color: colors.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  itemsList: {
    maxHeight: 300,
    overflow: "auto",
  },
  itemRow: {
    display: "flex",
    padding: `10px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.bgHover}`,
    fontSize: 13,
  },
};
