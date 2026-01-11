/**
 * UpdateNotification - Shows update status and prompts
 */

import { useEffect, useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export function UpdateNotification() {
  const [updateState, setUpdateState] = useState<
    "idle" | "checking" | "available" | "downloading" | "ready" | "error"
  >("idle");
  const [version, setVersion] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!window.electron?.update) return;

    // Listen for update events
    const removeChecking = window.electron.update.onChecking(() => {
      setUpdateState("checking");
      setVisible(true);
    });

    const removeAvailable = window.electron.update.onAvailable((info) => {
      setUpdateState("available");
      setVersion(info.version);
      setVisible(true);
    });

    const removeNotAvailable = window.electron.update.onNotAvailable(() => {
      setUpdateState("idle");
      // Don't show notification if no update
      setTimeout(() => setVisible(false), 3000);
    });

    const removeError = window.electron.update.onError((err) => {
      setUpdateState("error");
      setError(err);
      setVisible(true);
    });

    const removeProgress = window.electron.update.onProgress((prog) => {
      setUpdateState("downloading");
      setProgress(prog.percent);
      setVisible(true);
    });

    const removeDownloaded = window.electron.update.onDownloaded((info) => {
      setUpdateState("ready");
      setVersion(info.version);
      setVisible(true);
    });

    return () => {
      removeChecking();
      removeAvailable();
      removeNotAvailable();
      removeError();
      removeProgress();
      removeDownloaded();
    };
  }, []);

  const handleInstall = async () => {
    if (!window.electron?.update) return;
    await window.electron.update.install();
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible || updateState === "idle") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        maxWidth: "400px",
        backgroundColor: "#1e293b",
        border: "2px solid #334155",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        animation: "slideIn 0.3s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        {updateState === "checking" && <RefreshCw size={20} style={{ color: "#3b82f6", animation: "spin 1s linear infinite" }} />}
        {updateState === "available" && <Download size={20} style={{ color: "#22d3ee" }} />}
        {updateState === "downloading" && <Download size={20} style={{ color: "#22d3ee", animation: "pulse 1.5s ease-in-out infinite" }} />}
        {updateState === "ready" && <CheckCircle size={20} style={{ color: "#22c55e" }} />}
        {updateState === "error" && <AlertCircle size={20} style={{ color: "#ef4444" }} />}

        <span style={{ fontSize: "16px", fontWeight: 600, color: "white", flex: 1 }}>
          {updateState === "checking" && "Checking for updates..."}
          {updateState === "available" && `Update available: v${version}`}
          {updateState === "downloading" && "Downloading update..."}
          {updateState === "ready" && "Update ready to install"}
          {updateState === "error" && "Update error"}
        </span>

        <button
          onClick={handleDismiss}
          style={{
            padding: "4px",
            backgroundColor: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "18px",
          }}
          title="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Message */}
      <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>
        {updateState === "checking" && "Looking for new versions..."}
        {updateState === "available" && "A new version is available and will download automatically."}
        {updateState === "downloading" && `Downloading: ${Math.round(progress)}%`}
        {updateState === "ready" && "The update will be installed when you restart the app."}
        {updateState === "error" && error}
      </div>

      {/* Progress bar */}
      {updateState === "downloading" && (
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#0f172a",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#22d3ee",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Actions */}
      {updateState === "ready" && (
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleInstall}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <RefreshCw size={16} />
            Restart & Install
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: "10px 16px",
              backgroundColor: "#334155",
              color: "#d1d5db",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Later
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}
