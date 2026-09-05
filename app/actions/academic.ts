"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import { getCourseById } from "@/app/lib/courses";
import {
  upsertCourseGrade,
  upsertAttendance,
  deleteCourseGrade as removeCourseGrade,
  deleteAttendance as removeAttendance,
} from "@/app/lib/academic";
import { GRADE_OPTIONS, GradeOption } from "@/app/lib/academic-definitions";

export type AcademicActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Save or update a grade for a course.
 * Scoped strictly to session.userId and validates course ownership.
 */
export async function saveCourseGrade(
  courseId: string,
  grade: string
): Promise<AcademicActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    // 1. Validate courseId
    if (!courseId || typeof courseId !== "string" || courseId.trim() === "") {
      return {
        success: false,
        errors: { courseId: ["Please select a valid course."] },
      };
    }

    // 2. Verify course ownership
    const course = await getCourseById(courseId, session.userId);
    if (!course) {
      return {
        success: false,
        errors: { courseId: ["Course not found or unauthorized."] },
      };
    }

    // 3. Validate grade
    const trimmedGrade = grade?.trim();
    if (!trimmedGrade || !GRADE_OPTIONS.includes(trimmedGrade as GradeOption)) {
      return {
        success: false,
        errors: {
          grade: [`Grade must be one of: ${GRADE_OPTIONS.join(", ")}`],
        },
      };
    }

    // 4. Upsert grade in PostgreSQL
    await upsertCourseGrade(session.userId, courseId, trimmedGrade);

    revalidatePath("/dashboard/academics");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");

    return { success: true, message: "Course grade saved successfully." };
  } catch (error) {
    console.error("Error saving course grade:", error);
    return {
      success: false,
      message: "An unexpected error occurred while saving the grade.",
    };
  }
}

/**
 * Save or update attendance for a course.
 * Scoped strictly to session.userId and validates course ownership.
 */
export async function saveAttendance(
  courseId: string,
  totalClasses: number,
  attendedClasses: number
): Promise<AcademicActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    // 1. Validate courseId
    if (!courseId || typeof courseId !== "string" || courseId.trim() === "") {
      return {
        success: false,
        errors: { courseId: ["Please select a valid course."] },
      };
    }

    // 2. Verify course ownership
    const course = await getCourseById(courseId, session.userId);
    if (!course) {
      return {
        success: false,
        errors: { courseId: ["Course not found or unauthorized."] },
      };
    }

    // 3. Validate class numbers
    const errors: Record<string, string[]> = {};
    const parsedTotal = Math.floor(Number(totalClasses));
    const parsedAttended = Math.floor(Number(attendedClasses));

    if (isNaN(parsedTotal) || parsedTotal < 0) {
      errors.totalClasses = ["Total classes must be 0 or greater."];
    }

    if (isNaN(parsedAttended) || parsedAttended < 0) {
      errors.attendedClasses = ["Attended classes must be 0 or greater."];
    } else if (!isNaN(parsedTotal) && parsedAttended > parsedTotal) {
      errors.attendedClasses = ["Attended classes cannot exceed total classes."];
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // 4. Upsert attendance in PostgreSQL
    await upsertAttendance(session.userId, courseId, parsedTotal, parsedAttended);

    revalidatePath("/dashboard/academics");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");

    return { success: true, message: "Attendance record saved successfully." };
  } catch (error) {
    console.error("Error saving attendance:", error);
    return {
      success: false,
      message: "An unexpected error occurred while saving attendance.",
    };
  }
}

/**
 * Delete a course grade record.
 */
export async function deleteCourseGrade(courseId: string): Promise<AcademicActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const course = await getCourseById(courseId, session.userId);
    if (!course) {
      return { success: false, message: "Course not found or unauthorized." };
    }

    await removeCourseGrade(session.userId, courseId);

    revalidatePath("/dashboard/academics");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");

    return { success: true, message: "Grade removed." };
  } catch (error) {
    console.error("Error deleting course grade:", error);
    return { success: false, message: "Failed to remove course grade." };
  }
}

/**
 * Delete a course attendance record.
 */
export async function deleteAttendance(courseId: string): Promise<AcademicActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const course = await getCourseById(courseId, session.userId);
    if (!course) {
      return { success: false, message: "Course not found or unauthorized." };
    }

    await removeAttendance(session.userId, courseId);

    revalidatePath("/dashboard/academics");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");

    return { success: true, message: "Attendance record removed." };
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return { success: false, message: "Failed to remove attendance record." };
  }
}
