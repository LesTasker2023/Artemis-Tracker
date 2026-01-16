/**
 * SessionManager - Session List Component
 * Middle panel showing the list of sessions
 */

import React from "react";
import { Clock, Target, Filter } from "lucide-react";
import type { SessionMeta } from "../../types/electron";
import { SessionCard } from "./SessionCard";

interface SessionListProps {
  sessions: SessionMeta[];
  selectedSessionId: string | null;
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  loading: boolean;
  totalCount: number;
}

export function SessionList({
  sessions,
  selectedSessionId,
  activeSessionId,
  onSelectSession,
  loading,
  totalCount,
}: SessionListProps) {
  if (loading) {
    return (
      <div style={styles.empty}>
        <Clock size={48} style={styles.emptyIcon} />
        <div style={styles.emptyTitle}>Loading sessions...</div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div style={styles.empty}>
        <Target size={48} style={styles.emptyIcon} />
        <div style={styles.emptyTitle}>No sessions yet</div>
        <div style={styles.emptySubtitle}>
          Start a hunting session to track your stats
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={styles.empty}>
        <Filter size={48} style={styles.emptyIcon} />
        <div style={styles.emptyTitle}>No sessions match filters</div>
        <div style={styles.emptySubtitle}>
          Try adjusting your filters or search query
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Column headers */}
      <div style={styles.header}>
        <div style={styles.headerName}>Name</div>
        <div style={styles.headerDate}>Date</div>
        <div style={styles.headerDuration}>Duration</div>
        <div style={styles.headerEvents}>Events</div>
      </div>
      <div style={styles.list}>
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isSelected={selectedSessionId === session.id}
            isActive={activeSessionId === session.id}
            onSelect={onSelectSession}
          />
        ))}
      </div>
      <div style={styles.footer}>
        Showing {sessions.length} of {totalCount} session{totalCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    gap: "8px",
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "hsl(220 13% 15%)",
    marginLeft: "16px",
    marginRight: "16px",
    marginTop: "8px",
  },
  headerName: {
    flex: 1,
  },
  headerDate: {
    width: "70px",
    textAlign: "right",
  },
  headerDuration: {
    width: "55px",
    textAlign: "right",
  },
  headerEvents: {
    width: "50px",
    textAlign: "right",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    overflow: "auto",
    padding: "12px 16px",
  },
  footer: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    textAlign: "center",
    padding: "12px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "hsl(220 13% 15%)",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "48px 24px",
    textAlign: "center",
  },
  emptyIcon: {
    color: "hsl(220 13% 35%)",
    marginBottom: "16px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: 500,
    color: "hsl(220 13% 60%)",
    marginBottom: "8px",
  },
  emptySubtitle: {
    fontSize: "13px",
    color: "hsl(220 13% 50%)",
    maxWidth: "300px",
  },
};
