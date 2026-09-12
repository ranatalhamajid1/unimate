import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile } from "@/app/lib/mobile-auth";
import { initiateGoogleCalendarOAuth } from "@/app/lib/integrations/google-calendar";

export async function POST(req: NextRequest) {
  // Mobile route: strictly requires authenticated Mobile Bearer JWT
  const mobileSession = await authenticateMobile(req);
  if (!mobileSession || !mobileSession.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseOrigin = req.nextUrl.origin;
    const { authUrl, state } = await initiateGoogleCalendarOAuth({
      userId: mobileSession.userId,
      clientType: "MOBILE",
      baseOrigin,
    });

    return NextResponse.json({ authUrl, state });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to initiate mobile OAuth: ${err.message}` },
      { status: 500 }
    );
  }
}
