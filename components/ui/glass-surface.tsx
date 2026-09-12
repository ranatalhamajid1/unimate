/**
 * GlassSurface — a selective glassmorphism container (M16 Design Tokens 2.0).
 *
 * Use for: navigation sidebars, command palette, sticky headers, floating overlays.
 * Do NOT use for every card — glass is selective by design (guardrail #8).
 *
 * Implementation notes:
 * - No hover or motion is added here. Apply .card-lift or .card-hover at the call
 *   site only if the surface is genuinely interactive.
 * - backdrop-filter is compositor-layer only; the blur region is bounded to this element.
 *   Avoid placing GlassSurface over large animated regions to prevent compositor cost.
 */

import React from "react";

export type GlassSurfaceVariant = "nav" | "modal" | "elevated" | "subtle";

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * nav      — sidebar, header rails (20px blur, full glass treatment)
   * modal    — command palette, drawers (24px blur, shadow-spatial)
   * elevated — secondary floating panels (16px blur, lighter border)
   * subtle   — low-key container, minimal tint (8px blur, very light)
   */
  variant?: GlassSurfaceVariant;
}

const VARIANT_CLASSES: Record<GlassSurfaceVariant, string> = {
  nav: [
    "bg-[var(--color-glass-bg)]",
    "[backdrop-filter:blur(20px)]",
    "[-webkit-backdrop-filter:blur(20px)]",
    "border border-[var(--color-glass-border)]",
    "[box-shadow:var(--specular-top)]",
  ].join(" "),
  modal: [
    "bg-[var(--color-glass-bg)]",
    "[backdrop-filter:blur(24px)]",
    "[-webkit-backdrop-filter:blur(24px)]",
    "border border-[var(--color-glass-border)]",
    "[box-shadow:var(--shadow-spatial),var(--specular-top)]",
  ].join(" "),
  elevated: [
    "bg-[var(--color-surface-2)]/80",
    "[backdrop-filter:blur(16px)]",
    "[-webkit-backdrop-filter:blur(16px)]",
    "border border-[var(--color-border-subtle)]",
    "[box-shadow:var(--specular-top)]",
  ].join(" "),
  subtle: [
    "bg-[var(--color-surface)]/60",
    "[backdrop-filter:blur(8px)]",
    "[-webkit-backdrop-filter:blur(8px)]",
    "border border-[var(--color-border-subtle)]",
  ].join(" "),
};

export function GlassSurface({
  variant = "nav",
  className = "",
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      className={`${VARIANT_CLASSES[variant]}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
