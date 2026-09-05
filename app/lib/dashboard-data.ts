/**
 * Dashboard demo data — static UI values for the MVP.
 *
 * ARCHITECTURE NOTE:
 * All demo data lives here in one place. When a real database is added,
 * replace each exported constant/function with an async DB query.
 * Component files import from this file only — nothing else needs to change.
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
  dueSoon: boolean; // due within 2 days
  status: "not-started" | "in-progress" | "completed";
};

export type StudyDay = {
  day: string; // "Mon"
  hours: number; // 0–8
  isToday: boolean;
};

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------

/** Replace with: async function getStats(userId: string): Promise<StatCard[]> */
export const DEMO_STATS: StatCard[] = [
  {
    id: "gpa",
    label: "GPA",
    value: "3.50",
    sub: "Current semester",
    trend: "up",
  },
  {
    id: "attendance",
    label: "Attendance",
    value: "87%",
    sub: "Overall attendance",
    trend: "neutral",
  },
  {
    id: "assignments",
    label: "Assignments",
    value: "4",
    sub: "Due this week",
    trend: "neutral",
  },
  {
    id: "study-hours",
    label: "Study hours",
    value: "12.5h",
    sub: "This week",
    trend: "up",
  },
];

// ---------------------------------------------------------------------------
// Today's schedule
// ---------------------------------------------------------------------------

/** Replace with: async function getTodaySchedule(userId: string): Promise<ScheduleClass[]> */
export const DEMO_SCHEDULE: ScheduleClass[] = [
  {
    id: "dld",
    time: "10:00 AM",
    name: "Digital Logic Design",
    room: "Room B-204",
    type: "lecture",
  },
  {
    id: "web-eng",
    time: "12:00 PM",
    name: "Web Engineering",
    room: "Lab 3",
    type: "lab",
  },
  {
    id: "tafl",
    time: "2:00 PM",
    name: "Theory of Automata & Formal Languages",
    room: "Room A-102",
    type: "lecture",
  },
  {
    id: "free",
    time: "4:00 PM",
    name: "Free study session",
    room: "",
    type: "free",
  },
];

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

/** Replace with: async function getAssignments(userId: string): Promise<Assignment[]> */
export const DEMO_ASSIGNMENTS: Assignment[] = [
  {
    id: "dld-lab-05",
    title: "DLD Lab 05",
    course: "Digital Logic Design",
    dueLabel: "Due tomorrow",
    dueSoon: true,
    status: "in-progress",
  },
  {
    id: "web-eng-project",
    title: "Web Engineering Project",
    course: "Web Engineering",
    dueLabel: "Due Sep 8",
    dueSoon: false,
    status: "not-started",
  },
  {
    id: "tafl-asgn-03",
    title: "TAFL Assignment 03",
    course: "Theory of Automata",
    dueLabel: "Due Sep 10",
    dueSoon: false,
    status: "completed",
  },
];

// ---------------------------------------------------------------------------
// Next exam
// ---------------------------------------------------------------------------

/** Replace with: async function getNextExam(userId: string) */
export const DEMO_NEXT_EXAM = {
  id: "dld-final",
  subject: "Digital Logic Design",
  date: "September 7, 2026",
  daysRemaining: 2,
  revisionTopics: ["Boolean Algebra", "K-Maps", "Flip-Flops", "Counters"],
  revisionDone: 2, // out of 4
};

// ---------------------------------------------------------------------------
// Weekly study progress
// ---------------------------------------------------------------------------

/** Replace with: async function getStudyProgress(userId: string): Promise<StudyDay[]> */
export const DEMO_STUDY_PROGRESS: StudyDay[] = [
  { day: "Mon", hours: 3, isToday: false },
  { day: "Tue", hours: 4.5, isToday: false },
  { day: "Wed", hours: 2, isToday: false },
  { day: "Thu", hours: 3, isToday: true },
  { day: "Fri", hours: 0, isToday: false },
  { day: "Sat", hours: 0, isToday: false },
  { day: "Sun", hours: 0, isToday: false },
];

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------

export const QUICK_ACTIONS = [
  { id: "add-assignment", label: "Add assignment", icon: "FileText" },
  { id: "add-exam", label: "Add exam", icon: "BookOpen" },
  { id: "add-class", label: "Add class", icon: "Calendar" },
  { id: "track-expense", label: "Track expense", icon: "Receipt" },
] as const;
