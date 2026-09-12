import { TrendingUp, TrendingDown, Minus, Award, CheckCircle2, FileText, Clock } from "lucide-react";
import type { StatCard } from "@/app/lib/dashboard-data";

type StatsCardsProps = {
  stats: StatCard[];
};

const STAT_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconStyle: string;
    accentGlow: string;
  }
> = {
  gpa: {
    icon: Award,
    iconStyle: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    accentGlow: "group-hover:border-indigo-500/40",
  },
  attendance: {
    icon: CheckCircle2,
    iconStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    accentGlow: "group-hover:border-emerald-500/40",
  },
  assignments: {
    icon: FileText,
    iconStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    accentGlow: "group-hover:border-amber-500/40",
  },
  "study-hours": {
    icon: Clock,
    iconStyle: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    accentGlow: "group-hover:border-violet-500/40",
  },
};

function TrendBadge({ trend }: { trend?: StatCard["trend"] }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <TrendingUp className="h-3 w-3" />
        <span>On track</span>
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <TrendingDown className="h-3 w-3" />
        <span>Attention</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[10.5px] font-medium text-[var(--color-text-3)] border border-slate-500/10">
      <Minus className="h-3 w-3" />
      <span>Neutral</span>
    </span>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map((stat) => {
        const config = STAT_CONFIG[stat.id] ?? {
          icon: Award,
          iconStyle: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
          accentGlow: "group-hover:border-indigo-500/40",
        };
        const Icon = config.icon;

        return (
          <div
            key={stat.id}
            className={`group relative overflow-hidden rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] backdrop-blur-xl p-4 sm:p-5 shadow-xs transition-standard spatial-interactive ${config.accentGlow}`}
            style={{
              boxShadow:
                "var(--shadow-xs), var(--specular-top)",
            }}
          >
            {/* Header: Label + Refined Icon */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs ${config.iconStyle}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  {stat.label}
                </span>
              </div>
              <TrendBadge trend={stat.trend} />
            </div>

            {/* Tabular numeric figure */}
            <p className="kpi-numeric font-heading text-2xl sm:text-[1.85rem] font-bold leading-tight text-[var(--color-text)]">
              {stat.value}
            </p>

            {/* Descriptive sub-text */}
            <p className="mt-1 text-[11.5px] font-medium text-[var(--color-text-2)] truncate">
              {stat.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}

