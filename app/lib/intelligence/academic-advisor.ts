import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getStudentPriorities, PrioritizedTask } from "@/app/lib/intelligence/priority-engine";
import {
  getStudentAttendanceIntelligence,
  StudentAttendanceSummary,
  CourseAttendanceInsight,
} from "@/app/lib/intelligence/attendance-intel";
import {
  getStudentExamReadiness,
  StudentExamReadinessSummary,
  ExamReadinessInsight,
} from "@/app/lib/intelligence/exam-readiness";
import {
  calculateRequiredGpaForTarget,
  TargetGpaFeasibilityResult,
} from "@/app/lib/intelligence/gpa-simulator";
import {
  getStudentTodayScheduleGaps,
  ScheduleGap,
} from "@/app/lib/intelligence/schedule-gaps";
import {
  getStudentWeeklyProgress,
  WeeklyProgressSummary,
} from "@/app/lib/intelligence/weekly-progress";
import { checkRateLimit } from "@/app/lib/ai";
import { getDailyAiUsage, checkAndIncrementAiUsage } from "@/app/lib/ai-limits";

export type AcademicHealthStatus =
  | "EXCELLENT"
  | "GOOD"
  | "NEEDS_ATTENTION"
  | "CRITICAL"
  | "INSUFFICIENT_DATA";

export type AdvisorAttendanceWarning = {
  courseCode: string;
  courseName: string;
  attendancePercentage: number | null;
  status: string;
  safeBufferClasses: number;
  recoveryClassesRequired: number;
  recommendation: string;
};

export type AdvisorExamAlert = {
  examId: string;
  title: string;
  courseCode: string;
  daysRemaining: number;
  status: string;
  suggestedFocusHours: number | null;
  recommendation: string;
};

export type AcademicAdvisorOverview = {
  academicHealth: AcademicHealthStatus;
  academicHealthLabel: string;
  primaryFocus: {
    title: string;
    reason: string;
    action: string;
    urgencyTier: string;
    courseCode?: string;
  } | null;
  gpaStanding: {
    currentGpa: number | null;
    currentGpaString: string;
    targetGpa: number | null;
    targetGpaString: string | null;
    completedCredits: number;
    remainingCredits: number;
    targetFeasibility?: TargetGpaFeasibilityResult;
  };
  attendanceSummary: {
    overallPercentage: number | null;
    overallPercentageString: string;
    overallStatus: string;
    threshold: number;
    thresholdPercentage: number;
    atRiskCount: number;
    watchCount: number;
    safeCount: number;
    insufficientCount: number;
    warnings: AdvisorAttendanceWarning[];
  };
  examAlerts: AdvisorExamAlert[];
  topPriorities: PrioritizedTask[];
  availableStudyWindows: Array<{
    startTime: string;
    endTime: string;
    durationMinutes: number;
    label: string;
  }>;
  weeklyProgress: WeeklyProgressSummary;
  strategicNextSteps: string[];
  hasInsufficientData: boolean;
};

export type AcademicAdvisorAIReport = {
  executiveSummary: string;
  primaryRecommendation: string;
  strategicActionPlan: string[];
  studyStrategy: string;
  source: "ai" | "deterministic";
  aiAttempted: boolean;
  aiFailed: boolean;
  quotaExceeded: boolean;
  quotaRemaining: number;
  quotaLimit: number;
  explanationNote?: string;
  overview: AcademicAdvisorOverview;
};

/**
 * Builds a strict, privacy-airgapped context for the AI Academic Advisor.
 * EXCLUDES:
 * - Passwords, hashes, session tokens, JWTs
 * - Financial/expense data
 * - Billing/payment identifiers
 * - Private community posts and memberships
 * - Database IDs
 * - Student full names or emails (student identity generalized)
 */
function buildAdvisorPromptContext(overview: AcademicAdvisorOverview): string {
  const sanitized = {
    academicHealth: overview.academicHealth,
    gpa: {
      current: overview.gpaStanding.currentGpaString,
      target: overview.gpaStanding.targetGpaString,
      feasibility: overview.gpaStanding.targetFeasibility?.status ?? "NOT_SET",
      requiredGpaInRemaining: overview.gpaStanding.targetFeasibility?.requiredGpaString ?? "N/A",
    },
    attendance: {
      overallPercentage: overview.attendanceSummary.overallPercentageString,
      status: overview.attendanceSummary.overallStatus,
      thresholdPercentage: overview.attendanceSummary.thresholdPercentage,
      atRiskCount: overview.attendanceSummary.atRiskCount,
      watchCount: overview.attendanceSummary.watchCount,
      warnings: overview.attendanceSummary.warnings.map((w) => ({
        course: w.courseCode,
        pct: w.attendancePercentage !== null ? `${w.attendancePercentage}%` : "N/A",
        status: w.status,
        safeBuffer: w.safeBufferClasses,
        recoveryNeeded: w.recoveryClassesRequired,
      })),
    },
    upcomingExams: overview.examAlerts.map((e) => ({
      title: e.title,
      course: e.courseCode,
      daysAway: e.daysRemaining,
      status: e.status,
      suggestedDailyHours: e.suggestedFocusHours,
    })),
    topPriorities: overview.topPriorities.slice(0, 3).map((p) => ({
      action: p.action,
      reason: p.reason,
      urgency: p.urgencyTier,
      deadline: p.deadlineLabel,
      course: p.courseCode,
    })),
    freeStudyWindowsTodayMinutes: overview.availableStudyWindows.map((w) => w.durationMinutes),
    weeklyProgress: {
      completedAssignmentsThisWeek: overview.weeklyProgress.assignmentsCompletedCount,
      studyHoursThisWeek: overview.weeklyProgress.studyHoursTotal,
      overdueCount: overview.weeklyProgress.assignmentsOverdueCount,
      previousWeekComparison: overview.weeklyProgress.previousWeekComparison.comparisonSummary,
    },
  };

  return JSON.stringify(sanitized, null, 2);
}

/**
 * Generates deterministic advisor text without invoking Gemini.
 */
function generateDeterministicAdvisorReport(overview: AcademicAdvisorOverview): {
  executiveSummary: string;
  primaryRecommendation: string;
  strategicActionPlan: string[];
  studyStrategy: string;
} {
  const steps: string[] = [];

  // Primary action step
  if (overview.primaryFocus) {
    steps.push(`Immediate Priority: ${overview.primaryFocus.action}. ${overview.primaryFocus.reason}.`);
  }

  // Attendance recovery step
  if (overview.attendanceSummary.warnings.length > 0) {
    const topWarning = overview.attendanceSummary.warnings[0];
    if (topWarning.status === "AT_RISK") {
      steps.push(
        `Attendance Alert: ${topWarning.courseCode} requires approximately ${topWarning.recoveryClassesRequired} consecutive attended classes to recover to ${overview.attendanceSummary.thresholdPercentage}%.`
      );
    } else if (topWarning.status === "WATCH") {
      steps.push(
        `Attendance Watch: ${topWarning.courseCode} has a buffer of approximately ${topWarning.safeBufferClasses} class${topWarning.safeBufferClasses === 1 ? "" : "es"} before dropping below threshold.`
      );
    }
  }

  // Exam step
  if (overview.examAlerts.length > 0) {
    const nearestExam = overview.examAlerts[0];
    steps.push(
      `Exam Countdown: ${nearestExam.title} (${nearestExam.courseCode}) is in ${nearestExam.daysRemaining} days. Suggested focus: ${nearestExam.suggestedFocusHours ?? 2} hrs/day.`
    );
  }

  // GPA Target step
  if (overview.gpaStanding.targetFeasibility) {
    const tf = overview.gpaStanding.targetFeasibility;
    if (tf.status === "ACHIEVABLE" || tf.status === "CHALLENGING") {
      steps.push(
        `GPA Target (${tf.targetGpa}): Requires an estimated average GPA of ${tf.requiredGpaString} across your ${tf.remainingCredits} remaining credits.`
      );
    } else if (tf.status === "ALREADY_MET") {
      steps.push(`GPA Target: Your current GPA of ${overview.gpaStanding.currentGpaString} meets or exceeds your goal.`);
    }
  }

  if (steps.length === 0) {
    steps.push("Your academic schedule is clear. Use today's free windows for previewing upcoming course topics.");
  }

  // Executive summary
  let executiveSummary = "";
  if (overview.academicHealth === "CRITICAL") {
    executiveSummary =
      "Your academic dashboard shows urgent items requiring immediate action, specifically overdue assignments or courses at attendance risk.";
  } else if (overview.academicHealth === "NEEDS_ATTENTION") {
    executiveSummary =
      "Your academic standing is manageable, but upcoming exams or low attendance buffer in key courses warrant dedicated attention this week.";
  } else if (overview.academicHealth === "EXCELLENT") {
    executiveSummary =
      "You are maintaining strong academic momentum with solid attendance and assignments caught up. Keep this steady pace.";
  } else if (overview.academicHealth === "GOOD") {
    executiveSummary =
      "Your academic performance is on track. Balance daily assignment deadlines with regular review sessions.";
  } else {
    executiveSummary =
      "Insufficient data recorded to form a complete academic profile. Record your course attendance and assignments to unlock predictive insights.";
  }

  // Primary recommendation
  const primaryRecommendation = overview.primaryFocus
    ? `Focus on ${overview.primaryFocus.action} first.`
    : overview.examAlerts.length > 0
    ? `Dedicate study time to ${overview.examAlerts[0].title}.`
    : "Review your upcoming syllabus schedule to maintain momentum.";

  // Study strategy
  let studyStrategy = "";
  const totalWindowMinutes = overview.availableStudyWindows.reduce((acc, w) => acc + w.durationMinutes, 0);
  if (totalWindowMinutes >= 60) {
    studyStrategy = `You have approximately ${Math.round(totalWindowMinutes / 60)} hour(s) of available study gaps between classes today. Use your longest gap for deep, focused task execution.`;
  } else {
    studyStrategy = "Plan dedicated evening study blocks of 45-60 minutes using the Pomodoro technique to complete pending deliverables.";
  }

  return {
    executiveSummary,
    primaryRecommendation,
    strategicActionPlan: steps,
    studyStrategy,
  };
}

/**
 * TIER 1: Computes the complete deterministic Academic Advisor overview.
 * 100% deterministic, 0% AI quota consumed, testable without network.
 */
export async function getAcademicAdvisorOverview(
  userId: string,
  options?: { threshold?: number }
): Promise<AcademicAdvisorOverview> {
  const threshold = options?.threshold ?? 0.75;
  const now = new Date();

  // Bounded parallel fetch of deterministic intelligence
  const [
    courses,
    targetGpaGoal,
    priorities,
    attendanceSummary,
    examReadiness,
    scheduleGaps,
    weeklyProgress,
  ] = await Promise.all([
    prisma.course.findMany({
      where: { userId },
      include: { grades: true, attendance: true },
      orderBy: { name: "asc" },
    }),
    prisma.studentGoal.findFirst({
      where: { userId, type: "TARGET_GPA", active: true },
      select: { targetValue: true },
    }),
    getStudentPriorities(userId, 5, now),
    getStudentAttendanceIntelligence(userId, threshold),
    getStudentExamReadiness(userId, now),
    getStudentTodayScheduleGaps(userId, now),
    getStudentWeeklyProgress(userId, now),
  ]);

  // GPA Calculation
  let completedCredits = 0;
  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const c of courses) {
    totalCredits += c.creditHours;
    const gradeRecord = c.grades[0];
    if (gradeRecord && gradeRecord.gradePoints !== null && c.creditHours > 0) {
      completedCredits += c.creditHours;
      totalGradePoints += gradeRecord.gradePoints * c.creditHours;
    }
  }

  const currentGpa = completedCredits > 0 ? Number((totalGradePoints / completedCredits).toFixed(2)) : null;
  const remainingCredits = Math.max(0, totalCredits - completedCredits);
  const targetGpa = targetGpaGoal?.targetValue ?? null;

  const targetFeasibility = targetGpa !== null
    ? calculateRequiredGpaForTarget(currentGpa, completedCredits, targetGpa, remainingCredits)
    : undefined;

  // Attendance Warnings
  const attendanceWarnings: AdvisorAttendanceWarning[] = attendanceSummary.courses
    .filter((c) => c.status === "AT_RISK" || c.status === "WATCH")
    .map((c) => ({
      courseCode: c.courseCode,
      courseName: c.courseName,
      attendancePercentage: c.attendancePercentage,
      status: c.status,
      safeBufferClasses: c.safeBufferClasses,
      recoveryClassesRequired: c.recoveryClassesRequired,
      recommendation: c.recommendation,
    }));

  // Exam Alerts (Exams within next 14 days)
  const examAlerts: AdvisorExamAlert[] = examReadiness.exams
    .filter((e) => e.daysRemaining <= 14)
    .map((e) => ({
      examId: e.examId,
      title: e.title,
      courseCode: e.courseCode,
      daysRemaining: e.daysRemaining,
      status: e.status,
      suggestedFocusHours: e.suggestedFocusHours,
      recommendation: e.recommendation,
    }));

  // Primary Focus Determination
  let primaryFocus: AcademicAdvisorOverview["primaryFocus"] = null;
  if (priorities.length > 0) {
    const top = priorities[0];
    primaryFocus = {
      title: top.title,
      reason: top.reason,
      action: top.action,
      urgencyTier: top.urgencyTier,
      courseCode: top.courseCode,
    };
  } else if (examAlerts.length > 0) {
    const nearest = examAlerts[0];
    primaryFocus = {
      title: nearest.title,
      reason: `Exam is in ${nearest.daysRemaining} days`,
      action: `Prepare for ${nearest.title} (${nearest.courseCode})`,
      urgencyTier: nearest.daysRemaining <= 3 ? "CRITICAL" : "HIGH",
      courseCode: nearest.courseCode,
    };
  }

  // Academic Health Evaluation
  const hasInsufficientData = courses.length === 0;
  let academicHealth: AcademicHealthStatus = "GOOD";

  if (hasInsufficientData) {
    academicHealth = "INSUFFICIENT_DATA";
  } else {
    const hasOverdue = priorities.some((p) => p.urgencyTier === "OVERDUE");
    const atRiskAttendance = attendanceSummary.atRiskCount;
    const imminentExamsAtRisk = examAlerts.some((e) => e.daysRemaining <= 3 && e.status === "AT RISK");

    if ((hasOverdue && atRiskAttendance > 0) || imminentExamsAtRisk || atRiskAttendance >= 2) {
      academicHealth = "CRITICAL";
    } else if (hasOverdue || atRiskAttendance > 0 || attendanceSummary.watchCount > 0 || examAlerts.some((e) => e.status === "NEEDS ATTENTION" || e.status === "AT RISK")) {
      academicHealth = "NEEDS_ATTENTION";
    } else if (currentGpa !== null && currentGpa >= 3.5 && (attendanceSummary.overallPercentage ?? 0) >= 80) {
      academicHealth = "EXCELLENT";
    } else {
      academicHealth = "GOOD";
    }
  }

  let academicHealthLabel = "On Track";
  if (academicHealth === "EXCELLENT") academicHealthLabel = "Exceptional Standing";
  else if (academicHealth === "NEEDS_ATTENTION") academicHealthLabel = "Action Needed";
  else if (academicHealth === "CRITICAL") academicHealthLabel = "Critical Attention";
  else if (academicHealth === "INSUFFICIENT_DATA") academicHealthLabel = "Insufficient Records";

  // Deterministic strategic next steps
  const strategicNextSteps: string[] = [];
  if (primaryFocus) {
    strategicNextSteps.push(primaryFocus.action);
  }
  if (attendanceWarnings.length > 0) {
    const w = attendanceWarnings[0];
    strategicNextSteps.push(`Protect attendance in ${w.courseCode} (${w.status})`);
  }
  if (examAlerts.length > 0) {
    strategicNextSteps.push(`Review key concepts for ${examAlerts[0].title}`);
  }
  if (strategicNextSteps.length === 0) {
    strategicNextSteps.push("All tasks and attendance up to date. Keep maintaining this pace.");
  }

  return {
    academicHealth,
    academicHealthLabel,
    primaryFocus,
    gpaStanding: {
      currentGpa,
      currentGpaString: currentGpa !== null ? currentGpa.toFixed(2) : "N/A",
      targetGpa,
      targetGpaString: targetGpa !== null ? targetGpa.toFixed(2) : null,
      completedCredits,
      remainingCredits,
      targetFeasibility,
    },
    attendanceSummary: {
      overallPercentage: attendanceSummary.overallPercentage,
      overallPercentageString: attendanceSummary.overallPercentageString,
      overallStatus: attendanceSummary.overallStatus,
      threshold: attendanceSummary.threshold,
      thresholdPercentage: attendanceSummary.thresholdPercentage,
      atRiskCount: attendanceSummary.atRiskCount,
      watchCount: attendanceSummary.watchCount,
      safeCount: attendanceSummary.safeCount,
      insufficientCount: attendanceSummary.insufficientCount,
      warnings: attendanceWarnings,
    },
    examAlerts,
    topPriorities: priorities,
    availableStudyWindows: scheduleGaps,
    weeklyProgress,
    strategicNextSteps,
    hasInsufficientData,
  };
}

/**
 * TIER 2: User-triggered on-demand Gemini AI Academic Advisor Report.
 * - Checks rate limit and daily quota BEFORE attempting Gemini.
 * - Strictly airgaps context.
 * - If quota exceeded or Gemini fails, gracefully falls back to deterministic report.
 */
export async function generateAcademicAdvisorAIReport(
  userId: string,
  options?: { focusArea?: string; threshold?: number }
): Promise<AcademicAdvisorAIReport> {
  // 1. Fetch Tier 1 deterministic overview
  const overview = await getAcademicAdvisorOverview(userId, options);
  const deterministicFallback = generateDeterministicAdvisorReport(overview);

  // 2. Rate limit check (in-memory sliding window)
  const isRateLimitAllowed = checkRateLimit(userId);
  if (!isRateLimitAllowed) {
    const quota = await getDailyAiUsage(userId);
    return {
      ...deterministicFallback,
      source: "deterministic",
      aiAttempted: false,
      aiFailed: false,
      quotaExceeded: false,
      quotaRemaining: quota.remaining,
      quotaLimit: quota.limit,
      explanationNote: "Rate limit active. Switched to deterministic academic plan.",
      overview,
    };
  }

  // 3. Quota check (check without consuming first)
  const currentUsage = await getDailyAiUsage(userId);
  if (!currentUsage.allowed || currentUsage.remaining <= 0) {
    return {
      ...deterministicFallback,
      source: "deterministic",
      aiAttempted: false,
      aiFailed: false,
      quotaExceeded: true,
      quotaRemaining: 0,
      quotaLimit: currentUsage.limit,
      explanationNote: `Daily AI quota of ${currentUsage.limit} requests reached. Showing deterministic academic guidance.`,
      overview,
    };
  }

  // 4. Atomically check and increment AI usage (an actual AI attempt is being dispatched)
  const incrementedUsage = await checkAndIncrementAiUsage(userId);
  if (!incrementedUsage.allowed) {
    return {
      ...deterministicFallback,
      source: "deterministic",
      aiAttempted: false,
      aiFailed: false,
      quotaExceeded: true,
      quotaRemaining: 0,
      quotaLimit: incrementedUsage.limit,
      explanationNote: `Daily AI limit reached for today. Switched to deterministic plan.`,
      overview,
    };
  }

  // 5. Attempt Gemini Synthesis
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ...deterministicFallback,
      source: "deterministic",
      aiAttempted: true,
      aiFailed: false,
      quotaExceeded: false,
      quotaRemaining: incrementedUsage.remaining,
      quotaLimit: incrementedUsage.limit,
      explanationNote: "AI API key not configured. Using deterministic academic advisor plan.",
      overview,
    };
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.AI_MODEL || "gemini-2.5-flash";

    const promptContext = buildAdvisorPromptContext(overview);

    const systemPrompt = `You are the executive AI Academic Advisor for UniMate, a university student academic operating system.
Your mission is to provide clear, calm, encouraging, and highly actionable strategic academic advice.

Strict Rules:
- Base your analysis exclusively on the provided academic context.
- Never guarantee exam outcomes or attendance recovery. Always use measured, probabilistic language ("approximately", "estimated", "recommended").
- Address the student neutrally and professionally.
- Return a strict JSON response matching the following schema without any surrounding text or markdown backticks:
{
  "executiveSummary": "Concise 2-3 sentence overview of academic health and urgency",
  "primaryRecommendation": "The single most impactful immediate action",
  "strategicActionPlan": ["Step 1", "Step 2", "Step 3"],
  "studyStrategy": "Actionable strategy tailored to available schedule windows"
}`;

    const userPrompt = `Student Academic Context:
${promptContext}

Focus Area: ${options?.focusArea || "COMPREHENSIVE"}

Generate the executive academic advisor evaluation.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
    });

    const responseText = response.text ? response.text.trim() : "";
    if (!responseText) {
      throw new Error("Empty response from AI model");
    }

    // Attempt clean JSON parse
    let parsed: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      parsed = JSON.parse(jsonStr);
    } catch {
      // If model returned plain text instead of JSON
      parsed = {
        executiveSummary: responseText.slice(0, 200),
        primaryRecommendation: deterministicFallback.primaryRecommendation,
        strategicActionPlan: deterministicFallback.strategicActionPlan,
        studyStrategy: deterministicFallback.studyStrategy,
      };
    }

    return {
      executiveSummary: parsed.executiveSummary || deterministicFallback.executiveSummary,
      primaryRecommendation: parsed.primaryRecommendation || deterministicFallback.primaryRecommendation,
      strategicActionPlan: Array.isArray(parsed.strategicActionPlan) && parsed.strategicActionPlan.length > 0
        ? parsed.strategicActionPlan
        : deterministicFallback.strategicActionPlan,
      studyStrategy: parsed.studyStrategy || deterministicFallback.studyStrategy,
      source: "ai",
      aiAttempted: true,
      aiFailed: false,
      quotaExceeded: false,
      quotaRemaining: incrementedUsage.remaining,
      quotaLimit: incrementedUsage.limit,
      overview,
    };
  } catch (error) {
    console.warn("Gemini API call failed during Advisor synthesis. Using deterministic fallback:", error);
    return {
      ...deterministicFallback,
      source: "deterministic",
      aiAttempted: true,
      aiFailed: true,
      quotaExceeded: false,
      quotaRemaining: incrementedUsage.remaining,
      quotaLimit: incrementedUsage.limit,
      explanationNote: "AI provider temporarily unavailable. Switched to deterministic academic plan.",
      overview,
    };
  }
}
