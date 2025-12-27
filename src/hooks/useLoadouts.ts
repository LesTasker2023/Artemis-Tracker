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
 */
export function useLoadouts(): UseLoadoutsReturn {
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    setLoadouts(loadLoadouts());
    setActiveId(getActiveLoadoutId());
  }, []);

  // Derive active loadout and cost
  const activeLoadout = loadouts.find(l => l.id === activeId) ?? null;
  const costPerShot = activeLoadout ? getEffectiveCostPerShot(activeLoadout) : 0;

  const setActive = useCallback((id: string | null) => {
    setActiveId(id);
    setActiveLoadoutId(id);
  }, []);

  const save = useCallback((loadout: Loadout) => {
    const updated = saveLoadout(loadout);
    setLoadouts(updated);
  }, []);

  const remove = useCallback((id: string) => {
    const updated = deleteLoadout(id);
    setLoadouts(updated);
    if (activeId === id) {
      setActive(null);
    }
  }, [activeId, setActive]);

  const reload = useCallback(() => {
    setLoadouts(loadLoadouts());
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
