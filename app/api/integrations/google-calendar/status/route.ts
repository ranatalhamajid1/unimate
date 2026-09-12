import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { getGoogleCalendarStatus } from "@/app/lib/integrations/google-calendar";

export async function GET(req: NextRequest) {
  // Web route: strictly requires authenticated Web Cookie session
  const session = await getSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getGoogleCalendarStatus(session.userId);
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to fetch status: ${err.message}` },
      { status: 500 }
    );
  }
}
