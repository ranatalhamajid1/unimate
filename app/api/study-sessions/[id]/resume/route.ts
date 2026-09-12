import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { resumeFocusSessionRecord } from "@/app/lib/study-sessions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await resumeFocusSessionRecord(auth.userId, id);
    return NextResponse.json({ success: true, activeSession: session });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Failed to resume session";
    const status =
      message.includes("unauthorized") || message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
