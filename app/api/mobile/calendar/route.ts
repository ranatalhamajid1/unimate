import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getMonthCalendarEvents } from "@/app/lib/calendar";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    let referenceDate = new Date();
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        referenceDate = parsed;
      }
    }

    const calendarData = await getMonthCalendarEvents(session.userId, referenceDate);

    return NextResponse.json({
      success: true,
      calendar: calendarData,
    });
  } catch (error) {
    console.error("Error fetching mobile calendar events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load calendar events" },
      { status: 500 }
    );
  }
}
