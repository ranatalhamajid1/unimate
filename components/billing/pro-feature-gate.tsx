"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Check } from "lucide-react";

type ProFeatureGateProps = {
  title?: string;
  description?: string;
  benefits?: string[];
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function ProFeatureGate({
  title = "Unlock with UniMate Pro",
  description = "Get access to AI Study Plans, intelligent schedule generation, and priority academic features.",
  benefits = [
    "AI Study Plan generation tailored to your deadlines",
    "Smart Student Command Center priorities & alerts",
    "10x higher daily AI Study Buddy allowance",
    "Advanced performance trend forecasting",
  ],
  actionLabel = "Upgrade to Pro",
  actionHref = "/dashboard/billing",
  className = "",
}: ProFeatureGateProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 via-[var(--color-surface)] to-[var(--color-surface)] p-6 sm:p-8 shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Premium Feature</span>
          </div>

          <h3 className="text-xl font-semibold text-[var(--color-text)]">
            {title}
          </h3>

          <p className="text-sm leading-relaxed text-[var(--color-text-2)]">
            {description}
          </p>

          <ul className="space-y-2 pt-2">
            {benefits.map((b, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text)]"
              >
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sm:self-center shrink-0">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.98]"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
