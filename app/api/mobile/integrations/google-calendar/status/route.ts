import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile } from "@/app/lib/mobile-auth";
import { getGoogleCalendarStatus } from "@/app/lib/integrations/google-calendar";

export async function GET(req: NextRequest) {
  // Mobile route: strictly requires authenticated Mobile Bearer JWT
  const mobileSession = await authenticateMobile(req);
  if (!mobileSession || !mobileSession.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getGoogleCalendarStatus(mobileSession.userId);
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to fetch status: ${err.message}` },
      { status: 500 }
    );
  }
}
