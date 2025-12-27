/**
 * ARTEMIS v3 - EmptyState Component
 * Placeholder for tabs with no data
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { colors, spacing, typography } from "./tokens";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div style={styles.container}>
      <Icon size={48} style={styles.icon} />
      <h3 style={styles.title}>{title}</h3>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: spacing.xxl,
    textAlign: "center",
  },
  icon: {
    opacity: 0.3,
    marginBottom: spacing.lg,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.emptyTitle.fontSize,
    fontWeight: typography.emptyTitle.fontWeight,
    color: colors.textSecondary,
    margin: 0,
  },
  subtitle: {
    fontSize: typography.emptySubtitle.fontSize,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
};
