import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import {
  syncGoogleCalendar,
  SyncConcurrencyError,
  ReauthRequiredError,
} from "@/app/lib/integrations/google-calendar";

export async function POST(req: NextRequest) {
  // Web route: strictly requires authenticated Web Cookie session
  const session = await getSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGoogleCalendar(session.userId);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof SyncConcurrencyError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ReauthRequiredError) {
      return NextResponse.json(
        { error: err.message, reauthRequired: true },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: `Sync failed: ${err.message}` },
      { status: 500 }
    );
  }
}
