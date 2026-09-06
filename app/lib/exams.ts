import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  Exam,
  ExamFormValues,
  EXAM_STATUSES,
  getEffectiveExamStatus,
} from "@/app/lib/exam-definitions";

/**
 * Fetch all exams for a specific user, ordered by examDate ascending.
 * Automatically synchronizes past exam status to COMPLETED if needed.
 */
export async function getUserExams(userId: string): Promise<Exam[]> {
  try {
    const exams = await prisma.exam.findMany({
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
      orderBy: { examDate: "asc" },
    });

    return exams.map((e) => ({
      ...e,
      status: getEffectiveExamStatus(e.examDate, e.status),
    }));
  } catch (error) {
    console.error("Database error in getUserExams:", error);
    return [];
  }
}

/**
 * Fetch upcoming exams for a user (future dates, not completed).
 */
export async function getUpcomingExams(userId: string): Promise<Exam[]> {
  try {
    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        userId,
        examDate: { gte: now },
        status: { not: EXAM_STATUSES.COMPLETED },
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
      orderBy: { examDate: "asc" },
    });

    return exams;
  } catch (error) {
    console.error("Database error in getUpcomingExams:", error);
    return [];
  }
}

/**
 * Fetch the nearest upcoming exam for the dashboard.
 * Nearest exam whose status is UPCOMING and whose examDate is in the future.
 */
export async function getNextExam(userId: string): Promise<Exam | null> {
  try {
    const now = new Date();
    const nextExam = await prisma.exam.findFirst({
      where: {
        userId,
        examDate: { gte: now },
        status: { not: EXAM_STATUSES.COMPLETED },
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
      orderBy: { examDate: "asc" },
    });

    return nextExam;
  } catch (error) {
    console.error("Database error in getNextExam:", error);
    return null;
  }
}

/**
 * Create a new exam record for the user.
 */
export async function createExamRecord(
  userId: string,
  data: ExamFormValues
): Promise<Exam> {
  // Verify target course ownership
  const course = await prisma.course.findFirst({
    where: { id: data.courseId, userId },
  });
  if (!course) {
    throw new Error("Course not found or unauthorized.");
  }

  return await prisma.exam.create({
    data: {
      userId,
      courseId: data.courseId,
      title: data.title,
      examDate: data.examDate,
      room: data.room || "",
      type: data.type,
      status: data.status,
      preparationProgress: data.preparationProgress,
      notes: data.notes || "",
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
 * Update an existing exam, scoped strictly by id AND userId.
 */
export async function updateExamRecord(
  examId: string,
  userId: string,
  data: ExamFormValues
): Promise<Exam> {
  // Verify target course ownership
  const course = await prisma.course.findFirst({
    where: { id: data.courseId, userId },
  });
  if (!course) {
    throw new Error("Course not found or unauthorized.");
  }

  const result = await prisma.exam.updateMany({
    where: {
      id: examId,
      userId,
    },
    data: {
      courseId: data.courseId,
      title: data.title,
      examDate: data.examDate,
      room: data.room || "",
      type: data.type,
      status: data.status,
      preparationProgress: data.preparationProgress,
      notes: data.notes || "",
    },
  });

  if (result.count === 0) {
    throw new Error("Exam not found or unauthorized.");
  }

  const updated = await prisma.exam.findFirst({
    where: {
      id: examId,
      userId,
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

  return updated!;
}

/**
 * Delete an exam, scoped strictly by id AND userId.
 */
export async function deleteExamRecord(
  examId: string,
  userId: string
): Promise<void> {
  const result = await prisma.exam.deleteMany({
    where: {
      id: examId,
      userId,
    },
  });

  if (result.count === 0) {
    throw new Error("Exam not found or unauthorized.");
  }
}
