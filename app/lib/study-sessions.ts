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
