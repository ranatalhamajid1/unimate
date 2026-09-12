import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { acceptAdaptiveStudyPlan } from "@/app/lib/study-plans";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { title, startDate, endDate, items } = body;
    if (!title || !startDate || !endDate || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Missing required study plan fields." },
        { status: 400 }
      );
    }

    const plan = await acceptAdaptiveStudyPlan(session.userId, {
      title,
      startDate,
      endDate,
      items,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "An active study plan already exists or was accepted concurrently. Please refresh.",
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to accept study plan.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
