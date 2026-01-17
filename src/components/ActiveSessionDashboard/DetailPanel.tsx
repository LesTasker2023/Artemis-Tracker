import React from "react";
import { Session } from "../../core/session";
import { LogEvent } from "../../core/types";
import { Trophy, TrendingUp, Target, Skull, Star } from "lucide-react";

const formatPED = (value: number): string => `${value.toFixed(2)} PED`;
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Friendly name mapping for event types
const getEventFriendlyName = (type: string): string => {
  const names: Record<string, string> = {
    // Combat events
    kill: "Kill",
    death: "Death",
    CRITICAL_HIT: "Critical Hit",
    HIT: "Hit",
    DAMAGE_TAKEN: "Damage Taken",
    MISS: "Miss",
    TARGET_DODGED: "Target Dodged",
    TARGET_EVADED: "Target Evaded",
    TARGET_RESISTED: "Target Resisted",
    PLAYER_EVADED: "Player Evaded",
    PLAYER_DODGED: "Player Dodged",
    ENEMY_MISSED: "Enemy Missed",
    DEFLECT: "Deflect",
    OUT_OF_RANGE: "Out of Range",
    // Death events
    PLAYER_DEATH: "Player Death",
    DEATH_LOCATION: "Death Location",
    REVIVED: "Revived",
    DIVINE_INTERVENTION: "Divine Intervention",
    // Loot/globals
    LOOT: "Loot",
    loot: "Loot",
    global: "Global",
    hof: "Hall of Fame",
    ath: "All-Time High",
    GLOBAL_KILL: "Global Kill",
    GLOBAL_HOF: "Global HoF",
    GLOBAL_MINING: "Global Mining",
    GLOBAL_MINING_HOF: "Mining HoF",
    GLOBAL_CRAFT: "Global Craft",
    // Skill events
    SKILL_GAIN: "Skill Gain",
    SKILL_RANK: "Skill Rank",
    SKILL_ACQUIRED: "Skill Acquired",
    ATTRIBUTE_GAIN: "Attribute Gain",
    ATTRIBUTE_IMPROVE: "Attribute Improved",
    // Mining events
    CLAIM: "Claim",
    DEPLETED: "Depleted",
    NO_FIND: "No Find",
    // Healing
    SELF_HEAL: "Self Heal",
    // Normalized types from parser
    damage_dealt: "Damage Dealt",
    damage_taken: "Damage Taken",
    miss: "Miss",
    target_dodged: "Target Dodged",
    target_evaded: "Target Evaded",
    target_resisted: "Target Resisted",
    out_of_range: "Out of Range",
    damage_reduced: "Damage Reduced",
    deflect: "Deflect",
    player_dodged: "Player Dodged",
    player_evaded: "Player Evaded",
    enemy_missed: "Enemy Missed",
    skill_gain: "Skill Gain",
    attribute_gain: "Attribute Gain",
    self_heal: "Self Heal",
  };
  return (
    names[type] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

// Get descriptive text for an event based on its data
const getEventDescription = (event: {
  type: string;
  skillName?: string;
  itemName?: string;
  creature?: string;
  player?: string;
  amount?: number;
  value?: number;
  quantity?: number;
  critical?: boolean;
}): string | null => {
  const type = event.type;

  // Skill events - show skill name
  if (
    (type === "skill_gain" ||
      type === "SKILL_GAIN" ||
      type === "attribute_gain" ||
      type === "ATTRIBUTE_GAIN") &&
    event.skillName
  ) {
    return event.skillName;
  }

  // Loot events - show item and quantity
  if (type === "loot" || type === "LOOT") {
    if (event.itemName) {
      return event.quantity && event.quantity > 1
        ? `${event.itemName} x${event.quantity}`
        : event.itemName;
    }
  }

  // Global events - show player, what they got, and value
  if (
    type.includes("global") ||
    type.includes("GLOBAL") ||
    type.includes("hof") ||
    type.includes("HOF")
  ) {
    const parts: string[] = [];
    if (event.player) parts.push(event.player);
    // Show creature (kill global), item (craft global), or resource (mining global via itemName)
    if (event.creature) parts.push(event.creature);
    else if (event.itemName) parts.push(event.itemName);
    if (event.value) parts.push(`${event.value} PED`);
    return parts.length > 0 ? parts.join(" • ") : null;
  }

  // Damage events - show amount and creature
  if (type === "damage_dealt" || type === "HIT" || type === "CRITICAL_HIT") {
    const dmgText = event.amount ? `${event.amount.toFixed(0)} dmg` : "";
    const critText = event.critical ? " (Crit)" : "";
    const creatureText = event.creature ? ` → ${event.creature}` : "";
    return `${dmgText}${critText}${creatureText}`.trim() || null;
  }

  // Damage taken - show amount
  if (type === "damage_taken" || type === "DAMAGE_TAKEN") {
    return event.amount ? `${event.amount.toFixed(0)} dmg taken` : null;
  }

  // Kill events
  if (type === "kill" && event.creature) {
    return event.creature;
  }

  // Death events
  if (type === "death") {
    return event.creature ? `Killed by ${event.creature}` : "You died";
  }

  // Self heal
  if (type === "self_heal" || type === "SELF_HEAL") {
    return event.amount ? `+${event.amount.toFixed(0)} HP` : null;
  }

  return null;
};

interface DetailPanelProps {
  session: Session | null;
  liveEvents?: LogEvent[];
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  session,
  liveEvents = [],
}) => {
  // Use session events when session is active, otherwise use live events
  const hasSession = session && session.events && session.events.length > 0;

  // Convert live events to a compatible format for display
  const eventsToDisplay = hasSession
    ? session.events
    : liveEvents.map((e) => ({
        timestamp: e.timestamp,
        raw: e.raw,
        type: e.type,
        // Map LogEvent data fields to the expected format
        skillName:
          (e.data?.skill as string | undefined) ??
          (e.data?.attribute as string | undefined),
        itemName:
          (e.data?.item as string | undefined) ??
          (e.data?.resource as string | undefined),
        creature: e.data?.creature as string | undefined,
        player: e.data?.player as string | undefined,
        amount:
          (e.data?.damage as number | undefined) ??
          (e.data?.amount as number | undefined),
        value: e.data?.value as number | undefined,
        quantity: e.data?.quantity as number | undefined,
        critical: e.data?.critical as boolean | undefined,
      }));

  // Get recent events (last 10)
  const recentEvents = [...eventsToDisplay]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>{hasSession ? "Activity" : "Live Feed"}</h2>
      </div>

      {/* Recent Events - Streamlined */}
      <div style={styles.eventsContainer}>
        <h3 style={styles.sectionTitle}>
          {hasSession ? "Recent Events" : "Live Events"}
        </h3>
        <div style={styles.eventsList}>
          {recentEvents.length === 0 && (
            <div style={styles.emptyText}>
              {hasSession ? "No events yet" : "Waiting for game events..."}
            </div>
          )}
          {recentEvents.map((event, idx) => {
            const icon =
              event.type === "kill"
                ? Target
                : event.type === "death"
                ? Skull
                : event.type === "global" ||
                  event.type === "hof" ||
                  event.type.includes("GLOBAL")
                ? Trophy
                : event.type === "ath"
                ? Star
                : TrendingUp;

            const iconColor =
              event.type === "kill"
                ? "#10b981"
                : event.type === "death"
                ? "#ef4444"
                : event.type === "global" || event.type.includes("GLOBAL")
                ? "#eab308"
                : event.type === "hof" || event.type.includes("HOF")
                ? "#a855f7"
                : event.type === "ath"
                ? "#ec4899"
                : "#3b82f6";

            const Icon = icon;
            const description = getEventDescription(event);

            return (
              <div key={idx} style={styles.eventItem}>
                <Icon size={14} style={{ color: iconColor, flexShrink: 0 }} />
                <div style={styles.eventContent}>
                  <div style={styles.eventTop}>
                    <span style={styles.eventType}>
                      {getEventFriendlyName(event.type)}
                    </span>
                    <span style={styles.eventTimestamp}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  {description && (
                    <div style={styles.eventDescription}>{description}</div>
                  )}
                  <div style={styles.eventDataRow}>
                    {event.value !== undefined && event.value > 0 && (
                      <span
                        style={{ ...styles.eventDataText, color: "#10b981" }}
                      >
                        {formatPED(event.value)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats - Bottom */}
      <div style={styles.quickStats}>
        <div style={styles.statsList}>
          <div style={styles.miniStat}>
            <span style={styles.miniStatValue}>
              {eventsToDisplay.filter(
                (e) =>
                  e.type === "global" ||
                  e.type === "GLOBAL_KILL" ||
                  e.type === "GLOBAL_MINING" ||
                  e.type === "GLOBAL_CRAFT"
              )?.length ?? 0}
            </span>
            <span style={styles.miniStatLabel}>Globals</span>
          </div>
          <div style={styles.miniStat}>
            <span style={styles.miniStatValue}>
              {eventsToDisplay.filter(
                (e) =>
                  e.type === "hof" ||
                  e.type === "GLOBAL_HOF" ||
                  e.type === "GLOBAL_MINING_HOF"
              )?.length ?? 0}
            </span>
            <span style={styles.miniStatLabel}>HoFs</span>
          </div>
          <div style={styles.miniStat}>
            <span style={styles.miniStatValue}>
              {eventsToDisplay.filter((e) => e.type === "ath")?.length ?? 0}
            </span>
            <span style={styles.miniStatLabel}>ATHs</span>
          </div>
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
  eventDescription: {
    fontSize: "11px",
    color: "hsl(220 13% 70%)",
    marginBottom: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
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
  quickStats: {
    marginTop: "auto",
    padding: "12px 16px",
    borderTop: "1px solid hsl(220 13% 18%)",
    backgroundColor: "hsl(220 13% 10%)",
  },
  statsList: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  miniStat: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
  },
  miniStatValue: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#fb923c",
    fontVariantNumeric: "tabular-nums" as const,
  },
  miniStatLabel: {
    fontSize: "10px",
    color: "#3b82f6",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
};

export default DetailPanel;
