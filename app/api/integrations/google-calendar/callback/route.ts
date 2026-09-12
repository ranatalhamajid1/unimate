import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCalendarCallback } from "@/app/lib/integrations/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const baseOrigin = req.nextUrl.origin;

  if (error || !code || !state) {
    const errorMsg = error || "Missing code or state parameter";
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?status=error&message=${encodeURIComponent(errorMsg)}`, baseOrigin)
    );
  }

  const result = await handleGoogleCalendarCallback({
    code,
    state,
    baseOrigin,
  });

  if (!result.success) {
    if (result.clientType === "MOBILE") {
      return NextResponse.redirect(
        "unimate://integrations/callback?provider=google_calendar&status=error"
      );
    }
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations?status=error&message=${encodeURIComponent(result.error || "OAuth failed")}`,
        baseOrigin
      )
    );
  }

  if (result.clientType === "MOBILE") {
    // Deep link redirect contains only provider and status, zero tokens/secrets
    return NextResponse.redirect(
      "unimate://integrations/callback?provider=google_calendar&status=success"
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/integrations?status=connected", baseOrigin)
  );
}
