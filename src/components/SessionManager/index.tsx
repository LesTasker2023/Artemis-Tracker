/**
 * SessionManager - Main Component
 * 3-column layout: Sidebar | Session List | Detail Panel
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Session } from "../../core/session";
import { calculateSessionStats } from "../../core/session";
import type { SessionMeta } from "../../types/electron";
import type { FilterState, SessionManagerProps } from "./types";
import { Sidebar } from "./Sidebar";
import { SessionList } from "./SessionList";
import { DetailPanel, AggregateStats } from "./DetailPanel";
import { getStoredPlayerName } from "../../hooks/usePlayerName";
import { useLoadouts } from "../../hooks/useLoadouts";

const MAX_DISPLAY_SESSIONS = 100;

// Cache for session stats (avoids recomputing on each sort)
interface SessionStatsCache {
  profit: number;
  profitWithMarkup: number;
  returnRate: number;
  returnRateWithMarkup: number;
  duration: number;
  lootValue: number;
  lootValueWithMarkup: number;
  totalCost: number;
  kills: number;
  shots: number;
  hits: number;
  criticals: number;
  skillGains: number;
  globalCount: number;
  hofs: number;
  manualExpenses: number; // Sum of armor + fap + misc costs
  loadoutIds: string[]; // Loadout IDs used in this session
}

export function SessionManager({
  onViewSession,
  onResumeSession,
  activeSessionId,
  activeSession,
  markupLibrary,
}: SessionManagerProps) {
  // Loadout data for displaying names
  const { loadouts } = useLoadouts();

  // Raw data from storage
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats cache for sorting by profit/return
  const [statsCache, setStatsCache] = useState<
    Record<string, SessionStatsCache>
  >({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Selected session (full data)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Lazy loading
  const [isReady, setIsReady] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    mode: "all",
    selectedTags: [],
    selectedLoadoutIds: [],
    searchQuery: "",
    sortBy: "newest",
  });

  // Markup toggle (TT vs MU values)
  const [showMarkup, setShowMarkup] = useState(true);

  // Additional expenses toggle
  const [applyExpenses, setApplyExpenses] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Auto-select and load first session after list loads
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId && !loading) {
      // Load first session
      (async () => {
        const firstSessionId = sessions[0].id;
        setSelectedSessionId(firstSessionId);
        try {
          const session = await window.electron?.session.load(firstSessionId);
          if (session) {
            setSelectedSession(session);
          }
        } catch (err) {
          console.error("[SessionManager] Failed to load first session:", err);
        }
      })();
    }
  }, [sessions, selectedSessionId, loading]);

  // Lazy loading - delay heavy operations
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Refresh list when active session updates (to show updated event counts and endedAt)
  useEffect(() => {
    if (activeSession && activeSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                eventCount: activeSession.events?.length || s.eventCount,
                endedAt: activeSession.endedAt, // Update endedAt to reflect session stop
              }
            : s
        )
      );
      // Update stats cache for active session
      if (activeSession) {
        const playerName = getStoredPlayerName();
        const stats = calculateSessionStats(
          activeSession,
          playerName || undefined,
          null, // loadout
          markupLibrary
        );
        const start = new Date(activeSession.startedAt).getTime();
        const end = activeSession.endedAt
          ? new Date(activeSession.endedAt).getTime()
          : Date.now();
        const manualExpenses =
          (activeSession.manualArmorCost ?? 0) +
          (activeSession.manualFapCost ?? 0) +
          (activeSession.manualMiscCost ?? 0);
        // Extract unique loadout IDs from session
        const loadoutIds = Array.from(
          new Set(
            activeSession.events
              ?.map((e) => e.loadoutId)
              .filter((id): id is string => !!id) ?? []
          )
        );
        setStatsCache((prev) => ({
          ...prev,
          [activeSessionId]: {
            profit: stats.profit,
            profitWithMarkup: stats.profitWithMarkup,
            returnRate: stats.returnRate,
            returnRateWithMarkup: stats.returnRateWithMarkup,
            duration: Math.floor((end - start) / 1000),
            lootValue: stats.lootValue,
            lootValueWithMarkup: stats.lootValueWithMarkup,
            totalCost: stats.totalCost,
            kills: stats.kills,
            shots: stats.shots,
            hits: stats.hits,
            criticals: stats.criticals,
            skillGains: stats.skillGains,
            globalCount: stats.globalCount,
            hofs: stats.hofs,
            manualExpenses,
            loadoutIds,
          },
        }));
      }
    }
  }, [activeSession, activeSessionId, markupLibrary]);

  // Clear stats cache when markupLibrary changes to force recalculation
  useEffect(() => {
    setStatsCache({});
  }, [markupLibrary]);

  // Load stats for all sessions (for display and sorting)
  useEffect(() => {
    if (sessions.length === 0) return;

    // Check if we already have stats for all sessions
    const missingIds = sessions
      .filter((s) => !statsCache[s.id])
      .map((s) => s.id);
    if (missingIds.length === 0) return;

    const loadStats = async () => {
      setLoadingStats(true);
      const playerName = getStoredPlayerName();
      const newCache: Record<string, SessionStatsCache> = { ...statsCache };

      for (const id of missingIds) {
        try {
          const session = await window.electron?.session.load(id);
          if (session) {
            const stats = calculateSessionStats(
              session,
              playerName || undefined,
              null, // loadout
              markupLibrary
            );
            const start = new Date(session.startedAt).getTime();
            const end = session.endedAt
              ? new Date(session.endedAt).getTime()
              : Date.now();
            const manualExpenses =
              (session.manualArmorCost ?? 0) +
              (session.manualFapCost ?? 0) +
              (session.manualMiscCost ?? 0);
            // Extract unique loadout IDs from session
            const loadoutIds = Array.from(
              new Set(
                session.events
                  ?.map((e) => e.loadoutId)
                  .filter((id): id is string => !!id) ?? []
              )
            );
            newCache[id] = {
              profit: stats.profit,
              profitWithMarkup: stats.profitWithMarkup,
              returnRate: stats.returnRate,
              returnRateWithMarkup: stats.returnRateWithMarkup,
              duration: Math.floor((end - start) / 1000),
              lootValue: stats.lootValue,
              lootValueWithMarkup: stats.lootValueWithMarkup,
              totalCost: stats.totalCost,
              kills: stats.kills,
              shots: stats.shots,
              hits: stats.hits,
              criticals: stats.criticals,
              skillGains: stats.skillGains,
              globalCount: stats.globalCount,
              hofs: stats.hofs,
              manualExpenses,
              loadoutIds,
            };
          }
        } catch (err) {
          console.error(
            `[SessionManager] Failed to load stats for ${id}:`,
            err
          );
        }
      }

      setStatsCache(newCache);
      setLoadingStats(false);
    };

    loadStats();
  }, [sessions, statsCache, markupLibrary]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const list = await window.electron?.session.list();
      if (list) {
        // Sort by most recent first
        const sorted = list.sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
        setSessions(sorted);
      }
    } catch (err) {
      console.error("[SessionManager] Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get duration in seconds
  const getDuration = useCallback((s: SessionMeta) => {
    const start = new Date(s.startedAt).getTime();
    const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
    return Math.floor((end - start) / 1000);
  }, []);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sessions.forEach((session) => {
      session.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [sessions]);

  // Extract all unique loadout IDs used across sessions
  const allLoadoutIds = useMemo(() => {
    const loadoutSet = new Set<string>();
    Object.values(statsCache).forEach((cached) => {
      cached.loadoutIds?.forEach((id) => loadoutSet.add(id));
    });
    return Array.from(loadoutSet);
  }, [statsCache]);

  // Map loadout IDs to names
  const loadoutNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    loadouts.forEach((loadout) => {
      map[loadout.id] = loadout.name || "Unnamed Loadout";
    });
    return map;
  }, [loadouts]);

  // Session counts for sidebar
  const sessionCounts = useMemo(() => {
    return {
      all: sessions.length,
      active: sessions.filter((s) => !s.endedAt).length,
      completed: sessions.filter((s) => !!s.endedAt).length,
    };
  }, [sessions]);

  // Filter and sort sessions
  const displaySessions = useMemo(() => {
    if (!isReady) return [];

    let filtered = [...sessions];

    // Apply mode filter
    switch (filters.mode) {
      case "active":
        filtered = filtered.filter((s) => !s.endedAt);
        break;
      case "completed":
        filtered = filtered.filter((s) => !!s.endedAt);
        break;
    }

    // Apply tag filter
    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter((s) =>
        filters.selectedTags.some((tag) => s.tags?.includes(tag))
      );
    }

    // Apply loadout filter
    if (filters.selectedLoadoutIds.length > 0) {
      filtered = filtered.filter((s) => {
        const cached = statsCache[s.id];
        if (!cached) return false;
        return filters.selectedLoadoutIds.some((loadoutId) =>
          cached.loadoutIds.includes(loadoutId)
        );
      });
    }

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(query));
    }

    // Apply sort
    switch (filters.sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );
        break;
      case "duration-high":
        filtered.sort((a, b) => getDuration(b) - getDuration(a));
        break;
      case "duration-low":
        filtered.sort((a, b) => getDuration(a) - getDuration(b));
        break;
      case "profit-high":
        filtered.sort(
          (a, b) =>
            (statsCache[b.id]?.profit ?? 0) - (statsCache[a.id]?.profit ?? 0)
        );
        break;
      case "profit-low":
        filtered.sort(
          (a, b) =>
            (statsCache[a.id]?.profit ?? 0) - (statsCache[b.id]?.profit ?? 0)
        );
        break;
      case "return-high":
        filtered.sort(
          (a, b) =>
            (statsCache[b.id]?.returnRate ?? 0) -
            (statsCache[a.id]?.returnRate ?? 0)
        );
        break;
      case "return-low":
        filtered.sort(
          (a, b) =>
            (statsCache[a.id]?.returnRate ?? 0) -
            (statsCache[b.id]?.returnRate ?? 0)
        );
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    // Limit results
    return filtered.slice(0, MAX_DISPLAY_SESSIONS);
  }, [isReady, sessions, filters, statsCache, getDuration]);

  // Handle filter changes
  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    // Clear selection when filters change
    if (updates.mode !== undefined || updates.selectedTags !== undefined) {
      setSelectedSessionId(null);
      setSelectedSession(null);
    }
  }, []);

  // Handle session selection
  const handleSelectSession = useCallback(async (id: string) => {
    setSelectedSessionId(id);
    try {
      const session = await window.electron?.session.load(id);
      if (session) {
        setSelectedSession(session);
      }
    } catch (err) {
      console.error("[SessionManager] Failed to load session:", err);
    }
  }, []);

  // Handle session deletion
  const handleDelete = useCallback(async (session: Session) => {
    try {
      await window.electron?.session.delete(session.id);
      setSelectedSessionId(null);
      setSelectedSession(null);
      loadSessions();
    } catch (err) {
      console.error("[SessionManager] Failed to delete session:", err);
    }
  }, []);

  // Handle resume
  const handleResume = useCallback(
    (session: Session) => {
      onResumeSession?.(session);
    },
    [onResumeSession]
  );

  // Handle expense update
  const handleExpenseUpdate = useCallback(
    async (expenses: {
      armorCost: number;
      fapCost: number;
      miscCost: number;
    }) => {
      if (!selectedSession) return;

      // Update the session with new expenses
      const updatedSession: Session = {
        ...selectedSession,
        manualArmorCost: expenses.armorCost,
        manualFapCost: expenses.fapCost,
        manualMiscCost: expenses.miscCost,
      };

      // Save to storage
      try {
        await window.electron?.session.save(updatedSession);
        setSelectedSession(updatedSession);

        // Update the sessions list meta to trigger re-renders
        setSessions((prev) =>
          prev.map((s) =>
            s.id === selectedSession.id
              ? { ...s } // Trigger object reference change
              : s
          )
        );

        // Invalidate stats cache for this session to force recalculation
        setStatsCache((prev) => {
          const { [selectedSession.id]: _, ...rest } = prev;
          return rest;
        });

        // If this is the active session, send update to popout
        if (selectedSession.id === activeSessionId) {
          window.electron?.popout?.updateExpenses(expenses);
        }
      } catch (err) {
        console.error("[SessionManager] Failed to save expenses:", err);
      }
    },
    [selectedSession, activeSessionId]
  );

  // Handle session update (name, tags)
  const handleSessionUpdate = useCallback(
    async (session: Session, updates: { name?: string; tags?: string[] }) => {
      // Update the session with new name/tags
      const updatedSession: Session = {
        ...session,
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
      };

      // Save to storage
      try {
        await window.electron?.session.save(updatedSession);
        setSelectedSession(updatedSession);

        // Update the sessions list meta
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id
              ? { ...s, name: updatedSession.name, tags: updatedSession.tags }
              : s
          )
        );

        // If this is the active session, trigger refresh in parent
        if (session.id === activeSessionId) {
          // The parent component will receive the updated session through activeSession prop
        }
      } catch (err) {
        console.error("[SessionManager] Failed to save session updates:", err);
      }
    },
    [activeSessionId]
  );

  // Handle combining multiple sessions into one
  const handleCombineSessions = useCallback(async () => {
    // Get sessions matching the current filters (tags + loadouts)
    const selectedTags = filters.selectedTags;
    if (selectedTags.length === 0) return;

    const sessionsToMerge = sessions.filter((s) =>
      s.tags?.some((tag) => selectedTags.includes(tag))
    );

    if (sessionsToMerge.length === 0) return;

    const confirmed = window.confirm(
      `Combine ${sessionsToMerge.length} session${
        sessionsToMerge.length > 1 ? "s" : ""
      } into a single session?\n\nOriginal sessions will be deleted.`
    );

    if (!confirmed) return;

    try {
      // Load all sessions
      const loadedSessions = await Promise.all(
        sessionsToMerge.map((meta) => window.electron?.session.load(meta.id))
      );
      const validSessions = loadedSessions.filter((s): s is Session => !!s);

      if (validSessions.length === 0) return;

      // Sort by startedAt
      validSessions.sort(
        (a, b) =>
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      );

      // Create combined session
      const firstSession = validSessions[0];
      const lastSession = validSessions[validSessions.length - 1];
      const tagName =
        selectedTags.length === 1
          ? selectedTags[0]
          : `${selectedTags.length} Tags`;

      const combinedSession: Session = {
        id: `combined-${Date.now()}`,
        name: `Combined ${tagName} (${validSessions.length} sessions)`,
        tags: selectedTags,
        startedAt: firstSession.startedAt,
        endedAt: lastSession.endedAt,
        events: [],
        loadoutSnapshots: {},
        manualCostPerShot: 0,
        manualArmorCost: 0,
        manualFapCost: 0,
        manualMiscCost: 0,
      };

      // Merge all events
      for (const session of validSessions) {
        combinedSession.events.push(...(session.events || []));
        // Merge loadout snapshots
        Object.assign(
          combinedSession.loadoutSnapshots,
          session.loadoutSnapshots || {}
        );
        // Sum manual expenses
        combinedSession.manualArmorCost =
          (combinedSession.manualArmorCost || 0) +
          (session.manualArmorCost || 0);
        combinedSession.manualFapCost =
          (combinedSession.manualFapCost || 0) + (session.manualFapCost || 0);
        combinedSession.manualMiscCost =
          (combinedSession.manualMiscCost || 0) + (session.manualMiscCost || 0);
      }

      // Sort events by timestamp
      combinedSession.events.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      // Save combined session
      await window.electron?.session.save(combinedSession);

      // Delete original sessions
      for (const session of validSessions) {
        await window.electron?.session.delete(session.id);
      }

      // Reload session list
      loadSessions();
      setSelectedSessionId(null);
      setSelectedSession(null);
    } catch (err) {
      console.error("[SessionManager] Failed to combine sessions:", err);
    }
  }, [filters.selectedTags, sessions]);

  // Get the session to show in detail panel
  // Use live activeSession data when viewing the active session
  const detailSession = useMemo(() => {
    if (!selectedSession) return null;
    if (selectedSession.id === activeSessionId && activeSession) {
      return activeSession;
    }
    return selectedSession;
  }, [selectedSession, activeSessionId, activeSession]);

  // Compute aggregate stats when exactly one tag is selected and no session is selected
  const aggregateStats = useMemo((): AggregateStats | null => {
    // Only show aggregate when: 1+ tags selected AND no session selected
    if (filters.selectedTags.length === 0 || selectedSessionId) {
      return null;
    }

    const selectedTags = filters.selectedTags;
    const tagName =
      selectedTags.length === 1
        ? selectedTags[0]
        : `${selectedTags.length} Tags`;

    // Find all sessions with ANY of the selected tags
    const taggedSessions = sessions.filter((s) =>
      s.tags?.some((tag) => selectedTags.includes(tag))
    );
    if (taggedSessions.length === 0) return null;

    // Aggregate stats from cache
    let totalDuration = 0;
    let profit = 0;
    let profitWithMarkup = 0;
    let lootValue = 0;
    let lootValueWithMarkup = 0;
    let totalCost = 0;
    let kills = 0;
    let shots = 0;
    let hits = 0;
    let criticals = 0;
    let skillGains = 0;
    let globalCount = 0;
    let hofs = 0;
    let manualExpenses = 0;

    for (const s of taggedSessions) {
      const cached = statsCache[s.id];
      if (cached) {
        totalDuration += cached.duration;
        profit += cached.profit;
        profitWithMarkup += cached.profitWithMarkup;
        lootValue += cached.lootValue;
        lootValueWithMarkup += cached.lootValueWithMarkup;
        totalCost += cached.totalCost;
        kills += cached.kills;
        shots += cached.shots;
        hits += cached.hits;
        criticals += cached.criticals;
        skillGains += cached.skillGains;
        globalCount += cached.globalCount;
        hofs += cached.hofs;
        manualExpenses += cached.manualExpenses ?? 0;
      }
    }

    // Calculate return rates
    const returnRate = totalCost > 0 ? (lootValue / totalCost) * 100 : 0;
    const returnRateWithMarkup =
      totalCost > 0 ? (lootValueWithMarkup / totalCost) * 100 : 0;

    return {
      tagName,
      sessionCount: taggedSessions.length,
      totalDuration,
      profit,
      profitWithMarkup,
      returnRate,
      returnRateWithMarkup,
      lootValue,
      lootValueWithMarkup,
      totalCost,
      kills,
      shots,
      hits,
      criticals,
      skillGains,
      globalCount,
      hofs,
      manualExpenses,
    };
  }, [filters.selectedTags, selectedSessionId, sessions, statsCache]);

  if (!isReady) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left Sidebar */}
      <Sidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        allTags={allTags}
        allLoadoutIds={allLoadoutIds}
        loadoutNameMap={loadoutNameMap}
        sessionCounts={sessionCounts}
        showMarkup={showMarkup}
        onToggleMarkup={() => setShowMarkup(!showMarkup)}
        applyExpenses={applyExpenses}
        onToggleExpenses={() => setApplyExpenses(!applyExpenses)}
      />

      {/* Middle - Session List */}
      <div style={styles.listPanel}>
        <SessionList
          sessions={displaySessions}
          selectedSessionId={selectedSessionId}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          loading={loading || loadingStats}
          totalCount={sessions.length}
          statsCache={statsCache}
          showMarkup={showMarkup}
          applyExpenses={applyExpenses}
        />
      </div>

      {/* Right - Detail Panel */}
      <DetailPanel
        session={detailSession}
        aggregateStats={aggregateStats}
        onDelete={handleDelete}
        onViewInTabs={onViewSession}
        onResume={handleResume}
        onSessionUpdate={handleSessionUpdate}
        isActiveSession={selectedSessionId === activeSessionId}
        onExpenseUpdate={handleExpenseUpdate}
        showMarkup={showMarkup}
        applyExpenses={applyExpenses}
        markupLibrary={markupLibrary}
        onCombineSessions={handleCombineSessions}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    height: "100%",
    backgroundColor: "hsl(220 13% 8%)",
  },
  listPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    color: "hsl(220 13% 50%)",
    fontSize: "14px",
  },
};

export default SessionManager;
