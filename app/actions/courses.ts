"use server";

/**
 * Server Actions for Courses module.
 *
 * All actions strictly verify the authenticated session and scope queries
 * by the session user's ID, preventing any unauthorized cross-user mutations.
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import {
  validateCourse,
  CourseFormState,
} from "@/app/lib/course-definitions";
import {
  createCourseRecord,
  updateCourseRecord,
  deleteCourseRecord,
} from "@/app/lib/courses";

/**
 * Create a new course for the current authenticated user.
 */
export async function createCourse(
  prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to create a course.",
    };
  }

  // 2. Validate inputs
  const validated = validateCourse(formData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.errors,
    };
  }

  // 3. Persist course scoped by authenticated userId
  try {
    await createCourseRecord(session.userId, validated.data);
  } catch (error) {
    console.error("Failed to create course:", error);
    return {
      success: false,
      message: "Database error. Failed to create course. Please try again.",
    };
  }

  // 4. Revalidate cache
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Course created successfully.",
  };
}

/**
 * Update an existing course. Scoped strictly by courseId and session.userId.
 */
export async function updateCourse(
  courseId: string,
  prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to update a course.",
    };
  }

  // 2. Validate inputs
  const validated = validateCourse(formData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.errors,
    };
  }

  // 3. Update course with ownership check
  try {
    await updateCourseRecord(courseId, session.userId, validated.data);
  } catch (error) {
    console.error("Failed to update course:", error);
    return {
      success: false,
      message: "Failed to update course. Ensure it exists and you have permission.",
    };
  }

  // 4. Revalidate cache
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Course updated successfully.",
  };
}

/**
 * Delete a course. Scoped strictly by courseId and session.userId.
 */
export async function deleteCourse(courseId: string): Promise<{ success: boolean; message?: string }> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to delete a course.",
    };
  }

  // 2. Delete course with ownership check
  try {
    await deleteCourseRecord(courseId, session.userId);
  } catch (error) {
    console.error("Failed to delete course:", error);
    return {
      success: false,
      message: "Failed to delete course. Ensure it exists and you have permission.",
    };
  }

  // 3. Revalidate cache
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Course deleted successfully.",
  };
}
