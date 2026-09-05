"use client";

import { useState, useEffect } from "react";
import { X, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  TimetableEntry,
  TimetableFormValues,
  TimetableFormState,
  DAYS_OF_WEEK,
  CLASS_TYPES,
  validateTimetable,
} from "@/app/lib/timetable-definitions";
import {
  createTimetableEntry,
  updateTimetableEntry,
} from "@/app/actions/timetable";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type TimetableDialogProps = {
  isOpen: boolean;
  courses: CourseOption[];
  onClose: () => void;
  onSuccess: () => void;
  entryToEdit?: TimetableEntry | null;
  defaultDay?: number;
};

export function TimetableDialog({
  isOpen,
  courses,
  onClose,
  onSuccess,
  entryToEdit,
  defaultDay = 1,
}: TimetableDialogProps) {
  const isEditing = Boolean(entryToEdit);

  // Default selection
  const defaultCourseId = courses[0]?.id || "";

  // Form State
  const [formData, setFormData] = useState<TimetableFormValues>({
    courseId: defaultCourseId,
    dayOfWeek: defaultDay,
    startTime: "09:00",
    endTime: "10:30",
    room: "",
    type: "Lecture",
  });

  const [errors, setErrors] = useState<
    NonNullable<TimetableFormState>["errors"]
  >({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (entryToEdit) {
      setFormData({
        courseId: entryToEdit.courseId,
        dayOfWeek: entryToEdit.dayOfWeek,
        startTime: entryToEdit.startTime,
        endTime: entryToEdit.endTime,
        room: entryToEdit.room || "",
        type: entryToEdit.type || "Lecture",
      });
    } else {
      setFormData({
        courseId: courses[0]?.id || "",
        dayOfWeek: defaultDay,
        startTime: "09:00",
        endTime: "10:30",
        room: "",
        type: "Lecture",
      });
    }
    setErrors({});
    setServerMessage(null);
  }, [entryToEdit, isOpen, courses, defaultDay]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerMessage(null);

    const data = new FormData();
    data.set("courseId", formData.courseId);
    data.set("dayOfWeek", String(formData.dayOfWeek));
    data.set("startTime", formData.startTime);
    data.set("endTime", formData.endTime);
    data.set("room", formData.room || "");
    data.set("type", formData.type || "Lecture");

    const clientValidation = validateTimetable(data);
    if (!clientValidation.success) {
      setErrors(clientValidation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let res: TimetableFormState;
      if (isEditing && entryToEdit) {
        res = await updateTimetableEntry(entryToEdit.id, undefined, data);
      } else {
        res = await createTimetableEntry(undefined, data);
      }

      if (res?.success) {
        onSuccess();
        onClose();
      } else {
        if (res?.errors) {
          setErrors(res.errors);
        }
        if (res?.message) {
          setServerMessage(res.message);
        }
      }
    } catch (err) {
      console.error("Timetable submission error:", err);
      setServerMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
              {isEditing ? "Edit Class" : "Add Class to Schedule"}
            </h2>
            <p className="text-[13px] text-[var(--color-text-2)] mt-0.5">
              {isEditing
                ? "Update timetable schedule details."
                : "Schedule a lecture, lab, or tutorial in your weekly timetable."}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* If no courses exist, prompt student to add course first */}
        {courses.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-[var(--color-text)]">
              No Courses Added Yet
            </h3>
            <p className="mt-1 max-w-xs text-[13px] text-[var(--color-text-2)]">
              You must add at least one course before scheduling timetable classes.
            </p>
            <Link
              href="/dashboard/courses"
              onClick={onClose}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-medium text-white shadow-xs hover:bg-blue-700"
            >
              Go to Courses
            </Link>
          </div>
        ) : (
          <>
            {/* Global Error Banner (Overlap or database message) */}
            {serverMessage && (
              <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-[13px] text-red-700 dark:text-red-300">
                {serverMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Course Selection */}
              <div>
                <label
                  htmlFor="timetable-course"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  id="timetable-course"
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, courseId: e.target.value }))
                  }
                  className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)] ${
                    errors?.courseId
                      ? "border-red-400 focus:border-red-500"
                      : "border-[var(--color-border)] focus:border-blue-600"
                  }`}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>
                {errors?.courseId && (
                  <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                    {errors.courseId[0]}
                  </p>
                )}
              </div>

              {/* Grid: Day & Class Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Day of Week */}
                <div>
                  <label
                    htmlFor="timetable-day"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Day <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="timetable-day"
                    value={formData.dayOfWeek}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dayOfWeek: Number(e.target.value),
                      }))
                    }
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)] ${
                      errors?.dayOfWeek
                        ? "border-red-400 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-blue-600"
                    }`}
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {errors?.dayOfWeek && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                      {errors.dayOfWeek[0]}
                    </p>
                  )}
                </div>

                {/* Class Type */}
                <div>
                  <label
                    htmlFor="timetable-type"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Class Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="timetable-type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)]"
                  >
                    {CLASS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors?.type && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.type[0]}</p>
                  )}
                </div>
              </div>

              {/* Grid: Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <label
                    htmlFor="timetable-start"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="timetable-start"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)] ${
                      errors?.startTime
                        ? "border-red-400 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-blue-600"
                    }`}
                  />
                  {errors?.startTime && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                      {errors.startTime[0]}
                    </p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label
                    htmlFor="timetable-end"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="timetable-end"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)] ${
                      errors?.endTime
                        ? "border-red-400 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-blue-600"
                    }`}
                  />
                  {errors?.endTime && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                      {errors.endTime[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Room (Optional) */}
              <div>
                <label
                  htmlFor="timetable-room"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Room / Location <span className="text-[var(--color-text-3)] font-normal">(Optional)</span>
                </label>
                <input
                  id="timetable-room"
                  type="text"
                  placeholder="e.g. Room B-204 or Lab 3"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, room: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-3)] bg-[var(--color-surface-2)] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors?.room && (
                  <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.room[0]}</p>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-[13.5px] font-medium text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50 min-w-[110px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Save Changes"
                  ) : (
                    "Add Class"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
