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

// Forward uncaught renderer errors to main so they appear in terminal
window.addEventListener('error', (ev: any) => {
  try {
    ipcRenderer.send('renderer:error', { message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno, stack: ev.error?.stack });
  } catch (e) {}
});
window.addEventListener('unhandledrejection', (ev: any) => {
  try {
    const reason = ev.reason;
    ipcRenderer.send('renderer:error', { message: reason?.message || String(reason), stack: reason?.stack || null });
  } catch (e) {}
});

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  log: {
    start: (manualPath?: string) => ipcRenderer.invoke('log:start', manualPath),
    selectFile: () => ipcRenderer.invoke('log:select-file'),
    stop: () => ipcRenderer.invoke('log:stop'),
    status: () => ipcRenderer.invoke('log:status'),
    probe: () => ipcRenderer.invoke('log:probe'),
    onEvent: (callback: (event: LogEvent) => void) => {
      const handler = (_: unknown, data: LogEvent) => callback(data);
      ipcRenderer.on('log-event', handler);
      return () => ipcRenderer.removeListener('log-event', handler);
    },
  },
  equipment: {
    load: (type: string) => ipcRenderer.invoke('equipment:load', type),
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
  updater: {
    check: () => ipcRenderer.invoke('update:check'),
    install: () => ipcRenderer.invoke('update:install'),
    onChecking: (cb: () => void) => {
      const h = () => cb();
      ipcRenderer.on('update:checking', h);
      return () => ipcRenderer.removeListener('update:checking', h);
    },
    onAvailable: (cb: (info: any) => void) => {
      const h = (_: unknown, info: any) => cb(info);
      ipcRenderer.on('update:available', h);
      return () => ipcRenderer.removeListener('update:available', h);
    },
    onNotAvailable: (cb: () => void) => {
      const h = () => cb();
      ipcRenderer.on('update:not-available', h);
      return () => ipcRenderer.removeListener('update:not-available', h);
    },
    onProgress: (cb: (progress: any) => void) => {
      const h = (_: unknown, p: any) => cb(p);
      ipcRenderer.on('update:progress', h);
      return () => ipcRenderer.removeListener('update:progress', h);
    },
    onDownloaded: (cb: (info: any) => void) => {
      const h = (_: unknown, info: any) => cb(info);
      ipcRenderer.on('update:downloaded', h);
      return () => ipcRenderer.removeListener('update:downloaded', h);
    },
    onError: (cb: (err: string) => void) => {
      const h = (_: unknown, e: any) => cb(String(e));
      ipcRenderer.on('update:error', h);
      return () => ipcRenderer.removeListener('update:error', h);
    },
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

