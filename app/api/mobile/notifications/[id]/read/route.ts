import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { markNotificationAsRead } from "@/app/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Notification ID is required." },
      { status: 400 }
    );
  }

  try {
    const success = await markNotificationAsRead(session.userId, id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Notification not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Error in PATCH /api/mobile/notifications/[id]/read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read." },
      { status: 500 }
    );
  }
}
