"use server";

/**
 * Server Actions for Exams module.
 *
 * Enforces authenticated sessions, course ownership verification,
 * exam ownership verification, server-side validation, and path revalidation.
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import { getCourseById } from "@/app/lib/courses";
import {
  validateExam,
  ExamFormState,
} from "@/app/lib/exam-definitions";
import {
  createExamRecord,
  updateExamRecord,
  deleteExamRecord,
} from "@/app/lib/exams";

/**
 * Create a new exam for the authenticated user.
 */
export async function createExam(
  prevState: ExamFormState,
  formData: FormData
): Promise<ExamFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to create an exam.",
    };
  }

  // 2. Validate input server-side
  const validated = validateExam(formData);
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

  // 4. Create record
  try {
    await createExamRecord(session.userId, validated.data);
  } catch (error) {
    console.error("Failed to create exam:", error);
    return {
      success: false,
      message: "Database error. Failed to create exam. Please try again.",
    };
  }

  // 5. Revalidate cache
  revalidatePath("/dashboard/exams");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Exam scheduled successfully.",
  };
}

/**
 * Update an existing exam, scoped strictly by examId and session.userId.
 */
export async function updateExam(
  examId: string,
  prevState: ExamFormState,
  formData: FormData
): Promise<ExamFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to update an exam.",
    };
  }

  // 2. Validate input server-side
  const validated = validateExam(formData);
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

  // 4. Update record with ownership check
  try {
    await updateExamRecord(examId, session.userId, validated.data);
  } catch (error) {
    console.error("Failed to update exam:", error);
    return {
      success: false,
      message: "Failed to update exam. Ensure it exists and you have permission.",
    };
  }

  // 5. Revalidate cache
  revalidatePath("/dashboard/exams");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Exam updated successfully.",
  };
}

/**
 * Delete an exam, scoped strictly by examId and session.userId.
 */
export async function deleteExam(
  examId: string
): Promise<{ success: boolean; message?: string }> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to delete an exam.",
    };
  }

  // 2. Delete record with ownership check
  try {
    await deleteExamRecord(examId, session.userId);
  } catch (error) {
    console.error("Failed to delete exam:", error);
    return {
      success: false,
      message: "Failed to delete exam. Ensure it exists and you have permission.",
    };
  }

  // 3. Revalidate cache
  revalidatePath("/dashboard/exams");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Exam deleted successfully.",
  };
}
