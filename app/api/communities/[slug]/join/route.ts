import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityVisibility,
  MemberRole,
  MembershipStatus,
} from "@/app/lib/communities";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { slug } = await params;
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

    // Slug enumeration protection for PRIVATE communities
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: auth.userId,
        },
      },
    });

    if (community.visibility === CommunityVisibility.PRIVATE && !existingMembership) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, universityId: true, campusId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // CAMPUS_ONLY isolation check
    if (
      community.visibility === CommunityVisibility.CAMPUS_ONLY &&
      user.campusId !== community.campusId
    ) {
      return NextResponse.json(
        { error: "This community is only open to students of this specific campus." },
        { status: 403 }
      );
    }

    // Check banned status (banned users cannot rejoin)
    if (existingMembership) {
      if (existingMembership.status === MembershipStatus.BANNED) {
        return NextResponse.json(
          { error: "You have been banned from this community and cannot rejoin." },
          { status: 403 }
        );
      }
      if (existingMembership.status === MembershipStatus.ACTIVE) {
        return NextResponse.json(
          { error: "You are already an active member of this community." },
          { status: 400 }
        );
      }
      if (existingMembership.status === MembershipStatus.PENDING) {
        return NextResponse.json(
          { error: "Your membership request is currently pending approval." },
          { status: 400 }
        );
      }
    }

    // Capacity limit check
    const currentMemberCount = (community as any)._count?.members ?? 0;
    if (currentMemberCount >= community.maxMembers) {
      return NextResponse.json(
        { error: "This community has reached its maximum member capacity." },
        { status: 400 }
      );
    }

    const initialStatus = community.requiresApproval
      ? MembershipStatus.PENDING
      : MembershipStatus.ACTIVE;

    const member = await prisma.$transaction(async (tx) => {
      if (existingMembership) {
        return tx.communityMember.update({
          where: { id: existingMembership.id },
          data: {
            status: initialStatus,
            role: MemberRole.MEMBER,
          },
        });
      }

      return tx.communityMember.create({
        data: {
          communityId: community.id,
          userId: auth.userId,
          role: MemberRole.MEMBER,
          status: initialStatus,
        },
      });
    });

    return NextResponse.json({
      message:
        initialStatus === MembershipStatus.ACTIVE
          ? "Successfully joined community"
          : "Membership request submitted and pending approval",
      status: member.status,
      role: member.role,
    });
  } catch (error: any) {
    console.error("POST /api/communities/[slug]/join error:", error);
    return NextResponse.json({ error: "Failed to join community" }, { status: 500 });
  }
}
