import "server-only";

import { prisma } from "@/app/lib/prisma";

export type AttendanceRiskStatus = "SAFE" | "WATCH" | "AT_RISK" | "INSUFFICIENT_DATA";

export type CourseAttendanceInsight = {
  courseId: string;
  courseName: string;
  courseCode: string;
  attendedClasses: number;
  totalClasses: number;
  attendancePercentage: number | null;
  attendancePercentageString: string;
  threshold: number; // e.g. 0.75
  thresholdPercentage: number; // e.g. 75
  status: AttendanceRiskStatus;
  safeBufferClasses: number;
  recoveryClassesRequired: number;
  recommendation: string;
};

export type StudentAttendanceSummary = {
  overallPercentage: number | null;
  overallPercentageString: string;
  overallStatus: AttendanceRiskStatus;
  threshold: number;
  thresholdPercentage: number;
  courses: CourseAttendanceInsight[];
  atRiskCount: number;
  watchCount: number;
  safeCount: number;
  insufficientCount: number;
};

/**
 * Pure mathematical calculation of attendance intelligence for a single course.
 * Strict adherence to configurable threshold, careful wording, and explicit insufficient data handling.
 */
export function calculateAttendanceInsight(
  attended: number,
  total: number,
  threshold: number = 0.75
): {
  percentage: number | null;
  percentageString: string;
  status: AttendanceRiskStatus;
  safeBufferClasses: number;
  recoveryClassesRequired: number;
  recommendation: string;
} {
  const thresholdPct = Math.round(threshold * 100);

  // Boundary condition: No classes held or recorded yet
  if (total <= 0 || attended < 0) {
    return {
      percentage: null,
      percentageString: "N/A",
      status: "INSUFFICIENT_DATA",
      safeBufferClasses: 0,
      recoveryClassesRequired: 0,
      recommendation: "Insufficient attendance records. Add classes to track status.",
    };
  }

  const percentage = Number(((attended / total) * 100).toFixed(1));
  const percentageString = `${percentage}%`;

  if (percentage < thresholdPct) {
    // AT RISK: Needs recovery
    // Formula: (threshold * total - attended) / (1 - threshold)
    const numerator = threshold * total - attended;
    const denominator = 1 - threshold;
    const recoveryClasses = Math.max(1, Math.ceil(numerator / denominator));

    return {
      percentage,
      percentageString,
      status: "AT_RISK",
      safeBufferClasses: 0,
      recoveryClassesRequired: recoveryClasses,
      recommendation: `Based on your current attendance, you should attend the next ${recoveryClasses} consecutive classes to reach the configured threshold (${thresholdPct}%).`,
    };
  } else if (percentage < thresholdPct + 5) {
    // WATCH: Close to threshold
    // Safe buffer
    const buffer = Math.max(0, Math.floor((attended - threshold * total) / threshold));

    return {
      percentage,
      percentageString,
      status: "WATCH",
      safeBufferClasses: buffer,
      recoveryClassesRequired: 0,
      recommendation: buffer > 0
        ? `Attendance is close to the limit. Based on your current attendance, you can miss approximately ${buffer} future class${buffer > 1 ? "es" : ""} and remain at/above the configured threshold (${thresholdPct}%).`
        : `Attendance is right at the threshold. Missing any upcoming class will push your attendance below ${thresholdPct}%.`,
    };
  } else {
    // SAFE: Comfortably above threshold
    const buffer = Math.max(0, Math.floor((attended - threshold * total) / threshold));

    return {
      percentage,
      percentageString,
      status: "SAFE",
      safeBufferClasses: buffer,
      recoveryClassesRequired: 0,
      recommendation: buffer > 0
        ? `Based on your current attendance, you can miss approximately ${buffer} future class${buffer > 1 ? "es" : ""} and remain at/above the configured threshold (${thresholdPct}%).`
        : `Good attendance. Maintain regular attendance to stay above the configured threshold (${thresholdPct}%).`,
    };
  }
}

/**
 * Loads user attendance records and computes student-wide attendance intelligence.
 */
export async function getStudentAttendanceIntelligence(
  userId: string,
  threshold: number = 0.75
): Promise<StudentAttendanceSummary> {
  const thresholdPct = Math.round(threshold * 100);

  const courses = await prisma.course.findMany({
    where: { userId },
    include: {
      attendance: true,
    },
    orderBy: { name: "asc" },
  });

  let totalAttendedAll = 0;
  let totalClassesAll = 0;
  let atRiskCount = 0;
  let watchCount = 0;
  let safeCount = 0;
  let insufficientCount = 0;

  const courseInsights: CourseAttendanceInsight[] = courses.map((c) => {
    const record = c.attendance[0] || null;
    const attended = record ? record.attendedClasses : 0;
    const total = record ? record.totalClasses : 0;

    if (total > 0) {
      totalAttendedAll += attended;
      totalClassesAll += total;
    }

    const insight = calculateAttendanceInsight(attended, total, threshold);

    if (insight.status === "AT_RISK") atRiskCount++;
    else if (insight.status === "WATCH") watchCount++;
    else if (insight.status === "SAFE") safeCount++;
    else insufficientCount++;

    return {
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      attendedClasses: attended,
      totalClasses: total,
      attendancePercentage: insight.percentage,
      attendancePercentageString: insight.percentageString,
      threshold,
      thresholdPercentage: thresholdPct,
      status: insight.status,
      safeBufferClasses: insight.safeBufferClasses,
      recoveryClassesRequired: insight.recoveryClassesRequired,
      recommendation: insight.recommendation,
    };
  });

  const overallPercentage = totalClassesAll > 0
    ? Number(((totalAttendedAll / totalClassesAll) * 100).toFixed(1))
    : null;

  let overallStatus: AttendanceRiskStatus = "INSUFFICIENT_DATA";
  if (overallPercentage !== null) {
    if (overallPercentage < thresholdPct) overallStatus = "AT_RISK";
    else if (overallPercentage < thresholdPct + 5) overallStatus = "WATCH";
    else overallStatus = "SAFE";
  }

  return {
    overallPercentage,
    overallPercentageString: overallPercentage !== null ? `${overallPercentage}%` : "N/A",
    overallStatus,
    threshold,
    thresholdPercentage: thresholdPct,
    courses: courseInsights,
    atRiskCount,
    watchCount,
    safeCount,
    insufficientCount,
  };
}
