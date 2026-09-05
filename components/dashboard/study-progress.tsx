/**
 * StudyProgress — weekly study hours bar chart.
 *
 * Simple, clean bar visualization — no charting library needed.
 * MAX_HOURS defines the scale; bars are CSS height % of the container.
 */

import { BarChart3 } from "lucide-react";
import type { StudyDay } from "@/app/lib/dashboard-data";

type Props = { days: StudyDay[] };

const MAX_HOURS = 8; // chart scale ceiling

export function StudyProgress({ days }: Props) {
  const totalHours = days.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      {/* Header */}
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[var(--color-text-3)]" />
        <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
          Weekly study progress
        </h2>
        <span className="ml-auto text-[11.5px] font-medium text-[var(--color-text-2)]">
          {totalHours}h this week
        </span>
      </div>
      <p className="mb-5 text-[12px] text-[var(--color-text-3)]">
        Hours studied per day
      </p>

      {/* Bars */}
      <div className="flex h-28 items-end gap-2 sm:gap-3">
        {days.map((day) => {
          const heightPct = (day.hours / MAX_HOURS) * 100;
          const isEmpty = day.hours === 0;

          return (
            <div
              key={day.day}
              className="group flex flex-1 flex-col items-center gap-1.5"
            >
              {/* Hour label (shown on hover or if non-zero) */}
              <span
                className={`text-[10.5px] font-medium tabular-nums transition-opacity duration-200 ${
                  isEmpty
                    ? "opacity-0 group-hover:opacity-40"
                    : day.isToday
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-[var(--color-text-3)]"
                }`}
              >
                {isEmpty ? "–" : `${day.hours}h`}
              </span>

              {/* Bar */}
              <div className="flex w-full flex-1 items-end rounded-md overflow-hidden bg-slate-100/70 dark:bg-slate-700/40">
                {!isEmpty && (
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      day.isToday ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-600/50"
                    }`}
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                  />
                )}
              </div>

              {/* Day label */}
              <span
                className={`text-[11px] font-medium ${
                  day.isToday ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-[var(--color-text-3)]"
                }`}
              >
                {day.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scale hint */}
      <div className="mt-2 flex justify-end">
        <span className="text-[10.5px] text-[var(--color-border)]">max {MAX_HOURS}h / day</span>
      </div>
    </div>
  );
}
