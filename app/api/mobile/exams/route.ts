import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getUserExams, createExamRecord } from "@/app/lib/exams";
import {
  EXAM_TYPES,
  EXAM_STATUSES,
  ExamType,
  ExamStatus,
  getEffectiveExamStatus,
} from "@/app/lib/exam-definitions";
import { getCourseById } from "@/app/lib/courses";

export async function GET(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const exams = await getUserExams(session.userId);
    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error("Error in GET /api/mobile/exams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams." },
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
    const examDateRaw = String(body.examDate ?? "").trim();
    const room = String(body.room ?? "").trim();
    const type = String(body.type ?? EXAM_TYPES.MIDTERM).trim().toUpperCase();
    const preparationProgress = Number(body.preparationProgress ?? 0);
    const notes = String(body.notes ?? "").trim();

    if (!title || title.length < 2 || title.length > 100) {
      return NextResponse.json(
        { success: false, error: "Title must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

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

    const validTypes = Object.values(EXAM_TYPES);
    if (!validTypes.includes(type as ExamType)) {
      return NextResponse.json(
        { success: false, error: `Exam type must be one of: ${validTypes.join(", ")}.` },
        { status: 400 }
      );
    }

    const examDate = new Date(examDateRaw);
    if (!examDateRaw || isNaN(examDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid exam date." },
        { status: 400 }
      );
    }

    if (isNaN(preparationProgress) || preparationProgress < 0 || preparationProgress > 100) {
      return NextResponse.json(
        { success: false, error: "Preparation progress must be between 0 and 100." },
        { status: 400 }
      );
    }

    const status = getEffectiveExamStatus(examDate);

    const exam = await createExamRecord(session.userId, {
      title,
      courseId,
      examDate,
      room,
      type: type as ExamType,
      status,
      preparationProgress: Math.round(preparationProgress),
      notes,
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/mobile/exams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create exam." },
      { status: 500 }
    );
  }
}
