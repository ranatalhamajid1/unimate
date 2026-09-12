import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { initiateGoogleCalendarOAuth } from "@/app/lib/integrations/google-calendar";

export async function POST(req: NextRequest) {
  // Web route: strictly requires authenticated Web Cookie session
  const session = await getSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseOrigin = req.nextUrl.origin;
    const { authUrl, state } = await initiateGoogleCalendarOAuth({
      userId: session.userId,
      clientType: "WEB",
      baseOrigin,
    });

    return NextResponse.json({ authUrl, state });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to initiate OAuth: ${err.message}` },
      { status: 500 }
    );
  }
}
