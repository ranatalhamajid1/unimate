/**
 * Layout, border radius, and accessibility constants.
 * Standardized for Milestone 5:
 * - Controls: 8px (sm: 6, md: 8)
 * - Cards: 12px (lg: 12)
 * - Prominent surfaces/modals: 16px (xl: 16)
 */

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

export const Layout = {
  minTouchTarget: 44,
  maxContentWidth: 600,
  headerHeight: 56,
  tabBarHeight: 64,
} as const;
