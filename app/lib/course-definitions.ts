/**
 * Course type definitions and validation schemas.
 */

export type Course = {
  id: string;
  userId: string;
  name: string;
  code: string;
  instructor: string;
  creditHours: number;
  semester: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseFormValues = {
  name: string;
  code: string;
  instructor: string;
  creditHours: number;
  semester: string;
  color: string;
};

export type CourseFormState = {
  errors?: {
    name?: string[];
    code?: string[];
    instructor?: string[];
    creditHours?: string[];
    semester?: string[];
    color?: string[];
  };
  message?: string;
  success?: boolean;
} | undefined;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: NonNullable<CourseFormState>["errors"] };

export const COURSE_COLOR_PRESETS = [
  { label: "Blue", value: "#2563eb", bg: "bg-blue-600", lightBg: "bg-blue-50", text: "text-blue-700" },
  { label: "Indigo", value: "#4f46e5", bg: "bg-indigo-600", lightBg: "bg-indigo-50", text: "text-indigo-700" },
  { label: "Purple", value: "#7c3aed", bg: "bg-purple-600", lightBg: "bg-purple-50", text: "text-purple-700" },
  { label: "Emerald", value: "#059669", bg: "bg-emerald-600", lightBg: "bg-emerald-50", text: "text-emerald-700" },
  { label: "Amber", value: "#d97706", bg: "bg-amber-600", lightBg: "bg-amber-50", text: "text-amber-700" },
  { label: "Rose", value: "#e11d48", bg: "bg-rose-600", lightBg: "bg-rose-50", text: "text-rose-700" },
  { label: "Sky", value: "#0284c7", bg: "bg-sky-600", lightBg: "bg-sky-50", text: "text-sky-700" },
  { label: "Teal", value: "#0d9488", bg: "bg-teal-600", lightBg: "bg-teal-50", text: "text-teal-700" },
];

export const DEFAULT_COURSE_COLOR = "#2563eb";

export function validateCourse(formData: FormData): ValidationResult<CourseFormValues> {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const instructor = String(formData.get("instructor") ?? "").trim();
  const creditHoursRaw = formData.get("creditHours");
  const semester = String(formData.get("semester") ?? "").trim();
  const color = String(formData.get("color") ?? DEFAULT_COURSE_COLOR).trim();

  const errors: NonNullable<CourseFormState>["errors"] = {};

  // 1. Course Name (Required, 2-100 chars)
  if (!name) {
    errors.name = ["Course name is required."];
  } else if (name.length < 2) {
    errors.name = ["Course name must be at least 2 characters."];
  } else if (name.length > 100) {
    errors.name = ["Course name cannot exceed 100 characters."];
  }

  // 2. Course Code (Required, 2-20 chars)
  if (!code) {
    errors.code = ["Course code is required."];
  } else if (code.length < 2) {
    errors.code = ["Course code must be at least 2 characters."];
  } else if (code.length > 20) {
    errors.code = ["Course code cannot exceed 20 characters."];
  }

  // 3. Instructor (Optional, max 100 chars)
  if (instructor && instructor.length > 100) {
    errors.instructor = ["Instructor name cannot exceed 100 characters."];
  }

  // 4. Credit Hours (Required, integer 1-6)
  const creditHours = Number(creditHoursRaw);
  if (!creditHoursRaw || isNaN(creditHours)) {
    errors.creditHours = ["Credit hours is required."];
  } else if (!Number.isInteger(creditHours) || creditHours < 1 || creditHours > 6) {
    errors.creditHours = ["Credit hours must be an integer between 1 and 6."];
  }

  // 5. Semester (Optional, max 50 chars)
  if (semester && semester.length > 50) {
    errors.semester = ["Semester cannot exceed 50 characters."];
  }

  // 6. Color (Valid hex format)
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const validatedColor = hexColorRegex.test(color) ? color : DEFAULT_COURSE_COLOR;

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      code,
      instructor,
      creditHours,
      semester,
      color: validatedColor,
    },
  };
}
