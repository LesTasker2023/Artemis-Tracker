/**
 * Welcome Page - Shown once on first app load
 */

import React from "react";
import projectLogo from "../../data/artemis logo.png";

interface WelcomePageProps {
  onDismiss: () => void;
  playerName: string;
  chatLogPath: string;
}

export function WelcomePage({
  onDismiss,
  playerName,
  chatLogPath,
}: WelcomePageProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img
            src={projectLogo}
            alt="ARTEMIS"
            style={{ height: 100, objectFit: "contain" }}
          />
        </div>

        {/* Version Title */}
        <h1 style={styles.title}>Welcome to v0.4.0</h1>

        {/* User Info Section */}
        <div style={styles.infoSection}>
          <h2 style={styles.sectionTitle}>Current Configuration</h2>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Character Name:</span>
            <span style={styles.infoValue}>{playerName || "Not set"}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Chat Log Path:</span>
            <span style={styles.infoValue}>{chatLogPath || "Not set"}</span>
          </div>
        </div>

        {/* Important Notes */}
        <div style={styles.warningSection}>
          <h2 style={styles.warningTitle}>⚠️ Important Notice</h2>
          <ul style={styles.warningList}>
            <li>
              <strong>Loadouts:</strong> Old loadouts from previous versions
              should be re-made in the new Loadout Manager
            </li>
            <li>
              <strong>Sessions:</strong> Previous session data may not load
              properly in the new session viewer
            </li>
          </ul>
        </div>

        {/* Dismiss Button */}
        <button onClick={onDismiss} style={styles.dismissButton}>
          Continue to ARTEMIS
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(2px)",
  },
  container: {
    backgroundColor: "hsl(220 13% 12%)",
    borderRadius: "12px",
    border: "1px solid hsl(220 13% 25%)",
    padding: "48px",
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "hsl(0 0% 95%)",
    margin: 0,
    textAlign: "center",
  },
  infoSection: {
    width: "100%",
    padding: "20px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "8px",
    border: "1px solid hsl(220 13% 25%)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "hsl(217 91% 60%)",
    margin: "0 0 12px 0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    padding: "8px 0",
    borderBottom: "1px solid hsl(220 13% 25%)",
  },
  infoLabel: {
    color: "hsl(220 13% 50%)",
    fontWeight: "600",
  },
  infoValue: {
    color: "hsl(0 0% 95%)",
    fontFamily: "monospace",
    wordBreak: "break-all",
    textAlign: "right",
    maxWidth: "60%",
  },
  warningSection: {
    width: "100%",
    padding: "20px",
    backgroundColor: "hsl(39 89% 25%)",
    borderRadius: "8px",
    border: "1px solid hsl(39 89% 35%)",
  },
  warningTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "hsl(39 89% 70%)",
    margin: "0 0 12px 0",
  },
  warningList: {
    margin: 0,
    paddingLeft: "20px",
    color: "hsl(220 13% 85%)",
    lineHeight: "1.6",
    fontSize: "13px",
  },
  dismissButton: {
    padding: "12px 32px",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "hsl(217 91% 60%)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
