"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getProPriceDisplay } from "@/app/lib/entitlement-definitions";

export function UpgradeCard({ className = "" }: { className?: string }) {
  const priceDisplay = getProPriceDisplay();

  return (
    <div
      className={`rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-transparent p-5 ${className}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        <Sparkles className="h-3.5 w-3.5" />
        <span>UniMate Pro</span>
      </div>

      <h4 className="mt-2 text-sm font-semibold text-[var(--color-text)]">
        Unlock AI Study Plans
      </h4>

      <p className="mt-1 text-xs text-[var(--color-text-2)] leading-relaxed">
        Let AI generate your study schedules and command center priorities for just {priceDisplay}/mo.
      </p>

      <Link
        href="/dashboard/billing"
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 px-3 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-500"
      >
        <span>Upgrade Now</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
