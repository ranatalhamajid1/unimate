import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { getMemberContext, ReportStatus } from "@/app/lib/communities";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const community = await prisma.community.findUnique({
      where: { slug },
      select: { id: true, visibility: true },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const memberCtx = await getMemberContext(prisma, community.id, auth.userId);
    if (!memberCtx.isModeratorOrAbove) {
      if (community.visibility === "PRIVATE" && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify report exists and belongs strictly to THIS community
    const report = await prisma.communityReport.findFirst({
      where: { id, communityId: community.id },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, resolutionNotes } = body;

    if (
      !status ||
      (status !== ReportStatus.RESOLVED &&
        status !== ReportStatus.DISMISSED &&
        status !== ReportStatus.REVIEWING)
    ) {
      return NextResponse.json(
        { error: "Valid status (REVIEWING, RESOLVED, or DISMISSED) is required." },
        { status: 400 }
      );
    }

    if (resolutionNotes && (typeof resolutionNotes !== "string" || resolutionNotes.length > 1000)) {
      return NextResponse.json(
        { error: "Resolution notes cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    const updated = await prisma.communityReport.update({
      where: { id },
      data: {
        status,
        resolutionNotes: resolutionNotes ? resolutionNotes.trim() : null,
        resolvedByUserId: auth.userId,
        resolvedAt: status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED ? new Date() : null,
      },
    });

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error("PATCH report resolution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
