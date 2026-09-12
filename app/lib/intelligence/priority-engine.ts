import "server-only";

import { prisma } from "@/app/lib/prisma";

export type PriorityUrgencyTier = "OVERDUE" | "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";

export type PrioritizedTask = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  title: string;
  dueDate: Date;
  dueDateStr: string;
  deadlineLabel: string;
  priority: string; // LOW, MEDIUM, HIGH
  status: string;
  urgencyScore: number; // 0 to 100
  urgencyTier: PriorityUrgencyTier;
  action: string;
  reason: string;
  examProximityDays: number | null;
};

export type RawTaskInput = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  title: string;
  dueDate: Date;
  priority: string;
  status: string;
};

/**
 * Pure calculation function for single task urgency score and explainable reason.
 * 100% deterministic and testable without DB.
 */
export function calculateTaskUrgency(
  task: RawTaskInput,
  nearestExamDaysRemaining: number | null,
  now: Date = new Date()
): {
  urgencyScore: number;
  urgencyTier: PriorityUrgencyTier;
  deadlineLabel: string;
  action: string;
  reason: string;
} {
  const dueMs = task.dueDate.getTime();
  const nowMs = now.getTime();
  const diffHours = (dueMs - nowMs) / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffHours / 24);

  let score = 0;
  let deadlineLabel = "";
  let urgencyTier: PriorityUrgencyTier = "NORMAL";
  const reasons: string[] = [];

  // 1. Deadline proximity & Overdue status
  if (diffHours < 0) {
    // Overdue
    const overdueDays = Math.max(1, Math.floor(Math.abs(diffHours) / 24));
    score = 100;
    urgencyTier = "OVERDUE";
    deadlineLabel = overdueDays === 1 ? "Overdue by 1 day" : `Overdue by ${overdueDays} days`;
    reasons.push(deadlineLabel);
  } else if (diffHours <= 24) {
    // Due today
    score = 65;
    urgencyTier = "CRITICAL";
    deadlineLabel = "Due today";
    reasons.push("Due within 24 hours");
  } else if (diffHours <= 48) {
    // Due tomorrow
    score = 50;
    urgencyTier = "HIGH";
    deadlineLabel = "Due tomorrow";
    reasons.push("Due tomorrow");
  } else if (diffDays <= 5) {
    // Due in 3-5 days
    score = 35;
    urgencyTier = "MEDIUM";
    deadlineLabel = `Due in ${diffDays} days`;
    reasons.push(`Due in ${diffDays} days`);
  } else if (diffDays <= 7) {
    // Due in a week
    score = 20;
    urgencyTier = "NORMAL";
    deadlineLabel = `Due in ${diffDays} days`;
    reasons.push("Due within 7 days");
  } else {
    // Beyond 7 days
    score = 10;
    urgencyTier = "NORMAL";
    deadlineLabel = `Due in ${diffDays} days`;
    reasons.push(`Due in ${diffDays} days`);
  }

  // 2. Task priority weight
  if (task.priority === "HIGH") {
    score = Math.min(100, score + 20);
    if (urgencyTier !== "OVERDUE" && urgencyTier !== "CRITICAL") {
      urgencyTier = "HIGH";
    }
    reasons.push("Marked as High priority");
  } else if (task.priority === "MEDIUM") {
    score = Math.min(100, score + 10);
  }

  // 3. Exam proximity boost (within 7 days)
  if (nearestExamDaysRemaining !== null && nearestExamDaysRemaining >= 0 && nearestExamDaysRemaining <= 7) {
    score = Math.min(100, score + 15);
    if (urgencyTier === "NORMAL") urgencyTier = "MEDIUM";
    if (urgencyTier === "MEDIUM" && diffDays <= 5) urgencyTier = "HIGH";
    
    const examLabel = nearestExamDaysRemaining === 0 
      ? "exam is today" 
      : nearestExamDaysRemaining === 1 
        ? "exam is tomorrow" 
        : `exam in ${nearestExamDaysRemaining} days`;
    reasons.push(`Related course ${examLabel}`);
  }

  // Action text
  const action = `Complete ${task.title}`;
  // Human readable explanation
  const reason = reasons.join(" • ");

  return {
    urgencyScore: Math.min(100, Math.max(0, score)),
    urgencyTier,
    deadlineLabel,
    action,
    reason,
  };
}

/**
 * Retrieves and deterministically sorts top prioritized tasks for a user.
 */
export async function getStudentPriorities(
  userId: string,
  limit: number = 5,
  now: Date = new Date()
): Promise<PrioritizedTask[]> {
  try {
    // 1. Fetch uncompleted assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        userId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    if (assignments.length === 0) {
      return [];
    }

    // 2. Fetch upcoming exams to check course proximity
    const upcomingExams = await prisma.exam.findMany({
      where: {
        userId,
        status: "UPCOMING",
        examDate: { gte: now },
      },
      select: {
        courseId: true,
        examDate: true,
      },
      orderBy: { examDate: "asc" },
    });

    // Map courseId -> nearest exam days remaining
    const examProximityMap = new Map<string, number>();
    for (const exam of upcomingExams) {
      if (!examProximityMap.has(exam.courseId)) {
        const diffMs = exam.examDate.getTime() - now.getTime();
        const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        examProximityMap.set(exam.courseId, days);
      }
    }

    // 3. Compute score for each assignment
    const prioritized: PrioritizedTask[] = assignments.map((a) => {
      const nearestExamDays = examProximityMap.get(a.courseId) ?? null;
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

      const result = calculateTaskUrgency(rawInput, nearestExamDays, now);

      return {
        id: a.id,
        courseId: a.courseId,
        courseName: a.course.name,
        courseCode: a.course.code,
        title: a.title,
        dueDate: a.dueDate,
        dueDateStr: a.dueDate.toISOString(),
        deadlineLabel: result.deadlineLabel,
        priority: a.priority,
        status: a.status,
        urgencyScore: result.urgencyScore,
        urgencyTier: result.urgencyTier,
        action: result.action,
        reason: result.reason,
        examProximityDays: nearestExamDays,
      };
    });

    // 4. Sort: Highest urgency score first, then earliest due date
    prioritized.sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    return prioritized.slice(0, limit);
  } catch (error) {
    console.error("Error calculating student priorities:", error);
    return [];
  }
}
