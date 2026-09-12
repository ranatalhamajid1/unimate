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
  dispatchCommunityNotification,
} from "@/app/lib/communities";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const auth = await resolveAuth(req);

    const community = await prisma.community.findUnique({
      where: { slug },
      select: {
        id: true,
        visibility: true,
        campusId: true,
      },
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

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("status") || "all"; // "upcoming" | "past" | "all"
    const now = new Date();

    const whereClause: any = { communityId: community.id };
    if (filter === "upcoming") {
      whereClause.startAt = { gte: now };
    } else if (filter === "past") {
      whereClause.startAt = { lt: now };
    }

    const events = await prisma.communityEvent.findMany({
      where: whereClause,
      orderBy: { startAt: "asc" },
      take: 50,
    });

    // Attach caller's RSVP status and going count
    const eventIds = events.map((e) => e.id);
    const userRsvps = auth
      ? await prisma.communityEventAttendee.findMany({
          where: {
            eventId: { in: eventIds },
            userId: auth.userId,
          },
        })
      : [];

    const rsvpMap = new Map(userRsvps.map((r) => [r.eventId, r.status]));

    const eventsWithMeta = events.map((ev) => ({
      ...ev,
      userRsvp: rsvpMap.get(ev.id) || null,
    }));

    return NextResponse.json({ events: eventsWithMeta });
  } catch (error) {
    console.error("GET events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const memberCtx = await getMemberContext(prisma, community.id, auth.userId);
    if (!memberCtx.isModeratorOrAbove) {
      if (community.visibility === CommunityVisibility.PRIVATE && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Forbidden. Only moderators and administrators can create events." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      title,
      description,
      location,
      isOnline = false,
      meetingUrl,
      startAt,
      endAt,
      timezone = "Asia/Karachi",
      capacity,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Event title is required." }, { status: 400 });
    }
    if (title.trim().length > 150) {
      return NextResponse.json({ error: "Event title cannot exceed 150 characters." }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Event description is required." }, { status: 400 });
    }
    if (description.trim().length > 5000) {
      return NextResponse.json({ error: "Event description cannot exceed 5000 characters." }, { status: 400 });
    }

    if (!startAt || !endAt) {
      return NextResponse.json({ error: "Start and end dates are required." }, { status: 400 });
    }
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    if (capacity !== undefined && capacity !== null) {
      const capInt = parseInt(capacity, 10);
      if (isNaN(capInt) || capInt <= 0) {
        return NextResponse.json({ error: "Capacity must be a positive number." }, { status: 400 });
      }
    }

    if (isOnline && meetingUrl) {
      if (!meetingUrl.startsWith("https://")) {
        return NextResponse.json({ error: "Meeting URL must be a valid HTTPS link." }, { status: 400 });
      }
    }

    const sanitizedDescription = sanitizeMarkdownContent(description.trim());

    const event = await prisma.communityEvent.create({
      data: {
        communityId: community.id,
        title: title.trim(),
        description: sanitizedDescription,
        location: location ? String(location).trim().slice(0, 200) : null,
        isOnline: Boolean(isOnline),
        meetingUrl: isOnline && meetingUrl ? String(meetingUrl).trim().slice(0, 500) : null,
        startAt: startDate,
        endAt: endDate,
        timezone: String(timezone).trim().slice(0, 50),
        capacity: capacity ? parseInt(capacity, 10) : null,
        status: EventStatus.SCHEDULED,
        createdByUserId: auth.userId,
      },
    });

    // Dispatch in-app notification to active community members
    await dispatchCommunityNotification(prisma, {
      communityId: community.id,
      type: "COMMUNITY_EVENT",
      title: `New event in ${community.name}`,
      message: `${event.title} (${startDate.toLocaleDateString()})`,
      relatedId: event.id,
      initiatingUserId: auth.userId,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
