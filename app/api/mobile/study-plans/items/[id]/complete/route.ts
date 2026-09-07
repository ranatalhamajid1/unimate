import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { toggleStudyPlanItemCompleted } from "@/app/lib/study-plans";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required." },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const completed = Boolean(body.completed);
    const autoLogSession = body.autoLogSession !== false;

    await toggleStudyPlanItemCompleted(
      session.userId,
      id,
      completed,
      autoLogSession
    );

    return NextResponse.json({
      success: true,
      completed,
      sessionLogged: completed && autoLogSession,
    });
  } catch (error: any) {
    console.error("Error toggling mobile study plan item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update study plan item" },
      { status: 400 }
    );
  }
}
