import { useState, useEffect, useCallback } from 'react';
import { equipmentDB, EquipmentRecord } from '../core/equipment-db';

/**
 * Hook to load and provide equipment data
 */
export function useEquipmentDB() {
  const [loaded, setLoaded] = useState(equipmentDB.isLoaded());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loaded || loading) return;

    setLoading(true);
    equipmentDB.loadFromFiles().then(() => {
      setLoaded(true);
      setLoading(false);
    });
  }, [loaded, loading]);

  const search = useCallback((query: string, type: 'weapon' | 'amp' | 'scope' | 'sight'): EquipmentRecord[] => {
    return equipmentDB.search(query, type);
  }, []);

  const findByName = useCallback((name: string, type: 'weapon' | 'amp' | 'scope' | 'sight'): EquipmentRecord | undefined => {
    return equipmentDB.findByName(name, type);
  }, []);

  return { loaded, loading, search, findByName };
}
