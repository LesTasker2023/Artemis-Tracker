/**
 * ARTEMIS v3 - Log Events Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { LogEvent } from '../core/types';

interface UseLogEventsOptions {
  maxEvents?: number;
}

export function useLogEvents(options: UseLogEventsOptions = {}) {
  const { maxEvents = Infinity } = options;
  
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [logPath, setLogPath] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Subscribe to events
  useEffect(() => {
    if (!window.electron) {
      setError('Not running in Electron');
      return;
    }

    const unsubscribe = window.electron.log.onEvent((event) => {
      setEvents((prev) => {
        // No limit - just append
        if (maxEvents === Infinity) {
          return [...prev, event];
        }
        return [...prev.slice(-(maxEvents - 1)), event];
      });
    });

    return () => unsubscribe();
  }, [maxEvents]);

  const start = useCallback(async (manualPath?: string) => {
    if (!window.electron) return;

    const result = await window.electron.log.start(manualPath);
    if (result.success) {
      setIsWatching(true);
      setLogPath(result.path || '');
      setError('');
    } else {
      setError(result.error || 'Failed to start');
    }
  }, []);

  const selectFile = useCallback(async () => {
    if (!window.electron) return null;

    const result = await window.electron.log.selectFile();
    return result.success ? result.path : null;
  }, []);

  const stop = useCallback(async () => {
    if (!window.electron) return;

    await window.electron.log.stop();
    setIsWatching(false);
  }, []);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isWatching,
    logPath,
    error,
    start,
    stop,
    clear,
    selectFile,
  };
}
