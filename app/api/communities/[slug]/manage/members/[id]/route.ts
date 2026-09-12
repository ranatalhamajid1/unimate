import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityVisibility,
  MemberRole,
  MembershipStatus,
  getMemberContext,
  dispatchCommunityNotification,
} from "@/app/lib/communities";

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
      select: { id: true, name: true, visibility: true },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const callerCtx = await getMemberContext(prisma, community.id, auth.userId);
    if (!callerCtx.isModeratorOrAbove) {
      if (community.visibility === CommunityVisibility.PRIVATE && !callerCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetMember = await prisma.communityMember.findFirst({
      where: { id, communityId: community.id },
    });
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found in this community" }, { status: 404 });
    }

    // Protection: Cannot mutate owner
    if (targetMember.role === MemberRole.OWNER) {
      return NextResponse.json({ error: "Cannot modify the community owner" }, { status: 403 });
    }

    // Protection: Only OWNER can modify or change role/status of an ADMIN
    if (targetMember.role === MemberRole.ADMIN && !callerCtx.isOwner) {
      return NextResponse.json(
        { error: "Only the community owner can modify administrators" },
        { status: 403 }
      );
    }

    // Protection: Moderator cannot modify other moderators or administrators
    if (
      !callerCtx.isAdminOrAbove &&
      (targetMember.role === MemberRole.ADMIN || targetMember.role === MemberRole.MODERATOR)
    ) {
      return NextResponse.json(
        { error: "Moderators cannot modify other moderators or administrators" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { role, status } = body;
    const updateData: any = {};

    // Role assignment rules
    if (role !== undefined) {
      if (!Object.values(MemberRole).includes(role)) {
        return NextResponse.json({ error: "Invalid member role" }, { status: 400 });
      }

      if (role === MemberRole.OWNER) {
        return NextResponse.json(
          { error: "Use transfer-ownership to transfer community ownership" },
          { status: 400 }
        );
      }

      // Admin can only assign up to MODERATOR; Owner can assign ADMIN
      if (role === MemberRole.ADMIN && !callerCtx.isOwner) {
        return NextResponse.json(
          { error: "Only the community owner can promote members to Admin" },
          { status: 403 }
        );
      }

      if (!callerCtx.isAdminOrAbove) {
        return NextResponse.json(
          { error: "Moderators cannot change member roles" },
          { status: 403 }
        );
      }

      updateData.role = role;
    }

    // Status assignment rules (Approve / Ban / Unban)
    if (status !== undefined) {
      if (!Object.values(MembershipStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid membership status" }, { status: 400 });
      }

      // Check if approving pending member
      const isApproving = targetMember.status === MembershipStatus.PENDING && status === MembershipStatus.ACTIVE;
      updateData.status = status;

      const updated = await prisma.communityMember.update({
        where: { id },
        data: updateData,
      });

      if (isApproving) {
        await dispatchCommunityNotification(prisma, {
          communityId: community.id,
          type: "COMMUNITY_MEMBERSHIP_APPROVED",
          title: `Membership approved in ${community.name}`,
          message: `Your request to join ${community.name} has been approved. Welcome!`,
          relatedId: community.id,
          initiatingUserId: auth.userId,
          targetUserId: targetMember.userId,
        });
      }

      return NextResponse.json({ member: updated });
    }

    const updated = await prisma.communityMember.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("PATCH member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
