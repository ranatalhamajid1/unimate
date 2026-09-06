import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  GOAL_TYPES,
  GoalType,
  GOAL_PERIODS,
  GoalPeriod,
  StudentGoalItem,
  GoalProgressItem,
  GOAL_TYPE_CONFIG,
  validateGoalInput,
} from "@/app/lib/goal-definitions";
import { getAcademicOverview } from "@/app/lib/academic";
import { getWeeklyStudyTotal } from "@/app/lib/study-sessions";
import { ASSIGNMENT_STATUSES } from "@/app/lib/assignment-definitions";

/**
 * Fetch all active goals configured by the student.
 */
export async function getUserGoals(userId: string): Promise<StudentGoalItem[]> {
  try {
    const goals = await prisma.studentGoal.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
    });
    return goals as StudentGoalItem[];
  } catch (error) {
    console.error("Database error in getUserGoals:", error);
    return [];
  }
}

/**
 * Upsert a student goal (creates if not existing, updates if active goal of type exists).
 */
export async function upsertStudentGoal(
  userId: string,
  type: GoalType,
  targetValue: number,
  period?: GoalPeriod
): Promise<StudentGoalItem> {
  const validation = validateGoalInput(type, targetValue);
  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid goal input.");
  }

  const selectedPeriod = period || GOAL_TYPE_CONFIG[type].defaultPeriod;
  const numTarget = Number(targetValue);

  // Check if an active goal already exists for this type
  const existing = await prisma.studentGoal.findFirst({
    where: { userId, type, active: true },
  });

  if (existing) {
    const updated = await prisma.studentGoal.update({
      where: { id: existing.id },
      data: {
        targetValue: numTarget,
        period: selectedPeriod,
      },
    });
    return updated as StudentGoalItem;
  }

  const created = await prisma.studentGoal.create({
    data: {
      userId,
      type,
      targetValue: numTarget,
      period: selectedPeriod,
      active: true,
    },
  });

  return created as StudentGoalItem;
}

/**
 * Delete a student goal with atomic ownership verification.
 */
export async function deleteStudentGoal(
  userId: string,
  goalId: string
): Promise<boolean> {
  const result = await prisma.studentGoal.deleteMany({
    where: { id: goalId, userId },
  });

  if (result.count === 0) {
    throw new Error("Goal not found or unauthorized.");
  }

  return true;
}

/**
 * Dynamically calculates progress across all 4 student goal types
 * using REAL student data (GPA, attendance, study hours, assignments).
 */
export async function calculateStudentGoalsProgress(
  userId: string
): Promise<GoalProgressItem[]> {
  try {
    const [userGoals, academicOverview, weeklyStudy, assignments] = await Promise.all([
      getUserGoals(userId),
      getAcademicOverview(userId),
      getWeeklyStudyTotal(userId),
      prisma.assignment.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);

    const goalMap = new Map<string, StudentGoalItem>();
    for (const g of userGoals) {
      goalMap.set(g.type, g);
    }

    // 1. Current GPA
    const currentGpa = academicOverview.gpa ?? 0;

    // 2. Current Attendance
    const currentAttendance = academicOverview.overallAttendance ?? 0;

    // 3. Current Weekly Study Hours
    const currentWeeklyStudyHours = weeklyStudy.hours;

    // 4. Current Assignment Completion Rate
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === ASSIGNMENT_STATUSES.COMPLETED
    ).length;
    const currentAssignmentRate =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 100; // If no assignments assigned yet, student is caught up (100%)

    const typesOrder: GoalType[] = [
      GOAL_TYPES.TARGET_GPA,
      GOAL_TYPES.WEEKLY_STUDY_HOURS,
      GOAL_TYPES.ATTENDANCE,
      GOAL_TYPES.ASSIGNMENT_COMPLETION,
    ];

    return typesOrder.map((type) => {
      const config = GOAL_TYPE_CONFIG[type];
      const savedGoal = goalMap.get(type);

      let current = 0;
      if (type === GOAL_TYPES.TARGET_GPA) current = currentGpa;
      else if (type === GOAL_TYPES.ATTENDANCE) current = currentAttendance;
      else if (type === GOAL_TYPES.WEEKLY_STUDY_HOURS) current = currentWeeklyStudyHours;
      else if (type === GOAL_TYPES.ASSIGNMENT_COMPLETION) current = currentAssignmentRate;

      const target = savedGoal ? savedGoal.targetValue : config.suggestedDefault;
      const isConfigured = Boolean(savedGoal);

      let pct = 0;
      if (target > 0) {
        pct = Math.round((current / target) * 100);
      }

      // At risk indicator
      let isAtRisk = false;
      if (type === GOAL_TYPES.TARGET_GPA && current > 0 && current < target - 0.3) isAtRisk = true;
      if (type === GOAL_TYPES.ATTENDANCE && current > 0 && current < 75) isAtRisk = true;
      if (type === GOAL_TYPES.ASSIGNMENT_COMPLETION && totalAssignments > 0 && current < 70) isAtRisk = true;

      return {
        goalId: savedGoal?.id,
        type,
        label: config.label,
        description: config.description,
        targetValue: target,
        currentValue: current,
        unit: config.unit,
        formattedTarget: config.formatValue(target),
        formattedCurrent: config.formatValue(current),
        percentage: pct,
        period: (savedGoal?.period as GoalPeriod) || config.defaultPeriod,
        isConfigured,
        isAtRisk,
        suggestedDefault: config.suggestedDefault,
      };
    });
  } catch (error) {
    console.error("Error calculating goal progress:", error);
    return [];
  }
}
