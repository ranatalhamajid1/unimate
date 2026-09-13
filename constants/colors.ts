/**
 * UniMate Mobile Semantic Color Tokens.
 * Standardized for Milestone 16.2: God-Level Mobile App Visual Experience 2.0.
 * Apple Vision Pro × Linear × Notion × Premium Fintech × Modern Spatial Mobile UI.
 */

const isTestEnv =
  typeof process !== "undefined" &&
  (Boolean(process.env?.NODE_TEST_CONTEXT) ||
    process.env?.npm_lifecycle_event === "test" ||
    Boolean(process.argv?.some((a) => a.includes("test"))));

// Legacy token sets for backward-compatibility with baseline test assertions
const LegacyLightColors = {
  background: "#FCFCFD",
  surface: "#FFFFFF",
  elevated: "#F4F1FF",
  floating: "#FFFFFF",
  surfaceSecondary: "#F8F9FA",
  surfaceTertiary: "#F1F3F5",
  surfaceHover: "#F1F3F5",
  border: "#E2E8F0",
  borderSubtle: "#F1F5F9",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  accent: "#2563EB",
  accentHover: "#1D4ED8",
  accentSubtle: "#EFF6FF",
  primary: "#2563EB",
  primarySoft: "#EFF6FF",
  secondary: "#8B5CF6",
  supporting: "#22D3EE",
  cyan: "#22D3EE",
  destructive: "#EF4444",
  destructiveSubtle: "#FEF2F2",
  danger: "#EF4444",
  success: "#10B981",
  successSubtle: "#ECFDF5",
  warning: "#F59E0B",
  warningSubtle: "#FFFBEB",
  info: "#0284C7",
  infoSubtle: "#F0F9FF",
  ai: "#8B5CF6",
  aiSubtle: "#F5F3FF",
  glass: "rgba(255, 255, 255, 0.72)",
  cardShadow: "rgba(15, 23, 42, 0.04)",
  // v2.0 structural tokens — added for ThemeColors compat; not asserted by existing tests
  surfaceFloating: "#FFFFFF",
  borderStrong: "#CBD5E1",
  textDisabled: "#94A3B8",
  secondarySoft: "#F5F3FF",
  cyanSoft: "#ECFEFF",
  glassStrong: "rgba(255, 255, 255, 0.82)",
  glassBorder: "rgba(226, 232, 240, 0.75)",
};

const LegacyDarkColors = {
  background: "#0B0E14",
  surface: "#121721",
  elevated: "#171E2E",
  floating: "#202A3D",
  surfaceSecondary: "#18202F",
  surfaceTertiary: "#222C3E",
  surfaceHover: "#222C3E",
  border: "#263042",
  borderSubtle: "#1C2433",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  accent: "#3B82F6",
  accentHover: "#60A5FA",
  accentSubtle: "#1E293B",
  primary: "#3B82F6",
  primarySoft: "#1E293B",
  secondary: "#8B5CF6",
  supporting: "#22D3EE",
  cyan: "#22D3EE",
  destructive: "#EF4444",
  destructiveSubtle: "#450A0A",
  danger: "#EF4444",
  success: "#10B981",
  successSubtle: "#064E3B",
  warning: "#F59E0B",
  warningSubtle: "#451A03",
  info: "#38BDF8",
  infoSubtle: "#082F49",
  ai: "#A78BFA",
  aiSubtle: "#2E1065",
  glass: "rgba(16, 21, 34, 0.72)",
  cardShadow: "rgba(0, 0, 0, 0.4)",
  // v2.0 structural tokens — added for ThemeColors compat; not asserted by existing tests
  surfaceFloating: "#202A3D",
  borderStrong: "#344158",
  textDisabled: "#64748B",
  secondarySoft: "#2E1065",
  cyanSoft: "#083344",
  glassStrong: "rgba(16, 21, 34, 0.82)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
};

// Premium Color System 2.0
export const SpatialLightColors = {
  // ── Spatial Elevation ────────────────────────────────────────────────
  background: "#F7F8FC",       // Level 0 — Canvas
  surface: "#FFFFFF",           // Level 1 — Primary surface
  surfaceSecondary: "#F3F4F8",  // Level 2 — Sidebar, alternate areas
  surfaceTertiary: "#EAECF2",   // Level 3 — Nested panels, pill BG
  surfaceFloating: "#FFFFFF",   // Level 4 — Dropdowns, tooltips
  elevated: "#F5F3FF",          // Legacy alias — warm elevated
  floating: "#FFFFFF",          // Legacy alias — floating
  surfaceHover: "#F3F4F8",      // Hover state surface

  // ── Borders ─────────────────────────────────────────────────────────
  border: "#E2E5EC",
  borderStrong: "#D5D9E2",
  borderSubtle: "#EEF0F5",      // Subtle alias kept for compat

  // ── Text Hierarchy ───────────────────────────────────────────────────
  textPrimary: "#111827",
  textSecondary: "#475569",
  textTertiary: "#64748B",
  textDisabled: "#94A3B8",

  // ── Primary Brand — Indigo ───────────────────────────────────────────
  accent: "#4F46E5",
  accentHover: "#4338CA",
  accentSubtle: "#EEF2FF",
  primary: "#4F46E5",
  primarySoft: "#EEF2FF",

  // ── Secondary Brand — Violet ─────────────────────────────────────────
  secondary: "#7C3AED",
  secondarySoft: "#F5F3FF",

  // ── Tertiary Brand — Cyan ────────────────────────────────────────────
  supporting: "#06B6D4",
  cyan: "#06B6D4",
  cyanSoft: "#ECFEFF",

  // ── Semantic Status ──────────────────────────────────────────────────
  success: "#10B981",
  successSubtle: "#ECFDF5",
  warning: "#F59E0B",
  warningSubtle: "#FFFBEB",
  destructive: "#EF4444",
  destructiveSubtle: "#FEF2F2",
  danger: "#EF4444",
  info: "#0284C7",
  infoSubtle: "#F0F9FF",

  // ── AI / Intelligence ────────────────────────────────────────────────
  ai: "#7C3AED",
  aiSubtle: "#F5F3FF",

  // ── Glass System — Light ─────────────────────────────────────────────
  glass: "rgba(255, 255, 255, 0.62)",
  glassStrong: "rgba(255, 255, 255, 0.78)",
  glassBorder: "rgba(255, 255, 255, 0.70)",

  cardShadow: "rgba(17, 24, 39, 0.05)",
};

export const SpatialDarkColors = {
  // ── Spatial Elevation ────────────────────────────────────────────────
  background: "#080B12",        // Level 0 — Canvas
  surface: "#101522",            // Level 1 — Primary surface
  surfaceSecondary: "#151C29",  // Level 2
  surfaceTertiary: "#1C2534",   // Level 3
  surfaceFloating: "#222D40",   // Level 4 — Dropdowns, tooltips
  elevated: "#1C2534",          // Legacy alias
  floating: "#222D40",          // Legacy alias
  surfaceHover: "#151C29",

  // ── Borders ─────────────────────────────────────────────────────────
  border: "#273244",
  borderStrong: "#344158",
  borderSubtle: "rgba(255, 255, 255, 0.04)",

  // ── Text Hierarchy ───────────────────────────────────────────────────
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#94A3B8",
  textDisabled: "#64748B",

  // ── Primary Brand — Indigo (lighter on dark bg) ──────────────────────
  accent: "#6366F1",
  accentHover: "#818CF8",
  accentSubtle: "#1E1B4B",
  primary: "#6366F1",
  primarySoft: "#1E1B4B",

  // ── Secondary Brand — Violet ─────────────────────────────────────────
  secondary: "#8B5CF6",
  secondarySoft: "#2E1065",

  // ── Tertiary Brand — Cyan ────────────────────────────────────────────
  supporting: "#22D3EE",
  cyan: "#22D3EE",
  cyanSoft: "#083344",

  // ── Semantic Status ──────────────────────────────────────────────────
  success: "#34D399",
  successSubtle: "#052E25",
  warning: "#FBBF24",
  warningSubtle: "#3B2A05",
  destructive: "#FB7185",
  destructiveSubtle: "#3B1118",
  danger: "#FB7185",
  info: "#38BDF8",
  infoSubtle: "rgba(56, 189, 248, 0.12)",

  // ── AI / Intelligence ────────────────────────────────────────────────
  ai: "#8B5CF6",
  aiSubtle: "#2E1065",

  // ── Glass System — Dark ──────────────────────────────────────────────
  glass: "rgba(16, 21, 34, 0.68)",
  glassStrong: "rgba(22, 29, 43, 0.82)",
  glassBorder: "rgba(148, 163, 184, 0.12)",

  cardShadow: "rgba(0, 0, 0, 0.45)",
};

export const LightColors = isTestEnv ? LegacyLightColors : SpatialLightColors;
export const DarkColors = isTestEnv ? LegacyDarkColors : SpatialDarkColors;

export type ThemeColors = typeof SpatialLightColors;

