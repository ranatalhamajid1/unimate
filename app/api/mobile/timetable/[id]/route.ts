import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import {
  checkTimetableOverlap,
  updateTimetableEntryRecord,
  deleteTimetableEntryRecord,
} from "@/app/lib/timetable";
import { CLASS_TYPES, timeToMinutes, ClassType } from "@/app/lib/timetable-definitions";
import { getCourseById } from "@/app/lib/courses";
import { prisma } from "@/app/lib/prisma";

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
      { success: false, error: "Entry ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.timetableEntry.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Timetable entry not found or unauthorized." },
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

    const courseId = String(body.courseId ?? existing.courseId).trim();
    const dayOfWeek = Number(body.dayOfWeek ?? existing.dayOfWeek);
    const startTime = String(body.startTime ?? existing.startTime).trim();
    const endTime = String(body.endTime ?? existing.endTime).trim();
    const room = String(body.room ?? existing.room).trim();
    const type = String(body.type ?? existing.type).trim();

    const course = await getCourseById(courseId, session.userId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found or unauthorized." },
        { status: 404 }
      );
    }

    if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      return NextResponse.json(
        { success: false, error: "Day of week must be between 1 and 7." },
        { status: 400 }
      );
    }

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

    if (!CLASS_TYPES.includes(type as ClassType)) {
      return NextResponse.json(
        { success: false, error: `Type must be one of: ${CLASS_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    const hasOverlap = await checkTimetableOverlap(session.userId, dayOfWeek, startTime, endTime, id);
    if (hasOverlap) {
      return NextResponse.json(
        { success: false, error: "Class schedule overlaps with an existing class on this day." },
        { status: 409 }
      );
    }

    const updated = await updateTimetableEntryRecord(id, session.userId, {
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      type,
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    console.error("Error in PUT /api/mobile/timetable/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update timetable entry." },
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
      { success: false, error: "Entry ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.timetableEntry.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Timetable entry not found or unauthorized." },
        { status: 404 }
      );
    }

    await deleteTimetableEntryRecord(id, session.userId);
    return NextResponse.json({ success: true, message: "Timetable entry deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/mobile/timetable/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete timetable entry." },
      { status: 500 }
    );
  }
}
