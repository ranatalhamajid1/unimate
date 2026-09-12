import "server-only";

import { prisma } from "@/app/lib/prisma";

export type ScheduleGap = {
  startTime: string; // "11:30"
  endTime: string;   // "13:00"
  durationMinutes: number;
  label: string;
  suggestedAction: string;
};

export type TimetableSlotInput = {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  courseName?: string;
  type?: string;
};

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Pure calculation to detect available study gaps (>= 45 mins) in a day's timetable.
 */
export function detectScheduleGaps(
  slots: TimetableSlotInput[],
  dayStartMinutes: number = 8 * 60, // 08:00
  dayEndMinutes: number = 20 * 60,  // 20:00
  minGapMinutes: number = 45
): ScheduleGap[] {
  if (slots.length === 0) {
    return [
      {
        startTime: formatMinutes(dayStartMinutes),
        endTime: formatMinutes(dayEndMinutes),
        durationMinutes: dayEndMinutes - dayStartMinutes,
        label: "Open day with no scheduled classes",
        suggestedAction: "Full day open. Ideal for deep work on major assignments or exam revision.",
      },
    ];
  }

  // Sort slots by start time
  const sorted = [...slots].sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));

  const gaps: ScheduleGap[] = [];
  let currentPointer = dayStartMinutes;

  for (const slot of sorted) {
    const slotStart = parseMinutes(slot.startTime);
    const slotEnd = parseMinutes(slot.endTime);

    if (slotStart > currentPointer) {
      const gapDuration = slotStart - currentPointer;
      if (gapDuration >= minGapMinutes) {
        gaps.push({
          startTime: formatMinutes(currentPointer),
          endTime: formatMinutes(slotStart),
          durationMinutes: gapDuration,
          label: `${gapDuration}-minute study window`,
          suggestedAction: `Study block between classes (${formatMinutes(currentPointer)} - ${formatMinutes(slotStart)}).`,
        });
      }
    }

    if (slotEnd > currentPointer) {
      currentPointer = slotEnd;
    }
  }

  // Check gap after last class until dayEnd
  if (currentPointer < dayEndMinutes) {
    const afterDuration = dayEndMinutes - currentPointer;
    if (afterDuration >= minGapMinutes) {
      gaps.push({
        startTime: formatMinutes(currentPointer),
        endTime: formatMinutes(dayEndMinutes),
        durationMinutes: afterDuration,
        label: `${afterDuration}-minute evening study window`,
        suggestedAction: `Evening focus time after classes finish (${formatMinutes(currentPointer)} - ${formatMinutes(dayEndMinutes)}).`,
      });
    }
  }

  return gaps;
}

/**
 * Loads today's timetable entries and finds available study gaps.
 */
export async function getStudentTodayScheduleGaps(
  userId: string,
  now: Date = new Date()
): Promise<ScheduleGap[]> {
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  const entries = await prisma.timetableEntry.findMany({
    where: {
      userId,
      dayOfWeek,
    },
    include: {
      course: {
        select: { name: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const slots: TimetableSlotInput[] = entries.map((e) => ({
    startTime: e.startTime,
    endTime: e.endTime,
    courseName: e.course.name,
    type: e.type,
  }));

  return detectScheduleGaps(slots);
}
