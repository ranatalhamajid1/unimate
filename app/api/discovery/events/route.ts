import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  resolveStudentHierarchyContext,
  buildEventVisibilityFilter,
  normalizeSearchQuery,
} from "@/app/lib/discovery";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    const { searchParams } = new URL(req.url);

    const timeline = (searchParams.get("timeline") || "upcoming") as
      | "upcoming"
      | "today"
      | "this_week"
      | "past";

    const scope = (searchParams.get("scope") || (auth ? "university" : "all")) as
      | "university"
      | "campus"
      | "department"
      | "joined"
      | "all";

    const query = searchParams.get("q") || searchParams.get("search") || "";
    const isOnline = searchParams.get("isOnline");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const ctx = auth ? await resolveStudentHierarchyContext(auth.userId) : null;

    if (scope === "joined" && !auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const where = buildEventVisibilityFilter(ctx, {
      timeline,
      scope,
      now: new Date(),
    });

    if (isOnline !== null && isOnline !== undefined && isOnline !== "") {
      where.isOnline = isOnline === "true";
    }

    const { normalized } = normalizeSearchQuery(query);
    if (normalized) {
      const searchOR = [
        { title: { contains: normalized, mode: "insensitive" } },
        { description: { contains: normalized, mode: "insensitive" } },
        { location: { contains: normalized, mode: "insensitive" } },
      ];
      if (where.AND) {
        where.AND.push({ OR: searchOR });
      } else {
        where.AND = [{ OR: searchOR }];
      }
    }

    const [events, total] = await Promise.all([
      prisma.communityEvent.findMany({
        where,
        take: limit,
        skip,
        orderBy: { startAt: timeline === "past" ? "desc" : "asc" },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatarUrl: true,
              isVerified: true,
              university: { select: { id: true, name: true, shortName: true } },
              campus: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
            },
          },
          attendees: auth
            ? {
                where: { userId: auth.userId },
                select: { status: true },
              }
            : false,
          _count: {
            select: {
              attendees: { where: { status: "GOING" } },
            },
          },
        },
      }),
      prisma.communityEvent.count({ where }),
    ]);

    const formatted = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      isOnline: e.isOnline,
      meetingUrl: e.meetingUrl,
      startDate: e.startAt,
      endDate: e.endAt,
      maxAttendees: e.capacity,
      status: e.status,
      community: e.community,
      attendeeCount: typeof e._count?.attendees === "number" ? e._count.attendees : 0,
      currentUserRsvp: e.attendees && e.attendees.length > 0 ? e.attendees[0].status : null,
      isAttending: e.attendees && e.attendees.length > 0 && e.attendees[0].status === "GOING",
    }));

    return NextResponse.json({
      events: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/discovery/events error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching discovered events." },
      { status: 500 }
    );
  }
}
