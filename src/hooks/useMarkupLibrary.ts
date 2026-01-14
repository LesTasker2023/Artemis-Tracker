/**
 * useMarkupLibrary Hook
 * React hook for managing item markup library state
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  MarkupLibrary, 
  MarkupConfig, 
  ItemMarkupEntry, 
  MarkupStats 
} from '../core/markup';
import type { 
  MarkupItemUpdate, 
  MarkupSearchOptions, 
  MarkupSyncResult, 
  MarkupImportResult 
} from '../types/electron';
import { calculateLootMarkup, EMPTY_MARKUP_CONFIG } from '../core/markup';

interface UseMarkupLibraryResult {
  // State
  library: MarkupLibrary | null;
  config: MarkupConfig | null;
  stats: MarkupStats | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  
  // Actions
  syncFromAPI: (forceRefresh?: boolean) => Promise<MarkupSyncResult | null>;
  updateItem: (itemName: string, updates: MarkupItemUpdate) => Promise<ItemMarkupEntry | null>;
  bulkUpdate: (updates: Array<{ itemName: string; updates: MarkupItemUpdate }>) => Promise<number>;
  searchItems: (query: string, options?: MarkupSearchOptions) => Promise<ItemMarkupEntry[]>;
  saveConfig: (config: Partial<MarkupConfig>) => Promise<boolean>;
  exportCSV: () => Promise<string | null>;
  importCSV: (csvContent: string, mode: 'merge' | 'replace') => Promise<MarkupImportResult | null>;
  refresh: () => Promise<void>;
  
  // Calculations
  getMarkupValue: (itemName: string, ttValue: number) => number;
  getLootMarkup: (lootItems: Array<{ itemName: string; value: number }>) => {
    totalTT: number;
    totalMarkup: number;
    totalWithMarkup: number;
  };
  
  // Utilities
  getItem: (itemName: string) => ItemMarkupEntry | undefined;
  getItemsByCategory: (category: string) => ItemMarkupEntry[];
  getFavorites: () => ItemMarkupEntry[];
  getCustomizedItems: () => ItemMarkupEntry[];
}

const DEFAULT_CONFIG: MarkupConfig = EMPTY_MARKUP_CONFIG;

export function useMarkupLibrary(): UseMarkupLibraryResult {
  const [library, setLibrary] = useState<MarkupLibrary | null>(null);
  const [config, setConfig] = useState<MarkupConfig | null>(null);
  const [stats, setStats] = useState<MarkupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load library and config on mount, auto-sync if empty
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    if (!window.electron?.markup) {
      setError('Markup API not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [loadedLibrary, loadedConfig, loadedStats] = await Promise.all([
        window.electron.markup.loadLibrary(),
        window.electron.markup.loadConfig(),
        window.electron.markup.getStats(),
      ]);

      // Auto-sync from static file if library is empty
      if (!loadedLibrary || Object.keys(loadedLibrary.items || {}).length === 0) {
        console.log('[useMarkupLibrary] Library empty, auto-syncing from static file...');
        const syncResult = await window.electron.markup.sync(true);
        
        if (syncResult.success) {
          const [updatedLibrary, updatedStats] = await Promise.all([
            window.electron.markup.loadLibrary(),
            window.electron.markup.getStats(),
          ]);
          setLibrary(updatedLibrary);
          setConfig(loadedConfig);
          setStats(updatedStats);
        } else {
          setLibrary(loadedLibrary);
          setConfig(loadedConfig);
          setStats(loadedStats);
          if (syncResult.error) {
            setError(syncResult.error);
          }
        }
      } else {
        setLibrary(loadedLibrary);
        setConfig(loadedConfig);
        setStats(loadedStats);
      }
    } catch (e) {
      console.error('[useMarkupLibrary] Failed to load data:', e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const syncFromAPI = useCallback(async (forceRefresh = false): Promise<MarkupSyncResult | null> => {
    if (!window.electron?.markup) {
      setError('Markup API not available');
      return null;
    }

    try {
      setSyncing(true);
      setError(null);

      const result = await window.electron.markup.sync(forceRefresh);
      
      if (result.success) {
        // Reload library after sync
        const [updatedLibrary, updatedStats] = await Promise.all([
          window.electron.markup.loadLibrary(),
          window.electron.markup.getStats(),
        ]);
        setLibrary(updatedLibrary);
        setStats(updatedStats);
        
        // Update config with last synced time
        if (config) {
          const updatedConfig = { ...config, lastSynced: result.lastSynced };
          setConfig(updatedConfig);
        }
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (e) {
      console.error('[useMarkupLibrary] Sync failed:', e);
      setError(String(e));
      return null;
    } finally {
      setSyncing(false);
    }
  }, [config]);

  const updateItem = useCallback(async (
    itemName: string, 
    updates: MarkupItemUpdate
  ): Promise<ItemMarkupEntry | null> => {
    if (!window.electron?.markup) {
      setError('Markup API not available');
      return null;
    }

    try {
      setError(null);
      const updatedItem = await window.electron.markup.updateItem(itemName, updates);
      
      if (updatedItem && library) {
        // Update local state
        setLibrary({
          ...library,
          items: {
            ...library.items,
            [itemName]: updatedItem,
          },
        });
        
        // Refresh stats
        const newStats = await window.electron.markup.getStats();
        setStats(newStats);
      }

      return updatedItem;
    } catch (e) {
      console.error('[useMarkupLibrary] Update item failed:', e);
      setError(String(e));
      return null;
    }
  }, [library]);

  const bulkUpdate = useCallback(async (
    updates: Array<{ itemName: string; updates: MarkupItemUpdate }>
  ): Promise<number> => {
    if (!window.electron?.markup) {
      setError('Markup API not available');
      return 0;
    }

    try {
      setError(null);
      const result = await window.electron.markup.bulkUpdate(updates);
      
      if (result.success) {
        // Reload library after bulk update
        const [updatedLibrary, updatedStats] = await Promise.all([
          window.electron.markup.loadLibrary(),
          window.electron.markup.getStats(),
        ]);
        setLibrary(updatedLibrary);
        setStats(updatedStats);
      }

      return result.updatedCount;
    } catch (e) {
      console.error('[useMarkupLibrary] Bulk update failed:', e);
      setError(String(e));
      return 0;
    }
  }, []);

  const searchItems = useCallback(async (
    query: string, 
    options?: MarkupSearchOptions
  ): Promise<ItemMarkupEntry[]> => {
    if (!window.electron?.markup) {
      return [];
    }

    try {
      return await window.electron.markup.search(query, options);
    } catch (e) {
      console.error('[useMarkupLibrary] Search failed:', e);
      return [];
    }
  }, []);

  const saveConfig = useCallback(async (updates: Partial<MarkupConfig>): Promise<boolean> => {
    if (!window.electron?.markup) {
      setError('Markup API not available');
      return false;
    }

    try {
      setError(null);
      const newConfig: MarkupConfig = {
        ...DEFAULT_CONFIG,
        ...config,
        ...updates,
      };

      const result = await window.electron.markup.saveConfig(newConfig);
      
      if (result.success) {
        setConfig(newConfig);
        return true;
      } else if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (e) {
      console.error('[useMarkupLibrary] Save config failed:', e);
      setError(String(e));
      return false;
    }
  }, [config]);

  const exportCSV = useCallback(async (): Promise<string | null> => {
    if (!window.electron?.markup) {
      setError('Markup API not available');
      return null;
    }

    try {
      setError(null);
      return await window.electron.markup.exportCSV();
    } catch (e) {
      console.error('[useMarkupLibrary] Export CSV failed:', e);
      setError(String(e));
      return null;
    }
  }, []);

  const importCSV = useCallback(async (
    csvContent: string, 
    mode: 'merge' | 'replace'
  ): Promise<MarkupImportResult | null> => {
    if (!window.electron?.markup) {
      setError('Markup API not available');
      return null;
    }

    try {
      setError(null);
      const result = await window.electron.markup.importCSV(csvContent, mode);
      
      if (result.success) {
        // Reload library after import
        const [updatedLibrary, updatedStats] = await Promise.all([
          window.electron.markup.loadLibrary(),
          window.electron.markup.getStats(),
        ]);
        setLibrary(updatedLibrary);
        setStats(updatedStats);
      }

      return result;
    } catch (e) {
      console.error('[useMarkupLibrary] Import CSV failed:', e);
      setError(String(e));
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadData();
    // Notify other components that markup changed
    window.dispatchEvent(new Event('markup-changed'));
  }, [loadData]);

  // Calculation helpers - these work with local state for performance
  const getMarkupValue = useCallback((itemName: string, ttValue: number): number => {
    if (!library || !config?.enabled) {
      return ttValue;
    }

    const item = library.items[itemName];
    if (item && item.markupPercent !== undefined) {
      // markupPercent of 100 = TT value, 150 = 50% markup
      return ttValue * (item.markupPercent / 100);
    }

    // Use default markup for unknown items
    return ttValue * ((config.defaultMarkupPercent || 100) / 100);
  }, [library, config]);

  const getLootMarkup = useCallback((
    lootItems: Array<{ itemName: string; value: number }>
  ): { totalTT: number; totalMarkup: number; totalWithMarkup: number } => {
    if (!library || !config?.enabled) {
      const totalTT = lootItems.reduce((sum, item) => sum + item.value, 0);
      return { totalTT, totalMarkup: 0, totalWithMarkup: totalTT };
    }

    const result = calculateLootMarkup(lootItems, library, config.defaultMarkupPercent || 100);
    return {
      totalTT: result.totalTT,
      totalMarkup: result.totalMarkup,
      totalWithMarkup: result.totalWithMarkup,
    };
  }, [library, config]);

  // Utility functions
  const getItem = useCallback((itemName: string): ItemMarkupEntry | undefined => {
    return library?.items[itemName];
  }, [library]);

  const getItemsByCategory = useCallback((category: string): ItemMarkupEntry[] => {
    if (!library) return [];
    return Object.values(library.items).filter(item => item.category === category);
  }, [library]);

  const getFavorites = useCallback((): ItemMarkupEntry[] => {
    if (!library) return [];
    return Object.values(library.items).filter(item => item.favorite === true);
  }, [library]);

  const getCustomizedItems = useCallback((): ItemMarkupEntry[] => {
    if (!library) return [];
    return Object.values(library.items).filter(item => item.isCustom === true);
  }, [library]);

  return {
    // State
    library,
    config,
    stats,
    loading,
    syncing,
    error,
    
    // Actions
    syncFromAPI,
    updateItem,
    bulkUpdate,
    searchItems,
    saveConfig,
    exportCSV,
    importCSV,
    refresh,
    
    // Calculations
    getMarkupValue,
    getLootMarkup,
    
    // Utilities
    getItem,
    getItemsByCategory,
    getFavorites,
    getCustomizedItems,
  };
}

/**
 * Lightweight hook for just calculating markup on loot
 * Use this in components that don't need full library management
 */
export function useMarkupCalculation() {
  const { library, config, loading, getMarkupValue, getLootMarkup } = useMarkupLibrary();
  
  return {
    isReady: !loading && library !== null,
    enabled: config?.enabled ?? false,
    getMarkupValue,
    getLootMarkup,
  };
}

export default useMarkupLibrary;
