/**
 * Academic definitions, centralized constants, GPA and attendance formulas,
 * and grade/status mapping for UniMate.
 */

// ---------------------------------------------------------------------------
// Grade Scale & Constants (Standard 4.0 Scale)
// ---------------------------------------------------------------------------

export const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  F: 0.0,
} as const;

export const GRADE_OPTIONS = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "F",
] as const;

export type GradeOption = (typeof GRADE_OPTIONS)[number];

export function getGradePoints(grade: string): number {
  return GRADE_POINTS[grade] ?? 0.0;
}

export function getGradeLabel(grade: string): string {
  const points = GRADE_POINTS[grade];
  if (points !== undefined) {
    return `${grade} (${points.toFixed(2)})`;
  }
  return grade;
}

// ---------------------------------------------------------------------------
// Grade Badge Styles
// ---------------------------------------------------------------------------

export function getGradeBadgeStyle(grade: string): string {
  const pts = GRADE_POINTS[grade] ?? 0;
  if (pts >= 3.7) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (pts >= 3.0) return "bg-blue-50 text-blue-700 border-blue-200";
  if (pts >= 2.0) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

// ---------------------------------------------------------------------------
// Attendance Thresholds & Status
// ---------------------------------------------------------------------------

export type AttendanceStatus = "Excellent" | "Good" | "Warning" | "Critical" | "Not added";

export type AttendanceStatusConfig = {
  label: AttendanceStatus;
  badgeClass: string;
  barClass: string;
  textClass: string;
};

export function getAttendanceStatus(percentage: number | null): AttendanceStatusConfig {
  if (percentage === null) {
    return {
      label: "Not added",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      barClass: "bg-slate-200",
      textClass: "text-slate-500",
    };
  }

  if (percentage >= 85) {
    return {
      label: "Excellent",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      barClass: "bg-emerald-500",
      textClass: "text-emerald-700",
    };
  }
  if (percentage >= 75) {
    return {
      label: "Good",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      barClass: "bg-blue-500",
      textClass: "text-blue-700",
    };
  }
  if (percentage >= 65) {
    return {
      label: "Warning",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      barClass: "bg-amber-500",
      textClass: "text-amber-700",
    };
  }
  return {
    label: "Critical",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    barClass: "bg-rose-500",
    textClass: "text-rose-700",
  };
}

// ---------------------------------------------------------------------------
// Centralized GPA Calculation (Credit-Hour Weighted)
// ---------------------------------------------------------------------------

export type CourseGradeItem = {
  courseId: string;
  creditHours: number;
  grade: string;
  gradePoints: number;
};

export type GPACalculationResult = {
  gpa: number | null;
  gpaString: string;
  totalCredits: number;
  gradedCredits: number;
  coursesWithGradesCount: number;
};

/**
 * Calculates credit-hour weighted GPA.
 * Formula: sum(gradePoints * creditHours) / sum(creditHours) for graded courses.
 * If no grades exist: returns gpa = null and gpaString = "—"
 */
export function calculateGPA(
  courses: Array<{ creditHours: number; gradePoints?: number | null }>
): GPACalculationResult {
  let weightedSum = 0;
  let gradedCredits = 0;
  let totalCredits = 0;
  let coursesWithGradesCount = 0;

  for (const c of courses) {
    totalCredits += c.creditHours;
    if (typeof c.gradePoints === "number" && !isNaN(c.gradePoints)) {
      weightedSum += c.gradePoints * c.creditHours;
      gradedCredits += c.creditHours;
      coursesWithGradesCount += 1;
    }
  }

  if (gradedCredits === 0 || coursesWithGradesCount === 0) {
    return {
      gpa: null,
      gpaString: "—",
      totalCredits,
      gradedCredits: 0,
      coursesWithGradesCount: 0,
    };
  }

  const gpa = Math.round((weightedSum / gradedCredits) * 100) / 100;
  const gpaString = (weightedSum / gradedCredits).toFixed(2);

  return {
    gpa,
    gpaString,
    totalCredits,
    gradedCredits,
    coursesWithGradesCount,
  };
}

// ---------------------------------------------------------------------------
// Centralized Attendance Calculations
// ---------------------------------------------------------------------------

export type AttendanceRecordItem = {
  totalClasses: number;
  attendedClasses: number;
};

export type AttendanceCalculationResult = {
  percentage: number | null;
  percentageString: string;
  totalClasses: number;
  attendedClasses: number;
  status: AttendanceStatusConfig;
};

/**
 * Calculates single course attendance percentage.
 * Handles totalClasses === 0 safely.
 */
export function calculateCoursePercentage(
  attendedClasses: number,
  totalClasses: number
): number | null {
  if (totalClasses <= 0) return null;
  const safeAttended = Math.max(0, Math.min(attendedClasses, totalClasses));
  return Math.round((safeAttended / totalClasses) * 100);
}

/**
 * Calculates overall weighted attendance based on sum(attended) / sum(total) * 100.
 * If no attendance records exist or sum(total) === 0, returns percentage = null and "—".
 */
export function calculateOverallAttendance(
  records: Array<{ totalClasses: number; attendedClasses: number }>
): AttendanceCalculationResult {
  let sumTotal = 0;
  let sumAttended = 0;
  let validRecordsCount = 0;

  for (const r of records) {
    if (r.totalClasses > 0) {
      sumTotal += r.totalClasses;
      sumAttended += Math.max(0, Math.min(r.attendedClasses, r.totalClasses));
      validRecordsCount += 1;
    }
  }

  if (sumTotal === 0 || validRecordsCount === 0) {
    return {
      percentage: null,
      percentageString: "—",
      totalClasses: 0,
      attendedClasses: 0,
      status: getAttendanceStatus(null),
    };
  }

  const percentage = Math.round((sumAttended / sumTotal) * 100);
  const percentageString = `${percentage}%`;

  return {
    percentage,
    percentageString,
    totalClasses: sumTotal,
    attendedClasses: sumAttended,
    status: getAttendanceStatus(percentage),
  };
}

// ---------------------------------------------------------------------------
// Combined Academic Course View Model
// ---------------------------------------------------------------------------

export type CourseAcademicItem = {
  courseId: string;
  courseName: string;
  courseCode: string;
  creditHours: number;
  semester: string;
  color: string;

  // Grade
  gradeId?: string;
  grade?: string | null;
  gradePoints?: number | null;

  // Attendance
  attendanceId?: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number | null;
  attendanceStatus: AttendanceStatusConfig;
};

export type AcademicOverview = {
  gpa: number | null;
  gpaString: string;
  gpaSub: string;
  overallAttendance: number | null;
  attendanceString: string;
  attendanceSub: string;
  attendanceStatus: AttendanceStatusConfig;
  totalCredits: number;
  gradedCredits: number;
  coursesCount: number;
  gradedCoursesCount: number;
  courses: CourseAcademicItem[];
};
