import "server-only";

import { prisma } from "@/app/lib/prisma";
import { Course, CourseFormValues } from "@/app/lib/course-definitions";

/**
 * Fetch all courses belonging to the authenticated user.
 * Ordered by creation date descending.
 */
export async function getUserCourses(userId: string): Promise<Course[]> {
  try {
    const courses = await prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return courses;
  } catch (error) {
    console.error("Database error in getUserCourses:", error);
    return [];
  }
}

/**
 * Fetch a single course by its ID, ensuring it belongs to the given user.
 */
export async function getCourseById(
  courseId: string,
  userId: string
): Promise<Course | null> {
  try {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId,
      },
    });
    return course;
  } catch (error) {
    console.error("Database error in getCourseById:", error);
    return null;
  }
}

/**
 * Create a new course for the specified user.
 */
export async function createCourseRecord(
  userId: string,
  data: CourseFormValues
): Promise<Course> {
  return await prisma.course.create({
    data: {
      userId,
      name: data.name,
      code: data.code,
      instructor: data.instructor || "",
      creditHours: data.creditHours,
      semester: data.semester || "",
      color: data.color || "#2563eb",
    },
  });
}

/**
 * Update an existing course owned by the specified user.
 * Scoped strictly by id AND userId to prevent cross-user mutations.
 */
export async function updateCourseRecord(
  courseId: string,
  userId: string,
  data: CourseFormValues
): Promise<Course> {
  const result = await prisma.course.updateMany({
    where: {
      id: courseId,
      userId,
    },
    data: {
      name: data.name,
      code: data.code,
      instructor: data.instructor || "",
      creditHours: data.creditHours,
      semester: data.semester || "",
      color: data.color || "#2563eb",
    },
  });

  if (result.count === 0) {
    throw new Error("Course not found or unauthorized.");
  }

  const updated = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId,
    },
  });

  return updated!;
}

/**
 * Delete a course owned by the specified user.
 * Scoped strictly by id AND userId.
 */
export async function deleteCourseRecord(
  courseId: string,
  userId: string
): Promise<void> {
  const result = await prisma.course.deleteMany({
    where: {
      id: courseId,
      userId,
    },
  });

  if (result.count === 0) {
    throw new Error("Course not found or unauthorized.");
  }
}
