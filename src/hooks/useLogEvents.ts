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
    console.log('[useLogEvents] start called, manualPath:', manualPath, 'current:', logPath, 'isWatching:', isWatching);

    // If we're already watching the same path, avoid restarting
    if (isWatching && manualPath && manualPath === logPath) {
      console.log('[useLogEvents] already watching same file, skipping start');
      return { success: true, path: logPath, alreadyWatching: true } as any;
    }

    // If we're already watching (no manual path provided), skip starting again
    if (isWatching && !manualPath) {
      console.log('[useLogEvents] already watching (no manual path), skipping start');
      return { success: true, path: logPath, alreadyWatching: true } as any;
    }

    const result = await window.electron.log.start(manualPath);
    console.log('[useLogEvents] start result:', result);

    if (result.success) {
      setIsWatching(true);
      setLogPath(result.path || '');
      setError('');
    } else {
      setError(result.error || 'Failed to start');
    }
    return result;
  }, [isWatching, logPath]);

  const selectFile = useCallback(async () => {
    if (!window.electron) return null;
    console.log('[useLogEvents] selectFile called');

    const result = await window.electron.log.selectFile();
    console.log('[useLogEvents] selectFile result:', result);
    return result.success ? result.path : null;
  }, []);

  const stop = useCallback(async () => {
    if (!window.electron) return;
    console.log('[useLogEvents] stop called, isWatching:', isWatching);

    if (!isWatching) {
      console.log('[useLogEvents] stop called but not watching; skipping');
      return { success: true, skipped: true } as any;
    }

    const result = await window.electron.log.stop();
    console.log('[useLogEvents] stop result:', result);

    setIsWatching(false);
    setLogPath('');
    return result;
  }, [isWatching]);

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
