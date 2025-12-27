/**
 * ARTEMIS v3 - Design Tokens
 * Centralized design system constants
 */

export const colors = {
  // Backgrounds
  bgBase: "hsl(220 13% 8%)",
  bgCard: "hsl(220 13% 12%)",
  bgPanel: "hsl(220 13% 10%)",
  bgHover: "hsl(220 13% 15%)",

  // Borders
  border: "hsl(220 13% 18%)",
  borderSubtle: "hsl(220 13% 15%)",

  // Text
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",

  // Semantic
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#06b6d4",
  purple: "#8b5cf6",

  // Icon watermark
  iconWatermark: "#f8fafc",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 48,
} as const;

export const typography = {
  // Font families
  mono: "'JetBrains Mono', monospace",
  sans: "system-ui, sans-serif",

  // Hero card styles
  heroLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  heroValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
  },
  heroUnit: {
    fontSize: 11,
  },

  // Panel styles
  panelTitle: {
    fontSize: 13,
    fontWeight: 600,
  },

  // Detail row styles
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 600,
  },

  // Empty state styles
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  emptySubtitle: {
    fontSize: 14,
  },
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const iconSizes = {
  sm: 14,
  md: 20,
  lg: 48,
  watermark: 80,
} as const;
