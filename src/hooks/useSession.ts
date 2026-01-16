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
  getQuickStats,
  QuickStats,
  rebuildRunningStats,
} from "../core/session";
import { LogEvent } from "../core/types";
import { logEventToParsedEvent, isCriticalHit } from "../core/parser";
import { getActiveLoadout } from "../core/loadout";
import { getStoredPlayerName } from "./usePlayerName";
import type { MarkupLibrary } from "../core/markup";

interface UseSessionOptions {
  markupLibrary?: MarkupLibrary | null;
  defaultMarkupPercent?: number;
}

interface UseSessionReturn {
  // Current session state
  session: Session | null;
  stats: SessionStats | null;
  quickStats: QuickStats | null; // O(1) stats for real-time display
  isActive: boolean;
  isPaused: boolean;

  // Session control (one-way: start -> add events -> stop)
  start: (name?: string, tags?: string[]) => void;
  stop: () => void;
  reset: () => void;
  pause: () => void;
  unpause: () => void;

  // Resume a previous session
  resume: (sessionToResume: Session) => void;

  // Event handling (only works while session is active)
  addEvent: (event: LogEvent) => void;

  // Recalculate stats (useful when player name changes or markup changes)
  recalculateStats: () => void;
  
  // Update manual expenses
  updateExpenses: (expenses: { armorCost: number; fapCost: number; miscCost: number }) => void;
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
      } catch (e) {
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [session, delay]);
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const { markupLibrary, defaultMarkupPercent = 100 } = options;
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loadoutVersion, setLoadoutVersion] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Auto-save session to file (debounced)
  useDebouncedSave(session, 500);
  
  // Listen for loadout changes to recalculate armor decay
  useEffect(() => {
    const handleLoadoutChanged = () => {
      setLoadoutVersion(v => v + 1);
    };
    
    window.addEventListener('loadouts-changed', handleLoadoutChanged);
    return () => {
      window.removeEventListener('loadouts-changed', handleLoadoutChanged);
    };
  }, []);
  
  // Recalculate stats when session changes OR events are added OR markup changes OR loadout changes OR pause state changes
  // Throttle full recalculation to every 500ms max, use quick stats in between for performance
  const lastFullCalcRef = useRef<number>(0);
  const pendingCalcRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (session) {
      const now = Date.now();
      const timeSinceLastCalc = now - lastFullCalcRef.current;
      
      // Clear any pending calculation
      if (pendingCalcRef.current) {
        clearTimeout(pendingCalcRef.current);
        pendingCalcRef.current = null;
      }
      
      // If it's been > 500ms since last full calc, do it immediately
      // This ensures we always have fresh data when browsing or after pauses
      if (timeSinceLastCalc > 500) {
        const playerName = getStoredPlayerName();
        const loadout = getActiveLoadout();
        setStats(calculateSessionStats(session, playerName || undefined, loadout, markupLibrary, defaultMarkupPercent));
        lastFullCalcRef.current = now;
      } else {
        // Schedule a calculation for later (debounce rapid events)
        pendingCalcRef.current = setTimeout(() => {
          const playerName = getStoredPlayerName();
          const loadout = getActiveLoadout();
          setStats(calculateSessionStats(session, playerName || undefined, loadout, markupLibrary, defaultMarkupPercent));
          lastFullCalcRef.current = Date.now();
          pendingCalcRef.current = null;
        }, 500 - timeSinceLastCalc);
      }
    } else {
      setStats(null);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (pendingCalcRef.current) {
        clearTimeout(pendingCalcRef.current);
      }
    };
  }, [session, session?.events.length, session?.pausedAt, session?.totalPausedTime, markupLibrary, defaultMarkupPercent, loadoutVersion]);
  
  // Manual recalculate (when player name changes or markup changes)
  const recalculateStats = useCallback(() => {
    if (session) {
      const playerName = getStoredPlayerName();
      const loadout = getActiveLoadout();
      setStats(calculateSessionStats(session, playerName || undefined, loadout, markupLibrary, defaultMarkupPercent));
    }
  }, [session, markupLibrary, defaultMarkupPercent]);
  
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
          // Rebuild running stats if missing (legacy session)
          let sessionToRestore = loaded;
          if (!sessionToRestore.runningStats) {
            console.log('[useSession] Rebuilding running stats on restore');
            const playerName = getStoredPlayerName();
            sessionToRestore = rebuildRunningStats(sessionToRestore, playerName || undefined);
          }
          setSession(sessionToRestore);
          // Restore pause state if session was paused
          if (sessionToRestore.pausedAt) {
            setIsPaused(true);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }).catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
    }
  }, []);
  
  const start = useCallback(async (name?: string, tags?: string[]) => {
    console.log('[useSession] start invoked, name:', name, 'tags:', tags);
    
    // End any sessions without endedAt (cleanup orphaned sessions)
    try {
      const allSessions = await window.electron?.session?.listAll();
      if (allSessions) {
        const now = new Date().toISOString();
        const orphanedSessions = allSessions.filter(meta => !meta.endedAt);
        
        // End all orphaned sessions
        for (const meta of orphanedSessions) {
          try {
            const fullSession = await window.electron?.session?.load(meta.id);
            if (fullSession && !fullSession.endedAt) {
              const ended = endSession(fullSession);
              await window.electron?.session?.save(ended);
              console.log('[useSession] Auto-ended orphaned session:', meta.id);
            }
          } catch (e) {
            console.error('[useSession] Failed to end orphaned session:', meta.id, e);
          }
        }
      }
    } catch (e) {
      console.error('[useSession] Failed to cleanup orphaned sessions:', e);
    }
    
    // End any existing active session first
    if (session && !session.endedAt) {
      const ended = endSession(session);
      try {
        await window.electron?.session?.save(ended);
      } catch (e) {
      }
    }

    const newSession = createSession(name, tags);

    // Immediately save to file
    try {
      await window.electron?.session?.save(newSession);
    } catch (e) {
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
      } catch (e) {
      }
      
      setSession(ended);
      setIsPaused(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);
  
  const pause = useCallback(() => {
    console.log('[useSession] pause invoked');
    if (session && !session.endedAt && !isPaused) {
      setSession(prev => {
        if (!prev || prev.endedAt) return prev;
        return {
          ...prev,
          pausedAt: new Date().toISOString(),
        };
      });
      setIsPaused(true);
    }
  }, [session, isPaused]);
  
  const unpause = useCallback(() => {
    console.log('[useSession] unpause invoked');
    if (session && !session.endedAt && isPaused && session.pausedAt) {
      setSession(prev => {
        if (!prev || prev.endedAt || !prev.pausedAt) return prev;
        const pauseDuration = Date.now() - new Date(prev.pausedAt).getTime();
        return {
          ...prev,
          pausedAt: undefined,
          totalPausedTime: (prev.totalPausedTime || 0) + pauseDuration,
        };
      });
      setIsPaused(false);
    }
  }, [session, isPaused]);
  
  const reset = useCallback(() => {
    setSession(null);
    setStats(null);
    setIsPaused(false);
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
      } catch (e) {
      }
    }
    
    // Clear the endedAt to make it active again
    let resumed: Session = {
      ...sessionToResume,
      endedAt: undefined,
    };
    
    // Rebuild running stats if missing (legacy session migration)
    if (!resumed.runningStats) {
      console.log('[useSession] Rebuilding running stats for legacy session');
      const playerName = getStoredPlayerName();
      resumed = rebuildRunningStats(resumed, playerName || undefined);
    }
    
    // Save immediately
    try {
      await window.electron?.session?.save(resumed);
    } catch (e) {
    }
    
    setSession(resumed);
    return resumed;
  }, [session]);
  
  const addEvent = useCallback((event: LogEvent) => {
    console.log('[useSession] addEvent:', event.type, event.timestamp);
    // Reject events when paused
    if (isPaused) {
      console.log('[useSession] Event rejected - session is paused');
      return;
    }
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
      // Pass player name for tracking player's own globals
      const playerName = getStoredPlayerName();
      return addEventToSession(prev, parsed, currentLoadout, playerName);
    });
    // Note: useDebouncedSave will auto-save after state updates
  }, [isPaused]);
  
  // Update manual expenses on the session
  const updateExpenses = useCallback((expenses: { armorCost: number; fapCost: number; miscCost: number }) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        manualArmorCost: expenses.armorCost,
        manualFapCost: expenses.fapCost,
        manualMiscCost: expenses.miscCost,
      };
    });
  }, []);
  
  // Quick stats - O(1) access to running stats for real-time display
  const quickStats = session ? getQuickStats(session) : null;
  
  return {
    session,
    stats,
    quickStats,
    isActive: session !== null && !session.endedAt,
    isPaused,
    start,
    stop,
    reset,
    pause,
    unpause,
    resume,
    addEvent,
    recalculateStats,
    updateExpenses,
  };
}
