import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getUserCourses, createCourseRecord } from "@/app/lib/courses";
import { DEFAULT_COURSE_COLOR } from "@/app/lib/course-definitions";

export async function GET(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const courses = await getUserCourses(session.userId);
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error("Error in GET /api/mobile/courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();
    const instructor = String(body.instructor ?? "").trim();
    const creditHours = Number(body.creditHours);
    const semester = String(body.semester ?? "").trim();
    const color = String(body.color ?? DEFAULT_COURSE_COLOR).trim();

    // Validation
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

    const course = await createCourseRecord(session.userId, {
      name,
      code,
      instructor,
      creditHours,
      semester,
      color: validatedColor,
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/mobile/courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create course." },
      { status: 500 }
    );
  }
}
