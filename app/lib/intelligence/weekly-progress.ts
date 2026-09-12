import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getPKTWeekBounds } from "@/app/lib/timezone";

export type PreviousWeekComparison = {
  hasHistoricalData: boolean;
  prevWeekStartStr: string;
  prevWeekEndStr: string;
  prevStudyHours: number;
  prevAssignmentsCompletedCount: number;
  studyHoursDelta: number;
  studyHoursDeltaString: string;
  assignmentsCompletedDelta: number;
  comparisonSummary: string;
};

export type WeeklyProgressSummary = {
  weekStartStr: string;
  weekEndStr: string;
  assignmentsCompletedCount: number;
  assignmentsOverdueCount: number;
  studySessionsLoggedCount: number;
  studyMinutesTotal: number;
  studyHoursTotal: number;
  examsInNext7DaysCount: number;
  whatWentWell: string[];
  whatNeedsAttention: string[];
  recommendedNextSteps: string[];
  previousWeekComparison: PreviousWeekComparison;
};

/**
 * Generates an objective, non-judgmental weekly progress summary from real data,
 * including a factual comparison to the previous Asia/Karachi week.
 */
export async function getStudentWeeklyProgress(
  userId: string,
  now: Date = new Date()
): Promise<WeeklyProgressSummary> {
  const { start: weekStart, end: weekEnd } = getPKTWeekBounds(now);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Previous week bounds in PKT
  const prevWeekDate = new Date(weekStart.getTime() - 24 * 60 * 60 * 1000);
  const { start: prevWeekStart, end: prevWeekEnd } = getPKTWeekBounds(prevWeekDate);

  // Parallel fetch current and previous week data
  const [
    completedAssignments,
    overdueAssignments,
    studySessions,
    upcomingExams,
    goals,
    prevCompletedAssignments,
    prevStudySessions,
  ] = await Promise.all([
    // Assignments completed this week
    prisma.assignment.findMany({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
      select: { id: true, title: true },
    }),
    // Overdue uncompleted assignments
    prisma.assignment.findMany({
      where: {
        userId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
      select: { id: true, title: true },
    }),
    // Study sessions logged this week
    prisma.studySession.findMany({
      where: {
        userId,
        sessionDate: { gte: weekStart, lte: weekEnd },
      },
      select: { duration: true },
    }),
    // Exams in next 7 days
    prisma.exam.findMany({
      where: {
        userId,
        status: "UPCOMING",
        examDate: { gte: now, lte: next7Days },
      },
      select: { id: true, title: true },
    }),
    // Student active goals
    prisma.studentGoal.findMany({
      where: { userId, active: true },
    }),
    // Assignments completed previous week
    prisma.assignment.findMany({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: { gte: prevWeekStart, lte: prevWeekEnd },
      },
      select: { id: true },
    }),
    // Study sessions logged previous week
    prisma.studySession.findMany({
      where: {
        userId,
        sessionDate: { gte: prevWeekStart, lte: prevWeekEnd },
      },
      select: { duration: true },
    }),
  ]);

  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + s.duration, 0);
  const totalStudyHours = Number((totalStudyMinutes / 60).toFixed(1));

  // Previous week metrics
  const prevStudyMinutes = prevStudySessions.reduce((acc, s) => acc + s.duration, 0);
  const prevStudyHours = Number((prevStudyMinutes / 60).toFixed(1));
  const prevAssignmentsCompletedCount = prevCompletedAssignments.length;

  const hasHistoricalData = prevStudySessions.length > 0 || prevAssignmentsCompletedCount > 0;
  const studyHoursDelta = Number((totalStudyHours - prevStudyHours).toFixed(1));
  const studyHoursDeltaString = studyHoursDelta > 0 ? `+${studyHoursDelta}` : `${studyHoursDelta}`;
  const assignmentsCompletedDelta = completedAssignments.length - prevAssignmentsCompletedCount;

  let comparisonSummary = "No recorded activity for the previous week.";
  if (hasHistoricalData) {
    if (studyHoursDelta > 0) {
      comparisonSummary = `Study time is up by ${studyHoursDeltaString} hrs compared to last week (${prevStudyHours} hrs).`;
    } else if (studyHoursDelta < 0) {
      comparisonSummary = `Study time is down by ${Math.abs(studyHoursDelta)} hrs compared to last week (${prevStudyHours} hrs).`;
    } else {
      comparisonSummary = `Study time is on par with last week (${prevStudyHours} hrs).`;
    }
  }

  const previousWeekComparison: PreviousWeekComparison = {
    hasHistoricalData,
    prevWeekStartStr: prevWeekStart.toISOString().split("T")[0],
    prevWeekEndStr: prevWeekEnd.toISOString().split("T")[0],
    prevStudyHours,
    prevAssignmentsCompletedCount,
    studyHoursDelta,
    studyHoursDeltaString,
    assignmentsCompletedDelta,
    comparisonSummary,
  };

  const whatWentWell: string[] = [];
  const whatNeedsAttention: string[] = [];
  const recommendedNextSteps: string[] = [];

  // Wins
  if (completedAssignments.length > 0) {
    whatWentWell.push(`Completed ${completedAssignments.length} assignment${completedAssignments.length > 1 ? "s" : ""} this week.`);
  }
  if (totalStudyHours > 0) {
    whatWentWell.push(`Logged ${totalStudyHours} hour${totalStudyHours > 1 ? "s" : ""} of dedicated study sessions.`);
  }
  if (hasHistoricalData && studyHoursDelta > 0) {
    whatWentWell.push(`Increased study focus by ${studyHoursDeltaString} hours compared to last week.`);
  }
  if (whatWentWell.length === 0) {
    whatWentWell.push("Starting a new study week. Clean slate to build momentum.");
  }

  // Attention areas
  if (overdueAssignments.length > 0) {
    whatNeedsAttention.push(`${overdueAssignments.length} pending assignment${overdueAssignments.length > 1 ? "s are" : " is"} currently past deadline.`);
  }
  if (upcomingExams.length > 0) {
    whatNeedsAttention.push(`${upcomingExams.length} exam${upcomingExams.length > 1 ? "s are" : " is"} scheduled within the next 7 days.`);
  }
  if (whatNeedsAttention.length === 0) {
    whatNeedsAttention.push("No overdue deadlines or imminent exams.");
  }

  // Next steps
  if (overdueAssignments.length > 0) {
    recommendedNextSteps.push(`Focus on finishing the overdue ${overdueAssignments[0].title} first.`);
  } else if (upcomingExams.length > 0) {
    recommendedNextSteps.push(`Review key topics for upcoming ${upcomingExams[0].title}.`);
  } else {
    recommendedNextSteps.push("Plan ahead by reviewing syllabus milestones for the coming week.");
  }

  return {
    weekStartStr: weekStart.toISOString().split("T")[0],
    weekEndStr: weekEnd.toISOString().split("T")[0],
    assignmentsCompletedCount: completedAssignments.length,
    assignmentsOverdueCount: overdueAssignments.length,
    studySessionsLoggedCount: studySessions.length,
    studyMinutesTotal: totalStudyMinutes,
    studyHoursTotal: totalStudyHours,
    examsInNext7DaysCount: upcomingExams.length,
    whatWentWell,
    whatNeedsAttention,
    recommendedNextSteps,
    previousWeekComparison,
  };
}
