import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { deleteStudyPlan } from "@/app/lib/study-plans";
import { prisma } from "@/app/lib/prisma";
import { StudyPlanData, StudyPlanItemData } from "@/app/lib/study-plan-definitions";

export async function GET(
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
        { success: false, error: "Study plan ID is required." },
        { status: 400 }
      );
    }

    const plan = await prisma.studyPlan.findFirst({
      where: { id, userId: session.userId },
      include: {
        items: {
          include: {
            course: {
              select: { id: true, name: true, code: true, color: true },
            },
          },
          orderBy: [{ scheduledAt: "asc" }, { order: "asc" }],
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Study plan not found or unauthorized." },
        { status: 404 }
      );
    }

    const totalDuration = plan.items.reduce((acc, it) => acc + it.duration, 0);
    const completedDuration = plan.items
      .filter((it) => it.completed)
      .reduce((acc, it) => acc + it.duration, 0);
    const progress =
      plan.items.length > 0
        ? Math.round(
            (plan.items.filter((it) => it.completed).length /
              plan.items.length) *
              100
          )
        : 0;

    const planData: StudyPlanData = {
      id: plan.id,
      userId: plan.userId,
      title: plan.title,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      items: plan.items as StudyPlanItemData[],
      progressPercentage: progress,
      totalDurationMinutes: totalDuration,
      completedDurationMinutes: completedDuration,
    };

    return NextResponse.json({
      success: true,
      plan: planData,
    });
  } catch (error) {
    console.error("Error fetching mobile study plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load study plan" },
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
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Study plan ID is required." },
        { status: 400 }
      );
    }

    await deleteStudyPlan(session.userId, id);

    return NextResponse.json({
      success: true,
      message: "Study plan deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting mobile study plan:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete study plan" },
      { status: 404 }
    );
  }
}
