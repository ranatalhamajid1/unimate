import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import {
  getUserTimetable,
  checkTimetableOverlap,
  createTimetableEntryRecord,
} from "@/app/lib/timetable";
import { CLASS_TYPES, timeToMinutes, ClassType } from "@/app/lib/timetable-definitions";
import { getCourseById } from "@/app/lib/courses";

export async function GET(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const entries = await getUserTimetable(session.userId);
    return NextResponse.json({ success: true, timetable: entries });
  } catch (error) {
    console.error("Error in GET /api/mobile/timetable:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch timetable." },
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

    const courseId = String(body.courseId ?? "").trim();
    const dayOfWeek = Number(body.dayOfWeek);
    const startTime = String(body.startTime ?? "").trim();
    const endTime = String(body.endTime ?? "").trim();
    const room = String(body.room ?? "").trim();
    const type = String(body.type ?? "Lecture").trim();

    // 1. Verify course ownership
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required." },
        { status: 400 }
      );
    }
    const course = await getCourseById(courseId, session.userId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Selected course not found or unauthorized." },
        { status: 404 }
      );
    }

    // 2. Day of week (1 to 7)
    if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      return NextResponse.json(
        { success: false, error: "Day of week must be an integer between 1 and 7." },
        { status: 400 }
      );
    }

    // 3. Time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, error: "Start and end times must be in HH:MM format (24h)." },
        { status: 400 }
      );
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time." },
        { status: 400 }
      );
    }

    // 4. Type validation
    if (!CLASS_TYPES.includes(type as ClassType)) {
      return NextResponse.json(
        { success: false, error: `Type must be one of: ${CLASS_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    // 5. Overlap check
    const hasOverlap = await checkTimetableOverlap(session.userId, dayOfWeek, startTime, endTime);
    if (hasOverlap) {
      return NextResponse.json(
        { success: false, error: "Class schedule overlaps with an existing class on this day." },
        { status: 409 }
      );
    }

    const entry = await createTimetableEntryRecord(session.userId, {
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      type,
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/mobile/timetable:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create timetable entry." },
      { status: 500 }
    );
  }
}
