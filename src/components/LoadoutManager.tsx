import { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Edit2 } from "lucide-react";
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
// DISABLED: Armor decay calculation needs work
// import { ArmorAutocomplete } from "./ArmorAutocomplete";
// import { ArmorPlateAutocomplete } from "./ArmorPlateAutocomplete";
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

// ==================== Equipment Row with Autocomplete ====================

interface EquipmentRowProps {
  label: string;
  type: "weapon" | "amp" | "scope" | "sight";
  equipment?: Equipment;
  onChange: (eq: Equipment | undefined) => void;
}

function EquipmentRow({ label, type, equipment, onChange }: EquipmentRowProps) {
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
      // Auto-fill from database (includes damage data)
      setDecay(record.decay.toString());
      setAmmoBurn(record.ammoBurn.toString());
      onChange(createEquipmentFromRecord(record));
    } else {
      // Manual entry - keep current values
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
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 90px 90px",
          gap: "16px",
          alignItems: "end",
        }}
      >
        <EquipmentAutocomplete
          label={label}
          type={type}
          value={equipment?.name ?? ""}
          onChange={handleAutocomplete}
        />
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
            }}
          >
            Decay
          </label>
          <input
            type="number"
            value={decay}
            onChange={(e) => setDecay(e.target.value)}
            onBlur={handleManualChange}
            placeholder="0"
            step="0.001"
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "#1f2937",
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
              fontSize: "11px",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
            }}
          >
            Ammo
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
              backgroundColor: "#1f2937",
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

// ==================== Loadout Card ====================

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
  const costs = calculateLoadoutCosts(loadout);
  const effective = getEffectiveCostPerShot(loadout);

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        border: isActive ? "1px solid #22c55e" : "1px solid #374151",
        backgroundColor: isActive
          ? "rgba(34,197,94,0.2)"
          : "rgba(31,41,55,0.5)",
        cursor: "pointer",
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
              fontWeight: 500,
              color: "white",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {loadout.name}
          </h4>
          <p style={{ fontSize: "14px", color: "#9ca3af", marginTop: "2px" }}>
            {loadout.weapon?.name ?? "No weapon"}
            {loadout.amp && ` + ${loadout.amp.name}`}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "8px",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              padding: "6px",
              color: "#9ca3af",
              background: "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: "6px",
              color: "#9ca3af",
              background: "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div
        style={{
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid rgba(55,65,81,0.5)",
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
          <span style={{ color: "#6b7280" }}>Cost/Shot</span>
          <span style={{ fontFamily: "monospace", color: "#22d3ee" }}>
            {effective.toFixed(5)} PED
            {loadout.useManualCost && " (manual)"}
          </span>
        </div>
        {!loadout.useManualCost && (
          <div style={{ fontSize: "10px", color: "#4b5563", marginTop: "4px" }}>
            W:{costs.weaponCost.toFixed(4)} A:{costs.ampCost.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Loadout Editor Modal ====================

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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div
          className="sticky top-0 bg-gray-900 border-b border-gray-700 flex items-center justify-between"
          style={{ padding: "16px 20px" }}
        >
          <h3 className="text-lg font-semibold text-white">
            {loadout.id ? "Edit Loadout" : "New Loadout"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Name */}
          <div>
            <label
              className="block text-xs text-gray-400 uppercase tracking-wide"
              style={{ marginBottom: "8px" }}
            >
              Name
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              style={{ padding: "12px 14px" }}
              placeholder="Loadout name..."
            />
          </div>

          {/* Equipment Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "12px",
              }}
            >
              Equipment
            </div>
            <EquipmentRow
              label="Weapon"
              type="weapon"
              equipment={draft.weapon}
              onChange={(eq) => updateEquipment("weapon", eq)}
            />
            <EquipmentRow
              label="Amplifier"
              type="amp"
              equipment={draft.amp}
              onChange={(eq) => updateEquipment("amp", eq)}
            />
            <EquipmentRow
              label="Scope"
              type="scope"
              equipment={draft.scope}
              onChange={(eq) => updateEquipment("scope", eq)}
            />
            <EquipmentRow
              label="Sight"
              type="sight"
              equipment={draft.sight}
              onChange={(eq) => updateEquipment("sight", eq)}
            />
          </div>

          {/* Armor Section - DISABLED: Decay calculation needs work
          <div style={{ paddingTop: "20px", borderTop: "1px solid #374151" }}>
            <ArmorAutocomplete
              value={draft.armor}
              onChange={(armor) => setDraft((prev) => ({ ...prev, armor }))}
            />
          </div>
          */}

          {/* Armor Plates Section - DISABLED: Decay calculation needs work
          <div style={{ paddingTop: "20px", borderTop: "1px solid #374151" }}>
            <ArmorPlateAutocomplete
              plates={draft.armorPlates || []}
              onChange={(plates) =>
                setDraft((prev) => ({ ...prev, armorPlates: plates }))
              }
            />
          </div>
          */}

          {/* Enhancers Section */}
          <div style={{ paddingTop: "20px", borderTop: "1px solid #374151" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "16px",
              }}
            >
              Enhancers
            </div>

            {/* Weapon Enhancers */}
            <div
              style={{
                backgroundColor: "rgba(31,41,55,0.4)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#e5e7eb",
                  }}
                >
                  Weapon Enhancers
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#22d3ee",
                    fontFamily: "monospace",
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "12px",
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
                      flex: 1,
                      height: "28px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor:
                        i < (draft.weaponEnhancerSlots || 0)
                          ? "#16a34a"
                          : "#374151",
                      color:
                        i < (draft.weaponEnhancerSlots || 0)
                          ? "white"
                          : "#6b7280",
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
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "#6b7280" }}>
                  {draft.weaponEnhancerSlots || 0}/10 slots
                </span>
                <span style={{ color: "#4ade80" }}>
                  +{(draft.weaponEnhancerSlots || 0) * 10}% damage
                </span>
              </div>
            </div>

            {/* Armor Enhancers - DISABLED: Decay calculation needs work
            <div
              style={{
                backgroundColor: "rgba(31,41,55,0.4)",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#e5e7eb",
                  }}
                >
                  Armor Enhancers
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  No shot cost
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "12px",
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
                      flex: 1,
                      height: "28px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor:
                        i < (draft.armorEnhancerSlots || 0)
                          ? "#2563eb"
                          : "#374151",
                      color:
                        i < (draft.armorEnhancerSlots || 0)
                          ? "white"
                          : "#6b7280",
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
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "#6b7280" }}>
                  {draft.armorEnhancerSlots || 0}/10 slots
                </span>
                <span style={{ color: "#6b7280" }}>Decay on damage taken</span>
              </div>
            </div>
            */}
          </div>

          {/* Manual Override */}
          <div style={{ paddingTop: "20px", borderTop: "1px solid #374151" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                padding: "4px 0",
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
                style={{ width: "16px", height: "16px" }}
              />
              <span style={{ fontSize: "14px", color: "#d1d5db" }}>
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
                  padding: "10px 12px",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "white",
                  fontFamily: "monospace",
                }}
              />
            )}
          </div>

          {/* Cost Summary */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "rgba(31,41,55,0.5)",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <div
              style={{
                color: "#9ca3af",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "16px",
              }}
            >
              Cost Breakdown (PED/shot)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Weapon</span>
                <span style={{ fontFamily: "monospace", color: "#d1d5db" }}>
                  {costs.weaponCost.toFixed(4)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Amp</span>
                <span style={{ fontFamily: "monospace", color: "#d1d5db" }}>
                  {costs.ampCost.toFixed(4)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Scope</span>
                <span style={{ fontFamily: "monospace", color: "#d1d5db" }}>
                  {costs.scopeCost.toFixed(4)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Sight</span>
                <span style={{ fontFamily: "monospace", color: "#d1d5db" }}>
                  {costs.sightCost.toFixed(4)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gridColumn: "span 2",
                }}
              >
                <span style={{ color: "#6b7280" }}>Enhancers</span>
                <span style={{ fontFamily: "monospace", color: "#d1d5db" }}>
                  {costs.weaponEnhancerCost.toFixed(4)}
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "12px",
                marginTop: "12px",
                borderTop: "1px solid #374151",
                fontWeight: 500,
              }}
            >
              <span style={{ color: "white" }}>Total/Shot</span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: "#22d3ee",
                  fontSize: "16px",
                }}
              >
                {costs.totalPerShot.toFixed(4)} PED
              </span>
            </div>
          </div>

          {/* Damage & DPP Summary */}
          {draft.weapon && (
            <div
              style={{
                padding: "16px",
                backgroundColor: "rgba(31,41,55,0.5)",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "16px",
                }}
              >
                Damage & Efficiency
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px 24px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Min Damage</span>
                  <span style={{ fontFamily: "monospace", color: "#fb923c" }}>
                    {calculateEnhancedDamage(draft).min.toFixed(1)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Max Damage</span>
                  <span style={{ fontFamily: "monospace", color: "#fb923c" }}>
                    {calculateEnhancedDamage(draft).max.toFixed(1)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  marginTop: "12px",
                  borderTop: "1px solid #374151",
                  fontWeight: 500,
                }}
              >
                <span style={{ color: "white" }}>DPP (Dmg/PEC)</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "#4ade80",
                    fontSize: "16px",
                  }}
                >
                  {(calculateDPP(draft) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "#111827",
            borderTop: "1px solid #374151",
            padding: "20px 24px",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: "#1f2937",
              color: "#d1d5db",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.name.trim()}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: draft.name.trim() ? "#0891b2" : "#374151",
              color: draft.name.trim() ? "white" : "#6b7280",
              border: "none",
              borderRadius: "8px",
              cursor: draft.name.trim() ? "pointer" : "not-allowed",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
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
        backgroundColor: "#111827",
        color: "white",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid #374151" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Loadouts</h2>
          <button
            onClick={handleNew}
            style={{
              padding: "8px",
              backgroundColor: "#0891b2",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              color: "white",
            }}
            title="New Loadout"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Loadout List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {loadouts.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}
          >
            <p>No loadouts yet</p>
            <p style={{ fontSize: "14px", marginTop: "4px" }}>
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
