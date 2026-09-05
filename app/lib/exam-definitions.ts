/**
 * Exam type definitions, centralized constants, date & countdown helpers, and validation schemas.
 */

// ---------------------------------------------------------------------------
// Centralized Enum Constants
// ---------------------------------------------------------------------------

export const EXAM_TYPES = {
  MIDTERM: "MIDTERM",
  FINAL: "FINAL",
  QUIZ: "QUIZ",
  OTHER: "OTHER",
} as const;

export type ExamType = (typeof EXAM_TYPES)[keyof typeof EXAM_TYPES];

export const EXAM_TYPE_CONFIG: Record<
  ExamType,
  { label: string; badgeClass: string }
> = {
  MIDTERM: {
    label: "Midterm Exam",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/60",
  },
  FINAL: {
    label: "Final Exam",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60 font-semibold",
  },
  QUIZ: {
    label: "Quiz",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60",
  },
  OTHER: {
    label: "Other Exam",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200/60",
  },
};

export const EXAM_STATUSES = {
  UPCOMING: "UPCOMING",
  COMPLETED: "COMPLETED",
} as const;

export type ExamStatus = (typeof EXAM_STATUSES)[keyof typeof EXAM_STATUSES];

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export type Exam = {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  examDate: Date;
  room: string;
  type: string;
  status: string;
  preparationProgress: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
};

export type ExamFormValues = {
  title: string;
  courseId: string;
  type: ExamType;
  examDate: Date;
  room: string;
  preparationProgress: number;
  notes: string;
  status: ExamStatus;
};

export type ExamFormState = {
  errors?: {
    title?: string[];
    courseId?: string[];
    type?: string[];
    date?: string[];
    time?: string[];
    room?: string[];
    preparationProgress?: string[];
    notes?: string[];
  };
  message?: string;
  success?: boolean;
} | undefined;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: NonNullable<ExamFormState>["errors"] };

// ---------------------------------------------------------------------------
// Date & Countdown Helpers
// ---------------------------------------------------------------------------

/**
 * Derives the effective status of an exam:
 * If examDate is in the past, it is COMPLETED.
 * Otherwise, it is UPCOMING.
 */
export function getEffectiveExamStatus(examDate: Date, manualStatus?: string): ExamStatus {
  if (manualStatus === EXAM_STATUSES.COMPLETED) return EXAM_STATUSES.COMPLETED;
  const now = new Date();
  return examDate < now ? EXAM_STATUSES.COMPLETED : EXAM_STATUSES.UPCOMING;
}

/**
 * Calculate countdown days safely without negative values.
 */
export function calculateDaysRemaining(examDate: Date): number {
  const now = new Date();
  const diffMs = examDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format countdown text safely (e.g. "Today", "Tomorrow", "2 days left", "Completed").
 */
export function formatCountdown(examDate: Date, status: string): {
  text: string;
  daysRemaining: number;
  isUrgent: boolean;
  isCompleted: boolean;
} {
  const effectiveStatus = getEffectiveExamStatus(examDate, status);
  if (effectiveStatus === EXAM_STATUSES.COMPLETED) {
    return {
      text: "Completed",
      daysRemaining: 0,
      isUrgent: false,
      isCompleted: true,
    };
  }

  const daysRemaining = calculateDaysRemaining(examDate);

  if (daysRemaining === 0) {
    return {
      text: "Today",
      daysRemaining: 0,
      isUrgent: true,
      isCompleted: false,
    };
  }

  if (daysRemaining === 1) {
    return {
      text: "Tomorrow",
      daysRemaining: 1,
      isUrgent: true,
      isCompleted: false,
    };
  }

  return {
    text: `${daysRemaining} days left`,
    daysRemaining,
    isUrgent: daysRemaining <= 3,
    isCompleted: false,
  };
}

/**
 * Format exam date: "September 7, 2026"
 */
export function formatExamDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format exam time: "10:00 AM"
 */
export function formatExamTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateExam(formData: FormData): ValidationResult<ExamFormValues> {
  const title = String(formData.get("title") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const type = String(formData.get("type") ?? EXAM_TYPES.FINAL).trim().toUpperCase();
  const dateStr = String(formData.get("date") ?? "").trim();
  const timeStr = String(formData.get("time") ?? "09:00").trim();
  const room = String(formData.get("room") ?? "").trim();
  const prepProgressRaw = formData.get("preparationProgress");
  const notes = String(formData.get("notes") ?? "").trim();

  const errors: NonNullable<ExamFormState>["errors"] = {};

  // 1. Title (Required, 2-120 chars)
  if (!title) {
    errors.title = ["Exam title is required."];
  } else if (title.length < 2) {
    errors.title = ["Title must be at least 2 characters."];
  } else if (title.length > 120) {
    errors.title = ["Title cannot exceed 120 characters."];
  }

  // 2. Course ID (Required)
  if (!courseId) {
    errors.courseId = ["Please select a course."];
  }

  // 3. Exam Type (Required, valid enum)
  const validTypes = Object.values(EXAM_TYPES);
  if (!validTypes.includes(type as ExamType)) {
    errors.type = [`Exam type must be one of: ${validTypes.join(", ")}.`];
  }

  // 4. Date & Time Validation
  if (!dateStr) {
    errors.date = ["Exam date is required."];
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeStr) {
    errors.time = ["Exam time is required."];
  } else if (!timeRegex.test(timeStr)) {
    errors.time = ["Time must be in HH:MM format (e.g. 10:00)."];
  }

  let combinedDateTime: Date | null = null;
  if (dateStr && timeRegex.test(timeStr)) {
    combinedDateTime = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(combinedDateTime.getTime())) {
      errors.date = ["Please enter a valid exam date and time."];
    }
  }

  // 5. Room (Optional, max 50 chars)
  if (room && room.length > 50) {
    errors.room = ["Room name cannot exceed 50 characters."];
  }

  // 6. Preparation Progress (Integer 0-100)
  const prepProgress = Number(prepProgressRaw ?? 0);
  if (isNaN(prepProgress) || prepProgress < 0 || prepProgress > 100) {
    errors.preparationProgress = ["Preparation progress must be between 0 and 100%."];
  }

  // 7. Notes (Optional, max 500 chars)
  if (notes && notes.length > 500) {
    errors.notes = ["Notes cannot exceed 500 characters."];
  }

  if (Object.keys(errors).length > 0 || !combinedDateTime) {
    return { success: false, errors };
  }

  // Derive initial status based on date
  const status = getEffectiveExamStatus(combinedDateTime);

  return {
    success: true,
    data: {
      title,
      courseId,
      type: type as ExamType,
      examDate: combinedDateTime,
      room,
      preparationProgress: Math.round(prepProgress),
      notes,
      status,
    },
  };
}
