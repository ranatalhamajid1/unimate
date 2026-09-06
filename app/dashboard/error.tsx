"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safely to client console without leaking sensitive credentials
    console.error("Dashboard error caught by boundary:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10 px-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>

        <span className="inline-block rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3">
          Dashboard Notice
        </span>

        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text)] sm:text-2xl">
          Something went wrong
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-2)]">
          We couldn&apos;t load this section of your dashboard. You can try refreshing the component or return to your overview.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-500 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-xs sm:text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-border-subtle)]"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
