import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { findUserById } from "@/app/lib/users";
import { getTodayTimetable } from "@/app/lib/timetable";
import { getUpcomingAssignments, getDueThisWeekCount } from "@/app/lib/assignments";
import { getNextExam } from "@/app/lib/exams";
import { getAcademicOverview } from "@/app/lib/academic";
import {
  generateAcademicNotifications,
  getUnreadNotificationCount,
} from "@/app/lib/notifications";
import { getStudentPriorities } from "@/app/lib/student-intelligence";
import { getWeeklyStudyTotal, getWeeklyStudyProgress } from "@/app/lib/study-sessions";
import { getAcademicInsights } from "@/app/lib/academic-insights";
import { calculateStudentGoalsProgress } from "@/app/lib/goals";
import { getUserActiveStudyPlan } from "@/app/lib/study-plans";
import { getUserSubscription } from "@/app/lib/entitlements";
import { getPKTDateParts } from "@/app/lib/timezone";
import { formatDueLabel } from "@/app/lib/assignment-definitions";
import {
  formatExamDate,
  formatExamTime,
  formatCountdown,
  calculateDaysRemaining,
  EXAM_TYPES,
} from "@/app/lib/exam-definitions";
import type {
  MobileScheduleClass,
  MobileAssignment,
  MobileExam,
  MobilePriorityItem,
  MobileStudyPlanTask,
  MobileDashboardData,
} from "@/app/lib/mobile-types";

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

export async function GET(req: NextRequest) {
  try {
    // 1. Session verification — strictly server-side token authentication
    const session = await authenticateMobile(req);
    if (!session || !session.userId) {
      return unauthorizedResponse();
    }

    const userId = session.userId;

    // Verify user exists in database
    const user = await findUserById(userId);
    if (!user) {
      return unauthorizedResponse("User account not found");
    }

    const now = new Date();
    const pkt = getPKTDateParts(now);
    const currentHour = pkt.hours;
    const greeting = getGreeting(currentHour);
    const dateString = getDateString(now);

    // Trigger academic notification generator
    await generateAcademicNotifications(userId);

    // Parallel fetch of all student command center data from PostgreSQL
    const [
      prioritiesReport,
      todayEntries,
      upcomingAssignments,
      dueThisWeekCount,
      nextExamRecord,
      academicOverview,
      unreadNotificationCount,
      weeklyStudy,
      studyDays,
      academicInsights,
      studentGoals,
      activePlan,
      subscription,
    ] = await Promise.all([
      getStudentPriorities(userId, now),
      getTodayTimetable(userId, pkt.dayOfWeek),
      getUpcomingAssignments(userId, 5),
      getDueThisWeekCount(userId),
      getNextExam(userId),
      getAcademicOverview(userId),
      getUnreadNotificationCount(userId),
      getWeeklyStudyTotal(userId, now),
      getWeeklyStudyProgress(userId, now),
      getAcademicInsights(userId),
      calculateStudentGoalsProgress(userId),
      getUserActiveStudyPlan(userId),
      getUserSubscription(userId),
    ]);

    // Format schedule
    const schedule: MobileScheduleClass[] = todayEntries.map((e) => ({
      id: e.id,
      time: `${e.startTime} - ${e.endTime}`,
      startTime: e.startTime,
      endTime: e.endTime,
      name: e.course ? e.course.name : "Class",
      code: e.course ? e.course.code : "",
      room: e.room || "Room TBA",
      type: (e.type.toLowerCase() === "lab"
        ? "lab"
        : e.type.toLowerCase() === "tutorial"
        ? "tutorial"
        : "lecture") as "lecture" | "lab" | "tutorial" | "other",
      color: e.course?.color || "#2563eb",
    }));

    // Format assignments
    const assignments: MobileAssignment[] = upcomingAssignments.map((a) => {
      const dueInfo = formatDueLabel(new Date(a.dueDate), a.status);
      return {
        id: a.id,
        title: a.title,
        courseName: a.course ? a.course.name : "Course",
        courseCode: a.course ? a.course.code : "",
        dueLabel: dueInfo.text,
        dueDate: a.dueDate.toISOString(),
        dueSoon: dueInfo.isSoon,
        priority: a.priority,
        status: a.status,
      };
    });

    // Format next exam
    let nextExam: MobileExam | null = null;
    if (nextExamRecord && nextExamRecord.course) {
      nextExam = {
        id: nextExamRecord.id,
        title: nextExamRecord.title,
        courseName: nextExamRecord.course.name,
        courseCode: nextExamRecord.course.code,
        courseColor: nextExamRecord.course.color,
        type:
          EXAM_TYPES[nextExamRecord.type as keyof typeof EXAM_TYPES] ||
          nextExamRecord.type,
        date: formatExamDate(new Date(nextExamRecord.examDate)),
        time: formatExamTime(new Date(nextExamRecord.examDate)),
        room: nextExamRecord.room || "Room TBA",
        countdown: formatCountdown(
          new Date(nextExamRecord.examDate),
          nextExamRecord.status
        ).text,
        daysRemaining: calculateDaysRemaining(new Date(nextExamRecord.examDate)),
        preparationProgress: nextExamRecord.preparationProgress,
      };
    }

    // Format daily priorities
    const priorities: MobilePriorityItem[] = prioritiesReport.priorities.map(
      (p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        description: p.description,
        severity: p.severity,
        actionUrl: p.actionUrl,
        courseName: p.courseName,
        courseCode: p.courseCode,
      })
    );

    // Format active study plan
    let formattedActivePlan = null;
    if (activePlan) {
      const items: MobileStudyPlanTask[] = (activePlan.items || []).map((item) => ({
        id: item.id,
        title: item.title,
        scheduledAt: item.scheduledAt.toISOString(),
        duration: item.duration,
        completed: item.completed,
        courseName: item.course ? item.course.name : undefined,
      }));

      const completedCount = items.filter((i) => i.completed).length;

      formattedActivePlan = {
        id: activePlan.id,
        title: activePlan.title,
        completedItems: completedCount,
        totalItems: items.length,
        items,
      };
    }

    const payload: MobileDashboardData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
      subscription: {
        plan: subscription.plan,
        isPro: subscription.isPro,
        status: subscription.status,
      },
      greeting,
      dateString,
      unreadNotificationCount,
      stats: {
        gpa: {
          value: academicOverview.gpaString,
          sub: academicOverview.gpaSub,
        },
        attendance: {
          value: academicOverview.attendanceString,
          sub: academicOverview.attendanceSub,
        },
        assignmentsDue: {
          count: dueThisWeekCount,
          sub: "Due this week",
        },
        studyHours: {
          formatted: weeklyStudy.formatted,
          minutes: weeklyStudy.minutes,
          sub: "This week (real)",
        },
      },
      priorities: {
        criticalCount: prioritiesReport.criticalCount,
        highCount: prioritiesReport.highCount,
        mediumCount: prioritiesReport.mediumCount,
        lowCount: prioritiesReport.lowCount,
        isCaughtUp: prioritiesReport.isCaughtUp,
        items: priorities,
      },
      todaySchedule: schedule,
      upcomingAssignments: assignments,
      nextExam,
      activeStudyPlan: formattedActivePlan,
      academicInsights: academicInsights.map((insight) => ({
        id: insight.id,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        actionUrl: insight.actionUrl,
        category: insight.category,
      })),
      goals: studentGoals.map((g) => ({
        goalId: g.goalId,
        type: g.type,
        label: g.label,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        percentage: g.percentage,
        unit: g.unit,
        isConfigured: g.isConfigured,
        isAtRisk: g.isAtRisk,
      })),
      weeklyStudyProgress: studyDays,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error in GET /api/mobile/dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load dashboard data. Please try again.",
      },
      { status: 500 }
    );
  }
}
