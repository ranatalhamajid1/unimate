import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  MemberRole,
  MembershipStatus,
  getMemberContext,
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
      select: { id: true, name: true, visibility: true },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const callerCtx = await getMemberContext(prisma, community.id, auth.userId);
    if (!callerCtx.isOwner) {
      if (community.visibility === "PRIVATE" && !callerCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Forbidden. Only the community owner can transfer ownership." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { targetUserId } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === auth.userId) {
      return NextResponse.json({ error: "Cannot transfer ownership to yourself" }, { status: 400 });
    }

    const targetMember = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    });

    if (!targetMember || targetMember.status !== MembershipStatus.ACTIVE) {
      return NextResponse.json(
        { error: "Target user must be an active member of this community" },
        { status: 400 }
      );
    }

    // Execute atomic transfer in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Demote current owner to ADMIN
      await tx.communityMember.update({
        where: { id: callerCtx.member.id },
        data: { role: MemberRole.ADMIN },
      });

      // 2. Promote target to OWNER
      await tx.communityMember.update({
        where: { id: targetMember.id },
        data: { role: MemberRole.OWNER },
      });

      // 3. Update community createdByUserId
      await tx.community.update({
        where: { id: community.id },
        data: { createdByUserId: targetUserId },
      });
    });

    return NextResponse.json({ message: "Ownership successfully transferred" });
  } catch (error) {
    console.error("POST transfer ownership error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
