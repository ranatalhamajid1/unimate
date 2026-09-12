import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getCalendarIntelligence } from "@/app/lib/calendar-intelligence";
import { hasEntitlement } from "@/app/lib/entitlements";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const requestedHorizon = Number(searchParams.get("horizonDays"));

    let refDate = new Date();
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        refDate = parsed;
      }
    }

    const isPro = await hasEntitlement(session.userId, "AI_STUDY_PLAN");
    const horizonDays = requestedHorizon === 14 && isPro ? 14 : 7;

    const data = await getCalendarIntelligence(session.userId, {
      referenceDate: refDate,
      horizonDays,
      isPro,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error("Error fetching mobile calendar intelligence:", error);
    const message = error instanceof Error ? error.message : "Failed to load calendar intelligence";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
