"use client";

import { useState, useEffect } from "react";
import { X, Award, Trash2 } from "lucide-react";
import {
  GRADE_OPTIONS,
  getGradePoints,
  CourseAcademicItem,
} from "@/app/lib/academic-definitions";
import { saveCourseGrade, deleteCourseGrade } from "@/app/actions/academic";

type GradeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseAcademicItem[];
  selectedCourseId?: string;
  onSuccess?: () => void;
};

export function GradeDialog({
  isOpen,
  onClose,
  courses,
  selectedCourseId,
  onSuccess,
}: GradeDialogProps) {
  const [courseId, setCourseId] = useState<string>(selectedCourseId || (courses[0]?.courseId ?? ""));
  const [grade, setGrade] = useState<string>("A");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when dialog opens or selectedCourseId changes
  useEffect(() => {
    if (isOpen) {
      const activeId = selectedCourseId || courses[0]?.courseId || "";
      setCourseId(activeId);
      const currentCourse = courses.find((c) => c.courseId === activeId);
      setGrade(currentCourse?.grade || "A");
      setError(null);
    }
  }, [isOpen, selectedCourseId, courses]);

  // When course changes in dropdown, update the current grade
  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    const found = courses.find((c) => c.courseId === newCourseId);
    setGrade(found?.grade || "A");
  };

  if (!isOpen) return null;

  const currentCourse = courses.find((c) => c.courseId === courseId);
  const existingGrade = currentCourse?.grade;
  const gradePoints = getGradePoints(grade);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await saveCourseGrade(courseId, grade);
      if (!result.success) {
        setError(result.message || "Failed to save grade.");
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
    if (!courseId || !existingGrade) return;
    if (!confirm("Are you sure you want to remove the grade for this course?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteCourseGrade(courseId);
      if (!result.success) {
        setError(result.message || "Failed to remove grade.");
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Award className="h-4 w-4" />
            </span>
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
              {existingGrade ? "Edit Course Grade" : "Add Course Grade"}
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
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-red-900/60 p-3 text-[13px] text-rose-700 dark:text-rose-300">
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
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseCode} — {c.courseName} ({c.creditHours} cr)
                </option>
              ))}
            </select>
          </div>

          {/* Grade select */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text)] mb-1.5">
              Grade <span className="text-rose-500">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Automatic Grade Points Display */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-[var(--color-text-3)]">Grade Points (derived)</p>
              <p className="text-[16px] font-bold text-[var(--color-text)]">{gradePoints.toFixed(2)}</p>
            </div>
            {currentCourse && (
              <div className="text-right">
                <p className="text-[12px] font-medium text-[var(--color-text-3)]">Total Quality Points</p>
                <p className="text-[16px] font-bold text-blue-700 dark:text-blue-400">
                  {(gradePoints * currentCourse.creditHours).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-between pt-2">
            {existingGrade ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 px-3 py-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Removing..." : "Remove Grade"}
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
                disabled={isSubmitting || courses.length === 0}
                className="rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : existingGrade ? "Update Grade" : "Save Grade"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
