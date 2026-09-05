/**
 * CoursePerformanceCard — displays academic standing, grade, and attendance for a single course.
 */

import { Award, CalendarCheck, Plus, Edit2 } from "lucide-react";
import {
  CourseAcademicItem,
  getGradeBadgeStyle,
} from "@/app/lib/academic-definitions";

type CoursePerformanceCardProps = {
  course: CourseAcademicItem;
  onEditGrade: (courseId: string) => void;
  onEditAttendance: (courseId: string) => void;
};

export function CoursePerformanceCard({
  course,
  onEditGrade,
  onEditAttendance,
}: CoursePerformanceCardProps) {
  const {
    courseId,
    courseName,
    courseCode,
    creditHours,
    color,
    grade,
    gradePoints,
    totalClasses,
    attendedClasses,
    attendancePercentage,
    attendanceStatus,
  } = course;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      {/* Top course color bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: color || "#2563eb" }}
      />

      {/* Course Info Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide text-white"
                style={{ backgroundColor: color || "#2563eb" }}
              >
                {courseCode}
              </span>
              <span className="text-[12px] font-medium text-slate-400">
                {creditHours} Credits
              </span>
            </div>
            <h3 className="mt-2 text-[16px] font-semibold text-slate-900 leading-snug line-clamp-1">
              {courseName}
            </h3>
          </div>
        </div>

        {/* ── Grade Section ── */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
              <Award className="h-3.5 w-3.5 text-slate-400" />
              Course Grade
            </span>
            <button
              onClick={() => onEditGrade(courseId)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              {grade ? (
                <>
                  <Edit2 className="h-3 w-3" />
                  Edit
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  Add Grade
                </>
              )}
            </button>
          </div>

          {grade ? (
            <div className="mt-2 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg px-2.5 py-0.5 text-[14px] font-bold border ${getGradeBadgeStyle(
                    grade
                  )}`}
                >
                  {grade}
                </span>
                <span className="text-[13px] font-medium text-slate-600">
                  {gradePoints?.toFixed(2)} pts
                </span>
              </div>
              <span className="text-[12px] font-medium text-slate-500">
                Quality: {((gradePoints || 0) * creditHours).toFixed(1)} pts
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[13px] font-normal text-slate-400 italic">
              Grade not added
            </p>
          )}
        </div>

        {/* ── Attendance Section ── */}
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
              <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
              Attendance
            </span>
            <button
              onClick={() => onEditAttendance(courseId)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 transition"
            >
              {totalClasses > 0 ? (
                <>
                  <Edit2 className="h-3 w-3" />
                  Edit
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  Add Attendance
                </>
              )}
            </button>
          </div>

          {totalClasses > 0 ? (
            <div className="mt-2">
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold text-slate-900">
                    {attendancePercentage !== null ? `${attendancePercentage}%` : "0%"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${attendanceStatus.badgeClass}`}
                  >
                    {attendanceStatus.label}
                  </span>
                </div>
                <span className="text-[12px] font-medium text-slate-500">
                  {attendedClasses} / {totalClasses} classes
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${attendanceStatus.barClass}`}
                  style={{
                    width: `${Math.min(100, Math.max(0, attendancePercentage || 0))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[13px] font-normal text-slate-400 italic">
              Attendance not added
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
