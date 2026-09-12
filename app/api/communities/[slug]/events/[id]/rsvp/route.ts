import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { AttendeeStatus, handleEventRSVP, getMemberContext } from "@/app/lib/communities";

export async function POST(
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
      if (community.visibility === "PRIVATE" && !memberCtx.isBanned && !memberCtx.isPending) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      if (memberCtx.isBanned) {
        return NextResponse.json({ error: "Banned members cannot RSVP." }, { status: 403 });
      }
      if (memberCtx.isPending) {
        return NextResponse.json({ error: "Pending members cannot RSVP." }, { status: 403 });
      }
      return NextResponse.json({ error: "Must be an active community member to RSVP." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { status } = body;

    if (!status || !Object.values(AttendeeStatus).includes(status)) {
      return NextResponse.json(
        { error: "Valid RSVP status (GOING, MAYBE, or NOT_GOING) is required." },
        { status: 400 }
      );
    }

    // Call concurrency-safe RSVP engine
    const result = await handleEventRSVP(prisma, {
      communityId: community.id,
      eventId,
      userId: auth.userId,
      status: status as AttendeeStatus,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json({ attendee: result.attendee }, { status: 200 });
  } catch (error) {
    console.error("POST event RSVP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
