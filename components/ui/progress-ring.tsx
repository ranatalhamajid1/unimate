/**
 * ProgressRing — SVG radial progress meter (M16 Design Tokens 2.0).
 *
 * Implementation: pure SVG stroke-dashoffset. No WebGL, no canvas, no heavy library.
 * Value change is animated via CSS transition on stroke-dashoffset (compositor-friendly).
 *
 * Used for: GPA radial gauge, attendance safety ring, focus timer ring, completion arcs.
 *
 * prefers-reduced-motion: the transition is suppressed globally by globals.css;
 * the ring still renders the correct static value.
 */

import React from "react";

export type ProgressRingSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ProgressRingColor =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "ai"
  | "muted";

export interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: ProgressRingSize;
  color?: ProgressRingColor;
  /** Text displayed in the center of the ring */
  label?: string;
  /** Smaller subtext below the label */
  sublabel?: string;
  strokeWidth?: number;
  className?: string;
  /** Show the numeric percentage inside the ring */
  showValue?: boolean;
  /** Accessible label for screen readers */
  "aria-label"?: string;
}

/* ── size config: [diameter, default strokeWidth, font sizes] ───────── */
const SIZE_CONFIG: Record<
  ProgressRingSize,
  { d: number; sw: number; labelSize: string; sublabelSize: string }
> = {
  xs: { d: 36,  sw: 3, labelSize: "text-[10px]", sublabelSize: "text-[8px]"  },
  sm: { d: 52,  sw: 4, labelSize: "text-[12px]", sublabelSize: "text-[10px]" },
  md: { d: 72,  sw: 5, labelSize: "text-[15px]", sublabelSize: "text-[11px]" },
  lg: { d: 96,  sw: 6, labelSize: "text-[18px]", sublabelSize: "text-[12px]" },
  xl: { d: 120, sw: 7, labelSize: "text-[22px]", sublabelSize: "text-[13px]" },
};

/* ── color → CSS var mapping ────────────────────────────────────────── */
const COLOR_VAR: Record<ProgressRingColor, string> = {
  accent:  "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger:  "var(--color-danger)",
  ai:      "var(--color-ai)",
  muted:   "var(--color-text-3)",
};

export function ProgressRing({
  value,
  size = "md",
  color = "accent",
  label,
  sublabel,
  strokeWidth,
  showValue = false,
  className = "",
  "aria-label": ariaLabel,
}: ProgressRingProps) {
  const cfg = SIZE_CONFIG[size];
  const sw = strokeWidth ?? cfg.sw;
  const radius = (cfg.d - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clampedValue / 100);
  const cx = cfg.d / 2;
  const colorValue = COLOR_VAR[color];

  const displayLabel = label ?? (showValue ? `${Math.round(clampedValue)}%` : undefined);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clampedValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? label ?? `${Math.round(clampedValue)}%`}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: cfg.d, height: cfg.d }}
    >
      <svg
        width={cfg.d}
        height={cfg.d}
        viewBox={`0 0 ${cfg.d} ${cfg.d}`}
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          stroke="var(--color-border)"
          strokeWidth={sw}
          className="opacity-40"
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          stroke={colorValue}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 600ms var(--ease-spring)",
          }}
        />
      </svg>

      {/* Center label */}
      {(displayLabel || sublabel) && (
        <div className="relative flex flex-col items-center justify-center pointer-events-none">
          {displayLabel && (
            <span
              className={`kpi-numeric font-semibold text-[var(--color-text)] ${cfg.labelSize}`}
            >
              {displayLabel}
            </span>
          )}
          {sublabel && (
            <span
              className={`text-[var(--color-text-3)] font-medium mt-0.5 ${cfg.sublabelSize}`}
            >
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
