import { useState, useEffect, useCallback } from 'react';
import {
  Loadout,
  loadLoadouts,
  saveLoadout,
  deleteLoadout,
  getActiveLoadoutId,
  setActiveLoadoutId,
  getEffectiveCostPerShot,
} from '../core/loadout';

interface UseLoadoutsReturn {
  loadouts: Loadout[];
  activeLoadout: Loadout | null;
  costPerShot: number;
  setActive: (id: string | null) => void;
  save: (loadout: Loadout) => void;
  remove: (id: string) => void;
  reload: () => void;
}

/**
 * Hook for managing loadouts with active selection
 * Syncs state across all instances using custom events
 */
export function useLoadouts(): UseLoadoutsReturn {
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    setLoadouts(loadLoadouts());
    setActiveId(getActiveLoadoutId());
  }, []);

  // Listen for loadout changes from other components
  useEffect(() => {
    const handleLoadoutsChanged = () => {
      setLoadouts(loadLoadouts());
      setActiveId(getActiveLoadoutId());
    };

    // Listen for custom event from this window
    window.addEventListener('loadouts-changed', handleLoadoutsChanged);

    // Listen for storage changes from other windows/tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'artemis-loadouts' || e.key === 'artemis-active-loadout') {
        handleLoadoutsChanged();
      }
    });

    return () => {
      window.removeEventListener('loadouts-changed', handleLoadoutsChanged);
      window.removeEventListener('storage', handleLoadoutsChanged);
    };
  }, []);

  // Derive active loadout and cost
  const activeLoadout = loadouts.find(l => l.id === activeId) ?? null;
  const costPerShot = activeLoadout ? getEffectiveCostPerShot(activeLoadout) : 0;

  const setActive = useCallback((id: string | null) => {
    setActiveId(id);
    setActiveLoadoutId(id);
    // Notify other components
    window.dispatchEvent(new Event('loadouts-changed'));
  }, []);

  const save = useCallback((loadout: Loadout) => {
    const updated = saveLoadout(loadout);
    setLoadouts(updated);
    // Notify other components
    window.dispatchEvent(new Event('loadouts-changed'));
  }, []);

  const remove = useCallback((id: string) => {
    const updated = deleteLoadout(id);
    setLoadouts(updated);
    if (activeId === id) {
      setActive(null);
    }
    // Notify other components
    window.dispatchEvent(new Event('loadouts-changed'));
  }, [activeId, setActive]);

  const reload = useCallback(() => {
    setLoadouts(loadLoadouts());
    setActiveId(getActiveLoadoutId());
  }, []);

  return {
    loadouts,
    activeLoadout,
    costPerShot,
    setActive,
    save,
    remove,
    reload,
  };
}
