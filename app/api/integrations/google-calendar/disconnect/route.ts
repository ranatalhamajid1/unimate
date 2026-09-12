import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { disconnectGoogleCalendar } from "@/app/lib/integrations/google-calendar";

export async function POST(req: NextRequest) {
  // Web route: strictly requires authenticated Web Cookie session
  const session = await getSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const deleteCalendar = Boolean(body.deleteCalendar);
    const result = await disconnectGoogleCalendar(session.userId, deleteCalendar);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Disconnect failed: ${err.message}` },
      { status: 500 }
    );
  }
}
