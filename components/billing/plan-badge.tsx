import { PlanType } from "@/app/lib/entitlement-definitions";
import { Sparkles, Shield } from "lucide-react";

type PlanBadgeProps = {
  plan: PlanType;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function PlanBadge({ plan, className = "", size = "md" }: PlanBadgeProps) {
  const isPro = plan === "PRO";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-[12px] gap-1.5",
    lg: "px-3 py-1.5 text-[13px] gap-2",
  }[size];

  if (isPro) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs ${sizeClasses} ${className}`}
      >
        <Sparkles className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Pro Plan</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 ${sizeClasses} ${className}`}
    >
      <Shield className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>Free Plan</span>
    </span>
  );
}
