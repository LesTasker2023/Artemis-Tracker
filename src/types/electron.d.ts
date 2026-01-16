/**
 * Type definitions for Electron IPC bridge
 */

import type { LogEvent } from '../core/types';
import type { Session } from '../core/session';

interface LogAPI {
  start: (manualPath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  selectFile: () => Promise<{ success: boolean; path?: string; error?: string }>;
  stop: () => Promise<{ success: boolean }>;
  status: () => Promise<{ watching: boolean; position: number }>;
  onEvent: (callback: (event: LogEvent) => void) => () => void;
}

interface UpdateResult {
  updated: string[];
  failed: string[];
  skipped: string[];
  total: number;
}

interface EquipmentAPI {
  load: (type: string) => Promise<unknown[]>;
  checkUpdates: () => Promise<{ success: boolean; updateAvailable: boolean; error?: string }>;
  update: () => Promise<{ success: boolean; result?: UpdateResult; error?: string }>;
}

interface SessionMeta {
  id: string;
  name: string;
  tags: string[];
  startedAt: string;
  endedAt?: string;
  eventCount: number;
}

interface SessionAPI {
  save: (session: Session) => Promise<{ success: boolean; error?: string }>;
  load: (sessionId: string) => Promise<Session | null>;
  delete: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  list: () => Promise<SessionMeta[]>;
  export: (sessionId: string, path: string) => Promise<{ success: boolean; error?: string }>;
  import: (path: string) => Promise<{ success: boolean; session?: Session; error?: string }>;
}

interface LiveStats {
  profit: number;
  netProfit: number;
  shots: number;
  hits: number;
  kills: number;
  deaths: number;
  criticals: number;
  lootValue: number;
  totalSpend: number;
  weaponCost: number;
  armorCost: number;
  fapCost: number;
  miscCost: number;
  totalCost: number;
  returnRate: number;
  damageDealt: number;
  damageTaken: number;
  damageReduced: number;
  deflects: number;
  decay: number;
  armorDecay: number;
  fapDecay: number;
  repairBill: number;
  skillGains: number;
  skillEvents: number;
  duration: number;
  lastEvent?: string;
  // Markup-adjusted values
  lootValueWithMarkup?: number;
  netProfitWithMarkup?: number;
  returnRateWithMarkup?: number;
  markupEnabled?: boolean;
  // Manual expense inputs (for syncing between main/popout)
  manualArmorCost?: number;
  manualFapCost?: number;
  manualMiscCost?: number;
  // Session state
  sessionActive?: boolean;
  sessionPaused?: boolean;
  sessionName?: string;
}

interface PopoutAPI {
  open: () => Promise<{ success: boolean }>;
  close: () => Promise<{ success: boolean }>;
  resize: (width: number, height: number) => Promise<{ success: boolean }>;
  status: () => Promise<{ open: boolean }>;
  sendStats: (stats: LiveStats) => void;
  onStatsUpdate: (callback: (stats: LiveStats) => void) => () => void;
  requestStats: () => void;
  onStatsRequest: (callback: () => void) => () => void;
  onClose: (callback: () => void) => () => void;
  // Manual expense sync
  updateExpenses: (expenses: { armorCost: number; fapCost: number; miscCost: number }) => void;
  onExpenseUpdate: (callback: (expenses: { armorCost: number; fapCost: number; miscCost: number }) => void) => () => void;
  // Session control
  controlSession: (action: 'start' | 'stop' | 'pause' | 'resume') => void;
  onSessionControl: (callback: (action: 'start' | 'stop' | 'pause' | 'resume') => void) => () => void;
}

interface AsteroidLoot {
  itemName: string;
  quantity: number;
  value: number;
  timestamp: number;
}

interface Asteroid {
  id: string;
  type: string;
  size: string;
  coordinates: string;
  loot: AsteroidLoot[];
  totalValue: number;
  timestamp: number;
}

interface AsteroidAPI {
  save: (asteroids: Asteroid[]) => Promise<{ success: boolean; error?: string }>;
  load: () => Promise<Asteroid[]>;
}

interface UpdateInfo {
  version: string;
}

interface UpdateProgress {
  percent: number;
}

interface UpdateAPI {
  check: () => Promise<{ success: boolean; error?: string }>;
  install: () => Promise<{ success: boolean; error?: string }>;
  onChecking: (callback: () => void) => () => void;
  onAvailable: (callback: (info: UpdateInfo) => void) => () => void;
  onNotAvailable: (callback: () => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
  onProgress: (callback: (progress: UpdateProgress) => void) => () => void;
  onDownloaded: (callback: (info: UpdateInfo) => void) => () => void;
}

// Import markup types for API definition
import type { MarkupLibrary, MarkupConfig, ItemMarkupEntry, MarkupStats } from '../core/markup';

interface MarkupSyncResult {
  success: boolean;
  itemCount: number;
  newItems: number;
  lastSynced: string;
  error?: string;
}

interface MarkupImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

interface MarkupSearchOptions {
  category?: string;
  limit?: number;
  customOnly?: boolean;
}

interface MarkupItemUpdate {
  markupPercent?: number;
  markupValue?: number;  // Fixed markup in PED (renamed from markupFixed for consistency)
  useFixed?: boolean;
  notes?: string;
  favorite?: boolean;
  ignored?: boolean;
}

interface MarkupAPI {
  loadLibrary: () => Promise<MarkupLibrary>;
  saveLibrary: (library: MarkupLibrary) => Promise<{ success: boolean; error?: string }>;
  loadConfig: () => Promise<MarkupConfig>;
  saveConfig: (config: MarkupConfig) => Promise<{ success: boolean; error?: string }>;
  sync: (forceRefresh?: boolean) => Promise<MarkupSyncResult>;
  updateItem: (itemName: string, updates: MarkupItemUpdate) => Promise<ItemMarkupEntry | null>;
  search: (query: string, options?: MarkupSearchOptions) => Promise<ItemMarkupEntry[]>;
  getStats: () => Promise<MarkupStats>;
  exportCSV: () => Promise<string>;
  importCSV: (csvContent: string, mode: 'merge' | 'replace') => Promise<MarkupImportResult>;
  bulkUpdate: (updates: Array<{ itemName: string; updates: MarkupItemUpdate }>) => Promise<{ success: boolean; updatedCount: number }>;
  deleteItem: (itemName: string) => Promise<void>;
  itemExists: (itemName: string) => Promise<boolean>;
  addManualItem: (itemName: string, ttValue: number, markup: number, useFixed: boolean) => Promise<void>;
}

interface IpcRendererAPI {
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
}

interface ShellAPI {
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron?: {
      log: LogAPI;
      equipment: EquipmentAPI;
      session: SessionAPI;
      popout: PopoutAPI;
      asteroid: AsteroidAPI;
      update: UpdateAPI;
      ipcRenderer: IpcRendererAPI;
      markup: MarkupAPI;
      shell: ShellAPI;
    };
  }
}

// Re-export for convenience
export type { LogEvent } from '../core/types';

export type { LogEvent, LogAPI, SessionAPI, SessionMeta, PopoutAPI, LiveStats, AsteroidAPI, Asteroid, AsteroidLoot, UpdateAPI, UpdateInfo, UpdateProgress, IpcRendererAPI, MarkupAPI, MarkupSyncResult, MarkupImportResult, MarkupSearchOptions, MarkupItemUpdate };
