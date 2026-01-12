/**
 * LoadingScreen - Shown during app initialization
 * Displays loading spinner and status messages
 */

import { useState, useEffect } from "react";
import { Target, Crosshair } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  progress?: number;
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

export function LoadingScreen({
  message,
  progress,
}: LoadingScreenProps) {
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
    <div style={styles.container}>
      {/* Logo Section */}
      <div style={styles.logoSection}>
        <div style={styles.iconContainer}>
          <Target size={48} style={styles.targetIcon} />
          <Crosshair size={32} style={styles.crosshairIcon} />
        </div>
        <h1 style={styles.title}>ARTEMIS</h1>
        <p style={styles.subtitle}>Hunting Session Tracker</p>
      </div>

      {/* Loading Animation */}
      <div style={styles.spinnerContainer}>
        <div style={styles.spinner}>
          <div style={styles.spinnerRing}></div>
          <div style={styles.spinnerRing}></div>
          <div style={styles.spinnerRing}></div>
        </div>
      </div>

      {/* Status Message */}
      <div style={styles.message}>{displayMessage}</div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
    backgroundColor: "hsl(220 13% 9%)",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "48px",
    animation: "fadeIn 0.6s ease-out",
  },
  iconContainer: {
    position: "relative",
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
  },
  targetIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#06b6d4",
    animation: "pulse 2s ease-in-out infinite",
  },
  crosshairIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#f59e0b",
    animation: "spin 3s linear infinite",
  },
  title: {
    fontSize: "48px",
    fontWeight: 800,
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #f59e0b 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "4px",
  },
  subtitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "hsl(220 13% 60%)",
    margin: 0,
    letterSpacing: "2px",
    textTransform: "uppercase",
  },
  spinnerContainer: {
    marginBottom: "32px",
  },
  spinner: {
    position: "relative",
    width: "60px",
    height: "60px",
  },
  spinnerRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    border: "3px solid transparent",
    borderTopColor: "#06b6d4",
    borderRadius: "50%",
    animation: "spin 1.5s linear infinite",
  } as React.CSSProperties,
  message: {
    fontSize: "15px",
    fontWeight: 500,
    color: "hsl(220 13% 70%)",
    marginBottom: "24px",
    minHeight: "24px",
    animation: "fadeIn 0.3s ease-out",
  },
  progressBar: {
    width: "320px",
    height: "6px",
    backgroundColor: "hsl(220 13% 18%)",
    borderRadius: "3px",
    overflow: "hidden",
    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #06b6d4 0%, #8b5cf6 50%, #f59e0b 100%)",
    borderRadius: "3px",
    transition: "width 0.4s ease",
    boxShadow: "0 0 10px rgba(6, 182, 212, 0.5)",
  },
};
