import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  MemberRole,
  MembershipStatus,
  AIRGAPPED_USER_SELECT,
  sanitizeMemberUser,
} from "@/app/lib/communities";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { slug, memberId } = await params;
    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            members: {
              where: { status: MembershipStatus.ACTIVE },
            },
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Caller membership
    const callerMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: auth.userId,
        },
      },
    });

    if (!callerMembership || callerMembership.status !== MembershipStatus.ACTIVE) {
      return NextResponse.json(
        { error: "You are not an active member of this community." },
        { status: 403 }
      );
    }

    // Target member
    const targetMember = await prisma.communityMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: AIRGAPPED_USER_SELECT },
      },
    });

    if (!targetMember || targetMember.communityId !== community.id) {
      return NextResponse.json({ error: "Target member not found in community" }, { status: 404 });
    }

    const body = await req.json();
    const { role, status } = body;

    // 1. Role Change / Ownership Transfer
    if (role !== undefined) {
      if (!Object.values(MemberRole).includes(role)) {
        return NextResponse.json({ error: "Invalid member role" }, { status: 400 });
      }

      // Ownership transfer
      if (role === MemberRole.OWNER) {
        if (callerMembership.role !== MemberRole.OWNER) {
          return NextResponse.json(
            { error: "Only the current community owner can transfer ownership." },
            { status: 403 }
          );
        }

        if (targetMember.status !== MembershipStatus.ACTIVE) {
          return NextResponse.json(
            { error: "Ownership can only be transferred to an active member." },
            { status: 400 }
          );
        }

        if (targetMember.userId === callerMembership.userId) {
          return NextResponse.json(
            { error: "You are already the owner of this community." },
            { status: 400 }
          );
        }

        // Atomic ownership transfer
        const result = await prisma.$transaction(async (tx) => {
          // Demote caller to ADMIN
          await tx.communityMember.update({
            where: { id: callerMembership.id },
            data: { role: MemberRole.ADMIN },
          });

          // Promote target to OWNER
          const updatedTarget = await tx.communityMember.update({
            where: { id: targetMember.id },
            data: { role: MemberRole.OWNER },
            include: { user: { select: AIRGAPPED_USER_SELECT } },
          });

          // Update community createdByUserId
          await tx.community.update({
            where: { id: community.id },
            data: { createdByUserId: targetMember.userId },
          });

          return updatedTarget;
        });

        return NextResponse.json({
          message: "Ownership successfully transferred",
          member: {
            id: result.id,
            role: result.role,
            status: result.status,
            user: sanitizeMemberUser(result.user),
          },
        });
      }

      // Other role changes (ADMIN, MODERATOR, MEMBER)
      // Only OWNER or ADMIN can change roles
      if (callerMembership.role !== MemberRole.OWNER && callerMembership.role !== MemberRole.ADMIN) {
        return NextResponse.json(
          { error: "You do not have permission to change member roles." },
          { status: 403 }
        );
      }

      // Cannot change role of OWNER
      if (targetMember.role === MemberRole.OWNER) {
        return NextResponse.json(
          { error: "The owner's role cannot be modified. Transfer ownership instead." },
          { status: 403 }
        );
      }

      // ADMIN cannot change another ADMIN or promote someone to ADMIN
      if (callerMembership.role === MemberRole.ADMIN) {
        if (targetMember.role === MemberRole.ADMIN) {
          return NextResponse.json(
            { error: "Administrators cannot modify other administrators." },
            { status: 403 }
          );
        }
        if (role === MemberRole.ADMIN) {
          return NextResponse.json(
            { error: "Only the community owner can promote members to Administrator." },
            { status: 403 }
          );
        }
      }

      const updated = await prisma.communityMember.update({
        where: { id: targetMember.id },
        data: { role },
        include: { user: { select: AIRGAPPED_USER_SELECT } },
      });

      return NextResponse.json({
        message: "Member role updated successfully",
        member: {
          id: updated.id,
          role: updated.role,
          status: updated.status,
          user: sanitizeMemberUser(updated.user),
        },
      });
    }

    // 2. Status Change (Approval, Ban, Reactivation)
    if (status !== undefined) {
      if (!Object.values(MembershipStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid membership status" }, { status: 400 });
      }

      // Target is OWNER: status cannot be modified
      if (targetMember.role === MemberRole.OWNER) {
        return NextResponse.json(
          { error: "The community owner cannot be banned or suspended." },
          { status: 403 }
        );
      }

      // Approving pending member
      if (status === MembershipStatus.ACTIVE && targetMember.status === MembershipStatus.PENDING) {
        if (!([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MODERATOR] as MemberRole[]).includes(callerMembership.role)) {
          return NextResponse.json(
            { error: "Only community moderators and administrators can approve membership requests." },
            { status: 403 }
          );
        }

        const currentMemberCount = (community as any)._count?.members ?? 0;
        if (currentMemberCount >= community.maxMembers) {
          return NextResponse.json(
            { error: "Cannot approve request: community has reached maximum member limit." },
            { status: 400 }
          );
        }
      }

      // Banning member
      if (status === MembershipStatus.BANNED) {
        if (!([MemberRole.OWNER, MemberRole.ADMIN] as MemberRole[]).includes(callerMembership.role)) {
          return NextResponse.json(
            { error: "Only the owner and administrators can ban members." },
            { status: 403 }
          );
        }

        if (callerMembership.role === MemberRole.ADMIN && targetMember.role === MemberRole.ADMIN) {
          return NextResponse.json(
            { error: "Administrators cannot ban fellow administrators." },
            { status: 403 }
          );
        }
      }

      const updated = await prisma.communityMember.update({
        where: { id: targetMember.id },
        data: { status },
        include: { user: { select: AIRGAPPED_USER_SELECT } },
      });

      return NextResponse.json({
        message: `Member status updated to ${status}`,
        member: {
          id: updated.id,
          role: updated.role,
          status: updated.status,
          user: sanitizeMemberUser(updated.user),
        },
      });
    }

    return NextResponse.json({ error: "No valid role or status update provided" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/communities/[slug]/members/[memberId] error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { slug, memberId } = await params;
    const community = await prisma.community.findUnique({
      where: { slug },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const callerMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: auth.userId,
        },
      },
    });

    if (!callerMembership || callerMembership.status !== MembershipStatus.ACTIVE) {
      return NextResponse.json(
        { error: "You are not an active member of this community." },
        { status: 403 }
      );
    }

    const targetMember = await prisma.communityMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.communityId !== community.id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Protection: cannot remove OWNER
    if (targetMember.role === MemberRole.OWNER) {
      return NextResponse.json(
        { error: "The community owner cannot be removed." },
        { status: 403 }
      );
    }

    // Removing self
    if (targetMember.userId === callerMembership.userId) {
      await prisma.communityMember.delete({ where: { id: targetMember.id } });
      return NextResponse.json({ message: "Successfully left the community" });
    }

    // Removing someone else requires OWNER or ADMIN
    if (callerMembership.role !== MemberRole.OWNER && callerMembership.role !== MemberRole.ADMIN) {
      return NextResponse.json(
        { error: "You do not have permission to remove members." },
        { status: 403 }
      );
    }

    // ADMIN cannot remove another ADMIN
    if (callerMembership.role === MemberRole.ADMIN && targetMember.role === MemberRole.ADMIN) {
      return NextResponse.json(
        { error: "Administrators cannot remove other administrators." },
        { status: 403 }
      );
    }

    await prisma.communityMember.delete({
      where: { id: targetMember.id },
    });

    return NextResponse.json({ message: "Member removed from community successfully" });
  } catch (error: any) {
    console.error("DELETE /api/communities/[slug]/members/[memberId] error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
