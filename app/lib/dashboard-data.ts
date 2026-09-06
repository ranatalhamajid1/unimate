/**
 * Dashboard shared data types and action definitions.
 * All dynamic data is queried directly from PostgreSQL.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StatCard = {
  id: string;
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "neutral";
};

export type ScheduleClass = {
  id: string;
  time: string;
  name: string;
  room: string;
  type: "lecture" | "lab" | "free";
};

export type Assignment = {
  id: string;
  title: string;
  course: string;
  dueLabel: string;
  dueSoon: boolean;
  status: "not-started" | "in-progress" | "completed";
};

export type StudyDay = {
  day: string; // "Mon", "Tue", etc.
  hours: number;
  isToday: boolean;
};

// ---------------------------------------------------------------------------
// Quick actions definition
// ---------------------------------------------------------------------------

export const QUICK_ACTIONS = [
  { id: "add-assignment", label: "Add assignment", icon: "FileText" },
  { id: "add-exam", label: "Add exam", icon: "BookOpen" },
  { id: "add-class", label: "Add class", icon: "Calendar" },
  { id: "track-expense", label: "Track expense", icon: "Receipt" },
] as const;
