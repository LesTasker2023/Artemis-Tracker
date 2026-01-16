/**
 * ArmorPlateAutocomplete - Autocomplete for armor plates
 * Allows selecting a single plate with matching UI to other autocompletes
 */

import { useState, useEffect, useRef } from "react";
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
}: ArmorPlateAutocompleteProps) {
  const [armorPlates, setArmorPlates] = useState<ArmorPlateRecord[]>([]);
  const [query, setQuery] = useState(plates.length > 0 ? plates[0].name : "");
  const [results, setResults] = useState<ArmorPlateRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load armor plates data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await window.electron?.equipment?.load("armor-plates");
        if (Array.isArray(data)) {
          setArmorPlates(data as ArmorPlateRecord[]);
        }
      } catch (err) {
        console.error("Failed to load armor plates:", err);
      }
    };
    load();
  }, []);

  // Sync external value changes
  useEffect(() => {
    setQuery(plates.length > 0 ? plates[0].name : "");
  }, [plates]);

  // Search on query change
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const matches = armorPlates.filter((p) =>
      p.Name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(matches);
    setHighlighted(-1);
  }, [query, armorPlates]);

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

  const handleSelect = (plateRecord: ArmorPlateRecord) => {
    const newPlate: ArmorPlate = {
      name: plateRecord.Name,
      maxTT: plateRecord.Properties.Economy.MaxTT || 0,
      durability: plateRecord.Properties.Economy.Durability || 1000,
    };
    setQuery(plateRecord.Name);
    onChange([newPlate]);
    setIsOpen(false);
    setResults([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(val.length >= 2);

    if (!val.trim()) {
      onChange([]);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        placeholder="Search armor plates..."
        style={{
          width: "100%",
          padding: "10px 12px",
          backgroundColor: "hsl(220 13% 8%)",
          border: "1px solid hsl(220 13% 25%)",
          borderRadius: "6px",
          color: "hsl(0 0% 95%)",
          fontSize: "13px",
          outline: "none",
        }}
      />

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "hsl(220 13% 10%)",
            border: "1px solid hsl(220 13% 25%)",
            borderRadius: "6px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {results.slice(0, 10).map((plate, idx) => (
            <div
              key={plate.Id}
              onClick={() => handleSelect(plate)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                backgroundColor:
                  highlighted === idx ? "hsl(220 13% 15%)" : "transparent",
                borderBottom:
                  idx < results.length - 1
                    ? "1px solid hsl(220 13% 15%)"
                    : "none",
              }}
              onMouseEnter={() => setHighlighted(idx)}
              onMouseLeave={() => setHighlighted(-1)}
            >
              <div
                style={{
                  color: "hsl(0 0% 95%)",
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                {plate.Name}
              </div>
              <div style={{ fontSize: "11px", color: "hsl(220 13% 50%)" }}>
                {(plate.Properties.Economy.MaxTT || 0).toFixed(2)} PED •{" "}
                {plate.Properties.Economy.Durability || 1000} dur
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
