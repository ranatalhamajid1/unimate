/**
 * Study plan definitions, interfaces, and validation.
 */

export const STUDY_PLAN_STATUSES = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;

export type StudyPlanStatus =
  (typeof STUDY_PLAN_STATUSES)[keyof typeof STUDY_PLAN_STATUSES];

export type StudyPlanItemData = {
  id: string;
  studyPlanId: string;
  courseId: string | null;
  title: string;
  description: string;
  scheduledAt: Date;
  duration: number; // minutes
  completed: boolean;
  order: number;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  } | null;
};

export type StudyPlanData = {
  id: string;
  userId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: StudyPlanItemData[];
  progressPercentage: number;
  totalDurationMinutes: number;
  completedDurationMinutes: number;
};

export type DraftPlanItem = {
  courseCode?: string;
  courseId?: string | null;
  title: string;
  duration: number; // minutes
  reason: string;
  suggestedTime?: string; // "HH:MM" e.g. "19:00"
};

export type DraftStudyPlan = {
  title: string;
  summary: string;
  targetDate: string; // YYYY-MM-DD
  items: DraftPlanItem[];
  isLocalFallback?: boolean;
};

export function validateStudyPlanInput(title: string, startDate: Date, endDate: Date): {
  isValid: boolean;
  error?: string;
} {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: "Study plan title is required." };
  }
  if (title.trim().length > 150) {
    return { isValid: false, error: "Study plan title cannot exceed 150 characters." };
  }
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { isValid: false, error: "Invalid start or end date." };
  }
  if (endDate.getTime() < startDate.getTime()) {
    return { isValid: false, error: "End date cannot be before start date." };
  }
  return { isValid: true };
}
