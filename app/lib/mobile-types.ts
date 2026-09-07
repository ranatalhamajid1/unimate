/**
 * Shared Type Definitions & API Contracts for UniMate Mobile API.
 * Contains no server-only imports, safe for client-server type alignment.
 */

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface MobileAuthResponse {
  success: boolean;
  token?: string;
  user?: MobileUser;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface MobileMeResponse {
  success: boolean;
  user: MobileUser;
  subscription: {
    plan: string;
    isPro: boolean;
    status: string;
  };
}

export interface MobileErrorResponse {
  success: false;
  error: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface MobileScheduleClass {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  name: string;
  code: string;
  room: string;
  type: "lecture" | "lab" | "tutorial" | "other";
  color?: string;
}

export interface MobileAssignment {
  id: string;
  title: string;
  courseName: string;
  courseCode: string;
  dueLabel: string;
  dueDate: string;
  dueSoon: boolean;
  priority: string;
  status: string;
}

export interface MobileExam {
  id: string;
  title: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  type: string;
  date: string;
  time: string;
  room: string;
  countdown: string;
  daysRemaining: number;
  preparationProgress: number;
}

export interface MobilePriorityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  actionUrl: string;
  courseName?: string;
  courseCode?: string;
}

export interface MobileStudyPlanTask {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  completed: boolean;
  courseName?: string;
}

export interface MobileGoalProgress {
  goalId?: string;
  type: string;
  label: string;
  targetValue: number;
  currentValue: number;
  percentage: number;
  unit: string;
  isConfigured: boolean;
  isAtRisk: boolean;
}

export interface MobileAcademicInsight {
  id: string;
  severity: "POSITIVE" | "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  actionUrl?: string;
  category: string;
}

export interface MobileDashboardData {
  success: true;
  user: MobileUser;
  subscription: {
    plan: string;
    isPro: boolean;
    status: string;
  };
  greeting: string;
  dateString: string;
  unreadNotificationCount: number;
  stats: {
    gpa: { value: string; sub: string };
    attendance: { value: string; sub: string };
    assignmentsDue: { count: number; sub: string };
    studyHours: { formatted: string; minutes: number; sub: string };
  };
  priorities: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    isCaughtUp: boolean;
    items: MobilePriorityItem[];
  };
  todaySchedule: MobileScheduleClass[];
  upcomingAssignments: MobileAssignment[];
  nextExam: MobileExam | null;
  activeStudyPlan: {
    id: string;
    title: string;
    completedItems: number;
    totalItems: number;
    items: MobileStudyPlanTask[];
  } | null;
  academicInsights: MobileAcademicInsight[];
  goals: MobileGoalProgress[];
  weeklyStudyProgress: {
    day: string;
    hours: number;
    isToday: boolean;
  }[];
}

export type MobileDashboardResponse = MobileDashboardData | MobileErrorResponse;

// ==========================================
// Phase 15 Step 4: Core Modules Types
// ==========================================

export interface MobileCourse {
  id: string;
  userId: string;
  name: string;
  code: string;
  instructor: string;
  creditHours: number;
  semester: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MobileTimetableEntry {
  id: string;
  userId: string;
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
}

export interface MobileAssignmentItem {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
}

export interface MobileExamItem {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  examDate: string;
  room: string;
  type: string;
  status: string;
  preparationProgress: number;
  notes: string;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
}

export interface MobileCourseAcademicItem {
  courseId: string;
  courseName: string;
  courseCode: string;
  creditHours: number;
  semester: string;
  color: string;
  gradeId?: string;
  grade: string | null;
  gradePoints: number | null;
  attendanceId?: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number | null;
  attendanceStatus: string;
}

export interface MobileAcademicData {
  gpa: number | null;
  gpaString: string;
  gpaSub: string;
  overallAttendance: number | null;
  attendanceString: string;
  attendanceSub: string;
  attendanceStatus: string;
  totalCredits: number;
  gradedCredits: number;
  coursesCount: number;
  gradedCoursesCount: number;
  courses: MobileCourseAcademicItem[];
}

export interface MobileExpenseItem {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  expenseDate: string;
}

export interface MobileExpenseSummary {
  totalSpending: number;
  totalSpendingString: string;
  thisMonthSpending: number;
  thisMonthSpendingString: string;
  thisWeekSpending: number;
  thisWeekSpendingString: string;
  averageMonthlySpending: number | null;
  averageMonthlySpendingString: string;
  hasExpenses: boolean;
  expenseCount: number;
}

export interface MobileNotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}


