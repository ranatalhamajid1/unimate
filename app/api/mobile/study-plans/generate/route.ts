import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { generateAdaptiveStudyPlan } from "@/app/lib/adaptive-study-planner";
import { hasEntitlement } from "@/app/lib/entitlements";
import { checkAndIncrementAiUsage } from "@/app/lib/ai-limits";
import { checkRateLimit } from "@/app/lib/ai";
import { PlanningHorizon, DraftStudyPlan } from "@/app/lib/study-plan-definitions";

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const userId = session.userId;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const isPro = await hasEntitlement(userId, "AI_STUDY_PLAN");
    const requestedHorizon = Number(body.horizonDays);
    const horizonDays: PlanningHorizon = requestedHorizon === 14 ? 14 : 7;

    // 14-day extended planning horizon is gated to Pro
    if (horizonDays === 14 && !isPro) {
      return NextResponse.json(
        {
          success: false,
          error: "14-day extended planning horizon requires UniMate Pro.",
          code: "UPGRADE_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Sliding window burst protection
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a moment before requesting another plan." },
        { status: 429 }
      );
    }

    // AI explanation entitlement & quota check (optional Tier 2)
    let includeAi = Boolean(body.includeAiExplanation && isPro);
    if (includeAi) {
      const quota = await checkAndIncrementAiUsage(userId);
      if (!quota.allowed) {
        includeAi = false; // Graceful fallback: still generate deterministic plan without AI explanation
      }
    }

    const draftPlan = await generateAdaptiveStudyPlan(userId, {
      horizonDays,
      includeAiExplanation: includeAi,
      isPro,
    });

    // Backward-compatibility mapping for existing mobile clients expecting DraftStudyPlan
    const legacyPlan: DraftStudyPlan & {
      items: any[];
      horizonDays?: number;
      feasibility?: string;
      totalRequiredMinutes?: number;
      totalAvailableMinutes?: number;
      deficitMinutes?: number;
      unallocatedTasks?: any[];
    } = {
      title: draftPlan.title,
      summary: draftPlan.feasibility.notice,
      targetDate: draftPlan.startDate.split("T")[0],
      horizonDays: draftPlan.horizonDays,
      feasibility: draftPlan.feasibility.status,
      totalRequiredMinutes: draftPlan.feasibility.totalRequiredMinutes,
      totalAvailableMinutes: draftPlan.feasibility.totalAvailableMinutes,
      deficitMinutes: draftPlan.feasibility.deficitMinutes,
      unallocatedTasks: draftPlan.unallocatedTasks,
      items: draftPlan.items.map((it) => ({
        courseCode: it.courseCode,
        courseId: it.courseId,
        title: it.title,
        duration: it.duration,
        reason: it.reason,
        suggestedTime: it.scheduledAt.split("T")[1]?.slice(0, 5) || "09:00",
        targetType: it.targetType,
        targetId: it.targetId,
        scheduledAt: it.scheduledAt,
      })),
      isLocalFallback: false,
    };

    return NextResponse.json({
      success: true,
      draftPlan,
      plan: legacyPlan,
      isFallback: false,
    });
  } catch (error: unknown) {
    console.error("Error generating mobile study plan:", error);
    const message = error instanceof Error ? error.message : "Failed to generate study plan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
