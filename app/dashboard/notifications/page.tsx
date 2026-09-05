/**
 * Notifications Page — /dashboard/notifications
 *
 * Protected Server Component.
 * Triggers server-side academic notification generation and loads
 * notifications strictly scoped to the authenticated student.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  generateAcademicNotifications,
} from "@/app/lib/notifications";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = {
  title: "Notifications — UniMate",
  description: "Stay on top of your academic deadlines, exam dates, and attendance.",
};

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  // 1. Run idempotent server-side academic notification generation
  await generateAcademicNotifications(session.userId);

  // 2. Fetch user's notifications and unread count
  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.userId),
    getUnreadNotificationCount(session.userId),
  ]);

  return (
    <NotificationsView
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
