import React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Calendar, ArrowRight, ShieldAlert } from "lucide-react";
import type { TodayActionItem } from "@/app/lib/today-workspace";

interface AttentionQueueProps {
  items: TodayActionItem[];
  attendanceWarning?: {
    courseId: string;
    courseCode: string;
    courseName: string;
    percentageString: string;
    thresholdPercentage: number;
    recoveryClassesRequired: number;
    recommendation: string;
  } | null;
  timetableConflictCount?: number;
}

export function AttentionQueue({
  items,
  attendanceWarning,
  timetableConflictCount = 0,
}: AttentionQueueProps) {
  const hasItems = items.length > 0;
  const hasAttendance = Boolean(attendanceWarning);
  const hasConflicts = timetableConflictCount > 0;

  if (!hasItems && !hasAttendance && !hasConflicts) {
    return null;
  }

  return (
    <div
      className="space-y-3 mb-6 animate-fade-in"
      role="region"
      aria-label="Items requiring immediate attention"
    >
      {/* Attendance Warning Card */}
      {attendanceWarning && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 px-4 py-3.5 rounded-2xl border border-rose-500/25 bg-rose-500/5 dark:bg-rose-500/10 backdrop-blur-xl text-[var(--color-text)] [box-shadow:0_0_24px_-8px_rgba(244,63,94,0.18),var(--specular-top)] transition-standard">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                  Attendance Alert
                </span>
                <span className="text-xs font-semibold text-[var(--color-text)]">{attendanceWarning.courseCode}</span>
              </div>
              <p className="text-xs text-[var(--color-text-2)] mt-0.5 line-clamp-1">
                <span className="font-semibold text-rose-600 dark:text-rose-400">{attendanceWarning.percentageString}</span> attendance (Target: {attendanceWarning.thresholdPercentage}%). Attend next {attendanceWarning.recoveryClassesRequired} classes to recover.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/academics"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-standard shrink-0 self-start sm:self-center"
          >
            Review Attendance <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Timetable Conflicts */}
      {hasConflicts && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 px-4 py-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 backdrop-blur-xl text-[var(--color-text)] [box-shadow:0_0_24px_-8px_rgba(245,158,11,0.18),var(--specular-top)] transition-standard">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  Schedule Conflict
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-2)] mt-0.5">
                {timetableConflictCount} overlapping class period{timetableConflictCount > 1 ? "s" : ""} detected in today&apos;s timetable.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/timetable"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-600 hover:text-white transition-standard shrink-0 self-start sm:self-center"
          >
            Fix Timetable <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Urgent Task Warnings */}
      {items.map((item) => {
        const isOverdue = item.urgencyTier === "OVERDUE";
        return (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 px-4 py-3.5 rounded-2xl border backdrop-blur-xl transition-standard ${
              isOverdue
                ? "border-rose-500/25 bg-rose-500/5 dark:bg-rose-500/10 text-[var(--color-text)] [box-shadow:0_0_24px_-8px_rgba(244,63,94,0.18),var(--specular-top)]"
                : "border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 text-[var(--color-text)] [box-shadow:0_0_24px_-8px_rgba(245,158,11,0.18),var(--specular-top)]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 border ${
                  isOverdue
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}
              >
                {item.entityType === "EXAM" ? (
                  <Calendar className="h-4.5 w-4.5" />
                ) : (
                  <Clock className="h-4.5 w-4.5" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isOverdue
                        ? "bg-rose-500/15 border-rose-500/25 text-rose-700 dark:text-rose-300"
                        : "bg-amber-500/15 border-amber-500/25 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOverdue
                          ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                          : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                      }`}
                    />
                    {item.deadlineLabel}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-2)]">{item.courseCode}</span>
                </div>
                <p className="text-xs font-semibold text-[var(--color-text)] truncate mt-0.5">{item.title}</p>
              </div>
            </div>
            <Link
              href={item.actionHref}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-standard shrink-0 self-start sm:self-center ${
                isOverdue
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white"
              }`}
            >
              {item.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
