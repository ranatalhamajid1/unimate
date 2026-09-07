import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { upsertAttendance } from "@/app/lib/academic";
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
    const totalClasses = Number(body.totalClasses);
    const attendedClasses = Number(body.attendedClasses);

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

    if (isNaN(totalClasses) || totalClasses < 0 || !Number.isInteger(totalClasses)) {
      return NextResponse.json(
        { success: false, error: "Total classes must be a non-negative integer." },
        { status: 400 }
      );
    }

    if (isNaN(attendedClasses) || attendedClasses < 0 || !Number.isInteger(attendedClasses)) {
      return NextResponse.json(
        { success: false, error: "Attended classes must be a non-negative integer." },
        { status: 400 }
      );
    }

    if (attendedClasses > totalClasses) {
      return NextResponse.json(
        { success: false, error: "Attended classes cannot exceed total classes." },
        { status: 400 }
      );
    }

    const attendance = await upsertAttendance(
      session.userId,
      courseId,
      totalClasses,
      attendedClasses
    );

    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error("Error in POST /api/mobile/academics/attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record attendance." },
      { status: 500 }
    );
  }
}
