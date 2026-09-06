import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  Flame,
} from "lucide-react";
import { AcademicInsight, InsightSeverity } from "@/app/lib/academic-insights";

type Props = {
  insights: AcademicInsight[];
};

export function AcademicInsightsCard({ insights }: Props) {
  function getSeverityBadge(severity: InsightSeverity) {
    switch (severity) {
      case "CRITICAL":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />,
          badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
          border: "border-l-rose-500",
        };
      case "WARNING":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
          badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
          border: "border-l-amber-500",
        };
      case "POSITIVE":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
          badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
          border: "border-l-emerald-500",
        };
      case "INFO":
      default:
        return {
          icon: <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />,
          badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
          border: "border-l-blue-500",
        };
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Academic Insights
          </h2>
        </div>
        <span className="text-[11px] font-medium text-[var(--color-text-3)]">
          Real Data Trends
        </span>
      </div>

      <div className="space-y-2.5">
        {insights.slice(0, 3).map((insight) => {
          const style = getSeverityBadge(insight.severity);
          return (
            <div
              key={insight.id}
              className={`rounded-xl border border-[var(--color-border-subtle)] border-l-4 ${style.border} bg-[var(--color-surface-2)] p-3 transition-all`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {style.icon}
                  <h3 className="text-xs font-semibold text-[var(--color-text)]">
                    {insight.title}
                  </h3>
                </div>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${style.badge}`}
                >
                  {insight.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-2)] leading-relaxed">
                {insight.description}
              </p>
              {insight.actionUrl && (
                <Link
                  href={insight.actionUrl}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Take action</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
