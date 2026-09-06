import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  StudentPriority,
  StudentIntelligenceReport,
  PrioritySeverity,
} from "@/app/lib/student-intelligence";

type Props = {
  report: StudentIntelligenceReport;
};

export function DailyPriorities({ report }: Props) {
  const { priorities, isCaughtUp } = report;

  function getSeverityBadge(severity: PrioritySeverity) {
    switch (severity) {
      case "CRITICAL":
        return {
          icon: <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
          badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
          cardBorder: "border-l-rose-500",
        };
      case "HIGH":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
          cardBorder: "border-l-amber-500",
        };
      case "MEDIUM":
        return {
          icon: <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
          cardBorder: "border-l-blue-500",
        };
      case "LOW":
      default:
        return {
          icon: <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />,
          badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
          cardBorder: "border-l-slate-400",
        };
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Today&apos;s Priorities
          </h2>
        </div>

        {report.criticalCount > 0 && (
          <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-600 dark:text-rose-400">
            {report.criticalCount} Critical
          </span>
        )}
      </div>

      {priorities.length === 0 ? (
        /* Calm Empty State */
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-[var(--color-text)]">
            You&apos;re caught up. Use the free time to get ahead.
          </p>
          <p className="text-[11px] text-[var(--color-text-3)] mt-1">
            No overdue coursework, urgent exams, or attendance warnings.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {priorities.slice(0, 5).map((item) => {
            const style = getSeverityBadge(item.severity);

            return (
              <div
                key={item.id}
                className={`rounded-xl border border-[var(--color-border-subtle)] border-l-4 ${style.cardBorder} bg-[var(--color-surface-2)] p-3.5 transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 shrink-0">{style.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-semibold text-[var(--color-text)]">
                          {item.title}
                        </h3>
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${style.badge}`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-text-2)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={item.actionUrl}
                    className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface)] hover:text-blue-600 transition-colors"
                    aria-label={`Action for ${item.title}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
