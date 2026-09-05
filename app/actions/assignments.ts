"use server";

/**
 * Server Actions for Assignments module.
 *
 * Enforces authenticated sessions, course ownership verification,
 * assignment ownership verification, server-side validation, and path revalidation.
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import { getCourseById } from "@/app/lib/courses";
import {
  validateAssignment,
  AssignmentFormState,
} from "@/app/lib/assignment-definitions";
import {
  createAssignmentRecord,
  updateAssignmentRecord,
  deleteAssignmentRecord,
} from "@/app/lib/assignments";

/**
 * Create a new assignment for the authenticated user.
 */
export async function createAssignment(
  prevState: AssignmentFormState,
  formData: FormData
): Promise<AssignmentFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to create an assignment.",
    };
  }

  // 2. Validate inputs
  const validated = validateAssignment(formData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.errors,
    };
  }

  const { courseId } = validated.data;

  // 3. Verify that the course belongs to the authenticated user
  const course = await getCourseById(courseId, session.userId);
  if (!course) {
    return {
      success: false,
      errors: {
        courseId: ["Selected course does not exist or does not belong to you."],
      },
    };
  }

  // 4. Persist assignment scoped by session.userId
  try {
    await createAssignmentRecord(session.userId, validated.data);
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return {
      success: false,
      message: "Database error. Failed to create assignment. Please try again.",
    };
  }

  // 5. Revalidate cache
  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Assignment created successfully.",
  };
}

/**
 * Update an existing assignment.
 */
export async function updateAssignment(
  assignmentId: string,
  prevState: AssignmentFormState,
  formData: FormData
): Promise<AssignmentFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to update an assignment.",
    };
  }

  // 2. Validate inputs
  const validated = validateAssignment(formData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.errors,
    };
  }

  const { courseId } = validated.data;

  // 3. Verify course ownership
  const course = await getCourseById(courseId, session.userId);
  if (!course) {
    return {
      success: false,
      errors: {
        courseId: ["Selected course does not exist or does not belong to you."],
      },
    };
  }

  // 4. Update assignment with ownership check
  try {
    await updateAssignmentRecord(assignmentId, session.userId, validated.data);
  } catch (error) {
    console.error("Failed to update assignment:", error);
    return {
      success: false,
      message: "Failed to update assignment. Ensure it exists and you have permission.",
    };
  }

  // 5. Revalidate cache
  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Assignment updated successfully.",
  };
}

/**
 * Delete an assignment.
 */
export async function deleteAssignment(
  assignmentId: string
): Promise<{ success: boolean; message?: string }> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to delete an assignment.",
    };
  }

  // 2. Delete with ownership check
  try {
    await deleteAssignmentRecord(assignmentId, session.userId);
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return {
      success: false,
      message: "Failed to delete assignment. Ensure it exists and you have permission.",
    };
  }

  // 3. Revalidate cache
  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Assignment deleted successfully.",
  };
}
