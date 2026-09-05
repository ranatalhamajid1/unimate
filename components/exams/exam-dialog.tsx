"use client";

import { useState, useEffect } from "react";
import { X, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  Exam,
  ExamFormState,
  EXAM_TYPES,
  EXAM_STATUSES,
  EXAM_TYPE_CONFIG,
  ExamType,
  ExamStatus,
  validateExam,
} from "@/app/lib/exam-definitions";
import { createExam, updateExam } from "@/app/actions/exams";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type ExamDialogProps = {
  isOpen: boolean;
  courses: CourseOption[];
  onClose: () => void;
  onSuccess: () => void;
  examToEdit?: Exam | null;
};

type DialogExamFormValues = {
  title: string;
  courseId: string;
  type: ExamType;
  date: string;
  time: string;
  room: string;
  notes: string;
  preparationProgress: number;
  status: ExamStatus;
};

// Default dates helper
const defaultExamDate = () => {
  const twoWeeks = new Date();
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  return twoWeeks.toISOString().split("T")[0];
};

// Helper to split Date into YYYY-MM-DD and HH:MM
const parseExamDateTime = (dateVal: Date | string) => {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return { date: defaultExamDate(), time: "09:00" };
  }
  const dateStr = d.toISOString().split("T")[0];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return { date: dateStr, time: `${hours}:${minutes}` };
};

export function ExamDialog({
  isOpen,
  courses,
  onClose,
  onSuccess,
  examToEdit,
}: ExamDialogProps) {
  const isEditing = Boolean(examToEdit);
  const defaultCourseId = courses[0]?.id || "";

  // Form State
  const [formData, setFormData] = useState<DialogExamFormValues>({
    title: "",
    courseId: defaultCourseId,
    type: EXAM_TYPES.FINAL,
    date: defaultExamDate(),
    time: "09:00",
    room: "",
    notes: "",
    preparationProgress: 0,
    status: EXAM_STATUSES.UPCOMING,
  });

  const [errors, setErrors] = useState<NonNullable<ExamFormState>["errors"]>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (examToEdit) {
      const { date, time } = parseExamDateTime(examToEdit.examDate);
      setFormData({
        title: examToEdit.title,
        courseId: examToEdit.courseId,
        type: examToEdit.type as ExamType,
        date,
        time,
        room: examToEdit.room || "",
        notes: examToEdit.notes || "",
        preparationProgress: examToEdit.preparationProgress,
        status: examToEdit.status as ExamStatus,
      });
    } else {
      setFormData({
        title: "",
        courseId: courses[0]?.id || "",
        type: EXAM_TYPES.FINAL,
        date: defaultExamDate(),
        time: "09:00",
        room: "",
        notes: "",
        preparationProgress: 0,
        status: EXAM_STATUSES.UPCOMING,
      });
    }
    setErrors({});
    setServerMessage(null);
  }, [examToEdit, isOpen, courses]);

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
    data.set("title", formData.title);
    data.set("courseId", formData.courseId);
    data.set("type", formData.type);
    data.set("date", formData.date);
    data.set("time", formData.time);
    data.set("room", formData.room || "");
    data.set("notes", formData.notes || "");
    data.set("preparationProgress", String(formData.preparationProgress));
    data.set("status", formData.status);

    const clientValidation = validateExam(data);
    if (!clientValidation.success) {
      setErrors(clientValidation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let res: ExamFormState;
      if (isEditing && examToEdit) {
        res = await updateExam(examToEdit.id, undefined, data);
      } else {
        res = await createExam(undefined, data);
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
      console.error("Exam submission error:", err);
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
              {isEditing ? "Edit Exam" : "Schedule New Exam"}
            </h2>
            <p className="text-[13px] text-[var(--color-text-2)] mt-0.5">
              {isEditing
                ? "Update exam date, time, and preparation progress."
                : "Add an upcoming midterm, final, or quiz to your schedule."}
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

        {/* If no courses exist */}
        {courses.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-[var(--color-text)]">
              No Courses Added Yet
            </h3>
            <p className="mt-1 max-w-xs text-[13px] text-[var(--color-text-2)]">
              Exams must be associated with a course. Please add a course first.
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
            {/* Global Error Banner */}
            {serverMessage && (
              <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-[13px] text-red-700 dark:text-red-300">
                {serverMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Exam Title */}
              <div>
                <label
                  htmlFor="exam-title"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="exam-title"
                  type="text"
                  placeholder="e.g. Digital Logic Design Final or Midterm 1"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-3)] bg-[var(--color-surface-2)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                    errors?.title
                      ? "border-red-400 focus:border-red-500"
                      : "border-[var(--color-border)] focus:border-blue-600"
                  }`}
                />
                {errors?.title && (
                  <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.title[0]}</p>
                )}
              </div>

              {/* Grid: Course & Exam Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Course Selection */}
                <div>
                  <label
                    htmlFor="exam-course"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="exam-course"
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

                {/* Exam Type */}
                <div>
                  <label
                    htmlFor="exam-type"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Exam Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="exam-type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as ExamType,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)]"
                  >
                    {Object.values(EXAM_TYPES).map((t) => (
                      <option key={t} value={t}>
                        {EXAM_TYPE_CONFIG[t].label}
                      </option>
                    ))}
                  </select>
                  {errors?.type && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.type[0]}</p>
                  )}
                </div>
              </div>

              {/* Grid: Exam Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label
                    htmlFor="exam-date"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Exam Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="exam-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)] ${
                      errors?.date
                        ? "border-red-400 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-blue-600"
                    }`}
                  />
                  {errors?.date && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.date[0]}</p>
                  )}
                </div>

                {/* Time */}
                <div>
                  <label
                    htmlFor="exam-time"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="exam-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)] ${
                      errors?.time
                        ? "border-red-400 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-blue-600"
                    }`}
                  />
                  {errors?.time && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.time[0]}</p>
                  )}
                </div>
              </div>

              {/* Room (Optional) */}
              <div>
                <label
                  htmlFor="exam-room"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Room / Hall <span className="text-[var(--color-text-3)] font-normal">(Optional)</span>
                </label>
                <input
                  id="exam-room"
                  type="text"
                  placeholder="e.g. Room B-204 or Exam Hall 1"
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

              {/* Preparation Progress Slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="exam-prep"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Preparation Progress
                  </label>
                  <span className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">
                    {formData.preparationProgress}%
                  </span>
                </div>
                <input
                  id="exam-prep"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formData.preparationProgress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preparationProgress: Number(e.target.value),
                    }))
                  }
                  className="mt-2 w-full accent-blue-600"
                />
                {errors?.preparationProgress && (
                  <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                    {errors.preparationProgress[0]}
                  </p>
                )}
              </div>

              {/* Notes (Optional) */}
              <div>
                <label
                  htmlFor="exam-notes"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Notes & Focus Topics <span className="text-[var(--color-text-3)] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="exam-notes"
                  rows={2}
                  placeholder="e.g. Chapters 1-5, bring calculator, formula sheet allowed..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-3)] bg-[var(--color-surface-2)] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors?.notes && (
                  <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.notes[0]}</p>
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
                    "Schedule Exam"
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
