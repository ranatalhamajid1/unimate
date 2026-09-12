/**
 * UpcomingAssignments — list of upcoming assignments with status indicators.
 */

import { FileText, Circle, CheckCircle2, Clock } from "lucide-react";
import type { Assignment } from "@/app/lib/dashboard-data";
import { EmptyState } from "@/components/ui/empty-state";

type Props = { assignments: Assignment[] };

const STATUS_CONFIG = {
  "not-started": {
    label: "Not started",
    icon: Circle,
    classes: "text-[var(--color-text-3)] bg-slate-100 dark:bg-slate-700/50",
  },
  "in-progress": {
    label: "In progress",
    icon: Clock,
    classes: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  },
} as const;

export function UpcomingAssignments({ assignments }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-[var(--color-text-3)]" />
        <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
          Upcoming assignments
        </h2>
        <span className="ml-auto text-[11.5px] text-[var(--color-text-3)]">
          {assignments.filter((a) => a.status !== "completed").length} pending
        </span>
      </div>

      {/* List */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="All caught up!"
          description="You don't have any pending assignments right now. Track upcoming coursework deadlines early."
          actionLabel="Add Assignment"
          actionHref="/dashboard/assignments"
          compact
        />
      ) : (
        <ul className="space-y-2">
          {assignments.map((a) => {
            const cfg = STATUS_CONFIG[a.status];
            const StatusIcon = cfg.icon;

            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150 ${
                  a.status === "completed"
                    ? "border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/40 opacity-60"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border)] hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                }`}
              >
                {/* Status icon */}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${cfg.classes}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                </span>

                {/* Title + course */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] font-medium ${
                      a.status === "completed"
                        ? "text-[var(--color-text-3)] line-through"
                        : "text-[var(--color-text)]"
                    }`}
                  >
                    {a.title}
                  </p>
                  <p className="text-[11.5px] text-[var(--color-text-3)]">{a.course}</p>
                </div>

                {/* Due label */}
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    a.dueSoon
                      ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                      : a.status === "completed"
                        ? "bg-slate-100 dark:bg-slate-700/50 text-[var(--color-text-3)]"
                        : "bg-slate-100 dark:bg-slate-700/50 text-[var(--color-text-2)]"
                  }`}
                >
                  {a.dueLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
