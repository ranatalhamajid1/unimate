/**
 * Study session type definitions, constants, and validation rules.
 */

export const STUDY_SESSION_SOURCES = {
  MANUAL: "MANUAL",
  STUDY_PLAN: "STUDY_PLAN",
  AI_PLAN: "AI_PLAN",
} as const;

export type StudySessionSource =
  (typeof STUDY_SESSION_SOURCES)[keyof typeof STUDY_SESSION_SOURCES];

export type StudySessionItem = {
  id: string;
  userId: string;
  courseId: string | null;
  title: string;
  duration: number; // in minutes
  sessionDate: Date;
  source: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  } | null;
};

export type StudySessionFormValues = {
  courseId?: string | null;
  title: string;
  duration: number; // minutes
  sessionDate: string | Date;
  source?: StudySessionSource;
  completed?: boolean;
};

export type StudyDayProgress = {
  day: string; // "Mon", "Tue", ...
  hours: number; // e.g. 2.5
  isToday: boolean;
  dateStr: string; // YYYY-MM-DD
};

export type CourseStudyTotal = {
  courseId: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  totalMinutes: number;
  totalHours: number;
  formattedHours: string;
  sessionCount: number;
};

export type WeeklyStudySummary = {
  thisWeekMinutes: number;
  thisWeekHours: number;
  thisWeekHoursString: string;
  todayMinutes: number;
  todayHoursString: string;
  mostStudiedCourse: CourseStudyTotal | null;
  totalSessionsCount: number;
  dailyProgress: StudyDayProgress[];
};

/**
 * Validation bounds for study sessions
 */
export const STUDY_SESSION_VALIDATION = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DURATION_MIN_MINUTES: 1,
  DURATION_MAX_MINUTES: 1440, // 24 hours max
};

export function validateStudySessionInput(input: Partial<StudySessionFormValues>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length < STUDY_SESSION_VALIDATION.TITLE_MIN_LENGTH) {
    errors.title = "Title is required.";
  } else if (input.title.trim().length > STUDY_SESSION_VALIDATION.TITLE_MAX_LENGTH) {
    errors.title = `Title cannot exceed ${STUDY_SESSION_VALIDATION.TITLE_MAX_LENGTH} characters.`;
  }

  const durationNum = Number(input.duration);
  if (
    isNaN(durationNum) ||
    durationNum < STUDY_SESSION_VALIDATION.DURATION_MIN_MINUTES ||
    durationNum > STUDY_SESSION_VALIDATION.DURATION_MAX_MINUTES
  ) {
    errors.duration = `Duration must be between ${STUDY_SESSION_VALIDATION.DURATION_MIN_MINUTES} and ${STUDY_SESSION_VALIDATION.DURATION_MAX_MINUTES} minutes.`;
  }

  if (!input.sessionDate) {
    errors.sessionDate = "Session date is required.";
  } else {
    const d = new Date(input.sessionDate);
    if (isNaN(d.getTime())) {
      errors.sessionDate = "Invalid session date.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export const FOCUS_SESSION_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type FocusSessionStatus =
  (typeof FOCUS_SESSION_STATUS)[keyof typeof FOCUS_SESSION_STATUS];

export const FOCUS_TARGET_TYPES = {
  ASSIGNMENT: "ASSIGNMENT",
  EXAM: "EXAM",
  STUDY_PLAN_ITEM: "STUDY_PLAN_ITEM",
  COURSE_STUDY: "COURSE_STUDY",
  GENERAL: "GENERAL",
} as const;

export type FocusTargetType =
  (typeof FOCUS_TARGET_TYPES)[keyof typeof FOCUS_TARGET_TYPES];

export const FOCUS_DURATION_PRESETS = [25, 50, 90] as const;

export const FOCUS_SESSION_VALIDATION = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  MIN_PLANNED_MINUTES: 5,
  MAX_PLANNED_MINUTES: 180,
  MAX_RUNAWAY_STUDY_MINUTES: 360, // 6h absolute hard ceiling
  GRACE_BUFFER_MINUTES: 30,
};

export type ActiveFocusSessionPayload = {
  id: string;
  userId: string;
  courseId: string | null;
  courseName?: string;
  courseCode?: string;
  courseColor?: string;
  title: string;
  duration: number; // actual minutes
  plannedDuration: number;
  sessionDate: string; // ISO string of start
  status: FocusSessionStatus;
  targetType: FocusTargetType | null;
  targetId: string | null;
  pausedAt: string | null; // ISO string
  totalPausedSeconds: number;
  serverNow: string; // ISO string
  elapsedSeconds: number; // authoritative elapsed seconds
};

export type StartFocusSessionInput = {
  title: string;
  courseId?: string | null;
  plannedMinutes: number;
  targetType?: FocusTargetType;
  targetId?: string | null;
};

/**
 * Calculates authoritative active elapsed seconds excluding all paused intervals.
 */
export function calculateElapsedSeconds(params: {
  sessionDate: Date | string;
  pausedAt: Date | string | null;
  totalPausedSeconds: number;
  serverNow?: Date | string;
}): number {
  const startDate = new Date(params.sessionDate).getTime();
  const nowDate = params.serverNow ? new Date(params.serverNow).getTime() : Date.now();
  const totalPaused = Math.max(0, params.totalPausedSeconds || 0);

  if (params.pausedAt) {
    const pauseDate = new Date(params.pausedAt).getTime();
    const activeMs = pauseDate - startDate;
    const activeSec = Math.max(0, Math.floor(activeMs / 1000) - totalPaused);
    return activeSec;
  }

  const activeMs = nowDate - startDate;
  const activeSec = Math.max(0, Math.floor(activeMs / 1000) - totalPaused);
  return activeSec;
}

/**
 * Computes authoritative completed study minutes clamped against runaway overnight sessions.
 * Hard ceiling: 360 minutes (6 hours). No client-trusted values are accepted.
 * plannedDurationMinutes is kept for API compatibility but does NOT affect the cap.
 */
export function calculateAuthoritativeMinutes(params: {
  elapsedSeconds: number;
  plannedDurationMinutes?: number | null;
}): number {
  // Clamp to absolute 360-minute (6-hour) hard ceiling
  const maxAllowedSeconds = FOCUS_SESSION_VALIDATION.MAX_RUNAWAY_STUDY_MINUTES * 60;
  const clampedSec = Math.min(Math.max(0, params.elapsedSeconds), maxAllowedSeconds);

  const minutes = Math.round(clampedSec / 60);

  // Guarantee minimum 1-minute credit for any non-zero active focus
  if (minutes < 1 && clampedSec > 0) return 1;
  return minutes;
}
