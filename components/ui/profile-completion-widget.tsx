import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface ProfileCompletionWidgetProps {
  percentage: number;
  missingFieldPrompt?: string | null;
  className?: string;
}

export function ProfileCompletionWidget({
  percentage,
  missingFieldPrompt,
  className = "",
}: ProfileCompletionWidgetProps) {
  // Determine next actionable suggestion based on server percentage / missing hint
  const nextAction =
    missingFieldPrompt ||
    (percentage < 20
      ? "Select your university & campus"
      : percentage < 40
      ? "Add your degree program & semester"
      : percentage < 60
      ? "Choose a unique @handle"
      : percentage < 80
      ? "Upload a profile avatar"
      : percentage < 100
      ? "Add your graduation year & bio"
      : "Profile complete!");

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
            Academic Identity
          </span>
        </div>
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
          {percentage}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {/* Next Action */}
      {percentage < 100 && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="truncate text-[var(--color-text-2)]">
            <span className="font-semibold text-[var(--color-text)]">Next:</span> {nextAction}
          </span>
          <Link
            href="/dashboard/settings"
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Update
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
