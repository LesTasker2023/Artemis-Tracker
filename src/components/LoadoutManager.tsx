/**
 * LoadoutManager - Desktop-focused loadout editor
 * Complete redesign with visual impact and armor support
 */

import { useState, useEffect } from "react";
// Icons removed per user request
import {
  Loadout,
  Equipment,
  DamageProperties,
  createLoadout,
  calculateLoadoutCosts,
  getEffectiveCostPerShot,
  calculateEnhancedDamage,
  calculateDPP,
} from "../core/loadout";
import { useLoadouts } from "../hooks/useLoadouts";
import { EquipmentAutocomplete } from "./EquipmentAutocomplete";
import { EquipmentRecord } from "../core/equipment-db";
// @ts-ignore: CSS module declaration
import styles from "./LoadoutManager.module.css";

// ==================== Helper: Create Equipment from Record ====================

function createEquipmentFromRecord(record: EquipmentRecord): Equipment {
  const equipment: Equipment = {
    name: record.name,
    economy: {
      decay: record.decay,
      ammoBurn: record.ammoBurn,
    },
  };

  if (record.damage) {
    equipment.damage = record.damage as DamageProperties;
  }

  return equipment;
}

function createEquipmentManual(
  name: string,
  decay: number,
  ammoBurn: number
): Equipment {
  return {
    name,
    economy: { decay, ammoBurn },
  };
}

// ==================== Loadout Dropdown Selector ====================

interface LoadoutDropdownProps {
  loadouts: Loadout[];
  activeLoadout: Loadout | null;
  onSelect: (id: string | null) => void;
  compact?: boolean;
}

function LoadoutDropdown({
  loadouts,
  activeLoadout,
  onSelect,
  compact = false,
}: LoadoutDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: compact ? "6px 12px" : "8px 16px",
          backgroundColor: "hsl(220 13% 12%)",
          border: "1px solid hsl(220 13% 25%)",
          borderRadius: "6px",
          color: "hsl(0 0% 95%)",
          fontSize: compact ? "12px" : "13px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
        }}
      >
        <span
          style={{
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {activeLoadout ? activeLoadout.name : "No loadout"}
        </span>
        <span style={{ fontSize: "10px", color: "hsl(220 13% 45%)" }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              backgroundColor: "hsl(220 13% 12%)",
              border: "1px solid hsl(220 13% 25%)",
              borderRadius: "6px",
              maxHeight: "300px",
              overflowY: "auto",
              zIndex: 50,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <div
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: "13px",
                color: !activeLoadout ? "hsl(217 91% 68%)" : "hsl(220 13% 65%)",
                backgroundColor: !activeLoadout
                  ? "hsl(217 91% 68% / 0.1)"
                  : "transparent",
                borderBottom:
                  loadouts.length > 0 ? "1px solid hsl(220 13% 18%)" : "none",
              }}
              onMouseEnter={(e) => {
                if (activeLoadout) {
                  e.currentTarget.style.backgroundColor = "hsl(220 13% 18%)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeLoadout) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              None
            </div>
            {loadouts.map((loadout) => (
              <div
                key={loadout.id}
                onClick={() => {
                  onSelect(loadout.id);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color:
                    activeLoadout?.id === loadout.id
                      ? "hsl(217 91% 68%)"
                      : "hsl(0 0% 95%)",
                  backgroundColor:
                    activeLoadout?.id === loadout.id
                      ? "hsl(217 91% 68% / 0.1)"
                      : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  if (activeLoadout?.id !== loadout.id) {
                    e.currentTarget.style.backgroundColor = "hsl(220 13% 18%)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeLoadout?.id !== loadout.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {loadout.name}
                </span>
                {activeLoadout?.id === loadout.id && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "hsl(142 76% 60%)",
                      marginLeft: "8px",
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==================== Equipment Card with Autocomplete ====================

interface EquipmentCardProps {
  label: string;
  type: "weapon" | "amp" | "scope" | "sight";
  equipment?: Equipment;
  onChange: (eq: Equipment | undefined) => void;
  enhancerSlots?: number;
  onEnhancerChange?: (slots: number) => void;
}

function EquipmentCard({
  label,
  type,
  equipment,
  onChange,
  enhancerSlots = 0,
  onEnhancerChange,
}: EquipmentCardProps) {
  const [decay, setDecay] = useState(
    equipment?.economy.decay ? (equipment.economy.decay * 100).toString() : ""
  );
  const [ammoBurn, setAmmoBurn] = useState(
    equipment?.economy.ammoBurn.toString() ?? ""
  );

  useEffect(() => {
    setDecay(
      equipment?.economy.decay ? (equipment.economy.decay * 100).toString() : ""
    );
    setAmmoBurn(equipment?.economy.ammoBurn.toString() ?? "");
  }, [equipment]);

  const handleAutocomplete = (name: string, record?: EquipmentRecord) => {
    if (!name.trim()) {
      onChange(undefined);
      setDecay("");
      setAmmoBurn("");
      return;
    }

    if (record) {
      setDecay((record.decay * 100).toString());
      setAmmoBurn(record.ammoBurn.toString());
      onChange(createEquipmentFromRecord(record));
    } else {
      onChange(
        createEquipmentManual(
          name,
          (parseFloat(decay) || 0) / 100,
          parseFloat(ammoBurn) || 0
        )
      );
    }
  };

  const handleManualChange = () => {
    if (!equipment?.name) return;
    onChange(
      createEquipmentManual(
        equipment.name,
        (parseFloat(decay) || 0) / 100,
        parseFloat(ammoBurn) || 0
      )
    );
  };

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "hsl(220 13% 12%)",
        borderRadius: "8px",
        border: "1px solid hsl(220 13% 18%)",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "hsl(220 13% 65%)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
      </div>

      {/* Equipment Autocomplete */}
      <EquipmentAutocomplete
        label=""
        type={type}
        value={equipment?.name ?? ""}
        onChange={handleAutocomplete}
      />

      {/* Decay and Ammo inputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "10px",
              color: "hsl(220 13% 45%)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "6px",
            }}
          >
            Decay (PEC)
          </label>
          <input
            className={styles.smallInput}
            type="number"
            value={decay}
            onChange={(e) => setDecay(e.target.value)}
            onBlur={handleManualChange}
            placeholder="0.00"
            step="0.01"
            style={{
              width: "100%",
              padding: "8px 10px",
              backgroundColor: "hsl(220 13% 8%)",
              border: "1px solid hsl(220 13% 25%)",
              borderRadius: "6px",
              fontSize: "13px",
              color: "hsl(0 0% 95%)",
              fontFamily: "monospace",
              textAlign: "right",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "10px",
              color: "hsl(220 13% 45%)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "6px",
            }}
          >
            Ammo Burn
          </label>
          <input
            className={styles.smallInput}
            type="number"
            value={ammoBurn}
            onChange={(e) => setAmmoBurn(e.target.value)}
            onBlur={handleManualChange}
            placeholder="0"
            step="1"
            style={{
              width: "100%",
              padding: "8px 10px",
              backgroundColor: "hsl(220 13% 8%)",
              border: "1px solid hsl(220 13% 25%)",
              borderRadius: "6px",
              fontSize: "13px",
              color: "hsl(0 0% 95%)",
              fontFamily: "monospace",
              textAlign: "right",
            }}
          />
        </div>
      </div>

      {/* Weapon Enhancers (only for weapon type) */}
      {type === "weapon" && onEnhancerChange && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid hsl(220 13% 18%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "hsl(220 13% 65%)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Enhancers
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "hsl(217 91% 68%)",
                fontFamily: "monospace",
              }}
            >
              +{enhancerSlots * 10}% dmg
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(10, 1fr)",
              gap: "4px",
            }}
          >
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  onEnhancerChange(i + 1 === enhancerSlots ? i : i + 1)
                }
                style={{
                  aspectRatio: "1",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  backgroundColor:
                    i < enhancerSlots ? "hsl(217 91% 68%)" : "hsl(220 13% 18%)",
                  borderColor:
                    i < enhancerSlots ? "hsl(217 91% 68%)" : "hsl(220 13% 25%)",
                  color: i < enhancerSlots ? "white" : "hsl(220 13% 45%)",
                  transition: "all 0.15s",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Loadout Card (List View) ====================

interface LoadoutCardProps {
  loadout: Loadout;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function LoadoutCard({
  loadout,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: LoadoutCardProps) {
  const effective = getEffectiveCostPerShot(loadout);
  // const costs = calculateLoadoutCosts(loadout);

  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "8px",
        border: isActive
          ? "1px solid hsl(217 91% 68%)"
          : "1px solid hsl(220 13% 18%)",
        backgroundColor: isActive
          ? "hsl(217 91% 68% / 0.15)"
          : "hsl(220 13% 12%)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={onSelect}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <h4
              style={{
                fontWeight: 600,
                fontSize: "15px",
                color: "hsl(0 0% 95%)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {loadout.name}
            </h4>
            {isActive && (
              <span
                style={{
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "hsl(142 76% 40%)",
                  backgroundColor: "hsl(142 76% 40% / 0.15)",
                  border: "1px solid hsl(142 76% 40% / 0.4)",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}
              >
                Active
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "hsl(220 13% 45%)",
              marginTop: "4px",
            }}
          >
            {loadout.weapon?.name ?? "No weapon"}
            {loadout.amp && ` + ${loadout.amp.name}`}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "12px",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              padding: "6px 12px",
              color: "hsl(220 13% 65%)",
              background: "transparent",
              border: "1px solid hsl(220 13% 25%)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
            }}
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: "6px 12px",
              color: "hsl(220 13% 65%)",
              background: "transparent",
              border: "1px solid hsl(220 13% 25%)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
            }}
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>
      <div
        style={{
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid hsl(220 13% 18%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <span style={{ color: "hsl(220 13% 45%)" }}>Cost/Shot</span>
          <span
            style={{
              fontFamily: "monospace",
              color: "hsl(217 91% 68%)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {(effective * 100).toFixed(3)} PEC
            {loadout.useManualCost && " (manual)"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== Loadout Editor (Full Screen) ====================

interface LoadoutEditorProps {
  loadout: Loadout;
  onSave: (loadout: Loadout) => void;
  onCancel: () => void;
}

function LoadoutEditor({ loadout, onSave, onCancel }: LoadoutEditorProps) {
  const [draft, setDraft] = useState<Loadout>({ ...loadout });
  const { loadouts, activeLoadout, setActive } = useLoadouts();

  const updateEquipment = (key: keyof Loadout, eq: Equipment | undefined) => {
    setDraft((prev) => ({ ...prev, [key]: eq }));
  };

  const costs = calculateLoadoutCosts(draft);
  const damage = draft.weapon
    ? calculateEnhancedDamage(draft)
    : { min: 0, max: 0 };
  const dpp = draft.weapon ? calculateDPP(draft) : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "24px",
        overflow: "auto",
      }}
    >
      <div
        style={{
          backgroundColor: "hsl(220 13% 8%)",
          borderRadius: "12px",
          border: "1px solid hsl(220 13% 18%)",
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "95vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid hsl(220 13% 18%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "hsl(220 13% 8%)",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "hsl(0 0% 95%)",
                marginBottom: "4px",
              }}
            >
              {loadout.id ? "Edit Loadout" : "New Loadout"}
            </h2>
            <p style={{ fontSize: "13px", color: "hsl(220 13% 45%)" }}>
              Configure your equipment and weapon enhancers
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "4px",
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
                onSelect={setActive}
                compact
              />
            </div>
            <button
              onClick={onCancel}
              style={{
                padding: "6px 14px",
                backgroundColor: "transparent",
                border: "1px solid hsl(220 13% 25%)",
                borderRadius: "6px",
                color: "hsl(220 13% 65%)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "24px",
          }}
        >
          {/* Left Column - Equipment */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Name Input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "hsl(220 13% 45%)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Loadout Name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  backgroundColor: "hsl(220 13% 12%)",
                  border: "1px solid hsl(220 13% 25%)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  color: "hsl(0 0% 95%)",
                  fontWeight: 500,
                }}
                placeholder="Enter loadout name..."
              />
            </div>

            {/* Weapons Section */}
            <div>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "hsl(220 13% 65%)",
                  marginBottom: "16px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Equipment
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <EquipmentCard
                  label="Weapon"
                  type="weapon"
                  equipment={draft.weapon}
                  onChange={(eq) => updateEquipment("weapon", eq)}
                  enhancerSlots={draft.weaponEnhancerSlots || 0}
                  onEnhancerChange={(slots) =>
                    setDraft((prev) => ({
                      ...prev,
                      weaponEnhancerSlots: slots,
                    }))
                  }
                />
                <EquipmentCard
                  label="Amplifier"
                  type="amp"
                  equipment={draft.amp}
                  onChange={(eq) => updateEquipment("amp", eq)}
                />
                <EquipmentCard
                  label="Scope"
                  type="scope"
                  equipment={draft.scope}
                  onChange={(eq) => updateEquipment("scope", eq)}
                />
                <EquipmentCard
                  label="Sight"
                  type="sight"
                  equipment={draft.sight}
                  onChange={(eq) => updateEquipment("sight", eq)}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Cost Summary */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Manual Override */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "hsl(220 13% 12%)",
                borderRadius: "8px",
                border: "1px solid hsl(220 13% 18%)",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={draft.useManualCost}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      useManualCost: e.target.checked,
                    }))
                  }
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    color: "hsl(0 0% 95%)",
                    fontWeight: 500,
                  }}
                >
                  Manual cost override
                </span>
              </label>
              {draft.useManualCost && (
                <input
                  type="number"
                  value={
                    draft.manualCostPerShot !== undefined
                      ? (draft.manualCostPerShot * 100).toFixed(3)
                      : ""
                  }
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      manualCostPerShot: e.target.value
                        ? parseFloat(e.target.value) / 100
                        : undefined,
                    }))
                  }
                  step="0.001"
                  placeholder="0.000"
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "10px 12px",
                    backgroundColor: "hsl(220 13% 8%)",
                    border: "1px solid hsl(220 13% 25%)",
                    borderRadius: "6px",
                    color: "hsl(0 0% 95%)",
                    fontSize: "14px",
                    fontFamily: "monospace",
                  }}
                />
              )}
            </div>

            {/* Cost Breakdown */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "hsl(220 13% 12%)",
                borderRadius: "8px",
                border: "1px solid hsl(220 13% 18%)",
              }}
            >
              <h4
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "hsl(220 13% 65%)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "14px",
                }}
              >
                Cost Breakdown
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <CostRow label="Weapon" value={costs.weaponCost} />
                <CostRow label="Amplifier" value={costs.ampCost} />
                <CostRow label="Scope" value={costs.scopeCost} />
                <CostRow label="Sight" value={costs.sightCost} />
                <CostRow
                  label="Weapon Enhancers"
                  value={costs.weaponEnhancerCost}
                />
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "hsl(220 13% 18%)",
                    margin: "6px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "hsl(0 0% 95%)",
                    }}
                  >
                    Total/Shot
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      color: "hsl(217 91% 68%)",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {(costs.totalPerShot * 100).toFixed(3)} PEC
                  </span>
                </div>
              </div>
            </div>

            {/* Damage Summary */}
            {draft.weapon && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "hsl(220 13% 12%)",
                  borderRadius: "8px",
                  border: "1px solid hsl(220 13% 18%)",
                }}
              >
                <h4
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "hsl(220 13% 65%)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "14px",
                  }}
                >
                  Damage & Efficiency
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span
                      style={{ fontSize: "13px", color: "hsl(220 13% 45%)" }}
                    >
                      Min Damage
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "hsl(33 100% 50%)",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {damage.min.toFixed(1)}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span
                      style={{ fontSize: "13px", color: "hsl(220 13% 45%)" }}
                    >
                      Max Damage
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "hsl(33 100% 50%)",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {damage.max.toFixed(1)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "hsl(220 13% 18%)",
                      margin: "4px 0",
                    }}
                  />
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "hsl(0 0% 95%)",
                      }}
                    >
                      DPP (Dmg/PEC)
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "hsl(142 76% 60%)",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      {(dpp / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid hsl(220 13% 18%)",
            backgroundColor: "hsl(220 13% 8%)",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              backgroundColor: "hsl(220 13% 14%)",
              color: "hsl(0 0% 95%)",
              border: "1px solid hsl(220 13% 25%)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.name.trim()}
            style={{
              padding: "10px 24px",
              background: draft.name.trim()
                ? "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)"
                : "hsl(220 13% 18%)",
              color: draft.name.trim() ? "white" : "hsl(220 13% 45%)",
              border: "none",
              borderRadius: "8px",
              cursor: draft.name.trim() ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Save Loadout
          </button>
        </div>
      </div>
    </div>
  );
}

// Cost Row Helper
function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "13px", color: "hsl(220 13% 45%)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          color: "hsl(0 0% 95%)",
          fontSize: "13px",
        }}
      >
        {(value * 100).toFixed(2)} PEC
      </span>
    </div>
  );
}

// ==================== Main LoadoutManager Component ====================

export function LoadoutManager() {
  const {
    loadouts,
    activeLoadout,
    costPerShot: _costPerShot,
    setActive,
    save,
    remove,
  } = useLoadouts();
  const [editing, setEditing] = useState<Loadout | null>(null);

  const handleNew = () => {
    setEditing(createLoadout(""));
  };

  const handleSave = (loadout: Loadout) => {
    save(loadout);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this loadout?")) {
      remove(id);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#090d13",
        color: "hsl(0 0% 95%)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid hsl(220 13% 18%)",
          background: "hsl(220 13% 8%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Loadouts</h2>
            <p
              style={{
                fontSize: "13px",
                color: "hsl(220 13% 45%)",
                marginTop: "2px",
              }}
            >
              Manage your equipment configurations
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={handleNew}
              style={{
                padding: "10px 18px",
                background:
                  "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
              }}
              title="New Loadout"
            >
              New Loadout
            </button>
          </div>
        </div>
      </div>

      {/* Loadout List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "14px",
          alignContent: "start",
        }}
      >
        {loadouts.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "64px 0",
              color: "hsl(220 13% 45%)",
            }}
          >
            <p style={{ fontSize: "15px", marginBottom: "6px" }}>
              No loadouts yet
            </p>
            <p style={{ fontSize: "13px" }}>
              Create one to track cost per shot
            </p>
          </div>
        ) : (
          loadouts.map((loadout) => (
            <LoadoutCard
              key={loadout.id}
              loadout={loadout}
              isActive={loadout.id === activeLoadout?.id}
              onSelect={() =>
                setActive(loadout.id === activeLoadout?.id ? null : loadout.id)
              }
              onEdit={() => setEditing(loadout)}
              onDelete={() => handleDelete(loadout.id)}
            />
          ))
        )}
      </div>

      {/* Editor Modal */}
      {editing && (
        <LoadoutEditor
          loadout={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// Export LoadoutDropdown for use in App header
export { LoadoutDropdown };
