import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import {
  getUserActiveStudyPlan,
  createStudyPlanWithItems,
  acceptAdaptiveStudyPlan,
} from "@/app/lib/study-plans";
import { validateStudyPlanInput } from "@/app/lib/study-plan-definitions";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const activePlan = await getUserActiveStudyPlan(session.userId);

    return NextResponse.json({
      success: true,
      plan: activePlan,
    });
  } catch (error) {
    console.error("Error fetching mobile active study plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load study plan" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { title, startDate, endDate, items } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const validation = validateStudyPlanInput(title, start, end);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Study plan must contain at least one task." },
        { status: 400 }
      );
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.title || typeof it.title !== "string" || it.title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: `Task #${i + 1} must have a valid title.` },
          { status: 400 }
        );
      }
      const sched = new Date(it.scheduledAt);
      if (isNaN(sched.getTime())) {
        return NextResponse.json(
          { success: false, error: `Task #${i + 1} has an invalid scheduled date/time.` },
          { status: 400 }
        );
      }
      const dur = Number(it.duration);
      if (isNaN(dur) || dur <= 0) {
        return NextResponse.json(
          { success: false, error: `Task #${i + 1} duration must be a positive number of minutes.` },
          { status: 400 }
        );
      }
    }

    // Run full server-side revalidation pipeline (ownership, target state, deadlines, collisions)
    const createdPlan = await acceptAdaptiveStudyPlan(session.userId, {
      title: title.trim(),
      startDate: start,
      endDate: end,
      items: items.map((it) => ({
        courseId: it.courseId || null,
        title: it.title.trim(),
        description: it.description?.trim() || "",
        scheduledAt: new Date(it.scheduledAt),
        duration: Math.round(Number(it.duration)),
        targetType: it.targetType || null,
        targetId: it.targetId || null,
      })),
    });

    return NextResponse.json(
      {
        success: true,
        plan: createdPlan,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "An active study plan already exists or was accepted concurrently.",
        },
        { status: 409 }
      );
    }
    console.error("Error creating mobile study plan:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create study plan" },
      { status: 400 }
    );
  }
}
