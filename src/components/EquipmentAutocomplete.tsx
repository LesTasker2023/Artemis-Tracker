import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { useEquipmentDB } from "../hooks/useEquipmentDB";
import { EquipmentRecord } from "../core/equipment-db";

interface EquipmentAutocompleteProps {
  label: string;
  type: "weapon" | "amp" | "scope" | "sight";
  value: string;
  onChange: (name: string, record?: EquipmentRecord) => void;
  placeholder?: string;
}

/**
 * Autocomplete input for equipment selection
 * Searches equipment database and auto-fills decay/ammo values
 */
export function EquipmentAutocomplete({
  label,
  type,
  value,
  onChange,
  placeholder,
}: EquipmentAutocompleteProps) {
  const { loaded, search, findByName } = useEquipmentDB();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<EquipmentRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Search on query change
  useEffect(() => {
    if (!loaded || query.length < 2) {
      setResults([]);
      return;
    }
    const matches = search(query, type);
    setResults(matches);
    setHighlighted(-1);
  }, [query, type, loaded, search]);

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

  const handleSelect = (record: EquipmentRecord) => {
    setQuery(record.name);
    onChange(record.name, record);
    setIsOpen(false);
    setResults([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(val.length >= 2);

    // If they clear the input, clear the equipment
    if (!val.trim()) {
      onChange("", undefined);
    }
  };

  const handleBlur = () => {
    // On blur, try to match what they typed
    setTimeout(() => {
      if (query && query !== value) {
        const match = findByName(query, type);
        if (match) {
          onChange(match.name, match);
        } else {
          // Keep the text but no equipment match
          onChange(query, undefined);
        }
      }
    }, 200);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && results[highlighted]) {
          handleSelect(results[highlighted]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

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
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Search
          size={14}
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
          placeholder={placeholder || `Search ${type}s...`}
          autoComplete="off"
          style={{
            width: "100%",
            paddingLeft: "36px",
            paddingRight: "12px",
            paddingTop: "10px",
            paddingBottom: "10px",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: "14px",
            color: "white",
          }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            zIndex: 50,
            width: "100%",
            marginTop: "4px",
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {results.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                width: "100%",
                padding: "10px 12px",
                textAlign: "left",
                fontSize: "14px",
                backgroundColor:
                  idx === highlighted ? "rgba(6,182,212,0.2)" : "transparent",
                border: "none",
                cursor: "pointer",
                color: "white",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1f2937")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  idx === highlighted ? "rgba(6,182,212,0.2)" : "transparent")
              }
            >
              <div
                style={{
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </div>
              <div
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}
              >
                Decay: {item.decay.toFixed(3)} | Ammo: {item.ammoBurn}
                {item.category && ` | ${item.category}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {!loaded && (
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
          Loading equipment data...
        </div>
      )}
    </div>
  );
}
