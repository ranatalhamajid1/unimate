import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  TimetableEntry,
  TimetableFormValues,
  doTimesOverlap,
} from "@/app/lib/timetable-definitions";

/**
 * Fetch all timetable entries for a specific user, ordered by dayOfWeek then startTime.
 * Includes course details (id, name, code, color).
 */
export async function getUserTimetable(userId: string): Promise<TimetableEntry[]> {
  try {
    const entries = await prisma.timetableEntry.findMany({
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
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    return entries;
  } catch (error) {
    console.error("Database error in getUserTimetable:", error);
    return [];
  }
}

/**
 * Fetch timetable entries for today for a specific user (dayOfWeek: 1=Mon .. 7=Sun).
 */
export async function getTodayTimetable(
  userId: string,
  dayOfWeek: number
): Promise<TimetableEntry[]> {
  try {
    const entries = await prisma.timetableEntry.findMany({
      where: {
        userId,
        dayOfWeek,
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
      orderBy: { startTime: "asc" },
    });

    return entries;
  } catch (error) {
    console.error("Database error in getTodayTimetable:", error);
    return [];
  }
}

/**
 * Check if the user already has a class that overlaps with the given time range on that day.
 * Excludes `excludeId` if editing an existing entry.
 */
export async function checkTimetableOverlap(
  userId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const dayEntries = await prisma.timetableEntry.findMany({
      where: {
        userId,
        dayOfWeek,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    for (const entry of dayEntries) {
      if (doTimesOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
        return true; // Overlap detected
      }
    }

    return false;
  } catch (error) {
    console.error("Database error in checkTimetableOverlap:", error);
    return false;
  }
}

/**
 * Create a new timetable entry for the user.
 */
export async function createTimetableEntryRecord(
  userId: string,
  data: TimetableFormValues
): Promise<TimetableEntry> {
  return await prisma.timetableEntry.create({
    data: {
      userId,
      courseId: data.courseId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || "",
      type: data.type || "Lecture",
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
 * Update an existing timetable entry, scoped strictly by id AND userId.
 */
export async function updateTimetableEntryRecord(
  entryId: string,
  userId: string,
  data: TimetableFormValues
): Promise<TimetableEntry> {
  // Verify ownership before update
  const existing = await prisma.timetableEntry.findFirst({
    where: {
      id: entryId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Timetable entry not found or unauthorized.");
  }

  return await prisma.timetableEntry.update({
    where: {
      id: entryId,
    },
    data: {
      courseId: data.courseId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || "",
      type: data.type || "Lecture",
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
 * Delete a timetable entry, scoped strictly by id AND userId.
 */
export async function deleteTimetableEntryRecord(
  entryId: string,
  userId: string
): Promise<void> {
  const existing = await prisma.timetableEntry.findFirst({
    where: {
      id: entryId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Timetable entry not found or unauthorized.");
  }

  await prisma.timetableEntry.delete({
    where: {
      id: entryId,
    },
  });
}
