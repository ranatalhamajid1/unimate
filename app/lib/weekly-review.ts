import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getPKTDateParts, getPKTWeekBounds } from "@/app/lib/timezone";
import { GoogleGenAI } from "@google/genai";

export type ScorecardRating = "STRONG" | "ON_TRACK" | "NEEDS_ATTENTION" | "INSUFFICIENT_DATA";

export interface ScorecardDimension {
  rating: ScorecardRating;
  scorePercentage: number;
  label: string;
  summary: string;
}

export interface WeeklyScorecard {
  execution: ScorecardDimension;
  planning: ScorecardDimension;
  focus: ScorecardDimension;
  academicHealth: ScorecardDimension;
  overallGrade: "A" | "B" | "C" | "D" | "INCOMPLETE";
}

export interface CourseWeeklySummary {
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

export interface WeeklyReviewData {
  userId: string;
  weekStartKey: string;
  weekEndKey: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  scorecard: WeeklyScorecard;
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
  courseSummaries: CourseWeeklySummary[];
  highlights: string[];
  recommendations: string[];
  aiExecutiveSummary: string | null;
  generatedAt: string;
}

/**
 * Generates deterministic weekly academic review metrics and optional AI synthesis.
 */
export async function getWeeklyReview(
  userId: string,
  options?: {
    referenceDate?: Date;
    weekOffset?: number; // 0 = current week, -1 = last week
    isPro?: boolean;
  }
): Promise<WeeklyReviewData> {
  const baseDate = options?.referenceDate || new Date();
  const offsetWeeks = options?.weekOffset !== undefined ? options.weekOffset : -1; // Default to last completed week

  const targetDate = new Date(baseDate.getTime() + offsetWeeks * 7 * 24 * 60 * 60 * 1000);
  const { start: weekStartUtc, end: weekEndUtc } = getPKTWeekBounds(targetDate);

  const startPkt = getPKTDateParts(weekStartUtc);
  const endPkt = getPKTDateParts(weekEndUtc);

  // Check if target week covers current local time
  const currentWeekBounds = getPKTWeekBounds(new Date());
  const isCurrentWeek =
    weekStartUtc.getTime() === currentWeekBounds.start.getTime();

  // 1. Fetch user data in parallel
  const [
    courses,
    timetableEntries,
    attendanceRecords,
    assignments,
    studySessions,
    studyPlanItems,
    courseGrades,
    subscription,
  ] = await Promise.all([
    prisma.course.findMany({
      where: { userId },
      orderBy: { code: "asc" },
    }),
    prisma.timetableEntry.findMany({
      where: { userId },
    }),
    prisma.attendance.findMany({
      where: { userId },
    }),
    prisma.assignment.findMany({
      where: {
        userId,
        dueDate: { gte: weekStartUtc, lte: weekEndUtc },
      },
    }),
    prisma.studySession.findMany({
      where: {
        userId,
        sessionDate: { gte: weekStartUtc, lte: weekEndUtc },
        status: "COMPLETED",
      },
    }),
    prisma.studyPlanItem.findMany({
      where: {
        studyPlan: { userId },
        scheduledAt: { gte: weekStartUtc, lte: weekEndUtc },
      },
    }),
    prisma.courseGrade.findMany({
      where: { userId },
    }),
    prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
    }),
  ]);

  const isProUser = options?.isPro !== undefined ? options.isPro : subscription?.plan === "PRO";

  // 2. Aggregate general metrics
  const totalClassesScheduled = timetableEntries.length;
  // Estimate attended classes from Attendance records
  const totalClassesAttended = attendanceRecords.reduce((sum, a) => sum + (a.attendedClasses || 0), 0);
  const totalAllClasses = attendanceRecords.reduce((sum, a) => sum + (a.totalClasses || 0), 0);
  const attendanceRate = totalAllClasses > 0
    ? Math.round((totalClassesAttended / totalAllClasses) * 100)
    : 100;

  const totalFocusMinutes = studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalSessionsCount = studySessions.length;

  const assignmentsCompleted = assignments.filter((a) => a.status === "COMPLETED" || a.status === "SUBMITTED").length;
  const assignmentsDue = assignments.length;
  const assignmentsOverdue = assignments.filter((a) => {
    if (a.status === "COMPLETED" || a.status === "SUBMITTED") return false;
    return new Date(a.dueDate).getTime() < Date.now();
  }).length;

  const studyPlanItemsCompleted = studyPlanItems.filter((i) => i.completed || (i as any).status === "COMPLETED").length;
  const studyPlanItemsTotal = studyPlanItems.length;

  // 3. Compute Course-by-Course Summaries
  const courseSummaries: CourseWeeklySummary[] = courses.map((course) => {
    const cAttendance = attendanceRecords.find((a) => a.courseId === course.id);
    const attended = cAttendance?.attendedClasses || 0;
    const scheduled = cAttendance?.totalClasses || 0;
    const percentage = scheduled > 0 ? Math.round((attended / scheduled) * 100) : 100;

    const cAssignments = assignments.filter((a) => a.courseId === course.id);
    const cCompleted = cAssignments.filter((a) => a.status === "COMPLETED" || a.status === "SUBMITTED").length;
    const cOverdue = cAssignments.filter((a) => {
      if (a.status === "COMPLETED" || a.status === "SUBMITTED") return false;
      return new Date(a.dueDate).getTime() < Date.now();
    }).length;

    const cSessions = studySessions.filter((s) => s.courseId === course.id);
    const cFocusMinutes = cSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    const cGrade = courseGrades.find((g) => g.courseId === course.id);

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      courseColor: course.color,
      attendance: {
        attended,
        scheduled,
        percentage,
      },
      assignments: {
        completed: cCompleted,
        due: cAssignments.length,
        overdue: cOverdue,
      },
      focusMinutes: cFocusMinutes,
      grade: cGrade ? { letter: cGrade.grade, points: cGrade.gradePoints } : null,
    };
  });

  // 4. Compute 4-Dimension Academic Scorecard
  // Execution
  let execRating: ScorecardRating = "ON_TRACK";
  let execScore = 100;
  let execSummary = "No deadlines were due this week.";
  if (assignmentsDue > 0) {
    execScore = Math.round((assignmentsCompleted / assignmentsDue) * 100);
    if (execScore >= 80) {
      execRating = "STRONG";
      execSummary = `${assignmentsCompleted}/${assignmentsDue} deadlines submitted on time. Strong execution pace.`;
    } else if (execScore >= 50) {
      execRating = "ON_TRACK";
      execSummary = `${assignmentsCompleted}/${assignmentsDue} deadlines completed. Keep closing remaining tasks.`;
    } else {
      execRating = "NEEDS_ATTENTION";
      execSummary = `Only ${assignmentsCompleted}/${assignmentsDue} deadlines completed with ${assignmentsOverdue} overdue.`;
    }
  } else if (assignmentsCompleted > 0) {
    execRating = "STRONG";
    execSummary = `Proactively completed ${assignmentsCompleted} deliverables ahead of upcoming deadlines.`;
  }

  // Planning
  let planRating: ScorecardRating = "INSUFFICIENT_DATA";
  let planScore = 0;
  let planSummary = "No structured study plan sessions were scheduled.";
  if (studyPlanItemsTotal > 0) {
    planScore = Math.round((studyPlanItemsCompleted / studyPlanItemsTotal) * 100);
    if (planScore >= 75) {
      planRating = "STRONG";
      planSummary = `Executed ${studyPlanItemsCompleted}/${studyPlanItemsTotal} scheduled study sessions. Excellent plan adherence.`;
    } else if (planScore >= 50) {
      planRating = "ON_TRACK";
      planSummary = `Completed ${studyPlanItemsCompleted}/${studyPlanItemsTotal} plan blocks. Moderate plan adherence.`;
    } else {
      planRating = "NEEDS_ATTENTION";
      planSummary = `Missed ${studyPlanItemsTotal - studyPlanItemsCompleted} planned study blocks. Consider recalibrating block durations.`;
    }
  }

  // Focus
  let focusRating: ScorecardRating = "INSUFFICIENT_DATA";
  let focusScore = Math.min(100, Math.round((totalFocusMinutes / 300) * 100));
  let focusSummary = "No focus study sessions recorded this week.";
  if (totalFocusMinutes >= 300) {
    focusRating = "STRONG";
    focusSummary = `Logged ${(totalFocusMinutes / 60).toFixed(1)}h of deep focus across ${totalSessionsCount} session(s). Exceeded weekly benchmark.`;
  } else if (totalFocusMinutes >= 120) {
    focusRating = "ON_TRACK";
    focusSummary = `Logged ${(totalFocusMinutes / 60).toFixed(1)}h of deep focus. Consistent steady work.`;
  } else if (totalFocusMinutes > 0) {
    focusRating = "NEEDS_ATTENTION";
    focusSummary = `Logged only ${totalFocusMinutes} minutes of focus. Strive for at least 25-minute blocks daily.`;
  }

  // Academic Health
  let healthRating: ScorecardRating = "STRONG";
  let healthScore = attendanceRate;
  let healthSummary = `Maintained ${attendanceRate}% attendance across enrolled subjects.`;
  if (attendanceRate < 75) {
    healthRating = "NEEDS_ATTENTION";
    healthSummary = `Attendance dropped to ${attendanceRate}%, falling below the safe 75% university threshold.`;
  } else if (attendanceRate < 85) {
    healthRating = "ON_TRACK";
    healthSummary = `Attendance is at ${attendanceRate}%. Stay vigilant on lecture attendance.`;
  }

  // Overall Grade
  const ratings = [execRating, planRating, focusRating, healthRating];
  const strongCount = ratings.filter((r) => r === "STRONG").length;
  const attentionCount = ratings.filter((r) => r === "NEEDS_ATTENTION").length;

  let overallGrade: "A" | "B" | "C" | "D" | "INCOMPLETE" = "B";
  if (strongCount >= 3 && attentionCount === 0) {
    overallGrade = "A";
  } else if (strongCount >= 2 && attentionCount <= 1) {
    overallGrade = "B";
  } else if (attentionCount >= 2) {
    overallGrade = "C";
  } else if (attentionCount >= 3) {
    overallGrade = "D";
  } else if (ratings.every((r) => r === "INSUFFICIENT_DATA")) {
    overallGrade = "INCOMPLETE";
  }

  // 5. Highlights and Actionable Next-Week Recommendations
  const highlights: string[] = [];
  const recommendations: string[] = [];

  if (totalFocusMinutes >= 180) {
    highlights.push(`Logged ${(totalFocusMinutes / 60).toFixed(1)} hours of dedicated focus study.`);
  }
  if (assignmentsCompleted > 0) {
    highlights.push(`Completed ${assignmentsCompleted} academic deliverable(s).`);
  }
  if (attendanceRate >= 85 && totalAllClasses > 0) {
    highlights.push(`Exemplary attendance record of ${attendanceRate}%.`);
  }
  if (highlights.length === 0) {
    highlights.push("Baseline weekly data initialized.");
  }

  // Generate deterministic next-week recommendations
  const lowAttendanceCourse = courseSummaries.find((c) => c.attendance.percentage < 75 && c.attendance.scheduled > 0);
  if (lowAttendanceCourse) {
    recommendations.push(
      `Prioritize attending all ${lowAttendanceCourse.courseCode} classes next week to recover attendance back above 75%.`
    );
  }

  if (assignmentsOverdue > 0) {
    recommendations.push(
      `Clear ${assignmentsOverdue} overdue deliverable(s) in early morning study windows before new tasks arrive.`
    );
  }

  if (totalFocusMinutes < 120) {
    recommendations.push(
      "Schedule two 45-minute focus sessions during open timetable gaps to boost weekly focus volume."
    );
  } else if (planRating === "INSUFFICIENT_DATA" || planRating === "NEEDS_ATTENTION") {
    recommendations.push(
      "Generate an Adaptive Study Plan at the start of next week to keep revision synchronized with your syllabus."
    );
  }

  if (recommendations.length < 2) {
    recommendations.push("Maintain current study momentum by locking in consistent focus sessions each morning.");
  }

  // 6. Tier-2 Pro Gemini Synthesis (Safe & Sanitized)
  let aiExecutiveSummary: string | null = null;
  if (isProUser && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const sanitizedSummary = {
        week: `${startPkt.dateString} to ${endPkt.dateString}`,
        overallGrade,
        focusHours: (totalFocusMinutes / 60).toFixed(1),
        assignmentsCompleted,
        assignmentsDue,
        attendanceRate: `${attendanceRate}%`,
        ratings: {
          execution: execRating,
          planning: planRating,
          focus: focusRating,
          academicHealth: healthRating,
        },
      };

      const prompt = `You are UniMate's Personal Academic Operating System Coach. Provide a concise 2-3 sentence weekly performance debrief for this student.
Metrics:
${JSON.stringify(sanitizedSummary)}

Rules:
- Be encouraging, concise, realistic, and academic-first.
- Do NOT fabricate numbers, dates, or grades not present in the metrics.
- Plain text only (no markdown headers, no bullet points).`;

      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (resp.text) {
        aiExecutiveSummary = resp.text.trim();
      }
    } catch {
      // Graceful fallback to deterministic summary
      aiExecutiveSummary = null;
    }
  }

  const startMonthName = new Date(startPkt.dateString + "T12:00:00Z").toLocaleDateString("en-US", { month: "short" });
  const endMonthName = new Date(endPkt.dateString + "T12:00:00Z").toLocaleDateString("en-US", { month: "short" });
  const weekLabel = startMonthName === endMonthName
    ? `${startMonthName} ${startPkt.day} – ${endPkt.day}`
    : `${startMonthName} ${startPkt.day} – ${endMonthName} ${endPkt.day}`;

  return {
    userId,
    weekStartKey: startPkt.dateString,
    weekEndKey: endPkt.dateString,
    weekLabel,
    isCurrentWeek,
    scorecard: {
      execution: { rating: execRating, scorePercentage: execScore, label: "Execution", summary: execSummary },
      planning: { rating: planRating, scorePercentage: planScore, label: "Planning", summary: planSummary },
      focus: { rating: focusRating, scorePercentage: focusScore, label: "Focus & Stamina", summary: focusSummary },
      academicHealth: { rating: healthRating, scorePercentage: healthScore, label: "Academic Health", summary: healthSummary },
      overallGrade,
    },
    metrics: {
      totalClassesScheduled,
      totalClassesAttended,
      attendanceRate,
      totalFocusMinutes,
      totalSessionsCount,
      assignmentsCompleted,
      assignmentsDue,
      assignmentsOverdue,
      studyPlanItemsCompleted,
      studyPlanItemsTotal,
    },
    courseSummaries,
    highlights,
    recommendations,
    aiExecutiveSummary,
    generatedAt: new Date().toISOString(),
  };
}
