"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, CalendarCheck, BookOpen, ArrowRight, Plus } from "lucide-react";
import { AcademicOverview } from "@/app/lib/academic-definitions";
import { AcademicSummary } from "@/components/academic/academic-summary";
import { CoursePerformanceCard } from "@/components/academic/course-performance-card";
import { GradeDialog } from "@/components/academic/grade-dialog";
import { AttendanceDialog } from "@/components/academic/attendance-dialog";

type AcademicsViewProps = {
  overview: AcademicOverview;
};

export function AcademicsView({ overview }: AcademicsViewProps) {
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>();

  const handleOpenGradeDialog = (courseId?: string) => {
    setSelectedCourseId(courseId || overview.courses[0]?.courseId);
    setIsGradeDialogOpen(true);
  };

  const handleOpenAttendanceDialog = (courseId?: string) => {
    setSelectedCourseId(courseId || overview.courses[0]?.courseId);
    setIsAttendanceDialogOpen(true);
  };

  return (
    <div className="space-y-7">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Academic Performance
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Track your GPA, grades, and attendance across all courses.
          </p>
        </div>

        {/* Header Action Buttons */}
        {overview.courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenGradeDialog()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-[13px] font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <Award className="h-4 w-4 text-blue-600" />
              Update Grade
            </button>
            <button
              onClick={() => handleOpenAttendanceDialog()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <CalendarCheck className="h-4 w-4" />
              Update Attendance
            </button>
          </div>
        )}
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <AcademicSummary overview={overview} />

      {/* ── Course Performance Section ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">
              Course Breakdown
            </h2>
            <p className="text-[12.5px] text-slate-500">
              Course-wise GPA weightage and attendance tracking.
            </p>
          </div>
        </div>

        {/* Empty state: No courses enrolled */}
        {overview.courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-900">
              No courses yet
            </h3>
            <p className="mt-1 max-w-sm text-[13px] text-slate-500">
              Add your first course to start tracking your academic performance, GPA, and class attendance.
            </p>
            <Link
              href="/dashboard/courses"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Link>
          </div>
        ) : (
          /* Responsive Cards Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overview.courses.map((course) => (
              <CoursePerformanceCard
                key={course.courseId}
                course={course}
                onEditGrade={handleOpenGradeDialog}
                onEditAttendance={handleOpenAttendanceDialog}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <GradeDialog
        isOpen={isGradeDialogOpen}
        onClose={() => setIsGradeDialogOpen(false)}
        courses={overview.courses}
        selectedCourseId={selectedCourseId}
      />

      <AttendanceDialog
        isOpen={isAttendanceDialogOpen}
        onClose={() => setIsAttendanceDialogOpen(false)}
        courses={overview.courses}
        selectedCourseId={selectedCourseId}
      />
    </div>
  );
}
