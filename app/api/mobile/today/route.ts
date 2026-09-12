import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getAdaptiveTodayWorkspace } from "@/app/lib/today-workspace";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session || !session.userId) {
      return unauthorizedResponse();
    }

    const data = await getAdaptiveTodayWorkspace(session.userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in GET /api/mobile/today:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
