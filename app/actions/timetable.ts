"use server";

/**
 * Server Actions for Timetable module.
 *
 * Enforces authenticated sessions, ownership verification on courses,
 * strict timetable entry ownership, overlap validation, and path revalidation.
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import { getCourseById } from "@/app/lib/courses";
import {
  validateTimetableEntry,
  TimetableFormState,
} from "@/app/lib/timetable-definitions";
import {
  checkTimetableOverlap,
  createTimetableEntryRecord,
  updateTimetableEntryRecord,
  deleteTimetableEntryRecord,
} from "@/app/lib/timetable";

/**
 * Create a new timetable entry for the authenticated user.
 */
export async function createTimetableEntry(
  prevState: TimetableFormState,
  formData: FormData
): Promise<TimetableFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to add a class to your timetable.",
    };
  }

  // 2. Validate inputs
  const validated = validateTimetableEntry(formData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.errors,
    };
  }

  const { courseId, dayOfWeek, startTime, endTime } = validated.data;

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

  // 4. Check for overlapping classes on the same day for this user
  const isOverlapping = await checkTimetableOverlap(
    session.userId,
    dayOfWeek,
    startTime,
    endTime
  );

  if (isOverlapping) {
    return {
      success: false,
      message: "This class overlaps with another class on your timetable.",
    };
  }

  // 5. Persist the timetable entry
  try {
    await createTimetableEntryRecord(session.userId, validated.data);
  } catch (error) {
    console.error("Failed to create timetable entry:", error);
    return {
      success: false,
      message: "Database error. Failed to add class. Please try again.",
    };
  }

  // 6. Revalidate cache
  revalidatePath("/dashboard/timetable");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Class added to timetable successfully.",
  };
}

/**
 * Update an existing timetable entry, scoped strictly by entryId and session.userId.
 */
export async function updateTimetableEntry(
  entryId: string,
  prevState: TimetableFormState,
  formData: FormData
): Promise<TimetableFormState> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to update a class.",
    };
  }

  // 2. Validate inputs
  const validated = validateTimetableEntry(formData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.errors,
    };
  }

  const { courseId, dayOfWeek, startTime, endTime } = validated.data;

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

  // 4. Check for overlapping classes, excluding current entry
  const isOverlapping = await checkTimetableOverlap(
    session.userId,
    dayOfWeek,
    startTime,
    endTime,
    entryId
  );

  if (isOverlapping) {
    return {
      success: false,
      message: "This class overlaps with another class on your timetable.",
    };
  }

  // 5. Update record with ownership check
  try {
    await updateTimetableEntryRecord(entryId, session.userId, validated.data);
  } catch (error) {
    console.error("Failed to update timetable entry:", error);
    return {
      success: false,
      message: "Failed to update class. Ensure it exists and you have permission.",
    };
  }

  // 6. Revalidate cache
  revalidatePath("/dashboard/timetable");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Class updated successfully.",
  };
}

/**
 * Delete a timetable entry, scoped strictly by entryId and session.userId.
 */
export async function deleteTimetableEntry(
  entryId: string
): Promise<{ success: boolean; message?: string }> {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "You must be logged in to delete a class.",
    };
  }

  // 2. Delete record with ownership check
  try {
    await deleteTimetableEntryRecord(entryId, session.userId);
  } catch (error) {
    console.error("Failed to delete timetable entry:", error);
    return {
      success: false,
      message: "Failed to delete class. Ensure it exists and you have permission.",
    };
  }

  // 3. Revalidate cache
  revalidatePath("/dashboard/timetable");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Class removed from timetable.",
  };
}
