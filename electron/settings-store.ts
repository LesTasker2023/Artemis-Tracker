/**
 * ARTEMIS - Application Settings Storage
 * Persists user settings and preferences
 */

import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

const SETTINGS_FILE = "settings.json";

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AppSettings {
  logPath?: string; // Manually selected chat.log path
  lastPlayerName?: string;
  popoutBounds?: WindowBounds; // Persisted popout window position and size
  // Add more settings as needed
}

let settings: AppSettings = {};

/**
 * Get the settings file path
 */
function getSettingsPath(): string {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, SETTINGS_FILE);
}

/**
 * Load settings from disk
 */
export function loadSettings(): AppSettings {
  const filePath = getSettingsPath();
  
  if (fs.existsSync(filePath)) {
    try {
      const json = fs.readFileSync(filePath, "utf8");
      settings = JSON.parse(json);
      console.log("[SettingsStore] Settings loaded:", settings);
    } catch (e) {
      console.error("[SettingsStore] Failed to load settings:", e);
      settings = {};
    }
  } else {
    console.log("[SettingsStore] No settings file found, using defaults");
    settings = {};
  }
  
  return settings;
}

/**
 * Save settings to disk
 */
export function saveSettings(newSettings: Partial<AppSettings>): void {
  settings = { ...settings, ...newSettings };
  
  const filePath = getSettingsPath();
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf8");
    console.log("[SettingsStore] Settings saved:", settings);
  } catch (e) {
    console.error("[SettingsStore] Failed to save settings:", e);
  }
}

/**
 * Get a specific setting
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] | undefined {
  return settings[key];
}

/**
 * Get all settings
 */
export function getSettings(): AppSettings {
  return { ...settings };
}

/**
 * Clear all settings
 */
export function clearSettings(): void {
  settings = {};
  const filePath = getSettingsPath();
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("[SettingsStore] Settings cleared");
    }
  } catch (e) {
    console.error("[SettingsStore] Failed to clear settings:", e);
  }
}
