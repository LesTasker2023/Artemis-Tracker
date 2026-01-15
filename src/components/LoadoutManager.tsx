/**
 * LoadoutManager - Desktop-focused loadout editor
 * Complete redesign with visual impact and armor support
 */

import { useState, useEffect } from "react";
import {
  Loadout,
  Equipment,
  DamageProperties,
  createLoadout,
  calculateLoadoutCosts,
  getEffectiveCostPerShot,
  calculateEnhancedDamage,
  calculateEffectiveDamage,
  calculateDPP,
  getHitRate,
  getCritRate,
  getModifiedDecay,
  getModifiedWeaponDecay,
  getTotalAmmo,
  getEfficiency,
  calculateRange,
} from "../core/loadout";
import { useLoadouts } from "../hooks/useLoadouts";
import { useEquipmentDB } from "../hooks/useEquipmentDB";
import { EquipmentAutocomplete } from "./EquipmentAutocomplete";
import { EquipmentRecord } from "../core/equipment-db";

// ==================== Helper: Create Equipment from Record ====================

function createEquipmentFromRecord(record: EquipmentRecord): Equipment {
  const equipment: Equipment = {
    name: record.name,
    economy: {
      decay: record.decay,
      ammoBurn: record.ammoBurn,
      efficiency: record.efficiency,
    },
    range: record.range,
    maxTT: record.maxTT,
    minTT: record.minTT,
  };

  if (record.damage) {
    equipment.damage = record.damage as DamageProperties;
  }

  return equipment;
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
}

function EquipmentCard({
  label,
  type,
  equipment,
  onChange,
}: EquipmentCardProps) {
  const handleAutocomplete = (name: string, record?: EquipmentRecord) => {
    if (!name.trim()) {
      onChange(undefined);
      return;
    }

    if (record) {
      onChange(createEquipmentFromRecord(record));
    }
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

      {/* Decay and Ammo display (read-only) */}
      {equipment && (
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
            <div
              style={{
                width: "100%",
                padding: "8px 10px",
                backgroundColor: "hsl(220 13% 8%)",
                border: "1px solid hsl(220 13% 25%)",
                borderRadius: "6px",
                fontSize: "13px",
                color: "hsl(220 13% 65%)",
                fontFamily: "monospace",
                textAlign: "right",
              }}
            >
              {(equipment.economy.decay * 100).toFixed(2)}
            </div>
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
            <div
              style={{
                width: "100%",
                padding: "8px 10px",
                backgroundColor: "hsl(220 13% 8%)",
                border: "1px solid hsl(220 13% 25%)",
                borderRadius: "6px",
                fontSize: "13px",
                color: "hsl(220 13% 65%)",
                fontFamily: "monospace",
                textAlign: "right",
              }}
            >
              {equipment.economy.ammoBurn.toFixed(0)}
            </div>
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
  const { findByName, loaded: equipmentLoaded } = useEquipmentDB();

  // Enhance equipment data when editor opens (re-fetch from DB to get latest fields like minTT)
  useEffect(() => {
    if (!equipmentLoaded) return;

    setDraft((prev) => {
      let updated = { ...prev };

      // Enhance weapon data
      if (prev.weapon?.name) {
        const record = findByName(prev.weapon.name, "weapon");
        if (record) {
          updated.weapon = createEquipmentFromRecord(record);
        }
      }

      // Enhance amp data
      if (prev.amp?.name) {
        const record = findByName(prev.amp.name, "amp");
        if (record) {
          updated.amp = createEquipmentFromRecord(record);
        }
      }

      // Enhance scope data
      if (prev.scope?.name) {
        const record = findByName(prev.scope.name, "scope");
        if (record) {
          updated.scope = createEquipmentFromRecord(record);
        }
      }

      // Enhance sight data
      if (prev.sight?.name) {
        const record = findByName(prev.sight.name, "sight");
        if (record) {
          updated.sight = createEquipmentFromRecord(record);
        }
      }

      return updated;
    });
  }, [equipmentLoaded, findByName]);

  const updateEquipment = (key: keyof Loadout, eq: Equipment | undefined) => {
    setDraft((prev) => ({ ...prev, [key]: eq }));
  };

  const costs = calculateLoadoutCosts(draft);
  const damage = draft.weapon
    ? calculateEnhancedDamage(draft)
    : { min: 0, max: 0 };
  const dpp = draft.weapon ? calculateDPP(draft) : 0;

  // Calculate total uses (limiting factor between weapon and amp)
  const getTotalUses = () => {
    const weaponDecay = getModifiedWeaponDecay(draft);
    const ampDecay = draft.amp?.economy.decay ?? 0;

    if (weaponDecay <= 0 || !draft.weapon?.maxTT) return null;

    const weaponUses =
      ((draft.weapon.maxTT ?? 0) - (draft.weapon.minTT ?? 0)) / weaponDecay;

    if (draft.amp && ampDecay > 0 && draft.amp.maxTT) {
      const ampUses =
        ((draft.amp.maxTT ?? 0) - (draft.amp.minTT ?? 0)) / ampDecay;
      return Math.floor(Math.min(weaponUses, ampUses));
    }

    return Math.floor(weaponUses);
  };

  const totalEnhancers =
    (draft.damageEnhancers || 0) +
    (draft.accuracyEnhancers || 0) +
    (draft.rangeEnhancers || 0) +
    (draft.economyEnhancers || 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "hsl(220 13% 6%)",
          borderRadius: "16px",
          border: "1px solid hsl(220 13% 15%)",
          width: "100%",
          maxWidth: "1400px",
          maxHeight: "95vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid hsl(220 13% 12%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(180deg, hsl(220 13% 8%) 0%, hsl(220 13% 6%) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
              style={{
                padding: "10px 16px",
                backgroundColor: "hsl(220 13% 10%)",
                border: "1px solid hsl(220 13% 20%)",
                borderRadius: "8px",
                fontSize: "16px",
                color: "hsl(0 0% 95%)",
                fontWeight: 600,
                width: "280px",
              }}
              placeholder="Loadout name..."
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                border: "1px solid hsl(220 13% 25%)",
                borderRadius: "8px",
                color: "hsl(220 13% 65%)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
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

        {/* Main Content - Two Column Layout */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: "0",
          }}
        >
          {/* LEFT COLUMN - Configurables */}
          <div
            style={{
              padding: "24px",
              overflowY: "auto",
              borderRight: "1px solid hsl(220 13% 12%)",
            }}
          >
            {/* Equipment Section */}
            <section style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "hsl(220 13% 50%)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "16px",
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
            </section>

            {/* Enhancers Section */}
            <section style={{ marginBottom: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "hsl(220 13% 50%)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Weapon Enhancers
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    color:
                      totalEnhancers >= 10
                        ? "hsl(0 72% 60%)"
                        : "hsl(220 13% 50%)",
                    fontWeight: 600,
                    fontFamily: "monospace",
                  }}
                >
                  {totalEnhancers} / 10
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                }}
              >
                <EnhancerCard
                  label="Damage"
                  value={draft.damageEnhancers || 0}
                  color="hsl(0 72% 55%)"
                  effect={`+${(draft.damageEnhancers || 0) * 10}%`}
                  max={10 - totalEnhancers + (draft.damageEnhancers || 0)}
                  onChange={(val) =>
                    setDraft((prev) => ({ ...prev, damageEnhancers: val }))
                  }
                />
                <EnhancerCard
                  label="Accuracy"
                  value={draft.accuracyEnhancers || 0}
                  color="hsl(45 100% 55%)"
                  effect={`+${((draft.accuracyEnhancers || 0) * 0.2).toFixed(
                    1
                  )}%`}
                  max={10 - totalEnhancers + (draft.accuracyEnhancers || 0)}
                  onChange={(val) =>
                    setDraft((prev) => ({ ...prev, accuracyEnhancers: val }))
                  }
                />
                <EnhancerCard
                  label="Range"
                  value={draft.rangeEnhancers || 0}
                  color="hsl(200 80% 55%)"
                  effect={`+${(draft.rangeEnhancers || 0) * 5}%`}
                  max={10 - totalEnhancers + (draft.rangeEnhancers || 0)}
                  onChange={(val) =>
                    setDraft((prev) => ({ ...prev, rangeEnhancers: val }))
                  }
                />
                <EnhancerCard
                  label="Economy"
                  value={draft.economyEnhancers || 0}
                  color="hsl(142 71% 50%)"
                  effect={`-${(
                    (1 - Math.pow(0.989, draft.economyEnhancers || 0)) *
                    100
                  ).toFixed(1)}%`}
                  max={10 - totalEnhancers + (draft.economyEnhancers || 0)}
                  onChange={(val) =>
                    setDraft((prev) => ({ ...prev, economyEnhancers: val }))
                  }
                />
              </div>
            </section>

            {/* Player Skills Section */}
            <section>
              <h3
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "hsl(220 13% 50%)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "16px",
                }}
              >
                Player Skills
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "hsl(220 13% 9%)",
                    borderRadius: "10px",
                    border: "1px solid hsl(220 13% 15%)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "hsl(220 13% 50%)",
                      marginBottom: "8px",
                    }}
                  >
                    Hit Profession
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.hitProfession ?? 100}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        hitProfession: Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value) || 0)
                        ),
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "hsl(220 13% 12%)",
                      border: "1px solid hsl(220 13% 20%)",
                      borderRadius: "6px",
                      fontSize: "16px",
                      color: "hsl(0 0% 95%)",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  />
                  <span
                    style={{
                      display: "block",
                      fontSize: "10px",
                      color: "hsl(220 13% 40%)",
                      marginTop: "6px",
                    }}
                  >
                    Affects hit rate & crit rate
                  </span>
                </div>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "hsl(220 13% 9%)",
                    borderRadius: "10px",
                    border: "1px solid hsl(220 13% 15%)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "hsl(220 13% 50%)",
                      marginBottom: "8px",
                    }}
                  >
                    Damage Profession
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.damageProfession ?? 100}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        damageProfession: Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value) || 0)
                        ),
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "hsl(220 13% 12%)",
                      border: "1px solid hsl(220 13% 20%)",
                      borderRadius: "6px",
                      fontSize: "16px",
                      color: "hsl(0 0% 95%)",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  />
                  <span
                    style={{
                      display: "block",
                      fontSize: "10px",
                      color: "hsl(220 13% 40%)",
                      marginTop: "6px",
                    }}
                  >
                    Affects min damage
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN - Stats Panel */}
          <div
            style={{
              padding: "24px",
              backgroundColor: "hsl(220 13% 7%)",
              overflowY: "auto",
            }}
          >
            {/* Hero Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <HeroStat
                label="Cost/Shot"
                value={`${(costs.totalPerShot * 100).toFixed(2)}`}
                unit="PEC"
                color="hsl(217 91% 65%)"
              />
              <HeroStat
                label="DPP"
                value={(dpp / 100).toFixed(2)}
                unit=""
                color="hsl(142 71% 55%)"
              />
            </div>

            {/* Offense Stats */}
            <StatsCard title="Offense">
              <StatRow
                label="Total Damage"
                value={damage.max.toFixed(2)}
                highlight={
                  draft.weapon &&
                  damage.max !==
                    (draft.weapon.damage?.burn ?? 0) +
                      (draft.weapon.damage?.penetration ?? 0)
                }
              />
              <StatRow
                label="Range"
                value={`${calculateRange(draft).toFixed(1)}m`}
                highlight={
                  draft.weapon &&
                  calculateRange(draft) !== (draft.weapon.range ?? 0)
                }
              />
              <StatRow
                label="Critical Chance"
                value={`${(getCritRate(draft) * 100).toFixed(1)}%`}
                highlight={(draft.accuracyEnhancers ?? 0) > 0}
              />
              <StatRow
                label="Effective Damage"
                value={calculateEffectiveDamage(draft).toFixed(2)}
                highlight={
                  draft.weapon &&
                  damage.max !==
                    (draft.weapon.damage?.burn ?? 0) +
                      (draft.weapon.damage?.penetration ?? 0)
                }
              />
              <StatRow label="Uses/min" value="60" />
              <StatRow
                label="DPS"
                value={calculateEffectiveDamage(draft).toFixed(2)}
                accent
              />
            </StatsCard>

            {/* Economy Stats */}
            <StatsCard title="Economy">
              <StatRow
                label="Efficiency"
                value={`${(getEfficiency(draft) * 100).toFixed(1)}%`}
                highlight={
                  draft.weapon &&
                  getEfficiency(draft) !==
                    (draft.weapon.economy.efficiency ?? 0)
                }
              />
              <StatRow
                label="Decay"
                value={`${(getModifiedDecay(draft) * 100).toFixed(4)} PEC`}
                highlight={
                  draft.weapon &&
                  getModifiedDecay(draft) !==
                    draft.weapon.economy.decay + (draft.amp?.economy.decay ?? 0)
                }
              />
              <StatRow
                label="Ammo"
                value={Math.round(getTotalAmmo(draft)).toString()}
                highlight={
                  draft.weapon &&
                  Math.round(getTotalAmmo(draft)) !==
                    draft.weapon.economy.ammoBurn +
                      (draft.amp?.economy.ammoBurn ?? 0)
                }
              />
              <StatRow
                label="Total Uses"
                value={getTotalUses()?.toLocaleString() ?? "N/A"}
                highlight={
                  (draft.damageEnhancers ?? 0) > 0 ||
                  (draft.economyEnhancers ?? 0) > 0
                }
              />
            </StatsCard>

            {/* Cost Breakdown */}
            <StatsCard title="Cost Breakdown">
              <StatRow
                label="Weapon"
                value={`${(costs.weaponCost * 100).toFixed(2)} PEC`}
                subtle
              />
              <StatRow
                label="Amplifier"
                value={`${(costs.ampCost * 100).toFixed(2)} PEC`}
                subtle
              />
              <StatRow
                label="Scope"
                value={`${(costs.scopeCost * 100).toFixed(2)} PEC`}
                subtle
              />
              <StatRow
                label="Sight"
                value={`${(costs.sightCost * 100).toFixed(2)} PEC`}
                subtle
              />
              <StatRow
                label="Enhancers"
                value={`${(costs.weaponEnhancerCost * 100).toFixed(2)} PEC`}
                subtle
              />
              <div
                style={{
                  height: "1px",
                  backgroundColor: "hsl(220 13% 18%)",
                  margin: "8px 0",
                }}
              />
              <StatRow
                label="Hit Rate"
                value={`${(getHitRate(draft) * 100).toFixed(1)}%`}
                color="hsl(142 71% 60%)"
              />
              <StatRow
                label="Crit Rate"
                value={`${(getCritRate(draft) * 100).toFixed(1)}%`}
                color="hsl(45 100% 60%)"
              />
            </StatsCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== New UI Components ====================

function HeroStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "hsl(220 13% 9%)",
        borderRadius: "12px",
        border: "1px solid hsl(220 13% 15%)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "hsl(220 13% 50%)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: color,
          fontFamily: "monospace",
          lineHeight: 1,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: "14px",
              color: "hsl(220 13% 50%)",
              marginLeft: "4px",
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "hsl(220 13% 9%)",
        borderRadius: "10px",
        border: "1px solid hsl(220 13% 15%)",
        marginBottom: "16px",
      }}
    >
      <h4
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "hsl(220 13% 50%)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "14px",
        }}
      >
        {title}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
  accent,
  subtle,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
  subtle?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: subtle ? "hsl(220 13% 40%)" : "hsl(220 13% 60%)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: accent ? "15px" : "13px",
          fontWeight: accent ? 700 : 600,
          color: color
            ? color
            : highlight
            ? "hsl(33 100% 60%)"
            : accent
            ? "hsl(217 91% 65%)"
            : "hsl(0 0% 90%)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function EnhancerCard({
  label,
  value,
  color,
  effect,
  max,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  effect: string;
  max: number;
  onChange: (val: number) => void;
}) {
  return (
    <div
      style={{
        padding: "14px",
        backgroundColor: "hsl(220 13% 9%)",
        borderRadius: "10px",
        border: `1px solid ${value > 0 ? color : "hsl(220 13% 15%)"}`,
        opacity: value > 0 ? 1 : 0.7,
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: value > 0 ? color : "hsl(220 13% 50%)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: value > 0 ? color : "hsl(220 13% 40%)",
            fontFamily: "monospace",
          }}
        >
          {effect}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          style={{
            width: "28px",
            height: "28px",
            backgroundColor:
              value > 0 ? "hsl(220 13% 15%)" : "hsl(220 13% 10%)",
            border: "none",
            borderRadius: "6px",
            color: value > 0 ? "hsl(0 0% 90%)" : "hsl(220 13% 30%)",
            cursor: value > 0 ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          −
        </button>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "18px",
            fontWeight: 700,
            fontFamily: "monospace",
            color: value > 0 ? color : "hsl(220 13% 40%)",
          }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(10, value + 1))}
          disabled={max <= 0}
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: max > 0 ? "hsl(220 13% 15%)" : "hsl(220 13% 10%)",
            border: "none",
            borderRadius: "6px",
            color: max > 0 ? "hsl(0 0% 90%)" : "hsl(220 13% 30%)",
            cursor: max > 0 ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ==================== Main LoadoutManager Component ====================

export function LoadoutManager() {
  const { loadouts, activeLoadout, setActive, save, remove } = useLoadouts();
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
