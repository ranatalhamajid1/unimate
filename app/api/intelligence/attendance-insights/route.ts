import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { getStudentAttendanceIntelligence } from "@/app/lib/intelligence/attendance-intel";
import { getUserSubscription } from "@/app/lib/entitlements";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawThreshold = parseFloat(searchParams.get("threshold") || "0.75");
    // Defensive threshold clamping between 50% and 95%
    const threshold = Number.isFinite(rawThreshold) && rawThreshold >= 0.5 && rawThreshold <= 0.95
      ? rawThreshold
      : 0.75;

    const [intelligence, subscription] = await Promise.all([
      getStudentAttendanceIntelligence(auth.userId, threshold),
      getUserSubscription(auth.userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...intelligence,
        isPro: subscription.isPro,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/intelligence/attendance-insights:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
