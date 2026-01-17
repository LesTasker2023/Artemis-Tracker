/**
 * useLiveEvents Hook
 * Provides a rolling buffer of recent events from the chat log,
 * independent of session state. Useful for the Activity panel
 * to show live events when no session is active.
 */

import { useState, useEffect, useCallback } from "react";
import type { LogEvent } from "../core/types";

const MAX_LIVE_EVENTS = 30;

interface UseLiveEventsReturn {
  liveEvents: LogEvent[];
  clearLiveEvents: () => void;
  isLoading: boolean;
}

export function useLiveEvents(): UseLiveEventsReturn {
  const [liveEvents, setLiveEvents] = useState<LogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter out noise events we don't want in the live feed
  const shouldShowEvent = (event: LogEvent): boolean => {
    const noiseTypes = ['UNKNOWN', 'POSITION', 'position'];
    return !noiseTypes.includes(event.type);
  };

  // Load initial buffer from main process
  useEffect(() => {
    const loadInitialEvents = async () => {
      if (!window.electron?.liveEvents) {
        setIsLoading(false);
        return;
      }
      
      try {
        const events = await window.electron.liveEvents.get();
        setLiveEvents(events.filter(shouldShowEvent));
      } catch (err) {
        console.error('[useLiveEvents] Failed to load initial events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialEvents();
  }, []);

  // Subscribe to live events
  useEffect(() => {
    if (!window.electron?.liveEvents) return;

    const unsubscribe = window.electron.liveEvents.onEvent((event: LogEvent) => {
      if (!shouldShowEvent(event)) return;
      
      setLiveEvents(prev => {
        const updated = [...prev, event];
        // Keep only the last MAX_LIVE_EVENTS
        if (updated.length > MAX_LIVE_EVENTS) {
          return updated.slice(-MAX_LIVE_EVENTS);
        }
        return updated;
      });
    });

    return unsubscribe;
  }, []);

  const clearLiveEvents = useCallback(() => {
    setLiveEvents([]);
    window.electron?.liveEvents?.clear();
  }, []);

  return {
    liveEvents,
    clearLiveEvents,
    isLoading,
  };
}
