import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { upsertStudentGoal, deleteStudentGoal } from "@/app/lib/goals";
import { GoalType, GoalPeriod, validateGoalInput } from "@/app/lib/goal-definitions";
import { prisma } from "@/app/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Goal ID is required." },
        { status: 400 }
      );
    }

    // Verify existing goal belongs to user
    const existing = await prisma.studentGoal.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Goal not found or unauthorized." },
        { status: 404 }
      );
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

    const { targetValue, period } = body;
    const num = Number(targetValue);
    if (isNaN(num)) {
      return NextResponse.json(
        { success: false, error: "Target value must be a valid number." },
        { status: 400 }
      );
    }

    const validation = validateGoalInput(existing.type, num);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const updated = await upsertStudentGoal(
      session.userId,
      existing.type as GoalType,
      num,
      (period || existing.period) as GoalPeriod
    );

    return NextResponse.json({
      success: true,
      goal: updated,
    });
  } catch (error: any) {
    console.error("Error updating mobile goal:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Goal ID is required." },
        { status: 400 }
      );
    }

    await deleteStudentGoal(session.userId, id);

    return NextResponse.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting mobile goal:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete goal" },
      { status: 404 }
    );
  }
}
