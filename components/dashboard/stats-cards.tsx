/**
 * StatsCards — four overview stat cards.
 *
 * Receives StatCard[] as props. When the DB is added, pass real values;
 * the component itself never needs to change.
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StatCard } from "@/app/lib/dashboard-data";

type StatsCardsProps = {
  stats: StatCard[];
};

const CARD_ACCENT: Record<string, string> = {
  gpa: "from-blue-500/10 to-transparent border-blue-100/80 dark:border-blue-500/20",
  attendance: "from-emerald-500/10 to-transparent border-emerald-100/80 dark:border-emerald-500/20",
  assignments: "from-amber-500/10 to-transparent border-amber-100/80 dark:border-amber-500/20",
  "study-hours": "from-violet-500/10 to-transparent border-violet-100/80 dark:border-violet-500/20",
};

const VALUE_COLOR: Record<string, string> = {
  gpa: "text-blue-700 dark:text-blue-400",
  attendance: "text-emerald-700 dark:text-emerald-400",
  assignments: "text-amber-700 dark:text-amber-400",
  "study-hours": "text-violet-700 dark:text-violet-400",
};

function TrendIcon({ trend }: { trend?: StatCard["trend"] }) {
  if (trend === "up")
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />;
  if (trend === "down")
    return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${CARD_ACCENT[stat.id] ?? "from-slate-50 to-transparent border-[var(--color-border)]"} bg-[var(--color-surface)] p-4 sm:p-5`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-medium text-[var(--color-text-3)] uppercase tracking-wider">
              {stat.label}
            </p>
            <TrendIcon trend={stat.trend} />
          </div>
          <p
            className={`text-[1.9rem] font-semibold leading-none tracking-tight ${VALUE_COLOR[stat.id] ?? "text-[var(--color-text)]"}`}
          >
            {stat.value}
          </p>
          <p className="mt-1.5 text-[12px] text-[var(--color-text-3)]">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
