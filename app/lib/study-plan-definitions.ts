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
  targetType?: string | null;
  targetId?: string | null;
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
  feasibility?: PlanFeasibility;
};

export type PlanningHorizon = 7 | 14;

export type PlanFeasibilityStatus = "FEASIBLE" | "TIGHT" | "OVERLOADED";

export type UnallocatedTask = {
  id: string;
  targetType: "ASSIGNMENT" | "EXAM";
  targetId: string;
  courseId?: string | null;
  courseCode: string;
  courseName: string;
  title: string;
  dueDate?: string;
  urgencyScore: number;
  urgencyTier: "OVERDUE" | "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";
  remainingMinutes: number;
  reason: string;
  recommendedAction: string;
};

export type PlanFeasibility = {
  status: PlanFeasibilityStatus;
  totalRequiredMinutes: number;
  totalAvailableMinutes: number;
  deficitMinutes: number;
  notice: string;
};

export type AdaptiveStudyBlock = {
  id?: string;
  courseId: string | null;
  courseCode: string;
  courseName: string;
  courseColor: string;
  title: string;
  description: string;
  scheduledAt: string; // ISO string
  duration: number; // minutes
  targetType: string | null;
  targetId: string | null;
  urgencyScore: number;
  urgencyTier: string;
  reason: string;
  completed?: boolean;
};

export type AdaptiveDraftPlan = {
  title: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  horizonDays: PlanningHorizon;
  feasibility: PlanFeasibility;
  items: AdaptiveStudyBlock[];
  unallocatedTasks: UnallocatedTask[];
  aiExplanation?: string | null;
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

/**
 * Pure derived helper to check if a study plan item has passed its scheduled end time
 * without being marked complete. Derived in-memory; NOT a database enum.
 */
export function isStudyPlanItemMissed(
  item: { scheduledAt: Date | string; duration: number; completed: boolean },
  now: Date = new Date()
): boolean {
  if (item.completed) return false;
  const schedMs =
    typeof item.scheduledAt === "string"
      ? new Date(item.scheduledAt).getTime()
      : item.scheduledAt.getTime();
  const itemEndMs = schedMs + item.duration * 60 * 1000;
  return itemEndMs < now.getTime();
}

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
