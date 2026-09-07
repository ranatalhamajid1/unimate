import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/app/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.userId),
      getUnreadNotificationCount(session.userId),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error in GET /api/mobile/notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
