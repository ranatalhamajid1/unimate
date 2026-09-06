"use client";

import { Check, Sparkles } from "lucide-react";
import { PlanType } from "@/app/lib/entitlement-definitions";

type PricingCardProps = {
  plan: PlanType;
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  isCurrent?: boolean;
  highlighted?: boolean;
  buttonLabel: string;
  onSelect?: () => void;
  isLoading?: boolean;
};

export function PricingCard({
  plan,
  title,
  price,
  period = "/month",
  description,
  features,
  isCurrent = false,
  highlighted = false,
  buttonLabel,
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-all ${
        highlighted
          ? "border-blue-500/40 bg-gradient-to-b from-blue-500/5 via-[var(--color-surface)] to-[var(--color-surface)] shadow-md ring-1 ring-blue-500/20"
          : "border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white shadow-xs">
            <Sparkles className="h-3 w-3" />
            <span>Recommended for Students</span>
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[var(--color-text)]">{title}</h3>
          {isCurrent && (
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-2)] border border-[var(--color-border)]">
              Current Plan
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-[var(--color-text-2)] leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
            {price}
          </span>
          {price !== "$0" && (
            <span className="text-sm font-medium text-[var(--color-text-3)]">
              {period}
            </span>
          )}
        </div>

        <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)] mb-4">
            What&#39;s included:
          </p>
          <ul className="space-y-3 text-sm text-[var(--color-text)]">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 mt-0.5">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span className="text-xs sm:text-sm text-[var(--color-text-2)]">
                  {feat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-4">
        <button
          type="button"
          onClick={onSelect}
          disabled={isCurrent || isLoading}
          className={`w-full rounded-xl py-3 px-4 text-sm font-medium transition-all ${
            isCurrent
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-[var(--color-border)]"
              : highlighted
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm active:scale-[0.98]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] active:scale-[0.98]"
          }`}
        >
          {isLoading ? "Processing..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}
