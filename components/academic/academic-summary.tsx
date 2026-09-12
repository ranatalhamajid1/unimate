/**
 * AcademicSummary — top metric cards for Academic Performance.
 * Displays real credit-weighted GPA, overall attendance, total credits, and tracked courses.
 */

import { GraduationCap, Percent, Award, BookOpen } from "lucide-react";
import { AcademicOverview } from "@/app/lib/academic-definitions";

type AcademicSummaryProps = {
  overview: AcademicOverview;
};

export function AcademicSummary({ overview }: AcademicSummaryProps) {
  const {
    gpaString,
    gpaSub,
    attendanceString,
    attendanceSub,
    attendanceStatus,
    totalCredits,
    coursesCount,
    gradedCoursesCount,
  } = overview;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* 1. Current GPA */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 dark:from-blue-950/30 to-white dark:to-[var(--color-surface)] p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-[var(--color-text-3)] uppercase tracking-wider">
            Current GPA
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/80 dark:bg-blue-900/60 text-blue-700 dark:text-blue-400">
            <Award className="h-4 w-4" />
          </span>
        </div>
        <p className="kpi-numeric text-[1.95rem] font-bold leading-none tracking-tight text-blue-700 dark:text-blue-400">
          {gpaString}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-[var(--color-text-3)]">
          {gpaSub} {gradedCoursesCount > 0 ? `(${gradedCoursesCount}/${coursesCount} graded)` : ""}
        </p>
      </div>

      {/* 2. Overall Attendance */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-950/30 to-white dark:to-[var(--color-surface)] p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-[var(--color-text-3)] uppercase tracking-wider">
            Overall Attendance
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400">
            <Percent className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="kpi-numeric text-[1.95rem] font-bold leading-none tracking-tight text-emerald-700 dark:text-emerald-400">
            {attendanceString}
          </p>
          {overview.overallAttendance !== null && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${attendanceStatus.badgeClass}`}
            >
              {attendanceStatus.label}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[12px] font-medium text-[var(--color-text-3)]">{attendanceSub}</p>
      </div>

      {/* 3. Total Credits */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-[var(--color-text-3)] uppercase tracking-wider">
            Total Credits
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-2)]">
            <GraduationCap className="h-4 w-4" />
          </span>
        </div>
        <p className="kpi-numeric text-[1.95rem] font-bold leading-none tracking-tight text-[var(--color-text)]">
          {totalCredits}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-[var(--color-text-3)]">
          Across {coursesCount} enrolled courses
        </p>
      </div>

      {/* 4. Courses Tracked */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-[var(--color-text-3)] uppercase tracking-wider">
            Courses Tracked
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-2)]">
            <BookOpen className="h-4 w-4" />
          </span>
        </div>
        <p className="kpi-numeric text-[1.95rem] font-bold leading-none tracking-tight text-[var(--color-text)]">
          {coursesCount}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-[var(--color-text-3)]">
          Active semester courses
        </p>
      </div>
    </div>
  );
}
