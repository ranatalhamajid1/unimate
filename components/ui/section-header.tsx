/**
 * SectionHeader — consistent section heading primitive (M16 Design Tokens 2.0).
 *
 * Provides a well-spaced heading row with optional description line,
 * optional leading icon, and optional trailing action (button, link, badge).
 *
 * Renders an h2 by default. Pass `as="h3"` for nested subsections.
 * No motion or hover is applied here.
 */

import React from "react";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Optional Lucide icon placed before the title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Trailing slot — pass a Button, Link, or badge node */
  action?: React.ReactNode;
  /** Heading level rendered. Defaults to "h2". */
  as?: "h1" | "h2" | "h3" | "h4";
  /** Bottom margin variant. Defaults to "md". */
  spacing?: "sm" | "md" | "lg";
  className?: string;
}

const SPACING_CLASS: Record<NonNullable<SectionHeaderProps["spacing"]>, string> = {
  sm: "mb-3",
  md: "mb-5",
  lg: "mb-7",
};

const HEADING_CLASS: Record<NonNullable<SectionHeaderProps["as"]>, string> = {
  h1: "text-[1.5rem] font-bold tracking-tight",
  h2: "text-[1.125rem] font-semibold tracking-tight",
  h3: "text-[1rem] font-semibold tracking-tight",
  h4: "text-[0.9rem] font-semibold",
};

export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  as: Tag = "h2",
  spacing = "md",
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${SPACING_CLASS[spacing]} ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] mt-0.5"
            aria-hidden="true"
          >
            <Icon className="h-3.5 w-3.5 text-[var(--color-text-2)]" />
          </span>
        )}
        <div className="min-w-0">
          <Tag
            className={`${HEADING_CLASS[Tag]} text-[var(--color-text)] leading-snug`}
          >
            {title}
          </Tag>
          {description && (
            <p className="mt-0.5 text-[13px] text-[var(--color-text-3)] leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="shrink-0 flex items-center">
          {action}
        </div>
      )}
    </div>
  );
}
