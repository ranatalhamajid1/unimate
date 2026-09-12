import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityVisibility,
  MemberRole,
  MembershipStatus,
  AIRGAPPED_USER_SELECT,
  sanitizeMemberUser,
} from "@/app/lib/communities";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await resolveAuth(req);
    const { slug } = await params;
    const { searchParams } = new URL(req.url);

    const community = await prisma.community.findUnique({
      where: { slug },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    let callerMembership: any = null;
    let callerUser: any = null;

    if (auth) {
      callerUser = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { id: true, campusId: true },
      });

      callerMembership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: auth.userId,
          },
        },
      });
    }

    const isActiveMember = callerMembership?.status === MembershipStatus.ACTIVE;

    // Visibility & Enumeration protection
    if (community.visibility === CommunityVisibility.PRIVATE && !isActiveMember) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (
      community.visibility === CommunityVisibility.CAMPUS_ONLY &&
      !isActiveMember &&
      (!callerUser || callerUser.campusId !== community.campusId)
    ) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const requestedStatus = searchParams.get("status") as MembershipStatus | null;
    let filterStatus: MembershipStatus = MembershipStatus.ACTIVE;

    const isStaff =
      callerMembership &&
      callerMembership.status === MembershipStatus.ACTIVE &&
      [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MODERATOR].includes(callerMembership.role);

    if (requestedStatus && Object.values(MembershipStatus).includes(requestedStatus)) {
      if (
        requestedStatus !== MembershipStatus.ACTIVE &&
        !isStaff
      ) {
        return NextResponse.json(
          { error: "Only community moderators and administrators can view pending or banned lists." },
          { status: 403 }
        );
      }
      filterStatus = requestedStatus;
    }

    const members = await prisma.communityMember.findMany({
      where: {
        communityId: community.id,
        status: filterStatus,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        status: true,
        createdAt: true,
        user: {
          select: AIRGAPPED_USER_SELECT,
        },
      },
    });

    const sanitizedMembers = members.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      joinedAt: m.createdAt,
      user: sanitizeMemberUser(m.user),
    }));

    return NextResponse.json({ members: sanitizedMembers });
  } catch (error: any) {
    console.error("GET /api/communities/[slug]/members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
