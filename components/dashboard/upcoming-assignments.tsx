/**
 * UpcomingAssignments — list of upcoming assignments with status indicators.
 */

import { FileText, Circle, CheckCircle2, Clock } from "lucide-react";
import type { Assignment } from "@/app/lib/dashboard-data";

type Props = { assignments: Assignment[] };

const STATUS_CONFIG = {
  "not-started": {
    label: "Not started",
    icon: Circle,
    classes: "text-slate-400 bg-slate-100",
  },
  "in-progress": {
    label: "In progress",
    icon: Clock,
    classes: "text-amber-600 bg-amber-50",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "text-emerald-600 bg-emerald-50",
  },
} as const;

export function UpcomingAssignments({ assignments }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-slate-400" />
        <h2 className="text-[14px] font-semibold text-slate-900">
          Upcoming assignments
        </h2>
        <span className="ml-auto text-[11.5px] text-slate-400">
          {assignments.filter((a) => a.status !== "completed").length} pending
        </span>
      </div>

      {/* List */}
      {assignments.length === 0 ? (
        <div className="py-7 text-center">
          <p className="text-[13px] text-slate-400 font-medium">
            You&apos;re all caught up.
          </p>
        </div>
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
                    ? "border-slate-100 bg-slate-50/40 opacity-60"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
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
                        ? "text-slate-400 line-through"
                        : "text-slate-800"
                    }`}
                  >
                    {a.title}
                  </p>
                  <p className="text-[11.5px] text-slate-400">{a.course}</p>
                </div>

                {/* Due label */}
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    a.dueSoon
                      ? "bg-red-50 text-red-600"
                      : a.status === "completed"
                        ? "bg-slate-100 text-slate-400"
                        : "bg-slate-100 text-slate-500"
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
