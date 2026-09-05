import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  NOTIFICATION_TYPES,
  NotificationItem,
} from "@/app/lib/notification-definitions";
import {
  calculateDaysRemaining,
  formatExamDate,
  EXAM_STATUSES,
} from "@/app/lib/exam-definitions";
import { ASSIGNMENT_STATUSES } from "@/app/lib/assignment-definitions";
import { calculateCoursePercentage } from "@/app/lib/academic-definitions";

/**
 * Fetch notifications for a user, ordered by creation date descending.
 * Strictly scoped to the authenticated userId.
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    filter?: string;
    limit?: number;
    offset?: number;
  }
): Promise<NotificationItem[]> {
  try {
    const whereClause: Record<string, unknown> = { userId };

    if (options?.filter === "UNREAD") {
      whereClause.read = false;
    } else if (options?.filter === "ASSIGNMENTS") {
      whereClause.type = {
        in: [
          NOTIFICATION_TYPES.ASSIGNMENT_DUE_SOON,
          NOTIFICATION_TYPES.ASSIGNMENT_OVERDUE,
        ],
      };
    } else if (options?.filter === "EXAMS") {
      whereClause.type = {
        in: [
          NOTIFICATION_TYPES.EXAM_DUE_SOON,
          NOTIFICATION_TYPES.EXAM_TODAY,
          NOTIFICATION_TYPES.EXAM_PREPARATION,
        ],
      };
    } else if (options?.filter === "ATTENDANCE") {
      whereClause.type = NOTIFICATION_TYPES.ATTENDANCE_WARNING;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });

    return notifications;
  } catch (error) {
    console.error("Database error in getUserNotifications:", error);
    return [];
  }
}

/**
 * Fetch unread notification count for a user.
 * Strictly scoped to userId.
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (error) {
    console.error("Database error in getUnreadNotificationCount:", error);
    return 0;
  }
}

/**
 * Mark a single notification as read.
 * Enforces ownership: notification must belong to userId.
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) return false;

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Database error in markNotificationAsRead:", error);
    return false;
  }
}

/**
 * Mark all unread notifications as read for a user.
 * Strictly scoped to userId.
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<number> {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    return result.count;
  } catch (error) {
    console.error("Database error in markAllNotificationsAsRead:", error);
    return 0;
  }
}

/**
 * Delete a notification permanently.
 * Enforces ownership: notification must belong to userId.
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) return false;

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return true;
  } catch (error) {
    console.error("Database error in deleteNotification:", error);
    return false;
  }
}

/**
 * Check if a specific notification already exists for a user.
 */
export async function notificationExists(
  userId: string,
  type: string,
  relatedId: string
): Promise<boolean> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        type,
        relatedId,
      },
    });
    return count > 0;
  } catch (error) {
    console.error("Database error in notificationExists:", error);
    return false;
  }
}

/**
 * Create a new notification for a user.
 */
export async function createNotification(
  userId: string,
  data: {
    type: string;
    title: string;
    message: string;
    relatedId?: string;
  }
): Promise<NotificationItem | null> {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId || null,
      },
    });
  } catch (error) {
    console.error("Database error in createNotification:", error);
    return null;
  }
}

/**
 * Notification Generation Engine — generateAcademicNotifications.
 *
 * Inspects the student's real courses, assignments, exams, and attendance.
 * Deterministically creates notifications with unique keys to guarantee:
 * - Zero duplicate accumulation
 * - Immediate reactivity to academic changes
 * - No overdue notices for completed tasks
 */
export async function generateAcademicNotifications(
  userId: string
): Promise<number> {
  try {
    const now = new Date();

    // 1. Fetch user records and existing notifications in parallel
    const [assignments, exams, coursesWithAttendance, existingNotifications] =
      await Promise.all([
        prisma.assignment.findMany({
          where: { userId },
          include: { course: { select: { name: true, code: true } } },
        }),
        prisma.exam.findMany({
          where: { userId },
          include: { course: { select: { name: true, code: true } } },
        }),
        prisma.course.findMany({
          where: { userId },
          include: { attendance: true },
        }),
        prisma.notification.findMany({
          where: { userId },
          select: { type: true, relatedId: true },
        }),
      ]);

    // Build deduplication index: "TYPE::RELATED_ID"
    const existingSet = new Set(
      existingNotifications
        .filter((n) => n.relatedId)
        .map((n) => `${n.type}::${n.relatedId}`)
    );

    const toCreate: Array<{
      userId: string;
      type: string;
      title: string;
      message: string;
      relatedId: string;
    }> = [];

    // 2. Evaluate Assignments
    for (const asgn of assignments) {
      // Completed assignments NEVER trigger overdue or due-soon warnings
      if (asgn.status === ASSIGNMENT_STATUSES.COMPLETED) {
        continue;
      }

      const dueDate = new Date(asgn.dueDate);
      const courseName = asgn.course?.name || "General";

      if (dueDate < now) {
        // OVERDUE
        const relatedId = `${asgn.id}:overdue`;
        const key = `${NOTIFICATION_TYPES.ASSIGNMENT_OVERDUE}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.ASSIGNMENT_OVERDUE,
            title: "Assignment overdue",
            message: `"${asgn.title}" for ${courseName} is overdue. Please review and submit as soon as possible.`,
            relatedId,
          });
          existingSet.add(key);
        }
      } else {
        // Check if due within 48 hours (~2 days)
        const diffMs = dueDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours <= 48) {
          const relatedId = `${asgn.id}:duesoon`;
          const key = `${NOTIFICATION_TYPES.ASSIGNMENT_DUE_SOON}::${relatedId}`;
          if (!existingSet.has(key)) {
            const timeLabel =
              diffHours <= 24 ? "due in less than 24 hours" : "due tomorrow";
            toCreate.push({
              userId,
              type: NOTIFICATION_TYPES.ASSIGNMENT_DUE_SOON,
              title: "Assignment due soon",
              message: `"${asgn.title}" for ${courseName} is ${timeLabel}. Finish and submit before the deadline.`,
              relatedId,
            });
            existingSet.add(key);
          }
        }
      }
    }

    // 3. Evaluate Exams
    for (const exam of exams) {
      // Skip completed exams
      if (exam.status === EXAM_STATUSES.COMPLETED) {
        continue;
      }

      const examDate = new Date(exam.examDate);
      const courseName = exam.course?.name || "General";
      const daysRemaining = calculateDaysRemaining(examDate);

      const isToday =
        examDate.getFullYear() === now.getFullYear() &&
        examDate.getMonth() === now.getMonth() &&
        examDate.getDate() === now.getDate();

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow =
        examDate.getFullYear() === tomorrow.getFullYear() &&
        examDate.getMonth() === tomorrow.getMonth() &&
        examDate.getDate() === tomorrow.getDate();

      // Exam today
      if (isToday) {
        const relatedId = `${exam.id}:today`;
        const key = `${NOTIFICATION_TYPES.EXAM_TODAY}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.EXAM_TODAY,
            title: "Exam today",
            message: `"${exam.title}" (${courseName}) is scheduled for today in ${exam.room || "your designated room"}. Good luck!`,
            relatedId,
          });
          existingSet.add(key);
        }
      } else if (isTomorrow || daysRemaining === 1) {
        // Exam tomorrow (1 day)
        const relatedId = `${exam.id}:1d`;
        const key = `${NOTIFICATION_TYPES.EXAM_DUE_SOON}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.EXAM_DUE_SOON,
            title: "Exam tomorrow",
            message: `"${exam.title}" (${courseName}) is tomorrow. Preparation progress: ${exam.preparationProgress}%.`,
            relatedId,
          });
          existingSet.add(key);
        }
      } else if (daysRemaining <= 3) {
        // Exam in 3 days
        const relatedId = `${exam.id}:3d`;
        const key = `${NOTIFICATION_TYPES.EXAM_DUE_SOON}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.EXAM_DUE_SOON,
            title: `Exam in ${daysRemaining} days`,
            message: `"${exam.title}" (${courseName}) is coming up on ${formatExamDate(examDate)}.`,
            relatedId,
          });
          existingSet.add(key);
        }
      } else if (daysRemaining <= 7) {
        // Exam in 7 days
        const relatedId = `${exam.id}:7d`;
        const key = `${NOTIFICATION_TYPES.EXAM_DUE_SOON}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.EXAM_DUE_SOON,
            title: "Exam next week",
            message: `"${exam.title}" (${courseName}) is scheduled for ${formatExamDate(examDate)}. Plan your revision sessions early.`,
            relatedId,
          });
          existingSet.add(key);
        }
      }

      // Preparation progress reminder: under 50% prep and within 5 days
      if (exam.preparationProgress < 50 && daysRemaining > 0 && daysRemaining <= 5) {
        const relatedId = `${exam.id}:prep`;
        const key = `${NOTIFICATION_TYPES.EXAM_PREPARATION}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.EXAM_PREPARATION,
            title: "Exam preparation reminder",
            message: `Your preparation for "${exam.title}" is currently at ${exam.preparationProgress}%. You have ${daysRemaining} day(s) left to study.`,
            relatedId,
          });
          existingSet.add(key);
        }
      }
    }

    // 4. Evaluate Attendance
    for (const course of coursesWithAttendance) {
      const attRecord = course.attendance[0] || null;
      if (!attRecord || attRecord.totalClasses <= 0) {
        continue;
      }

      const pct = calculateCoursePercentage(
        attRecord.attendedClasses,
        attRecord.totalClasses
      );

      if (pct === null) continue;

      if (pct < 65) {
        // Critical attendance (< 65%)
        const relatedId = `${course.id}:critical`;
        const key = `${NOTIFICATION_TYPES.ATTENDANCE_WARNING}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.ATTENDANCE_WARNING,
            title: "Critical attendance warning",
            message: `Your attendance in ${course.name} is ${pct}%. Your attendance requires immediate attention to avoid debarment.`,
            relatedId,
          });
          existingSet.add(key);
        }
      } else if (pct < 75) {
        // Warning attendance (< 75%)
        const relatedId = `${course.id}:warning`;
        const key = `${NOTIFICATION_TYPES.ATTENDANCE_WARNING}::${relatedId}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            userId,
            type: NOTIFICATION_TYPES.ATTENDANCE_WARNING,
            title: "Attendance needs attention",
            message: `Your attendance in ${course.name} is ${pct}%. Consider prioritizing upcoming classes to meet the 75% threshold.`,
            relatedId,
          });
          existingSet.add(key);
        }
      }
    }

    // 5. Bulk insert newly generated notifications
    if (toCreate.length > 0) {
      await prisma.notification.createMany({
        data: toCreate,
      });
    }

    return toCreate.length;
  } catch (error) {
    console.error("Error in generateAcademicNotifications:", error);
    return 0;
  }
}
