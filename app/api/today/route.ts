import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { getAdaptiveTodayWorkspace } from "@/app/lib/today-workspace";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await getAdaptiveTodayWorkspace(session.userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in GET /api/today:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
