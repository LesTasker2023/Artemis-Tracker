/**
 * LoadingScreen - Shown during app initialization
 * Displays loading spinner and status messages
 */

import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export function LoadingScreen({
  message = "Loading...",
  progress,
}: LoadingScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        color: "white",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Logo/Title */}
      <div
        style={{
          marginBottom: "32px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "8px",
            background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ARTEMIS v3
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#94a3b8",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Activity Tracker
        </p>
      </div>

      {/* Spinner */}
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <Loader2
          size={48}
          style={{
            color: "#06b6d4",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>

      {/* Status Message */}
      <div
        style={{
          fontSize: "14px",
          color: "#94a3b8",
          marginBottom: progress !== undefined ? "16px" : "0",
        }}
      >
        {message}
      </div>

      {/* Progress Bar (optional) */}
      {progress !== undefined && (
        <div
          style={{
            width: "300px",
            height: "4px",
            backgroundColor: "#1e293b",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#06b6d4",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
