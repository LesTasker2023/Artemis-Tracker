import React from "react";
import { Clock, Target } from "lucide-react";
import { Session } from "../../core/session";
import { Loadout } from "../../core/loadout";

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

interface SidebarProps {
  session: Session | null;
  loadout: Loadout | null;
  applyMarkup: boolean;
  setApplyMarkup: (value: boolean) => void;
  applyAdditionalExpenses: boolean;
  setApplyAdditionalExpenses: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  session,
  loadout,
  applyMarkup,
  setApplyMarkup,
  applyAdditionalExpenses,
  setApplyAdditionalExpenses,
}) => {
  // Use default values if no session
  const displaySession =
    session ||
    ({
      name: "Ready to Hunt",
      startedAt: new Date().toISOString(),
    } as Session);

  const duration = Date.now() - new Date(displaySession.startedAt).getTime();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Active Session</h2>
        <p style={styles.subtitle}>Live Statistics</p>
      </div>

      {/* Session Info */}
      <div style={styles.content}>
        {/* Session Name - Only show if session is active */}
        {session && (
          <div style={styles.section}>
            <div style={styles.label}>Session</div>
            <div style={styles.value}>
              {displaySession.name || "Unnamed Session"}
            </div>
          </div>
        )}

        {/* Duration - Only show if session is active */}
        {session && (
          <div style={styles.section}>
            <div style={styles.labelRow}>
              <Clock size={12} />
              <span style={styles.label}>Duration</span>
            </div>
            <div style={styles.value}>{formatDuration(duration)}</div>
          </div>
        )}

        {/* Loadout */}
        {loadout && (
          <div style={styles.section}>
            <div style={styles.labelRow}>
              <Target size={12} />
              <span style={styles.label}>Loadout</span>
            </div>
            <div style={styles.value}>{loadout.name}</div>
          </div>
        )}

        {/* Tags */}
        {session && session.tags && session.tags.length > 0 && (
          <div style={styles.section}>
            <div style={styles.label}>Tags</div>
            <div style={styles.tagList}>
              {session.tags.map((tag) => (
                <span key={tag} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div style={styles.togglesSection}>
        <div style={styles.buttonRow}>
          <button
            onClick={() => setApplyMarkup(!applyMarkup)}
            style={{
              ...styles.toggleButton,
              color: applyMarkup ? "rgb(6, 182, 212)" : "rgb(111, 122, 144)",
              backgroundColor: applyMarkup
                ? "rgba(6, 182, 212, 0.15)"
                : "transparent",
              borderColor: applyMarkup
                ? "rgba(6, 182, 212, 0.3)"
                : "rgb(44, 49, 58)",
            }}
            title="Toggle Markup Values"
          >
            MU
          </button>
          <button
            onClick={() => setApplyAdditionalExpenses(!applyAdditionalExpenses)}
            style={{
              ...styles.toggleButton,
              color: applyAdditionalExpenses
                ? "rgb(251, 191, 36)"
                : "rgb(111, 122, 144)",
              backgroundColor: applyAdditionalExpenses
                ? "rgba(251, 191, 36, 0.15)"
                : "transparent",
              borderColor: applyAdditionalExpenses
                ? "rgba(251, 191, 36, 0.3)"
                : "rgb(44, 49, 58)",
            }}
            title="Apply Additional Expenses"
          >
            AE
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={styles.quickStats}>
        <div style={styles.statsList}>
          <div style={styles.miniStat}>
            <span style={styles.miniStatValue}>
              {session?.events?.length ?? 0}
            </span>
            <span style={styles.miniStatLabel}>Events</span>
          </div>
          <div style={styles.miniStat}>
            <span style={styles.miniStatValue}>
              {session?.events?.filter((e) => e.type === "kill")?.length ?? 0}
            </span>
            <span style={styles.miniStatLabel}>Kills</span>
          </div>
          <div style={styles.miniStat}>
            <span style={styles.miniStatValue}>
              {session?.events?.filter((e) => e.type === "global")?.length ?? 0}
            </span>
            <span style={styles.miniStatLabel}>Globals</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "220px",
    backgroundColor: "hsl(220 13% 12%)",
    borderRight: "1px solid hsl(220 13% 18%)",
    display: "flex",
    flexDirection: "column" as const,
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
    padding: "16px",
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  title: {
    fontSize: "16px",
    fontWeight: 700,
    color: "hsl(0 0% 95%)",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
  },
  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  label: {
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "hsl(220 13% 45%)",
  },
  value: {
    fontSize: "13px",
    color: "hsl(0 0% 95%)",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "4px",
  },
  tag: {
    fontSize: "11px",
    padding: "2px 8px",
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(220 13% 65%)",
    borderRadius: "4px",
  },
  togglesSection: {
    padding: "16px",
    borderBottom: "1px solid rgb(33, 37, 43)",
  },
  buttonRow: {
    display: "flex",
    gap: "8px",
  },
  toggleButton: {
    flex: "1 1 0%",
    padding: "8px 12px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600" as any,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "4px",
  },
  quickStats: {
    marginTop: "auto",
    padding: "12px",
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

export default Sidebar;
