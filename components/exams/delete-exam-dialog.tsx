"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Exam } from "@/app/lib/exam-definitions";
import { deleteExam } from "@/app/actions/exams";

type DeleteExamDialogProps = {
  isOpen: boolean;
  exam: Exam | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteExamDialog({
  isOpen,
  exam,
  onClose,
  onSuccess,
}: DeleteExamDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !exam) return null;

  async function handleDelete() {
    if (!exam) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await deleteExam(exam.id);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message || "Failed to delete exam.");
      }
    } catch (err) {
      console.error("Failed to delete exam:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => !isDeleting && onClose()}
        aria-hidden
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-slate-900 leading-snug">
              Delete this exam?
            </h3>
            <p className="mt-1 text-[13px] text-slate-700 font-medium line-clamp-1">
              {exam.title}
            </p>
            <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
              This exam will be permanently removed from your dashboard and countdowns.
            </p>

            {errorMessage && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[12.5px] text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
