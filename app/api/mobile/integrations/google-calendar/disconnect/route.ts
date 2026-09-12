import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile } from "@/app/lib/mobile-auth";
import { disconnectGoogleCalendar } from "@/app/lib/integrations/google-calendar";

export async function POST(req: NextRequest) {
  // Mobile route: strictly requires authenticated Mobile Bearer JWT
  const mobileSession = await authenticateMobile(req);
  if (!mobileSession || !mobileSession.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const deleteCalendar = Boolean(body.deleteCalendar);
    const result = await disconnectGoogleCalendar(mobileSession.userId, deleteCalendar);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Disconnect failed: ${err.message}` },
      { status: 500 }
    );
  }
}
