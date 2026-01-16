/**
 * SessionManager - Main Component
 * 3-column layout: Sidebar | Session List | Detail Panel
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Session } from "../../core/session";
import type { SessionMeta } from "../../types/electron";
import type { FilterState, SessionManagerProps } from "./types";
import { Sidebar } from "./Sidebar";
import { SessionList } from "./SessionList";
import { DetailPanel } from "./DetailPanel";

const MAX_DISPLAY_SESSIONS = 100;

export function SessionManager({
  onViewSession,
  onResumeSession,
  activeSessionId,
  activeSession,
}: SessionManagerProps) {
  // Raw data from storage
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected session (full data)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Lazy loading
  const [isReady, setIsReady] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    mode: "all",
    selectedTags: [],
    searchQuery: "",
    sortBy: "newest",
  });

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Lazy loading - delay heavy operations
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Refresh list when active session updates (to show updated event counts)
  useEffect(() => {
    if (activeSession && activeSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, eventCount: activeSession.events?.length || s.eventCount }
            : s
        )
      );
    }
  }, [activeSession, activeSessionId]);

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

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sessions.forEach((session) => {
      session.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [sessions]);

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

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(query)
      );
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
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    // Limit results
    return filtered.slice(0, MAX_DISPLAY_SESSIONS);
  }, [isReady, sessions, filters]);

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
  const handleResume = useCallback((session: Session) => {
    onResumeSession?.(session);
  }, [onResumeSession]);

  // Get the session to show in detail panel
  // Use live activeSession data when viewing the active session
  const detailSession = useMemo(() => {
    if (!selectedSession) return null;
    if (selectedSession.id === activeSessionId && activeSession) {
      return activeSession;
    }
    return selectedSession;
  }, [selectedSession, activeSessionId, activeSession]);

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
        sessionCounts={sessionCounts}
      />

      {/* Middle - Session List */}
      <div style={styles.listPanel}>
        <SessionList
          sessions={displaySessions}
          selectedSessionId={selectedSessionId}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          loading={loading}
          totalCount={sessions.length}
        />
      </div>

      {/* Right - Detail Panel */}
      <DetailPanel
        session={detailSession}
        onDelete={handleDelete}
        onViewInTabs={onViewSession}
        onResume={handleResume}
        isActiveSession={selectedSessionId === activeSessionId}
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
