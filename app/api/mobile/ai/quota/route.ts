import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getDailyAiUsage } from "@/app/lib/ai-limits";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const usage = await getDailyAiUsage(session.userId);

    return NextResponse.json({
      success: true,
      quota: {
        allowed: usage.allowed,
        currentCount: usage.currentCount,
        limit: usage.limit,
        remaining: usage.remaining,
        plan: usage.plan,
        dateKey: usage.dateKey,
      },
    });
  } catch (error) {
    console.error("Error fetching mobile AI quota:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load AI quota" },
      { status: 500 }
    );
  }
}
