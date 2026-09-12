import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { getUserActiveStudyPlan } from "@/app/lib/study-plans";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const plan = await getUserActiveStudyPlan(session.userId);
    return NextResponse.json({ success: true, plan });
  } catch (error: unknown) {
    console.error("Error in GET /api/study-plans/current:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch study plan.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
