import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { MemberRole, MembershipStatus } from "@/app/lib/communities";

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
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: auth.userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      return NextResponse.json(
        { error: "You are not an active member of this community." },
        { status: 400 }
      );
    }

    // Owner protection rule: Owner cannot leave if other active members exist without transferring ownership
    if (membership.role === MemberRole.OWNER) {
      const otherActiveMembersCount = await prisma.communityMember.count({
        where: {
          communityId: community.id,
          status: MembershipStatus.ACTIVE,
          userId: { not: auth.userId },
        },
      });

      if (otherActiveMembersCount > 0) {
        return NextResponse.json(
          {
            error:
              "As the owner, you cannot leave the community without transferring ownership to another member first.",
          },
          { status: 400 }
        );
      }
    }

    // Atomic leave
    await prisma.$transaction(async (tx) => {
      await tx.communityMember.delete({
        where: { id: membership.id },
      });

      // If owner was the sole member leaving, set createdByUserId = null
      if (membership.role === MemberRole.OWNER) {
        await tx.community.update({
          where: { id: community.id },
          data: { createdByUserId: null },
        });
      }
    });

    return NextResponse.json({
      message: "Successfully left the community",
    });
  } catch (error: any) {
    console.error("POST /api/communities/[slug]/leave error:", error);
    return NextResponse.json({ error: "Failed to leave community" }, { status: 500 });
  }
}
