import "server-only";

import { prisma } from "@/app/lib/prisma";

export type ExamReadinessStatus = "ON TRACK" | "NEEDS ATTENTION" | "AT RISK" | "INSUFFICIENT DATA";

export type ExamReadinessInsight = {
  examId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  title: string;
  type: string; // MIDTERM, FINAL, QUIZ, OTHER
  examDate: Date;
  examDateStr: string;
  daysRemaining: number;
  preparationProgress: number | null; // 0-100% or null if not recorded
  status: ExamReadinessStatus;
  suggestedFocusHours: number | null;
  recommendation: string;
};

export type StudentExamReadinessSummary = {
  exams: ExamReadinessInsight[];
  atRiskCount: number;
  needsAttentionCount: number;
  onTrackCount: number;
  insufficientDataCount: number;
};

/**
 * Pure calculation of exam preparation readiness.
 * Estimates based on available data without fabricating claims.
 */
export function calculateExamReadiness(
  examDate: Date,
  prepProgress: number | null,
  hasPrepData: boolean,
  now: Date = new Date()
): {
  daysRemaining: number;
  status: ExamReadinessStatus;
  suggestedFocusHours: number | null;
  recommendation: string;
} {
  const diffMs = examDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // If preparation progress was not recorded or user has not set progress
  if (!hasPrepData || prepProgress === null) {
    return {
      daysRemaining,
      status: "INSUFFICIENT DATA",
      suggestedFocusHours: null,
      recommendation: daysRemaining <= 7
        ? `Exam is in ${daysRemaining} days. Update your preparation progress to receive an estimate.`
        : "No preparation progress recorded for this exam yet.",
    };
  }

  const pp = Math.min(100, Math.max(0, prepProgress));

  // If exam has already passed
  if (diffMs < 0) {
    return {
      daysRemaining: 0,
      status: "INSUFFICIENT DATA",
      suggestedFocusHours: 0,
      recommendation: "This exam date has passed.",
    };
  }

  // Determine readiness status based on days remaining and progress percentage
  if (daysRemaining <= 2) {
    if (pp >= 85) {
      return {
        daysRemaining,
        status: "ON TRACK",
        suggestedFocusHours: 2,
        recommendation: "Final review phase. Solid preparation reported for this exam.",
      };
    } else if (pp >= 60) {
      return {
        daysRemaining,
        status: "NEEDS ATTENTION",
        suggestedFocusHours: 4,
        recommendation: "Exam is in 1-2 days with moderate preparation reported. Focus on high-weight review topics.",
      };
    } else {
      return {
        daysRemaining,
        status: "AT RISK",
        suggestedFocusHours: 6,
        recommendation: "Exam is imminent (under 48 hours) with low preparation reported. Prioritize core concepts and practice problems.",
      };
    }
  } else if (daysRemaining <= 5) {
    if (pp >= 70) {
      return {
        daysRemaining,
        status: "ON TRACK",
        suggestedFocusHours: 3,
        recommendation: "Preparation is on pace for this upcoming exam.",
      };
    } else if (pp >= 40) {
      return {
        daysRemaining,
        status: "NEEDS ATTENTION",
        suggestedFocusHours: 5,
        recommendation: `Exam in ${daysRemaining} days with ${pp}% progress. Recommend scheduling dedicated revision blocks.`,
      };
    } else {
      return {
        daysRemaining,
        status: "AT RISK",
        suggestedFocusHours: 8,
        recommendation: `Exam in ${daysRemaining} days with only ${pp}% preparation. Immediate dedicated study time recommended.`,
      };
    }
  } else if (daysRemaining <= 14) {
    if (pp >= 40) {
      return {
        daysRemaining,
        status: "ON TRACK",
        suggestedFocusHours: 4,
        recommendation: "Good early preparation progress. Continue regular study sessions.",
      };
    } else {
      return {
        daysRemaining,
        status: "NEEDS ATTENTION",
        suggestedFocusHours: 6,
        recommendation: `Exam in ${daysRemaining} days. Consider beginning chapter summaries and problem sets soon.`,
      };
    }
  } else {
    // Beyond 14 days
    if (pp >= 20) {
      return {
        daysRemaining,
        status: "ON TRACK",
        suggestedFocusHours: 2,
        recommendation: "Early preparation underway.",
      };
    } else {
      return {
        daysRemaining,
        status: "ON TRACK",
        suggestedFocusHours: null,
        recommendation: `Scheduled for ${daysRemaining} days from now. Sufficient runway to begin revision.`,
      };
    }
  }
}

/**
 * Loads upcoming exams and calculates student readiness.
 */
export async function getStudentExamReadiness(
  userId: string,
  now: Date = new Date()
): Promise<StudentExamReadinessSummary> {
  const exams = await prisma.exam.findMany({
    where: {
      userId,
      status: "UPCOMING",
      examDate: { gte: now },
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { examDate: "asc" },
  });

  let atRiskCount = 0;
  let needsAttentionCount = 0;
  let onTrackCount = 0;
  let insufficientDataCount = 0;

  const insights: ExamReadinessInsight[] = exams.map((e) => {
    // Check if user has explicitly modified progress or if it's default 0 without any notes
    const hasData = e.preparationProgress > 0 || e.notes.trim().length > 0;
    const calc = calculateExamReadiness(e.examDate, e.preparationProgress, hasData, now);

    if (calc.status === "AT RISK") atRiskCount++;
    else if (calc.status === "NEEDS ATTENTION") needsAttentionCount++;
    else if (calc.status === "ON TRACK") onTrackCount++;
    else insufficientDataCount++;

    return {
      examId: e.id,
      courseId: e.courseId,
      courseName: e.course.name,
      courseCode: e.course.code,
      title: e.title,
      type: e.type,
      examDate: e.examDate,
      examDateStr: e.examDate.toISOString(),
      daysRemaining: calc.daysRemaining,
      preparationProgress: hasData ? e.preparationProgress : null,
      status: calc.status,
      suggestedFocusHours: calc.suggestedFocusHours,
      recommendation: calc.recommendation,
    };
  });

  return {
    exams: insights,
    atRiskCount,
    needsAttentionCount,
    onTrackCount,
    insufficientDataCount,
  };
}
