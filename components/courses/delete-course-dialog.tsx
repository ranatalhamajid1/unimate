"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Course } from "@/app/lib/course-definitions";
import { deleteCourse } from "@/app/actions/courses";

type DeleteCourseDialogProps = {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteCourseDialog({
  isOpen,
  course,
  onClose,
  onSuccess,
}: DeleteCourseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !course) return null;

  const performDelete = async () => {
    try {
      const res = await deleteCourse(course.id);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message || "Failed to delete course.");
      }
    } catch (err) {
      console.error("Failed to delete course:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => !isDeleting && onClose()}
        aria-hidden
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-[var(--color-text)] leading-snug">
              Delete {course.name}?
            </h3>
            <p className="mt-1.5 text-[13px] text-[var(--color-text-2)] leading-relaxed">
              This course will be permanently removed from your account. Any associated data will also be deleted.
            </p>

            {errorMessage && (
              <div className="mt-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-2.5 text-[12.5px] text-red-700 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[13.5px] font-medium text-white shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 min-w-[90px]"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
