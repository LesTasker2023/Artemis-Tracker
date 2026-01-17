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
    readRaw: (options?: { maxLines?: number }) => ipcRenderer.invoke('log:read-raw', options),
    onEvent: (callback: (event: LogEvent) => void) => {
      const handler = (_: unknown, data: LogEvent) => callback(data);
      ipcRenderer.on('log-event', handler);
      return () => ipcRenderer.removeListener('log-event', handler);
    },
  },
  liveEvents: {
    get: (): Promise<LogEvent[]> => ipcRenderer.invoke('live-events:get'),
    clear: () => ipcRenderer.invoke('live-events:clear'),
    onEvent: (callback: (event: LogEvent) => void) => {
      const handler = (_: unknown, data: LogEvent) => callback(data);
      ipcRenderer.on('live-event', handler);
      return () => ipcRenderer.removeListener('live-event', handler);
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
    resize: (width: number, height: number) => ipcRenderer.invoke('popout:resize', width, height),
    getPosition: (): Promise<{ x: number; y: number }> => ipcRenderer.invoke('popout:getPosition'),
    setPosition: (x: number, y: number) => ipcRenderer.invoke('popout:setPosition', x, y),
    center: () => ipcRenderer.invoke('popout:center'),
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
    updateExpenses: (expenses: { armorCost: number; fapCost: number; miscCost: number }) => 
      ipcRenderer.send('popout:update-expenses', expenses),
    onExpenseUpdate: (callback: (expenses: { armorCost: number; fapCost: number; miscCost: number }) => void) => {
      const handler = (_: unknown, data: { armorCost: number; fapCost: number; miscCost: number }) => callback(data);
      ipcRenderer.on('popout:expense-update', handler);
      return () => ipcRenderer.removeListener('popout:expense-update', handler);
    },
    controlSession: (action: 'start' | 'stop' | 'pause' | 'resume') =>
      ipcRenderer.send('popout:session-control', action),
    onSessionControl: (callback: (action: 'start' | 'stop' | 'pause' | 'resume') => void) => {
      const handler = (_: unknown, action: 'start' | 'stop' | 'pause' | 'resume') => callback(action);
      ipcRenderer.on('popout:session-control-action', handler);
      return () => ipcRenderer.removeListener('popout:session-control-action', handler);
    },
  },
  asteroid: {
    save: (asteroids: Asteroid[]) => ipcRenderer.invoke('asteroid:save', asteroids),
    load: (): Promise<Asteroid[]> => ipcRenderer.invoke('asteroid:load'),
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    install: () => ipcRenderer.invoke('update:install'),
    onChecking: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('update:checking', handler);
      return () => ipcRenderer.removeListener('update:checking', handler);
    },
    onAvailable: (callback: (info: { version: string }) => void) => {
      const handler = (_: unknown, info: { version: string }) => callback(info);
      ipcRenderer.on('update:available', handler);
      return () => ipcRenderer.removeListener('update:available', handler);
    },
    onNotAvailable: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('update:not-available', handler);
      return () => ipcRenderer.removeListener('update:not-available', handler);
    },
    onError: (callback: (error: string) => void) => {
      const handler = (_: unknown, error: string) => callback(error);
      ipcRenderer.on('update:error', handler);
      return () => ipcRenderer.removeListener('update:error', handler);
    },
    onProgress: (callback: (progress: { percent: number }) => void) => {
      const handler = (_: unknown, progress: { percent: number }) => callback(progress);
      ipcRenderer.on('update:progress', handler);
      return () => ipcRenderer.removeListener('update:progress', handler);
    },
    onDownloaded: (callback: (info: { version: string }) => void) => {
      const handler = (_: unknown, info: { version: string }) => callback(info);
      ipcRenderer.on('update:downloaded', handler);
      return () => ipcRenderer.removeListener('update:downloaded', handler);
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
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
  markup: {
    loadLibrary: () => ipcRenderer.invoke('markup:load-library'),
    saveLibrary: (library: unknown) => ipcRenderer.invoke('markup:save-library', library),
    loadConfig: () => ipcRenderer.invoke('markup:load-config'),
    saveConfig: (config: unknown) => ipcRenderer.invoke('markup:save-config', config),
    sync: (forceRefresh?: boolean) => ipcRenderer.invoke('markup:sync', forceRefresh),
    updateItem: (itemName: string, updates: unknown) => ipcRenderer.invoke('markup:update-item', itemName, updates),
    search: (query: string, options?: unknown) => ipcRenderer.invoke('markup:search', query, options),
    getStats: () => ipcRenderer.invoke('markup:get-stats'),
    exportCSV: () => ipcRenderer.invoke('markup:export-csv'),
    importCSV: (csvContent: string, mode: 'merge' | 'replace') => ipcRenderer.invoke('markup:import-csv', csvContent, mode),
    bulkUpdate: (updates: Array<{ itemName: string; updates: unknown }>) => ipcRenderer.invoke('markup:bulk-update', updates),
    itemExists: (itemName: string) => ipcRenderer.invoke('markup:item-exists', itemName),
    addManualItem: (itemName: string, ttValue: number, markupPercent?: number, markupValue?: number) => 
      ipcRenderer.invoke('markup:add-manual-item', itemName, ttValue, markupPercent, markupValue),
    deleteItem: (itemName: string) => ipcRenderer.invoke('markup:delete-item', itemName),
  },
});

