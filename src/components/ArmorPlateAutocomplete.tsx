/**
 * ArmorPlateAutocomplete - Autocomplete for armor plates
 * Allows selecting multiple plates with TT values for decay tracking
 */

import { useState, useEffect, useRef } from "react";
import { Shield, Plus, X } from "lucide-react";
import type { ArmorPlate } from "../core/loadout";

interface ArmorPlateRecord {
  Id: number;
  Name: string;
  Properties: {
    Weight: number | null;
    Economy: {
      MaxTT: number | null;
      Durability: number | null;
    };
  };
}

interface ArmorPlateAutocompleteProps {
  plates: ArmorPlate[];
  onChange: (plates: ArmorPlate[]) => void;
  maxPlates?: number;
}

export function ArmorPlateAutocomplete({
  plates,
  onChange,
  maxPlates = 7,
}: ArmorPlateAutocompleteProps) {
  const [armorPlates, setArmorPlates] = useState<ArmorPlateRecord[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load armor plates data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await window.electron?.equipment?.load("armor-plates");
        console.log("[ArmorPlates] Loaded data:", data?.length || 0, "items");
        if (Array.isArray(data)) {
          setArmorPlates(data as ArmorPlateRecord[]);
        }
      } catch (err) {
        console.error("Failed to load armor plates:", err);
      }
    };
    load();
  }, []);

  // Filter plates based on search - show all on empty search when focused
  const filtered = showDropdown
    ? (search.trim()
        ? armorPlates.filter((p) =>
            p.Name.toLowerCase().includes(search.toLowerCase())
          )
        : armorPlates
      ).slice(0, 15)
    : [];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[highlightIndex]) {
      e.preventDefault();
      addPlate(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const addPlate = (plateRecord: ArmorPlateRecord) => {
    if (plates.length >= maxPlates) return;

    const newPlate: ArmorPlate = {
      name: plateRecord.Name,
      maxTT: plateRecord.Properties.Economy.MaxTT || 0,
      durability: plateRecord.Properties.Economy.Durability || 1000,
    };

    onChange([...plates, newPlate]);
    setSearch("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removePlate = (index: number) => {
    const newPlates = plates.filter((_, i) => i !== index);
    onChange(newPlates);
  };

  // Calculate total decay
  const totalTT = plates.reduce((sum, p) => sum + (p.maxTT || 0), 0);
  const decayPerHit = totalTT / 1000; // ~1000 durability average

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.label}>
          <Shield size={14} style={{ color: "#60a5fa" }} />
          <span>Armor Plates</span>
        </div>
        <span style={styles.decay}>{decayPerHit.toFixed(4)} PED/hit</span>
      </div>

      {/* Selected plates */}
      {plates.length > 0 && (
        <div style={styles.plateList}>
          {plates.map((plate, i) => (
            <div key={i} style={styles.plateTag}>
              <span style={styles.plateName}>{plate.name}</span>
              <span style={styles.plateTT}>{plate.maxTT.toFixed(2)}</span>
              <button
                type="button"
                onClick={() => removePlate(i)}
                style={styles.removeBtn}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add plate input */}
      {plates.length < maxPlates && (
        <div style={styles.inputWrapper}>
          <Plus size={14} style={{ color: "#6b7280" }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
              setHighlightIndex(0);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add armor plate..."
            style={styles.input}
          />
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div ref={dropdownRef} style={styles.dropdown}>
          {filtered.map((plate, i) => (
            <div
              key={plate.Id}
              onClick={() => addPlate(plate)}
              style={{
                ...styles.dropdownItem,
                backgroundColor:
                  i === highlightIndex ? "rgba(59,130,246,0.2)" : "transparent",
              }}
            >
              <span style={styles.itemName}>{plate.Name}</span>
              <span style={styles.itemTT}>
                {(plate.Properties.Economy.MaxTT || 0).toFixed(2)} TT
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <span>
          {plates.length}/{maxPlates} plates
        </span>
        <span>Total TT: {totalTT.toFixed(2)} PED</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#e5e7eb",
  },
  decay: {
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#22d3ee",
  },
  plateList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "8px",
  },
  plateTag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    backgroundColor: "rgba(59,130,246,0.2)",
    borderRadius: "4px",
    fontSize: "12px",
  },
  plateName: {
    color: "#e5e7eb",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  plateTT: {
    color: "#60a5fa",
    fontFamily: "monospace",
  },
  removeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "rgba(17,24,39,0.6)",
    borderRadius: "6px",
    border: "1px solid #374151",
  },
  input: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#e5e7eb",
    fontSize: "14px",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "8px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 50,
  },
  dropdownItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    cursor: "pointer",
    borderBottom: "1px solid #374151",
  },
  itemName: {
    color: "#e5e7eb",
    fontSize: "13px",
  },
  itemTT: {
    color: "#60a5fa",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
    fontSize: "11px",
    color: "#6b7280",
  },
};
