"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import {
  createStudySessionRecord,
  updateStudySessionRecord,
  deleteStudySessionRecord,
} from "@/app/lib/study-sessions";
import {
  StudySessionFormValues,
  validateStudySessionInput,
} from "@/app/lib/study-session-definitions";

export type StudySessionActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

/**
 * Server action to log a new study session.
 */
export async function createStudySessionAction(
  data: StudySessionFormValues
): Promise<StudySessionActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const validation = validateStudySessionInput(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    await createStudySessionRecord(session.userId, data);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/study");
    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log study session.";
    return { success: false, message };
  }
}

/**
 * Server action to update an existing study session.
 */
export async function updateStudySessionAction(
  sessionId: string,
  data: Partial<StudySessionFormValues>
): Promise<StudySessionActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!sessionId || typeof sessionId !== "string") {
      return { success: false, message: "Invalid session ID." };
    }

    await updateStudySessionRecord(session.userId, sessionId, data);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/study");
    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update study session.";
    return { success: false, message };
  }
}

/**
 * Server action to delete a study session.
 */
export async function deleteStudySessionAction(
  sessionId: string
): Promise<StudySessionActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!sessionId || typeof sessionId !== "string") {
      return { success: false, message: "Invalid session ID." };
    }

    await deleteStudySessionRecord(session.userId, sessionId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/study");
    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete study session.";
    return { success: false, message };
  }
}
