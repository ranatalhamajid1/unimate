"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import {
  createStudyPlanWithItems,
  toggleStudyPlanItemCompleted,
  deleteStudyPlanItem,
  deleteStudyPlan,
} from "@/app/lib/study-plans";

export type StudyPlanActionResult = {
  success: boolean;
  message?: string;
};

/**
 * Server action to save a confirmed study plan.
 */
export async function createStudyPlanAction(
  planData: {
    title: string;
    startDate: string | Date;
    endDate: string | Date;
  },
  items: Array<{
    courseId?: string | null;
    title: string;
    description?: string;
    scheduledAt: string | Date;
    duration: number;
    order?: number;
  }>
): Promise<StudyPlanActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!items || items.length === 0) {
      return { success: false, message: "Study plan must contain at least one task." };
    }

    await createStudyPlanWithItems(
      session.userId,
      {
        title: planData.title,
        startDate: new Date(planData.startDate),
        endDate: new Date(planData.endDate),
      },
      items.map((it) => ({
        ...it,
        scheduledAt: new Date(it.scheduledAt),
      }))
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/study-plan");
    revalidatePath("/dashboard/study");
    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create study plan.";
    return { success: false, message };
  }
}

/**
 * Server action to toggle a study task completed.
 */
export async function toggleStudyPlanItemAction(
  itemId: string,
  completed: boolean,
  autoLogSession: boolean = true
): Promise<StudyPlanActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    await toggleStudyPlanItemCompleted(session.userId, itemId, completed, autoLogSession);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/study-plan");
    revalidatePath("/dashboard/study");
    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update task.";
    return { success: false, message };
  }
}

/**
 * Server action to delete an item from a study plan.
 */
export async function deleteStudyPlanItemAction(
  itemId: string
): Promise<StudyPlanActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    await deleteStudyPlanItem(session.userId, itemId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/study-plan");
    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete task.";
    return { success: false, message };
  }
}

/**
 * Server action to delete an entire study plan.
 */
export async function deleteStudyPlanAction(
  planId: string
): Promise<StudyPlanActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    await deleteStudyPlan(session.userId, planId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/study-plan");
    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete plan.";
    return { success: false, message };
  }
}
