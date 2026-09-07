import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { updateExamRecord, deleteExamRecord } from "@/app/lib/exams";
import {
  EXAM_TYPES,
  EXAM_STATUSES,
  ExamType,
  ExamStatus,
} from "@/app/lib/exam-definitions";
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
      { success: false, error: "Exam ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.exam.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Exam not found or unauthorized." },
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
    const examDate = body.examDate ? new Date(body.examDate) : existing.examDate;
    const room = String(body.room ?? existing.room).trim();
    const type = String(body.type ?? existing.type).trim().toUpperCase();
    const status = String(body.status ?? existing.status).trim().toUpperCase();
    const preparationProgress = Number(body.preparationProgress ?? existing.preparationProgress);
    const notes = String(body.notes ?? existing.notes).trim();

    if (!title || title.length < 2 || title.length > 100) {
      return NextResponse.json(
        { success: false, error: "Title must be between 2 and 100 characters." },
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

    if (isNaN(examDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid exam date." },
        { status: 400 }
      );
    }

    const validTypes = Object.values(EXAM_TYPES);
    if (!validTypes.includes(type as ExamType)) {
      return NextResponse.json(
        { success: false, error: `Exam type must be one of: ${validTypes.join(", ")}.` },
        { status: 400 }
      );
    }

    const validStatuses = Object.values(EXAM_STATUSES);
    if (!validStatuses.includes(status as ExamStatus)) {
      return NextResponse.json(
        { success: false, error: `Exam status must be one of: ${validStatuses.join(", ")}.` },
        { status: 400 }
      );
    }

    if (isNaN(preparationProgress) || preparationProgress < 0 || preparationProgress > 100) {
      return NextResponse.json(
        { success: false, error: "Preparation progress must be between 0 and 100." },
        { status: 400 }
      );
    }

    const updated = await updateExamRecord(id, session.userId, {
      title,
      courseId,
      examDate,
      room,
      type: type as ExamType,
      status: status as ExamStatus,
      preparationProgress: Math.round(preparationProgress),
      notes,
    });

    return NextResponse.json({ success: true, exam: updated });
  } catch (error) {
    console.error("Error in PUT /api/mobile/exams/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update exam." },
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
      { success: false, error: "Exam ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.exam.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Exam not found or unauthorized." },
        { status: 404 }
      );
    }

    await deleteExamRecord(id, session.userId);
    return NextResponse.json({ success: true, message: "Exam deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/mobile/exams/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam." },
      { status: 500 }
    );
  }
}
