import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getPKTDateParts, getPKTDayBounds } from "@/app/lib/timezone";
import {
  calculateTaskUrgency,
  PriorityUrgencyTier,
  RawTaskInput,
} from "@/app/lib/intelligence/priority-engine";
import {
  calculateAttendanceInsight,
  AttendanceRiskStatus,
} from "@/app/lib/intelligence/attendance-intel";
import {
  calculateExamReadiness,
  ExamReadinessStatus,
} from "@/app/lib/intelligence/exam-readiness";
import {
  detectScheduleGaps,
  ScheduleGap,
  TimetableSlotInput,
} from "@/app/lib/intelligence/schedule-gaps";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type UrgencyTier = PriorityUrgencyTier;

export interface TodayActionItem {
  id: string;
  entityType: "ASSIGNMENT" | "EXAM" | "STUDY_PLAN_ITEM" | "ATTENDANCE_RECOVERY";
  title: string;
  courseId?: string;
  courseCode: string;
  courseName: string;
  courseColor: string;
  urgencyScore: number; // 0–100 from priority-engine.ts
  urgencyTier: UrgencyTier;
  deadlineLabel: string;
  dueDateStr?: string;
  estimatedMinutes: number; // Heuristic or StudyPlanItem duration
  estimatedLabel: string;   // e.g. "~60 min estimated"
  reason: string;           // Explainable deterministic justification
  actionLabel: string;      // e.g. "View Assignment", "View Exam"
  actionHref: string;       // Existing valid route
  isAttentionItem: boolean; // Indicates urgent risk linkage
  completed: boolean;
  deferredReason?: string;
}

export interface TodayTimelineSlot {
  id: string;
  type: "CLASS" | "STUDY_GAP";
  title: string;
  subtitle?: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  durationMinutes: number;
  room?: string;
  color?: string;
  hasConflict?: boolean;
  suggestedAction?: string;
}

export interface CompletedTodayItem {
  id: string;
  title: string;
  courseCode: string;
  completedAtStr: string;
}

export interface AdaptiveTodayWorkspaceData {
  timestamp: string;
  dateString: string;
  dayName: string;
  capacity: {
    availableStudyMinutes: number;
    allocatedWorkMinutes: number;
    isOverCapacity: boolean;
    notice: string;
  };
  attention: {
    items: TodayActionItem[];
    criticalCount: number;
    attendanceWarning: {
      courseId: string;
      courseCode: string;
      courseName: string;
      percentageString: string;
      thresholdPercentage: number;
      recoveryClassesRequired: number;
      recommendation: string;
    } | null;
    timetableConflictCount: number;
  };
  today: {
    schedule: TodayTimelineSlot[];
    allocatedTasks: TodayActionItem[];
  };
  next: TodayActionItem[];
  later: TodayActionItem[];
  completedToday: {
    items: CompletedTodayItem[];
    count: number;
  };
  calendarSync: {
    status: "CONNECTED" | "NEEDS_REAUTH" | "DISCONNECTED" | "NOT_CONFIGURED";
    lastSyncAt: string | null;
    accountEmail: string | null;
  };
  emptyState: {
    isNewStudent: boolean;
    missingSections: ("COURSES" | "TIMETABLE" | "ASSIGNMENTS" | "EXAMS")[];
    hasNoClassesToday: boolean;
    isAllCaughtUp: boolean;
  };
}

// ---------------------------------------------------------------------------
// Effort Estimation Heuristics
// ---------------------------------------------------------------------------

export function getHeuristicTaskDuration(priority: string, planItemDuration?: number | null): {
  minutes: number;
  label: string;
} {
  if (typeof planItemDuration === "number" && planItemDuration > 0) {
    return {
      minutes: planItemDuration,
      label: `~${planItemDuration} min planned`,
    };
  }

  switch (priority) {
    case "HIGH":
      return { minutes: 90, label: "~90 min estimated" };
    case "MEDIUM":
      return { minutes: 60, label: "~60 min estimated" };
    case "LOW":
    default:
      return { minutes: 45, label: "~45 min estimated" };
  }
}

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// ---------------------------------------------------------------------------
// Canonical Service Function
// ---------------------------------------------------------------------------

export async function getAdaptiveTodayWorkspace(
  userId: string,
  now: Date = new Date()
): Promise<AdaptiveTodayWorkspaceData> {
  const pkt = getPKTDateParts(now);
  const { start: dayStart, end: dayEnd } = getPKTDayBounds(now);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const next60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[pkt.dayOfWeek === 7 ? 0 : pkt.dayOfWeek];

  // 1. Bounded parallel database queries with strict userId scoping (No N+1 pattern)
  const [
    courses,
    timetableEntries,
    uncompletedAssignments,
    overdueAssignments,
    completedTodayAssignments,
    upcomingExams,
    todayStudyPlanItems,
    attendanceRecords,
    activeGoals,
    calendarIntegration,
  ] = await Promise.all([
    // Courses
    prisma.course.findMany({
      where: { userId },
      select: { id: true, name: true, code: true, color: true },
    }),

    // Today's Timetable classes
    prisma.timetableEntry.findMany({
      where: { userId, dayOfWeek: pkt.dayOfWeek },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
      orderBy: { startTime: "asc" },
      take: 20,
    }),

    // Uncompleted assignments due in next 30 days
    prisma.assignment.findMany({
      where: {
        userId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: { gte: now, lte: next30Days },
      },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),

    // Overdue uncompleted assignments (regardless of how far past due)
    prisma.assignment.findMany({
      where: {
        userId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),

    // Assignments completed today (PKT day bounds)
    prisma.assignment.findMany({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),

    // Upcoming exams within 60 days
    prisma.exam.findMany({
      where: {
        userId,
        status: "UPCOMING",
        examDate: { gte: now, lte: next60Days },
      },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
      orderBy: { examDate: "asc" },
      take: 20,
    }),

    // Active study plan tasks scheduled for today
    prisma.studyPlanItem.findMany({
      where: {
        studyPlan: { userId, status: "ACTIVE" },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),

    // Attendance records
    prisma.attendance.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
    }),

    // Active goals
    prisma.studentGoal.findMany({
      where: { userId, active: true },
      take: 10,
    }),

    // Google Calendar integration status (Outward sync metadata from M14.2)
    prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "GOOGLE_CALENDAR",
        },
      },
      select: {
        status: true,
        lastSyncAt: true,
        externalAccountEmail: true,
      },
    }),
  ]);

  // 1b. Cumulative focus reconciliation — parallel, non-blocking.
  // Fetch all completed focus sessions explicitly linked to an ASSIGNMENT target.
  // These are used to deduct already-logged focus minutes from heuristic estimates.
  // Only ASSIGNMENT-targeted sessions are included: GENERAL/COURSE_STUDY/null sessions
  // are intentionally excluded to prevent cross-target attribution.
  const focusSessionsByTarget = await prisma.studySession.findMany({
    where: {
      userId,
      completed: true,          // Excludes CANCELLED (completed=false), ACTIVE, PAUSED
      targetType: "ASSIGNMENT",  // Only explicitly assignment-linked sessions
      targetId: { not: null },   // Safety: must have a targetId
    },
    select: { targetId: true, duration: true },
  });

  // Build O(1) lookup map: assignmentId -> total completed focus minutes logged
  const assignmentFocusMinutes = new Map<string, number>();
  for (const s of focusSessionsByTarget) {
    if (s.targetId) {
      assignmentFocusMinutes.set(
        s.targetId,
        (assignmentFocusMinutes.get(s.targetId) ?? 0) + s.duration
      );
    }
  }

  // 2. Build course map and exam proximity map for canonical priority engine
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const examProximityMap = new Map<string, number>();
  for (const exam of upcomingExams) {
    if (!examProximityMap.has(exam.courseId)) {
      const diffMs = exam.examDate.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      examProximityMap.set(exam.courseId, days);
    }
  }

  // 3. De-duplicate assignments (merge overdue + upcoming)
  const assignmentMap = new Map<string, typeof uncompletedAssignments[0]>();
  for (const a of overdueAssignments) assignmentMap.set(a.id, a);
  for (const a of uncompletedAssignments) assignmentMap.set(a.id, a);
  const allAssignments = Array.from(assignmentMap.values());

  // Link StudyPlanItem durations if available
  const planItemDurationMap = new Map<string, number>();
  for (const pi of todayStudyPlanItems) {
    if (pi.courseId) {
      planItemDurationMap.set(pi.courseId, pi.duration);
    }
  }

  // 4. Transform all assignments via canonical priority-engine.ts
  const candidateAssignmentItems: TodayActionItem[] = allAssignments.map((a) => {
    const rawInput: RawTaskInput = {
      id: a.id,
      courseId: a.courseId,
      courseName: a.course.name,
      courseCode: a.course.code,
      title: a.title,
      dueDate: a.dueDate,
      priority: a.priority,
      status: a.status,
    };

    const nearestExamDays = examProximityMap.get(a.courseId) ?? null;
    const urgency = calculateTaskUrgency(rawInput, nearestExamDays, now);
    const plannedDuration = planItemDurationMap.get(a.courseId) ?? null;
    const baseEffort = getHeuristicTaskDuration(a.priority, plannedDuration);

    // Cumulative focus reconciliation: subtract already-logged focus minutes
    const alreadyLoggedMinutes = assignmentFocusMinutes.get(a.id) ?? 0;
    const residualMinutes = Math.max(5, baseEffort.minutes - alreadyLoggedMinutes);
    const effort = {
      minutes: residualMinutes,
      label:
        alreadyLoggedMinutes > 0
          ? `~${residualMinutes} min remaining (${alreadyLoggedMinutes} min logged)`
          : baseEffort.label,
    };

    const isUrgent = urgency.urgencyTier === "OVERDUE" || urgency.urgencyTier === "CRITICAL";

    return {
      id: a.id,
      entityType: "ASSIGNMENT",
      title: a.title,
      courseId: a.courseId,
      courseCode: a.course.code,
      courseName: a.course.name,
      courseColor: a.course.color || "#2563eb",
      urgencyScore: urgency.urgencyScore,
      urgencyTier: urgency.urgencyTier,
      deadlineLabel: urgency.deadlineLabel,
      dueDateStr: a.dueDate.toISOString(),
      estimatedMinutes: effort.minutes,
      estimatedLabel: effort.label,
      reason: urgency.reason,
      actionLabel: "View Assignment",
      actionHref: "/dashboard/assignments",
      isAttentionItem: isUrgent,
      completed: false,
    };
  });

  // 5. Evaluate Exam Readiness via canonical exam-readiness.ts
  const examItems: TodayActionItem[] = [];
  for (const exam of upcomingExams) {
    const readiness = calculateExamReadiness(
      exam.examDate,
      exam.preparationProgress,
      exam.preparationProgress !== null && exam.preparationProgress > 0,
      now
    );

    const daysRemaining = readiness.daysRemaining;

    // Exam urgency score
    let score = 30;
    let tier: UrgencyTier = "NORMAL";
    if (daysRemaining <= 2) {
      score = 85;
      tier = "CRITICAL";
    } else if (daysRemaining <= 5) {
      score = 60;
      tier = "HIGH";
    } else if (daysRemaining <= 7) {
      score = 45;
      tier = "MEDIUM";
    }

    const focusHours = readiness.suggestedFocusHours ?? 1;
    const focusMins = Math.min(90, focusHours * 60);

    const isUrgent = daysRemaining <= 2 && readiness.status !== "ON TRACK";

    examItems.push({
      id: exam.id,
      entityType: "EXAM",
      title: `${exam.type}: ${exam.title}`,
      courseId: exam.courseId,
      courseCode: exam.course.code,
      courseName: exam.course.name,
      courseColor: exam.course.color || "#e11d48",
      urgencyScore: score,
      urgencyTier: tier,
      deadlineLabel: daysRemaining === 0 ? "Exam is today" : `Exam in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`,
      dueDateStr: exam.examDate.toISOString(),
      estimatedMinutes: focusMins,
      estimatedLabel: `~${focusMins} min review`,
      reason: readiness.recommendation,
      actionLabel: "View Exam",
      actionHref: "/dashboard/exams",
      isAttentionItem: isUrgent,
      completed: false,
    });
  }

  // 6. Evaluate Attendance Intelligence via canonical attendance-intel.ts
  let attendanceWarning: AdaptiveTodayWorkspaceData["attention"]["attendanceWarning"] = null;
  for (const att of attendanceRecords) {
    const insight = calculateAttendanceInsight(att.attendedClasses, att.totalClasses, 0.75);
    if (insight.status === "AT_RISK") {
      const course = courseMap.get(att.courseId) || (att as any).course;
      attendanceWarning = {
        courseId: att.courseId,
        courseCode: course?.code || "COURSE",
        courseName: course?.name || "Course",
        percentageString: insight.percentageString,
        thresholdPercentage: 75,
        recoveryClassesRequired: insight.recoveryClassesRequired,
        recommendation: insight.recommendation,
      };
      break; // Surface the most critical course
    }
  }

  // 7. Process Today's Timetable & Detect Schedule Gaps via canonical schedule-gaps.ts
  const timetableSlots: TimetableSlotInput[] = timetableEntries.map((t) => ({
    startTime: t.startTime,
    endTime: t.endTime,
    courseName: t.course.name,
    type: t.type,
  }));

  // Dynamic window expansion if classes start earlier than 08:00 or end later than 20:00
  let earliestMin = 8 * 60; // 08:00 default from schedule-gaps.ts
  let latestMin = 20 * 60;  // 20:00 default from schedule-gaps.ts

  let timetableConflictCount = 0;
  for (let i = 0; i < timetableEntries.length; i++) {
    const s = parseMinutes(timetableEntries[i].startTime);
    const e = parseMinutes(timetableEntries[i].endTime);
    if (s < earliestMin) earliestMin = s;
    if (e > latestMin) latestMin = e;

    // Detect direct class overlaps
    for (let j = i + 1; j < timetableEntries.length; j++) {
      const s2 = parseMinutes(timetableEntries[j].startTime);
      const e2 = parseMinutes(timetableEntries[j].endTime);
      if (s < e2 && e > s2) {
        timetableConflictCount++;
      }
    }
  }

  const detectedGaps: ScheduleGap[] = detectScheduleGaps(
    timetableSlots,
    earliestMin,
    latestMin,
    45 // min 45m gap convention from schedule-gaps.ts
  );

  // Combine classes and gaps into a unified chronological schedule
  const scheduleTimeline: TodayTimelineSlot[] = [];

  for (const t of timetableEntries) {
    scheduleTimeline.push({
      id: t.id,
      type: "CLASS",
      title: `${t.course.code} ${t.type}`,
      subtitle: t.course.name,
      startTime: t.startTime,
      endTime: t.endTime,
      durationMinutes: parseMinutes(t.endTime) - parseMinutes(t.startTime),
      room: t.room || "Classroom",
      color: t.course.color,
      hasConflict: timetableConflictCount > 0,
    });
  }

  for (let i = 0; i < detectedGaps.length; i++) {
    const gap = detectedGaps[i];
    scheduleTimeline.push({
      id: `gap-${i}`,
      type: "STUDY_GAP",
      title: gap.label,
      startTime: gap.startTime,
      endTime: gap.endTime,
      durationMinutes: gap.durationMinutes,
      suggestedAction: gap.suggestedAction,
    });
  }

  // Sort timeline chronologically by start time
  scheduleTimeline.sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));

  // 8. Capacity Model: Candidate Workload vs. Today's Allocated Workload
  const availableStudyMinutes = detectedGaps.reduce((acc, g) => acc + g.durationMinutes, 0);

  // Combine assignment and exam candidate items
  const candidateTasks = [...candidateAssignmentItems, ...examItems];
  candidateTasks.sort((a, b) => b.urgencyScore - a.urgencyScore);

  let allocatedMinutes = 0;
  const todayAllocatedTasks: TodayActionItem[] = [];
  const nextTasks: TodayActionItem[] = [];
  const laterTasks: TodayActionItem[] = [];

  for (const task of candidateTasks) {
    const isMustDoToday = task.urgencyTier === "OVERDUE" || task.urgencyTier === "CRITICAL";

    // Due date proximity in days
    let daysAway = 999;
    if (task.dueDateStr) {
      const diffMs = new Date(task.dueDateStr).getTime() - now.getTime();
      daysAway = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    if (isMustDoToday) {
      // Overdue or due today is always allocated to TODAY
      todayAllocatedTasks.push(task);
      allocatedMinutes += task.estimatedMinutes;
    } else if (allocatedMinutes + task.estimatedMinutes <= availableStudyMinutes && daysAway <= 2) {
      // Fits within remaining available study time and due soon
      todayAllocatedTasks.push(task);
      allocatedMinutes += task.estimatedMinutes;
    } else if (daysAway <= 5) {
      // Defer to NEXT (days 2 to 5 or deferred due to capacity)
      const isDeferred = daysAway <= 2;
      nextTasks.push({
        ...task,
        deferredReason: isDeferred
          ? "Deferred from today to fit available study windows"
          : undefined,
      });
    } else {
      // Longer-term backlog items go to LATER
      laterTasks.push(task);
    }
  }

  // Generate explainable capacity notice
  const isOverCapacity = allocatedMinutes > availableStudyMinutes;
  let capacityNotice = "";
  if (availableStudyMinutes === 0 && todayAllocatedTasks.length > 0) {
    capacityNotice = `Schedule is packed with classes today. Focus on your top urgent item (${todayAllocatedTasks[0].title}) during breaks.`;
  } else if (isOverCapacity) {
    capacityNotice = `Identified ~${Math.round(allocatedMinutes / 60)}h of urgent work, which exceeds your ~${(availableStudyMinutes / 60).toFixed(1)}h of study windows today. Focus on the top ${todayAllocatedTasks.length} items; remaining work deferred to Next.`;
  } else if (todayAllocatedTasks.length > 0) {
    capacityNotice = `Today's ~${Math.round(allocatedMinutes / 60)}h of planned work fits comfortably within your ~${(availableStudyMinutes / 60).toFixed(1)}h of open study windows.`;
  } else {
    capacityNotice = `No pressing tasks scheduled for today. You have ~${(availableStudyMinutes / 60).toFixed(1)}h of open study time.`;
  }

  // 9. Build Canonical ATTENTION List
  // Attention items provide high-priority warnings linking to corresponding Today cards
  const attentionItems: TodayActionItem[] = todayAllocatedTasks
    .filter((t) => t.isAttentionItem)
    .slice(0, 5);

  // 10. Completed Today items (never placed into LATER)
  const completedTodayItems: CompletedTodayItem[] = completedTodayAssignments.map((a) => ({
    id: a.id,
    title: a.title,
    courseCode: a.course.code,
    completedAtStr: a.updatedAt.toISOString(),
  }));

  // 11. Empty State Determination
  const isNewStudent = courses.length === 0;
  const missingSections: ("COURSES" | "TIMETABLE" | "ASSIGNMENTS" | "EXAMS")[] = [];
  if (courses.length === 0) missingSections.push("COURSES");
  if (timetableEntries.length === 0) missingSections.push("TIMETABLE");
  if (allAssignments.length === 0) missingSections.push("ASSIGNMENTS");
  if (upcomingExams.length === 0) missingSections.push("EXAMS");

  const hasNoClassesToday = timetableEntries.length === 0;
  const isAllCaughtUp = attentionItems.length === 0 && attendanceWarning === null;

  // 12. Sanitized Calendar Sync Status (No OAuth tokens or secrets exposed)
  let calendarStatus: AdaptiveTodayWorkspaceData["calendarSync"]["status"] = "NOT_CONFIGURED";
  if (calendarIntegration) {
    if (calendarIntegration.status === "CONNECTED") calendarStatus = "CONNECTED";
    else if (calendarIntegration.status === "NEEDS_REAUTH") calendarStatus = "NEEDS_REAUTH";
    else calendarStatus = "DISCONNECTED";
  }

  return {
    timestamp: now.toISOString(),
    dateString: pkt.dateString,
    dayName,
    capacity: {
      availableStudyMinutes,
      allocatedWorkMinutes: allocatedMinutes,
      isOverCapacity,
      notice: capacityNotice,
    },
    attention: {
      items: attentionItems,
      criticalCount: attentionItems.length,
      attendanceWarning,
      timetableConflictCount,
    },
    today: {
      schedule: scheduleTimeline,
      allocatedTasks: todayAllocatedTasks,
    },
    next: nextTasks,
    later: laterTasks,
    completedToday: {
      items: completedTodayItems,
      count: completedTodayItems.length,
    },
    calendarSync: {
      status: calendarStatus,
      lastSyncAt: calendarIntegration?.lastSyncAt ? calendarIntegration.lastSyncAt.toISOString() : null,
      accountEmail: calendarIntegration?.externalAccountEmail || null,
    },
    emptyState: {
      isNewStudent,
      missingSections,
      hasNoClassesToday,
      isAllCaughtUp,
    },
  };
}
