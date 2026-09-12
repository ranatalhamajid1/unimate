import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { completeFocusSessionRecord } from "@/app/lib/study-sessions";

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

    let markTargetComplete = false;
    try {
      const body = await req.json();
      if (typeof body?.markTargetComplete === "boolean") {
        markTargetComplete = body.markTargetComplete;
      }
    } catch {
      // Body is optional; defaults to false
    }

    const result = await completeFocusSessionRecord(auth.userId, id, {
      markTargetComplete,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.session.id,
        plannedDuration: result.plannedMinutes,
        actualDuration: result.actualMinutes,
        completed: result.session.completed,
        status: (result.session as any).status || "COMPLETED",
        targetMarkedComplete: result.targetMarkedComplete,
      },
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Failed to complete session";
    const status =
      message.includes("unauthorized") || message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
