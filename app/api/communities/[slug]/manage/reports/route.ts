import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { getMemberContext, ReportStatus } from "@/app/lib/communities";

export async function GET(
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
      select: { id: true, visibility: true },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Must be moderator or above in this specific community
    const memberCtx = await getMemberContext(prisma, community.id, auth.userId);
    if (!memberCtx.isModeratorOrAbove) {
      if (community.visibility === "PRIVATE" && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const reports = await prisma.communityReport.findMany({
      where: {
        communityId: community.id,
        ...(statusParam && Object.values(ReportStatus).includes(statusParam as any)
          ? { status: statusParam as any }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("GET manage reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
