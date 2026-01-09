/**
 * ARTEMIS v3 - Session Hook
 * Manages active session with loadout-aware event tracking
 * 
 * Flow:
 * - On start: Create session file immediately
 * - On every event: Update session file (always fresh)
 * - On stop: Mark session as ended, final save
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Session,
  SessionStats,
  createSession,
  addEventToSession,
  endSession,
  calculateSessionStats,
} from "../core/session";
import { LogEvent } from "../core/types";
import { logEventToParsedEvent, isCriticalHit } from "../core/parser";
import { getActiveLoadout } from "../core/loadout";
import { getStoredPlayerName } from "./usePlayerName";

interface UseSessionReturn {
  // Current session state
  session: Session | null;
  stats: SessionStats | null;
  isActive: boolean;
  
  // Session control (one-way: start -> add events -> stop)
  start: (name?: string) => void;
  stop: () => void;
  reset: () => void;
  
  // Resume a previous session
  resume: (sessionToResume: Session) => void;
  
  // Event handling (only works while session is active)
  addEvent: (event: LogEvent) => void;
  
  // Recalculate stats (useful when player name changes)
  recalculateStats: () => void;
}

const STORAGE_KEY = "artemis-active-session-id";

// Debounce save to avoid too many writes
function useDebouncedSave(session: Session | null, delay: number = 1000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!session) return;
    
    // Clear any pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Don't save if session hasn't changed
    const sessionJson = JSON.stringify(session);
    if (sessionJson === lastSavedRef.current) return;
    
    // Debounce the save
    timeoutRef.current = setTimeout(async () => {
      try {
        await window.electron?.session?.save(session);
        lastSavedRef.current = sessionJson;
        console.log(`[Session] Auto-saved (${session.events.length} events)`);
      } catch (e) {
        console.error("[Session] Auto-save failed:", e);
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [session, delay]);
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  
  // Auto-save session to file (debounced)
  useDebouncedSave(session, 500);
  
  // Recalculate stats when session changes OR events are added
  useEffect(() => {
    if (session) {
      const playerName = getStoredPlayerName();
      const loadout = getActiveLoadout();
      setStats(calculateSessionStats(session, playerName || undefined, loadout));
    } else {
      setStats(null);
    }
  }, [session, session?.events.length]);
  
  // Manual recalculate (when player name changes)
  const recalculateStats = useCallback(() => {
    if (session) {
      const playerName = getStoredPlayerName();
      const loadout = getActiveLoadout();
      setStats(calculateSessionStats(session, playerName || undefined, loadout));
    }
  }, [session]);
  
  // Store active session ID in localStorage for recovery
  useEffect(() => {
    if (session && !session.endedAt) {
      localStorage.setItem(STORAGE_KEY, session.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session?.id, session?.endedAt]);
  
  // Restore active session on mount
  useEffect(() => {
    const activeId = localStorage.getItem(STORAGE_KEY);
    if (activeId) {
      // Try to load the session from file
      window.electron?.session?.load(activeId).then(loaded => {
        if (loaded && !loaded.endedAt) {
          console.log(`[Session] Restored active session: ${loaded.id}`);
          setSession(loaded);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }).catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
    }
  }, []);
  
  const start = useCallback(async (name?: string) => {
    console.log('[useSession] start invoked, name:', name);
    // End any existing active session first
    if (session && !session.endedAt) {
      const ended = endSession(session);
      try {
        await window.electron?.session?.save(ended);
        console.log(`[Session] Auto-ended previous session: ${ended.id}`);
      } catch (e) {
        console.error("[Session] Failed to end previous session:", e);
      }
    }
    
    const newSession = createSession(name);
    
    // Immediately save to file
    try {
      await window.electron?.session?.save(newSession);
      console.log(`[Session] Created session: ${newSession.id}`);
    } catch (e) {
      console.error("[Session] Failed to create session file:", e);
    }
    
    setSession(newSession);
    return newSession;
  }, [session]);
  
  const stop = useCallback(async () => {
    console.log('[useSession] stop invoked');
    if (session) {
      const ended = endSession(session);
      
      // Final save with endedAt timestamp
      try {
        await window.electron?.session?.save(ended);
        console.log(`[Session] Ended session: ${ended.id}`);
      } catch (e) {
        console.error("[Session] Failed to save ended session:", e);
      }
      
      setSession(ended);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);
  
  const reset = useCallback(() => {
    setSession(null);
    setStats(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  // Resume a previous session - reopen it for recording
  const resume = useCallback(async (sessionToResume: Session) => {
    console.log('[useSession] resume invoked:', sessionToResume?.id);
    // End any existing active session first
    if (session && !session.endedAt) {
      const ended = endSession(session);
      try {
        await window.electron?.session?.save(ended);
        console.log(`[Session] Auto-ended previous session: ${ended.id}`);
      } catch (e) {
        console.error("[Session] Failed to end previous session:", e);
      }
    }
    
    // Clear the endedAt to make it active again
    const resumed: Session = {
      ...sessionToResume,
      endedAt: undefined,
    };
    
    // Save immediately
    try {
      await window.electron?.session?.save(resumed);
      console.log(`[Session] Resumed session: ${resumed.id}`);
    } catch (e) {
      console.error("[Session] Failed to resume session:", e);
    }
    
    setSession(resumed);
    return resumed;
  }, [session]);
  
  const addEvent = useCallback((event: LogEvent) => {
    console.log('[useSession] addEvent:', event.type, event.timestamp);
    setSession(prev => {
      if (!prev || prev.endedAt) return prev;
      // Convert LogEvent to ParsedEvent format
      const parsed = logEventToParsedEvent(event);
      // Set critical flag based on event type
      if (isCriticalHit(event.type)) {
        parsed.critical = true;
      }
      // Get current active loadout fresh from storage (not cached in hook state)
      // This ensures loadout swaps are captured correctly
      const currentLoadout = getActiveLoadout();
      return addEventToSession(prev, parsed, currentLoadout);
    });
    // Note: useDebouncedSave will auto-save after state updates
  }, []);
  
  return {
    session,
    stats,
    isActive: session !== null && !session.endedAt,
    start,
    stop,
    reset,
    resume,
    addEvent,
    recalculateStats,
  };
}
