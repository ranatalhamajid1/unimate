import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getAcademicInsights } from "@/app/lib/academic-insights";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const insights = await getAcademicInsights(session.userId);

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("Error fetching mobile academic insights:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load insights" },
      { status: 500 }
    );
  }
}
