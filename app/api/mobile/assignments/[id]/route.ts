import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { updateAssignmentRecord, deleteAssignmentRecord } from "@/app/lib/assignments";
import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_STATUSES,
  AssignmentPriority,
  AssignmentStatus,
} from "@/app/lib/assignment-definitions";
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
      { success: false, error: "Assignment ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.assignment.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found or unauthorized." },
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

    const title = String(body.title ?? existing.title).trim();
    const courseId = String(body.courseId ?? existing.courseId).trim();
    const description = String(body.description ?? existing.description).trim();
    const dueDate = body.dueDate ? new Date(body.dueDate) : existing.dueDate;
    const priority = String(body.priority ?? existing.priority).trim().toUpperCase();
    const status = String(body.status ?? existing.status).trim().toUpperCase();

    if (!title || title.length < 2 || title.length > 120) {
      return NextResponse.json(
        { success: false, error: "Title must be between 2 and 120 characters." },
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

    if (isNaN(dueDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid due date." },
        { status: 400 }
      );
    }

    const validPriorities = Object.values(ASSIGNMENT_PRIORITIES);
    if (!validPriorities.includes(priority as AssignmentPriority)) {
      return NextResponse.json(
        { success: false, error: `Priority must be one of: ${validPriorities.join(", ")}.` },
        { status: 400 }
      );
    }

    const validStatuses = Object.values(ASSIGNMENT_STATUSES);
    if (!validStatuses.includes(status as AssignmentStatus)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${validStatuses.join(", ")}.` },
        { status: 400 }
      );
    }

    const updated = await updateAssignmentRecord(id, session.userId, {
      title,
      courseId,
      description,
      dueDate,
      priority: priority as AssignmentPriority,
      status: status as AssignmentStatus,
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error) {
    console.error("Error in PUT /api/mobile/assignments/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update assignment." },
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
      { success: false, error: "Assignment ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.assignment.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found or unauthorized." },
        { status: 404 }
      );
    }

    await deleteAssignmentRecord(id, session.userId);
    return NextResponse.json({ success: true, message: "Assignment deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/mobile/assignments/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete assignment." },
      { status: 500 }
    );
  }
}
