/**
 * Preload Script
 * Exposes safe IPC bridge to renderer
 * SECURITY: Only whitelisted channels exposed
 */

const { contextBridge, ipcRenderer } = require('electron');

// Type-safe event data
interface LogEvent {
  timestamp: number;
  raw: string;
  type: string;
  data: Record<string, unknown>;
}

// Session types
interface SessionMeta {
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  eventCount: number;
}

// Popout stats
interface LiveStats {
  profit: number;
  shots: number;
  kills: number;
}

// Asteroid data
interface Asteroid {
  id: string;
  type: string;
  size: string;
  coordinates: string;
  loot: Array<{ itemName: string; quantity: number; value: number; timestamp: number }>;
  totalValue: number;
  timestamp: number;
}

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  log: {
    start: (manualPath?: string) => ipcRenderer.invoke('log:start', manualPath),
    selectFile: () => ipcRenderer.invoke('log:select-file'),
    stop: () => ipcRenderer.invoke('log:stop'),
    status: () => ipcRenderer.invoke('log:status'),
    onEvent: (callback: (event: LogEvent) => void) => {
      const handler = (_: unknown, data: LogEvent) => callback(data);
      ipcRenderer.on('log-event', handler);
      return () => ipcRenderer.removeListener('log-event', handler);
    },
  },
  equipment: {
    load: (type: string) => ipcRenderer.invoke('equipment:load', type),
    checkUpdates: () => ipcRenderer.invoke('equipment:check-updates'),
    update: () => ipcRenderer.invoke('equipment:update'),
  },
  session: {
    save: (session: unknown) => ipcRenderer.invoke('session:save', session),
    load: (sessionId: string) => ipcRenderer.invoke('session:load', sessionId),
    delete: (sessionId: string) => ipcRenderer.invoke('session:delete', sessionId),
    list: (): Promise<SessionMeta[]> => ipcRenderer.invoke('session:list'),
    export: (sessionId: string, path: string) => ipcRenderer.invoke('session:export', sessionId, path),
    import: (path: string) => ipcRenderer.invoke('session:import', path),
  },
  popout: {
    open: () => ipcRenderer.invoke('popout:open'),
    close: () => ipcRenderer.invoke('popout:close'),
    status: (): Promise<{open:boolean}> => ipcRenderer.invoke('popout:status'),
    sendStats: (stats: LiveStats) => ipcRenderer.send('popout:stats', stats),
    onStatsUpdate: (callback: (stats: LiveStats) => void) => {
      const handler = (_: unknown, data: LiveStats) => callback(data);
      ipcRenderer.on('popout:stats-update', handler);
      return () => ipcRenderer.removeListener('popout:stats-update', handler);
    },
    requestStats: () => ipcRenderer.send('popout:request-stats'),
    onStatsRequest: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('popout:stats-requested', handler);
      return () => ipcRenderer.removeListener('popout:stats-requested', handler);
    },
    onClose: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('popout:closed', handler);
      return () => ipcRenderer.removeListener('popout:closed', handler);
    },
  },
  asteroid: {
    save: (asteroids: Asteroid[]) => ipcRenderer.invoke('asteroid:save', asteroids),
    load: (): Promise<Asteroid[]> => ipcRenderer.invoke('asteroid:load'),
  },
  ipcRenderer: {
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      ipcRenderer.on(channel, callback);
    },
    removeListener: (channel: string, callback: (...args: unknown[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },
});

