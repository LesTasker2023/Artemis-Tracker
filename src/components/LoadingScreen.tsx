/**
 * LoadingScreen - Shown during app initialization
 * Displays Artemis logo and loading progress
 */

import { useState, useEffect } from "react";
import projectLogo from "../../data/artemis logo.png";
import { colors } from "./ui";

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  fadingOut?: boolean;
}

const wittyMessages = [
  "Calibrating targeting systems...",
  "Polishing the scope...",
  "Counting virtual bullets...",
  "Training the AI to dodge...",
  "Optimizing loot algorithms...",
  "Warming up the damage calculator...",
  "Teaching statistics to behave...",
  "Convincing numbers to cooperate...",
  "Bribing the RNG gods...",
  "Reticulating splines...",
  "Spawning mobs respectfully...",
  "Negotiating with the loot table...",
  "Installing combat awareness...",
  "Buffing the user interface...",
  "Debuffing loading times...",
];

export function LoadingScreen({ message, fadingOut }: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    // Only rotate messages if no specific message is provided
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % wittyMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [message]);

  const displayMessage = message || wittyMessages[currentMessage];

  return (
    <div
      style={{
        ...styles.container,
        animation: fadingOut ? "fadeOut 0.5s ease-out forwards" : undefined,
      }}
    >
      {/* Artemis Logo */}
      <div style={styles.logoSection}>
        <img src={projectLogo} alt="Artemis" style={styles.logo} />
        <div style={styles.tagline}>Hunt Smarter, Not Harder</div>
      </div>

      {/* Status Message */}
      <div style={styles.message}>{displayMessage}</div>

      {/* Loading Bar */}
      <div style={styles.progressBar}>
        <div style={styles.progressFill} />
      </div>

      <style>{`
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgBase,
    fontFamily: "system-ui, sans-serif",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "48px",
    animation: "fadeIn 0.6s ease-out",
  },
  logo: {
    height: "120px",
    objectFit: "contain",
  },
  tagline: {
    fontSize: "14px",
    fontWeight: 500,
    color: colors.textMuted,
    marginTop: "12px",
    letterSpacing: "1px",
    fontStyle: "italic",
  },
  message: {
    fontSize: "14px",
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: "24px",
    minHeight: "24px",
    textAlign: "center",
    animation: "fadeIn 0.3s ease-out",
  },
  progressBar: {
    position: "relative",
    width: "280px",
    height: "4px",
    backgroundColor: colors.border,
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    height: "100%",
    width: "25%",
    backgroundColor: colors.info,
    borderRadius: "2px",
    animation: "slideRight 1.5s ease-in-out infinite",
  },
};
