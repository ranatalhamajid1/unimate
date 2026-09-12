import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  AttendeeStatus,
  getMemberContext,
  sanitizeMemberUser,
} from "@/app/lib/communities";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: eventId } = await params;
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
    if (!memberCtx.isActive) {
      if (community.visibility === "PRIVATE") {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Forbidden. Only active community members can view attendee lists." },
        { status: 403 }
      );
    }

    // Verify event belongs to this community
    const event = await prisma.communityEvent.findFirst({
      where: { id: eventId, communityId: community.id },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Strictly exclude NOT_GOING attendees from attendee lists
    const attendees = await prisma.communityEventAttendee.findMany({
      where: {
        eventId,
        status: { in: [AttendeeStatus.GOING, AttendeeStatus.MAYBE] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            degreeProgram: true,
            currentSemester: true,
            isPublicProfile: true,
            university: {
              select: { id: true, name: true, shortName: true },
            },
          },
        },
      },
    });

    const sanitizedAttendees = attendees.map((att) => ({
      id: att.id,
      status: att.status,
      createdAt: att.createdAt,
      user: sanitizeMemberUser(att.user),
    }));

    return NextResponse.json({ attendees: sanitizedAttendees });
  } catch (error) {
    console.error("GET event attendees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
