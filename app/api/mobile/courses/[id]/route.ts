import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { updateCourseRecord, deleteCourseRecord, getCourseById } from "@/app/lib/courses";
import { DEFAULT_COURSE_COLOR } from "@/app/lib/course-definitions";

export async function PUT(
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
      { success: false, error: "Course ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await getCourseById(id, session.userId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Course not found or unauthorized." },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const name = String(body.name ?? existing.name).trim();
    const code = String(body.code ?? existing.code).trim().toUpperCase();
    const instructor = String(body.instructor ?? existing.instructor).trim();
    const creditHours = Number(body.creditHours ?? existing.creditHours);
    const semester = String(body.semester ?? existing.semester).trim();
    const color = String(body.color ?? existing.color).trim();

    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: "Course name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    if (!code || code.length < 2 || code.length > 20) {
      return NextResponse.json(
        { success: false, error: "Course code must be between 2 and 20 characters." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(creditHours) || creditHours < 1 || creditHours > 6) {
      return NextResponse.json(
        { success: false, error: "Credit hours must be an integer between 1 and 6." },
        { status: 400 }
      );
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const validatedColor = hexColorRegex.test(color) ? color : DEFAULT_COURSE_COLOR;

    const course = await updateCourseRecord(id, session.userId, {
      name,
      code,
      instructor,
      creditHours,
      semester,
      color: validatedColor,
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error("Error in PUT /api/mobile/courses/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update course." },
      { status: 500 }
    );
  }
}

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
      { success: false, error: "Course ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await getCourseById(id, session.userId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Course not found or unauthorized." },
        { status: 404 }
      );
    }

    await deleteCourseRecord(id, session.userId);
    return NextResponse.json({ success: true, message: "Course deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/mobile/courses/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete course." },
      { status: 500 }
    );
  }
}
