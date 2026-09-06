"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import { upsertStudentGoal, deleteStudentGoal } from "@/app/lib/goals";
import { GoalType, GoalPeriod, validateGoalInput } from "@/app/lib/goal-definitions";

export type GoalActionResult = {
  success: boolean;
  message?: string;
};

/**
 * Server action to save or update a student goal.
 */
export async function upsertGoalAction(
  type: GoalType,
  targetValue: number,
  period?: GoalPeriod
): Promise<GoalActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const validation = validateGoalInput(type, targetValue);
    if (!validation.isValid) {
      return { success: false, message: validation.error };
    }

    await upsertStudentGoal(session.userId, type, targetValue, period);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/goals");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update goal.";
    return { success: false, message };
  }
}

/**
 * Server action to delete/reset a student goal.
 */
export async function deleteGoalAction(
  goalId: string
): Promise<GoalActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!goalId || typeof goalId !== "string") {
      return { success: false, message: "Invalid goal ID." };
    }

    await deleteStudentGoal(session.userId, goalId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/goals");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete goal.";
    return { success: false, message };
  }
}
