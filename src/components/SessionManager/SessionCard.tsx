/**
 * SessionManager - Session Card Component
 * Compact row-based card for sessions in the list
 */

import React from "react";
import type { SessionMeta } from "../../types/electron";

interface SessionCardProps {
  session: SessionMeta;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function SessionCard({
  session,
  isSelected,
  isActive,
  onSelect,
}: SessionCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = () => {
    if (!session.endedAt) {
      return (
        <span style={{ ...styles.badge, ...styles.badgeActive }}>
          {isActive ? "Recording" : "Active"}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        ...styles.row,
        ...(isSelected ? styles.rowSelected : {}),
        ...(isHovered ? styles.rowHover : {}),
      }}
      onClick={() => onSelect(session.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Name + Tags Column */}
      <div style={styles.nameCol}>
        <div style={styles.nameRow}>
          <span style={styles.name}>{session.name}</span>
          {getStatusBadge()}
        </div>
        {session.tags && session.tags.length > 0 && (
          <div style={styles.tagRow}>
            {session.tags.slice(0, 3).map((tag) => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
            {session.tags.length > 3 && (
              <span style={styles.tagMore}>+{session.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Date Column */}
      <div style={styles.dateCol}>
        <span style={styles.date}>{formatDate(session.startedAt)}</span>
        <span style={styles.time}>{formatTime(session.startedAt)}</span>
      </div>

      {/* Duration Column */}
      <div style={styles.durationCol}>
        <span style={styles.duration}>{formatDuration(session.startedAt, session.endedAt)}</span>
      </div>

      {/* Events Column */}
      <div style={styles.eventsCol}>
        <span style={styles.events}>{session.eventCount.toLocaleString()}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "6px",
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    transition: "border-color 0.15s, background-color 0.15s",
    gap: "8px",
  },
  rowHover: {
    backgroundColor: "hsl(220 13% 12%)",
    borderColor: "hsl(220 13% 20%)",
  },
  rowSelected: {
    borderColor: "hsl(217 91% 60%)",
    backgroundColor: "hsl(220 13% 13%)",
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  name: {
    fontSize: "14px",
    fontWeight: 500,
    color: "hsl(0 0% 93%)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tagRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "nowrap",
    overflow: "hidden",
  },
  tag: {
    padding: "2px 6px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "4px",
    color: "hsl(220 13% 60%)",
    fontSize: "10px",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  tagMore: {
    padding: "2px 6px",
    color: "hsl(220 13% 50%)",
    fontSize: "10px",
    fontWeight: 500,
  },
  dateCol: {
    width: "70px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
    flexShrink: 0,
  },
  date: {
    fontSize: "12px",
    color: "hsl(220 13% 70%)",
    fontWeight: 500,
  },
  time: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
  },
  durationCol: {
    width: "55px",
    textAlign: "right",
    flexShrink: 0,
  },
  duration: {
    fontSize: "12px",
    color: "hsl(220 13% 60%)",
    fontWeight: 500,
    fontFamily: "monospace",
  },
  eventsCol: {
    width: "50px",
    textAlign: "right",
    flexShrink: 0,
  },
  events: {
    fontSize: "12px",
    color: "hsl(220 13% 55%)",
    fontFamily: "monospace",
  },
  badge: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    flexShrink: 0,
  },
  badgeActive: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
  },
};
