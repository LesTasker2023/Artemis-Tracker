/**
 * ARTEMIS v3 - DetailRow Component
 * Label-value row for detail sections
 */

import React from "react";
import { colors, spacing, typography } from "./tokens";

interface DetailRowProps {
  label: string;
  value: string | number;
  color?: string;
}

export function DetailRow({
  label,
  value,
  color = colors.textPrimary,
}: DetailRowProps) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.value, color }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing.xs}px 0`,
  },
  label: {
    fontSize: typography.detailLabel.fontSize,
    color: colors.textMuted,
  },
  value: {
    fontSize: typography.detailValue.fontSize,
    fontWeight: typography.detailValue.fontWeight,
    fontFamily: typography.mono,
  },
};
