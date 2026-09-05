import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  Assignment,
  AssignmentFormValues,
  ASSIGNMENT_STATUSES,
} from "@/app/lib/assignment-definitions";

/**
 * Fetch all assignments for a user, ordered by dueDate ascending.
 * Includes course information (id, name, code, color).
 */
export async function getUserAssignments(userId: string): Promise<Assignment[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return assignments;
  } catch (error) {
    console.error("Database error in getUserAssignments:", error);
    return [];
  }
}

/**
 * Fetch upcoming assignments for the dashboard:
 * - Incomplete assignments first (nearest due date first)
 * - Limit to top 5 for dashboard card
 */
export async function getUpcomingAssignments(
  userId: string,
  limit = 5
): Promise<Assignment[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        userId,
        status: { not: ASSIGNMENT_STATUSES.COMPLETED },
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: limit,
    });

    return assignments;
  } catch (error) {
    console.error("Database error in getUpcomingAssignments:", error);
    return [];
  }
}

/**
 * Count incomplete assignments due in the current week for dashboard stat.
 */
export async function getDueThisWeekCount(userId: string): Promise<number> {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    const day = now.getDay();
    const diffToSunday = day === 0 ? 0 : 7 - day;
    endOfWeek.setDate(now.getDate() + diffToSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    const count = await prisma.assignment.count({
      where: {
        userId,
        status: { not: ASSIGNMENT_STATUSES.COMPLETED },
        dueDate: {
          gte: now,
          lte: endOfWeek,
        },
      },
    });

    return count;
  } catch (error) {
    console.error("Database error in getDueThisWeekCount:", error);
    return 0;
  }
}

/**
 * Create a new assignment for the user.
 */
export async function createAssignmentRecord(
  userId: string,
  data: AssignmentFormValues
): Promise<Assignment> {
  return await prisma.assignment.create({
    data: {
      userId,
      courseId: data.courseId,
      title: data.title,
      description: data.description || "",
      dueDate: data.dueDate,
      priority: data.priority,
      status: data.status,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          color: true,
        },
      },
    },
  });
}

/**
 * Update an existing assignment, scoped strictly by id AND userId.
 */
export async function updateAssignmentRecord(
  assignmentId: string,
  userId: string,
  data: AssignmentFormValues
): Promise<Assignment> {
  const existing = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Assignment not found or unauthorized.");
  }

  return await prisma.assignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      courseId: data.courseId,
      title: data.title,
      description: data.description || "",
      dueDate: data.dueDate,
      priority: data.priority,
      status: data.status,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          color: true,
        },
      },
    },
  });
}

/**
 * Delete an assignment, scoped strictly by id AND userId.
 */
export async function deleteAssignmentRecord(
  assignmentId: string,
  userId: string
): Promise<void> {
  const existing = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Assignment not found or unauthorized.");
  }

  await prisma.assignment.delete({
    where: {
      id: assignmentId,
    },
  });
}
