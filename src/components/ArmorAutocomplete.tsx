import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Shield } from "lucide-react";
import { ArmorSet } from "../core/loadout";

interface ArmorRecord {
  id: number;
  name: string;
  maxTT: number;
  durability: number;
  isLimited: boolean;
}

interface ArmorAutocompleteProps {
  value?: ArmorSet;
  onChange: (armor: ArmorSet | undefined) => void;
}

/**
 * Autocomplete input for armor set selection
 * Loads armor data from JSON and auto-fills maxTT/durability
 */
export function ArmorAutocomplete({ value, onChange }: ArmorAutocompleteProps) {
  const [armorData, setArmorData] = useState<ArmorRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<ArmorRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load armor data
  useEffect(() => {
    const loadArmor = async () => {
      try {
        const data = await window.electron?.equipment?.load("armor-sets");
        if (Array.isArray(data)) {
          setArmorData(data as ArmorRecord[]);
          setLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load armor data:", err);
      }
    };
    loadArmor();
  }, []);

  // Sync external value changes
  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value?.name]);

  // Search on query change
  useEffect(() => {
    if (!loaded || query.length < 2) {
      setResults([]);
      return;
    }
    const lower = query.toLowerCase();
    const matches = armorData
      .filter((a) => a.name.toLowerCase().includes(lower))
      .slice(0, 10);
    setResults(matches);
    setHighlighted(-1);
  }, [query, loaded, armorData]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (record: ArmorRecord) => {
    setQuery(record.name);
    onChange({
      name: record.name,
      maxTT: record.maxTT,
      durability: record.durability,
      isLimited: record.isLimited,
    });
    setIsOpen(false);
    setResults([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(val.length >= 2);

    // If they clear the input, clear the armor
    if (!val.trim()) {
      onChange(undefined);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on dropdown
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        // If query doesn't match current armor, it's a manual entry
        if (query && query !== value?.name) {
          onChange({
            name: query,
            maxTT: value?.maxTT ?? 0,
            durability: value?.durability ?? 0,
            isLimited: value?.isLimited ?? query.includes("(L)"),
          });
        }
      }
    }, 150);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && results[highlighted]) {
          handleSelect(results[highlighted]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const decayPerHit =
    value && value.durability > 0
      ? ((value.maxTT / value.durability) * 100).toFixed(2)
      : null;

  return (
    <div style={{ position: "relative" }}>
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
        Armor Set
      </label>
      <div style={{ position: "relative" }}>
        <Shield
          size={16}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6b7280",
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search armor..."
          style={{
            width: "100%",
            padding: "10px 12px 10px 38px",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: "14px",
            color: "white",
          }}
        />
        {!loaded && (
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "11px",
              color: "#6b7280",
            }}
          >
            Loading...
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            maxHeight: "240px",
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {results.map((record, i) => (
            <div
              key={record.id}
              onClick={() => handleSelect(record)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                backgroundColor: i === highlighted ? "#374151" : "transparent",
                borderBottom:
                  i < results.length - 1 ? "1px solid #374151" : "none",
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "white", fontSize: "14px" }}>
                  {record.name}
                </span>
                {record.isLimited && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#f59e0b",
                      padding: "2px 6px",
                      backgroundColor: "rgba(245,158,11,0.2)",
                      borderRadius: "4px",
                    }}
                  >
                    LIMITED
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                <span>TT: {record.maxTT.toFixed(2)} PED</span>
                <span>Dur: {record.durability}</span>
                <span style={{ color: "#4ade80" }}>
                  {((record.maxTT / record.durability) * 100).toFixed(2)}{" "}
                  PEC/hit
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info row */}
      {value && value.name && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "8px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {value.isLimited && (
              <span style={{ color: "#f59e0b" }}>Limited (L)</span>
            )}
            {!value.isLimited && value.maxTT > 0 && (
              <span style={{ color: "#6b7280" }}>
                TT: {value.maxTT.toFixed(2)} | Dur: {value.durability}
              </span>
            )}
          </div>
          {decayPerHit && (
            <span style={{ color: value.isLimited ? "#f59e0b" : "#4ade80" }}>
              {decayPerHit} PEC/hit
            </span>
          )}
        </div>
      )}
    </div>
  );
}
