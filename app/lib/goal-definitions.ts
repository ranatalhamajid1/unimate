/**
 * Student goal definitions, constants, and validation rules.
 */

export const GOAL_TYPES = {
  TARGET_GPA: "TARGET_GPA",
  ATTENDANCE: "ATTENDANCE",
  WEEKLY_STUDY_HOURS: "WEEKLY_STUDY_HOURS",
  ASSIGNMENT_COMPLETION: "ASSIGNMENT_COMPLETION",
} as const;

export type GoalType = (typeof GOAL_TYPES)[keyof typeof GOAL_TYPES];

export const GOAL_PERIODS = {
  CURRENT: "CURRENT",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  SEMESTER: "SEMESTER",
} as const;

export type GoalPeriod = (typeof GOAL_PERIODS)[keyof typeof GOAL_PERIODS];

export type StudentGoalItem = {
  id: string;
  userId: string;
  type: string;
  targetValue: number;
  period: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GoalProgressItem = {
  goalId?: string;
  type: GoalType;
  label: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  formattedTarget: string;
  formattedCurrent: string;
  percentage: number; // 0-100 (can be >100 if exceeded)
  period: GoalPeriod;
  isConfigured: boolean;
  isAtRisk: boolean;
  suggestedDefault: number;
};

export const GOAL_TYPE_CONFIG: Record<
  GoalType,
  {
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    defaultPeriod: GoalPeriod;
    suggestedDefault: number;
    formatValue: (val: number) => string;
  }
> = {
  TARGET_GPA: {
    label: "Target GPA",
    description: "Maintain your desired academic cumulative grade point average.",
    min: 1.0,
    max: 4.0,
    step: 0.05,
    unit: "GPA",
    defaultPeriod: "SEMESTER",
    suggestedDefault: 3.5,
    formatValue: (val) => val.toFixed(2),
  },
  ATTENDANCE: {
    label: "Attendance Target",
    description: "Maintain attendance across all courses above your university threshold.",
    min: 50,
    max: 100,
    step: 1,
    unit: "%",
    defaultPeriod: "CURRENT",
    suggestedDefault: 85,
    formatValue: (val) => `${Math.round(val)}%`,
  },
  WEEKLY_STUDY_HOURS: {
    label: "Weekly Study Target",
    description: "Target hours of focused self-study and revision per week.",
    min: 1,
    max: 80,
    step: 0.5,
    unit: "hours",
    defaultPeriod: "WEEKLY",
    suggestedDefault: 12,
    formatValue: (val) => `${val}h`,
  },
  ASSIGNMENT_COMPLETION: {
    label: "Assignment Completion Rate",
    description: "Percentage of assigned university coursework submitted on time.",
    min: 50,
    max: 100,
    step: 1,
    unit: "%",
    defaultPeriod: "SEMESTER",
    suggestedDefault: 90,
    formatValue: (val) => `${Math.round(val)}%`,
  },
};

export function validateGoalInput(type: string, targetValue: number): {
  isValid: boolean;
  error?: string;
} {
  const config = GOAL_TYPE_CONFIG[type as GoalType];
  if (!config) {
    return { isValid: false, error: "Invalid goal type." };
  }

  const num = Number(targetValue);
  if (isNaN(num) || num < config.min || num > config.max) {
    return {
      isValid: false,
      error: `${config.label} must be between ${config.min} and ${config.max}.`,
    };
  }

  return { isValid: true };
}
