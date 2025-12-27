/**
 * ARTEMIS v3 - HeroCard Component
 * Stat card with background icon watermark
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { colors, spacing, typography, radius, iconSizes } from "./tokens";

export interface HeroCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  glow?: boolean;
  highlight?: boolean; // Adds colored border
}

export function HeroCard({
  icon: Icon,
  label,
  value,
  unit,
  color = colors.textPrimary,
  glow = false,
  highlight = false,
}: HeroCardProps) {
  return (
    <div
      style={{
        ...styles.card,
        borderColor: highlight ? color : colors.border,
        borderWidth: highlight ? 2 : 1,
        boxShadow: glow ? `0 0 30px ${color}40` : undefined,
      }}
    >
      <div style={styles.bgIcon}>
        <Icon size={iconSizes.watermark} />
      </div>
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color }}>{value}</div>
      {unit && <div style={styles.unit}>{unit}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
    minHeight: 100,
  },
  bgIcon: {
    position: "absolute",
    right: -10,
    bottom: -15,
    opacity: 0.07,
    color: colors.iconWatermark,
    pointerEvents: "none",
  },
  label: {
    fontSize: typography.heroLabel.fontSize,
    fontWeight: typography.heroLabel.fontWeight,
    letterSpacing: typography.heroLabel.letterSpacing,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: typography.heroValue.fontSize,
    fontWeight: typography.heroValue.fontWeight,
    lineHeight: typography.heroValue.lineHeight,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  unit: {
    fontSize: typography.heroUnit.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs + 2,
  },
};
