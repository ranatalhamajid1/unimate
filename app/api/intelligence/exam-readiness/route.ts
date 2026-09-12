import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { getStudentExamReadiness } from "@/app/lib/intelligence/exam-readiness";
import { getUserSubscription } from "@/app/lib/entitlements";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [readiness, subscription] = await Promise.all([
      getStudentExamReadiness(auth.userId),
      getUserSubscription(auth.userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...readiness,
        isPro: subscription.isPro,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/intelligence/exam-readiness:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
