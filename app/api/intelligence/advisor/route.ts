import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  getAcademicAdvisorOverview,
  generateAcademicAdvisorAIReport,
} from "@/app/lib/intelligence/academic-advisor";

/**
 * GET /api/intelligence/advisor
 * Tier 1: Deterministic Academic Advisor Overview.
 * ZERO AI quota consumed. Fully functional offline or without Gemini API key.
 * Authenticated via resolveAuth (Cookie session or Mobile Bearer JWT).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawThreshold = parseFloat(searchParams.get("threshold") || "0.75");
    const threshold = Number.isFinite(rawThreshold) && rawThreshold >= 0.5 && rawThreshold <= 0.95
      ? rawThreshold
      : 0.75;

    const overview = await getAcademicAdvisorOverview(auth.userId, { threshold });

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Error in GET /api/intelligence/advisor:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intelligence/advisor
 * Tier 2: User-triggered on-demand Gemini AI Academic Advisor synthesis.
 * Checks rate-limits and daily quotas. Gracefully falls back to deterministic analysis.
 * Authenticated via resolveAuth (Cookie session or Mobile Bearer JWT).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const focusArea = typeof body.focusArea === "string" ? body.focusArea : undefined;
    const rawThreshold = typeof body.threshold === "number" ? body.threshold : 0.75;
    const threshold = Number.isFinite(rawThreshold) && rawThreshold >= 0.5 && rawThreshold <= 0.95
      ? rawThreshold
      : 0.75;

    const report = await generateAcademicAdvisorAIReport(auth.userId, {
      focusArea,
      threshold,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error in POST /api/intelligence/advisor:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
