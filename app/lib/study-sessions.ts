import "server-only";

// Study Sessions Service - Phase 13 Command Center
import { prisma, type PrismaClient } from "@/app/lib/prisma";
import {
  StudySessionItem,
  StudySessionFormValues,
  WeeklyStudySummary,
  CourseStudyTotal,
  StudyDayProgress,
  validateStudySessionInput,
  ActiveFocusSessionPayload,
  StartFocusSessionInput,
  FOCUS_SESSION_STATUS,
  FOCUS_TARGET_TYPES,
  calculateElapsedSeconds,
  calculateAuthoritativeMinutes,
  FOCUS_SESSION_VALIDATION,
} from "@/app/lib/study-session-definitions";
import {
  getPKTDayBounds,
  getPKTWeekBounds,
  getPKTDateParts,
  PKT_OFFSET_MS,
} from "@/app/lib/timezone";

/**
 * Fetch study sessions for a user, ordered by sessionDate descending.
 */
export async function getUserStudySessions(
  userId: string,
  options?: {
    courseId?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<StudySessionItem[]> {
  try {
    const whereClause: Record<string, unknown> = { userId };

    if (options?.courseId && options.courseId !== "ALL") {
      whereClause.courseId = options.courseId;
    }

    if (options?.startDate || options?.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (options.startDate) dateFilter.gte = options.startDate;
      if (options.endDate) dateFilter.lte = options.endDate;
      whereClause.sessionDate = dateFilter;
    }

    const records = await prisma.studySession.findMany({
      where: whereClause,
      include: {
        course: {
          select: { id: true, name: true, code: true, color: true },
        },
      },
      orderBy: { sessionDate: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });

    return records as StudySessionItem[];
  } catch (error) {
    console.error("Database error in getUserStudySessions:", error);
    return [];
  }
}

/**
 * Create a new study session record with strict ownership verification.
 */
export async function createStudySessionRecord(
  userId: string,
  data: StudySessionFormValues
): Promise<StudySessionItem> {
  const validation = validateStudySessionInput(data);
  if (!validation.isValid) {
    const msg = Object.values(validation.errors).join(" ");
    throw new Error(`Validation failed: ${msg}`);
  }

  // Validate course ownership if courseId is provided
  if (data.courseId) {
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, userId },
      select: { id: true },
    });
    if (!course) {
      throw new Error("Course not found or unauthorized.");
    }
  }

  const sessionDate = new Date(data.sessionDate);

  const session = await prisma.studySession.create({
    data: {
      userId,
      courseId: data.courseId || null,
      title: data.title.trim(),
      duration: Math.round(Number(data.duration)),
      sessionDate,
      source: data.source || "MANUAL",
      completed: data.completed ?? true,
    },
    include: {
      course: {
        select: { id: true, name: true, code: true, color: true },
      },
    },
  });

  return session as StudySessionItem;
}

/**
 * Update an existing study session with atomic ownership verification.
 */
export async function updateStudySessionRecord(
  userId: string,
  sessionId: string,
  data: Partial<StudySessionFormValues>
): Promise<boolean> {
  // If courseId is changing, verify ownership
  if (data.courseId) {
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, userId },
      select: { id: true },
    });
    if (!course) {
      throw new Error("Course not found or unauthorized.");
    }
  }

  const updatePayload: Record<string, unknown> = {};

  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      throw new Error("Title cannot be empty.");
    }
    updatePayload.title = data.title.trim();
  }

  if (data.duration !== undefined) {
    const dur = Number(data.duration);
    if (isNaN(dur) || dur < 1 || dur > 1440) {
      throw new Error("Duration must be between 1 and 1440 minutes.");
    }
    updatePayload.duration = Math.round(dur);
  }

  if (data.sessionDate !== undefined) {
    const d = new Date(data.sessionDate);
    if (isNaN(d.getTime())) {
      throw new Error("Invalid session date.");
    }
    updatePayload.sessionDate = d;
  }

  if (data.courseId !== undefined) {
    updatePayload.courseId = data.courseId || null;
  }

  if (data.completed !== undefined) {
    updatePayload.completed = Boolean(data.completed);
  }

  const result = await prisma.studySession.updateMany({
    where: { id: sessionId, userId },
    data: updatePayload,
  });

  if (result.count === 0) {
    throw new Error("Study session not found or unauthorized.");
  }

  return true;
}

/**
 * Delete a study session record with atomic ownership verification.
 */
export async function deleteStudySessionRecord(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const result = await prisma.studySession.deleteMany({
    where: { id: sessionId, userId },
  });

  if (result.count === 0) {
    throw new Error("Study session not found or unauthorized.");
  }

  return true;
}

/**
 * Fetch total minutes and formatted hours for current PKT week.
 */
export async function getWeeklyStudyTotal(
  userId: string,
  referenceDate: Date = new Date()
): Promise<{ minutes: number; hours: number; formatted: string }> {
  try {
    const { start, end } = getPKTWeekBounds(referenceDate);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        sessionDate: { gte: start, lte: end },
        completed: true,
      },
      select: { duration: true },
    });

    const minutes = sessions.reduce(
      (acc: number, s: { duration: number }) => acc + s.duration,
      0
    );
    const hours = Math.round((minutes / 60) * 10) / 10;
    const formatted = `${hours}h`;

    return { minutes, hours, formatted };
  } catch (error) {
    console.error("Database error in getWeeklyStudyTotal:", error);
    return { minutes: 0, hours: 0, formatted: "0h" };
  }
}

/**
 * Fetch total minutes and formatted hours for a specific PKT day.
 */
export async function getDailyStudyTotal(
  userId: string,
  referenceDate: Date = new Date()
): Promise<{ minutes: number; hours: number; formatted: string }> {
  try {
    const { start, end } = getPKTDayBounds(referenceDate);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        sessionDate: { gte: start, lte: end },
        completed: true,
      },
      select: { duration: true },
    });

    const minutes = sessions.reduce(
      (acc: number, s: { duration: number }) => acc + s.duration,
      0
    );
    const hours = Math.round((minutes / 60) * 10) / 10;
    const formatted = `${hours}h`;

    return { minutes, hours, formatted };
  } catch (error) {
    console.error("Database error in getDailyStudyTotal:", error);
    return { minutes: 0, hours: 0, formatted: "0h" };
  }
}

/**
 * Fetch study time breakdown per course for the user.
 */
export async function getPerCourseStudyTotals(
  userId: string
): Promise<CourseStudyTotal[]> {
  try {
    const [courses, sessions] = await Promise.all([
      prisma.course.findMany({
        where: { userId },
        select: { id: true, name: true, code: true, color: true },
      }),
      prisma.studySession.findMany({
        where: { userId, completed: true },
        select: { courseId: true, duration: true },
      }),
    ]);

    const courseMap = new Map<string, { minutes: number; count: number }>();

    for (const session of sessions) {
      const cid = session.courseId || "other";
      const current = courseMap.get(cid) || { minutes: 0, count: 0 };
      current.minutes += session.duration;
      current.count += 1;
      courseMap.set(cid, current);
    }

    const results: CourseStudyTotal[] = [];

    for (const course of courses) {
      const stats = courseMap.get(course.id) || { minutes: 0, count: 0 };
      const hours = Math.round((stats.minutes / 60) * 10) / 10;
      results.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        courseColor: course.color,
        totalMinutes: stats.minutes,
        totalHours: hours,
        formattedHours: `${hours}h`,
        sessionCount: stats.count,
      });
    }

    // Include unassigned study sessions if any
    const otherStats = courseMap.get("other");
    if (otherStats && otherStats.minutes > 0) {
      const hours = Math.round((otherStats.minutes / 60) * 10) / 10;
      results.push({
        courseId: "other",
        courseName: "General / Other",
        courseCode: "GEN",
        courseColor: "#64748b",
        totalMinutes: otherStats.minutes,
        totalHours: hours,
        formattedHours: `${hours}h`,
        sessionCount: otherStats.count,
      });
    }

    return results.sort((a, b) => b.totalMinutes - a.totalMinutes);
  } catch (error) {
    console.error("Database error in getPerCourseStudyTotals:", error);
    return [];
  }
}

/**
 * Returns 7-day Monday-to-Sunday study progress in hours for the current week.
 * Perfectly replaces DEMO_STUDY_PROGRESS on dashboard.
 */
export async function getWeeklyStudyProgress(
  userId: string,
  referenceDate: Date = new Date()
): Promise<StudyDayProgress[]> {
  try {
    const { start, end } = getPKTWeekBounds(referenceDate);
    const todayPkt = getPKTDateParts(referenceDate);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        sessionDate: { gte: start, lte: end },
        completed: true,
      },
      select: { duration: true, sessionDate: true },
    });

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailyMinutes: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (const session of sessions) {
      const sPkt = getPKTDateParts(session.sessionDate);
      const dayIdx = sPkt.dayOfWeek - 1; // 0 = Mon, 6 = Sun
      if (dayIdx >= 0 && dayIdx < 7) {
        dailyMinutes[dayIdx] += session.duration;
      }
    }

    // Build the 7 days
    const mondayPktMs = start.getTime() + PKT_OFFSET_MS;
    const mondayDate = new Date(mondayPktMs);

    return dayNames.map((name, idx) => {
      const dayDateMs = mondayDate.getTime() + idx * 86400000;
      const dayDate = new Date(dayDateMs);
      const dateStr = dayDate.toISOString().split("T")[0];
      const hours = Math.round((dailyMinutes[idx] / 60) * 10) / 10;
      const isToday = todayPkt.dayOfWeek - 1 === idx;

      return {
        day: name,
        hours,
        isToday,
        dateStr,
      };
    });
  } catch (error) {
    console.error("Database error in getWeeklyStudyProgress:", error);
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return dayNames.map((day) => ({
      day,
      hours: 0,
      isToday: false,
      dateStr: "",
    }));
  }
}

/**
 * Returns comprehensive weekly study summary for dashboard / study view.
 */
export async function getWeeklyStudySummary(
  userId: string,
  referenceDate: Date = new Date()
): Promise<WeeklyStudySummary> {
  const [weekly, daily, perCourse, dailyProgress, totalCount] = await Promise.all([
    getWeeklyStudyTotal(userId, referenceDate),
    getDailyStudyTotal(userId, referenceDate),
    getPerCourseStudyTotals(userId),
    getWeeklyStudyProgress(userId, referenceDate),
    prisma.studySession.count({ where: { userId, completed: true } }),
  ]);

  const mostStudiedCourse = perCourse.length > 0 && perCourse[0].totalMinutes > 0 ? perCourse[0] : null;

  return {
    thisWeekMinutes: weekly.minutes,
    thisWeekHours: weekly.hours,
    thisWeekHoursString: weekly.formatted,
    todayMinutes: daily.minutes,
    todayHoursString: daily.formatted,
    mostStudiedCourse,
    totalSessionsCount: totalCount,
    dailyProgress,
  };
}

// ---------------------------------------------------------------------------
// Milestone 15.2: Focus Session Lifecycle Methods
// ---------------------------------------------------------------------------

export class ActiveSessionConflictError extends Error {
  activeSession: any;
  constructor(activeSession: any) {
    super("You already have an active focus session in progress.");
    this.name = "ActiveSessionConflictError";
    this.activeSession = activeSession;
  }
}

/**
 * Fetch current active or paused Focus Session for the user.
 */
export async function getActiveFocusSessionRecord(
  userId: string,
  now: Date = new Date()
): Promise<ActiveFocusSessionPayload | null> {
  const session = await prisma.studySession.findFirst({
    where: {
      userId,
      status: { in: [FOCUS_SESSION_STATUS.ACTIVE, FOCUS_SESSION_STATUS.PAUSED] },
    },
    include: {
      course: {
        select: { id: true, name: true, code: true, color: true },
      },
    },
  });

  if (!session) return null;

  const elapsedSeconds = calculateElapsedSeconds({
    sessionDate: session.sessionDate,
    pausedAt: session.pausedAt,
    totalPausedSeconds: session.totalPausedSeconds,
    serverNow: now,
  });

  return {
    id: session.id,
    userId: session.userId,
    courseId: session.courseId,
    courseName: session.course?.name,
    courseCode: session.course?.code,
    courseColor: session.course?.color,
    title: session.title,
    duration: session.duration,
    plannedDuration: session.plannedDuration || 50,
    sessionDate: session.sessionDate.toISOString(),
    status: session.status as any,
    targetType: session.targetType as any,
    targetId: session.targetId,
    pausedAt: session.pausedAt ? session.pausedAt.toISOString() : null,
    totalPausedSeconds: session.totalPausedSeconds,
    serverNow: now.toISOString(),
    elapsedSeconds,
  };
}

/**
 * Start a new Focus Session with atomic User-row locking and partial unique index safety.
 */
export async function startFocusSessionRecord(
  userId: string,
  input: StartFocusSessionInput
): Promise<ActiveFocusSessionPayload> {
  const title = (input.title || "").trim();
  if (title.length < FOCUS_SESSION_VALIDATION.TITLE_MIN_LENGTH) {
    throw new Error("Focus session title is required.");
  }
  if (title.length > FOCUS_SESSION_VALIDATION.TITLE_MAX_LENGTH) {
    throw new Error(`Title cannot exceed ${FOCUS_SESSION_VALIDATION.TITLE_MAX_LENGTH} characters.`);
  }

  const planned = Math.round(Number(input.plannedMinutes));
  if (
    isNaN(planned) ||
    planned < FOCUS_SESSION_VALIDATION.MIN_PLANNED_MINUTES ||
    planned > FOCUS_SESSION_VALIDATION.MAX_PLANNED_MINUTES
  ) {
    throw new Error(
      `Planned duration must be between ${FOCUS_SESSION_VALIDATION.MIN_PLANNED_MINUTES} and ${FOCUS_SESSION_VALIDATION.MAX_PLANNED_MINUTES} minutes.`
    );
  }

  // Verify course ownership if courseId provided
  if (input.courseId) {
    const course = await prisma.course.findFirst({
      where: { id: input.courseId, userId },
      select: { id: true },
    });
    if (!course) {
      throw new Error("Course not found or unauthorized.");
    }
  }

  // Verify linked target entity ownership if targetId provided
  if (input.targetType && input.targetId) {
    if (input.targetType === FOCUS_TARGET_TYPES.ASSIGNMENT) {
      const asgn = await prisma.assignment.findFirst({
        where: { id: input.targetId, userId },
        select: { id: true },
      });
      if (!asgn) throw new Error("Linked assignment not found or unauthorized.");
    } else if (input.targetType === FOCUS_TARGET_TYPES.EXAM) {
      const exam = await prisma.exam.findFirst({
        where: { id: input.targetId, userId },
        select: { id: true },
      });
      if (!exam) throw new Error("Linked exam not found or unauthorized.");
    } else if (input.targetType === FOCUS_TARGET_TYPES.STUDY_PLAN_ITEM) {
      const item = await prisma.studyPlanItem.findFirst({
        where: { id: input.targetId, studyPlan: { userId } },
        select: { id: true },
      });
      if (!item) throw new Error("Linked study plan task not found or unauthorized.");
    } else if (input.targetType === FOCUS_TARGET_TYPES.COURSE_STUDY) {
      // COURSE_STUDY uses targetId as courseId — verify course ownership
      const course = await prisma.course.findFirst({
        where: { id: input.targetId, userId },
        select: { id: true },
      });
      if (!course) throw new Error("Linked course not found or unauthorized.");
    }
    // GENERAL type has no linked entity to validate
  }

  const now = (input as any)?.now ? new Date((input as any).now) : new Date();

  // Multi-device race safe transaction with User-row row lock
  return await prisma.$transaction(async (tx: any) => {
    // 1. Lock user row to serialize start calls across devices
    if (typeof tx.$queryRaw === "function") {
      try {
        await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${userId} FOR UPDATE`;
      } catch {
        // Fallback in test mock or non-Postgres environments
      }
    }

    // 2. Query for existing active or paused session
    const existing = await tx.studySession.findFirst({
      where: {
        userId,
        status: { in: [FOCUS_SESSION_STATUS.ACTIVE, FOCUS_SESSION_STATUS.PAUSED] },
      },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
    });

    if (existing) {
      const elapsedSeconds = calculateElapsedSeconds({
        sessionDate: existing.sessionDate,
        pausedAt: existing.pausedAt,
        totalPausedSeconds: existing.totalPausedSeconds,
        serverNow: now,
      });

      throw new ActiveSessionConflictError({
        id: existing.id,
        title: existing.title,
        status: existing.status,
        sessionDate: existing.sessionDate.toISOString(),
        elapsedSeconds,
      });
    }

    // 3. Create active session record
    const created = await tx.studySession.create({
      data: {
        userId,
        courseId: input.courseId || null,
        title,
        duration: 0, // 0 until completed
        sessionDate: now,
        source: "FOCUS_SESSION",
        completed: false,
        status: FOCUS_SESSION_STATUS.ACTIVE,
        targetType: input.targetType || null,
        targetId: input.targetId || null,
        plannedDuration: planned,
        pausedAt: null,
        totalPausedSeconds: 0,
      },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      courseId: created.courseId,
      courseName: created.course?.name,
      courseCode: created.course?.code,
      courseColor: created.course?.color,
      title: created.title,
      duration: 0,
      plannedDuration: planned,
      sessionDate: created.sessionDate.toISOString(),
      status: FOCUS_SESSION_STATUS.ACTIVE,
      targetType: (created.targetType as any) || null,
      targetId: created.targetId || null,
      pausedAt: null,
      totalPausedSeconds: 0,
      serverNow: now.toISOString(),
      elapsedSeconds: 0,
    };
  });
}

/**
 * Pause an active Focus Session. Idempotent.
 * Atomic mechanism: updateMany WHERE { id, userId, status: ACTIVE } encodes the required
 * prior state directly in the write predicate. count=0 means the precondition was not met.
 * No separate findFirst is used as the write-safety gate.
 */
export async function pauseFocusSessionRecord(
  userId: string,
  sessionId: string,
  now: Date = new Date()
): Promise<ActiveFocusSessionPayload> {
  return await prisma.$transaction(async (tx: any) => {
    // Atomic conditional write: succeeds ONLY if current status is ACTIVE.
    // Both the ownership (userId) and the prior-state requirement are in the WHERE.
    const writeResult = await tx.studySession.updateMany({
      where: { id: sessionId, userId, status: FOCUS_SESSION_STATUS.ACTIVE },
      data: { status: FOCUS_SESSION_STATUS.PAUSED, pausedAt: now },
    });

    if (writeResult.count === 0) {
      // Conditional write did not apply. Fetch current state to determine why.
      const current = await tx.studySession.findFirst({
        where: { id: sessionId, userId },
        include: { course: { select: { id: true, name: true, code: true, color: true } } },
      });
      if (!current) throw new Error("Focus session not found or unauthorized.");

      // Idempotent: already paused by this or a concurrent request
      if (current.status === FOCUS_SESSION_STATUS.PAUSED) {
        const elapsedSeconds = calculateElapsedSeconds({
          sessionDate: current.sessionDate,
          pausedAt: current.pausedAt,
          totalPausedSeconds: current.totalPausedSeconds,
          serverNow: now,
        });
        return {
          id: current.id,
          userId: current.userId,
          courseId: current.courseId,
          courseName: current.course?.name,
          courseCode: current.course?.code,
          courseColor: current.course?.color,
          title: current.title,
          duration: current.duration,
          plannedDuration: current.plannedDuration || 50,
          sessionDate: current.sessionDate.toISOString(),
          status: FOCUS_SESSION_STATUS.PAUSED,
          targetType: current.targetType as any,
          targetId: current.targetId,
          pausedAt: current.pausedAt ? current.pausedAt.toISOString() : now.toISOString(),
          totalPausedSeconds: current.totalPausedSeconds,
          serverNow: now.toISOString(),
          elapsedSeconds,
        };
      }

      // Terminal or invalid state — not pauseable
      throw new Error(`Cannot pause a session with status ${current.status}.`);
    }

    // Conditional write succeeded — fetch updated row for return payload.
    const updated = await tx.studySession.findFirst({
      where: { id: sessionId, userId },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
    });

    const elapsedSeconds = calculateElapsedSeconds({
      sessionDate: updated.sessionDate,
      pausedAt: updated.pausedAt,
      totalPausedSeconds: updated.totalPausedSeconds,
      serverNow: now,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      courseId: updated.courseId,
      courseName: updated.course?.name,
      courseCode: updated.course?.code,
      courseColor: updated.course?.color,
      title: updated.title,
      duration: updated.duration,
      plannedDuration: updated.plannedDuration || 50,
      sessionDate: updated.sessionDate.toISOString(),
      status: FOCUS_SESSION_STATUS.PAUSED,
      targetType: updated.targetType as any,
      targetId: updated.targetId,
      pausedAt: updated.pausedAt ? updated.pausedAt.toISOString() : now.toISOString(),
      totalPausedSeconds: updated.totalPausedSeconds,
      serverNow: now.toISOString(),
      elapsedSeconds,
    };
  });
}

/**
 * Resume a paused Focus Session. Idempotent.
 * Atomic mechanism: updateMany WHERE { id, userId, status: PAUSED } is the write predicate.
 * A pre-read inside the transaction is needed solely to obtain pausedAt for computing
 * additionalPausedSec. After the pre-read, the updateMany WHERE re-validates status —
 * if a concurrent change occurred between pre-read and write, count=0 signals the race.
 */
export async function resumeFocusSessionRecord(
  userId: string,
  sessionId: string,
  now: Date = new Date()
): Promise<ActiveFocusSessionPayload> {
  return await prisma.$transaction(async (tx: any) => {
    // Pre-read needed to obtain pausedAt for totalPausedSeconds computation.
    // This read does NOT determine write-safety — the updateMany WHERE does.
    const session = await tx.studySession.findFirst({
      where: { id: sessionId, userId },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
    });

    if (!session) throw new Error("Focus session not found or unauthorized.");

    // Idempotent: already active — return current state without touching DB
    if (session.status === FOCUS_SESSION_STATUS.ACTIVE) {
      const elapsedSeconds = calculateElapsedSeconds({
        sessionDate: session.sessionDate,
        pausedAt: null,
        totalPausedSeconds: session.totalPausedSeconds,
        serverNow: now,
      });
      return {
        id: session.id,
        userId: session.userId,
        courseId: session.courseId,
        courseName: session.course?.name,
        courseCode: session.course?.code,
        courseColor: session.course?.color,
        title: session.title,
        duration: session.duration,
        plannedDuration: session.plannedDuration || 50,
        sessionDate: session.sessionDate.toISOString(),
        status: FOCUS_SESSION_STATUS.ACTIVE,
        targetType: session.targetType as any,
        targetId: session.targetId,
        pausedAt: null,
        totalPausedSeconds: session.totalPausedSeconds,
        serverNow: now.toISOString(),
        elapsedSeconds,
      };
    }

    // Status validation before attempting write (terminal states can't resume)
    if (session.status !== FOCUS_SESSION_STATUS.PAUSED) {
      throw new Error(`Cannot resume a session with status ${session.status}.`);
    }

    // Compute additionalPausedSec from the pre-read pausedAt value
    let additionalPausedSec = 0;
    if (session.pausedAt) {
      const pauseStartMs = new Date(session.pausedAt).getTime();
      additionalPausedSec = Math.max(0, Math.floor((now.getTime() - pauseStartMs) / 1000));
    }
    const newTotalPaused = session.totalPausedSeconds + additionalPausedSec;

    // Atomic conditional write: succeeds ONLY if status is STILL PAUSED at write time.
    // If a concurrent request changed status between pre-read and here, count=0.
    const writeResult = await tx.studySession.updateMany({
      where: { id: sessionId, userId, status: FOCUS_SESSION_STATUS.PAUSED },
      data: { status: FOCUS_SESSION_STATUS.ACTIVE, pausedAt: null, totalPausedSeconds: newTotalPaused },
    });

    if (writeResult.count === 0) {
      // Concurrent state change between pre-read and conditional write
      throw new Error("Session state changed concurrently. Please retry.");
    }

    // Write succeeded — fetch updated row for return payload
    const updated = await tx.studySession.findFirst({
      where: { id: sessionId, userId },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
    });

    const elapsedSeconds = calculateElapsedSeconds({
      sessionDate: updated.sessionDate,
      pausedAt: null,
      totalPausedSeconds: updated.totalPausedSeconds,
      serverNow: now,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      courseId: updated.courseId,
      courseName: updated.course?.name,
      courseCode: updated.course?.code,
      courseColor: updated.course?.color,
      title: updated.title,
      duration: updated.duration,
      plannedDuration: updated.plannedDuration || 50,
      sessionDate: updated.sessionDate.toISOString(),
      status: FOCUS_SESSION_STATUS.ACTIVE,
      targetType: updated.targetType as any,
      targetId: updated.targetId,
      pausedAt: null,
      totalPausedSeconds: updated.totalPausedSeconds,
      serverNow: now.toISOString(),
      elapsedSeconds,
    };
  });
}

/**
 * Complete a Focus Session authoritatively.
 * Atomic mechanism: updateMany WHERE { id, userId, status: { in: [ACTIVE, PAUSED] } } is the
 * write predicate. A pre-read is needed to compute elapsed seconds from session start time
 * and to handle the idempotent case. After the pre-read, the conditional write re-validates
 * status — a count=0 result means the session left the completeable state concurrently.
 * The client does NOT provide actualMinutes; the server calculates it strictly.
 */
export async function completeFocusSessionRecord(
  userId: string,
  sessionId: string,
  options?: {
    markTargetComplete?: boolean;
    now?: Date;
  }
): Promise<{
  session: StudySessionItem;
  plannedMinutes: number;
  actualMinutes: number;
  targetMarkedComplete: boolean;
}> {
  const now = options?.now || new Date();

  return await prisma.$transaction(async (tx: any) => {
    // Pre-read: needed for idempotent check and elapsed time computation.
    // This read does NOT determine write-safety — the updateMany WHERE does.
    const session = await tx.studySession.findFirst({
      where: { id: sessionId, userId },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
    });

    if (!session) throw new Error("Focus session not found or unauthorized.");

    // Idempotent: already completed — return frozen result without mutation
    if (session.status === FOCUS_SESSION_STATUS.COMPLETED && session.completed) {
      return {
        session: session as any,
        plannedMinutes: session.plannedDuration || session.duration,
        actualMinutes: session.duration,
        targetMarkedComplete: false,
      };
    }

    // Status validation before attempting write
    if (
      session.status !== FOCUS_SESSION_STATUS.ACTIVE &&
      session.status !== FOCUS_SESSION_STATUS.PAUSED
    ) {
      throw new Error(`Cannot complete a session with status ${session.status}.`);
    }

    // Compute authoritative elapsed seconds from session state at pre-read time
    const elapsedSeconds = calculateElapsedSeconds({
      sessionDate: session.sessionDate,
      pausedAt: session.pausedAt,
      totalPausedSeconds: session.totalPausedSeconds,
      serverNow: now,
    });
    const actualMinutes = calculateAuthoritativeMinutes({
      elapsedSeconds,
      plannedDurationMinutes: session.plannedDuration,
    });

    // Side-effect: mark linked target entity as complete (optional, ownership-scoped)
    let targetMarked = false;
    if (options?.markTargetComplete && session.targetId) {
      if (session.targetType === FOCUS_TARGET_TYPES.ASSIGNMENT) {
        await tx.assignment.updateMany({
          where: { id: session.targetId, userId },
          data: { status: "COMPLETED" },
        });
        targetMarked = true;
      } else if (session.targetType === FOCUS_TARGET_TYPES.STUDY_PLAN_ITEM) {
        await tx.studyPlanItem.updateMany({
          where: { id: session.targetId, studyPlan: { userId } },
          data: { completed: true },
        });
        targetMarked = true;
      }
    }

    // Atomic conditional write: succeeds ONLY if session is STILL in a completeable state.
    // Both ownership (userId) and prior-state requirement are encoded in the WHERE.
    const writeResult = await tx.studySession.updateMany({
      where: {
        id: sessionId,
        userId,
        status: { in: [FOCUS_SESSION_STATUS.ACTIVE, FOCUS_SESSION_STATUS.PAUSED] },
      },
      data: {
        status: FOCUS_SESSION_STATUS.COMPLETED,
        completed: true,
        duration: actualMinutes,
        pausedAt: null,
      },
    });

    if (writeResult.count === 0) {
      // Concurrent change between pre-read and conditional write
      throw new Error("Session state changed concurrently. Please retry.");
    }

    // Fetch updated row for return payload
    const updated = await tx.studySession.findFirst({
      where: { id: sessionId, userId },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
    });

    return {
      session: updated as any,
      plannedMinutes: updated.plannedDuration || 50,
      actualMinutes,
      targetMarkedComplete: targetMarked,
    };
  });
}

/**
 * Cancel a Focus Session.
 * Atomic mechanism: for partial-session path, updateMany WHERE { id, userId,
 * status: { notIn: [COMPLETED, CANCELLED] } } is the write predicate.
 * For the accidental-start path (< 60s), deleteMany with the same ownership + status
 * constraint is the write predicate.
 * A pre-read is needed for the idempotent check, the COMPLETED guard, and elapsed
 * computation. After the pre-read the conditional write re-validates state.
 * If elapsed < 1 min, record is completely removed (accidental start).
 * If elapsed >= 1 min, session is marked CANCELLED with partial minutes preserved for audit.
 */
export async function cancelFocusSessionRecord(
  userId: string,
  sessionId: string,
  now: Date = new Date()
): Promise<{ action: "DISCARDED" | "RECORDED_PARTIAL"; actualMinutes?: number }> {
  return (await prisma.$transaction(async (tx: any) => {
    // Pre-read: for idempotent check, COMPLETED guard, and elapsed computation.
    // This read does NOT determine write-safety — the conditional writes below do.
    const session = await tx.studySession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) throw new Error("Focus session not found or unauthorized.");

    // Hard guard: completed sessions can never be cancelled
    if (session.status === FOCUS_SESSION_STATUS.COMPLETED) {
      throw new Error("Cannot cancel an already completed session.");
    }

    // Idempotent: already cancelled — return existing partial record
    if (session.status === FOCUS_SESSION_STATUS.CANCELLED) {
      return { action: "RECORDED_PARTIAL", actualMinutes: session.duration };
    }

    const elapsedSeconds = calculateElapsedSeconds({
      sessionDate: session.sessionDate,
      pausedAt: session.pausedAt,
      totalPausedSeconds: session.totalPausedSeconds,
      serverNow: now,
    });

    if (elapsedSeconds < 60) {
      // Accidental start: atomic conditional delete.
      // WHERE encodes ownership (userId) and excludes terminal states.
      await tx.studySession.deleteMany({
        where: {
          id: sessionId,
          userId,
          status: { notIn: [FOCUS_SESSION_STATUS.COMPLETED, FOCUS_SESSION_STATUS.CANCELLED] },
        },
      });
      return { action: "DISCARDED" };
    }

    // Partial session (>= 1 min): atomic conditional write.
    // WHERE encodes ownership (userId) and excludes terminal states.
    const partialMinutes = Math.round(elapsedSeconds / 60);
    const writeResult = await tx.studySession.updateMany({
      where: {
        id: sessionId,
        userId,
        status: { notIn: [FOCUS_SESSION_STATUS.COMPLETED, FOCUS_SESSION_STATUS.CANCELLED] },
      },
      data: {
        status: FOCUS_SESSION_STATUS.CANCELLED,
        completed: false, // Does not count toward weekly goals
        duration: partialMinutes,
        pausedAt: null,
      },
    });

    if (writeResult.count === 0) {
      // Concurrent change between pre-read and conditional write
      throw new Error("Session state changed concurrently. Please retry.");
    }

    return { action: "RECORDED_PARTIAL", actualMinutes: partialMinutes };
  })) as { action: "DISCARDED" | "RECORDED_PARTIAL"; actualMinutes?: number };
}
