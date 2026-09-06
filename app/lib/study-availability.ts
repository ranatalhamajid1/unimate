import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getPKTDateParts, getPKTDayBounds } from "@/app/lib/timezone";

export type TimeWindow = {
  startTime: string; // "HH:MM" e.g. "09:00"
  endTime: string; // "HH:MM" e.g. "11:30"
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  durationMinutes: number;
  label?: string;
};

export type AvailabilityOptions = {
  wakeTime?: string; // default "08:00"
  sleepTime?: string; // default "22:00"
  minBlockMinutes?: number; // default 30
};

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Detects open study windows for a given date by subtracting scheduled timetable classes
 * and existing study plan tasks from student waking hours (08:00 - 22:00 PKT).
 */
export async function getAvailableStudyWindows(
  userId: string,
  targetDate: Date = new Date(),
  options?: AvailabilityOptions
): Promise<{
  windows: TimeWindow[];
  totalAvailableMinutes: number;
  busyBlocks: TimeWindow[];
}> {
  const wakeTime = options?.wakeTime || "08:00";
  const sleepTime = options?.sleepTime || "22:00";
  const minBlock = options?.minBlockMinutes || 30;

  const wakeMinutes = parseTimeToMinutes(wakeTime);
  const sleepMinutes = parseTimeToMinutes(sleepTime);

  const pkt = getPKTDateParts(targetDate);
  const { start: dayStart, end: dayEnd } = getPKTDayBounds(targetDate);

  // Fetch timetable classes for this day of week + existing study plan items for this day
  const [timetableEntries, studyPlanItems] = await Promise.all([
    prisma.timetableEntry.findMany({
      where: { userId, dayOfWeek: pkt.dayOfWeek },
      select: { startTime: true, endTime: true, type: true, course: { select: { code: true } } },
    }),
    prisma.studyPlanItem.findMany({
      where: {
        studyPlan: { userId },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      select: { scheduledAt: true, duration: true, title: true },
    }),
  ]);

  // Collect busy intervals
  const busyIntervals: { start: number; end: number; label: string }[] = [];

  // Add timetable classes
  for (const entry of timetableEntries) {
    const s = parseTimeToMinutes(entry.startTime);
    const e = parseTimeToMinutes(entry.endTime);
    if (e > s) {
      busyIntervals.push({
        start: s,
        end: e,
        label: `${entry.course?.code || "Class"} (${entry.type})`,
      });
    }
  }

  // Add existing study plan items
  for (const item of studyPlanItems) {
    const itemPkt = getPKTDateParts(item.scheduledAt);
    const s = itemPkt.hours * 60 + itemPkt.minutes;
    const e = s + item.duration;
    busyIntervals.push({
      start: s,
      end: e,
      label: `Study: ${item.title}`,
    });
  }

  // Sort busy intervals by start time
  busyIntervals.sort((a, b) => a.start - b.start);

  // Merge overlapping or contiguous busy intervals
  const mergedBusy: { start: number; end: number; label: string }[] = [];
  for (const interval of busyIntervals) {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ ...interval });
    } else {
      const prev = mergedBusy[mergedBusy.length - 1];
      if (interval.start <= prev.end) {
        prev.end = Math.max(prev.end, interval.end);
        prev.label += `, ${interval.label}`;
      } else {
        mergedBusy.push({ ...interval });
      }
    }
  }

  // Find free gaps between wakeMinutes and sleepMinutes
  const freeWindows: TimeWindow[] = [];
  let currentPointer = wakeMinutes;

  for (const busy of mergedBusy) {
    // Only consider busy intervals within waking hours
    const bStart = Math.max(wakeMinutes, busy.start);
    const bEnd = Math.min(sleepMinutes, busy.end);

    if (bStart > currentPointer) {
      const gap = bStart - currentPointer;
      if (gap >= minBlock) {
        freeWindows.push({
          startTime: minutesToTimeString(currentPointer),
          endTime: minutesToTimeString(bStart),
          startMinutes: currentPointer,
          endMinutes: bStart,
          durationMinutes: gap,
        });
      }
    }
    currentPointer = Math.max(currentPointer, bEnd);
  }

  // Check gap after last busy block until sleep
  if (currentPointer < sleepMinutes) {
    const gap = sleepMinutes - currentPointer;
    if (gap >= minBlock) {
      freeWindows.push({
        startTime: minutesToTimeString(currentPointer),
        endTime: minutesToTimeString(sleepMinutes),
        startMinutes: currentPointer,
        endMinutes: sleepMinutes,
        durationMinutes: gap,
      });
    }
  }

  const totalAvailableMinutes = freeWindows.reduce((acc, w) => acc + w.durationMinutes, 0);

  const busyBlocks: TimeWindow[] = mergedBusy.map((b) => ({
    startTime: minutesToTimeString(b.start),
    endTime: minutesToTimeString(b.end),
    startMinutes: b.start,
    endMinutes: b.end,
    durationMinutes: b.end - b.start,
    label: b.label,
  }));

  return {
    windows: freeWindows,
    totalAvailableMinutes,
    busyBlocks,
  };
}
