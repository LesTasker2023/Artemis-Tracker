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

interface EquipmentAPI {
  load: (type: string) => Promise<unknown[]>;
}

interface SessionMeta {
  id: string;
  name: string;
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
  returnRate: number;
  damageDealt: number;
  damageTaken: number;
  damageReduced: number;
  deflects: number;
  decay: number;
  repairBill: number;
  skillGains: number;
  skillEvents: number;
  duration: number;
  lastEvent?: string;
}

interface PopoutAPI {
  open: () => Promise<{ success: boolean }>;
  close: () => Promise<{ success: boolean }>;
  status: () => Promise<{ open: boolean }>;
  sendStats: (stats: LiveStats) => void;
  onStatsUpdate: (callback: (stats: LiveStats) => void) => () => void;
  requestStats: () => void;
  onStatsRequest: (callback: () => void) => () => void;
  onClose: (callback: () => void) => () => void;
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

interface IpcRendererAPI {
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electron?: {
      log: LogAPI;
      equipment: EquipmentAPI;
      session: SessionAPI;
      popout: PopoutAPI;
      asteroid: AsteroidAPI;
      ipcRenderer: IpcRendererAPI;
    };
  }
}

// Re-export for convenience
export type { LogEvent } from '../core/types';

export type { LogEvent, LogAPI, SessionAPI, SessionMeta, PopoutAPI, LiveStats, AsteroidAPI, Asteroid, AsteroidLoot, IpcRendererAPI };
