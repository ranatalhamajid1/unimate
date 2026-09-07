import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { deleteNotification } from "@/app/lib/notifications";

export async function DELETE(
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
    const success = await deleteNotification(session.userId, id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Notification not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/mobile/notifications/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification." },
      { status: 500 }
    );
  }
}
