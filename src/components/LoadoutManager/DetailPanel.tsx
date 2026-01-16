/**
 * LoadoutManager - Detail Panel Component
 * Right panel showing loadout stats and editing - matching SessionManager/MarkupManager pattern
 */

import React from "react";
import {
  Pencil,
  Trash2,
  CheckCircle,
  Copy,
  X,
  Swords,
  Zap,
} from "lucide-react";
import type { Loadout, Equipment, DamageProperties } from "../../core/loadout";
import type { EquipmentRecord } from "../../core/equipment-db";
import {
  getEffectiveCostPerShot,
  calculateDPP,
  getTotalAmmo,
  calculateEnhancedDamage,
  calculateRange,
  getCritRate,
  getHitRate,
  getEfficiency,
  getModifiedDecay,
  getModifiedWeaponDecay,
  calculateEffectiveDamage,
  calculateLoadoutCosts,
} from "../../core/loadout";
import { EquipmentAutocomplete } from "../EquipmentAutocomplete";

interface DetailPanelProps {
  loadout: Loadout | null;
  isActive: boolean;
  isNewLoadout?: boolean;
  onSave: (loadout: Loadout) => void;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
  onDuplicate: (loadout: Loadout) => void;
  onClearNew?: () => void;
}

export function DetailPanel({
  loadout,
  isActive,
  isNewLoadout,
  onSave,
  onDelete,
  onSetActive,
  onDuplicate,
  onClearNew,
}: DetailPanelProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<Loadout | null>(null);
  const prevLoadoutIdRef = React.useRef<string | null>(null);

  // When loadout ID changes, sync draft and handle edit mode
  React.useEffect(() => {
    const isNewSelection = prevLoadoutIdRef.current !== loadout?.id;

    if (loadout) {
      // Always sync draft when loadout changes
      if (isNewSelection) {
        setDraft({ ...loadout });
        // Auto-enter edit mode for new loadouts
        setIsEditing(isNewLoadout ?? false);
      }
      prevLoadoutIdRef.current = loadout.id;
    } else {
      setDraft(null);
      setIsEditing(false);
      prevLoadoutIdRef.current = null;
    }
  }, [loadout?.id, isNewLoadout]);

  // Keep draft in sync with loadout data changes (but don't reset editing state)
  React.useEffect(() => {
    if (loadout && !isEditing) {
      setDraft({ ...loadout });
    }
  }, [loadout, isEditing]);

  if (!loadout || !draft) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Swords size={48} strokeWidth={1} />
          </div>
          <p style={styles.emptyText}>Select a loadout to view details</p>
        </div>
      </div>
    );
  }

  const costPerShot = getEffectiveCostPerShot(draft);
  const dpp = calculateDPP(draft);
  const costs = calculateLoadoutCosts(draft);
  const damage = draft.weapon
    ? calculateEnhancedDamage(draft)
    : { min: 0, max: 0 };

  // Calculate total uses (limiting factor between weapon and amp)
  const getTotalUses = (): number | null => {
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

  const handleSave = () => {
    if (draft) {
      onSave(draft);
      setIsEditing(false);
      onClearNew?.();
    }
  };

  const handleCancel = () => {
    setDraft({ ...loadout });
    setIsEditing(false);
    onClearNew?.();
  };

  const updateEquipment = (
    field: "weapon" | "amp" | "scope" | "sight",
    eq: Equipment | undefined
  ) => {
    setDraft((prev) => (prev ? { ...prev, [field]: eq } : null));
  };

  const updateEnhancer = (
    type: "damage" | "accuracy" | "range" | "economy",
    val: number
  ) => {
    const key = `${type}Enhancers` as keyof Loadout;
    setDraft((prev) => (prev ? { ...prev, [key]: val } : null));
  };

  const totalEnhancers =
    (draft.damageEnhancers ?? 0) +
    (draft.accuracyEnhancers ?? 0) +
    (draft.rangeEnhancers ?? 0) +
    (draft.economyEnhancers ?? 0);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          {isEditing ? (
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              style={styles.nameInput}
              placeholder="Loadout name..."
              autoFocus
            />
          ) : (
            <h2 style={styles.title}>{loadout.name || "Unnamed Loadout"}</h2>
          )}
        </div>

        {/* Action Buttons - 2x2 Grid */}
        <div style={styles.actionGrid}>
          {isEditing ? (
            <>
              <ActionButton
                icon={<X size={14} />}
                label="Cancel"
                onClick={handleCancel}
              />
              <ActionButton
                icon={<CheckCircle size={14} />}
                label="Save"
                onClick={handleSave}
                primary
              />
            </>
          ) : (
            <>
              <ActionButton
                icon={<Pencil size={14} />}
                label="Edit"
                onClick={() => setIsEditing(true)}
              />
              <ActionButton
                icon={<Copy size={14} />}
                label="Duplicate"
                onClick={() => onDuplicate(loadout)}
              />
              {isActive ? (
                <ActionButton
                  icon={<Trash2 size={14} />}
                  label="Delete"
                  onClick={() => onDelete(loadout.id)}
                  danger
                />
              ) : (
                <>
                  <ActionButton
                    icon={<Zap size={14} />}
                    label="Set Active"
                    onClick={() => onSetActive(loadout.id)}
                    primary
                  />
                  <ActionButton
                    icon={<Trash2 size={14} />}
                    label="Delete"
                    onClick={() => onDelete(loadout.id)}
                    danger
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={styles.content}>
        {/* Hero Stats */}
        <div style={styles.heroStats}>
          <HeroStat
            label="Cost/Shot"
            value={`${(costPerShot * 100).toFixed(3)}`}
            unit="PEC"
            color="#60a5fa"
          />
          <HeroStat
            label="DPP"
            value={(dpp / 100).toFixed(3)}
            unit=""
            color="#22c55e"
          />
        </div>

        {/* Equipment Section (edit mode only) */}
        {isEditing && (
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>⚔️ Equipment</h3>
            <div style={styles.equipmentGrid}>
              <EquipmentField
                label="Weapon"
                type="weapon"
                value={draft.weapon}
                onChange={(eq) => updateEquipment("weapon", eq)}
              />
              <EquipmentField
                label="Amplifier"
                type="amp"
                value={draft.amp}
                onChange={(eq) => updateEquipment("amp", eq)}
              />
              <EquipmentField
                label="Scope"
                type="scope"
                value={draft.scope}
                onChange={(eq) => updateEquipment("scope", eq)}
              />
              <EquipmentField
                label="Sight"
                type="sight"
                value={draft.sight}
                onChange={(eq) => updateEquipment("sight", eq)}
              />
            </div>

            {/* Enhancers */}
            <div style={styles.enhancersSection}>
              <span style={styles.enhancerLabel}>
                Enhancers ({totalEnhancers}/10)
              </span>
              <div style={styles.enhancerGrid}>
                <EnhancerControl
                  label="DMG"
                  value={draft.damageEnhancers ?? 0}
                  color="hsl(0 72% 55%)"
                  totalUsed={totalEnhancers}
                  onChange={(val) => updateEnhancer("damage", val)}
                />
                <EnhancerControl
                  label="ACC"
                  value={draft.accuracyEnhancers ?? 0}
                  color="hsl(45 100% 55%)"
                  totalUsed={totalEnhancers}
                  onChange={(val) => updateEnhancer("accuracy", val)}
                />
                <EnhancerControl
                  label="RNG"
                  value={draft.rangeEnhancers ?? 0}
                  color="hsl(200 80% 55%)"
                  totalUsed={totalEnhancers}
                  onChange={(val) => updateEnhancer("range", val)}
                />
                <EnhancerControl
                  label="ECO"
                  value={draft.economyEnhancers ?? 0}
                  color="hsl(142 71% 50%)"
                  totalUsed={totalEnhancers}
                  onChange={(val) => updateEnhancer("economy", val)}
                />
              </div>
            </div>

            {/* Player Skills */}
            <div style={styles.skillsRow}>
              <div style={styles.skillInput}>
                <label style={styles.skillLabel}>Hit Profession</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.hitProfession ?? 100}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            hitProfession: Math.min(
                              100,
                              Math.max(0, parseInt(e.target.value) || 0)
                            ),
                          }
                        : null
                    )
                  }
                  style={styles.numberInput}
                />
              </div>
              <div style={styles.skillInput}>
                <label style={styles.skillLabel}>Dmg Profession</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.damageProfession ?? 100}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            damageProfession: Math.min(
                              100,
                              Math.max(0, parseInt(e.target.value) || 0)
                            ),
                          }
                        : null
                    )
                  }
                  style={styles.numberInput}
                />
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section style={styles.section}>
          <StatsCard title="Offense">
            <StatRow label="Total Damage" value={damage.max.toFixed(2)} />
            <StatRow
              label="Range"
              value={`${calculateRange(draft).toFixed(1)}m`}
            />
            <StatRow
              label="Critical Chance"
              value={`${(getCritRate(draft) * 100).toFixed(1)}%`}
            />
            <StatRow
              label="Hit Rate"
              value={`${(getHitRate(draft) * 100).toFixed(1)}%`}
            />
            <StatRow
              label="Effective Damage"
              value={calculateEffectiveDamage(draft).toFixed(2)}
              accent
            />
          </StatsCard>

          <StatsCard title="Economy">
            <StatRow
              label="Efficiency"
              value={`${(getEfficiency(draft) * 100).toFixed(1)}%`}
            />
            <StatRow
              label="Decay"
              value={`${(getModifiedDecay(draft) * 100).toFixed(4)} PEC`}
            />
            <StatRow
              label="Ammo Burn"
              value={Math.round(getTotalAmmo(draft)).toString()}
            />
            <StatRow
              label="Total Uses"
              value={getTotalUses()?.toLocaleString() ?? "N/A"}
            />
          </StatsCard>

          <StatsCard title="Cost Breakdown">
            <StatRow
              label="Weapon"
              value={`${(costs.weaponCost * 100).toFixed(4)} PEC`}
              subtle
            />
            <StatRow
              label="Amplifier"
              value={`${(costs.ampCost * 100).toFixed(4)} PEC`}
              subtle
            />
            <StatRow
              label="Scope"
              value={`${(costs.scopeCost * 100).toFixed(4)} PEC`}
              subtle
            />
            <StatRow
              label="Sight"
              value={`${(costs.sightCost * 100).toFixed(4)} PEC`}
              subtle
            />
            <StatRow
              label="Enhancers"
              value={`${(costs.weaponEnhancerCost * 100).toFixed(4)} PEC`}
              subtle
            />
            <div style={styles.divider} />
            <StatRow
              label="Total/Shot"
              value={`${(costPerShot * 100).toFixed(4)} PEC`}
              accent
            />
          </StatsCard>
        </section>
      </div>
    </div>
  );
}

// Helper Components

function ActionButton({
  icon,
  label,
  onClick,
  primary,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseColor = danger
    ? "hsl(0 72% 50%)"
    : primary
    ? "hsl(217 91% 60%)"
    : "hsl(220 13% 50%)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 12px",
        fontSize: "12px",
        fontWeight: 600,
        color: baseColor,
        backgroundColor: isHovered ? `${baseColor}15` : "transparent",
        border: `1px solid ${baseColor}`,
        borderRadius: "6px",
        cursor: "pointer",
        outline: "none",
        transition: "all 0.15s ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

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
    <div style={styles.heroStat}>
      <span style={styles.heroLabel}>{label}</span>
      <span style={{ ...styles.heroValue, color }}>
        {value}
        {unit && <span style={styles.heroUnit}>{unit}</span>}
      </span>
    </div>
  );
}

// Helper: Create Equipment from EquipmentRecord
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

function EquipmentField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: "weapon" | "amp" | "scope" | "sight";
  value: Equipment | undefined;
  onChange: (eq: Equipment | undefined) => void;
}) {
  return (
    <div style={styles.equipmentField}>
      <span style={styles.fieldLabel}>{label}</span>
      <EquipmentAutocomplete
        label=""
        type={type}
        value={value?.name ?? ""}
        onChange={(_name, record) => {
          if (record) {
            onChange(createEquipmentFromRecord(record));
          } else {
            onChange(undefined);
          }
        }}
      />
    </div>
  );
}

function EnhancerControl({
  label,
  value,
  color,
  totalUsed,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  totalUsed: number;
  onChange: (val: number) => void;
}) {
  const canAdd = totalUsed < 10;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 6px",
        backgroundColor: value > 0 ? `${color}15` : "hsl(220 13% 10%)",
        border: `1px solid ${value > 0 ? color : "hsl(220 13% 20%)"}`,
        borderRadius: "4px",
      }}
    >
      <span
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: value > 0 ? color : "hsl(220 13% 45%)",
          minWidth: "22px",
        }}
      >
        {label}
      </span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        style={{
          width: "18px",
          height: "18px",
          backgroundColor: "transparent",
          border: "none",
          color: value > 0 ? "hsl(0 0% 80%)" : "hsl(220 13% 30%)",
          cursor: value > 0 ? "pointer" : "not-allowed",
          fontSize: "14px",
          fontWeight: 600,
          padding: 0,
        }}
      >
        −
      </button>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: "monospace",
          color: value > 0 ? color : "hsl(220 13% 40%)",
          minWidth: "12px",
          textAlign: "center",
        }}
      >
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={!canAdd}
        style={{
          width: "18px",
          height: "18px",
          backgroundColor: "transparent",
          border: "none",
          color: canAdd ? "hsl(0 0% 80%)" : "hsl(220 13% 30%)",
          cursor: canAdd ? "pointer" : "not-allowed",
          fontSize: "14px",
          fontWeight: 600,
          padding: 0,
        }}
      >
        +
      </button>
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
    <div style={styles.statsCard}>
      <h4 style={styles.statsCardTitle}>{title}</h4>
      <div style={styles.statsCardContent}>{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent,
  subtle,
}: {
  label: string;
  value: string;
  accent?: boolean;
  subtle?: boolean;
}) {
  return (
    <div style={styles.statRow}>
      <span
        style={{
          ...styles.statLabel,
          ...(subtle ? { color: "hsl(220 13% 40%)" } : {}),
        }}
      >
        {label}
      </span>
      <span
        style={{
          ...styles.statValue,
          ...(accent ? { color: "hsl(217 91% 65%)", fontWeight: 700 } : {}),
          ...(subtle ? { color: "hsl(220 13% 55%)" } : {}),
        }}
      >
        {value}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "360px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "hsl(220 13% 8%)",
    borderLeft: "1px solid hsl(220 13% 16%)",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "40px 20px",
    color: "hsl(220 13% 35%)",
  },
  emptyIcon: {
    opacity: 0.4,
  },
  emptyText: {
    fontSize: "14px",
    color: "hsl(220 13% 45%)",
  },
  header: {
    padding: "16px",
    borderBottom: "1px solid hsl(220 13% 14%)",
    flexShrink: 0,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 700,
    color: "hsl(0 0% 95%)",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  nameInput: {
    flex: 1,
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(217 91% 60%)",
    borderRadius: "6px",
    outline: "none",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "20px",
  },
  heroStat: {
    padding: "14px",
    backgroundColor: "hsl(220 13% 10%)",
    borderRadius: "10px",
    border: "1px solid hsl(220 13% 15%)",
    textAlign: "center",
  },
  heroLabel: {
    display: "block",
    fontSize: "10px",
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "6px",
  },
  heroValue: {
    fontSize: "22px",
    fontWeight: 700,
    fontFamily: "monospace",
    lineHeight: 1,
  },
  heroUnit: {
    fontSize: "12px",
    color: "hsl(220 13% 50%)",
    marginLeft: "4px",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 700,
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "12px",
  },
  equipmentGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  equipmentField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fieldLabel: {
    fontSize: "10px",
    fontWeight: 600,
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
  },
  enhancersSection: {
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid hsl(220 13% 15%)",
  },
  enhancerLabel: {
    display: "block",
    fontSize: "10px",
    color: "hsl(220 13% 45%)",
    marginBottom: "8px",
  },
  enhancerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
  },
  skillsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px",
  },
  skillInput: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  skillLabel: {
    fontSize: "10px",
    color: "hsl(220 13% 50%)",
  },
  numberInput: {
    width: "100%",
    padding: "8px 10px",
    backgroundColor: "hsl(220 13% 12%)",
    border: "1px solid hsl(220 13% 20%)",
    borderRadius: "6px",
    fontSize: "14px",
    color: "hsl(0 0% 95%)",
    fontFamily: "monospace",
    fontWeight: 600,
    outline: "none",
  },
  statsCard: {
    padding: "12px",
    backgroundColor: "hsl(220 13% 9%)",
    borderRadius: "8px",
    border: "1px solid hsl(220 13% 14%)",
    marginBottom: "12px",
  },
  statsCardTitle: {
    fontSize: "10px",
    fontWeight: 700,
    color: "hsl(220 13% 50%)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "10px",
  },
  statsCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "11px",
    color: "hsl(220 13% 60%)",
  },
  statValue: {
    fontFamily: "monospace",
    fontSize: "12px",
    fontWeight: 600,
    color: "hsl(0 0% 90%)",
  },
  divider: {
    height: "1px",
    backgroundColor: "hsl(220 13% 18%)",
    margin: "6px 0",
  },
};
