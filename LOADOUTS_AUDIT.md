# Loadouts System Audit Report
**Date:** 2026-01-11
**Branch:** claude/loadouts-audit
**Scope:** Loadout Creator, Editor, and Related Components

---

## Executive Summary

The loadouts system is well-architected with strong TypeScript typing, comprehensive testing, and good separation of concerns. However, several bugs and inconsistencies were identified that affect calculation accuracy and user experience.

**Overall Status:** ⚠️ **Needs Attention**
- 2 Critical bugs affecting cost calculations
- 3 Medium priority issues
- 5 Minor improvements recommended

---

## Critical Issues 🔴

### 1. Armor Plate Decay Calculation Bug
**Location:** `src/components/ArmorPlateAutocomplete.tsx:106`

**Issue:** The decay per hit calculation uses a hardcoded durability value of 1000 instead of the actual plate durability.

```typescript
// Current (WRONG):
const decayPerHit = totalTT / 1000; // ~1000 durability average

// Should be:
const decayPerHit = calculateSinglePlateDecayPerHit(plates);
```

**Impact:** Users see incorrect armor plate decay values in the UI. This could lead to significant miscalculations in repair cost estimates.

**Recommendation:** Import and use `calculateSinglePlateDecayPerHit` from `core/loadout.ts`.

---

### 2. Armor Plates Excluded from Cost Breakdown
**Location:** `src/core/loadout.ts:187-218`

**Issue:** The `calculateLoadoutCosts` function computes armor set decay but doesn't include armor plate decay in the cost breakdown object.

```typescript
export interface LoadoutCosts {
  weaponCost: number;
  ampCost: number;
  scopeCost: number;
  sightCost: number;
  weaponEnhancerCost: number;
  armorEnhancerCost: number;
  totalPerShot: number;
  armorDecayPerHit: number;  // ✅ Armor set included
  // ❌ Missing: armorPlatesDecayPerHit
}
```

**Impact:** Armor plate decay is calculated but not displayed in the cost breakdown. Users cannot see the repair cost contribution from armor plates.

**Recommendation:** Add `armorPlatesDecayPerHit` field to `LoadoutCosts` interface and calculate it using `calculateSinglePlateDecayPerHit()`.

---

## Medium Priority Issues 🟡

### 3. State Synchronization in useLoadouts Hook
**Location:** `src/hooks/useLoadouts.ts:36`

**Issue:** The `activeLoadout` is derived from the `loadouts` array, but there's a potential race condition where `loadouts` might be stale when `activeId` changes.

```typescript
const activeLoadout = loadouts.find(l => l.id === activeId) ?? null;
```

**Impact:** After saving a loadout, the active loadout might temporarily show stale data until the next render cycle.

**Recommendation:** Add `activeId` to the dependency array or refactor to use a `useMemo` hook.

---

### 4. No Input Validation for Manual Values
**Location:** `src/components/LoadoutManager.tsx:119-128`

**Issue:** Manual decay and ammo burn inputs accept any numeric value without validation. Users could enter negative numbers or excessively large values.

```typescript
const handleManualChange = () => {
  if (!equipment?.name) return;
  onChange(
    createEquipmentManual(
      equipment.name,
      parseFloat(decay) || 0,  // No validation
      parseFloat(ammoBurn) || 0  // No validation
    )
  );
};
```

**Impact:** Invalid inputs could cause calculation errors or misleading cost estimates.

**Recommendation:** Add validation to ensure values are non-negative and within reasonable ranges.

---

### 5. Unused Function in Core Logic
**Location:** `src/core/loadout.ts:160-175`

**Issue:** `calculateSinglePlateDecayPerHit()` is defined but never called in the codebase.

**Impact:** Suggests incomplete integration of armor plate decay calculations.

**Recommendation:** Use this function in both `ArmorPlateAutocomplete` (issue #1) and `calculateLoadoutCosts` (issue #2).

---

## Minor Issues & Improvements 🔵

### 6. Inconsistent Styling Approach
**Location:** `src/components/LoadoutManager.tsx`

**Issue:** Component uses inline styles throughout despite having a CSS module (`LoadoutManager.module.css`) imported. Only one class (`.loadoutCostRow`) uses the CSS module.

**Impact:** Harder to maintain consistent theming and increases bundle size.

**Recommendation:** Either fully commit to CSS modules or remove the unused CSS file.

---

### 7. DPP Display Label Confusion
**Location:** `src/components/LoadoutManager.tsx:989`

**Issue:** The label shows "DPP (Dmg/PEC)" but the actual calculation is damage per PED.

```typescript
<span style={{ fontSize: "16px", fontWeight: 600, color: "white" }}>
  DPP (Dmg/PEC)  {/* ❌ Should be Dmg/PED */}
</span>
<span style={{ ... }}>
  {(dpp / 100).toFixed(2)}  {/* Converts PED to PEC for display */}
</span>
```

**Impact:** User confusion about whether efficiency is measured in PED or PEC.

**Recommendation:** Change label to "DPP (Dmg/PED)" to match the actual calculation, or adjust calculation to use PEC consistently.

---

### 8. No Error Handling for Failed Equipment Search
**Location:** `src/components/EquipmentAutocomplete.tsx:84-96`

**Issue:** The `handleBlur` function doesn't handle the case where `findByName` might throw an error.

**Impact:** Potential runtime errors if equipment database is corrupted or unavailable.

**Recommendation:** Wrap `findByName` call in try-catch block.

---

### 9. TypeScript Ignore Comment for CSS Module
**Location:** `src/components/LoadoutManager.tsx:35`

```typescript
// @ts-ignore: CSS module declaration
import styles from "./LoadoutManager.module.css";
```

**Impact:** Suppresses helpful TypeScript errors and warnings.

**Recommendation:** Create proper TypeScript declaration file `LoadoutManager.module.css.d.ts`.

---

### 10. Missing Accessibility Labels
**Location:** Various autocomplete components

**Issue:** Input fields lack proper `aria-label` attributes and dropdown items lack `role="option"` attributes.

**Impact:** Screen readers cannot properly announce search results and selections.

**Recommendation:** Add ARIA attributes for better accessibility.

---

## Strengths ✅

### Code Quality
- ✅ **Comprehensive unit tests** covering all calculation functions
- ✅ **Pure functions** for all core logic (testable and predictable)
- ✅ **Strong TypeScript typing** with explicit interfaces
- ✅ **Proper separation of concerns** (UI, logic, storage)

### User Experience
- ✅ **Keyboard navigation** in all autocomplete components
- ✅ **Real-time cost calculations** as users edit loadouts
- ✅ **Visual feedback** for active loadouts
- ✅ **Manual override option** for custom cost values

### Data Management
- ✅ **LocalStorage persistence** with error handling
- ✅ **UUID-based IDs** for loadouts
- ✅ **Timestamps** for created/updated tracking
- ✅ **Graceful fallbacks** when storage unavailable

---

## Testing Recommendations

### Unit Tests to Add
1. Test armor plate decay calculations with varying durability values
2. Test loadout cost breakdown includes all armor components
3. Test input validation for manual decay/ammo burn values
4. Test state synchronization in useLoadouts hook

### Integration Tests to Add
1. Test full loadout creation flow (select equipment → save → verify persistence)
2. Test armor plate selection with multiple plates
3. Test active loadout switching
4. Test manual cost override functionality

### Manual Testing Checklist
- [ ] Create loadout with armor plates and verify decay calculation
- [ ] Test autocomplete keyboard navigation
- [ ] Verify cost breakdown shows all components
- [ ] Test manual value inputs with edge cases (0, negative, very large)
- [ ] Verify localStorage persistence across page reloads

---

## Architecture Overview

```
src/
├── core/
│   ├── loadout.ts              ✅ Pure calculation functions
│   ├── loadout.test.ts         ✅ Comprehensive test coverage
│   └── equipment-db.ts         ✅ Singleton database
├── components/
│   ├── LoadoutManager.tsx      ⚠️  Inline styles + unused CSS module
│   ├── EquipmentAutocomplete.tsx   ✅ Good keyboard nav
│   ├── ArmorAutocomplete.tsx       ✅ Good UX
│   └── ArmorPlateAutocomplete.tsx  🔴 Calculation bug
├── hooks/
│   ├── useLoadouts.ts          ⚠️  State sync issue
│   └── useEquipmentDB.ts       ✅ Clean API
└── App.tsx                     ✅ Simple integration
```

---

## Priority Action Items

### Immediate (Critical)
1. **Fix armor plate decay calculation** in ArmorPlateAutocomplete
2. **Add armor plate decay to cost breakdown** in loadout.ts

### Short Term (Medium)
3. **Add input validation** for manual decay/ammo values
4. **Fix state synchronization** in useLoadouts hook
5. **Integrate calculateSinglePlateDecayPerHit** into UI

### Long Term (Minor)
6. **Standardize styling approach** (CSS modules vs inline)
7. **Add TypeScript declarations** for CSS modules
8. **Improve accessibility** with ARIA labels
9. **Fix DPP label** to match calculation units
10. **Add error boundaries** around equipment search

---

## Files Reviewed

- ✅ `src/components/LoadoutManager.tsx` (1,250 lines)
- ✅ `src/core/loadout.ts` (403 lines)
- ✅ `src/hooks/useLoadouts.ts` (70 lines)
- ✅ `src/components/EquipmentAutocomplete.tsx` (244 lines)
- ✅ `src/components/ArmorAutocomplete.tsx` (319 lines)
- ✅ `src/components/ArmorPlateAutocomplete.tsx` (319 lines)
- ✅ `src/core/loadout.test.ts` (290 lines)
- ✅ `src/components/LoadoutManager.module.css` (332 lines)

**Total Lines Reviewed:** ~3,227 lines of code

---

## Conclusion

The loadouts system demonstrates solid engineering practices with good test coverage and clean architecture. However, the two critical bugs related to armor plate decay calculations must be addressed immediately as they directly impact the accuracy of cost estimates—the core feature of the loadout system.

Once the critical issues are resolved, the system will provide accurate and reliable loadout cost tracking for Entropia Universe players.

**Next Steps:**
1. Fix critical bugs (Issues #1 and #2)
2. Add test coverage for armor plate calculations
3. Validate manual input fields
4. Consider refactoring to use CSS modules consistently
