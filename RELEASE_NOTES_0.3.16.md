# Release Notes - Artemis v0.3.16

## 🎯 Overview

This release focuses on improving the popout window experience with a cleaner, more logical layout and enhanced markup management capabilities.

---

## ✨ What's New

### 🖥️ Popout Window Redesign

The popout window has been completely refactored for a cleaner, more intuitive experience:

- **Unified Footer** - Time, session controls, and additional expenses are now consolidated in a clean footer section
- **Compact Controls** - Play/pause buttons are now icon-only for a minimal footprint
- **Smart Layout** - Time displays on the left, session controls on the right
- **All Layouts Updated** - Mini, Horizontal, Vertical, and Grid layouts all benefit from the new footer design

### 💰 Enhanced Additional Expenses

The additional expenses panel (in settings mode) has been redesigned:

- **Clearer Labels** - Armor, FAP, and Misc costs now have visible text labels
- **Larger Inputs** - 80px wide inputs for easier value entry
- **Total Display** - See your total additional expenses at a glance
- **Better Spacing** - Less cramped, more readable layout

### 📦 Advanced Markup System

Major improvements to how you manage item markup values:

- **Dual Markup Modes** - Set markup as a percentage (%) OR a fixed PED amount
- **Edit Mode** - Click the Edit button to modify markup values with Save/Cancel options
- **Radio Selection** - Clearly choose between percentage or fixed rate modes
- **Real-time Preview** - See markup calculations update as you type

### 🚫 Item Ignore System

Take full control of what gets tracked:

- **Ignore Button** - Click to exclude any item from your loot calculations
- **Ignored Tab** - New tab in Market Library shows all ignored items
- **Easy Restore** - Un-ignore items with a single click
- **Smart Filtering** - Ignored items are excluded from totals but remain in your library
- **Nanocubes Auto-Ignored** - Universal Ammo and Nanocubes are now filtered by default

### 📋 Loot Tab Improvements

The main app loot tab now shows:

- **Full Loot List** - All items always visible (removed toggle)
- **Inline Markup Display** - See markup values next to item names
- **Quick Markup Editing** - Edit markup directly from the loot list
- **Ignore Controls** - Ignore/unignore items right from the loot tab

### ⏸️ Session Pause/Resume

- **Pause Tracking** - Pause your session without losing data
- **Accurate Duration** - Paused time is excluded from session duration
- **Visual Indicator** - Paused sessions show ⏸ icon
- **Popout Support** - Pause/resume from the popout window

---

## 🐛 Bug Fixes

- Fixed markup save only working for percentage input
- Fixed recent loot items not matching favorites behavior
- Fixed edit inputs being out of sync with library values
- Fixed ignore button visual feedback
- Fixed total loot calculation not updating when ignoring items
- Fixed various TypeScript compilation errors
- Removed unused imports and variables

---

## 🔧 Technical Improvements

- Consolidated footer styles for consistency across layouts
- Improved component organization in PopoutStatsV2
- Better type safety for ArmorSet and LiveStats interfaces
- Cleaner state management for markup editing

---

## 📝 Notes

- The popout window may need to be reopened to see the new layout
- Custom markup settings are preserved during the update
- Ignored items list is saved locally with your markup library

---

**Hunt Smarter, Not Harder.** 🏹
