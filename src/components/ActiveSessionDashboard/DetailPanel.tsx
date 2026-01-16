import React from "react";
import { Session } from "../../core/session";
import { Trophy, TrendingUp, Target, Skull } from "lucide-react";

const formatPED = (value: number): string => `${value.toFixed(2)} PED`;
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

interface DetailPanelProps {
  session: Session | null;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ session }) => {
  // Use default empty events list if no session
  const displaySession: Session =
    session ||
    ({
      id: "",
      name: "No Session",
      tags: [],
      startedAt: new Date().toISOString(),
      events: [],
      loadoutSnapshots: {},
      manualCostPerShot: 0,
    } as Session);

  // Get recent events (last 10)
  const recentEvents = [...displaySession.events]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  // Get globals and HOFs
  const globals = displaySession.events.filter((e) => e.type === "global");
  const hofs = displaySession.events.filter((e) => e.type === "hof");

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Activity</h2>
      </div>

      {/* Special Events - Compact */}
      {(globals.length > 0 || hofs.length > 0) && (
        <div style={styles.specialSection}>
          {globals.length > 0 && (
            <div style={styles.compactStat}>
              <Trophy size={12} style={{ color: "#eab308" }} />
              <span style={styles.compactLabel}>Globals</span>
              <span style={styles.compactValue}>{globals.length}</span>
            </div>
          )}
          {hofs.length > 0 && (
            <div style={styles.compactStat}>
              <Trophy size={12} style={{ color: "#a855f7" }} />
              <span style={styles.compactLabel}>HOFs</span>
              <span style={styles.compactValue}>{hofs.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Recent Events - Streamlined */}
      <div style={styles.eventsContainer}>
        <h3 style={styles.sectionTitle}>Recent Events</h3>
        <div style={styles.eventsList}>
          {recentEvents.map((event, idx) => {
            const icon =
              event.type === "kill"
                ? Target
                : event.type === "death"
                ? Skull
                : event.type === "global" || event.type === "hof"
                ? Trophy
                : TrendingUp;

            const iconColor =
              event.type === "kill"
                ? "#10b981"
                : event.type === "death"
                ? "#ef4444"
                : event.type === "global"
                ? "#eab308"
                : event.type === "hof"
                ? "#a855f7"
                : "#3b82f6";

            const Icon = icon;

            return (
              <div key={idx} style={styles.eventItem}>
                <Icon size={14} style={{ color: iconColor, flexShrink: 0 }} />
                <div style={styles.eventContent}>
                  <div style={styles.eventTop}>
                    <span style={styles.eventType}>{event.type}</span>
                    <span style={styles.eventTimestamp}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <div style={styles.eventDataRow}>
                    {event.damage !== undefined && (
                      <span style={styles.eventDataText}>
                        {event.damage.toFixed(0)} dmg
                      </span>
                    )}
                    {event.loot !== undefined && event.loot > 0 && (
                      <span
                        style={{ ...styles.eventDataText, color: "#10b981" }}
                      >
                        {formatPED(event.loot)}
                      </span>
                    )}
                    {event.cost !== undefined && event.cost > 0 && (
                      <span
                        style={{ ...styles.eventDataText, color: "#ef4444" }}
                      >
                        {formatPED(event.cost)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "360px",
    backgroundColor: "hsl(220 13% 12%)",
    borderLeft: "1px solid hsl(220 13% 18%)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    height: "100%",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    height: "100%",
  },
  emptyText: {
    color: "hsl(220 13% 45%)",
    fontSize: "13px",
    textAlign: "center" as const,
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  title: {
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
  },
  specialSection: {
    padding: "12px 16px",
    borderBottom: "1px solid hsl(220 13% 18%)",
    display: "flex",
    gap: "8px",
  },
  compactStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    backgroundColor: "hsl(220 13% 9%)",
    borderRadius: "4px",
    flex: 1,
  },
  compactLabel: {
    fontSize: "11px",
    color: "hsl(220 13% 60%)",
  },
  compactValue: {
    fontSize: "13px",
    color: "hsl(0 0% 95%)",
    fontWeight: 600,
    marginLeft: "auto",
  },
  sectionTitle: {
    fontSize: "10px",
    fontWeight: 600,
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "8px",
  },
  eventsContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "12px 16px",
  },
  eventsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  eventItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "8px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "4px",
    border: "1px solid hsl(220 13% 16%)",
  },
  eventContent: {
    flex: 1,
    minWidth: 0,
  },
  eventTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  eventType: {
    fontSize: "12px",
    color: "hsl(0 0% 95%)",
    fontWeight: 500,
    textTransform: "capitalize" as const,
  },
  eventTimestamp: {
    fontSize: "10px",
    color: "hsl(220 13% 45%)",
  },
  eventDataRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  eventDataText: {
    fontSize: "11px",
    color: "hsl(220 13% 65%)",
  },
};

export default DetailPanel;
