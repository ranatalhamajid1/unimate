"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check } from "lucide-react";
import {
  Course,
  CourseFormValues,
  CourseFormState,
  COURSE_COLOR_PRESETS,
  DEFAULT_COURSE_COLOR,
  validateCourse,
} from "@/app/lib/course-definitions";
import { createCourse, updateCourse } from "@/app/actions/courses";

type CourseDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseToEdit?: Course | null;
};

export function CourseDialog({
  isOpen,
  onClose,
  onSuccess,
  courseToEdit,
}: CourseDialogProps) {
  const isEditing = Boolean(courseToEdit);

  // Form State
  const [formData, setFormData] = useState<CourseFormValues>({
    name: "",
    code: "",
    instructor: "",
    creditHours: 3,
    semester: "Fall 2026",
    color: DEFAULT_COURSE_COLOR,
  });

  const [errors, setErrors] = useState<NonNullable<CourseFormState>["errors"]>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when dialog opens or courseToEdit changes
  useEffect(() => {
    if (courseToEdit) {
      setFormData({
        name: courseToEdit.name,
        code: courseToEdit.code,
        instructor: courseToEdit.instructor || "",
        creditHours: courseToEdit.creditHours,
        semester: courseToEdit.semester || "",
        color: courseToEdit.color || DEFAULT_COURSE_COLOR,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        instructor: "",
        creditHours: 3,
        semester: "Fall 2026",
        color: DEFAULT_COURSE_COLOR,
      });
    }
    setErrors({});
    setServerMessage(null);
  }, [courseToEdit, isOpen]);

  // Handle ESC key to close
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

    // Build FormData
    const data = new FormData();
    data.set("name", formData.name);
    data.set("code", formData.code);
    data.set("instructor", formData.instructor);
    data.set("creditHours", String(formData.creditHours));
    data.set("semester", formData.semester);
    data.set("color", formData.color);

    // Client-side quick validation
    const clientValidation = validateCourse(data);
    if (!clientValidation.success) {
      setErrors(clientValidation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let res: CourseFormState;
      if (isEditing && courseToEdit) {
        res = await updateCourse(courseToEdit.id, undefined, data);
      } else {
        res = await createCourse(undefined, data);
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
      console.error("Course submission error:", err);
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

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900">
              {isEditing ? "Edit Course" : "Add New Course"}
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {isEditing
                ? "Update the details for this course."
                : "Fill in the details below to add a course to your semester."}
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

        {/* Global Error Banner */}
        {serverMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
            {serverMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Course Name */}
          <div>
            <label
              htmlFor="course-name"
              className="block text-[13px] font-medium text-slate-700"
            >
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              id="course-name"
              type="text"
              placeholder="e.g. Digital Logic Design"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                errors?.name
                  ? "border-red-400 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-600"
              }`}
            />
            {errors?.name && (
              <p className="mt-1 text-[12px] text-red-600">{errors.name[0]}</p>
            )}
          </div>

          {/* Grid for Code & Credit Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course Code */}
            <div>
              <label
                htmlFor="course-code"
                className="block text-[13px] font-medium text-slate-700"
              >
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                id="course-code"
                type="text"
                placeholder="e.g. DLD-301"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 uppercase ${
                  errors?.code
                    ? "border-red-400 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-600"
                }`}
              />
              {errors?.code && (
                <p className="mt-1 text-[12px] text-red-600">{errors.code[0]}</p>
              )}
            </div>

            {/* Credit Hours */}
            <div>
              <label
                htmlFor="credit-hours"
                className="block text-[13px] font-medium text-slate-700"
              >
                Credit Hours <span className="text-red-500">*</span>
              </label>
              <select
                id="credit-hours"
                value={formData.creditHours}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    creditHours: Number(e.target.value),
                  }))
                }
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white ${
                  errors?.creditHours
                    ? "border-red-400 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-600"
                }`}
              >
                <option value={1}>1 Credit Hour</option>
                <option value={2}>2 Credit Hours</option>
                <option value={3}>3 Credit Hours</option>
                <option value={4}>4 Credit Hours</option>
                <option value={5}>5 Credit Hours</option>
                <option value={6}>6 Credit Hours</option>
              </select>
              {errors?.creditHours && (
                <p className="mt-1 text-[12px] text-red-600">
                  {errors.creditHours[0]}
                </p>
              )}
            </div>
          </div>

          {/* Grid for Instructor & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Instructor */}
            <div>
              <label
                htmlFor="instructor"
                className="block text-[13px] font-medium text-slate-700"
              >
                Instructor <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="instructor"
                type="text"
                placeholder="e.g. Dr. Ahmed"
                value={formData.instructor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    instructor: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors?.instructor && (
                <p className="mt-1 text-[12px] text-red-600">
                  {errors.instructor[0]}
                </p>
              )}
            </div>

            {/* Semester */}
            <div>
              <label
                htmlFor="semester"
                className="block text-[13px] font-medium text-slate-700"
              >
                Semester <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="semester"
                type="text"
                placeholder="e.g. Fall 2026"
                value={formData.semester}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    semester: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors?.semester && (
                <p className="mt-1 text-[12px] text-red-600">
                  {errors.semester[0]}
                </p>
              )}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-2">
              Course Color Indicator
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COURSE_COLOR_PRESETS.map((preset) => {
                const isSelected = formData.color.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color: preset.value }))
                    }
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none ring-2 ring-offset-2 ${
                      isSelected ? "ring-slate-900 shadow-sm" : "ring-transparent"
                    }`}
                    style={{
                      backgroundColor: preset.value,
                    }}
                    title={preset.label}
                    aria-label={`Select ${preset.label} color`}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
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
                "Add Course"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
