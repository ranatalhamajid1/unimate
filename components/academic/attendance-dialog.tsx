"use client";

import { useState, useEffect } from "react";
import { X, CalendarCheck, Trash2 } from "lucide-react";
import {
  CourseAcademicItem,
  calculateCoursePercentage,
  getAttendanceStatus,
} from "@/app/lib/academic-definitions";
import { saveAttendance, deleteAttendance } from "@/app/actions/academic";

type AttendanceDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseAcademicItem[];
  selectedCourseId?: string;
  onSuccess?: () => void;
};

export function AttendanceDialog({
  isOpen,
  onClose,
  courses,
  selectedCourseId,
  onSuccess,
}: AttendanceDialogProps) {
  const [courseId, setCourseId] = useState<string>(selectedCourseId || (courses[0]?.courseId ?? ""));
  const [totalClasses, setTotalClasses] = useState<number>(30);
  const [attendedClasses, setAttendedClasses] = useState<number>(27);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when dialog opens or selectedCourseId changes
  useEffect(() => {
    if (isOpen) {
      const activeId = selectedCourseId || courses[0]?.courseId || "";
      setCourseId(activeId);
      const currentCourse = courses.find((c) => c.courseId === activeId);
      if (currentCourse && currentCourse.totalClasses > 0) {
        setTotalClasses(currentCourse.totalClasses);
        setAttendedClasses(currentCourse.attendedClasses);
      } else {
        setTotalClasses(30);
        setAttendedClasses(26);
      }
      setError(null);
    }
  }, [isOpen, selectedCourseId, courses]);

  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    const found = courses.find((c) => c.courseId === newCourseId);
    if (found && found.totalClasses > 0) {
      setTotalClasses(found.totalClasses);
      setAttendedClasses(found.attendedClasses);
    }
  };

  if (!isOpen) return null;

  const currentCourse = courses.find((c) => c.courseId === courseId);
  const existingAttendance = currentCourse?.attendanceId;

  // Live calculation & validation
  const isExceeded = attendedClasses > totalClasses;
  const isInvalidTotal = totalClasses < 0 || isNaN(totalClasses);
  const isInvalidAttended = attendedClasses < 0 || isNaN(attendedClasses);
  const percentage = calculateCoursePercentage(attendedClasses, totalClasses);
  const status = getAttendanceStatus(percentage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    if (isInvalidTotal) {
      setError("Total classes must be 0 or greater.");
      return;
    }

    if (isInvalidAttended) {
      setError("Attended classes must be 0 or greater.");
      return;
    }

    if (isExceeded) {
      setError("Attended classes cannot exceed total classes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await saveAttendance(courseId, totalClasses, attendedClasses);
      if (!result.success) {
        setError(result.message || "Failed to save attendance.");
      } else {
        onSuccess?.();
        onClose();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!courseId || !existingAttendance) return;
    if (!confirm("Are you sure you want to remove the attendance record for this course?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAttendance(courseId);
      if (!result.success) {
        setError(result.message || "Failed to remove attendance.");
      } else {
        onSuccess?.();
        onClose();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
              {existingAttendance ? "Edit Attendance" : "Track Attendance"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-[13px] text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Course select */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text)] mb-1.5">
              Course <span className="text-rose-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              disabled={isSubmitting || courses.length === 0}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            >
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseCode} — {c.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Classes */}
            <div>
              <label className="block text-[13px] font-medium text-[var(--color-text)] mb-1.5">
                Total Classes <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={isNaN(totalClasses) ? "" : totalClasses}
                onChange={(e) => setTotalClasses(parseInt(e.target.value, 10))}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2 text-[14px] text-[var(--color-text)] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            {/* Attended Classes */}
            <div>
              <label className="block text-[13px] font-medium text-[var(--color-text)] mb-1.5">
                Attended Classes <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={isNaN(attendedClasses) ? "" : attendedClasses}
                onChange={(e) => setAttendedClasses(parseInt(e.target.value, 10))}
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none transition ${
                  isExceeded
                    ? "border-rose-400 bg-rose-50/30 text-rose-700"
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                }`}
              />
            </div>
          </div>

          {isExceeded && (
            <p className="text-[12px] font-medium text-rose-600 dark:text-rose-400">
              Attended classes cannot exceed total classes ({attendedClasses} &gt; {totalClasses}).
            </p>
          )}

          {/* Live Calculated Percentage */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-medium text-[var(--color-text-3)]">Calculated Attendance</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-[18px] font-bold text-[var(--color-text)]">
                    {percentage !== null ? `${percentage}%` : "0%"}
                  </span>
                  {percentage !== null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${status.badgeClass}`}
                    >
                      {status.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[12px] font-semibold text-[var(--color-text-2)]">
                  {Math.max(0, isNaN(attendedClasses) ? 0 : attendedClasses)} / {Math.max(0, isNaN(totalClasses) ? 0 : totalClasses)} classes
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${status.barClass}`}
                style={{ width: `${Math.min(100, Math.max(0, percentage || 0))}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-between pt-2">
            {existingAttendance ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 px-3 py-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Removing..." : "Remove Attendance"}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-[13px] font-medium text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isExceeded || courses.length === 0}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : existingAttendance
                  ? "Update Attendance"
                  : "Save Attendance"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
