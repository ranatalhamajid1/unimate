"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { TimetableEntry, DAYS_OF_WEEK } from "@/app/lib/timetable-definitions";
import { deleteTimetableEntry } from "@/app/actions/timetable";

type DeleteTimetableDialogProps = {
  isOpen: boolean;
  entry: TimetableEntry | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteTimetableDialog({
  isOpen,
  entry,
  onClose,
  onSuccess,
}: DeleteTimetableDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const dayName = DAYS_OF_WEEK.find((d) => d.id === entry.dayOfWeek)?.name || "Scheduled day";

  async function handleDelete() {
    if (!entry) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await deleteTimetableEntry(entry.id);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message || "Failed to delete class.");
      }
    } catch (err) {
      console.error("Failed to delete timetable entry:", err);
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
              Delete this class?
            </h3>
            <p className="mt-1 text-[13px] text-slate-600 font-medium">
              {entry.course?.code ? `${entry.course.code} — ` : ""}{entry.course?.name || "Class"} ({dayName}, {entry.startTime} – {entry.endTime})
            </p>
            <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
              This timetable entry will be permanently removed from your weekly schedule.
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
