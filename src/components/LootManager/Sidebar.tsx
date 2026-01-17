/**
 * LootManager - Sidebar Component
 * Shows loot composition metrics and stats
 */

import React, { useMemo } from "react";
import { Package, DollarSign, TrendingUp, Database } from "lucide-react";
import type { SessionStats } from "../../core/session";
import type { MarkupLibrary } from "../../core/markup";
import type { ItemWithMeta } from "../MarkupManager/types";

interface SidebarProps {
  stats: SessionStats | null;
  lootItems: ItemWithMeta[];
  displayItems: ItemWithMeta[];
  markupLibrary?: MarkupLibrary | null;
}

export function Sidebar({
  stats,
  lootItems,
  displayItems,
  markupLibrary,
}: SidebarProps) {
  // Calculate composition metrics
  const metrics = useMemo(() => {
    if (!stats || lootItems.length === 0) {
      return {
        totalValue: 0,
        totalValueWithMarkup: 0,
        itemCount: 0,
        uniqueItems: 0,
        avgValuePerItem: 0,
        avgMarkup: 0,
        inLibraryCount: 0,
        inLibraryPercent: 0,
        topItems: [] as { name: string; value: number; percent: number }[],
      };
    }

    const totalValue = lootItems.reduce(
      (sum, item) => sum + (item.sessionValue || 0),
      0
    );
    const totalValueWithMarkup = lootItems.reduce((sum, item) => {
      const ttValue = item.sessionValue || 0;
      const markup = item.useFixed
        ? item.markupValue || 0
        : ttValue * ((item.markupPercent || 100) / 100);
      return sum + markup;
    }, 0);

    const itemCount = lootItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const uniqueItems = lootItems.length;
    const avgValuePerItem = itemCount > 0 ? totalValue / itemCount : 0;
    const avgMarkup =
      totalValue > 0 ? (totalValueWithMarkup / totalValue) * 100 : 100;

    const inLibraryCount = lootItems.filter((item) => {
      const entry = markupLibrary?.items?.[item.itemName];
      return entry && entry.markupPercent !== 100;
    }).length;
    const inLibraryPercent =
      uniqueItems > 0 ? (inLibraryCount / uniqueItems) * 100 : 0;

    // Top 5 items
    const topItems = [...lootItems]
      .sort((a, b) => (b.sessionValue || 0) - (a.sessionValue || 0))
      .slice(0, 5)
      .map((item) => ({
        name: item.itemName,
        value: item.sessionValue || 0,
        percent:
          totalValue > 0 ? ((item.sessionValue || 0) / totalValue) * 100 : 0,
      }));

    return {
      totalValue,
      totalValueWithMarkup,
      itemCount,
      uniqueItems,
      avgValuePerItem,
      avgMarkup,
      inLibraryCount,
      inLibraryPercent,
      topItems,
    };
  }, [lootItems, markupLibrary, stats]);

  return (
    <div style={styles.container}>
      {/* Composition Metrics */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>COMPOSITION</div>
        <div style={styles.cards}>
          {/* Total Value */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>
              <DollarSign size={16} style={{ color: "hsl(217 91% 68%)" }} />
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardLabel}>Total Value</div>
              <div style={styles.cardValue}>
                {metrics.totalValue.toFixed(2)} PED
              </div>
              <div style={styles.cardSubtext}>
                {metrics.totalValueWithMarkup.toFixed(2)} PED with markup
              </div>
            </div>
          </div>

          {/* Item Count */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>
              <Package size={16} style={{ color: "hsl(142 76% 36%)" }} />
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardLabel}>Items</div>
              <div style={styles.cardValue}>{metrics.itemCount}</div>
              <div style={styles.cardSubtext}>{metrics.uniqueItems} unique</div>
            </div>
          </div>

          {/* Average Markup */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>
              <TrendingUp size={16} style={{ color: "hsl(33 100% 50%)" }} />
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardLabel}>Avg Markup</div>
              <div style={styles.cardValue}>
                {metrics.avgMarkup.toFixed(1)}%
              </div>
              <div style={styles.cardSubtext}>
                {metrics.avgValuePerItem.toFixed(4)} PED/item
              </div>
            </div>
          </div>

          {/* Library Coverage */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>
              <Database size={16} style={{ color: "hsl(280 100% 70%)" }} />
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardLabel}>In Library</div>
              <div style={styles.cardValue}>
                {metrics.inLibraryCount}/{metrics.uniqueItems}
              </div>
              <div style={styles.cardSubtext}>
                {metrics.inLibraryPercent.toFixed(0)}% coverage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Items */}
      {metrics.topItems.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>TOP ITEMS</div>
          <div style={styles.topItems}>
            {metrics.topItems.map((item, index) => (
              <div key={item.name} style={styles.topItem}>
                <div style={styles.topItemRank}>#{index + 1}</div>
                <div style={styles.topItemInfo}>
                  <div style={styles.topItemName}>{item.name}</div>
                  <div style={styles.topItemValue}>
                    {item.value.toFixed(2)} PED ({item.percent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Status */}
      {displayItems.length !== lootItems.length && (
        <div style={styles.filterStatus}>
          Showing {displayItems.length} of {lootItems.length} items
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "280px",
    padding: "16px",
    backgroundColor: "#14161a",
    borderRight: "1px solid hsl(220 13% 15%)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    overflowY: "auto",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 55%)",
    letterSpacing: "0.5px",
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    display: "flex",
    gap: "12px",
    padding: "12px",
    backgroundColor: "hsl(220 13% 10%)",
    border: "1px solid hsl(220 13% 18%)",
    borderRadius: "6px",
  },
  cardIcon: {
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  cardLabel: {
    fontSize: "11px",
    color: "hsl(220 13% 55%)",
  },
  cardValue: {
    fontSize: "16px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
  },
  cardSubtext: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
  },
  topItems: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  topItem: {
    display: "flex",
    gap: "10px",
    padding: "10px",
    backgroundColor: "hsl(220 13% 10%)",
    border: "1px solid hsl(220 13% 18%)",
    borderRadius: "6px",
  },
  topItemRank: {
    fontSize: "12px",
    fontWeight: 700,
    color: "hsl(217 91% 68%)",
    flexShrink: 0,
  },
  topItemInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  topItemName: {
    fontSize: "12px",
    fontWeight: 500,
    color: "hsl(0 0% 95%)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  topItemValue: {
    fontSize: "11px",
    color: "hsl(142 76% 36%)",
  },
  filterStatus: {
    padding: "8px 12px",
    backgroundColor: "hsl(217 91% 60% / 0.1)",
    border: "1px solid hsl(217 91% 60% / 0.3)",
    borderRadius: "6px",
    fontSize: "11px",
    color: "hsl(217 91% 68%)",
    textAlign: "center",
  },
};
