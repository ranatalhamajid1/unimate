import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getWeeklyReview } from "@/app/lib/weekly-review";
import { hasEntitlement } from "@/app/lib/entitlements";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const weekOffsetStr = searchParams.get("weekOffset");

    let refDate = new Date();
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        refDate = parsed;
      }
    }

    const weekOffset = weekOffsetStr !== null && !isNaN(Number(weekOffsetStr))
      ? Number(weekOffsetStr)
      : -1; // Default to last completed week

    const isPro = await hasEntitlement(session.userId, "AI_STUDY_PLAN");

    const data = await getWeeklyReview(session.userId, {
      referenceDate: refDate,
      weekOffset,
      isPro,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error("Error fetching mobile weekly review:", error);
    const message = error instanceof Error ? error.message : "Failed to generate weekly review";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
