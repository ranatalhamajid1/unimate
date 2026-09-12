import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { findUserById } from "@/app/lib/users";
import { getDashboardData } from "@/app/lib/dashboard-aggregation";
import type {
  MobileScheduleClass,
  MobileAssignment,
  MobileExam,
  MobilePriorityItem,
  MobileStudyPlanTask,
  MobileDashboardData,
} from "@/app/lib/mobile-types";

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

    // 2. Fetch canonical aggregated dashboard data
    const data = await getDashboardData(userId);

    // Format schedule
    const schedule: MobileScheduleClass[] = data.schedule.map((e) => ({
      id: e.id,
      time: e.time,
      startTime: e.time.split(" - ")[0] || "",
      endTime: e.time.split(" - ")[1] || "",
      name: e.courseName || e.name,
      code: e.courseCode || "",
      room: e.room,
      type: (e.type.toLowerCase() === "lab"
        ? "lab"
        : "lecture") as "lecture" | "lab" | "tutorial" | "other",
      color: "#2563eb",
    }));

    // Format assignments
    const assignments: MobileAssignment[] = data.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      courseName: a.courseName || a.course,
      courseCode: a.courseCode || "",
      dueLabel: a.dueLabel,
      dueDate: "",
      dueSoon: a.dueSoon,
      priority: "MEDIUM",
      status: a.status === "completed" ? "COMPLETED" : a.status === "in-progress" ? "IN_PROGRESS" : "NOT_STARTED",
    }));

    // Format next exam
    let nextExam: MobileExam | null = null;
    if (data.nextExam) {
      nextExam = {
        id: data.nextExam.id,
        title: data.nextExam.title,
        courseName: data.nextExam.courseName,
        courseCode: data.nextExam.courseCode,
        courseColor: data.nextExam.courseColor || "#2563eb",
        type: data.nextExam.type,
        date: data.nextExam.date,
        time: data.nextExam.time,
        room: data.nextExam.room || "Room TBA",
        countdown: data.nextExam.countdown,
        daysRemaining: data.nextExam.daysRemaining,
        preparationProgress: data.nextExam.preparationProgress,
      };
    }

    // Format daily priorities from canonical priority engine
    const priorities: MobilePriorityItem[] = data.priorities.map((p) => {
      let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      if (p.urgencyTier === "OVERDUE" || p.urgencyTier === "CRITICAL") severity = "CRITICAL";
      else if (p.urgencyTier === "HIGH") severity = "HIGH";
      else if (p.urgencyTier === "NORMAL") severity = "LOW";

      return {
        id: p.id,
        type: "ASSIGNMENT",
        title: p.action,
        description: p.reason,
        severity,
        actionUrl: "/(tabs)/assignments",
        courseName: p.courseName,
        courseCode: p.courseCode,
      };
    });

    // Format active study plan
    let formattedActivePlan = null;
    if (data.activePlan) {
      const items: MobileStudyPlanTask[] = (data.activePlan.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString() : new Date().toISOString(),
        duration: item.duration || 0,
        completed: Boolean(item.completed),
        courseName: item.course ? item.course.name : undefined,
      }));

      const completedCount = items.filter((i) => i.completed).length;

      formattedActivePlan = {
        id: data.activePlan.id,
        title: data.activePlan.title,
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
        plan: data.isPro ? "PRO" : "FREE",
        isPro: data.isPro,
        status: "ACTIVE",
      },
      greeting: data.greeting,
      dateString: data.dateString,
      unreadNotificationCount: data.unreadNotificationCount,
      stats: {
        gpa: {
          value: data.academic.gpaString,
          sub: data.academic.gpaSub,
        },
        attendance: {
          value: data.academic.attendanceString,
          sub: data.academic.attendanceSub,
        },
        assignmentsDue: {
          count: data.assignments.length,
          sub: "Due this week",
        },
        studyHours: {
          formatted: data.weeklyStudy.formatted,
          minutes: data.weeklyStudy.minutes,
          sub: "This week (real)",
        },
      },
      priorities: {
        criticalCount: priorities.filter((p) => p.severity === "CRITICAL").length,
        highCount: priorities.filter((p) => p.severity === "HIGH").length,
        mediumCount: priorities.filter((p) => p.severity === "MEDIUM").length,
        lowCount: priorities.filter((p) => p.severity === "LOW").length,
        isCaughtUp: priorities.length === 0,
        items: priorities,
      },
      todaySchedule: schedule,
      upcomingAssignments: assignments,
      nextExam,
      activeStudyPlan: formattedActivePlan,
      academicInsights: (data.academicInsights || []).map((insight: any) => ({
        id: insight.id,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        actionUrl: insight.actionUrl,
        category: insight.category,
      })),
      goals: (data.goals || []).map((g: any) => ({
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
      weeklyStudyProgress: [
        { day: "Mon", hours: 0, isToday: false },
        { day: "Tue", hours: 0, isToday: false },
        { day: "Wed", hours: 0, isToday: false },
        { day: "Thu", hours: 0, isToday: false },
        { day: "Fri", hours: 0, isToday: false },
        { day: "Sat", hours: 0, isToday: false },
        { day: "Sun", hours: 0, isToday: true },
      ],
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
