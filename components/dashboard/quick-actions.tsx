/**
 * QuickActions — compact row of quick-action buttons linked to active modules.
 * Refined with 120-150ms microinteractions and Linear-style subtle elevation.
 */

import Link from "next/link";
import { FileText, BookOpen, Calendar, Receipt, Zap } from "lucide-react";

const ACTIONS = [
  { id: "add-assignment", label: "Add assignment", Icon: FileText, color: "amber", href: "/dashboard/assignments" },
  { id: "add-exam", label: "Add exam", Icon: BookOpen, color: "blue", href: "/dashboard/exams" },
  { id: "add-class", label: "Add class", Icon: Calendar, color: "emerald", href: "/dashboard/timetable" },
  { id: "track-expense", label: "Track expense", Icon: Receipt, color: "violet", href: "/dashboard/expenses" },
] as const;

const COLOR_MAP: Record<string, string> = {
  amber: "hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-400 [&_svg]:hover:text-amber-600 dark:[&_svg]:hover:text-amber-400",
  blue:  "hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/40 hover:text-blue-700 dark:hover:text-blue-400 [&_svg]:hover:text-blue-600 dark:[&_svg]:hover:text-blue-400",
  emerald: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-400 [&_svg]:hover:text-emerald-600 dark:[&_svg]:hover:text-emerald-400",
  violet: "hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-500/40 hover:text-violet-700 dark:hover:text-violet-400 [&_svg]:hover:text-violet-600 dark:[&_svg]:hover:text-violet-400",
};

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs transition-standard card-hover">
      {/* Header */}
      <div className="mb-3.5 flex items-center gap-2">
        <Zap className="h-4 w-4 text-[var(--color-text-3)]" />
        <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
          Quick actions
        </h2>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ACTIONS.map(({ id, label, Icon, color, href }) => (
          <Link
            key={id}
            href={href}
            aria-label={label}
            className={`group flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-3 text-[12.5px] font-medium text-[var(--color-text-2)] transition-micro interactive-press ${COLOR_MAP[color]}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs transition-micro group-hover:scale-105">
              <Icon className="h-4 w-4 text-[var(--color-text-3)] transition-colors duration-150" />
            </span>
            <span className="text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
