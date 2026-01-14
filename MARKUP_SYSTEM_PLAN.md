# Markup System Implementation Plan

## Overview

Introduce markup tracking to accurately reflect actual profit from loot sales. Currently, the system only tracks TT (Trade Terminal) value. With markup, players receive ~40% additional PED when selling items to vendors.

**Goal**: Allow users to configure item-specific markup values and display both TT-based and markup-adjusted profit calculations.

---

## 1. Data Architecture

### 1.1 Item Library Source

**Source**: Static JSON file bundled with the application (`data/entropia-items.json`)

The item database is fetched from `https://api.entropianexus.com/items` and stored locally to avoid network dependencies.

**Data Structure**:

```json
{
  "Id": 1000053,
  "Name": "Advanced Mecha Unit",
  "Properties": {
    "Type": "Material",
    "Weight": 0.02,
    "Economy": {
      "Value": 0.17 // TT value
    }
  }
}
```

**Key points**:

- ~3000+ items in the database
- Includes: Materials, Weapons, Armor, Tools, Medical items, etc.
- `Economy.Value` = TT buyback value
- Markup NOT provided (user must configure)
- Bundled with app - no network requests required

### 1.2 New Database Schema

#### `ItemMarkupEntry`

```typescript
interface ItemMarkupEntry {
  // Identifiers
  itemId: string; // Unique ID from database or game log
  itemName: string; // Display name

  // TT Reference
  ttValue: number; // TT buyback value (from database)

  // Markup Configuration
  markupValue?: number; // Fixed markup in PED
  markupPercent?: number; // Percentage markup (0-100)

  // Metadata
  itemType?: string; // Material, Weapon, Armor, etc.
  weight?: number; // Weight in PU
  source: "static" | "manual"; // Populated from bundled data or user entry
  lastUpdated: number; // Timestamp
  userNotes?: string; // Custom notes
}
```

#### `MarkupLibrary` (Global State)

```typescript
interface MarkupLibrary {
  items: Record<string, ItemMarkupEntry>; // Keyed by itemName or ID
  lastSynced: number; // When API was last fetched
  syncInterval: number; // Auto-sync interval in milliseconds
  defaultMarkup: {
    percent: number; // Default % if not specified
    fallbackStrategy: "tt" | "default" | "zero"; // What to use if no markup
  };
}
```

#### Session Enhancement

```typescript
// Update LootEntry in types.ts
interface LootEntry {
  timestamp: number;
  itemName: string;
  quantity: number;
  value: number; // TT value (from game log)

  // NEW: Markup tracking
  markupValue?: number; // Additional value from markup
  totalValue?: number; // value + markupValue
  markupApplied?: boolean; // Whether markup was calculated
}

// Update SessionStats
interface SessionStats {
  // ... existing fields ...

  // NEW: Dual profit calculations
  lootValueTT: number; // TT-only (current lootValue)
  lootValueMarkup: number; // With markup applied
  profitTT: number; // Current profit calculation
  profitMarkup: number; // With markup
  returnRateTT: number; // Current return rate
  returnRateMarkup: number; // With markup
}
```

---

## 2. Storage & Persistence

### 2.1 File Structure

```
userData/
├── markupLibrary.json       // Item library (cached from API)
├── markupConfig.json        // User's custom markup overrides
└── markupSyncLog.json       // Sync history
```

### 2.2 Storage Implementation

#### Load on Startup

1. Check if `markupLibrary.json` exists
2. If not, fetch from API on first run
3. Load `markupConfig.json` for user customizations
4. Merge: API data + user overrides

#### Update Strategy

- **Automatic sync**: Optional scheduled sync (daily/weekly)
- **Manual sync**: User button to refresh from API
- **Conflict resolution**: User customizations take priority over API updates

#### Example Files

```json
// markupLibrary.json (from API)
{
  "Advanced Mecha Unit": {
    "itemId": "1000053",
    "itemName": "Advanced Mecha Unit",
    "ttValue": 0.17,
    "itemType": "Material",
    "weight": 0.02,
    "source": "api",
    "lastUpdated": 1705084800000
  },
  "Shrapnel": {
    "itemId": "1002133",
    "itemName": "Shrapnel",
    "ttValue": 0.0001,
    "source": "api"
  }
}

// markupConfig.json (user customizations)
{
  "Shrapnel": {
    "markupPercent": 30,     // User sets 30% for shrapnel
    "userNotes": "Verified with vendor"
  },
  "Custom Item": {
    "ttValue": 5.0,
    "markupValue": 2.0,      // 40% markup = 7 PED total
    "source": "manual"       // User created
  }
}
```

---

## 3. UI Components

### 3.1 Markup Manager Page

**Location**: New tab in main UI (alongside LootAnalysis, etc.)

**Sections**:

#### A. Quick Stats

- Total items in library
- Items with markup configured
- Last API sync time
- Default markup setting

#### B. Library Browser

- Searchable item list
- Columns: Item Name | TT Value | Configured Markup | Source
- Sort by: name, TT value, markup %, unconfigured
- Filter: All items, unconfgured only, custom only, by type

#### C. Item Configuration

For each item, allow:

- View TT value (read-only from API)
- Set markup as **% OR fixed value** (toggle)
- Add notes
- Mark as verified / disputed
- Delete custom entry (revert to API)

#### D. Bulk Configuration Tools

- Set default markup % for all unconfgured items
- Apply markup to category (e.g., "All Materials")
- CSV import/export for batch editing

#### E. Sync Controls

- Manual sync button (fetches latest from API)
- Show sync status
- Last sync timestamp
- Auto-sync toggle + interval selector

### 3.2 Integration with LootAnalysis

**Current UI Enhancement**:

- Add checkbox: "Apply Markup"
- Show two columns:
  - TT Loot Value
  - With Markup
- Show dual profit figures
- Hover tooltips explaining markup

### 3.3 Session Stats Display

**EconomyTracker Enhancement**:

```
PROFIT
─────────────────
TT Basis:        150 PED (conservative)
With Markup:     210 PED (realistic)
Markup Applied:  60 PED
```

---

## 4. Calculation Logic

### 4.1 Markup Application

```typescript
function calculateMarkupValue(
  itemName: string,
  ttValue: number,
  markupLibrary: MarkupLibrary
): { ttValue: number; markupValue: number; total: number } {
  const entry = markupLibrary.items[itemName];

  if (!entry) {
    // No markup configured
    return { ttValue, markupValue: 0, total: ttValue };
  }

  let markupValue = 0;

  if (entry.markupPercent !== undefined) {
    // Percentage-based
    markupValue = ttValue * (entry.markupPercent / 100);
  } else if (entry.markupValue !== undefined) {
    // Fixed amount
    markupValue = entry.markupValue;
  } else if (markupLibrary.defaultMarkup.percent > 0) {
    // Use default
    markupValue = ttValue * (markupLibrary.defaultMarkup.percent / 100);
  }

  return {
    ttValue,
    markupValue,
    total: ttValue + markupValue,
  };
}
```

### 4.2 Session Stat Recalculation

```typescript
function calculateSessionStatsWithMarkup(
  session: Session,
  markupLibrary: MarkupLibrary
): SessionStats {
  // ... existing calculations ...

  let totalLootValueMarkup = 0;

  for (const event of session.events) {
    if (event.type === "loot") {
      const { ttValue, markupValue, total } = calculateMarkupValue(
        event.itemName,
        event.value,
        markupLibrary
      );
      totalLootValueMarkup += total;
    }
  }

  const profitMarkup = totalLootValueMarkup - totalSpend;
  const returnRateMarkup =
    totalSpend > 0 ? (totalLootValueMarkup / totalSpend) * 100 : 0;

  return {
    // ... existing fields ...
    lootValueTT: totalLootValue,
    lootValueMarkup: totalLootValueMarkup,
    profitTT: profit,
    profitMarkup: profitMarkup,
    returnRateTT: returnRate,
    returnRateMarkup: returnRateMarkup,
  };
}
```

---

## 5. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

- [ ] Create `MarkupLibrary` type and storage layer
- [ ] Implement API fetching and caching
- [ ] Add markup entries to session calculation
- [ ] Create markup config JSON structure
- [ ] Update TypeScript types

### Phase 2: UI - Manager (Week 2)

- [ ] Build `MarkupManager` component
- [ ] Item browser with search/filter
- [ ] Individual item configuration UI
- [ ] Sync controls
- [ ] Bulk tools (CSV import, default setter)

### Phase 3: Integration (Week 3)

- [ ] Update `LootAnalysis` to show dual values
- [ ] Update `EconomyTracker` profit display
- [ ] Add markup toggle to session UI
- [ ] Update session stats export

### Phase 4: Polish & Testing (Week 4)

- [ ] Verify accuracy against known items
- [ ] Performance testing with 3000+ items
- [ ] Data migration (if upgrading existing sessions)
- [ ] Documentation & tooltips

---

## 6. User Workflow

### 6.1 Initial Setup

1. User opens app → Markup Manager not yet populated
2. Click "Sync Library from API"
3. System fetches ~3000 items, displays progress
4. Library cached locally
5. User optionally:
   - Sets default markup % (e.g., 35%)
   - Manually adjusts specific items
   - Imports custom CSV with verified markups

### 6.2 Regular Usage

1. During session, user doesn't need to do anything
2. Loot is captured with TT value (as before)
3. In analysis view, user can toggle "Apply Markup"
4. System displays both TT and realistic profit

### 6.3 Maintenance

- Markup library auto-syncs weekly (optional)
- User can manually update item-by-item
- Can export custom markup config to backup

---

## 7. Fallback & Error Handling

### Item Not in Library

```
If item drops in-game but not in library:
├─ Check exact name match
├─ If no match, check similar names (fuzzy)
└─ If still no match:
   ├─ Option A: Use default markup %
   ├─ Option B: Use TT value only (conservative)
   └─ Option C: Show warning, ask user to add
```

### API Fetch Failure

```
If sync fails:
├─ Retry with exponential backoff
├─ Use cached library (if available)
└─ Show warning "Using cached data from [date]"
```

### Corrupt Markup Config

```
If user config is invalid:
├─ Validate JSON on load
├─ Fall back to API data for that item
└─ Log warning to console
```

---

## 8. Data Export & Analytics

### Session Export Enhancement

Add optional fields to export:

```json
{
  "session": { ... },
  "lootAnalysis": {
    "ttValue": 100,
    "markupValue": 40,
    "totalValue": 140,
    "profitTT": 50,
    "profitMarkup": 90
  }
}
```

### Markup Report

User can generate:

- "Top items by markup value"
- "Markup coverage %" (what % of loot has markup configured)
- "Estimated real vs. reported profit over time"

---

## 9. Technical Considerations

### Performance

- **3000+ items**: Use IndexedDB or memoization for search
- **Calculation**: Cache markup values during session
- **UI**: Virtual scrolling for item list

### Storage

- **File size**: markupLibrary.json ~200-300KB
- **Sync frequency**: Default weekly, user-configurable
- **Sync method**: Fetch full API on first run, then incremental updates

### Testing

- Unit tests for `calculateMarkupValue()`
- Integration tests for session recalculation
- Manual testing with known items

---

## 10. Future Enhancements

1. **Crowdsourced markup data**: Share configs with community
2. **Vendor-specific markups**: Different vendors offer different markups
3. **Time-based markups**: Market fluctuations
4. **Item rarity/quality tiers**: Different markups by quality
5. **Predictive analytics**: Estimate markup for new items

---

## Summary

| Component                    | Status      | Priority |
| ---------------------------- | ----------- | -------- |
| Type system                  | Not started | High     |
| API integration              | Not started | High     |
| Storage layer                | Not started | High     |
| Calculation logic            | Not started | High     |
| MarkupManager UI             | Not started | Medium   |
| Integration with existing UI | Not started | Medium   |
| Testing                      | Not started | Medium   |
| Documentation                | Not started | Low      |

**Estimated Timeline**: 3-4 weeks (full implementation)

**Initial MVP**: Types + Storage + API + Calculation (1 week)
