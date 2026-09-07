import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { markAllNotificationsAsRead } from "@/app/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const updatedCount = await markAllNotificationsAsRead(session.userId);
    return NextResponse.json({
      success: true,
      updatedCount,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Error in POST /api/mobile/notifications/read-all:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark all notifications as read." },
      { status: 500 }
    );
  }
}
