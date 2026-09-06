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
