import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityVisibility,
  EventStatus,
  AttendeeStatus,
  getMemberContext,
  checkCommunityVisibilityAccess,
  sanitizeMarkdownContent,
} from "@/app/lib/communities";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const auth = await resolveAuth(req);

    const community = await prisma.community.findUnique({
      where: { slug },
      select: { id: true, visibility: true, campusId: true },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const callerUser = auth
      ? await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { campusId: true },
        })
      : null;

    const memberCtx = await getMemberContext(prisma, community.id, auth?.userId);
    const access = checkCommunityVisibilityAccess(community, callerUser, memberCtx);

    if (!access.allowed) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const event = await prisma.communityEvent.findFirst({
      where: { id, communityId: community.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const userRsvp = auth
      ? await prisma.communityEventAttendee.findUnique({
          where: { eventId_userId: { eventId: event.id, userId: auth.userId } },
        })
      : null;

    const goingCount = await prisma.communityEventAttendee.count({
      where: { eventId: event.id, status: AttendeeStatus.GOING },
    });

    return NextResponse.json({
      event: {
        ...event,
        userRsvp: userRsvp ? userRsvp.status : null,
        goingCount,
      },
    });
  } catch (error) {
    console.error("GET event detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      if (community.visibility === CommunityVisibility.PRIVATE && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.communityEvent.findFirst({
      where: { id, communityId: community.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!memberCtx.isAdminOrAbove && existing.createdByUserId !== auth.userId) {
      return NextResponse.json(
        { error: "Moderators can only edit their own events." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateData: any = { updatedByUserId: auth.userId };

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      if (body.title.trim().length > 150) {
        return NextResponse.json({ error: "Title cannot exceed 150 characters." }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string" || body.description.trim().length === 0) {
        return NextResponse.json({ error: "Description cannot be empty." }, { status: 400 });
      }
      if (body.description.trim().length > 5000) {
        return NextResponse.json({ error: "Description cannot exceed 5000 characters." }, { status: 400 });
      }
      updateData.description = sanitizeMarkdownContent(body.description.trim());
    }

    if (body.location !== undefined) {
      updateData.location = body.location ? String(body.location).trim().slice(0, 200) : null;
    }

    if (body.isOnline !== undefined) {
      updateData.isOnline = Boolean(body.isOnline);
    }

    if (body.meetingUrl !== undefined) {
      if (body.meetingUrl && !String(body.meetingUrl).startsWith("https://")) {
        return NextResponse.json({ error: "Meeting URL must be an HTTPS URL." }, { status: 400 });
      }
      updateData.meetingUrl = body.meetingUrl ? String(body.meetingUrl).trim().slice(0, 500) : null;
    }

    if (body.capacity !== undefined) {
      if (body.capacity === null) {
        updateData.capacity = null;
      } else {
        const cap = parseInt(body.capacity, 10);
        if (isNaN(cap) || cap <= 0) {
          return NextResponse.json({ error: "Capacity must be a positive number." }, { status: 400 });
        }
        updateData.capacity = cap;
      }
    }

    if (body.status !== undefined) {
      if (!Object.values(EventStatus).includes(body.status)) {
        return NextResponse.json({ error: "Invalid event status." }, { status: 400 });
      }
      updateData.status = body.status;
    }

    const updated = await prisma.communityEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error("PATCH event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
      if (community.visibility === CommunityVisibility.PRIVATE && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.communityEvent.findFirst({
      where: { id, communityId: community.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!memberCtx.isAdminOrAbove && existing.createdByUserId !== auth.userId) {
      return NextResponse.json(
        { error: "Moderators can only delete their own events." },
        { status: 403 }
      );
    }

    await prisma.communityEvent.delete({ where: { id } });

    return NextResponse.json({ message: "Event deleted" });
  } catch (error) {
    console.error("DELETE event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
