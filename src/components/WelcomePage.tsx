/**
 * Welcome Page - Shown once on first app load
 */

import React from "react";
import { Swords, TrendingUp, BarChart3, Settings } from "lucide-react";
import projectLogo from "../../data/artemis logo.png";

interface WelcomePageProps {
  onDismiss: () => void;
}

export function WelcomePage({ onDismiss }: WelcomePageProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img
            src={projectLogo}
            alt="ARTEMIS"
            style={{ height: 80, objectFit: "contain" }}
          />
        </div>

        {/* Title */}
        <h1 style={styles.title}>Welcome to ARTEMIS</h1>
        <p style={styles.subtitle}>Your Entropia Universe Hunting Companion</p>

        {/* Features Grid */}
        <div style={styles.featuresGrid}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <BarChart3 size={24} />
            </div>
            <h3 style={styles.featureTitle}>Live Tracking</h3>
            <p style={styles.featureDesc}>
              Track your hunts in real-time with detailed statistics and
              analytics
            </p>
          </div>

          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <Swords size={24} />
            </div>
            <h3 style={styles.featureTitle}>Loadout Manager</h3>
            <p style={styles.featureDesc}>
              Manage multiple weapon and armor configurations with ease
            </p>
          </div>

          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <TrendingUp size={24} />
            </div>
            <h3 style={styles.featureTitle}>Markup System</h3>
            <p style={styles.featureDesc}>
              Calculate your profit margins with built-in markup tracking
            </p>
          </div>

          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <Settings size={24} />
            </div>
            <h3 style={styles.featureTitle}>Session Management</h3>
            <p style={styles.featureDesc}>
              Save and analyze your hunting sessions over time
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <div style={styles.gettingStarted}>
          <h2 style={styles.sectionTitle}>Getting Started</h2>
          <ol style={styles.steps}>
            <li>
              <strong>Set your character name</strong> in Settings so ARTEMIS
              can track your globals
            </li>
            <li>
              <strong>Configure a loadout</strong> with your weapon and armor in
              the Loadouts tab
            </li>
            <li>
              <strong>Start a hunt</strong> by clicking the Start button and
              ARTEMIS will begin tracking
            </li>
            <li>
              <strong>View your stats</strong> on the Dashboard and Loot tabs
              during an active session
            </li>
          </ol>
        </div>

        {/* Dismiss Button */}
        <button onClick={onDismiss} style={styles.dismissButton}>
          Get Started
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
    maxWidth: "800px",
    maxHeight: "90vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: "hsl(0 0% 95%)",
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    fontSize: "16px",
    color: "hsl(220 13% 50%)",
    margin: 0,
    textAlign: "center",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    width: "100%",
  },
  feature: {
    padding: "20px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "8px",
    border: "1px solid hsl(220 13% 25%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
  },
  featureIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: "hsl(217 91% 60%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  featureTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: 0,
  },
  featureDesc: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    margin: 0,
  },
  gettingStarted: {
    width: "100%",
    padding: "24px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "8px",
    border: "1px solid hsl(220 13% 25%)",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "hsl(0 0% 95%)",
    margin: "0 0 12px 0",
  },
  steps: {
    margin: 0,
    paddingLeft: "20px",
    color: "hsl(220 13% 50%)",
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
