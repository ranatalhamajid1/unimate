import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import {
  getUserGoals,
  upsertStudentGoal,
  calculateStudentGoalsProgress,
} from "@/app/lib/goals";
import { GoalType, GoalPeriod, validateGoalInput } from "@/app/lib/goal-definitions";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    const [goals, progress] = await Promise.all([
      getUserGoals(session.userId),
      calculateStudentGoalsProgress(session.userId),
    ]);

    return NextResponse.json({
      success: true,
      goals,
      progress,
    });
  } catch (error) {
    console.error("Error fetching mobile goals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load goals" },
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

    const { type, targetValue, period } = body;

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { success: false, error: "Goal type is required." },
        { status: 400 }
      );
    }

    const num = Number(targetValue);
    if (isNaN(num)) {
      return NextResponse.json(
        { success: false, error: "Target value must be a valid number." },
        { status: 400 }
      );
    }

    const validation = validateGoalInput(type, num);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const goal = await upsertStudentGoal(
      session.userId,
      type as GoalType,
      num,
      period as GoalPeriod
    );

    return NextResponse.json({
      success: true,
      goal,
    });
  } catch (error: any) {
    console.error("Error saving mobile goal:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save goal" },
      { status: 500 }
    );
  }
}
