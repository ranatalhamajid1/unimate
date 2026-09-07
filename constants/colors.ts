/**
 * UniMate Mobile Semantic Color Tokens.
 * Matches web globals.css and Phase 15 design principles.
 */

export const LightColors = {
  background: "#FCFCFB",
  surface: "#FFFFFF",
  surfaceSecondary: "#F8F8F7",
  surfaceTertiary: "#F1F5F9",
  surfaceHover: "#F1F5F9",
  border: "#E5E7EB",
  borderSubtle: "#F1F5F9",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#94A3B8",
  accent: "#2563EB",
  accentHover: "#1D4ED8",
  accentSubtle: "#EFF6FF",
  primary: "#2563EB",
  destructive: "#DC2626",
  destructiveSubtle: "#FEF2F2",
  danger: "#DC2626",
  success: "#16A34A",
  successSubtle: "#F0FDF4",
  warning: "#D97706",
  warningSubtle: "#FFFBEB",
  cardShadow: "rgba(15, 23, 42, 0.05)",
};

export const DarkColors = {
  background: "#0E1117",
  surface: "#161B22",
  surfaceSecondary: "#1C2333",
  surfaceTertiary: "#21262D",
  surfaceHover: "#21262D",
  border: "#30363D",
  borderSubtle: "#21262D",
  textPrimary: "#E6EDF3",
  textSecondary: "#8B949E",
  textTertiary: "#6E7681",
  accent: "#2563EB",
  accentHover: "#3B82F6",
  accentSubtle: "#1E293B",
  primary: "#2563EB",
  destructive: "#EF4444",
  destructiveSubtle: "#450A0A",
  danger: "#EF4444",
  success: "#10B981",
  successSubtle: "#064E3B",
  warning: "#F59E0B",
  warningSubtle: "#451A03",
  cardShadow: "rgba(0, 0, 0, 0.35)",
};

export type ThemeColors = typeof LightColors;
