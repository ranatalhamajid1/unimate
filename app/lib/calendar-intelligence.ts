import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  getPKTDateParts,
  getPKTDayBounds,
  getPKTWeekBounds,
  formatPKTTime,
  PKT_OFFSET_MS,
} from "@/app/lib/timezone";
import { getAvailableStudyWindows, TimeWindow } from "@/app/lib/study-availability";
import { calculateTaskUrgency, RawTaskInput } from "@/app/lib/intelligence/priority-engine";
import { calculateExamReadiness } from "@/app/lib/intelligence/exam-readiness";
import { getGoogleCalendarStatus } from "@/app/lib/integrations/google-calendar";

export type DayWorkloadTier = "LIGHT" | "BALANCED" | "BUSY" | "OVERLOADED";

export interface CalendarDayWorkload {
  dateKey: string; // YYYY-MM-DD in PKT
  dayOfWeek: number; // 1 = Mon ... 7 = Sun
  dayLabel: string; // e.g. "Monday, Sep 15"
  isToday: boolean;
  tier: DayWorkloadTier;
  classCount: number;
  classMinutes: number;
  deadlinesCount: number;
  examsCount: number;
  studyPlanMinutes: number;
  availableGapMinutes: number;
  reason: string;
}

export interface DeadlineCluster {
  id: string;
  startDateKey: string;
  endDateKey: string;
  label: string;
  severity: "MODERATE" | "HIGH" | "CRITICAL";
  affectedCourses: Array<{ id: string; code: string; name: string; color: string }>;
  itemCount: number;
  totalEstimatedMinutes: number;
  reason: string;
  recommendedAction: string;
}

export interface RecommendedStudyWindow {
  id: string;
  dateKey: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  durationMinutes: number;
  label: string;
  suggestedFocus: {
    targetType: "ASSIGNMENT" | "EXAM" | "GENERAL";
    targetId: string | null;
    title: string;
    courseCode?: string;
    courseName?: string;
    courseColor?: string;
    urgencyTier?: string;
  };
  disclaimer: string;
}

export interface CalendarIntelligenceData {
  timestamp: string;
  referenceDateKey: string;
  horizonDays: number;
  weekWorkload: {
    overallTier: DayWorkloadTier;
    totalClassMinutes: number;
    totalDeadlines: number;
    totalExams: number;
    totalStudyPlanMinutes: number;
    totalAvailableGapMinutes: number;
    summary: string;
  };
  dailyWorkloads: CalendarDayWorkload[];
  deadlineClusters: DeadlineCluster[];
  recommendedStudyWindows: RecommendedStudyWindow[];
  googleCalendar: {
    connected: boolean;
    status: string;
    email: string | null;
    lastSyncAt: string | null;
  };
}

/**
 * Computes deterministic calendar intelligence from verified UniMate academic data.
 * Does NOT ingest arbitrary personal Google events (outward-only sync model).
 */
export async function getCalendarIntelligence(
  userId: string,
  optionsOrDate?:
    | {
        referenceDate?: Date;
        horizonDays?: 7 | 14;
        isPro?: boolean;
      }
    | Date
): Promise<CalendarIntelligenceData> {
  const options = optionsOrDate instanceof Date ? { referenceDate: optionsOrDate } : optionsOrDate;
  const now = options?.referenceDate || new Date();
  const requestedDays = options?.horizonDays === 14 ? 14 : 7;
  const isPro = options?.isPro ?? false;
  const horizonDays = requestedDays === 14 && isPro ? 14 : 7;

  const { start: horizonStartUtc } = getPKTDayBounds(now);
  const horizonEndUtc = new Date(horizonStartUtc.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  // 1. Parallel fetch of all academic scheduling records
  const [
    timetableEntries,
    assignments,
    exams,
    studyPlanItems,
    googleStatus,
  ] = await Promise.all([
    // All weekly repeating timetable classes
    prisma.timetableEntry.findMany({
      where: { userId },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
    }),
    // Assignments due within the horizon
    prisma.assignment.findMany({
      where: {
        userId,
        dueDate: { gte: horizonStartUtc, lte: horizonEndUtc },
        status: { notIn: ["COMPLETED", "SUBMITTED"] },
      },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
      orderBy: { dueDate: "asc" },
      take: 40,
    }),
    // Exams within the horizon + 7 days
    prisma.exam.findMany({
      where: {
        userId,
        status: "UPCOMING",
        examDate: { gte: horizonStartUtc, lte: new Date(horizonEndUtc.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
      orderBy: { examDate: "asc" },
      take: 20,
    }),
    // Scheduled study plan items within the horizon
    prisma.studyPlanItem.findMany({
      where: {
        studyPlan: { userId },
        scheduledAt: { gte: horizonStartUtc, lte: horizonEndUtc },
      },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
      take: 50,
    }),
    // Outward Google Calendar integration status
    getGoogleCalendarStatus(userId).catch(() => ({
      connected: false,
      status: "DISCONNECTED" as const,
      email: null,
      calendarId: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastError: null,
    })),
  ]);

  const nowPkt = getPKTDateParts(now);

  // 2. Generate daily timeline metrics & workload classification
  const dailyWorkloads: CalendarDayWorkload[] = [];
  const recommendedStudyWindows: RecommendedStudyWindow[] = [];

  let totalWeekClassMinutes = 0;
  let totalWeekDeadlines = 0;
  let totalWeekExams = 0;
  let totalWeekStudyMinutes = 0;
  let totalWeekAvailableGapMinutes = 0;

  for (let dayIdx = 0; dayIdx < horizonDays; dayIdx++) {
    const currentDayDate = new Date(horizonStartUtc.getTime() + dayIdx * 24 * 60 * 60 * 1000 + 12 * 3600 * 1000);
    const dayPkt = getPKTDateParts(currentDayDate);
    const { start: dayStartUtc, end: dayEndUtc } = getPKTDayBounds(currentDayDate);

    // Filter classes matching day of week
    const dayClasses = timetableEntries.filter((t) => t.dayOfWeek === dayPkt.dayOfWeek);
    let dayClassMinutes = 0;
    for (const c of dayClasses) {
      const [sh, sm] = c.startTime.split(":").map(Number);
      const [eh, em] = c.endTime.split(":").map(Number);
      const dur = (eh * 60 + em) - (sh * 60 + sm);
      if (dur > 0) dayClassMinutes += dur;
    }

    // Filter assignments due on this day
    const dayAssignments = assignments.filter((a) => {
      const aPkt = getPKTDateParts(a.dueDate);
      return aPkt.dateString === dayPkt.dateString;
    });

    // Filter exams on this day
    const dayExams = exams.filter((e) => {
      const ePkt = getPKTDateParts(e.examDate);
      return ePkt.dateString === dayPkt.dateString;
    });

    // Filter study plan items on this day
    const dayStudyItems = studyPlanItems.filter((i) => {
      const iPkt = getPKTDateParts(i.scheduledAt);
      return iPkt.dateString === dayPkt.dateString;
    });
    const dayStudyMinutes = dayStudyItems.reduce((sum, it) => sum + it.duration, 0);

    // Compute timetable gaps for this day (bounded 08:00 - 22:00 PKT)
    const gapData = await getAvailableStudyWindows(userId, currentDayDate);
    const dayGapMinutes = gapData.totalAvailableMinutes;

    totalWeekClassMinutes += dayClassMinutes;
    totalWeekDeadlines += dayAssignments.length;
    totalWeekExams += dayExams.length;
    totalWeekStudyMinutes += dayStudyMinutes;
    totalWeekAvailableGapMinutes += dayGapMinutes;

    // Workload scoring logic based on total commitment hours (classes + study plans + deliverables)
    const totalCommitmentMinutes = dayClassMinutes + dayStudyMinutes + (dayAssignments.length * 45) + (dayExams.length * 90);
    const totalCommitmentHours = totalCommitmentMinutes / 60;

    let tier: DayWorkloadTier = "BALANCED";
    let reason = "Standard academic schedule with manageable commitments.";

    if (totalCommitmentHours > 7 || (dayExams.length > 0 && (dayAssignments.length > 0 || dayClassMinutes >= 180))) {
      tier = "OVERLOADED";
      reason = `Heavy day: ${totalCommitmentHours.toFixed(1)}h of academic commitments (${dayClasses.length} classes, ${dayAssignments.length} deadlines, ${dayExams.length} exams).`;
    } else if (totalCommitmentHours >= 5 || dayExams.length > 0 || (dayAssignments.length >= 2 && dayClassMinutes >= 120)) {
      tier = "BUSY";
      reason = dayExams.length > 0
        ? `Upcoming exam day: Requires protected revision time around classes.`
        : `Active schedule with ${totalCommitmentHours.toFixed(1)}h of commitments (${dayClasses.length} classes, ${dayAssignments.length} deadlines).`;
    } else if (totalCommitmentHours >= 3 || dayAssignments.length >= 1) {
      tier = "BALANCED";
      reason = `Balanced schedule: ${totalCommitmentHours.toFixed(1)}h of commitments with open windows for study and assignments.`;
    } else {
      tier = "LIGHT";
      reason = dayClasses.length === 0
        ? "No scheduled classes or imminent deadlines. Ideal for self-paced study or rest."
        : "Light academic schedule with plenty of open study availability.";
    }

    const dayName = new Date(dayPkt.dateString + "T12:00:00Z").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    dailyWorkloads.push({
      dateKey: dayPkt.dateString,
      dayOfWeek: dayPkt.dayOfWeek,
      dayLabel: dayName,
      isToday: dayPkt.dateString === nowPkt.dateString,
      tier,
      classCount: dayClasses.length,
      classMinutes: dayClassMinutes,
      deadlinesCount: dayAssignments.length,
      examsCount: dayExams.length,
      studyPlanMinutes: dayStudyMinutes,
      availableGapMinutes: dayGapMinutes,
      reason,
    });

    // Extract Recommended Study Windows from open gaps
    for (const win of gapData.windows) {
      if (win.durationMinutes < 30) continue;

      // Check for target to recommend focusing on
      // Prefer nearest upcoming unfinished assignment or upcoming exam
      let suggestedFocus: RecommendedStudyWindow["suggestedFocus"] = {
        targetType: "GENERAL",
        targetId: null,
        title: "Independent Review & Coursework",
      };

      // Prioritize assignments due soon
      const pendingAsgn = assignments.find((a) => a.status !== "COMPLETED");
      const pendingExam = exams.find((e) => e.status === "UPCOMING");

      if (pendingAsgn) {
        suggestedFocus = {
          targetType: "ASSIGNMENT",
          targetId: pendingAsgn.id,
          title: pendingAsgn.title,
          courseCode: pendingAsgn.course?.code,
          courseName: pendingAsgn.course?.name,
          courseColor: pendingAsgn.course?.color,
          urgencyTier: pendingAsgn.priority,
        };
      } else if (pendingExam) {
        suggestedFocus = {
          targetType: "EXAM",
          targetId: pendingExam.id,
          title: `${pendingExam.title} Revision`,
          courseCode: pendingExam.course?.code,
          courseName: pendingExam.course?.name,
          courseColor: pendingExam.course?.color,
          urgencyTier: "HIGH",
        };
      }

      recommendedStudyWindows.push({
        id: `window-${dayPkt.dateString}-${win.startTime.replace(":", "")}`,
        dateKey: dayPkt.dateString,
        startTime: win.startTime,
        endTime: win.endTime,
        durationMinutes: win.durationMinutes,
        label: `${win.startTime} – ${win.endTime} (${win.durationMinutes}m)`,
        suggestedFocus,
        disclaimer: "Suggested study window — Based on your UniMate academic schedule",
      });

      // Limit to at most 2 recommended windows per day to prevent UI overwhelm
      if (recommendedStudyWindows.filter((w) => w.dateKey === dayPkt.dateString).length >= 2) {
        break;
      }
    }
  }

  // 3. Detect Deadline & Exam Clusters
  const deadlineClusters: DeadlineCluster[] = [];

  // Group deliverables by 48-hour sliding windows
  const deliverables = [
    ...assignments.map((a) => ({
      type: "ASSIGNMENT" as const,
      id: a.id,
      title: a.title,
      date: new Date(a.dueDate || (a as any).date),
      course: a.course,
      weight: a.priority === "HIGH" ? 90 : a.priority === "MEDIUM" ? 60 : 30,
    })),
    ...exams.map((e) => ({
      type: "EXAM" as const,
      id: e.id,
      title: e.title,
      date: new Date((e as any).examDate || (e as any).date),
      course: e.course,
      weight: 120,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (let i = 0; i < deliverables.length; i++) {
    const clusterItems = [deliverables[i]];
    const startMs = deliverables[i].date.getTime();

    for (let j = i + 1; j < deliverables.length; j++) {
      if (deliverables[j].date.getTime() - startMs <= 48 * 60 * 60 * 1000) {
        clusterItems.push(deliverables[j]);
      } else {
        break;
      }
    }

    if (clusterItems.length >= 2) {
      const firstDatePkt = getPKTDateParts(clusterItems[0].date);
      const lastDatePkt = getPKTDateParts(clusterItems[clusterItems.length - 1].date);
      const clusterCoursesMap = new Map<string, any>();
      for (const it of clusterItems) {
        if (it.course) clusterCoursesMap.set(it.course.id, it.course);
      }

      const totalEstimatedMinutes = clusterItems.reduce((sum, c) => sum + c.weight, 0);
      const clusterId = `cluster-${firstDatePkt.dateString}-${clusterItems.length}`;
      const hasExam = clusterItems.some((it) => it.type === "EXAM");
      const severity: "MODERATE" | "HIGH" | "CRITICAL" = hasExam
        ? "CRITICAL"
        : totalEstimatedMinutes >= 180 || clusterItems.length >= 3
        ? "HIGH"
        : "MODERATE";

      // Avoid duplicate sub-clusters
      if (!deadlineClusters.some((c) => c.startDateKey === firstDatePkt.dateString && c.itemCount === clusterItems.length)) {
        deadlineClusters.push({
          id: clusterId,
          startDateKey: firstDatePkt.dateString,
          endDateKey: lastDatePkt.dateString,
          label: `${clusterItems.length} Deadlines within 48 Hours`,
          severity,
          affectedCourses: Array.from(clusterCoursesMap.values()),
          itemCount: clusterItems.length,
          totalEstimatedMinutes,
          reason: `High academic pressure between ${firstDatePkt.dateString} and ${lastDatePkt.dateString}.`,
          recommendedAction: "Begin preparation early by distributing focus sessions across open timetable gaps preceding this window.",
        });
      }

      // Skip forward to avoid identical overlapping cluster
      i += clusterItems.length - 1;
    }
  }

  // 4. Overall Week Assessment
  const overloadedCount = dailyWorkloads.filter((d) => d.tier === "OVERLOADED").length;
  const busyCount = dailyWorkloads.filter((d) => d.tier === "BUSY").length;

  let overallTier: DayWorkloadTier = "BALANCED";
  let summary = "Balanced academic week with sustainable class density and study capacity.";

  if (overloadedCount >= 2 || (overloadedCount >= 1 && busyCount >= 2)) {
    overallTier = "OVERLOADED";
    summary = `Critical load: ${overloadedCount} overloaded days and ${deadlineClusters.length} deadline clusters require strategic pacing.`;
  } else if (overloadedCount === 1 || busyCount >= 2) {
    overallTier = "BUSY";
    summary = `Demanding week: Notable activity peaks around scheduled assignments and classes.`;
  } else if (dailyWorkloads.every((d) => d.tier === "LIGHT")) {
    overallTier = "LIGHT";
    summary = "Low scheduled academic commitments. Ideal for advance prep or rest.";
  }

  return {
    timestamp: new Date().toISOString(),
    referenceDateKey: nowPkt.dateString,
    horizonDays,
    weekWorkload: {
      overallTier,
      totalClassMinutes: totalWeekClassMinutes,
      totalDeadlines: totalWeekDeadlines,
      totalExams: totalWeekExams,
      totalStudyPlanMinutes: totalWeekStudyMinutes,
      totalAvailableGapMinutes: totalWeekAvailableGapMinutes,
      summary,
    },
    dailyWorkloads,
    deadlineClusters,
    recommendedStudyWindows: recommendedStudyWindows.slice(0, 10), // Bound size
    googleCalendar: {
      connected: Boolean(googleStatus.connected),
      status: String(googleStatus.status || "DISCONNECTED"),
      email: googleStatus.email || null,
      lastSyncAt: googleStatus.lastSyncAt ? new Date(googleStatus.lastSyncAt).toISOString() : null,
    },
  };
}
