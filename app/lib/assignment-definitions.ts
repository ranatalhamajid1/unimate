/**
 * Assignment type definitions, centralized constants, date helpers, and validation schemas.
 */

// ---------------------------------------------------------------------------
// Centralized Status & Priority Constants
// ---------------------------------------------------------------------------

export const ASSIGNMENT_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type AssignmentStatus =
  (typeof ASSIGNMENT_STATUSES)[keyof typeof ASSIGNMENT_STATUSES];

export const STATUS_CONFIG: Record<
  AssignmentStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
};

export const ASSIGNMENT_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type AssignmentPriority =
  (typeof ASSIGNMENT_PRIORITIES)[keyof typeof ASSIGNMENT_PRIORITIES];

export const PRIORITY_CONFIG: Record<
  AssignmentPriority,
  { label: string; badgeClass: string }
> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-600",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/60",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-red-50 text-red-700 border border-red-200/60 font-semibold",
  },
};

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export type Assignment = {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
};

export type AssignmentFormValues = {
  title: string;
  courseId: string;
  description: string;
  dueDate: Date;
  priority: AssignmentPriority;
  status: AssignmentStatus;
};

export type AssignmentFormState = {
  errors?: {
    title?: string[];
    courseId?: string[];
    description?: string[];
    dueDate?: string[];
    priority?: string[];
    status?: string[];
  };
  message?: string;
  success?: boolean;
} | undefined;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: NonNullable<AssignmentFormState>["errors"] };

// ---------------------------------------------------------------------------
// Date & Deadline Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether an assignment is overdue.
 * CRITICAL: Completed assignments are never overdue.
 */
export function isAssignmentOverdue(dueDate: Date, status: string): boolean {
  if (status === ASSIGNMENT_STATUSES.COMPLETED) return false;
  const now = new Date();
  // Strip time for end-of-day comparison
  const endOfDueDay = new Date(dueDate);
  endOfDueDay.setHours(23, 59, 59, 999);
  return endOfDueDay < now;
}

/**
 * Check whether an assignment is due today.
 */
export function isAssignmentDueToday(dueDate: Date): boolean {
  const now = new Date();
  const d = new Date(dueDate);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Check whether an assignment is due tomorrow.
 */
export function isAssignmentDueTomorrow(dueDate: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dueDate);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

/**
 * Check whether an assignment is due within the current week (from now to Sunday night).
 */
export function isAssignmentDueThisWeek(dueDate: Date, status: string): boolean {
  if (status === ASSIGNMENT_STATUSES.COMPLETED) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(now);
  const day = now.getDay(); // 0 = Sun, 1 = Mon ...
  const diffToSunday = day === 0 ? 0 : 7 - day;
  endOfWeek.setDate(now.getDate() + diffToSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  const d = new Date(dueDate);
  return d >= now && d <= endOfWeek;
}

/**
 * Format due date for human reading: "Due today", "Due tomorrow", "Overdue", or "Sep 12".
 */
export function formatDueLabel(dueDate: Date, status: string): {
  text: string;
  isOverdue: boolean;
  isSoon: boolean;
} {
  const overdue = isAssignmentOverdue(dueDate, status);
  if (overdue) {
    return { text: "Overdue", isOverdue: true, isSoon: true };
  }

  if (isAssignmentDueToday(dueDate)) {
    return { text: "Due today", isOverdue: false, isSoon: true };
  }

  if (isAssignmentDueTomorrow(dueDate)) {
    return { text: "Due tomorrow", isOverdue: false, isSoon: true };
  }

  const d = new Date(dueDate);
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return {
    text: `Due ${formatted}`,
    isOverdue: false,
    isSoon: isAssignmentDueThisWeek(dueDate, status),
  };
}

// ---------------------------------------------------------------------------
// Form Validation
// ---------------------------------------------------------------------------

export function validateAssignment(formData: FormData): ValidationResult<AssignmentFormValues> {
  const title = String(formData.get("title") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? ASSIGNMENT_PRIORITIES.MEDIUM).trim().toUpperCase();
  const statusRaw = String(formData.get("status") ?? ASSIGNMENT_STATUSES.NOT_STARTED).trim().toUpperCase();

  const errors: NonNullable<AssignmentFormState>["errors"] = {};

  // 1. Title (Required, 2-120 chars)
  if (!title) {
    errors.title = ["Assignment title is required."];
  } else if (title.length < 2) {
    errors.title = ["Title must be at least 2 characters."];
  } else if (title.length > 120) {
    errors.title = ["Title cannot exceed 120 characters."];
  }

  // 2. Course ID (Required)
  if (!courseId) {
    errors.courseId = ["Please select a course."];
  }

  // 3. Description (Optional, max 500 chars)
  if (description && description.length > 500) {
    errors.description = ["Description cannot exceed 500 characters."];
  }

  // 4. Due Date (Required, valid ISO date string)
  if (!dueDateRaw) {
    errors.dueDate = ["Due date is required."];
  }
  const parsedDate = new Date(dueDateRaw);
  if (isNaN(parsedDate.getTime())) {
    errors.dueDate = ["Please enter a valid due date."];
  }

  // 5. Priority (Required, enum)
  const validPriorities = Object.values(ASSIGNMENT_PRIORITIES);
  if (!validPriorities.includes(priorityRaw as AssignmentPriority)) {
    errors.priority = [`Priority must be one of: ${validPriorities.join(", ")}.`];
  }

  // 6. Status (Required, enum)
  const validStatuses = Object.values(ASSIGNMENT_STATUSES);
  if (!validStatuses.includes(statusRaw as AssignmentStatus)) {
    errors.status = [`Status must be one of: ${validStatuses.join(", ")}.`];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      courseId,
      description,
      dueDate: parsedDate,
      priority: priorityRaw as AssignmentPriority,
      status: statusRaw as AssignmentStatus,
    },
  };
}
