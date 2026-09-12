"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, CalendarCheck, BookOpen, Plus } from "lucide-react";
import { AcademicOverview } from "@/app/lib/academic-definitions";
import { AcademicSummary } from "@/components/academic/academic-summary";
import { CoursePerformanceCard } from "@/components/academic/course-performance-card";
import { GradeDialog } from "@/components/academic/grade-dialog";
import { AttendanceDialog } from "@/components/academic/attendance-dialog";
import { GpaWhatIfSimulator } from "@/components/academics/gpa-what-if-simulator";
import { AttendanceIntelligenceSummary } from "@/components/academics/attendance-intelligence-summary";
import { StudentAttendanceSummary } from "@/app/lib/intelligence/attendance-intel";

type AcademicsViewProps = {
  overview: AcademicOverview;
  isPro?: boolean;
  targetGpa?: number | null;
  attendanceIntelligence?: StudentAttendanceSummary | null;
};

export function AcademicsView({
  overview,
  isPro = false,
  targetGpa = null,
  attendanceIntelligence = null,
}: AcademicsViewProps) {
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
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--color-text)] sm:text-[26px]">
            Academic Performance
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--color-text-2)]">
            Track your GPA, grades, and attendance across all courses.
          </p>
        </div>

        {/* Header Action Buttons */}
        {overview.courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenGradeDialog()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 px-3.5 py-2 text-[13px] font-semibold text-blue-700 dark:text-blue-400 shadow-sm transition hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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

      {/* ── GPA What-If Simulation Intelligence ─────────────────────── */}
      {overview.courses.length > 0 && (
        <GpaWhatIfSimulator
          initialCourses={overview.courses.map((c) => ({
            courseId: c.courseId,
            courseName: c.courseName,
            courseCode: c.courseCode,
            creditHours: c.creditHours,
            currentGrade: c.grade ?? null,
            currentGradePoints: c.gradePoints ?? null,
          }))}
          initialCurrentGpa={overview.gpaString}
          targetGpa={targetGpa}
          isPro={isPro}
        />
      )}

      {/* ── Attendance Intelligence & Recovery Thresholds ───────────── */}
      {attendanceIntelligence && attendanceIntelligence.courses.length > 0 && (
        <AttendanceIntelligenceSummary
          initialThreshold={attendanceIntelligence.threshold}
          courses={attendanceIntelligence.courses}
          isPro={isPro}
        />
      )}

      {/* ── Course Performance Section ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--color-text)]">
              Course Breakdown
            </h2>
            <p className="text-[12.5px] text-[var(--color-text-2)]">
              Course-wise GPA weightage and attendance tracking.
            </p>
          </div>
        </div>

        {/* Empty state: No courses enrolled */}
        {overview.courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-14 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-[16px] font-semibold text-[var(--color-text)]">
              No courses yet
            </h3>
            <p className="mt-1 max-w-sm text-[13px] text-[var(--color-text-2)]">
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
