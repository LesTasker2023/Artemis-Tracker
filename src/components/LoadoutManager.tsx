/**
 * LoadoutManager - Desktop-focused loadout editor
 * Complete redesign with visual impact and armor support
 */

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Edit2,
  Crosshair,
  Zap,
  Shield,
  Package,
  TrendingUp,
} from "lucide-react";
import {
  Loadout,
  Equipment,
  DamageProperties,
  createLoadout,
  calculateLoadoutCosts,
  getEffectiveCostPerShot,
  calculateEnhancedDamage,
  calculateDPP,
  calculateWeaponEnhancerCost,
} from "../core/loadout";
import { useLoadouts } from "../hooks/useLoadouts";
import { EquipmentAutocomplete } from "./EquipmentAutocomplete";
import { ArmorAutocomplete } from "./ArmorAutocomplete";
import { ArmorPlateAutocomplete } from "./ArmorPlateAutocomplete";
import { EquipmentRecord } from "../core/equipment-db";

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

// ==================== Equipment Card with Autocomplete ====================

interface EquipmentCardProps {
  label: string;
  icon: React.ElementType;
  type: "weapon" | "amp" | "scope" | "sight";
  equipment?: Equipment;
  onChange: (eq: Equipment | undefined) => void;
  color: string;
}

function EquipmentCard({
  label,
  icon: Icon,
  type,
  equipment,
  onChange,
  color,
}: EquipmentCardProps) {
  const [decay, setDecay] = useState(equipment?.economy.decay.toString() ?? "");
  const [ammoBurn, setAmmoBurn] = useState(
    equipment?.economy.ammoBurn.toString() ?? ""
  );

  useEffect(() => {
    setDecay(equipment?.economy.decay.toString() ?? "");
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
      setDecay(record.decay.toString());
      setAmmoBurn(record.ammoBurn.toString());
      onChange(createEquipmentFromRecord(record));
    } else {
      onChange(
        createEquipmentManual(
          name,
          parseFloat(decay) || 0,
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
        parseFloat(decay) || 0,
        parseFloat(ammoBurn) || 0
      )
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "rgba(17,24,39,0.6)",
        borderRadius: "12px",
        border: "2px solid #374151",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
            border: `2px solid ${color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#e5e7eb",
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "10px",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "6px",
            }}
          >
            Decay (PED)
          </label>
          <input
            type="number"
            value={decay}
            onChange={(e) => setDecay(e.target.value)}
            onBlur={handleManualChange}
            placeholder="0.0000"
            step="0.001"
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "14px",
              color: "white",
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
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "6px",
            }}
          >
            Ammo Burn
          </label>
          <input
            type="number"
            value={ammoBurn}
            onChange={(e) => setAmmoBurn(e.target.value)}
            onBlur={handleManualChange}
            placeholder="0"
            step="1"
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "14px",
              color: "white",
              fontFamily: "monospace",
              textAlign: "right",
            }}
          />
        </div>
      </div>
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

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        border: isActive ? "2px solid #22c55e" : "2px solid #374151",
        backgroundColor: isActive
          ? "rgba(34,197,94,0.15)"
          : "rgba(17,24,39,0.5)",
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
          <h4
            style={{
              fontWeight: 600,
              fontSize: "16px",
              color: "white",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {loadout.name}
          </h4>
          <p style={{ fontSize: "14px", color: "#9ca3af", marginTop: "4px" }}>
            {loadout.weapon?.name ?? "No weapon"}
            {loadout.amp && ` + ${loadout.amp.name}`}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginLeft: "12px",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              padding: "8px",
              color: "#9ca3af",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: "8px",
              color: "#9ca3af",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(55,65,81,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "#6b7280" }}>Cost/Shot</span>
          <span style={{ fontFamily: "monospace", color: "#22d3ee", fontSize: "15px", fontWeight: 600 }}>
            {effective.toFixed(5)} PED
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

  const updateEquipment = (key: keyof Loadout, eq: Equipment | undefined) => {
    setDraft((prev) => ({ ...prev, [key]: eq }));
  };

  const costs = calculateLoadoutCosts(draft);
  const damage = draft.weapon ? calculateEnhancedDamage(draft) : { min: 0, max: 0 };
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
          backgroundColor: "#0f172a",
          borderRadius: "16px",
          border: "2px solid #1e293b",
          width: "100%",
          maxWidth: "1400px",
          maxHeight: "95vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "2px solid #1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          }}
        >
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "white", marginBottom: "4px" }}>
              {loadout.id ? "Edit Loadout" : "New Loadout"}
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              Configure your equipment, armor, and enhancers
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              padding: "10px",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Two Column Layout */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "32px",
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            gap: "32px",
          }}
        >
          {/* Left Column - Equipment & Armor */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Name Input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "12px",
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
                  padding: "14px 16px",
                  backgroundColor: "#1e293b",
                  border: "2px solid #334155",
                  borderRadius: "10px",
                  fontSize: "16px",
                  color: "white",
                  fontWeight: 500,
                }}
                placeholder="Enter loadout name..."
              />
            </div>

            {/* Weapons Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <Crosshair size={24} style={{ color: "#ef4444" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "white" }}>
                  Weapons & Attachments
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <EquipmentCard
                  label="Weapon"
                  icon={Crosshair}
                  type="weapon"
                  equipment={draft.weapon}
                  onChange={(eq) => updateEquipment("weapon", eq)}
                  color="#ef4444"
                />
                <EquipmentCard
                  label="Amplifier"
                  icon={Zap}
                  type="amp"
                  equipment={draft.amp}
                  onChange={(eq) => updateEquipment("amp", eq)}
                  color="#8b5cf6"
                />
                <EquipmentCard
                  label="Scope"
                  icon={Package}
                  type="scope"
                  equipment={draft.scope}
                  onChange={(eq) => updateEquipment("scope", eq)}
                  color="#3b82f6"
                />
                <EquipmentCard
                  label="Sight"
                  icon={Package}
                  type="sight"
                  equipment={draft.sight}
                  onChange={(eq) => updateEquipment("sight", eq)}
                  color="#06b6d4"
                />
              </div>
            </div>

            {/* Armor Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <Shield size={24} style={{ color: "#60a5fa" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "white" }}>
                  Armor Protection
                </h3>
              </div>
              <div style={{ display: "grid", gap: "16px" }}>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "rgba(17,24,39,0.6)",
                    borderRadius: "12px",
                    border: "2px solid #374151",
                  }}
                >
                  <ArmorAutocomplete
                    value={draft.armor}
                    onChange={(armor) => setDraft((prev) => ({ ...prev, armor }))}
                  />
                </div>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "rgba(17,24,39,0.6)",
                    borderRadius: "12px",
                    border: "2px solid #374151",
                  }}
                >
                  <ArmorPlateAutocomplete
                    plates={draft.armorPlates || []}
                    onChange={(plates) =>
                      setDraft((prev) => ({ ...prev, armorPlates: plates }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Enhancers Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <TrendingUp size={24} style={{ color: "#4ade80" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "white" }}>
                  Enhancers
                </h3>
              </div>
              <div style={{ display: "grid", gap: "16px" }}>
                {/* Weapon Enhancers */}
                <div
                  style={{
                    padding: "24px",
                    backgroundColor: "rgba(34,197,94,0.1)",
                    borderRadius: "12px",
                    border: "2px solid rgba(34,197,94,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#e5e7eb",
                      }}
                    >
                      Weapon Enhancers
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#22d3ee",
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    >
                      {calculateWeaponEnhancerCost(
                        draft.weaponEnhancerSlots || 0
                      ).toFixed(4)}{" "}
                      PED/shot
                    </span>
                  </div>

                  {/* Slot Selector */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    {[...Array(10)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            weaponEnhancerSlots:
                              i + 1 === prev.weaponEnhancerSlots ? i : i + 1,
                          }))
                        }
                        style={{
                          aspectRatio: "1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          border: "2px solid",
                          cursor: "pointer",
                          backgroundColor:
                            i < (draft.weaponEnhancerSlots || 0)
                              ? "#16a34a"
                              : "#1e293b",
                          borderColor:
                            i < (draft.weaponEnhancerSlots || 0)
                              ? "#22c55e"
                              : "#334155",
                          color:
                            i < (draft.weaponEnhancerSlots || 0)
                              ? "white"
                              : "#64748b",
                          transition: "all 0.15s",
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>
                      {draft.weaponEnhancerSlots || 0}/10 slots
                    </span>
                    <span style={{ color: "#4ade80", fontWeight: 600 }}>
                      +{(draft.weaponEnhancerSlots || 0) * 10}% damage
                    </span>
                  </div>
                </div>

                {/* Armor Enhancers */}
                <div
                  style={{
                    padding: "24px",
                    backgroundColor: "rgba(59,130,246,0.1)",
                    borderRadius: "12px",
                    border: "2px solid rgba(59,130,246,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#e5e7eb",
                      }}
                    >
                      Armor Enhancers
                    </span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      No shot cost
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    {[...Array(10)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            armorEnhancerSlots:
                              i + 1 === prev.armorEnhancerSlots ? i : i + 1,
                          }))
                        }
                        style={{
                          aspectRatio: "1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          border: "2px solid",
                          cursor: "pointer",
                          backgroundColor:
                            i < (draft.armorEnhancerSlots || 0)
                              ? "#2563eb"
                              : "#1e293b",
                          borderColor:
                            i < (draft.armorEnhancerSlots || 0)
                              ? "#3b82f6"
                              : "#334155",
                          color:
                            i < (draft.armorEnhancerSlots || 0)
                              ? "white"
                              : "#64748b",
                          transition: "all 0.15s",
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>
                      {draft.armorEnhancerSlots || 0}/10 slots
                    </span>
                    <span style={{ color: "#64748b" }}>Decay on damage taken</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Cost Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Manual Override */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "rgba(17,24,39,0.6)",
                borderRadius: "12px",
                border: "2px solid #334155",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
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
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", color: "#d1d5db", fontWeight: 500 }}>
                  Use manual cost override
                </span>
              </label>
              {draft.useManualCost && (
                <input
                  type="number"
                  value={draft.manualCostPerShot ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      manualCostPerShot: parseFloat(e.target.value) || undefined,
                    }))
                  }
                  step="0.00001"
                  placeholder="0.00000"
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "12px 14px",
                    backgroundColor: "#1e293b",
                    border: "2px solid #334155",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "16px",
                    fontFamily: "monospace",
                  }}
                />
              )}
            </div>

            {/* Cost Breakdown */}
            <div
              style={{
                padding: "24px",
                backgroundColor: "rgba(17,24,39,0.8)",
                borderRadius: "12px",
                border: "2px solid #334155",
              }}
            >
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "20px",
                }}
              >
                Cost Breakdown
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <CostRow label="Weapon" value={costs.weaponCost} />
                <CostRow label="Amplifier" value={costs.ampCost} />
                <CostRow label="Scope" value={costs.scopeCost} />
                <CostRow label="Sight" value={costs.sightCost} />
                <CostRow label="Weapon Enhancers" value={costs.weaponEnhancerCost} />
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "#334155",
                    margin: "8px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "white" }}>
                    Total/Shot
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      color: "#22d3ee",
                      fontSize: "20px",
                      fontWeight: 700,
                    }}
                  >
                    {costs.totalPerShot.toFixed(5)} PED
                  </span>
                </div>
              </div>
            </div>

            {/* Damage Summary */}
            {draft.weapon && (
              <div
                style={{
                  padding: "24px",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  borderRadius: "12px",
                  border: "2px solid rgba(239,68,68,0.3)",
                }}
              >
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "20px",
                  }}
                >
                  Damage & Efficiency
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", color: "#9ca3af" }}>Min Damage</span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "#fb923c",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {damage.min.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", color: "#9ca3af" }}>Max Damage</span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "#fb923c",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {damage.max.toFixed(1)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "rgba(239,68,68,0.3)",
                      margin: "4px 0",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "white" }}>
                      DPP (Dmg/PEC)
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "#4ade80",
                        fontSize: "20px",
                        fontWeight: 700,
                      }}
                    >
                      {(dpp / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Armor Decay */}
            {(draft.armor || (draft.armorPlates && draft.armorPlates.length > 0)) && (
              <div
                style={{
                  padding: "24px",
                  backgroundColor: "rgba(96,165,250,0.1)",
                  borderRadius: "12px",
                  border: "2px solid rgba(96,165,250,0.3)",
                }}
              >
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "16px",
                  }}
                >
                  Armor Decay/Hit
                </h4>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#9ca3af" }}>Per Hit Cost</span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      color: "#60a5fa",
                      fontSize: "18px",
                      fontWeight: 700,
                    }}
                  >
                    {costs.armorDecayPerHit.toFixed(5)} PED
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "20px 32px",
            borderTop: "2px solid #1e293b",
            backgroundColor: "#0f172a",
            display: "flex",
            gap: "16px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "12px 32px",
              backgroundColor: "#1e293b",
              color: "#d1d5db",
              border: "2px solid #334155",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.name.trim()}
            style={{
              padding: "12px 32px",
              backgroundColor: draft.name.trim() ? "#0891b2" : "#334155",
              color: draft.name.trim() ? "white" : "#64748b",
              border: "none",
              borderRadius: "10px",
              cursor: draft.name.trim() ? "pointer" : "not-allowed",
              fontSize: "15px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Save size={18} />
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
      <span style={{ fontSize: "14px", color: "#9ca3af" }}>{label}</span>
      <span style={{ fontFamily: "monospace", color: "#d1d5db", fontSize: "14px" }}>
        {value.toFixed(4)} PED
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
        backgroundColor: "#0f172a",
        color: "white",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "2px solid #1e293b",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
            <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Loadouts</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
              Manage your equipment configurations
            </p>
          </div>
          <button
            onClick={handleNew}
            style={{
              padding: "12px 20px",
              backgroundColor: "#0891b2",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            title="New Loadout"
          >
            <Plus size={18} />
            New Loadout
          </button>
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
          gap: "16px",
          alignContent: "start",
        }}
      >
        {loadouts.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "64px 0",
              color: "#64748b",
            }}
          >
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>No loadouts yet</p>
            <p style={{ fontSize: "14px" }}>
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
