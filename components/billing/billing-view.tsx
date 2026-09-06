"use client";

import { useState } from "react";
import { UserSubscriptionData, getProPriceDisplay } from "@/app/lib/entitlement-definitions";
import { AiUsageStatus } from "@/app/lib/ai-limits";
import { SubscriptionStatusCard } from "@/components/billing/subscription-status";
import { PricingCard } from "@/components/billing/pricing-card";
import { Sparkles, CheckCircle2, Zap, ExternalLink } from "lucide-react";

type BillingViewProps = {
  subscription: UserSubscriptionData;
  aiUsage: AiUsageStatus;
  proPriceDisplay: string;
};

export function BillingView({
  subscription,
  aiUsage,
  proPriceDisplay,
}: BillingViewProps) {
  const [loadingAction, setLoadingAction] = useState<"checkout" | "portal" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPro = subscription.isPro;

  const handleUpgrade = async () => {
    setLoadingAction("checkout");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize checkout session.");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned from payment provider.");
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setErrorMessage(err.message || "Something went wrong. Please try again.");
      setLoadingAction(null);
    }
  };

  const handleManagePortal = async () => {
    setLoadingAction("portal");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/billing/create-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize billing portal.");
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      setErrorMessage(err.message || "Could not open billing portal.");
      setLoadingAction(null);
    }
  };

  const aiPercentage = Math.min(
    100,
    Math.round((aiUsage.currentCount / aiUsage.limit) * 100)
  );

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Billing &amp; Subscription
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-2)]">
          Manage your UniMate plan, AI usage allowances, and payment settings.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Subscription Status Card */}
      <SubscriptionStatusCard subscription={subscription} />

      {/* Daily AI Quota Consumption Meter */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Daily AI Study Buddy Allowance
              </h3>
              <p className="text-xs text-[var(--color-text-3)]">
                Resets daily at 00:00 Asia/Karachi (PKT)
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--color-text-2)]">
            {aiUsage.currentCount} / {aiUsage.limit} used today
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              aiPercentage >= 90
                ? "bg-amber-500"
                : "bg-blue-600 dark:bg-blue-500"
            }`}
            style={{ width: `${aiPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-3)]">
          <span>{aiUsage.remaining} requests remaining today</span>
          {!isPro && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Pro unlocks 50 requests/day + AI Study Planner
            </span>
          )}
        </div>
      </div>

      {/* Manage Customer Portal Button for Pro users */}
      {isPro && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleManagePortal}
            disabled={loadingAction === "portal"}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>
              {loadingAction === "portal"
                ? "Opening Portal..."
                : "Manage Subscription & Payment Method"}
            </span>
          </button>
        </div>
      )}

      {/* Plan Comparisons */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-6">
          Choose Your Plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PricingCard
            plan="FREE"
            title="UniMate Free"
            price="$0"
            period=""
            description="All core university organization tools for focused, day-to-day study."
            isCurrent={!isPro}
            buttonLabel={!isPro ? "Active Plan" : "Downgrade to Free"}
            features={[
              "Unlimited Courses & Credit Hour tracking",
              "Weekly Timetable & Schedule matrix",
              "Assignment task manager with due dates",
              "Exam schedules, countdowns & rooms",
              "Real CGPA & Semester GPA calculator",
              "Attendance tracking & 75% threshold alerts",
              "Personal expense tracker in PKR",
              "Basic AI Study Buddy (5 questions / day)",
              "Light, Dark & System appearance",
            ]}
          />

          <PricingCard
            plan="PRO"
            title="UniMate Pro"
            price={proPriceDisplay}
            period="/month"
            description="The complete intelligent academic command center for ambitious students."
            isCurrent={isPro}
            highlighted={!isPro}
            isLoading={loadingAction === "checkout"}
            buttonLabel={isPro ? "Active Plan" : "Upgrade to Pro"}
            onSelect={handleUpgrade}
            features={[
              "Everything in Free, plus:",
              "Smart AI Study Plan generator based on your deadlines",
              "Smart Command Center daily urgency ranking",
              "10x higher AI Allowance (50 questions / day)",
              "Advanced Academic Trend Insights & risk detection",
              "Conflict-free study slot calculation",
              "Universal calendar aggregation (classes, exams, tasks)",
              "Priority Merchant-of-Record billing & receipts",
              "Full refund guarantee within 14 days",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
