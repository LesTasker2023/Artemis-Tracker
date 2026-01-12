/**
 * Project Delta - Tracker
 * Main application window with tabs
 */

import React, { useEffect, useState } from "react";
import {
  Play,
  Square,
  AlertTriangle,
  Crosshair,
  History,
  ExternalLink,
  Activity,
  BookOpen,
  Package,
  Swords,
  DollarSign,
  Eye,
  X,
  Settings,
  Target,
} from "lucide-react";

// Logo for header
import projectLogo from "../data/artemis logo.png";
import { useLogEvents } from "./hooks/useLogEvents";
import { useSession } from "./hooks/useSession";
import { usePlayerName } from "./hooks/usePlayerName";
import { LoadingScreen } from "./components/LoadingScreen";
import { UpdateNotification } from "./components/UpdateNotification";
import { LoadoutManager, LoadoutDropdown } from "./components/LoadoutManager";
import { useLoadouts } from "./hooks/useLoadouts";
import { SessionsPage } from "./components/SessionsPage";
import { LiveDashboard } from "./components/LiveDashboard";
import { SkillsDeepDive } from "./components/SkillsDeepDive";
import { LootAnalysis } from "./components/LootAnalysis";
import { CombatAnalytics } from "./components/CombatAnalytics";
import { EconomyTracker } from "./components/EconomyTracker";
import { StartSessionModal } from "./components/StartSessionModal";
import type { Session, SessionStats } from "./core/session";
import { calculateSessionStats } from "./core/session";
import { getActiveLoadout } from "./core/loadout";

type Tab =
  | "live"
  | "combat"
  | "skills"
  | "loot"
  | "economy"
  | "loadouts"
  | "sessions"
  | "settings";

function App() {
  console.log("[App] Render - function start");

  // Initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  const [initMessage, setInitMessage] = useState<string | undefined>(undefined);
  const [initProgress, setInitProgress] = useState(0);

  // Check and update equipment database on startup
  useEffect(() => {
    async function initialize() {
      try {
        setInitProgress(25);

        const checkResult = await window.electron?.equipment?.checkUpdates();

        if (checkResult?.updateAvailable) {
          setInitProgress(50);

          const updateResult = await window.electron?.equipment?.update();

          if (updateResult?.success) {
            const { updated, failed } = updateResult.result || {
              updated: [],
              failed: [],
            };
            if (failed.length > 0) {
              // Only show message if there's an error
              setInitMessage(`Warning: ${failed.length} update(s) failed`);
            }
          }
        }

        setInitProgress(100);

        // Small delay to show completion
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("[App] Initialization error:", error);
        // Continue anyway - local files may still work
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();
  }, []);

  const {
    events,
    isWatching,
    logPath,
    error,
    start: startLog,
    stop: stopLog,
    clear: _clear,
    selectFile,
  } = useLogEvents();
  const {
    session,
    stats,
    isActive: sessionActive,
    start: startSession,
    stop: stopSession,
    resume: resumeSession,
    addEvent,
    recalculateStats,
  } = useSession();
  const { playerName, setPlayerName, hasPlayerName } = usePlayerName();
  const {
    loadouts,
    activeLoadout,
    setActive: setActiveLoadout,
  } = useLoadouts();
  const [activeTab, setActiveTab] = useState<Tab>("live");

  // First-time name setup - show modal if no name is set
  const [showNameSetup, setShowNameSetup] = useState(false);
  const [nameInputValue, setNameInputValue] = useState("");

  // Start session modal
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load available tags when modal opens
  useEffect(() => {
    if (showStartSessionModal) {
      loadAvailableTags();
    }
  }, [showStartSessionModal]);

  const loadAvailableTags = async () => {
    try {
      const sessionList = await window.electron?.session.list();
      if (sessionList) {
        // Collect all unique tags from all sessions
        const allTags = new Set<string>();
        sessionList.forEach(meta => {
          if (meta.tags) {
            meta.tags.forEach(tag => allTags.add(tag));
          }
        });
        // Convert to array and sort alphabetically
        setAvailableTags(Array.from(allTags).sort());
      }
    } catch (err) {
      console.error("[App] Failed to load available tags:", err);
    }
  };

  // Update modal visibility when player name status changes
  useEffect(() => {
    console.log("[App] useEffect - hasPlayerName changed:", hasPlayerName);
    setShowNameSetup(!hasPlayerName);
  }, [hasPlayerName]);

  // Viewed session state - for viewing past sessions in data tabs
  const [viewedSession, setViewedSession] = useState<Session | null>(null);
  const [viewedStats, setViewedStats] = useState<SessionStats | null>(null);

  // Determine which stats to show in data tabs
  const displayStats = viewedSession && viewedStats ? viewedStats : stats;
  const isViewingPastSession = viewedSession !== null;

  // Track the last processed event index to avoid duplicates and ensure ALL events are captured
  const lastProcessedIndexRef = React.useRef<number>(0);

  // Forward ALL new events to session - process every event since last check
  useEffect(() => {
    console.log("[App] useEffect - events/sessionActive changed:", {
      eventsLength: events.length,
      sessionActive,
    });
    if (events.length > 0 && sessionActive) {
      // Process all events we haven't seen yet
      const startIndex = lastProcessedIndexRef.current;
      if (events.length > startIndex) {
        for (let i = startIndex; i < events.length; i++) {
          addEvent(events[i]);
        }
        lastProcessedIndexRef.current = events.length;
      }
    }
  }, [events, sessionActive, addEvent]);

  // Reset the processed index when session starts/stops
  useEffect(() => {
    console.log("[App] useEffect - sessionActive changed:", sessionActive);
    if (!sessionActive) {
      lastProcessedIndexRef.current = events.length; // Don't process old events when restarting
    }
  }, [sessionActive, events.length]);

  // Show start session modal
  const start = () => {
    console.log("[App] start() called - showing modal");
    setShowStartSessionModal(true);
  };

  // Handle session start confirmation from modal
  const handleStartSessionConfirm = async (name: string, tags: string[]) => {
    console.log("[App] handleStartSessionConfirm called", { name, tags });
    setShowStartSessionModal(false);

    // Clear any viewed session first
    setViewedSession(null);
    setViewedStats(null);

    try {
      const res = await startLog();
      console.log("[App] startLog result:", res);
    } catch (e) {
      console.error("[App] startLog failed:", e);
    }

    try {
      startSession(name, tags);
      console.log("[App] startSession invoked with name:", name, "tags:", tags);
    } catch (e) {
      console.error("[App] startSession failed:", e);
    }

    // Switch to live tab
    setActiveTab("live");
    console.log("[App] handleStartSessionConfirm complete");
  };

  // Stop both log watcher and active session
  const stop = async () => {
    console.log("[App] stop() called");
    try {
      const res = await stopLog();
      console.log("[App] stopLog result:", res);
    } catch (e) {
      console.error("[App] Failed to stop log watcher:", e);
    }

    try {
      stopSession();
      console.log("[App] stop() - session ended");
    } catch (e) {
      console.error("[App] Failed to stop session:", e);
    }

    // Keep the user on the Live tab but show session ended state
    setActiveTab("live");
    console.log("[App] stop() complete");
  };

  // Popout state and helpers
  const [popoutOpen, setPopoutOpen] = useState<boolean>(false);

  // Auto-update state
  const [updateStatus] = useState<
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "downloaded"
    | "not-available"
    | "error"
  >("idle");
  const [updateProgress] = useState<number | null>(null);
  const [updateError] = useState<string | null>(null);

  useEffect(() => {
    // Query initial popout state on mount
    let mounted = true;
    (async () => {
      try {
        const status = await window.electron?.popout?.status?.();
        if (mounted && status) setPopoutOpen(status.open || false);
      } catch (e) {
        // ignore
      }
    })();

    // Listen for popout closed events
    const unsubscribe = window.electron?.popout?.onClose?.(() => {
      setPopoutOpen(false);
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);
  // Handle player name change (from settings)
  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    recalculateStats(); // Recalculate to filter globals
  };

  // Handle first-time name setup
  const handleNameSetupSubmit = () => {
    if (nameInputValue.trim()) {
      setPlayerName(nameInputValue.trim());
      setShowNameSetup(false);
      recalculateStats();
    }
  };

  // Handle viewing a past session
  const handleViewSession = async (sessionToView: Session) => {
    setViewedSession(sessionToView);
    const loadout = getActiveLoadout();
    const stats = calculateSessionStats(
      sessionToView,
      playerName || undefined,
      loadout
    );
    setViewedStats(stats);
    setActiveTab("live"); // Switch to live tab to show the session data
  };

  // Clear viewed session and return to live
  const handleBackToLive = () => {
    setViewedSession(null);
    setViewedStats(null);
  };

  // Resume a session (called from SessionsPage)
  const handleResumeSession = async (sessionToResume: Session) => {
    console.log("[App] handleResumeSession called:", sessionToResume.id);
    // Clear any viewing state
    setViewedSession(null);
    setViewedStats(null);

    // Resume the session and start log watching
    try {
      resumeSession(sessionToResume);
      console.log("[App] resumeSession invoked");
    } catch (e) {
      console.error("[App] resumeSession failed:", e);
    }
    try {
      const res = await startLog();
      console.log("[App] startLog (resume) result:", res);
    } catch (e) {
      console.error("[App] startLog (resume) failed:", e);
    }

    // Switch to live tab
    setActiveTab("live");
  };

  console.log("[App] Render - before return", {
    activeTab,
    isViewingPastSession,
    sessionActive,
    isWatching,
    error,
    showNameSetup,
    playerName,
    logPath,
    eventsLength: events.length,
    statsExists: !!stats,
  });

  // Show loading screen during initialization
  if (isInitializing) {
    return <LoadingScreen message={initMessage} progress={initProgress} />;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.branding}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={projectLogo}
              alt="Project Delta"
              style={{ height: 48, objectFit: "contain" }}
            />
          </div>
        </div>
        <div style={styles.controls}>
          {/* Active Loadout Selector */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "4px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "hsl(220 13% 45%)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Active Loadout
            </span>
            <LoadoutDropdown
              loadouts={loadouts}
              activeLoadout={activeLoadout}
              onSelect={setActiveLoadout}
              compact
            />
          </div>

          {!isWatching ? (
            <button onClick={start} style={styles.buttonPrimary}>
              <Play size={14} style={{ marginRight: 6 }} /> Start
            </button>
          ) : (
            <button onClick={stop} style={styles.buttonDanger}>
              <Square size={14} style={{ marginRight: 6 }} /> Stop
            </button>
          )}

          {/* Update controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {updateStatus === "checking" && (
              <span style={{ color: "hsl(220 13% 45%)" }}>Checking…</span>
            )}
            {updateStatus === "available" && (
              <span style={{ color: "hsl(217 91% 68%)" }}>
                Update available
              </span>
            )}
            {updateStatus === "downloading" && (
              <span style={{ color: "hsl(217 91% 68%)" }}>
                {updateProgress}%
              </span>
            )}

            {updateStatus === "error" && (
              <span style={{ color: "hsl(0 84% 60%)" }}>
                {updateError || "Update error"}
              </span>
            )}
          </div>

          {/* Popout / HUD toggle button */}
          <button
            onClick={async () => {
              try {
                if (popoutOpen) {
                  await window.electron?.popout?.close();
                  setPopoutOpen(false);
                } else {
                  await window.electron?.popout?.open();
                  setPopoutOpen(true);
                }
              } catch (e) {
                console.error("Popout toggle failed:", e);
              }
            }}
            style={styles.buttonSecondary}
            title={popoutOpen ? "Close overlay" : "Show overlay"}
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab("live")}
          style={activeTab === "live" ? styles.tabActive : styles.tab}
        >
          <Activity size={14} /> Live
        </button>
        <button
          onClick={() => setActiveTab("combat")}
          style={activeTab === "combat" ? styles.tabActive : styles.tab}
        >
          <Swords size={14} /> Combat
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          style={activeTab === "skills" ? styles.tabActive : styles.tab}
        >
          <BookOpen size={14} /> Skills
        </button>
        <button
          onClick={() => setActiveTab("loot")}
          style={activeTab === "loot" ? styles.tabActive : styles.tab}
        >
          <Package size={14} /> Loot
        </button>
        <button
          onClick={() => setActiveTab("economy")}
          style={activeTab === "economy" ? styles.tabActive : styles.tab}
        >
          <DollarSign size={14} /> Economy
        </button>
        <div style={styles.tabDivider} />
        <button
          onClick={() => setActiveTab("loadouts")}
          style={activeTab === "loadouts" ? styles.tabActive : styles.tab}
        >
          <Crosshair size={14} /> Loadouts
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          style={activeTab === "sessions" ? styles.tabActive : styles.tab}
        >
          <History size={14} /> Sessions
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={activeTab === "settings" ? styles.tabActive : styles.tab}
        >
          <Settings size={14} /> Settings
        </button>
      </div>

      {/* Viewing Past Session Banner */}
      {isViewingPastSession && (
        <div style={styles.viewingBanner}>
          <Eye size={14} />
          <span>
            Viewing: <strong>{viewedSession.name}</strong>
          </span>
          <button onClick={handleBackToLive} style={styles.viewingBannerButton}>
            <X size={14} />
            Back to Live
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.error}>
          <AlertTriangle size={14} style={{ marginRight: 6 }} /> {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "live" && (
        <div style={styles.tabContent}>
          <LiveDashboard
            stats={displayStats}
            isActive={sessionActive && !isViewingPastSession}
          />
        </div>
      )}

      {activeTab === "combat" && (
        <div style={styles.tabContent}>
          <CombatAnalytics stats={displayStats} />
        </div>
      )}

      {activeTab === "skills" && (
        <div style={styles.tabContent}>
          <SkillsDeepDive stats={displayStats} />
        </div>
      )}

      {activeTab === "loot" && (
        <div style={styles.tabContent}>
          <LootAnalysis stats={displayStats} />
        </div>
      )}

      {activeTab === "economy" && (
        <div style={styles.tabContent}>
          <EconomyTracker stats={displayStats} />
        </div>
      )}

      {activeTab === "loadouts" && (
        <div style={styles.tabContent}>
          <LoadoutManager />
        </div>
      )}

      {activeTab === "sessions" && (
        <div style={{ ...styles.tabContent, overflow: "hidden" }}>
          <SessionsPage
            onViewSession={handleViewSession}
            onResumeSession={handleResumeSession}
          />
        </div>
      )}

      {activeTab === "settings" && (
        <div style={styles.tabContent}>
          <div style={styles.settingsContainer}>
            <h2 style={styles.settingsTitle}>Settings</h2>

            <div style={styles.settingSection}>
              <label style={styles.settingLabel}>In-Game Name</label>
              <p style={styles.settingDescription}>
                Your character name in Entropia Universe. Used to filter globals
                to only show yours.
              </p>
              <input
                type="text"
                value={playerName}
                onChange={(e) => handlePlayerNameChange(e.target.value)}
                placeholder="Enter your in-game name"
                style={styles.settingInput}
              />
            </div>

            <div style={styles.settingSection}>
              <label style={styles.settingLabel}>Log File</label>
              <p style={styles.settingDescription}>
                Path to your Entropia Universe chat.log file. Leave empty to use
                automatic detection, or select manually for custom locations.
              </p>
              <div style={styles.logFileControls}>
                <input
                  type="text"
                  value={logPath}
                  readOnly
                  placeholder="No file selected"
                  style={{ ...styles.settingInput, flex: 1, maxWidth: "none" }}
                />
                <button
                  onClick={async () => {
                    console.log("[App] Select File button clicked");
                    const selectedPath = await selectFile();
                    console.log("[App] selectFile returned:", selectedPath);
                    if (selectedPath) {
                      // Clear any viewed session first
                      if (viewedSession) {
                        setViewedSession(null);
                        setViewedStats(null);
                      }

                      // If already watching the same file, avoid re-starting the watcher
                      if (isWatching && logPath === selectedPath) {
                        console.log(
                          "[App] Already watching selected file; skipping start"
                        );
                      } else {
                        try {
                          const res = await startLog(selectedPath);
                          console.log(
                            "[App] startLog (select file) result:",
                            res
                          );
                        } catch (e) {
                          console.error(
                            "[App] startLog (select file) failed:",
                            e
                          );
                        }
                      }

                      try {
                        startSession();
                        console.log("[App] startSession invoked (select file)");
                      } catch (e) {
                        console.error(
                          "[App] startSession failed (select file):",
                          e
                        );
                      }
                    }
                  }}
                  style={{ ...styles.buttonSecondary, flexShrink: 0 }}
                >
                  <ExternalLink size={14} style={{ marginRight: 6 }} />
                  Select File
                </button>
              </div>
              <p style={styles.settingHint}>
                Current status:{" "}
                {isWatching ? `Watching ${logPath}` : "Not watching"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* First-time Name Setup Modal */}
      {showNameSetup && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIconContainer}>
              <Target size={32} strokeWidth={1.5} />
            </div>
            <h2 style={styles.modalTitle}>Welcome to ARTEMIS</h2>
            <p style={styles.modalDescription}>
              Enter your Entropia Universe character name to get started.
            </p>
            <input
              type="text"
              value={nameInputValue}
              onChange={(e) => setNameInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSetupSubmit()}
              placeholder="Character name"
              autoFocus
              style={styles.modalInput}
            />
            <button
              onClick={handleNameSetupSubmit}
              disabled={!nameInputValue.trim()}
              style={{
                ...styles.modalButton,
                opacity: nameInputValue.trim() ? 1 : 0.5,
                cursor: nameInputValue.trim() ? "pointer" : "not-allowed",
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartSessionModal && (
        <StartSessionModal
          onConfirm={handleStartSessionConfirm}
          onCancel={() => setShowStartSessionModal(false)}
          availableTags={availableTags}
        />
      )}

      {/* Update Notification */}
      <UpdateNotification />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#090d13",
    overflow: "hidden",
  },
  header: {
    padding: "16px 24px",
    borderBottom: "1px solid hsl(220 13% 18%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "hsl(220 13% 8%)",
  },
  branding: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoContainer: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, hsl(217 91% 68%) 0%, hsl(33 100% 50%) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    color: "#fff",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: 0,
    letterSpacing: "0.05em",
  },
  subtitle: {
    fontSize: "12px",
    color: "hsl(220 13% 45%)",
    marginTop: "2px",
  },
  controls: {
    display: "flex",
    gap: "8px",
  },
  tabBar: {
    display: "flex",
    gap: "0",
    borderBottom: "1px solid hsl(220 13% 18%)",
    backgroundColor: "hsl(220 13% 8%)",
    overflowX: "auto",
    overflowY: "hidden",
    flexShrink: 0,
  },
  tab: {
    padding: "12px 20px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "transparent",
    color: "hsl(220 13% 45%)",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  tabActive: {
    padding: "12px 20px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "transparent",
    color: "hsl(217 91% 68%)",
    border: "none",
    borderBottom: "2px solid hsl(217 91% 68%)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  tabDivider: {
    width: "1px",
    height: "20px",
    backgroundColor: "hsl(220 13% 25%)",
    alignSelf: "center",
    margin: "0 8px",
  },
  tabContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "auto",
  },
  settingsContainer: {
    padding: "24px",
    maxWidth: "600px",
  },
  settingsTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "hsl(0 0% 95%)",
    margin: "0 0 24px 0",
  },
  settingSection: {
    marginBottom: "24px",
  },
  settingLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    display: "block",
    marginBottom: "4px",
  },
  settingDescription: {
    fontSize: "13px",
    color: "hsl(220 13% 55%)",
    margin: "0 0 12px 0",
  },
  settingInput: {
    padding: "10px 14px",
    fontSize: "14px",
    backgroundColor: "hsl(220 13% 12%)",
    color: "hsl(0 0% 95%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "8px",
    outline: "none",
    width: "100%",
    maxWidth: "300px",
  },
  logFileControls: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  },
  settingHint: {
    fontSize: "12px",
    color: "hsl(220 13% 45%)",
    margin: "4px 0 0 0",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "360px",
    width: "90%",
    textAlign: "center",
    border: "1px solid hsl(220 13% 20%)",
  },
  modalIconContainer: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, hsl(217 91% 60% / 0.15) 0%, hsl(33 100% 50% / 0.1) 100%)",
    border: "1px solid hsl(217 91% 60% / 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px auto",
    color: "hsl(217 91% 68%)",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "hsl(0 0% 95%)",
    margin: "0 0 12px 0",
  },
  modalDescription: {
    fontSize: "14px",
    color: "hsl(220 13% 60%)",
    margin: "0 0 24px 0",
    lineHeight: "1.5",
  },
  modalInput: {
    padding: "12px 16px",
    fontSize: "16px",
    backgroundColor: "hsl(220 13% 8%)",
    color: "hsl(0 0% 95%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "8px",
    outline: "none",
    width: "100%",
    marginBottom: "16px",
    textAlign: "center",
  },
  modalButton: {
    padding: "12px 32px",
    fontSize: "15px",
    fontWeight: "600",
    background:
      "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
  },
  buttonPrimary: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    background:
      "linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 76% 30%) 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  buttonDanger: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    background:
      "linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(0 84% 50%) 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  buttonSecondary: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "hsl(220 13% 14%)",
    color: "hsl(0 0% 95%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  error: {
    padding: "12px 24px",
    backgroundColor: "hsl(0 84% 20%)",
    color: "hsl(0 84% 90%)",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
  },
  statsBar: {
    padding: "12px 24px",
    backgroundColor: "hsl(220 13% 12%)",
    display: "flex",
    gap: "24px",
    fontSize: "13px",
    color: "hsl(220 13% 70%)",
    borderBottom: "1px solid hsl(220 13% 18%)",
  },
  eventList: {
    flex: 1,
    overflow: "auto",
    padding: "8px 0",
    background: "#090d13",
  },
  empty: {
    padding: "48px 24px",
    textAlign: "center",
    color: "hsl(220 13% 45%)",
    fontSize: "14px",
  },
  eventRow: {
    display: "flex",
    alignItems: "center",
    padding: "8px 24px",
    gap: "12px",
    fontSize: "13px",
    borderBottom: "1px solid hsl(220 13% 14%)",
    transition: "background 0.15s ease",
  },
  eventTime: {
    color: "hsl(220 13% 45%)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    flexShrink: 0,
  },
  eventType: {
    padding: "3px 10px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#fff",
    minWidth: "90px",
    textAlign: "center",
    flexShrink: 0,
  },
  eventData: {
    color: "hsl(0 0% 95%)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  debugBox: {
    margin: "8px 16px",
    padding: "10px 14px",
    background: "hsl(220 13% 10%)",
    border: "1px solid hsl(33 100% 50% / 0.4)",
    borderRadius: "8px",
    fontSize: "11px",
  },
  debugLabel: {
    color: "hsl(33 100% 50%)",
    fontWeight: "600",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  debugContent: {
    color: "hsl(220 13% 70%)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    margin: "6px 0 0 0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    maxHeight: "120px",
    overflow: "auto",
  },
  viewingBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 24px",
    backgroundColor: "hsl(217 91% 68% / 0.15)",
    borderBottom: "1px solid hsl(217 91% 68% / 0.3)",
    color: "hsl(217 91% 75%)",
    fontSize: "13px",
  },
  viewingBannerButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    backgroundColor: "hsl(220 13% 14%)",
    color: "hsl(220 13% 85%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  viewingBannerButtonResume: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    backgroundColor: "hsl(142 76% 36% / 0.2)",
    color: "hsl(142 76% 60%)",
    border: "1px solid hsl(142 76% 36% / 0.4)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalButtonSecondary: {
    flex: 1,
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "hsl(220 13% 18%)",
    color: "hsl(220 13% 85%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "8px",
    cursor: "pointer",
  },
  modalButtonWarning: {
    flex: 1,
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    background:
      "linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(38 92% 40%) 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default App;
