import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getUserSubscription } from "@/app/lib/entitlements";
import { FREE_DAILY_AI_LIMIT, PRO_DAILY_AI_LIMIT } from "@/app/lib/ai-limits";
import { PLAN_FEATURES } from "@/app/lib/entitlement-definitions";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const subscription = await getUserSubscription(session.userId);

    const proFeatures = PLAN_FEATURES.PRO;
    const freeFeatures = PLAN_FEATURES.FREE;

    return NextResponse.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        isPro: subscription.isPro,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      limits: {
        dailyAiLimit: subscription.isPro ? PRO_DAILY_AI_LIMIT : FREE_DAILY_AI_LIMIT,
        freeDailyAiLimit: FREE_DAILY_AI_LIMIT,
        proDailyAiLimit: PRO_DAILY_AI_LIMIT,
      },
      features: {
        current: subscription.isPro ? proFeatures : freeFeatures,
        pro: proFeatures,
      },
      notice: "In-app mobile purchases are currently disabled. Subscriptions and plan upgrades can be managed via the UniMate Web App.",
    });
  } catch (error) {
    console.error("Error fetching mobile billing details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load subscription details" },
      { status: 500 }
    );
  }
}
