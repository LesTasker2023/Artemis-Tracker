/**
 * Asteroid Panel - Compact asteroid tracker for the popout window
 * Auto-captures position from chat and loot within 5 seconds
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Save, Trash2, ChevronDown } from "lucide-react";
import { colors, spacing, radius } from "../ui";

// ==================== Types ====================

export interface AsteroidLoot {
  itemName: string;
  quantity: number;
  value: number;
  timestamp: number;
}

export interface Asteroid {
  id: string;
  type: AsteroidType;
  size: AsteroidSize;
  coordinates: string;
  loot: AsteroidLoot[];
  totalValue: number;
  timestamp: number;
}

interface ParsedEvent {
  timestamp: number;
  raw: string;
  category: string;
  type: string;
  data: Record<string, unknown>;
}

export type AsteroidType = "C" | "S" | "F" | "M" | "ND" | "Scrap";
export type AsteroidSize =
  | "I"
  | "II"
  | "III"
  | "IV"
  | "V"
  | "VI"
  | "VII"
  | "VIII"
  | "IX"
  | "X"
  | "XI"
  | "XII"
  | "XIII"
  | "XIV"
  | "XV"
  | "XVI"
  | "XVII"
  | "XVIII"
  | "XIX"
  | "XX"
  | "XXI"
  | "XXII"
  | "XXIII"
  | "XXIV"
  | "XXV"
  | "XXVI"
  | "XXVII"
  | "XXVIII"
  | "XXIX"
  | "XXX";

const ASTEROID_TYPES: AsteroidType[] = ["C", "S", "F", "M", "ND", "Scrap"];
const ASTEROID_SIZES: AsteroidSize[] = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
  "XXII",
  "XXIII",
  "XXIV",
  "XXV",
  "XXVI",
  "XXVII",
  "XXVIII",
  "XXIX",
  "XXX",
];

// Loot capture window after position event (in ms)
const LOOT_CAPTURE_WINDOW = 5000;

// ==================== Component ====================

export function AsteroidPanel() {
  // Current asteroid being tracked
  const [type, setType] = useState<AsteroidType>("C");
  const [size, setSize] = useState<AsteroidSize>("I");
  const [coordinates, setCoordinates] = useState("");
  const [currentLoot, setCurrentLoot] = useState<AsteroidLoot[]>([]);

  // Session asteroids
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);

  // Auto-capture state - always listening
  const lastPositionTimeRef = useRef<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Listening...");

  // Load saved asteroids on mount
  useEffect(() => {
    loadAsteroids();
  }, []);

  // Listen for position and loot events from main process
  useEffect(() => {
    const handleEvent = (...args: unknown[]) => {
      try {
        console.log("[Asteroid] Raw args:", args.length, args);
        const event = args[1] as ParsedEvent;
        if (!event) {
          console.log("[Asteroid] No event in args[1]");
          return;
        }

        console.log(
          "[Asteroid] Event received:",
          event.category,
          event.type,
          event.data
        );

        // Handle POSITION events - auto-fill coordinates
        if (event.category === "position" && event.type === "POSITION") {
          const d = event.data as any;
          if (
            typeof d.x !== "number" ||
            typeof d.y !== "number" ||
            typeof d.z !== "number"
          ) {
            console.warn("[Asteroid] Position event with unexpected data:", d);
          } else {
            const { x, y, z } = d as { x: number; y: number; z: number };
            const coordString = `${x}, ${y}, ${z}`;
            setCoordinates(coordString);
            lastPositionTimeRef.current = Date.now();
            setStatusMessage(`📍 ${x}, ${y}, ${z}`);
            console.log("[Asteroid] Position captured:", coordString);
          }
        }

        // Handle LOOT events - capture if within window of position
        if (event.category === "loot" && event.type === "LOOT") {
          const now = Date.now();
          const d = event.data as any;

          // Defensive checks
          if (!d || typeof d !== "object") {
            console.warn("[Asteroid] Loot event with unexpected data:", d);
            return;
          }

          const item = d.item ?? d.itemName ?? "Unknown";
          const quantity =
            typeof d.quantity === "number" ? d.quantity : d.count ?? 1;
          const value =
            typeof d.value === "number" ? d.value : d.totalValue ?? 0;

          // Only capture if we have coordinates and within the time window
          if (
            lastPositionTimeRef.current &&
            now - lastPositionTimeRef.current <= LOOT_CAPTURE_WINDOW
          ) {
            const lootItem: AsteroidLoot = {
              itemName: item,
              quantity: quantity || 1,
              value: value || 0,
              timestamp: now,
            };
            setCurrentLoot((prev) => [...prev, lootItem]);
            setStatusMessage(`💎 ${item}`);
            console.log("[Asteroid] Loot captured:", lootItem);
          }
        }
      } catch (e) {
        console.error("[Asteroid] Error handling event:", e, args);
        // Forward to main so it appears in terminal
        try {
          (window.electron as any).ipcRenderer?.send?.("renderer:error", {
            message: String(e),
            stack: (e as Error).stack,
          });
        } catch (_) {}
      }
    };

    window.electron?.ipcRenderer?.on?.("asteroid-event", handleEvent);
    return () => {
      window.electron?.ipcRenderer?.removeListener?.(
        "asteroid-event",
        handleEvent
      );
    };
  }, []);

  const loadAsteroids = async () => {
    try {
      const data = await window.electron?.asteroid?.load();
      if (data) {
        setAsteroids(data as unknown as Asteroid[]);
      }
    } catch (e) {
      console.error("Failed to load asteroids:", e);
    }
  };

  const saveAsteroid = useCallback(async () => {
    if (!coordinates.trim()) {
      setStatusMessage("⚠️ No coords");
      return;
    }

    const asteroid: Asteroid = {
      id: `asteroid-${Date.now()}`,
      type,
      size,
      coordinates: coordinates.trim(),
      loot: currentLoot,
      totalValue: currentLoot.reduce((sum, l) => sum + l.value, 0),
      timestamp: Date.now(),
    };

    const updated = [...asteroids, asteroid];
    setAsteroids(updated);

    try {
      await window.electron?.asteroid?.save(updated);
      setStatusMessage(`✅ Saved`);
      console.log("[Asteroid] Saved:", asteroid);
    } catch (e) {
      console.error("Failed to save asteroid:", e);
      setStatusMessage("❌ Failed");
    }

    // Clear for next asteroid
    clearForm();
  }, [type, size, coordinates, currentLoot, asteroids]);

  const clearForm = () => {
    setCoordinates("");
    setCurrentLoot([]);
    lastPositionTimeRef.current = null;
    setTimeout(() => setStatusMessage("Listening..."), 1500);
  };

  const totalCurrentValue = currentLoot.reduce((sum, l) => sum + l.value, 0);

  return (
    <div style={styles.container}>
      {/* Status */}
      <div style={styles.status}>
        <span
          style={{
            ...styles.statusDot,
            backgroundColor: colors.success,
          }}
        />
        <span style={styles.statusText}>{statusMessage}</span>
      </div>

      {/* Type & Size Row */}
      <div style={styles.row}>
        <div style={styles.selectWrapper}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AsteroidType)}
            style={styles.select}
          >
            {ASTEROID_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown size={12} style={styles.selectIcon} />
        </div>
        <div style={styles.selectWrapper}>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as AsteroidSize)}
            style={styles.select}
          >
            {ASTEROID_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown size={12} style={styles.selectIcon} />
        </div>
      </div>

      {/* Coordinates */}
      <input
        type="text"
        value={coordinates}
        onChange={(e) => setCoordinates(e.target.value)}
        placeholder="Coords (auto-fill)"
        style={styles.input}
      />

      {/* Loot Summary */}
      {currentLoot.length > 0 && (
        <div style={styles.lootSummary}>
          <span style={styles.lootCount}>{currentLoot.length} items</span>
          <span style={styles.lootValue}>
            {totalCurrentValue.toFixed(2)} PED
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={clearForm} style={styles.clearBtn}>
          <Trash2 size={12} />
        </button>
        <button
          onClick={saveAsteroid}
          disabled={!coordinates.trim()}
          style={{
            ...styles.saveBtn,
            opacity: coordinates.trim() ? 1 : 0.5,
          }}
        >
          <Save size={12} />
          Save
        </button>
      </div>

      {/* Recent count */}
      <div style={styles.recentCount}>{asteroids.length} saved</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: spacing.sm,
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
    color: colors.textMuted,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },
  statusText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  row: {
    display: "flex",
    gap: spacing.xs,
  },
  selectWrapper: {
    position: "relative",
    flex: 1,
  },
  select: {
    width: "100%",
    padding: "6px 8px",
    paddingRight: 20,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.textPrimary,
    cursor: "pointer",
    appearance: "none",
  },
  selectIcon: {
    position: "absolute",
    right: 6,
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.textMuted,
    pointerEvents: "none",
  },
  input: {
    padding: "6px 8px",
    fontSize: 10,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.textPrimary,
  },
  lootSummary: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    padding: "4px 8px",
    backgroundColor: colors.bgPanel,
    borderRadius: radius.sm,
  },
  lootCount: {
    color: colors.textMuted,
  },
  lootValue: {
    color: colors.success,
    fontFamily: "monospace",
  },
  actions: {
    display: "flex",
    gap: spacing.xs,
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.textMuted,
    cursor: "pointer",
  },
  saveBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: colors.success,
    border: "none",
    borderRadius: radius.sm,
    color: "white",
    cursor: "pointer",
  },
  recentCount: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: "center",
  },
};

export default AsteroidPanel;
