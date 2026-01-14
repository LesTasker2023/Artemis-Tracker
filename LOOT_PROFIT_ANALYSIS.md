# Loot & Profit Tracking Analysis

## Summary

The system tracks **TT (Trade Terminal) value only** – the game-provided loot values. No markup/resale calculations exist.

---

## Current Tracking

### What IS Tracked

1. **Loot Value (TT)** - Direct from game log: `"You received [item] Value: X PED"`
   - Stored in: `SessionStats.lootValue`
   - Aggregated by item in: `LootBreakdown.byItem[itemName].totalValue`
2. **Shrapnel Value (separate)** - Isolated and tracked
   - Category: `LootBreakdown.shrapnelValue`
   - Excluded from "real loot" percentage calculations
3. **Ammunition Value** - Universal ammo tracked separately
   - Category: `LootBreakdown.ammoValue`
   - Filtered out of main loot totals

### Profit Calculation

```
Profit = Loot Value (TT) - Total Spend
         (game-provided values - ammo/decay costs)

Return Rate = Loot Value / Total Spend × 100%
```

Components:

- **Loot Value**: Raw PED from drops (no markup)
- **Total Spend**: Ammo burn + weapon/enhancer/scope/sight decay
- **Armor Decay**: Tracked separately as `decay` stat
- **Net Profit**: `profit - armor_decay`

---

## What's NOT Tracked: Markup

### The Gap

Items have **buyer markup** – the premium you receive when selling to vendors instead of TT buyback:

- TT Buyback: ~60% of sell value
- Markup: ~40% additional PED per item
- **Unavailable to system**: Log only shows TT value

### Consequences for Profit Analysis

1. **Overstated loot values** (~40% underestimated)
2. **Underestimated return rates** (100% RR becomes ~140% actual)
3. **Underestimated profit** by approximately 40% per PED of loot
4. **Skill-to-profit ratios** are pessimistic

---

## Example Impact

```
Session drops 100 PED worth of loot (TT basis)
Seller gets: 100 PED TT + ~40 PED markup = 140 PED actual
System reports: 100 PED
System underreports profit by: 40 PED
```

---

## Data Structures Involved

### LootEntry Interface

```typescript
interface LootEntry {
  timestamp: number;
  itemName: string;
  quantity: number;
  value: number; // ← TT PED value ONLY
  tier?: number;
}
```

### LootBreakdown

```typescript
interface LootBreakdown {
  totalValue: number; // ← Sum of TT values
  byItem: {
    [itemName]: {
      totalValue: number; // ← TT value sum
      quantity: number;
      count: number;
    };
  };
  shrapnelValue: number;
  ammoValue: number;
}
```

---

## Components Displaying These Values

- **LootAnalysis.tsx** - Item breakdown + composition
- **EconomyTracker.tsx** - Profit/return rate summary
- **SessionCharts.tsx** - Profit over time graphs
- **LiveDashboard.tsx** - Real-time loot tracking
- **PopoutStats.tsx** - Stat definitions & efficiency metrics

All use `stats.lootValue` directly with no markup adjustment.

---

## Recommendation

To implement markup tracking:

1. Add optional `markupValue?: number` to `LootEntry` interface
2. Require item tier data during parsing to estimate markup
3. Create parallel profit calculations: `profitTT` vs `profitActual`
4. Update UI to show both conservative (TT) and realistic (markup) estimates

Current system provides **conservative profit estimates** – actual returns are higher.
