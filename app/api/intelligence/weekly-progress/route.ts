import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { hasEntitlement } from "@/app/lib/entitlements";
import { getStudentWeeklyProgress } from "@/app/lib/intelligence/weekly-progress";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasEntitlement(auth.userId, "ADVANCED_ANALYTICS");
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Weekly Progress Analytics requires UniMate Pro.",
          code: "UPGRADE_REQUIRED",
          feature: "ADVANCED_ANALYTICS",
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    const progress = await getStudentWeeklyProgress(auth.userId);

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Error in GET /api/intelligence/weekly-progress:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
