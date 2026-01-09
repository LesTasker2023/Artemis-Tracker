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
import { createPortal } from "react-dom";
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
    <div>
      <div className={styles.equipmentRow}>
        <div className={styles.autocompleteWrap}>
          <EquipmentAutocomplete
            label={label}
            type={type}
            value={equipment?.name ?? ""}
            onChange={handleAutocomplete}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Decay</label>
          <input
            className={styles.smallInput}
            type="number"
            value={decay}
            onChange={(e) => setDecay(e.target.value)}
            onBlur={handleManualChange}
            placeholder="0"
            step="0.001"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Ammo</label>
          <input
            className={styles.smallInput}
            type="number"
            value={ammoBurn}
            onChange={(e) => setAmmoBurn(e.target.value)}
            onBlur={handleManualChange}
            placeholder="0"
            step="1"
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
    <div className={`${styles.loadoutCard} ${isActive ? styles.loadoutActive : ""}`} data-is-active={isActive ? "1" : "0"} onClick={onSelect}>
      <div className={styles.loadoutCardHeader}>
        <div>
          <div className={styles.cardTitle}>{loadout.name}</div>
          <div className={styles.cardSubtitle}>{loadout.weapon?.name ?? "No weapon"}{loadout.amp && ` + ${loadout.amp.name}`}</div>
        </div>
        <div className={styles.cardActions}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit"><Edit2 size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className={styles.loadoutCostRow}>
        <div>Cost/Shot</div>
        <div>{effective.toFixed(5)} PED{loadout.useManualCost && " (manual)"}</div>
      </div>
      {!loadout.useManualCost && (
        <div className={styles.loadoutCostRow}>W: {costs.weaponCost.toFixed(4)} A: {costs.ampCost.toFixed(4)}</div>
      )}
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

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h3 className={styles.title}>{loadout.id ? "Edit Loadout" : "New Loadout"}</h3>
            <button onClick={onCancel} className={styles.closeButton}><X size={20} /></button>
          </header>

        <main className={styles.main}>
          {/* Name */}
          <div>
            <label className={styles.label}>Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Loadout name..."
              className={styles.input}
            />
          </div>

          {/* Equipment Section */}
          <section>
            <div className={styles.sectionHeader}>Equipment</div>
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
          </section>

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
          <div>
            <div>Enhancers</div>

            {/* Weapon Enhancers */}
            <div>
              <div>
                <span>Weapon Enhancers</span>
                <span>{calculateWeaponEnhancerCost(draft.weaponEnhancerSlots || 0).toFixed(4)} PED/shot</span>
              </div>

              {/* Slot Selector */}
              <div className={styles.slotContainer}>
                {[...Array(10)].map((_, i) => {
                  const selected = i < (draft.weaponEnhancerSlots || 0);
                  return (
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
                      className={`${styles.slotButton} ${selected ? styles.slotSelected : styles.slotUnselected}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div className={styles.enhancerSummary}>
                <span>{draft.weaponEnhancerSlots || 0}/10 slots</span>
                <span>+{(draft.weaponEnhancerSlots || 0) * 10}% damage</span>
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
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input className={styles.checkboxInput} type="checkbox" checked={draft.useManualCost} onChange={(e) => setDraft((prev) => ({ ...prev, useManualCost: e.target.checked }))} />
              <span className={styles.fieldLabel}>Use manual cost override</span>
            </label>
            {draft.useManualCost && (
              <input
                className={styles.smallInput}
                type="number"
                value={draft.manualCostPerShot ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, manualCostPerShot: parseFloat(e.target.value) || undefined }))}
                step="0.00001"
                placeholder="0.00000"
              />
            )}
          </div>

          {/* Cost Summary */}
          <div>
            <div className={styles.detailsBlock}>
            <div className={styles.sectionHeader}>Cost Breakdown (PED/shot)</div>
            <div className={styles.costGrid}>
              <div><span>Weapon</span><span>{costs.weaponCost.toFixed(4)}</span></div>
              <div><span>Amp</span><span>{costs.ampCost.toFixed(4)}</span></div>
              <div><span>Scope</span><span>{costs.scopeCost.toFixed(4)}</span></div>
              <div><span>Sight</span><span>{costs.sightCost.toFixed(4)}</span></div>
              <div><span>Enhancers</span><span>{costs.weaponEnhancerCost.toFixed(4)}</span></div>
            </div>
            <div className={styles.detailRow}><span>Total/Shot</span><span>{costs.totalPerShot.toFixed(4)} PED</span></div>
          </div>
          </div>

          {/* Damage & DPP Summary */}
          {draft.weapon && (
            <div className={styles.detailsBlock}>
              <div className={styles.sectionHeader}>Damage & Efficiency</div>
              <div className={styles.detailRow}><span>Min Damage</span><span>{calculateEnhancedDamage(draft).min.toFixed(1)}</span></div>
              <div className={styles.detailRow}><span>Max Damage</span><span>{calculateEnhancedDamage(draft).max.toFixed(1)}</span></div>
              <div className={styles.detailRow}><span>DPP (Dmg/PEC)</span><span>{(calculateDPP(draft) / 100).toFixed(2)}</span></div>
            </div>
          )}
        </main>

        {/* Actions */}
        <footer className={styles.footer}>
          <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.name.trim()}
            className={`${styles.saveButton} ${draft.name.trim() ? styles.saveEnabled : styles.saveDisabled}`}
          >
            <Save size={16} /> Save
          </button>
        </footer>
        </div>
      </div>
    </div>, document.body
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
    <div>
      {/* Header */}
      <div className={styles.listSection}>
        <header className={styles.listHeader}>
          <h2 className={styles.listTitle}>Loadouts</h2>
          <button onClick={handleNew} title="New Loadout" className={styles.newButton}><Plus size={18} /></button>
        </header>
      </div>

      {/* Loadout List */}
      <div className={styles.listContainer}>
        {loadouts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>No loadouts yet</div>
            <div className={styles.emptySub}>Create one to track cost per shot</div>
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
