import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { generateAdaptiveStudyPlan } from "@/app/lib/adaptive-study-planner";
import { hasEntitlement } from "@/app/lib/entitlements";
import { PlanningHorizon } from "@/app/lib/study-plan-definitions";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const horizonDays: PlanningHorizon = body.horizonDays === 14 ? 14 : 7;
    const isPro = await hasEntitlement(session.userId, "AI_STUDY_PLAN");

    if (horizonDays === 14 && !isPro) {
      return NextResponse.json(
        {
          success: false,
          error: "14-day extended planning horizon requires UniMate Pro.",
          code: "UPGRADE_REQUIRED",
          upgradeUrl: "/dashboard/billing",
        },
        { status: 403 }
      );
    }

    const includeAiExplanation = Boolean(body.includeAiExplanation && isPro);

    const draftPlan = await generateAdaptiveStudyPlan(session.userId, {
      horizonDays,
      includeAiExplanation,
      isPro,
    });

    return NextResponse.json({ success: true, draftPlan });
  } catch (error: unknown) {
    console.error("Error in POST /api/study-plans/generate:", error);
    const message = error instanceof Error ? error.message : "Failed to generate study plan.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
