import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getUserAssignments, createAssignmentRecord } from "@/app/lib/assignments";
import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_STATUSES,
  AssignmentPriority,
  AssignmentStatus,
} from "@/app/lib/assignment-definitions";
import { getCourseById } from "@/app/lib/courses";

export async function GET(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const assignments = await getUserAssignments(session.userId);
    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error("Error in GET /api/mobile/assignments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assignments." },
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

    const title = String(body.title ?? "").trim();
    const courseId = String(body.courseId ?? "").trim();
    const description = String(body.description ?? "").trim();
    const dueDateRaw = String(body.dueDate ?? "").trim();
    const priority = String(body.priority ?? ASSIGNMENT_PRIORITIES.MEDIUM).trim().toUpperCase();
    const status = String(body.status ?? ASSIGNMENT_STATUSES.NOT_STARTED).trim().toUpperCase();

    if (!title || title.length < 2 || title.length > 120) {
      return NextResponse.json(
        { success: false, error: "Title must be between 2 and 120 characters." },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Please select a course." },
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

    const dueDate = new Date(dueDateRaw);
    if (!dueDateRaw || isNaN(dueDate.getTime())) {
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

    const assignment = await createAssignmentRecord(session.userId, {
      title,
      courseId,
      description,
      dueDate,
      priority: priority as AssignmentPriority,
      status: status as AssignmentStatus,
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/mobile/assignments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create assignment." },
      { status: 500 }
    );
  }
}
