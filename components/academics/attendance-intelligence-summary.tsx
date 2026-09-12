"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Info } from "lucide-react";
import { CourseAttendanceInsight } from "@/app/lib/intelligence/attendance-intel";

type AttendanceIntelligenceSummaryProps = {
  initialThreshold: number; // e.g. 0.75
  courses: CourseAttendanceInsight[];
  isPro: boolean;
};

export function AttendanceIntelligenceSummary({
  initialThreshold,
  courses,
  isPro,
}: AttendanceIntelligenceSummaryProps) {
  const [threshold, setThreshold] = useState<number>(initialThreshold);

  const thresholdPct = Math.round(threshold * 100);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-standard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Attendance Intelligence
          </h3>
          <p className="text-xs text-[var(--color-text-2)]">
            Policy threshold tracking, recovery counts, and safe skip buffers
          </p>
        </div>

        {/* Threshold selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--color-text-2)] font-medium">
            Threshold:
          </label>
          <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5 text-xs">
            {[0.70, 0.75, 0.80].map((t) => (
              <button
                key={t}
                onClick={() => setThreshold(t)}
                className={`px-2.5 py-1 rounded-md font-medium transition-micro ${
                  threshold === t
                    ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs font-semibold"
                    : "text-[var(--color-text-2)] hover:text-[var(--color-text)]"
                }`}
              >
                {Math.round(t * 100)}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Policy disclaimer */}
      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-2)] text-[11px] border border-[var(--color-border)]">
        <Info className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-accent)] mt-0.5" />
        <span>
          Based on your current attendance and the configured {thresholdPct}% threshold. Calculations provide forward estimates to help plan your schedule.
        </span>
      </div>

      {/* Course Cards Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map((c) => {
          const isSafe = c.status === "SAFE";
          const isWatch = c.status === "WATCH";
          const isAtRisk = c.status === "AT_RISK";

          return (
            <div
              key={c.courseId}
              className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-[var(--color-text)]">
                    {c.courseCode} — {c.courseName}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isSafe
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : isWatch
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : isAtRisk
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-3 text-xs text-[var(--color-text-2)]">
                  <span>
                    <strong className="text-sm font-bold text-[var(--color-text)]">
                      {c.attendancePercentageString}
                    </strong>
                  </span>
                  <span>
                    {c.attendedClasses} of {c.totalClasses} classes attended
                  </span>
                </div>
              </div>

              {/* Recommendation wording */}
              <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-2)] leading-relaxed">
                {c.recommendation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
