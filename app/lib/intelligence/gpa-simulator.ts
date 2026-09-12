import "server-only";

import { GRADE_POINTS, GRADE_OPTIONS, GradeOption } from "@/app/lib/academic-definitions";
import { prisma } from "@/app/lib/prisma";

export type CourseSimulationInput = {
  courseId: string;
  simulatedGrade: string; // e.g. "A", "B+"
};

export type CourseGradeState = {
  courseId: string;
  courseName: string;
  courseCode: string;
  creditHours: number;
  currentGrade: string | null;
  currentGradePoints: number | null;
  isGraded: boolean;
};

export type SimulatedCourseResult = {
  courseId: string;
  courseName: string;
  courseCode: string;
  creditHours: number;
  currentGrade: string | null;
  currentGradePoints: number | null;
  simulatedGrade: string;
  simulatedGradePoints: number;
  isSimulated: boolean;
};

export type TargetGpaFeasibilityStatus =
  | "ALREADY_MET"
  | "ACHIEVABLE"
  | "CHALLENGING"
  | "MATHEMATICALLY_IMPOSSIBLE"
  | "INSUFFICIENT_DATA";

export type TargetGpaFeasibilityResult = {
  status: TargetGpaFeasibilityStatus;
  targetGpa: number | null;
  currentGpa: number | null;
  completedCredits: number;
  remainingCredits: number;
  requiredGpa: number | null;
  requiredGpaString: string;
  recommendedGradeBenchmark: string | null;
  explanation: string;
};

export type GpaSimulationResult = {
  currentGpa: number | null;
  currentGpaString: string;
  projectedGpa: number;
  projectedGpaString: string;
  targetGpa: number | null;
  targetGpaString: string | null;
  targetMet: boolean | null;
  delta: number;
  deltaString: string;
  totalCredits: number;
  gradedCredits: number;
  simulatedCredits: number;
  courses: SimulatedCourseResult[];
  targetFeasibility?: TargetGpaFeasibilityResult;
};

/**
 * Pure mathematical calculation of required GPA in remaining credits to achieve a target GPA.
 * Strictly adheres to 4.0 scale constraints, handles all boundary/insufficient data conditions deterministically,
 * and never mutates any academic record.
 */
export function calculateRequiredGpaForTarget(
  currentGpa: number | null,
  completedCredits: number,
  targetGpa: number | null,
  remainingCredits: number
): TargetGpaFeasibilityResult {
  // 1. Validate target GPA
  if (targetGpa === null || targetGpa === undefined || typeof targetGpa !== "number" || isNaN(targetGpa) || targetGpa <= 0) {
    return {
      status: "INSUFFICIENT_DATA",
      targetGpa: null,
      currentGpa,
      completedCredits: Math.max(0, completedCredits || 0),
      remainingCredits: Math.max(0, remainingCredits || 0),
      requiredGpa: null,
      requiredGpaString: "N/A",
      recommendedGradeBenchmark: null,
      explanation: "No valid target GPA set. Set a target between 0.1 and 4.0 to calculate feasibility.",
    };
  }

  // 2. Validate credit numbers
  if (
    typeof completedCredits !== "number" ||
    isNaN(completedCredits) ||
    completedCredits < 0 ||
    typeof remainingCredits !== "number" ||
    isNaN(remainingCredits) ||
    remainingCredits < 0
  ) {
    return {
      status: "INSUFFICIENT_DATA",
      targetGpa,
      currentGpa,
      completedCredits: 0,
      remainingCredits: 0,
      requiredGpa: null,
      requiredGpaString: "N/A",
      recommendedGradeBenchmark: null,
      explanation: "Credit information is incomplete or invalid.",
    };
  }

  // 3. Target exceeds 4.0 maximum scale
  if (targetGpa > 4.0) {
    return {
      status: "MATHEMATICALLY_IMPOSSIBLE",
      targetGpa,
      currentGpa,
      completedCredits,
      remainingCredits,
      requiredGpa: null,
      requiredGpaString: "N/A",
      recommendedGradeBenchmark: null,
      explanation: `Target GPA of ${targetGpa.toFixed(2)} exceeds the maximum achievable 4.00 scale.`,
    };
  }

  // 4. Zero total credits recorded
  if (completedCredits === 0 && remainingCredits === 0) {
    return {
      status: "INSUFFICIENT_DATA",
      targetGpa,
      currentGpa,
      completedCredits: 0,
      remainingCredits: 0,
      requiredGpa: null,
      requiredGpaString: "N/A",
      recommendedGradeBenchmark: null,
      explanation: "Insufficient credit hours recorded to calculate target feasibility.",
    };
  }

  // 5. Zero remaining credits enrolled
  if (remainingCredits === 0) {
    if (currentGpa !== null && currentGpa >= targetGpa) {
      return {
        status: "ALREADY_MET",
        targetGpa,
        currentGpa,
        completedCredits,
        remainingCredits: 0,
        requiredGpa: null,
        requiredGpaString: "N/A",
        recommendedGradeBenchmark: null,
        explanation: `Target GPA of ${targetGpa.toFixed(2)} is already achieved with your current GPA of ${currentGpa.toFixed(2)}.`,
      };
    }
    return {
      status: "MATHEMATICALLY_IMPOSSIBLE",
      targetGpa,
      currentGpa,
      completedCredits,
      remainingCredits: 0,
      requiredGpa: null,
      requiredGpaString: "N/A",
      recommendedGradeBenchmark: null,
      explanation: "Cannot alter GPA because there are zero remaining credits enrolled.",
    };
  }

  // 6. Current GPA already meets or exceeds target
  if (currentGpa !== null && currentGpa >= targetGpa) {
    return {
      status: "ALREADY_MET",
      targetGpa,
      currentGpa,
      completedCredits,
      remainingCredits,
      requiredGpa: null,
      requiredGpaString: "N/A",
      recommendedGradeBenchmark: null,
      explanation: `Your current GPA of ${currentGpa.toFixed(2)} already meets or exceeds your target of ${targetGpa.toFixed(2)}.`,
    };
  }

  // 7. Zero completed credits, but remaining credits exist
  if (completedCredits === 0 || currentGpa === null) {
    const requiredGpa = targetGpa;
    const requiredGpaString = requiredGpa.toFixed(2);

    let benchmark = "A (4.00)";
    if (requiredGpa <= 2.0) benchmark = "Passing (2.00)";
    else if (requiredGpa <= 2.3) benchmark = "C+ (2.30)";
    else if (requiredGpa <= 2.7) benchmark = "B- (2.70)";
    else if (requiredGpa <= 3.0) benchmark = "B (3.00)";
    else if (requiredGpa <= 3.3) benchmark = "B+ (3.30)";
    else if (requiredGpa <= 3.7) benchmark = "A- (3.70)";

    const status: TargetGpaFeasibilityStatus = requiredGpa > 3.7 ? "CHALLENGING" : "ACHIEVABLE";
    return {
      status,
      targetGpa,
      currentGpa: null,
      completedCredits: 0,
      remainingCredits,
      requiredGpa,
      requiredGpaString,
      recommendedGradeBenchmark: benchmark,
      explanation: `With no completed credits yet, your target GPA requires an average of ${requiredGpaString} across your ${remainingCredits} enrolled credits.`,
    };
  }

  // 8. General case: completedCredits > 0, remainingCredits > 0, currentGpa < targetGpa
  const totalCredits = completedCredits + remainingCredits;
  const totalPointsNeeded = targetGpa * totalCredits;
  const currentPoints = currentGpa * completedCredits;
  const remainingPointsNeeded = totalPointsNeeded - currentPoints;
  const rawRequiredGpa = remainingPointsNeeded / remainingCredits;
  const requiredGpa = Number(rawRequiredGpa.toFixed(2));
  const requiredGpaString = requiredGpa.toFixed(2);

  // Check if already mathematically met (due to rounding)
  if (rawRequiredGpa <= 0) {
    return {
      status: "ALREADY_MET",
      targetGpa,
      currentGpa,
      completedCredits,
      remainingCredits,
      requiredGpa: null,
      requiredGpaString: "N/A",
      recommendedGradeBenchmark: null,
      explanation: `Your target GPA of ${targetGpa.toFixed(2)} is already secured.`,
    };
  }

  // Max possible GPA achievable with straight 4.0 in remaining credits
  const maxPossiblePoints = currentPoints + 4.0 * remainingCredits;
  const maxAchievableGpa = Number((maxPossiblePoints / totalCredits).toFixed(2));

  if (rawRequiredGpa > 4.0) {
    return {
      status: "MATHEMATICALLY_IMPOSSIBLE",
      targetGpa,
      currentGpa,
      completedCredits,
      remainingCredits,
      requiredGpa,
      requiredGpaString,
      recommendedGradeBenchmark: null,
      explanation: `Mathematically unattainable within ${remainingCredits} remaining credits. Even straight 4.0 (A/A+) grades yield a maximum achievable GPA of ${maxAchievableGpa.toFixed(2)}.`,
    };
  }

  // Determine benchmark grade
  let recommendedGradeBenchmark = "A (4.00)";
  if (requiredGpa <= 2.0) recommendedGradeBenchmark = "Passing (2.00)";
  else if (requiredGpa <= 2.3) recommendedGradeBenchmark = "C+ (2.30)";
  else if (requiredGpa <= 2.7) recommendedGradeBenchmark = "B- (2.70)";
  else if (requiredGpa <= 3.0) recommendedGradeBenchmark = "B (3.00)";
  else if (requiredGpa <= 3.3) recommendedGradeBenchmark = "B+ (3.30)";
  else if (requiredGpa <= 3.7) recommendedGradeBenchmark = "A- (3.70)";

  // Strict rule: requiredGpa > 3.70 is CHALLENGING, <= 3.70 is ACHIEVABLE
  const status: TargetGpaFeasibilityStatus = requiredGpa > 3.7 ? "CHALLENGING" : "ACHIEVABLE";

  const explanation =
    status === "CHALLENGING"
      ? `Challenging. You need an average GPA of ${requiredGpaString} across remaining ${remainingCredits} credits (~straight A grades).`
      : `Achievable. You need an average GPA of ${requiredGpaString} across remaining ${remainingCredits} credits (${recommendedGradeBenchmark} average).`;

  return {
    status,
    targetGpa,
    currentGpa,
    completedCredits,
    remainingCredits,
    requiredGpa,
    requiredGpaString,
    recommendedGradeBenchmark,
    explanation,
  };
}

/**
 * Pure mathematical GPA scenario simulator.
 * STRICTLY READ-ONLY: Never writes or updates any database record.
 */
export function simulateGpaCalculation(
  courses: CourseGradeState[],
  scenarios: CourseSimulationInput[],
  targetGpa: number | null = null
): GpaSimulationResult {
  // Map scenarios by courseId
  const scenarioMap = new Map<string, string>();
  for (const s of scenarios) {
    if (s.courseId && s.simulatedGrade && GRADE_POINTS[s.simulatedGrade] !== undefined) {
      scenarioMap.set(s.courseId, s.simulatedGrade);
    }
  }

  let currentPointsSum = 0;
  let currentCreditsSum = 0;
  let totalCreditsSum = 0;

  let projectedPointsSum = 0;
  let projectedCreditsSum = 0;
  let simulatedCount = 0;

  const simulatedCourses: SimulatedCourseResult[] = courses.map((c) => {
    totalCreditsSum += c.creditHours;

    // Existing grade calculations
    if (c.currentGradePoints !== null && c.creditHours > 0) {
      currentPointsSum += c.currentGradePoints * c.creditHours;
      currentCreditsSum += c.creditHours;
    }

    // Check if user simulated a grade for this course
    const simulatedGrade = scenarioMap.get(c.courseId);
    if (simulatedGrade) {
      const simPoints = GRADE_POINTS[simulatedGrade];
      projectedPointsSum += simPoints * c.creditHours;
      projectedCreditsSum += c.creditHours;
      simulatedCount++;

      return {
        courseId: c.courseId,
        courseName: c.courseName,
        courseCode: c.courseCode,
        creditHours: c.creditHours,
        currentGrade: c.currentGrade,
        currentGradePoints: c.currentGradePoints,
        simulatedGrade,
        simulatedGradePoints: simPoints,
        isSimulated: true,
      };
    } else if (c.currentGradePoints !== null) {
      // Retain existing grade if no simulation applied
      projectedPointsSum += c.currentGradePoints * c.creditHours;
      projectedCreditsSum += c.creditHours;

      return {
        courseId: c.courseId,
        courseName: c.courseName,
        courseCode: c.courseCode,
        creditHours: c.creditHours,
        currentGrade: c.currentGrade,
        currentGradePoints: c.currentGradePoints,
        simulatedGrade: c.currentGrade ?? "N/A",
        simulatedGradePoints: c.currentGradePoints,
        isSimulated: false,
      };
    } else {
      // Ungraded and not simulated
      return {
        courseId: c.courseId,
        courseName: c.courseName,
        courseCode: c.courseCode,
        creditHours: c.creditHours,
        currentGrade: null,
        currentGradePoints: null,
        simulatedGrade: "Not Graded",
        simulatedGradePoints: 0,
        isSimulated: false,
      };
    }
  });

  const currentGpa = currentCreditsSum > 0 ? Number((currentPointsSum / currentCreditsSum).toFixed(2)) : null;
  const projectedGpa = projectedCreditsSum > 0 ? Number((projectedPointsSum / projectedCreditsSum).toFixed(2)) : 0.0;

  const delta = currentGpa !== null ? Number((projectedGpa - currentGpa).toFixed(2)) : 0;
  const deltaString = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);

  const targetMet = targetGpa !== null ? projectedGpa >= targetGpa : null;

  // Compute feasibility for remaining ungraded/unsimulated credits
  const remainingCredits = Math.max(0, totalCreditsSum - currentCreditsSum);
  const targetFeasibility = targetGpa !== null
    ? calculateRequiredGpaForTarget(currentGpa, currentCreditsSum, targetGpa, remainingCredits)
    : undefined;

  return {
    currentGpa,
    currentGpaString: currentGpa !== null ? currentGpa.toFixed(2) : "N/A",
    projectedGpa,
    projectedGpaString: projectedGpa.toFixed(2),
    targetGpa,
    targetGpaString: targetGpa !== null ? targetGpa.toFixed(2) : null,
    targetMet,
    delta,
    deltaString,
    totalCredits: totalCreditsSum,
    gradedCredits: currentCreditsSum,
    simulatedCredits: projectedCreditsSum,
    courses: simulatedCourses,
    targetFeasibility,
  };
}

/**
 * Loads student's courses and computes a pure in-memory GPA scenario.
 * GUARANTEED: Does NOT write to DB.
 */
export async function runStudentGpaSimulation(
  userId: string,
  scenarios: CourseSimulationInput[],
  overrideTargetGpa?: number | null
): Promise<GpaSimulationResult> {
  // Fetch user courses with grades and student target GPA goal in parallel
  const [courses, goal] = await Promise.all([
    prisma.course.findMany({
      where: { userId },
      include: {
        grades: true,
      },
      orderBy: { name: "asc" },
    }),
    overrideTargetGpa === undefined
      ? prisma.studentGoal.findFirst({
          where: {
            userId,
            type: "TARGET_GPA",
            active: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const courseStates: CourseGradeState[] = courses.map((c) => {
    const gradeRecord = c.grades[0] || null;
    return {
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      creditHours: c.creditHours,
      currentGrade: gradeRecord?.grade ?? null,
      currentGradePoints: gradeRecord?.gradePoints ?? null,
      isGraded: gradeRecord !== null,
    };
  });

  const targetGpa = overrideTargetGpa !== undefined ? overrideTargetGpa : goal ? goal.targetValue : null;

  return simulateGpaCalculation(courseStates, scenarios, targetGpa);
}
