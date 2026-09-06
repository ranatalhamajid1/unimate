import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getAcademicOverview } from "@/app/lib/academic";
import { getUpcomingExams } from "@/app/lib/exams";
import { getUpcomingAssignments } from "@/app/lib/assignments";
import { getTodayTimetable } from "@/app/lib/timetable";
import { getUserGoals } from "@/app/lib/goals";
import { getWeeklyStudyTotal } from "@/app/lib/study-sessions";
import { getPKTDateParts, getPKTDayBounds, getPKTWeekBounds } from "@/app/lib/timezone";
import { calculateDaysRemaining } from "@/app/lib/exam-definitions";
import { ASSIGNMENT_STATUSES } from "@/app/lib/assignment-definitions";

export type PrioritySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type StudentPriority = {
  id: string;
  type:
    | "OVERDUE_ASSIGNMENT"
    | "EXAM_TODAY"
    | "EXAM_TOMORROW"
    | "EXAM_IMMINENT"
    | "ASSIGNMENT_DUE_TODAY"
    | "ASSIGNMENT_DUE_SOON"
    | "ATTENDANCE_CRITICAL"
    | "ATTENDANCE_WARNING"
    | "STUDY_PLAN_TASK"
    | "CLASS_TODAY"
    | "GOAL_AT_RISK";
  title: string;
  description: string;
  severity: PrioritySeverity;
  actionUrl: string;
  courseName?: string;
  courseCode?: string;
  relevantDate?: Date;
  rankWeight: number; // Higher number = higher priority for deterministic sorting
};

export type StudentIntelligenceReport = {
  priorities: StudentPriority[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  isCaughtUp: boolean;
};

/**
 * Server-side intelligence layer that evaluates all student records and
 * generates a deterministically ranked list of daily priorities.
 */
export async function getStudentPriorities(
  userId: string,
  referenceDate: Date = new Date()
): Promise<StudentIntelligenceReport> {
  const priorities: StudentPriority[] = [];
  const pkt = getPKTDateParts(referenceDate);
  const { start: todayStart, end: todayEnd } = getPKTDayBounds(referenceDate);

  // Parallel fetch of real student context
  const [
    assignments,
    exams,
    academicOverview,
    todayTimetable,
    activeStudyPlan,
    userGoals,
    weeklyStudy,
  ] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId },
      include: { course: { select: { name: true, code: true } } },
      orderBy: { dueDate: "asc" },
    }),
    getUpcomingExams(userId),
    getAcademicOverview(userId),
    getTodayTimetable(userId, pkt.dayOfWeek),
    prisma.studyPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      include: {
        items: {
          where: {
            scheduledAt: { gte: todayStart, lte: todayEnd },
            completed: false,
          },
          include: { course: { select: { name: true, code: true } } },
          orderBy: { scheduledAt: "asc" },
        },
      },
    }),
    getUserGoals(userId),
    getWeeklyStudyTotal(userId, referenceDate),
  ]);

  const nowMs = referenceDate.getTime();

  // 1. Evaluate Overdue Assignments (Rank Weight: 1000+)
  for (const asgn of assignments) {
    if (asgn.status === ASSIGNMENT_STATUSES.COMPLETED) continue;

    const dueMs = new Date(asgn.dueDate).getTime();
    if (dueMs < todayStart.getTime()) {
      const daysOverdue = Math.max(
        1,
        Math.floor((todayStart.getTime() - dueMs) / (24 * 60 * 60 * 1000))
      );
      priorities.push({
        id: `overdue-asgn-${asgn.id}`,
        type: "OVERDUE_ASSIGNMENT",
        title: `${asgn.course?.code || "Assignment"}: ${asgn.title} is overdue`,
        description: `Overdue by ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}. Immediate submission required.`,
        severity: "CRITICAL",
        actionUrl: "/dashboard/assignments",
        courseName: asgn.course?.name,
        courseCode: asgn.course?.code,
        relevantDate: asgn.dueDate,
        rankWeight: 1000 + daysOverdue,
      });
    }
  }

  // 2. Evaluate Exams Today / Tomorrow / Imminent (Rank Weight: 800 - 950)
  for (const exam of exams) {
    const daysRemaining = calculateDaysRemaining(exam.examDate);

    if (daysRemaining === 0) {
      priorities.push({
        id: `exam-today-${exam.id}`,
        type: "EXAM_TODAY",
        title: `${exam.course?.code || "Exam"}: ${exam.title} is TODAY`,
        description: `Scheduled for today at ${exam.room ? `Room ${exam.room}` : "campus"}. Current prep: ${exam.preparationProgress}%.`,
        severity: "CRITICAL",
        actionUrl: "/dashboard/exams",
        courseName: exam.course?.name,
        courseCode: exam.course?.code,
        relevantDate: exam.examDate,
        rankWeight: 950,
      });
    } else if (daysRemaining === 1) {
      priorities.push({
        id: `exam-tomorrow-${exam.id}`,
        type: "EXAM_TOMORROW",
        title: `${exam.course?.code || "Exam"}: ${exam.title} is TOMORROW`,
        description: `Exam tomorrow! Final review recommended. Current preparation is at ${exam.preparationProgress}%.`,
        severity: exam.preparationProgress < 60 ? "CRITICAL" : "HIGH",
        actionUrl: "/dashboard/exams",
        courseName: exam.course?.name,
        courseCode: exam.course?.code,
        relevantDate: exam.examDate,
        rankWeight: 900,
      });
    } else if (daysRemaining <= 3) {
      const isLowPrep = exam.preparationProgress < 50;
      priorities.push({
        id: `exam-imminent-${exam.id}`,
        type: "EXAM_IMMINENT",
        title: `${exam.course?.code || "Exam"}: ${exam.title} in ${daysRemaining} days`,
        description: `Imminent exam · Preparation is at ${exam.preparationProgress}%. Prioritize targeted revision.`,
        severity: isLowPrep ? "HIGH" : "MEDIUM",
        actionUrl: "/dashboard/exams",
        courseName: exam.course?.name,
        courseCode: exam.course?.code,
        relevantDate: exam.examDate,
        rankWeight: 800 + (isLowPrep ? 50 : 0),
      });
    }
  }

  // 3. Evaluate Assignments Due Today or Tomorrow (Rank Weight: 700 - 750)
  for (const asgn of assignments) {
    if (asgn.status === ASSIGNMENT_STATUSES.COMPLETED) continue;

    const dueMs = new Date(asgn.dueDate).getTime();
    if (dueMs >= todayStart.getTime() && dueMs <= todayEnd.getTime()) {
      priorities.push({
        id: `asgn-due-today-${asgn.id}`,
        type: "ASSIGNMENT_DUE_TODAY",
        title: `${asgn.course?.code || "Assignment"}: ${asgn.title} is due TODAY`,
        description: `Due before midnight today. Complete and submit on your university portal.`,
        severity: "HIGH",
        actionUrl: "/dashboard/assignments",
        courseName: asgn.course?.name,
        courseCode: asgn.course?.code,
        relevantDate: asgn.dueDate,
        rankWeight: 750,
      });
    } else {
      const hoursUntilDue = (dueMs - nowMs) / (1000 * 60 * 60);
      if (hoursUntilDue > 0 && hoursUntilDue <= 48) {
        priorities.push({
          id: `asgn-due-soon-${asgn.id}`,
          type: "ASSIGNMENT_DUE_SOON",
          title: `${asgn.course?.code || "Assignment"}: ${asgn.title} due within 48h`,
          description: `Due in approximately ${Math.round(hoursUntilDue)} hours. Start working to prevent last-minute stress.`,
          severity: "HIGH",
          actionUrl: "/dashboard/assignments",
          courseName: asgn.course?.name,
          courseCode: asgn.course?.code,
          relevantDate: asgn.dueDate,
          rankWeight: 700,
        });
      }
    }
  }

  // 4. Critical Attendance Warnings (Rank Weight: 600 - 650)
  for (const courseItem of academicOverview.courses) {
    if (courseItem.attendancePercentage !== null) {
      if (courseItem.attendancePercentage < 70) {
        priorities.push({
          id: `att-critical-${courseItem.courseId}`,
          type: "ATTENDANCE_CRITICAL",
          title: `${courseItem.courseCode} attendance is critically low (${courseItem.attendancePercentage}%)`,
          description: `Below 70%! Missing further lectures risks exam debarment. Attend all remaining classes.`,
          severity: "HIGH",
          actionUrl: "/dashboard/academics",
          courseName: courseItem.courseName,
          courseCode: courseItem.courseCode,
          rankWeight: 650,
        });
      } else if (courseItem.attendancePercentage < 75) {
        priorities.push({
          id: `att-warn-${courseItem.courseId}`,
          type: "ATTENDANCE_WARNING",
          title: `${courseItem.courseCode} attendance is ${courseItem.attendancePercentage}%`,
          description: `Below the 75% threshold. Ensure attendance in upcoming lectures to recover.`,
          severity: "MEDIUM",
          actionUrl: "/dashboard/academics",
          courseName: courseItem.courseName,
          courseCode: courseItem.courseCode,
          rankWeight: 600,
        });
      }
    }
  }

  // 5. Today's Study Plan Tasks (Rank Weight: 500)
  if (activeStudyPlan && activeStudyPlan.items.length > 0) {
    for (const item of activeStudyPlan.items) {
      priorities.push({
        id: `plan-item-${item.id}`,
        type: "STUDY_PLAN_TASK",
        title: `Planned Study: ${item.title}`,
        description: `${item.duration}m scheduled today${item.course ? ` for ${item.course.code}` : ""}.`,
        severity: "MEDIUM",
        actionUrl: "/dashboard/study-plan",
        courseName: item.course?.name,
        courseCode: item.course?.code,
        relevantDate: item.scheduledAt,
        rankWeight: 500,
      });
    }
  }

  // 6. Today's Classes (Rank Weight: 300 - 350)
  for (const entry of todayTimetable) {
    priorities.push({
      id: `class-today-${entry.id}`,
      type: "CLASS_TODAY",
      title: `${entry.course ? entry.course.code : "Class"} at ${entry.startTime}`,
      description: `${entry.course ? entry.course.name : "Class"} (${entry.type}) in ${entry.room || "Room TBA"}.`,
      severity: "LOW",
      actionUrl: "/dashboard/timetable",
      courseName: entry.course?.name,
      courseCode: entry.course?.code,
      rankWeight: 300,
    });
  }

  // 7. Active Goal Reminders if lagging (Rank Weight: 200)
  for (const goal of userGoals) {
    if (goal.type === "WEEKLY_STUDY_HOURS" && pkt.dayOfWeek >= 5) {
      // Friday, Saturday, Sunday - check if far behind weekly target
      if (weeklyStudy.hours < goal.targetValue * 0.5) {
        priorities.push({
          id: `goal-study-lag-${goal.id}`,
          type: "GOAL_AT_RISK",
          title: `Study Goal Check: ${weeklyStudy.formatted} / ${goal.targetValue}h`,
          description: `You are behind on your weekly study hours target with the weekend approaching.`,
          severity: "LOW",
          actionUrl: "/dashboard/goals",
          rankWeight: 200,
        });
      }
    }
  }

  // Deterministic sort: highest rankWeight first; if equal, earlier relevantDate
  priorities.sort((a, b) => {
    if (b.rankWeight !== a.rankWeight) {
      return b.rankWeight - a.rankWeight;
    }
    if (a.relevantDate && b.relevantDate) {
      return a.relevantDate.getTime() - b.relevantDate.getTime();
    }
    return a.title.localeCompare(b.title);
  });

  const criticalCount = priorities.filter((p) => p.severity === "CRITICAL").length;
  const highCount = priorities.filter((p) => p.severity === "HIGH").length;
  const mediumCount = priorities.filter((p) => p.severity === "MEDIUM").length;
  const lowCount = priorities.filter((p) => p.severity === "LOW").length;

  return {
    priorities,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    isCaughtUp: criticalCount === 0 && highCount === 0,
  };
}
