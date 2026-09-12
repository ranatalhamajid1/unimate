import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { getActiveFocusSessionRecord } from "@/app/lib/study-sessions";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const activeSession = await getActiveFocusSessionRecord(auth.userId);
    return NextResponse.json({ success: true, activeSession });
  } catch (error) {
    console.error("Error in GET /api/study-sessions/active:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
