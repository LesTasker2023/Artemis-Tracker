/**
 * ARTEMIS v3 - Player Name Hook
 * Stores and retrieves the user's in-game name
 * Used to filter globals to only show the player's own
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'artemis-player-name';

export function usePlayerName() {
  const [playerName, setPlayerNameState] = useState<string>('');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setPlayerNameState(stored);
    }
  }, []);

  // Save to localStorage when changed
  const setPlayerName = useCallback((name: string) => {
    setPlayerNameState(name);
    if (name.trim()) {
      localStorage.setItem(STORAGE_KEY, name.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    playerName,
    setPlayerName,
    hasPlayerName: playerName.trim().length > 0,
  };
}

/**
 * Get the stored player name (for use outside React components)
 */
export function getStoredPlayerName(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}
