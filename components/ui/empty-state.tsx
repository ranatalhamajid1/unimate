import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  className = "",
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/40 ${
        compact ? "p-5 sm:p-6" : "p-8 sm:p-10"
      } ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs mb-3 text-[var(--color-text-2)] transition-transform duration-200 hover:scale-105">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-sm font-semibold text-[var(--color-text)] tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs text-[var(--color-text-3)] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && (
            actionHref ? (
              <Link
                href={actionHref}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-micro cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-micro cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="text-xs font-medium text-[var(--color-text-3)] hover:text-[var(--color-text)] px-2.5 py-1 rounded-lg transition-micro"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
