/**
 * ARTEMIS v3 - Panel Component
 * Collapsible section panel
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { colors, spacing, typography, radius } from "./tokens";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  headerRight?: React.ReactNode;
}

export function Panel({
  title,
  children,
  defaultExpanded = true,
  collapsible = true,
  headerRight,
}: PanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={styles.panel}>
      <div
        style={{
          ...styles.header,
          cursor: collapsible ? "pointer" : "default",
        }}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div style={styles.headerLeft}>
          <span style={styles.title}>{title}</span>
          {headerRight}
        </div>
        {collapsible && (
          <div style={styles.chevron}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>
      {expanded && <div style={styles.content}>{children}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: colors.bgPanel,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.borderSubtle}`,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: typography.panelTitle.fontSize,
    fontWeight: typography.panelTitle.fontWeight,
    color: colors.textPrimary,
  },
  chevron: {
    color: colors.textMuted,
  },
  content: {
    padding: spacing.lg,
  },
};
