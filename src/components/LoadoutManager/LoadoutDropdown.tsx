/**
 * LoadoutDropdown - Compact loadout selector dropdown
 * Used in the header/sidebar to quickly switch active loadout
 */

import React from "react";
import type { Loadout } from "../../core/loadout";

interface LoadoutDropdownProps {
  loadouts: Loadout[];
  activeLoadout: Loadout | null;
  onSelect: (id: string | null) => void;
  compact?: boolean;
}

export function LoadoutDropdown({
  loadouts,
  activeLoadout,
  onSelect,
  compact = false,
}: LoadoutDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

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
            {/* None option */}
            <DropdownItem
              isSelected={!activeLoadout}
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              None
            </DropdownItem>

            {/* Divider if there are loadouts */}
            {loadouts.length > 0 && (
              <div
                style={{
                  borderBottom: "1px solid hsl(220 13% 18%)",
                }}
              />
            )}

            {/* Loadout options */}
            {loadouts.map((loadout) => (
              <DropdownItem
                key={loadout.id}
                isSelected={activeLoadout?.id === loadout.id}
                onClick={() => {
                  onSelect(loadout.id);
                  setIsOpen(false);
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
              </DropdownItem>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for dropdown items
function DropdownItem({
  isSelected,
  onClick,
  children,
}: {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: "10px 14px",
        cursor: "pointer",
        fontSize: "13px",
        color: isSelected ? "hsl(217 91% 68%)" : "hsl(0 0% 95%)",
        backgroundColor: isSelected
          ? "hsl(217 91% 68% / 0.1)"
          : isHovered
          ? "hsl(220 13% 18%)"
          : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background-color 0.1s ease",
      }}
    >
      {children}
    </div>
  );
}
