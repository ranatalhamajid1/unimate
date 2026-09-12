import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  startFocusSessionRecord,
  ActiveSessionConflictError,
} from "@/app/lib/study-sessions";
import { StartFocusSessionInput } from "@/app/lib/study-session-definitions";

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: StartFocusSessionInput;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const session = await startFocusSessionRecord(auth.userId, body);
    return NextResponse.json({ success: true, activeSession: session }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ActiveSessionConflictError) {
      return NextResponse.json(
        {
          success: false,
          code: "ACTIVE_SESSION_EXISTS",
          error: error.message,
          activeSession: error.activeSession,
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to start focus session";
    const status =
      message.includes("unauthorized") || message.includes("not found") ? 403 : 400;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
