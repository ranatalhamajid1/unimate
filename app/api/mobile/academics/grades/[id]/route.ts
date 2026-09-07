import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { deleteCourseGrade } from "@/app/lib/academic";
import { prisma } from "@/app/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Grade ID or Course ID is required." },
      { status: 400 }
    );
  }

  try {
    const gradeRecord = await prisma.courseGrade.findFirst({
      where: {
        OR: [
          { id, userId: session.userId },
          { courseId: id, userId: session.userId },
        ],
      },
    });

    if (!gradeRecord) {
      return NextResponse.json(
        { success: false, error: "Grade record not found or unauthorized." },
        { status: 404 }
      );
    }

    await deleteCourseGrade(session.userId, gradeRecord.courseId);
    return NextResponse.json({ success: true, message: "Grade removed successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/mobile/academics/grades/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete grade." },
      { status: 500 }
    );
  }
}
