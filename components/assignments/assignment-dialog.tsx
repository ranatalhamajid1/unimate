"use client";

import { useState, useEffect } from "react";
import { X, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  Assignment,
  AssignmentFormState,
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_PRIORITIES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  AssignmentStatus,
  AssignmentPriority,
  validateAssignment,
} from "@/app/lib/assignment-definitions";
import {
  createAssignment,
  updateAssignment,
} from "@/app/actions/assignments";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type AssignmentDialogProps = {
  isOpen: boolean;
  courses: CourseOption[];
  onClose: () => void;
  onSuccess: () => void;
  assignmentToEdit?: Assignment | null;
};

type DialogFormValues = {
  title: string;
  courseId: string;
  description: string;
  dueDate: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
};

export function AssignmentDialog({
  isOpen,
  courses,
  onClose,
  onSuccess,
  assignmentToEdit,
}: AssignmentDialogProps) {
  const isEditing = Boolean(assignmentToEdit);

  // Default course selection
  const defaultCourseId = courses[0]?.id || "";

  // Helper to format ISO to date input YYYY-MM-DD
  const formatInputDate = (d: Date | string) => {
    try {
      const date = new Date(d);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const defaultDueDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  };

  // Form State
  const [formData, setFormData] = useState<DialogFormValues>({
    title: "",
    courseId: defaultCourseId,
    dueDate: defaultDueDate(),
    priority: ASSIGNMENT_PRIORITIES.MEDIUM,
    status: ASSIGNMENT_STATUSES.NOT_STARTED,
    description: "",
  });

  const [errors, setErrors] = useState<
    NonNullable<AssignmentFormState>["errors"]
  >({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (assignmentToEdit) {
      setFormData({
        title: assignmentToEdit.title,
        courseId: assignmentToEdit.courseId,
        dueDate: formatInputDate(assignmentToEdit.dueDate),
        priority: assignmentToEdit.priority as AssignmentPriority,
        status: assignmentToEdit.status as AssignmentStatus,
        description: assignmentToEdit.description || "",
      });
    } else {
      setFormData({
        title: "",
        courseId: courses[0]?.id || "",
        dueDate: defaultDueDate(),
        priority: ASSIGNMENT_PRIORITIES.MEDIUM,
        status: ASSIGNMENT_STATUSES.NOT_STARTED,
        description: "",
      });
    }
    setErrors({});
    setServerMessage(null);
  }, [assignmentToEdit, isOpen, courses]);

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
    data.set("dueDate", formData.dueDate);
    data.set("priority", formData.priority);
    data.set("status", formData.status);
    data.set("description", formData.description || "");

    const clientValidation = validateAssignment(data);
    if (!clientValidation.success) {
      setErrors(clientValidation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let res: AssignmentFormState;
      if (isEditing && assignmentToEdit) {
        res = await updateAssignment(assignmentToEdit.id, undefined, data);
      } else {
        res = await createAssignment(undefined, data);
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
      console.error("Assignment submission error:", err);
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
              {isEditing ? "Edit Assignment" : "Add New Assignment"}
            </h2>
            <p className="text-[13px] text-[var(--color-text-2)] mt-0.5">
              {isEditing
                ? "Update assignment details and due date."
                : "Create a task to stay on top of your coursework."}
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
              Assignments must be associated with a course. Please add a course first.
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
              {/* Assignment Title */}
              <div>
                <label
                  htmlFor="assignment-title"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="assignment-title"
                  type="text"
                  placeholder="e.g. DLD Lab 05 or Research Paper"
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

              {/* Course Selection */}
              <div>
                <label
                  htmlFor="assignment-course"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  id="assignment-course"
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

              {/* Grid: Due Date & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label
                    htmlFor="assignment-due"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="assignment-due"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)] ${
                      errors?.dueDate
                        ? "border-red-400 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-blue-600"
                    }`}
                  />
                  {errors?.dueDate && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                      {errors.dueDate[0]}
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor="assignment-priority"
                    className="block text-[13px] font-medium text-[var(--color-text)]"
                  >
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="assignment-priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as AssignmentPriority,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)]"
                  >
                    {Object.values(ASSIGNMENT_PRIORITIES).map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_CONFIG[p].label} Priority
                      </option>
                    ))}
                  </select>
                  {errors?.priority && (
                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                      {errors.priority[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="assignment-status"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="assignment-status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as AssignmentStatus,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-[14px] text-[var(--color-text)] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-[var(--color-surface-2)]"
                >
                  {Object.values(ASSIGNMENT_STATUSES).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
                {errors?.status && (
                  <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.status[0]}</p>
                )}
              </div>

              {/* Description (Optional) */}
              <div>
                <label
                  htmlFor="assignment-desc"
                  className="block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Description / Notes <span className="text-[var(--color-text-3)] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="assignment-desc"
                  rows={3}
                  placeholder="Details, requirements, submission portal links..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-3)] bg-[var(--color-surface-2)] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors?.description && (
                  <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">
                    {errors.description[0]}
                  </p>
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
                    "Add Assignment"
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
