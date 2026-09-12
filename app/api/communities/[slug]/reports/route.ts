import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  ReportTargetType,
  ReportReason,
  ReportStatus,
  getMemberContext,
  checkCommunityVisibilityAccess,
  validateReportTarget,
} from "@/app/lib/communities";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const community = await prisma.community.findUnique({
      where: { slug },
      select: {
        id: true,
        visibility: true,
        campusId: true,
      },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const callerUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { campusId: true },
    });
    const memberCtx = await getMemberContext(prisma, community.id, auth.userId);
    const access = checkCommunityVisibilityAccess(community, callerUser, memberCtx);

    if (!access.allowed) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetType, targetId, reason, description } = body;

    // Validate enum values
    if (!targetType || !Object.values(ReportTargetType).includes(targetType)) {
      return NextResponse.json({ error: "Valid targetType is required." }, { status: 400 });
    }
    if (!targetId || typeof targetId !== "string" || targetId.trim().length === 0) {
      return NextResponse.json({ error: "targetId is required." }, { status: 400 });
    }
    if (!reason || !Object.values(ReportReason).includes(reason)) {
      return NextResponse.json({ error: "Valid report reason is required." }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Description is required (at least 5 characters)." },
        { status: 400 }
      );
    }
    if (description.trim().length > 1000) {
      return NextResponse.json(
        { error: "Description cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    // Security Invariant: target must verifiably belong to this community
    const targetValidation = await validateReportTarget(
      prisma,
      community.id,
      targetType,
      targetId.trim()
    );

    if (!targetValidation.valid) {
      return NextResponse.json(
        { error: targetValidation.error || "Report target does not belong to this community." },
        { status: 400 }
      );
    }

    // Anti-Spam Deduplication: Check for existing PENDING report by this user on this target
    const existingPending = await prisma.communityReport.findFirst({
      where: {
        reporterUserId: auth.userId,
        targetType,
        targetId: targetId.trim(),
        status: ReportStatus.PENDING,
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have an active pending report for this item." },
        { status: 409 }
      );
    }

    const report = await prisma.communityReport.create({
      data: {
        communityId: community.id,
        reporterUserId: auth.userId,
        targetType,
        targetId: targetId.trim(),
        reason,
        description: description.trim(),
        status: ReportStatus.PENDING,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("POST report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
