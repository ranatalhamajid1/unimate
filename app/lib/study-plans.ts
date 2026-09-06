import "server-only";

// Study Plans Service - Phase 13 Command Center
import { prisma } from "@/app/lib/prisma";
import {
  StudyPlanData,
  StudyPlanItemData,
  DraftPlanItem,
  validateStudyPlanInput,
} from "@/app/lib/study-plan-definitions";
import { createStudySessionRecord } from "@/app/lib/study-sessions";

/**
 * Fetch the active study plan for a user with its scheduled tasks and course details.
 */
export async function getUserActiveStudyPlan(
  userId: string
): Promise<StudyPlanData | null> {
  try {
    const plan = await prisma.studyPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            course: {
              select: { id: true, name: true, code: true, color: true },
            },
          },
          orderBy: [{ scheduledAt: "asc" }, { order: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!plan) return null;

    const totalDuration = plan.items.reduce(
      (acc: number, it: { duration: number }) => acc + it.duration,
      0
    );
    const completedDuration = plan.items
      .filter((it: { completed: boolean }) => it.completed)
      .reduce(
        (acc: number, it: { duration: number }) => acc + it.duration,
        0
      );
    const progress =
      plan.items.length > 0
        ? Math.round(
            (plan.items.filter((it: { completed: boolean }) => it.completed)
              .length /
              plan.items.length) *
              100
          )
        : 0;

    return {
      id: plan.id,
      userId: plan.userId,
      title: plan.title,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      items: plan.items as StudyPlanItemData[],
      progressPercentage: progress,
      totalDurationMinutes: totalDuration,
      completedDurationMinutes: completedDuration,
    };
  } catch (error) {
    console.error("Database error in getUserActiveStudyPlan:", error);
    return null;
  }
}

/**
 * Creates a new Study Plan and its items in an atomic transaction.
 * Strictly verifies ownership of user and all associated course IDs.
 */
export async function createStudyPlanWithItems(
  userId: string,
  planData: {
    title: string;
    startDate: Date;
    endDate: Date;
  },
  items: Array<{
    courseId?: string | null;
    title: string;
    description?: string;
    scheduledAt: Date;
    duration: number;
    order?: number;
  }>
): Promise<StudyPlanData> {
  const validation = validateStudyPlanInput(
    planData.title,
    planData.startDate,
    planData.endDate
  );
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Verify all courseIds belong to the user
  const courseIds = items
    .map((it) => it.courseId)
    .filter((cid): cid is string => Boolean(cid));

  if (courseIds.length > 0) {
    const userCourses = await prisma.course.findMany({
      where: { id: { in: courseIds }, userId },
      select: { id: true },
    });
    const foundCourseIds = new Set(userCourses.map((c) => c.id));
    for (const cid of courseIds) {
      if (!foundCourseIds.has(cid)) {
        throw new Error("Foreign or unauthorized course ID detected.");
      }
    }
  }

  // Create plan and items atomically
  const result = await prisma.$transaction(async (tx) => {
    // Optionally archive previously active plans so there is one primary active plan
    await tx.studyPlan.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    const newPlan = await tx.studyPlan.create({
      data: {
        userId,
        title: planData.title.trim(),
        startDate: planData.startDate,
        endDate: planData.endDate,
        status: "ACTIVE",
        items: {
          create: items.map((it, idx) => ({
            courseId: it.courseId || null,
            title: it.title.trim(),
            description: it.description?.trim() || "",
            scheduledAt: it.scheduledAt,
            duration: Math.max(1, Math.min(1440, Math.round(it.duration))),
            order: it.order ?? idx,
            completed: false,
          })),
        },
      },
      include: {
        items: {
          include: {
            course: {
              select: { id: true, name: true, code: true, color: true },
            },
          },
          orderBy: [{ scheduledAt: "asc" }, { order: "asc" }],
        },
      },
    });

    return newPlan;
  });

  const totalDuration = result.items.reduce(
    (acc: number, it: { duration: number }) => acc + it.duration,
    0
  );

  return {
    id: result.id,
    userId: result.userId,
    title: result.title,
    startDate: result.startDate,
    endDate: result.endDate,
    status: result.status,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    items: result.items as StudyPlanItemData[],
    progressPercentage: 0,
    totalDurationMinutes: totalDuration,
    completedDurationMinutes: 0,
  };
}

/**
 * Toggles a study plan item's completed status.
 * Strictly verifies ownership through the parent StudyPlan.
 * When marked completed, optionally creates a real StudySession record.
 */
export async function toggleStudyPlanItemCompleted(
  userId: string,
  itemId: string,
  completed: boolean,
  autoLogSession: boolean = true
): Promise<boolean> {
  // Check parent ownership
  const item = await prisma.studyPlanItem.findFirst({
    where: { id: itemId, studyPlan: { userId } },
    include: { studyPlan: true },
  });

  if (!item) {
    throw new Error("Study plan item not found or unauthorized.");
  }

  await prisma.studyPlanItem.update({
    where: { id: itemId },
    data: { completed },
  });

  // If newly completed and autoLogSession requested, log a StudySession
  if (completed && !item.completed && autoLogSession) {
    await createStudySessionRecord(userId, {
      courseId: item.courseId,
      title: item.title,
      duration: item.duration,
      sessionDate: item.scheduledAt,
      source: "STUDY_PLAN",
      completed: true,
    });
  }

  return true;
}

/**
 * Deletes a study plan item with parent ownership verification.
 */
export async function deleteStudyPlanItem(
  userId: string,
  itemId: string
): Promise<boolean> {
  const item = await prisma.studyPlanItem.findFirst({
    where: { id: itemId, studyPlan: { userId } },
  });

  if (!item) {
    throw new Error("Study plan item not found or unauthorized.");
  }

  await prisma.studyPlanItem.delete({
    where: { id: itemId },
  });

  return true;
}

/**
 * Deletes a whole study plan and cascades items with atomic ownership verification.
 */
export async function deleteStudyPlan(
  userId: string,
  planId: string
): Promise<boolean> {
  const result = await prisma.studyPlan.deleteMany({
    where: { id: planId, userId },
  });

  if (result.count === 0) {
    throw new Error("Study plan not found or unauthorized.");
  }

  return true;
}
