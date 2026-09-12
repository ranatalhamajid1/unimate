import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getPKTDateParts, getPKTDayBounds, getPKTWeekBounds } from "@/app/lib/timezone";
import { getTodayTimetable } from "@/app/lib/timetable";
import { getUpcomingAssignments, getDueThisWeekCount } from "@/app/lib/assignments";
import { getNextExam } from "@/app/lib/exams";
import { getAcademicOverview } from "@/app/lib/academic";
import { getUserProfile } from "@/app/lib/profile";
import { getUnreadNotificationCount, getUserNotifications, generateAcademicNotifications } from "@/app/lib/notifications";
import { getStudentPriorities as getCanonicalPriorities, PrioritizedTask, PriorityUrgencyTier } from "@/app/lib/intelligence/priority-engine";
import { getStudentAttendanceIntelligence, CourseAttendanceInsight } from "@/app/lib/intelligence/attendance-intel";
import { getStudentExamReadiness, StudentExamReadinessSummary } from "@/app/lib/intelligence/exam-readiness";
import { getStudentTodayScheduleGaps, ScheduleGap } from "@/app/lib/intelligence/schedule-gaps";
import { getStudentWeeklyProgress, WeeklyProgressSummary } from "@/app/lib/intelligence/weekly-progress";
import { getWeeklyStudyTotal, getWeeklyStudyProgress } from "@/app/lib/study-sessions";
import { calculateStudentGoalsProgress } from "@/app/lib/goals";
import { getUserActiveStudyPlan } from "@/app/lib/study-plans";
import { getUserSubscription } from "@/app/lib/entitlements";
import { formatDueLabel, ASSIGNMENT_STATUSES } from "@/app/lib/assignment-definitions";
import {
  formatExamDate,
  formatExamTime,
  formatCountdown,
  calculateDaysRemaining,
  EXAM_TYPES,
} from "@/app/lib/exam-definitions";
import type { ScheduleClass, Assignment as DashboardAssignment, StatCard } from "@/app/lib/dashboard-data";
import { getAcademicInsights } from "@/app/lib/academic-insights";
import { resolveStudentHierarchyContext, getCampusIntelligence } from "@/app/lib/discovery";

export type { WeeklyProgressSummary };

export interface AcademicOverviewData {
  gpa: number | null;
  gpaString: string;
  gpaSub: string;
  attendance: number | null;
  attendanceString: string;
  attendanceSub: string;
  attendedClassesCount: number;
  totalClassesCount: number;
  configuredThreshold: number;
  isBelowThreshold: boolean;
}

export interface NormalizedNextExam {
  id: string;
  courseName: string;
  courseCode: string;
  courseColor?: string;
  title: string;
  type: string;
  date: string;
  time: string;
  room?: string;
  countdown: string;
  daysRemaining: number;
  preparationProgress: number;
}

export interface NormalizedDashboardData {
  greeting: string;
  dateString: string;
  currentHour: number;
  isPro: boolean;
  profile: {
    avatarUrl: string | null;
    universityName: string | null;
    universityVerified: boolean;
    degreeProgram: string | null;
    currentSemester: string | null;
    profileCompletionPercentage: number;
  };
  schedule: (ScheduleClass & { courseName?: string; courseCode?: string })[];
  assignments: (DashboardAssignment & { courseName?: string; courseCode?: string })[];
  nextExam: NormalizedNextExam | null;
  priorities: PrioritizedTask[];
  scheduleGaps: ScheduleGap[];
  whyTheseMatter: string;
  academic: AcademicOverviewData;
  weeklyProgress: WeeklyProgressSummary;
  weeklyStudy: { formatted: string; minutes: number };
  stats: StatCard[];
  activePlan: any | null;
  goals: any[];
  academicInsights: any[];
  notifications: any[];
  unreadNotificationCount: number;
  campusIntelligence?: {
    upcomingEventsThisWeek: number;
    newAnnouncementsCount: number;
    newDepartmentResourcesCount: number;
    activeCommunitiesJoinedCount: number;
  };
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDateString(now: Date): string {
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Aggregates all student command center data into a clean, normalized view-model.
 * Enforces single-pass bounded parallel fetching, zero N+1 queries, and user data isolation.
 */
export async function getDashboardData(
  userId: string,
  now: Date = new Date(),
  attendanceThreshold: number = 0.75
): Promise<NormalizedDashboardData> {
  const pkt = getPKTDateParts(now);
  const currentHour = pkt.hours;
  const greeting = getGreeting(currentHour);
  const dateString = getDateString(now);

  // Trigger academic notifications generator (self-healing, idempotent)
  await generateAcademicNotifications(userId).catch(() => {});

  // Bounded parallel fetch across all relevant academic entities
  const [
    profile,
    todayEntries,
    upcomingAssignments,
    dueThisWeekCount,
    nextExamRecord,
    academicOverview,
    attendanceIntel,
    examReadiness,
    priorities,
    scheduleGaps,
    weeklyProgress,
    weeklyStudy,
    studyDays,
    studentGoals,
    activePlan,
    subscription,
    unreadNotificationCount,
    recentNotifications,
    academicInsights,
    campusIntelligence,
  ] = await Promise.all([
    getUserProfile(userId),
    getTodayTimetable(userId, pkt.dayOfWeek),
    getUpcomingAssignments(userId, 5),
    getDueThisWeekCount(userId),
    getNextExam(userId),
    getAcademicOverview(userId),
    getStudentAttendanceIntelligence(userId, attendanceThreshold),
    getStudentExamReadiness(userId, now),
    getCanonicalPriorities(userId, 5, now),
    getStudentTodayScheduleGaps(userId, now),
    getStudentWeeklyProgress(userId, now),
    getWeeklyStudyTotal(userId, now),
    getWeeklyStudyProgress(userId, now),
    calculateStudentGoalsProgress(userId),
    getUserActiveStudyPlan(userId),
    getUserSubscription(userId),
    getUnreadNotificationCount(userId),
    getUserNotifications(userId, { limit: 5 }),
    getAcademicInsights(userId),
    resolveStudentHierarchyContext(userId)
      .then((ctx) => getCampusIntelligence(ctx))
      .then((intel) => intel.stats)
      .catch(() => undefined),
  ]);

  // Explainable deterministic "Why these matter" synthesis
  let whyTheseMatter = "";
  if (priorities.length > 0) {
    const topTask = priorities[0];
    whyTheseMatter = `Focus on ${topTask.action} first. ${topTask.reason}.`;
    if (scheduleGaps.length > 0 && scheduleGaps[0].durationMinutes >= 60) {
      whyTheseMatter += ` You have a ${scheduleGaps[0].durationMinutes}-minute study window (${scheduleGaps[0].startTime} - ${scheduleGaps[0].endTime}) to make progress.`;
    }
  } else if (nextExamRecord) {
    whyTheseMatter = `Assignments are caught up. Recommend dedicating focus to upcoming ${nextExamRecord.title}.`;
  } else {
    whyTheseMatter = "Your academic slate is clean today. Maintain your momentum by reviewing upcoming lecture notes.";
  }

  // Format schedule
  const schedule = todayEntries.map((e) => ({
    id: e.id,
    time: `${e.startTime} - ${e.endTime}`,
    name: e.course ? `${e.course.code} — ${e.course.name}` : "Class",
    room: e.room || "Room TBA",
    type: (e.type.toLowerCase() === "lab" ? "lab" : "lecture") as "lecture" | "lab",
    courseName: e.course?.name || "Class",
    courseCode: e.course?.code || "",
  }));

  // Format assignments
  const assignments = upcomingAssignments.map((a) => {
    const dueInfo = formatDueLabel(new Date(a.dueDate), a.status);
    let status: "not-started" | "in-progress" | "completed" = "not-started";
    if (a.status === ASSIGNMENT_STATUSES.COMPLETED) status = "completed";
    else if (a.status === ASSIGNMENT_STATUSES.IN_PROGRESS) status = "in-progress";

    return {
      id: a.id,
      title: a.title,
      course: a.course ? `${a.course.code} · ${a.course.name}` : "Course",
      courseName: a.course?.name || "Course",
      courseCode: a.course?.code || "",
      dueLabel: dueInfo.text,
      dueSoon: dueInfo.isSoon,
      status,
    };
  });

  // Format next exam
  const nextExam: NormalizedNextExam | null =
    nextExamRecord && nextExamRecord.course
      ? {
          id: nextExamRecord.id,
          courseName: nextExamRecord.course.name,
          courseCode: nextExamRecord.course.code,
          courseColor: nextExamRecord.course.color,
          title: nextExamRecord.title,
          type: EXAM_TYPES[nextExamRecord.type as keyof typeof EXAM_TYPES] || nextExamRecord.type,
          date: formatExamDate(new Date(nextExamRecord.examDate)),
          time: formatExamTime(new Date(nextExamRecord.examDate)),
          room: nextExamRecord.room || undefined,
          countdown: formatCountdown(new Date(nextExamRecord.examDate), nextExamRecord.status).text,
          daysRemaining: calculateDaysRemaining(new Date(nextExamRecord.examDate)),
          preparationProgress: nextExamRecord.preparationProgress,
        }
      : null;

  // Attendance intelligence evaluation using configured threshold
  const totalAttended = attendanceIntel.courses.reduce((sum, c) => sum + c.attendedClasses, 0);
  const totalScheduled = attendanceIntel.courses.reduce((sum, c) => sum + c.totalClasses, 0);
  const overallPercentage = attendanceIntel.overallPercentage;
  const isBelowThreshold = overallPercentage !== null && overallPercentage < attendanceThreshold * 100;

  const academic: AcademicOverviewData = {
    gpa: academicOverview.gpa,
    gpaString: academicOverview.gpaString,
    gpaSub: academicOverview.gpaSub,
    attendance: overallPercentage,
    attendanceString: academicOverview.attendanceString,
    attendanceSub: academicOverview.attendanceSub,
    attendedClassesCount: totalAttended,
    totalClassesCount: totalScheduled,
    configuredThreshold: attendanceThreshold,
    isBelowThreshold,
  };

  const stats: StatCard[] = [
    {
      id: "gpa",
      label: "GPA",
      value: academicOverview.gpaString,
      sub: academicOverview.gpaSub,
      trend: "up",
    },
    {
      id: "attendance",
      label: "Attendance",
      value: academicOverview.attendanceString,
      sub: academicOverview.attendanceSub,
      trend: isBelowThreshold ? "down" : "neutral",
    },
    {
      id: "assignments",
      label: "Assignments",
      value: String(dueThisWeekCount),
      sub: "Due this week",
      trend: "neutral",
    },
    {
      id: "study-hours",
      label: "Study hours",
      value: weeklyStudy.formatted,
      sub: "This week (real)",
      trend: "up",
    },
  ];

  return {
    greeting,
    dateString,
    currentHour,
    isPro: subscription.isPro,
    profile: {
      avatarUrl: profile?.avatarUrl || null,
      universityName: profile?.university?.name || null,
      universityVerified: profile?.university?.isVerified || false,
      degreeProgram: profile?.degreeProgram || null,
      currentSemester: profile?.currentSemester || null,
      profileCompletionPercentage: profile?.profileCompletionPercentage || 100,
    },
    schedule,
    assignments,
    nextExam,
    priorities,
    scheduleGaps,
    whyTheseMatter,
    academic,
    weeklyProgress,
    weeklyStudy,
    stats,
    activePlan,
    goals: studentGoals,
    academicInsights,
    notifications: recentNotifications,
    unreadNotificationCount,
    campusIntelligence,
  };
}
