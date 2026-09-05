/**
 * Timetable type definitions, constants, and validation schemas.
 */

export type TimetableEntry = {
  id: string;
  userId: string;
  courseId: string;
  dayOfWeek: number; // 1 = Monday, ..., 7 = Sunday
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  room: string;
  type: string;      // "Lecture" | "Lab" | "Tutorial" | "Other"
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
};

export type TimetableFormValues = {
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
};

export type TimetableFormState = {
  errors?: {
    courseId?: string[];
    dayOfWeek?: string[];
    startTime?: string[];
    endTime?: string[];
    room?: string[];
    type?: string[];
  };
  message?: string;
  success?: boolean;
} | undefined;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: NonNullable<TimetableFormState>["errors"] };

export const DAYS_OF_WEEK = [
  { id: 1, name: "Monday", shortName: "Mon" },
  { id: 2, name: "Tuesday", shortName: "Tue" },
  { id: 3, name: "Wednesday", shortName: "Wed" },
  { id: 4, name: "Thursday", shortName: "Thu" },
  { id: 5, name: "Friday", shortName: "Fri" },
  { id: 6, name: "Saturday", shortName: "Sat" },
  { id: 7, name: "Sunday", shortName: "Sun" },
] as const;

export const CLASS_TYPES = [
  "Lecture",
  "Lab",
  "Tutorial",
  "Other",
] as const;

export type ClassType = (typeof CLASS_TYPES)[number];

/**
 * Convert "HH:MM" to minutes since midnight for range and overlap comparisons.
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Check whether two time ranges [start1, end1) and [start2, end2) overlap.
 */
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  // Overlap condition: start1 < end2 AND start2 < end1
  return s1 < e2 && s2 < e1;
}

/**
 * Format "10:00" - "11:00" to a friendly readable string.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

export function validateTimetableEntry(formData: FormData): ValidationResult<TimetableFormValues> {
  const courseId = String(formData.get("courseId") ?? "").trim();
  const dayOfWeekRaw = formData.get("dayOfWeek");
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();

  const errors: NonNullable<TimetableFormState>["errors"] = {};

  // 1. Course ID (Required)
  if (!courseId) {
    errors.courseId = ["Please select a course."];
  }

  // 2. Day of Week (Required: 1 to 7)
  const dayOfWeek = Number(dayOfWeekRaw);
  if (!dayOfWeekRaw || isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    errors.dayOfWeek = ["Please select a valid day of the week."];
  }

  // 3. Time format regex: "HH:MM" (24h)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!startTime) {
    errors.startTime = ["Start time is required."];
  } else if (!timeRegex.test(startTime)) {
    errors.startTime = ["Start time must be in HH:MM format (e.g. 09:00)."];
  }

  if (!endTime) {
    errors.endTime = ["End time is required."];
  } else if (!timeRegex.test(endTime)) {
    errors.endTime = ["End time must be in HH:MM format (e.g. 10:30)."];
  }

  // 4. End time must be strictly after start time
  if (startTime && endTime && timeRegex.test(startTime) && timeRegex.test(endTime)) {
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      errors.endTime = ["End time must be after start time."];
    }
  }

  // 5. Room (Optional, max 50 chars)
  if (room && room.length > 50) {
    errors.room = ["Room name cannot exceed 50 characters."];
  }

  // 6. Type (Required: Lecture, Lab, Tutorial, Other)
  if (!type) {
    errors.type = ["Class type is required."];
  } else if (!CLASS_TYPES.includes(type as ClassType)) {
    errors.type = [`Class type must be one of: ${CLASS_TYPES.join(", ")}.`];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      type,
    },
  };
}
