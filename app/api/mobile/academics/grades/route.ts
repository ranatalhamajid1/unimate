import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { upsertCourseGrade } from "@/app/lib/academic";
import { GRADE_OPTIONS, GradeOption } from "@/app/lib/academic-definitions";
import { getCourseById } from "@/app/lib/courses";

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

    const courseId = String(body.courseId ?? "").trim();
    const grade = String(body.grade ?? "").trim().toUpperCase();

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required." },
        { status: 400 }
      );
    }

    const course = await getCourseById(courseId, session.userId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found or unauthorized." },
        { status: 404 }
      );
    }

    if (!GRADE_OPTIONS.includes(grade as GradeOption)) {
      return NextResponse.json(
        { success: false, error: `Grade must be one of: ${GRADE_OPTIONS.join(", ")}.` },
        { status: 400 }
      );
    }

    const gradeRecord = await upsertCourseGrade(session.userId, courseId, grade);
    return NextResponse.json({ success: true, grade: gradeRecord });
  } catch (error) {
    console.error("Error in POST /api/mobile/academics/grades:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record grade." },
      { status: 500 }
    );
  }
}
