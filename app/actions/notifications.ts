"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/app/lib/notifications";

export type NotificationActionResult = {
  success: boolean;
  message?: string;
};

/**
 * Server action to mark a single notification as read.
 * Strictly verifies authenticated ownership.
 */
export async function markNotificationRead(
  notificationId: string
): Promise<NotificationActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized" };
    }

    if (!notificationId || typeof notificationId !== "string") {
      return { success: false, message: "Invalid notification ID" };
    }

    const success = await markNotificationAsRead(session.userId, notificationId);
    if (!success) {
      return { success: false, message: "Notification not found or access denied" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("Action error in markNotificationRead:", error);
    return { success: false, message: "Failed to update notification" };
  }
}

/**
 * Server action to mark all notifications as read for the authenticated user.
 */
export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized" };
    }

    await markAllNotificationsAsRead(session.userId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("Action error in markAllNotificationsRead:", error);
    return { success: false, message: "Failed to mark all as read" };
  }
}

/**
 * Server action to delete a notification.
 * Strictly verifies authenticated ownership.
 */
export async function deleteNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized" };
    }

    if (!notificationId || typeof notificationId !== "string") {
      return { success: false, message: "Invalid notification ID" };
    }

    const success = await deleteNotification(session.userId, notificationId);
    if (!success) {
      return { success: false, message: "Notification not found or access denied" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("Action error in deleteNotificationAction:", error);
    return { success: false, message: "Failed to delete notification" };
  }
}
