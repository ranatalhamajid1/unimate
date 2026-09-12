/**
 * Type definitions for UniMate Mobile.
 */

export interface UniversityAffiliation {
  id: string;
  name: string;
  shortName?: string | null;
  country: string;
  isVerified: boolean;
}

export interface CampusAffiliation {
  id: string;
  name: string;
  city?: string | null;
  isMain: boolean;
}

export interface DepartmentAffiliation {
  id: string;
  name: string;
  faculty?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  avatarUrl?: string | null;
  username?: string | null;
  bio?: string | null;
  country?: string | null;
  city?: string | null;
  degreeProgram?: string | null;
  currentSemester?: string | null;
  graduationYear?: number | null;
  skills?: string[];
  interests?: string[];
  languages?: string[];
  socialLinks?: Record<string, string> | null;
  profileCompletionPercentage?: number;
  onboardingCompleted?: boolean;
  isPublicProfile?: boolean;
  university?: UniversityAffiliation | null;
  campus?: CampusAffiliation | null;
  department?: DepartmentAffiliation | null;
}

export interface Subscription {
  plan: "FREE" | "PRO" | string;
  isPro: boolean;
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "PAUSED" | "TRIALING" | string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface MeResponse {
  success: boolean;
  user: User;
  subscription: Subscription;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
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
  user: User;
  subscription: Subscription;
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

export type MobileDashboardResponse = any;

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

// ==========================================
// Phase 15 Step 5: Advanced Productivity Modules
// ==========================================

export interface MobileStudentGoalItem {
  id: string;
  userId: string;
  type: string;
  targetValue: number;
  period: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MobileGoalProgressItem {
  goalId?: string;
  type: string;
  label: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  formattedTarget: string;
  formattedCurrent: string;
  percentage: number;
  period: string;
  isConfigured: boolean;
  isAtRisk: boolean;
  suggestedDefault: number;
}

export interface MobileStudyPlanItem {
  id: string;
  studyPlanId: string;
  courseId: string | null;
  targetType?: string | null;
  targetId?: string | null;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  completed: boolean;
  order: number;
  course?: {
    id: string;
    name: string;
    code: string;
    color: string;
  } | null;
}

export interface MobileStudyPlan {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: MobileStudyPlanItem[];
  progressPercentage: number;
  totalDurationMinutes: number;
  completedDurationMinutes: number;
}

export interface MobileDraftPlanItem {
  courseCode?: string;
  courseId?: string | null;
  title: string;
  duration: number;
  reason: string;
  suggestedTime?: string;
}

export interface MobileDraftStudyPlan {
  title: string;
  summary: string;
  targetDate: string;
  items: MobileDraftPlanItem[];
  isLocalFallback?: boolean;
  horizonDays?: number;
  feasibility?: "FEASIBLE" | "TIGHT" | "OVERLOADED";
  totalRequiredMinutes?: number;
  totalAvailableMinutes?: number;
  deficitMinutes?: number;
  unallocatedTasks?: Array<{
    targetType: string;
    targetId: string;
    title: string;
    courseCode?: string;
    deadline?: string;
    remainingMinutes: number;
    reason: string;
    urgencyTier?: string;
    recommendedAction?: string;
  }>;
}

export interface MobileCalendarEvent {
  id: string;
  title: string;
  date: string;
  dateKey: string;
  timeStr: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  eventType: "CLASS" | "ASSIGNMENT" | "EXAM" | "STUDY";
  actionUrl: string;
  status?: string;
}

export interface MobileCalendarData {
  year: number;
  month: number;
  monthLabel: string;
  events: MobileCalendarEvent[];
  eventsByDate: Record<string, MobileCalendarEvent[]>;
}

export interface MobileCalendarDayWorkload {
  dateKey: string;
  dayOfWeek: number;
  dayLabel: string;
  isToday: boolean;
  tier: "LIGHT" | "BALANCED" | "BUSY" | "OVERLOADED";
  classCount: number;
  classMinutes: number;
  deadlinesCount: number;
  examsCount: number;
  studyPlanMinutes: number;
  availableGapMinutes: number;
  reason: string;
}

export interface MobileDeadlineCluster {
  id: string;
  startDateKey: string;
  endDateKey: string;
  label: string;
  affectedCourses: Array<{ id: string; code: string; name: string; color: string }>;
  itemCount: number;
  totalEstimatedMinutes: number;
  reason: string;
  recommendedAction: string;
}

export interface MobileRecommendedStudyWindow {
  id: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string;
  suggestedFocus: {
    targetType: "ASSIGNMENT" | "EXAM" | "GENERAL";
    targetId: string | null;
    title: string;
    courseCode?: string;
    courseName?: string;
    courseColor?: string;
    urgencyTier?: string;
  };
  disclaimer: string;
}

export interface MobileCalendarIntelligenceData {
  timestamp: string;
  referenceDateKey: string;
  horizonDays: number;
  weekWorkload: {
    overallTier: "LIGHT" | "BALANCED" | "BUSY" | "OVERLOADED";
    totalClassMinutes: number;
    totalDeadlines: number;
    totalExams: number;
    totalStudyPlanMinutes: number;
    totalAvailableGapMinutes: number;
    summary: string;
  };
  dailyWorkloads: MobileCalendarDayWorkload[];
  deadlineClusters: MobileDeadlineCluster[];
  recommendedStudyWindows: MobileRecommendedStudyWindow[];
  googleCalendar: {
    connected: boolean;
    status: "CONNECTED" | "DISCONNECTED" | "NEEDS_REAUTH" | "ERROR";
    email: string | null;
    lastSyncAt: string | null;
  };
}

export interface MobileAiQuota {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  plan: string;
  dateKey: string;
}

export interface MobileBillingData {
  subscription: {
    plan: string;
    status: string;
    isPro: boolean;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  limits: {
    dailyAiLimit: number;
    freeDailyAiLimit: number;
    proDailyAiLimit: number;
  };
  features: {
    current: string[];
    pro: string[];
  };
  notice: string;
}

export interface UniversityCampusItem {
  id: string;
  name: string;
  city?: string | null;
  isMain: boolean;
}

export interface UniversityDepartmentItem {
  id: string;
  name: string;
  faculty?: string | null;
}

export interface UniversityItem {
  id: string;
  name: string;
  shortName?: string | null;
  country: string;
  countryCode?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  isVerified: boolean;
  campuses?: UniversityCampusItem[];
  departments?: UniversityDepartmentItem[];
}

export interface UniversityListResponse {
  success: boolean;
  universities: UniversityItem[];
  total: number;
}

export interface MobileProfileResponse {
  success: boolean;
  user: User;
  profileCompletion: {
    percentage: number;
    missingFields: string[];
    nextAction: string | null;
  };
}

export interface MobileGoogleCalendarStatusResponse {
  connected: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "NEEDS_REAUTH" | "ERROR";
  email: string | null;
  calendarId: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
}

export interface MobileSyncResultResponse {
  success: boolean;
  result?: {
    examsSynced: number;
    assignmentsSynced: number;
    timetableSynced: number;
    skippedUnchanged: number;
    errors: string[];
  };
  error?: string;
  code?: string;
}

// ---------------------------------------------------------------------------
// Milestone 15.1: Adaptive Today Workspace Types
// ---------------------------------------------------------------------------

export type MobileUrgencyTier = "OVERDUE" | "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";

export interface MobileTodayActionItem {
  id: string;
  entityType: "ASSIGNMENT" | "EXAM" | "STUDY_PLAN_ITEM" | "ATTENDANCE_RECOVERY";
  title: string;
  courseId?: string;
  courseCode: string;
  courseName: string;
  courseColor: string;
  urgencyScore: number;
  urgencyTier: MobileUrgencyTier;
  deadlineLabel: string;
  dueDateStr?: string;
  estimatedMinutes: number;
  estimatedLabel: string;
  reason: string;
  actionLabel: string;
  actionHref: string;
  isAttentionItem: boolean;
  completed: boolean;
  deferredReason?: string;
}

export interface MobileTodayTimelineSlot {
  id: string;
  type: "CLASS" | "STUDY_GAP";
  title: string;
  subtitle?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  room?: string;
  color?: string;
  hasConflict?: boolean;
  suggestedAction?: string;
}

export interface MobileCompletedTodayItem {
  id: string;
  title: string;
  courseCode: string;
  completedAtStr: string;
}

export interface MobileAdaptiveTodayWorkspaceData {
  timestamp: string;
  dateString: string;
  dayName: string;
  capacity: {
    availableStudyMinutes: number;
    allocatedWorkMinutes: number;
    isOverCapacity: boolean;
    notice: string;
  };
  attention: {
    items: MobileTodayActionItem[];
    criticalCount: number;
    attendanceWarning: {
      courseId: string;
      courseCode: string;
      courseName: string;
      percentageString: string;
      thresholdPercentage: number;
      recoveryClassesRequired: number;
      recommendation: string;
    } | null;
    timetableConflictCount: number;
  };
  today: {
    schedule: MobileTodayTimelineSlot[];
    allocatedTasks: MobileTodayActionItem[];
  };
  next: MobileTodayActionItem[];
  later: MobileTodayActionItem[];
  completedToday: {
    items: MobileCompletedTodayItem[];
    count: number;
  };
  calendarSync: {
    status: "CONNECTED" | "NEEDS_REAUTH" | "DISCONNECTED" | "NOT_CONFIGURED";
    lastSyncAt: string | null;
    accountEmail: string | null;
  };
  emptyState: {
    isNewStudent: boolean;
    missingSections: ("COURSES" | "TIMETABLE" | "ASSIGNMENTS" | "EXAMS")[];
    hasNoClassesToday: boolean;
    isAllCaughtUp: boolean;
  };
}

// ---------------------------------------------------------------------------
// Milestone 15.2: Focus Session Types
// ---------------------------------------------------------------------------

export type MobileFocusSessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export type MobileFocusTargetType =
  | "ASSIGNMENT"
  | "EXAM"
  | "STUDY_PLAN_ITEM"
  | "COURSE_STUDY"
  | "GENERAL";

export interface MobileActiveFocusSession {
  id: string;
  userId: string;
  courseId: string | null;
  courseName?: string;
  courseCode?: string;
  courseColor?: string;
  title: string;
  duration: number;
  plannedDuration: number;
  sessionDate: string;
  status: MobileFocusSessionStatus;
  targetType: MobileFocusTargetType | null;
  targetId: string | null;
  pausedAt: string | null;
  totalPausedSeconds: number;
  serverNow: string;
  elapsedSeconds: number;
}

// ---------------------------------------------------------------------------
// Milestone 15.5: Weekly Review Types
// ---------------------------------------------------------------------------

export type MobileScorecardRating = "STRONG" | "ON_TRACK" | "NEEDS_ATTENTION" | "INSUFFICIENT_DATA";

export interface MobileScorecardDimension {
  rating: MobileScorecardRating;
  scorePercentage: number;
  label: string;
  summary: string;
}

export interface MobileWeeklyScorecard {
  execution: MobileScorecardDimension;
  planning: MobileScorecardDimension;
  focus: MobileScorecardDimension;
  academicHealth: MobileScorecardDimension;
  overallGrade: "A" | "B" | "C" | "D" | "INCOMPLETE";
}

export interface MobileCourseWeeklySummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  courseColor: string;
  attendance: {
    attended: number;
    scheduled: number;
    percentage: number;
  };
  assignments: {
    completed: number;
    due: number;
    overdue: number;
  };
  focusMinutes: number;
  grade: {
    letter: string | null;
    points: number | null;
  } | null;
}

export interface MobileWeeklyReviewData {
  userId: string;
  weekStartKey: string;
  weekEndKey: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  scorecard: MobileWeeklyScorecard;
  metrics: {
    totalClassesScheduled: number;
    totalClassesAttended: number;
    attendanceRate: number;
    totalFocusMinutes: number;
    totalSessionsCount: number;
    assignmentsCompleted: number;
    assignmentsDue: number;
    assignmentsOverdue: number;
    studyPlanItemsCompleted: number;
    studyPlanItemsTotal: number;
  };
  courseSummaries: MobileCourseWeeklySummary[];
  highlights: string[];
  recommendations: string[];
  aiExecutiveSummary: string | null;
  generatedAt: string;
}

