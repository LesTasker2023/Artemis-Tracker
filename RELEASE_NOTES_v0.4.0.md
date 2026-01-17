# ARTEMIS v0.4.0 - Release Notes

## 🎯 What's New

### Popout Stats Overhaul

**Major expansion of the popout stats system:**

- 📊 **37 Total Stats** across 6 categories (up from 4 categories)
- ⏱️ **New "Hourly" Category** with 6 rate-based metrics:
  - Kills Per Hour
  - Loot Per Hour
  - Skill Per Hour
  - Profit Per Hour
  - Cost Per Hour
  - Damage Per Hour
- 🔢 **7 New Efficiency Stats**:
  - Shots Per Kill
  - Average Damage Per Hit
  - Kills Per PED
  - Skills Per Kill
  - Skills Per PED
  - Total Events
- 🎛️ **"All" Preset Button** - Load all 37 stats at once
- 🔓 **Unlimited Stat Cards** - No more limits on any layout (mini, horizontal, vertical, grid)

### Window & UI Improvements

- 💾 **Persistent Popout Window** - Position and size remembered forever across app restarts
- 🎯 **Smart Settings Behavior** - Popout automatically centers when opening settings, then returns to your original position
- 📦 **Cleaner Main Header** - Loadout selector moved to popout stats only
- 📈 **Enhanced Session Cards** - Session list now displays profit/return percentages prominently

### Visual Enhancements

- 🌫️ **Vanta Fog Background** - Animated fog effect on loading screen (preloaded for zero shift)
- 🟠 **Orange Loading Bar** - New vibrant orange progress indicator
- ✨ **Minimalist Loading Screen** - Clean design with just logo and loading bar

### Welcome Screen Redesign

- 🎉 **Version-Specific Welcome** - New welcome screen for v0.4.0 updates
- ℹ️ **Configuration Display** - Shows your current character name and chat log path
- ⚠️ **Important Notices**:
  - Old loadouts should be recreated in the new Loadout Manager
  - Previous session data may not load properly in the session viewer

### Developer Features

- 🔧 **Secret Debug Mode** - Access advanced debug info (ask us how!)
- 📊 **Session State Inspector** - View internal session data and device metrics
- 💾 **Storage Management** - Clear LocalStorage from debug panel

## 🐛 Bug Fixes

- Fixed TypeScript compilation errors across multiple components
- Improved type safety for markup and session APIs
- Resolved unused import warnings
- Fixed duplicate object keys in component styles
- Corrected optional chaining for Electron APIs

## 🔄 Breaking Changes

### ⚠️ Action Required

1. **Loadouts**: Old loadout configurations from v0.3.x need to be recreated in the Loadout Manager
2. **Session Viewing**: Some historical session data may not display correctly in the new session viewer
3. Your character name and chat log path are preserved and will be shown on first launch

## 📦 Technical Improvements

- Enhanced popout window state management with Electron settings persistence
- Added comprehensive TypeScript type definitions for all Electron APIs
- Improved error handling for markup library operations
- Optimized stat calculation system for better performance
- Preloaded external scripts (Three.js, Vanta.js) for smoother startup

## 🎨 UI/UX Changes

- Removed visual clutter from loading screen
- Simplified welcome flow with direct configuration confirmation
- Improved color contrast for loading indicators
- Better visual hierarchy in session list cards

---

**Installation**: Download `Artemis-Setup-0.4.0.exe` from the releases page

**Upgrade**: Automatic update will be available to existing users

**Support**: Report issues on GitHub or contact the dev team

Hunt Smarter, Not Harder. 🏹
