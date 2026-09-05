"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Loader2, BookOpen } from "lucide-react";
import {
  Exam,
  ExamFormState,
  EXAM_TYPES,
  EXAM_TYPE_CONFIG,
  ExamType,
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
  onClose: () => void;
  onSuccess: () => void;
  courses: CourseOption[];
  examToEdit?: Exam | null;
};

export function ExamDialog({
  isOpen,
  onClose,
  onSuccess,
  courses,
  examToEdit,
}: ExamDialogProps) {
  const isEditing = Boolean(examToEdit);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    courseId: courses[0]?.id || "",
    type: EXAM_TYPES.FINAL as ExamType,
    date: "",
    time: "10:00",
    room: "",
    preparationProgress: 0,
    notes: "",
  });

  const [errors, setErrors] = useState<NonNullable<ExamFormState>["errors"]>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helpers to split DateTime into Date and Time strings
  function formatDateString(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatTimeString(date: Date): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Populate or reset form
  useEffect(() => {
    if (examToEdit) {
      setFormData({
        title: examToEdit.title,
        courseId: examToEdit.courseId,
        type: examToEdit.type as ExamType,
        date: formatDateString(new Date(examToEdit.examDate)),
        time: formatTimeString(new Date(examToEdit.examDate)),
        room: examToEdit.room || "",
        preparationProgress: examToEdit.preparationProgress || 0,
        notes: examToEdit.notes || "",
      });
    } else {
      // Default date: 14 days from today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);

      setFormData({
        title: "",
        courseId: courses[0]?.id || "",
        type: EXAM_TYPES.FINAL,
        date: formatDateString(defaultDate),
        time: "10:00",
        room: "",
        preparationProgress: 0,
        notes: "",
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
    data.set("room", formData.room);
    data.set("preparationProgress", String(formData.preparationProgress));
    data.set("notes", formData.notes);

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
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900">
              {isEditing ? "Edit Exam" : "Schedule New Exam"}
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {isEditing
                ? "Update exam date, time, and preparation progress."
                : "Add an upcoming midterm, final, or quiz to your schedule."}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* If no courses exist */}
        {courses.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-slate-900">
              No Courses Added Yet
            </h3>
            <p className="mt-1 max-w-xs text-[13px] text-slate-500">
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
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
                {serverMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Exam Title */}
              <div>
                <label
                  htmlFor="exam-title"
                  className="block text-[13px] font-medium text-slate-700"
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
                  className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                    errors?.title
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-200 focus:border-blue-600"
                  }`}
                />
                {errors?.title && (
                  <p className="mt-1 text-[12px] text-red-600">{errors.title[0]}</p>
                )}
              </div>

              {/* Grid: Course & Exam Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Course Selection */}
                <div>
                  <label
                    htmlFor="exam-course"
                    className="block text-[13px] font-medium text-slate-700"
                  >
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="exam-course"
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, courseId: e.target.value }))
                    }
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white ${
                      errors?.courseId
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-blue-600"
                    }`}
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                  {errors?.courseId && (
                    <p className="mt-1 text-[12px] text-red-600">
                      {errors.courseId[0]}
                    </p>
                  )}
                </div>

                {/* Exam Type */}
                <div>
                  <label
                    htmlFor="exam-type"
                    className="block text-[13px] font-medium text-slate-700"
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
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[14px] text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white"
                  >
                    {Object.values(EXAM_TYPES).map((t) => (
                      <option key={t} value={t}>
                        {EXAM_TYPE_CONFIG[t].label}
                      </option>
                    ))}
                  </select>
                  {errors?.type && (
                    <p className="mt-1 text-[12px] text-red-600">{errors.type[0]}</p>
                  )}
                </div>
              </div>

              {/* Grid: Exam Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label
                    htmlFor="exam-date"
                    className="block text-[13px] font-medium text-slate-700"
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
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white ${
                      errors?.date
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-blue-600"
                    }`}
                  />
                  {errors?.date && (
                    <p className="mt-1 text-[12px] text-red-600">{errors.date[0]}</p>
                  )}
                </div>

                {/* Time */}
                <div>
                  <label
                    htmlFor="exam-time"
                    className="block text-[13px] font-medium text-slate-700"
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
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white ${
                      errors?.time
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-blue-600"
                    }`}
                  />
                  {errors?.time && (
                    <p className="mt-1 text-[12px] text-red-600">{errors.time[0]}</p>
                  )}
                </div>
              </div>

              {/* Room (Optional) */}
              <div>
                <label
                  htmlFor="exam-room"
                  className="block text-[13px] font-medium text-slate-700"
                >
                  Room / Hall <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="exam-room"
                  type="text"
                  placeholder="e.g. Room B-204 or Exam Hall 1"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, room: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors?.room && (
                  <p className="mt-1 text-[12px] text-red-600">{errors.room[0]}</p>
                )}
              </div>

              {/* Preparation Progress Slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="exam-prep"
                    className="block text-[13px] font-medium text-slate-700"
                  >
                    Preparation Progress
                  </label>
                  <span className="text-[13px] font-semibold text-blue-600">
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
                  <p className="mt-1 text-[12px] text-red-600">
                    {errors.preparationProgress[0]}
                  </p>
                )}
              </div>

              {/* Notes (Optional) */}
              <div>
                <label
                  htmlFor="exam-notes"
                  className="block text-[13px] font-medium text-slate-700"
                >
                  Notes & Focus Topics <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="exam-notes"
                  rows={2}
                  placeholder="e.g. Chapters 1-5, bring calculator, formula sheet allowed..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors?.notes && (
                  <p className="mt-1 text-[12px] text-red-600">{errors.notes[0]}</p>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
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
