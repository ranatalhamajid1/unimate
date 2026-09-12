import "server-only";

// Study Plans Service - Phase 13 Command Center
import { prisma } from "@/app/lib/prisma";
import {
  StudyPlanData,
  StudyPlanItemData,
  AdaptiveStudyBlock,
  validateStudyPlanInput,
} from "@/app/lib/study-plan-definitions";
import { createStudySessionRecord } from "@/app/lib/study-sessions";
import { FOCUS_TARGET_TYPES } from "@/app/lib/study-session-definitions";
import { getPKTDateParts } from "@/app/lib/timezone";

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

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
 * Creates a new Study Plan and its items in an atomic serialized transaction.
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
    targetType?: string | null;
    targetId?: string | null;
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

  // Create plan and items atomically inside serialized transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Lock user row to serialize plan creation across tabs/devices
    if (typeof tx.$queryRaw === "function") {
      try {
        await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${userId} FOR UPDATE`;
      } catch {
        // Fallback in mock or non-Postgres test environments
      }
    }

    // 2. Archive previously active plans
    await tx.studyPlan.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    // 3. Create new active plan with typed target fields
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
            targetType: it.targetType || null,
            targetId: it.targetId || null,
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
 * Accepts and persists an untrusted adaptive draft plan.
 * Executes a full server-side revalidation pipeline:
 * - Scoped ownership check (course, assignment, exam)
 * - Target status validation (rejects completed assignments)
 * - Temporal deadline validation (cannot schedule after deadline)
 * - Timetable class collision check (no study blocks during classes)
 * - Block overlap check (no internal collisions)
 * - Enforces single active plan via User SELECT FOR UPDATE & partial unique index
 */
export async function acceptAdaptiveStudyPlan(
  userId: string,
  payload: {
    title: string;
    startDate: string | Date;
    endDate: string | Date;
    items: Array<{
      courseId?: string | null;
      title: string;
      description?: string;
      scheduledAt: string | Date;
      duration: number;
      targetType?: string | null;
      targetId?: string | null;
    }>;
  }
): Promise<StudyPlanData> {
  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);

  const validation = validateStudyPlanInput(payload.title, start, end);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Study plan must contain at least one study block.");
  }

  // 1. Validate course ownership
  const courseIds = payload.items
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

  // 2. Fetch user's timetable entries for conflict checking
  const timetableEntries = await prisma.timetableEntry.findMany({
    where: { userId },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });

  // 3. Revalidate each item: target ownership, target state, deadlines, duration, timetable collisions
  const validatedItems: Array<{
    courseId: string | null;
    title: string;
    description: string;
    scheduledAt: Date;
    duration: number;
    order: number;
    targetType: string | null;
    targetId: string | null;
  }> = [];

  for (let i = 0; i < payload.items.length; i++) {
    const it = payload.items[i];
    if (!it.title || it.title.trim().length === 0) {
      throw new Error(`Study block #${i + 1} must have a valid title.`);
    }

    const sched = new Date(it.scheduledAt);
    if (isNaN(sched.getTime())) {
      throw new Error(`Study block #${i + 1} has an invalid scheduled date/time.`);
    }

    if (sched.getTime() < start.getTime() || sched.getTime() > end.getTime()) {
      throw new Error(`Study block #${i + 1} scheduled time is outside the planning horizon.`);
    }

    const dur = Math.round(Number(it.duration));
    if (isNaN(dur) || dur < 15 || dur > 180) {
      throw new Error(`Study block #${i + 1} duration must be between 15 and 180 minutes.`);
    }

    const itemEndMs = sched.getTime() + dur * 60 * 1000;

    // Strict target ownership and deadline check
    if (it.targetType && it.targetId) {
      if (it.targetType === FOCUS_TARGET_TYPES.ASSIGNMENT) {
        const asgn = await prisma.assignment.findFirst({
          where: { id: it.targetId, userId },
          select: { id: true, status: true, dueDate: true },
        });
        if (!asgn) {
          throw new Error(`Linked assignment for block #${i + 1} not found or unauthorized.`);
        }
        if (asgn.status === "COMPLETED") {
          throw new Error(`Cannot schedule study blocks for already-completed assignment "${it.title}".`);
        }
        if (itemEndMs > asgn.dueDate.getTime() + 60000) {
          throw new Error(`Study block "${it.title}" is scheduled after its assignment deadline.`);
        }
      } else if (it.targetType === FOCUS_TARGET_TYPES.EXAM) {
        const exam = await prisma.exam.findFirst({
          where: { id: it.targetId, userId },
          select: { id: true, examDate: true },
        });
        if (!exam) {
          throw new Error(`Linked exam for block #${i + 1} not found or unauthorized.`);
        }
        if (itemEndMs > exam.examDate.getTime() + 60000) {
          throw new Error(`Study block "${it.title}" is scheduled after its exam date.`);
        }
      } else if (it.targetType === FOCUS_TARGET_TYPES.COURSE_STUDY) {
        const course = await prisma.course.findFirst({
          where: { id: it.targetId, userId },
          select: { id: true },
        });
        if (!course) {
          throw new Error(`Linked course for block #${i + 1} not found or unauthorized.`);
        }
      } else if (
        it.targetType !== FOCUS_TARGET_TYPES.GENERAL &&
        it.targetType !== FOCUS_TARGET_TYPES.STUDY_PLAN_ITEM
      ) {
        throw new Error(`Invalid target type "${it.targetType}" on block #${i + 1}.`);
      }
    }

    // Check collision with timetable classes on this day of week
    const pkt = getPKTDateParts(sched);
    const itemStartMins = pkt.hours * 60 + pkt.minutes;
    const itemEndMins = itemStartMins + dur;

    const dayClasses = timetableEntries.filter((t) => t.dayOfWeek === pkt.dayOfWeek);
    for (const c of dayClasses) {
      const cStart = parseMinutes(c.startTime);
      const cEnd = parseMinutes(c.endTime);
      if (itemStartMins < cEnd && itemEndMins > cStart) {
        throw new Error(`Study block "${it.title}" conflicts with a scheduled timetable class.`);
      }
    }

    validatedItems.push({
      courseId: it.courseId || null,
      title: it.title.trim(),
      description: it.description?.trim() || "",
      scheduledAt: sched,
      duration: dur,
      order: i,
      targetType: it.targetType || null,
      targetId: it.targetId || null,
    });
  }

  // 4. Check for overlapping blocks within the plan
  const sorted = [...validatedItems].sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const aEnd = sorted[i].scheduledAt.getTime() + sorted[i].duration * 60 * 1000;
    const bStart = sorted[i + 1].scheduledAt.getTime();
    if (aEnd > bStart) {
      throw new Error(`Study blocks "${sorted[i].title}" and "${sorted[i + 1].title}" overlap each other.`);
    }
  }

  // 5. Persist inside atomic serialized transaction
  return await createStudyPlanWithItems(
    userId,
    { title: payload.title.trim(), startDate: start, endDate: end },
    validatedItems
  );
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
