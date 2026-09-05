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
      <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/70 to-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            Current GPA
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700">
            <Award className="h-4 w-4" />
          </span>
        </div>
        <p className="text-[1.95rem] font-bold leading-none tracking-tight text-blue-700">
          {gpaString}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-slate-500">
          {gpaSub} {gradedCoursesCount > 0 ? `(${gradedCoursesCount}/${coursesCount} graded)` : ""}
        </p>
      </div>

      {/* 2. Overall Attendance */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 to-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            Overall Attendance
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
            <Percent className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-[1.95rem] font-bold leading-none tracking-tight text-emerald-700">
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
        <p className="mt-1.5 text-[12px] font-medium text-slate-500">{attendanceSub}</p>
      </div>

      {/* 3. Total Credits */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Credits
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <GraduationCap className="h-4 w-4" />
          </span>
        </div>
        <p className="text-[1.95rem] font-bold leading-none tracking-tight text-slate-900">
          {totalCredits}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-slate-500">
          Across {coursesCount} enrolled courses
        </p>
      </div>

      {/* 4. Courses Tracked */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            Courses Tracked
          </p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <BookOpen className="h-4 w-4" />
          </span>
        </div>
        <p className="text-[1.95rem] font-bold leading-none tracking-tight text-slate-900">
          {coursesCount}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-slate-500">
          Active semester courses
        </p>
      </div>
    </div>
  );
}
