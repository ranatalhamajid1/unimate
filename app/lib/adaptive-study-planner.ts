import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getPKTDateParts, getPKTDayBounds } from "@/app/lib/timezone";
import {
  calculateTaskUrgency,
  PriorityUrgencyTier,
  RawTaskInput,
} from "@/app/lib/intelligence/priority-engine";
import {
  detectScheduleGaps,
  ScheduleGap,
  TimetableSlotInput,
} from "@/app/lib/intelligence/schedule-gaps";
import {
  calculateExamReadiness,
  ExamReadinessStatus,
} from "@/app/lib/intelligence/exam-readiness";
import { getHeuristicTaskDuration } from "@/app/lib/today-workspace";
import {
  AdaptiveDraftPlan,
  AdaptiveStudyBlock,
  PlanFeasibility,
  PlanningHorizon,
  UnallocatedTask,
} from "@/app/lib/study-plan-definitions";
import { FOCUS_TARGET_TYPES } from "@/app/lib/study-session-definitions";
import { GoogleGenAI } from "@google/genai";

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

interface InternalGap {
  dayIndex: number;
  dateStr: string;
  dayStartMs: number;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
}

interface CandidateItem {
  id: string;
  targetType: "ASSIGNMENT" | "EXAM";
  targetId: string;
  courseId: string | null;
  courseCode: string;
  courseName: string;
  courseColor: string;
  title: string;
  deadlineDate: Date;
  deadlineLabel: string;
  urgencyScore: number;
  urgencyTier: PriorityUrgencyTier;
  reason: string;
  requiredMinutes: number;
  isOverdue: boolean;
}

/**
 * Deterministic Adaptive Study Planner.
 * Generates an in-memory draft study plan respecting timetable obstacles,
 * canonical priority rankings, exam readiness, and M15.2 focus reconciliation.
 */
export async function generateAdaptiveStudyPlan(
  userId: string,
  options?: {
    horizonDays?: PlanningHorizon;
    includeAiExplanation?: boolean;
    now?: Date;
    isPro?: boolean;
  }
): Promise<AdaptiveDraftPlan> {
  const now = options?.now || new Date();
  const horizonDays: PlanningHorizon = options?.horizonDays === 14 ? 14 : 7;
  const isPro = options?.isPro ?? false;

  const horizonEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const examHorizonEnd = new Date(now.getTime() + (horizonDays + 7) * 24 * 60 * 60 * 1000);

  // 1. Bounded parallel database query with strict user scoping
  const [courses, timetableEntries, uncompletedAssignments, upcomingExams, completedFocusSessions] =
    await Promise.all([
      prisma.course.findMany({
        where: { userId },
        select: { id: true, name: true, code: true, color: true },
      }),
      prisma.timetableEntry.findMany({
        where: { userId },
        include: { course: { select: { id: true, name: true, code: true } } },
      }),
      prisma.assignment.findMany({
        where: {
          userId,
          status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
          dueDate: { lte: horizonEnd },
        },
        include: { course: { select: { id: true, name: true, code: true, color: true } } },
        orderBy: { dueDate: "asc" },
        take: 50,
      }),
      prisma.exam.findMany({
        where: {
          userId,
          status: "UPCOMING",
          examDate: { gte: now, lte: examHorizonEnd },
        },
        include: { course: { select: { id: true, name: true, code: true, color: true } } },
        orderBy: { examDate: "asc" },
        take: 20,
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          status: "COMPLETED",
          targetType: FOCUS_TARGET_TYPES.ASSIGNMENT,
          targetId: { not: null },
        },
        select: { targetId: true, duration: true },
        take: 100,
      }),
    ]);

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // 2. M15.2 Workload reconciliation: build completed focus minutes map
  const assignmentFocusMinutes = new Map<string, number>();
  for (const s of completedFocusSessions) {
    if (s.targetId) {
      assignmentFocusMinutes.set(
        s.targetId,
        (assignmentFocusMinutes.get(s.targetId) ?? 0) + s.duration
      );
    }
  }

  // 3. Map exam proximity for assignment priority boost
  const examProximityMap = new Map<string, number>();
  for (const exam of upcomingExams) {
    if (!examProximityMap.has(exam.courseId)) {
      const diffMs = exam.examDate.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      examProximityMap.set(exam.courseId, days);
    }
  }

  // 4. Build Candidate Tasks
  const candidateItems: CandidateItem[] = [];

  // 4a. Assignments
  for (const a of uncompletedAssignments) {
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
    const baseEffort = getHeuristicTaskDuration(a.priority);

    // Reconcile residual workload with M15.2 focus session history
    const logged = assignmentFocusMinutes.get(a.id) ?? 0;
    const residual = Math.max(0, baseEffort.minutes - logged);

    // If completely satisfied by logged focus, skip allocation
    if (residual <= 0) continue;

    const isOverdue = a.dueDate.getTime() < now.getTime();

    candidateItems.push({
      id: a.id,
      targetType: "ASSIGNMENT",
      targetId: a.id,
      courseId: a.courseId,
      courseCode: a.course.code,
      courseName: a.course.name,
      courseColor: a.course.color || "#2563eb",
      title: a.title,
      deadlineDate: a.dueDate,
      deadlineLabel: urgency.deadlineLabel,
      urgencyScore: urgency.urgencyScore,
      urgencyTier: urgency.urgencyTier,
      reason: urgency.reason,
      requiredMinutes: residual,
      isOverdue,
    });
  }

  // 4b. Exam Revision
  for (const e of upcomingExams) {
    const readiness = calculateExamReadiness(
      e.examDate,
      e.preparationProgress,
      e.preparationProgress !== null && e.preparationProgress > 0,
      now
    );

    const diffMs = e.examDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // Only schedule revision if exam is within planning horizon
    if (daysRemaining > horizonDays) continue;

    let revisionMinutes = 90;
    let urgencyScore = 45;
    let urgencyTier: PriorityUrgencyTier = "MEDIUM";

    if (daysRemaining <= 2) {
      urgencyScore = 85;
      urgencyTier = "CRITICAL";
      revisionMinutes = readiness.status === "AT RISK" ? 180 : readiness.status === "NEEDS ATTENTION" ? 120 : 60;
    } else if (daysRemaining <= 5) {
      urgencyScore = 65;
      urgencyTier = "HIGH";
      revisionMinutes = readiness.status === "AT RISK" ? 150 : 90;
    } else {
      revisionMinutes = readiness.status === "ON TRACK" ? 50 : 90;
    }

    if (readiness.suggestedFocusHours && readiness.suggestedFocusHours > 0) {
      revisionMinutes = Math.min(360, Math.max(50, Math.round(readiness.suggestedFocusHours * 60)));
    }

    candidateItems.push({
      id: e.id,
      targetType: "EXAM",
      targetId: e.id,
      courseId: e.courseId,
      courseCode: e.course.code,
      courseName: e.course.name,
      courseColor: e.course.color || "#2563eb",
      title: `Exam Prep: ${e.title}`,
      deadlineDate: e.examDate,
      deadlineLabel: `Exam in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
      urgencyScore,
      urgencyTier,
      reason: readiness.recommendation || `Exam scheduled for ${e.examDate.toISOString().split("T")[0]}`,
      requiredMinutes: revisionMinutes,
      isOverdue: false,
    });
  }

  // Sort candidate items strictly by urgency score descending
  candidateItems.sort((a, b) => b.urgencyScore - a.urgencyScore);

  // 5. Multi-Day Schedule Gap Detection across Planning Horizon
  const availableGaps: InternalGap[] = [];
  let totalAvailableMinutes = 0;

  for (let dayIdx = 0; dayIdx < horizonDays; dayIdx++) {
    const dayDate = new Date(now.getTime() + dayIdx * 24 * 60 * 60 * 1000);
    const pkt = getPKTDateParts(dayDate);
    const { start: dayStart } = getPKTDayBounds(dayDate);

    // Timetable entries for this day of week (1=Mon..7=Sun)
    const dayClasses = timetableEntries.filter((t) => t.dayOfWeek === pkt.dayOfWeek);
    const timetableSlots: TimetableSlotInput[] = dayClasses.map((t) => ({
      startTime: t.startTime,
      endTime: t.endTime,
      courseName: t.course.name,
      type: t.type,
    }));

    let earliestMin = 8 * 60; // 08:00
    let latestMin = 20 * 60;  // 20:00
    for (const c of dayClasses) {
      const s = parseMinutes(c.startTime);
      const e = parseMinutes(c.endTime);
      if (s < earliestMin) earliestMin = s;
      if (e > latestMin) latestMin = e;
    }

    const detected = detectScheduleGaps(timetableSlots, earliestMin, latestMin, 45);

    // Enforce daily study capacity cap (max 360m/day)
    let dailyCapRemaining = 360;

    for (const g of detected) {
      let gStartMin = parseMinutes(g.startTime);
      const gEndMin = parseMinutes(g.endTime);

      // On day 0 (today), discard gaps or portion of gaps already in the past
      if (dayIdx === 0) {
        const nowMinutes = pkt.hours * 60 + pkt.minutes;
        if (gEndMin <= nowMinutes) continue;
        if (gStartMin < nowMinutes) {
          gStartMin = Math.ceil(nowMinutes / 15) * 15; // Align to 15m
          if (gEndMin - gStartMin < 25) continue;
        }
      }

      const effectiveDur = Math.min(gEndMin - gStartMin, dailyCapRemaining);
      if (effectiveDur >= 25) {
        availableGaps.push({
          dayIndex: dayIdx,
          dateStr: dayDate.toISOString().split("T")[0],
          dayStartMs: dayStart.getTime(),
          startMinutes: gStartMin,
          endMinutes: gStartMin + effectiveDur,
          durationMinutes: effectiveDur,
        });
        dailyCapRemaining -= effectiveDur;
        totalAvailableMinutes += effectiveDur;
      }

      if (dailyCapRemaining <= 0) break;
    }
  }

  // 6. Deterministic Allocation Loop
  const allocatedBlocks: AdaptiveStudyBlock[] = [];
  const unallocatedTasks: UnallocatedTask[] = [];

  const totalRequiredMinutes = candidateItems.reduce((acc, it) => acc + it.requiredMinutes, 0);

  for (const item of candidateItems) {
    let unplacedMinutes = item.requiredMinutes;
    const deadlineMs = item.deadlineDate.getTime();

    // Try placing study blocks into available gaps on or before deadline
    for (const gap of availableGaps) {
      if (unplacedMinutes <= 0) break;
      if (gap.durationMinutes < 25) continue;

      // Absolute deadline check: cannot schedule block after target deadline
      const slotStartMs = gap.dayStartMs + gap.startMinutes * 60 * 1000;
      if (slotStartMs > deadlineMs) {
        // Gap is strictly after task deadline, cannot schedule
        continue;
      }

      // Determine appropriate block size using presets (15, 25, 50, 90)
      let blockSize = 50;
      if (unplacedMinutes <= 35) {
        blockSize = Math.max(25, unplacedMinutes);
      } else if (gap.durationMinutes >= 90 && unplacedMinutes >= 90) {
        blockSize = 90;
      } else {
        blockSize = Math.min(50, Math.min(gap.durationMinutes, unplacedMinutes));
      }

      // Check gap capacity
      if (gap.durationMinutes < blockSize) {
        blockSize = gap.durationMinutes;
      }

      if (blockSize < 25 && unplacedMinutes > blockSize) {
        continue;
      }

      const scheduledDate = new Date(gap.dayStartMs + gap.startMinutes * 60 * 1000);

      allocatedBlocks.push({
        courseId: item.courseId,
        courseCode: item.courseCode,
        courseName: item.courseName,
        courseColor: item.courseColor,
        title: item.title,
        description: `${item.deadlineLabel} • ${item.reason}`,
        scheduledAt: scheduledDate.toISOString(),
        duration: blockSize,
        targetType: item.targetType,
        targetId: item.targetId,
        urgencyScore: item.urgencyScore,
        urgencyTier: item.urgencyTier,
        reason: item.reason,
        completed: false,
      });

      unplacedMinutes -= blockSize;
      // Consume gap window with 10m buffer between study blocks
      const consumed = blockSize + 10;
      gap.startMinutes += consumed;
      gap.durationMinutes = Math.max(0, gap.endMinutes - gap.startMinutes);
    }

    // Never silently drop: if any required minutes could not fit before deadline, surface explicitly
    if (unplacedMinutes > 0) {
      unallocatedTasks.push({
        id: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        courseId: item.courseId,
        courseCode: item.courseCode,
        courseName: item.courseName,
        title: item.title,
        dueDate: item.deadlineDate.toISOString(),
        urgencyScore: item.urgencyScore,
        urgencyTier: item.urgencyTier,
        remainingMinutes: unplacedMinutes,
        reason: item.isOverdue
          ? "Overdue backlog: deferred from immediate schedule to avoid daily study overload"
          : "Insufficient open study windows before deadline",
        recommendedAction: item.isOverdue
          ? "Request deadline extension or schedule dedicated weekend catch-up block"
          : "Free up personal time or break work into smaller review sessions",
      });
    }
  }

  // Sort allocated blocks chronologically
  allocatedBlocks.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  // 7. Calculate Feasibility Model
  const deficitMinutes = Math.max(0, totalRequiredMinutes - totalAvailableMinutes);
  let status: PlanFeasibility["status"] = "FEASIBLE";

  if (totalAvailableMinutes < totalRequiredMinutes) {
    status = "OVERLOADED";
  } else if (totalAvailableMinutes < totalRequiredMinutes * 1.15) {
    status = "TIGHT";
  }

  let notice = "";
  if (status === "OVERLOADED") {
    notice = `Identified ~${Math.round(totalRequiredMinutes / 60)}h of academic work, exceeding your ~${Math.round(totalAvailableMinutes / 60)}h of study windows over the next ${horizonDays} days. High-risk items surfaced in Unallocated Backlog.`;
  } else if (status === "TIGHT") {
    notice = `Your ~${Math.round(totalRequiredMinutes / 60)}h of required work closely matches your ~${Math.round(totalAvailableMinutes / 60)}h of available study windows. Consistent execution recommended.`;
  } else if (allocatedBlocks.length > 0) {
    notice = `Planned work (~${Math.round(totalRequiredMinutes / 60)}h) fits comfortably within your ~${Math.round(totalAvailableMinutes / 60)}h of open study windows.`;
  } else {
    notice = `No pending assignments or exams scheduled in the next ${horizonDays} days. Enjoy your free time or read ahead!`;
  }

  const feasibility: PlanFeasibility = {
    status,
    totalRequiredMinutes,
    totalAvailableMinutes,
    deficitMinutes,
    notice,
  };

  // 8. Tier 2 Optional Gemini Plan Explanation (Pro Only)
  let aiExplanation: string | null = null;
  if (options?.includeAiExplanation && isPro && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const sanitizedSummary = {
        horizon: `${horizonDays} days`,
        feasibility: status,
        totalRequiredHours: (totalRequiredMinutes / 60).toFixed(1),
        totalAvailableHours: (totalAvailableMinutes / 60).toFixed(1),
        tasksCount: candidateItems.length,
        allocatedBlocksCount: allocatedBlocks.length,
        unallocatedTasksCount: unallocatedTasks.length,
        topTasks: candidateItems.slice(0, 4).map((c) => ({
          course: c.courseCode,
          title: c.title,
          urgency: c.urgencyTier,
        })),
      };

      const prompt = `You are UniMate's Academic Planning Advisor. Provide a brief 2-3 sentence personalized summary and strategy advice for a student's study plan.
Plan Data:
${JSON.stringify(sanitizedSummary)}

Rules:
- Be encouraging, realistic, and academic-first.
- Do NOT fabricate dates, deadlines, or hours.
- Mention specific course codes if helpful.
- If overloaded, suggest triaging the top urgency items.
- Plain text only, no markdown headers.`;

      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (resp?.text) {
        aiExplanation = resp.text.trim();
      }
    } catch {
      // Deterministic plan must never fail if Gemini is unavailable
      aiExplanation = null;
    }
  }

  return {
    title: `${horizonDays}-Day Adaptive Study Plan`,
    startDate: now.toISOString(),
    endDate: horizonEnd.toISOString(),
    horizonDays,
    feasibility,
    items: allocatedBlocks,
    unallocatedTasks,
    aiExplanation,
  };
}

/**
 * Reconciles an assignment's workload against completed focus sessions.
 */
export async function reconcileAssignmentWorkload(
  userId: string,
  assignment: { id: string; priority: string }
): Promise<{ baseMinutes: number; loggedFocusMinutes: number; remainingMinutes: number }> {
  const baseEffort = getHeuristicTaskDuration(assignment.priority);
  const completedSessions = await prisma.studySession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      targetType: FOCUS_TARGET_TYPES.ASSIGNMENT,
      targetId: assignment.id,
    },
    select: { duration: true },
  });

  const loggedFocusMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
  const remainingMinutes = Math.max(0, baseEffort.minutes - loggedFocusMinutes);

  return {
    baseMinutes: baseEffort.minutes,
    loggedFocusMinutes,
    remainingMinutes,
  };
}
