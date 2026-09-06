import { UserSubscriptionData } from "@/app/lib/entitlement-definitions";
import { PlanBadge } from "@/components/billing/plan-badge";
import { Calendar, CreditCard, AlertCircle } from "lucide-react";

type SubscriptionStatusProps = {
  subscription: UserSubscriptionData;
  className?: string;
};

export function SubscriptionStatusCard({
  subscription,
  className = "",
}: SubscriptionStatusProps) {
  const isPro = subscription.isPro;
  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
            Current Subscription
          </span>
          <div className="mt-1.5 flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              {isPro ? "UniMate Pro" : "UniMate Free"}
            </h2>
            <PlanBadge plan={subscription.plan} size="md" />
          </div>
        </div>

        {isPro && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Subscription</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 text-sm text-[var(--color-text-2)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[var(--color-text)]">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-3)]">Billing Provider</p>
            <p className="font-medium text-[var(--color-text)]">
              {subscription.provider !== "NONE"
                ? subscription.provider
                : isPro
                ? "Paddle"
                : "No payment method needed"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[var(--color-text)]">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-3)]">
              {subscription.cancelAtPeriodEnd ? "Access Ends On" : "Next Renewal Date"}
            </p>
            <p className="font-medium text-[var(--color-text)]">
              {periodEnd || (isPro ? "Renews Monthly" : "Forever Free")}
            </p>
          </div>
        </div>
      </div>

      {subscription.cancelAtPeriodEnd && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Your subscription will cancel at the end of the billing period on {periodEnd}.
          </span>
        </div>
      )}
    </div>
  );
}
