/**
 * MetricKpiCard — premium fintech-style KPI tile (M16 Design Tokens 2.0).
 *
 * Design principles:
 * - Tabular numerics (.kpi-numeric) for all values — no generic text alignment on stats.
 * - Trend chevron: up=success, down=danger, neutral=muted.
 * - This is a static informational card — no hover-lift by default.
 *   If the card links to a detail view, add `card-lift` className at the call site.
 * - Color variants map to Design Token semantic colors, not raw hex values.
 */

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type MetricKpiColor =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "ai"
  | "muted";

export type MetricKpiTrend = "up" | "down" | "neutral";

export interface MetricKpiCardProps {
  /** Primary metric label (e.g. "Current GPA", "Attendance Rate") */
  label: string;
  /** The headline numeric or string value */
  value: string | number;
  /** Unit appended after the value (e.g. "%", "hrs", "/ 4.0") */
  unit?: string;
  /** Directional trend indicator */
  trend?: MetricKpiTrend;
  /** Trend magnitude (e.g. "+0.23", "−3%") */
  trendValue?: string;
  /** Short contextual label next to the trend (e.g. "vs last week") */
  trendLabel?: string;
  /** Small context line below the value */
  subtitle?: string;
  /** Optional Lucide icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Controls the icon / accent highlight color */
  color?: MetricKpiColor;
  className?: string;
  /** Pass onClick + add card-lift class when the card navigates somewhere */
  onClick?: () => void;
}

/* ── color → CSS var pair [iconBg, iconColor] ──────────────────────── */
const COLOR_STYLE: Record<
  MetricKpiColor,
  { bg: string; text: string; badge: string }
> = {
  accent:  { bg: "bg-blue-500/10",   text: "text-[var(--color-accent)]",  badge: "text-[var(--color-accent)]"  },
  success: { bg: "bg-emerald-500/10", text: "text-[var(--color-success)]", badge: "text-[var(--color-success)]" },
  warning: { bg: "bg-amber-500/10",   text: "text-[var(--color-warning)]", badge: "text-[var(--color-warning)]" },
  danger:  { bg: "bg-red-500/10",     text: "text-[var(--color-danger)]",  badge: "text-[var(--color-danger)]"  },
  ai:      { bg: "bg-violet-500/10",  text: "text-[var(--color-ai)]",      badge: "text-[var(--color-ai)]"      },
  muted:   { bg: "bg-[var(--color-surface-2)]", text: "text-[var(--color-text-3)]", badge: "text-[var(--color-text-3)]" },
};

const TREND_CONFIG: Record<
  MetricKpiTrend,
  { Icon: React.ElementType; color: string }
> = {
  up:      { Icon: TrendingUp,   color: "text-[var(--color-success)]" },
  down:    { Icon: TrendingDown, color: "text-[var(--color-danger)]"  },
  neutral: { Icon: Minus,        color: "text-[var(--color-text-3)]"  },
};

export function MetricKpiCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  trendLabel,
  subtitle,
  icon: Icon,
  color = "accent",
  className = "",
  onClick,
}: MetricKpiCardProps) {
  const colorStyle = COLOR_STYLE[color];
  const trendCfg = trend ? TREND_CONFIG[trend] : null;

  const Tag = onClick ? "button" : "div";
  const interactiveProps = onClick
    ? { onClick, type: "button" as const }
    : {};

  return (
    <Tag
      {...interactiveProps}
      className={[
        "group relative w-full text-left",
        "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]",
        "p-4 sm:p-5",
        "[box-shadow:var(--shadow-xs)]",
        "transition-standard",
        onClick ? "cursor-pointer card-lift" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
          {label}
        </span>
        {Icon && (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${colorStyle.bg}`}
            aria-hidden="true"
          >
            <Icon className={`h-3.5 w-3.5 ${colorStyle.text}`} />
          </span>
        )}
      </div>

      {/* Primary value */}
      <div className="flex items-end gap-1 mb-1">
        <span
          className={`kpi-numeric text-[1.75rem] font-bold leading-none tracking-tight text-[var(--color-text)] ${colorStyle.text.replace("text-", "")}`}
          style={{ color: `var(--color-text)` }}
        >
          {value}
        </span>
        {unit && (
          <span className="kpi-numeric text-[13px] font-medium text-[var(--color-text-3)] mb-0.5">
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[12px] text-[var(--color-text-3)] leading-snug mb-2">
          {subtitle}
        </p>
      )}

      {/* Trend */}
      {trendCfg && (trendValue || trendLabel) && (
        <div className="flex items-center gap-1 mt-2">
          <trendCfg.Icon
            className={`h-3 w-3 ${trendCfg.color}`}
            aria-hidden="true"
          />
          {trendValue && (
            <span className={`kpi-numeric text-[11px] font-semibold ${trendCfg.color}`}>
              {trendValue}
            </span>
          )}
          {trendLabel && (
            <span className="text-[11px] text-[var(--color-text-3)]">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </Tag>
  );
}
