import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  getPKTDateParts,
  getPKTMonthBounds,
  formatPKTTime,
  PKT_OFFSET_MS,
} from "@/app/lib/timezone";
import { formatExamTime } from "@/app/lib/exam-definitions";

export type CalendarEventType = "CLASS" | "ASSIGNMENT" | "EXAM" | "STUDY";

export type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  dateKey: string; // "YYYY-MM-DD" in PKT
  timeStr: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  eventType: CalendarEventType;
  actionUrl: string;
  status?: string;
};

export type MonthCalendarData = {
  year: number;
  month: number; // 0-indexed
  monthLabel: string;
  events: CalendarEvent[];
  eventsByDate: Record<string, CalendarEvent[]>;
};

/**
 * Generates unified academic calendar events for a given month in Asia/Karachi.
 * Strictly combines Classes, Assignments, Exams, and Study sessions.
 * Never includes expenses or financial data.
 */
export async function getMonthCalendarEvents(
  userId: string,
  referenceDate: Date = new Date()
): Promise<MonthCalendarData> {
  const pkt = getPKTDateParts(referenceDate);
  const { start: monthStartUtc, end: monthEndUtc } = getPKTMonthBounds(referenceDate);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthLabel = `${monthNames[pkt.month]} ${pkt.year}`;

  // Parallel query of all 4 academic sources for this month
  const [timetableEntries, assignments, exams, studySessions, studyPlanItems] =
    await Promise.all([
      // Timetable entries repeat weekly
      prisma.timetableEntry.findMany({
        where: { userId },
        include: { course: { select: { name: true, code: true, color: true } } },
      }),
      // Assignments due this month
      prisma.assignment.findMany({
        where: {
          userId,
          dueDate: { gte: monthStartUtc, lte: monthEndUtc },
        },
        include: { course: { select: { name: true, code: true, color: true } } },
      }),
      // Exams this month
      prisma.exam.findMany({
        where: {
          userId,
          examDate: { gte: monthStartUtc, lte: monthEndUtc },
        },
        include: { course: { select: { name: true, code: true, color: true } } },
      }),
      // Completed Study Sessions this month
      prisma.studySession.findMany({
        where: {
          userId,
          sessionDate: { gte: monthStartUtc, lte: monthEndUtc },
        },
        include: { course: { select: { name: true, code: true, color: true } } },
      }),
      // Scheduled Study Plan Items this month
      prisma.studyPlanItem.findMany({
        where: {
          studyPlan: { userId },
          scheduledAt: { gte: monthStartUtc, lte: monthEndUtc },
        },
        include: { course: { select: { name: true, code: true, color: true } } },
      }),
    ]);

  const events: CalendarEvent[] = [];

  // 1. Map timetable entries to all matching calendar days in this month
  // Find total days in current month in PKT
  const daysInMonth = new Date(Date.UTC(pkt.year, pkt.month + 1, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth; day++) {
    // Determine dayOfWeek for this calendar day in PKT (1=Mon..7=Sun)
    const dayUtcMs = Date.UTC(pkt.year, pkt.month, day, 12, 0, 0, 0) - PKT_OFFSET_MS;
    const dayDate = new Date(dayUtcMs);
    const dayPkt = getPKTDateParts(dayDate);
    const dateKey = `${pkt.year}-${String(pkt.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    for (const entry of timetableEntries) {
      if (entry.dayOfWeek === dayPkt.dayOfWeek) {
        events.push({
          id: `class-${entry.id}-${dateKey}`,
          title: `${entry.course?.code || "Class"}: ${entry.course?.name || entry.type}`,
          date: dayDate,
          dateKey,
          timeStr: `${entry.startTime} - ${entry.endTime}`,
          courseName: entry.course?.name || "Class",
          courseCode: entry.course?.code || "GEN",
          courseColor: entry.course?.color || "#2563eb",
          eventType: "CLASS",
          actionUrl: "/dashboard/timetable",
        });
      }
    }
  }

  // 2. Map Assignments
  for (const asgn of assignments) {
    const asgnPkt = getPKTDateParts(asgn.dueDate);
    events.push({
      id: `asgn-${asgn.id}`,
      title: `Due: ${asgn.title}`,
      date: asgn.dueDate,
      dateKey: asgnPkt.dateString,
      timeStr: formatPKTTime(asgn.dueDate),
      courseName: asgn.course?.name || "Assignment",
      courseCode: asgn.course?.code || "ASGN",
      courseColor: asgn.course?.color || "#ea580c",
      eventType: "ASSIGNMENT",
      actionUrl: "/dashboard/assignments",
      status: asgn.status,
    });
  }

  // 3. Map Exams
  for (const exam of exams) {
    const examPkt = getPKTDateParts(exam.examDate);
    events.push({
      id: `exam-${exam.id}`,
      title: `Exam: ${exam.title}`,
      date: exam.examDate,
      dateKey: examPkt.dateString,
      timeStr: formatExamTime(exam.examDate),
      courseName: exam.course?.name || "Exam",
      courseCode: exam.course?.code || "EXAM",
      courseColor: exam.course?.color || "#7c3aed",
      eventType: "EXAM",
      actionUrl: "/dashboard/exams",
      status: exam.status,
    });
  }

  // 4. Map Study Sessions
  for (const session of studySessions) {
    const sessionPkt = getPKTDateParts(session.sessionDate);
    events.push({
      id: `study-${session.id}`,
      title: `Studied: ${session.title}`,
      date: session.sessionDate,
      dateKey: sessionPkt.dateString,
      timeStr: `${session.duration}m`,
      courseName: session.course?.name || "Self Study",
      courseCode: session.course?.code || "STUDY",
      courseColor: session.course?.color || "#059669",
      eventType: "STUDY",
      actionUrl: "/dashboard/study",
    });
  }

  // 5. Map Study Plan Items
  for (const item of studyPlanItems) {
    const itemPkt = getPKTDateParts(item.scheduledAt);
    events.push({
      id: `plan-item-${item.id}`,
      title: `Plan: ${item.title}`,
      date: item.scheduledAt,
      dateKey: itemPkt.dateString,
      timeStr: formatPKTTime(item.scheduledAt),
      courseName: item.course?.name || "Study Plan",
      courseCode: item.course?.code || "PLAN",
      courseColor: item.course?.color || "#9333ea",
      eventType: "STUDY",
      actionUrl: "/dashboard/study-plan",
      status: item.completed ? "COMPLETED" : "PENDING",
    });
  }

  // Group events by dateKey
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!eventsByDate[ev.dateKey]) {
      eventsByDate[ev.dateKey] = [];
    }
    eventsByDate[ev.dateKey].push(ev);
  }

  return {
    year: pkt.year,
    month: pkt.month,
    monthLabel,
    events,
    eventsByDate,
  };
}
