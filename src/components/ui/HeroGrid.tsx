/**
 * ARTEMIS v3 - HeroGrid Component
 * 4-column responsive grid for HeroCards
 */

import React from "react";
import { spacing } from "./tokens";

interface HeroGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function HeroGrid({ children, columns = 4 }: HeroGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing.md,
      }}
    >
      {children}
    </div>
  );
}
