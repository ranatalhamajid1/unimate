/**
 * Notification type definitions, centralized constants, category mappings, and display helpers.
 */

// ---------------------------------------------------------------------------
// Centralized Notification Types
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES = {
  ASSIGNMENT_DUE_SOON: "ASSIGNMENT_DUE_SOON",
  ASSIGNMENT_OVERDUE: "ASSIGNMENT_OVERDUE",
  EXAM_DUE_SOON: "EXAM_DUE_SOON",
  EXAM_TODAY: "EXAM_TODAY",
  EXAM_PREPARATION: "EXAM_PREPARATION",
  ATTENDANCE_WARNING: "ATTENDANCE_WARNING",
  DAILY_PRIORITY: "DAILY_PRIORITY",
  STUDY_PLAN_REMINDER: "STUDY_PLAN_REMINDER",
  GOAL_PROGRESS: "GOAL_PROGRESS",
  GOAL_AT_RISK: "GOAL_AT_RISK",
  SYSTEM: "SYSTEM",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string | null;
  read: boolean;
  createdAt: Date;
  readAt?: Date | null;
};

// ---------------------------------------------------------------------------
// UI Filter Tabs
// ---------------------------------------------------------------------------

export const NOTIFICATION_FILTERS = {
  ALL: "ALL",
  UNREAD: "UNREAD",
  ASSIGNMENTS: "ASSIGNMENTS",
  EXAMS: "EXAMS",
  ATTENDANCE: "ATTENDANCE",
} as const;

export type NotificationFilter =
  (typeof NOTIFICATION_FILTERS)[keyof typeof NOTIFICATION_FILTERS];

// ---------------------------------------------------------------------------
// Type Metadata & Action Links
// ---------------------------------------------------------------------------

export type NotificationTypeConfig = {
  category: "ASSIGNMENTS" | "EXAMS" | "ATTENDANCE" | "SYSTEM";
  actionLabel: string;
  actionUrl: string;
  badgeLabel: string;
  badgeClass: string;
  iconBgClass: string;
};

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  NotificationTypeConfig
> = {
  ASSIGNMENT_DUE_SOON: {
    category: "ASSIGNMENTS",
    actionLabel: "View assignment",
    actionUrl: "/dashboard/assignments",
    badgeLabel: "Due soon",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60",
    iconBgClass: "bg-amber-50 text-amber-600 border-amber-100",
  },
  ASSIGNMENT_OVERDUE: {
    category: "ASSIGNMENTS",
    actionLabel: "View assignment",
    actionUrl: "/dashboard/assignments",
    badgeLabel: "Overdue",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/60 font-semibold",
    iconBgClass: "bg-rose-50 text-rose-600 border-rose-100",
  },
  EXAM_DUE_SOON: {
    category: "EXAMS",
    actionLabel: "View exam",
    actionUrl: "/dashboard/exams",
    badgeLabel: "Upcoming exam",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60",
    iconBgClass: "bg-blue-50 text-blue-600 border-blue-100",
  },
  EXAM_TODAY: {
    category: "EXAMS",
    actionLabel: "View exam",
    actionUrl: "/dashboard/exams",
    badgeLabel: "Exam today",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/60 font-semibold",
    iconBgClass: "bg-purple-50 text-purple-600 border-purple-100",
  },
  EXAM_PREPARATION: {
    category: "EXAMS",
    actionLabel: "View exam",
    actionUrl: "/dashboard/exams",
    badgeLabel: "Revision reminder",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    iconBgClass: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  ATTENDANCE_WARNING: {
    category: "ATTENDANCE",
    actionLabel: "View academics",
    actionUrl: "/dashboard/academics",
    badgeLabel: "Attendance alert",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60 font-semibold",
    iconBgClass: "bg-amber-50 text-amber-600 border-amber-100",
  },
  DAILY_PRIORITY: {
    category: "SYSTEM",
    actionLabel: "View priorities",
    actionUrl: "/dashboard",
    badgeLabel: "Priority",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/60 font-semibold",
    iconBgClass: "bg-rose-50 text-rose-600 border-rose-100",
  },
  STUDY_PLAN_REMINDER: {
    category: "SYSTEM",
    actionLabel: "View study plan",
    actionUrl: "/dashboard/study-plan",
    badgeLabel: "Study session",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/60 font-semibold",
    iconBgClass: "bg-purple-50 text-purple-600 border-purple-100",
  },
  GOAL_PROGRESS: {
    category: "SYSTEM",
    actionLabel: "View goals",
    actionUrl: "/dashboard/goals",
    badgeLabel: "Goal update",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60 font-semibold",
    iconBgClass: "bg-blue-50 text-blue-600 border-blue-100",
  },
  GOAL_AT_RISK: {
    category: "SYSTEM",
    actionLabel: "Check goals",
    actionUrl: "/dashboard/goals",
    badgeLabel: "Goal at risk",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60 font-semibold",
    iconBgClass: "bg-amber-50 text-amber-600 border-amber-100",
  },
  SYSTEM: {
    category: "SYSTEM",
    actionLabel: "View dashboard",
    actionUrl: "/dashboard",
    badgeLabel: "Update",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200/60",
    iconBgClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export function getTypeConfig(type: string): NotificationTypeConfig {
  const valid = type in NOTIFICATION_TYPE_CONFIG;
  if (valid) {
    return NOTIFICATION_TYPE_CONFIG[type as NotificationType];
  }
  return NOTIFICATION_TYPE_CONFIG.SYSTEM;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format relative timestamp safely (e.g. "Just now", "10m ago", "2h ago", "Yesterday", "Sep 5").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
