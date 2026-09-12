import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  resolveStudentHierarchyContext,
  buildCommunityVisibilityFilter,
  buildEventVisibilityFilter,
  buildAnnouncementVisibilityFilter,
  buildResourceVisibilityFilter,
  evaluateVerifiedDomain,
  normalizeSearchQuery,
  computeDiscoveryRelevanceScore,
  RankingSignals,
} from "@/app/lib/discovery";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    const { searchParams } = new URL(req.url);

    const query = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const limitPerCategory = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "4", 10)));

    if (!query || query.length < 2) {
      return NextResponse.json({
        query: "",
        results: {
          communities: [],
          events: [],
          announcements: [],
          resources: [],
        },
        totalCount: 0,
      });
    }

    const { normalized, tokens, acronym } = normalizeSearchQuery(query);
    const ctx = auth ? await resolveStudentHierarchyContext(auth.userId) : null;

    // 1. Communities Visibility Filter
    const commWhere = buildCommunityVisibilityFilter(ctx, { tab: "university" });
    const commSearchOR: any[] = [
      { name: { contains: normalized, mode: "insensitive" } },
      { description: { contains: normalized, mode: "insensitive" } },
      { courseCode: { contains: normalized, mode: "insensitive" } },
    ];
    for (const t of tokens) {
      if (t.length >= 3) {
        commSearchOR.push({ name: { contains: t, mode: "insensitive" } });
      }
    }
    if (commWhere.OR) {
      commWhere.AND = [{ OR: commWhere.OR }, { OR: commSearchOR }];
      delete commWhere.OR;
    } else {
      commWhere.OR = commSearchOR;
    }

    // 2. Events Visibility Filter
    const eventWhere = buildEventVisibilityFilter(ctx, {
      timeline: "upcoming",
      scope: ctx?.campusId ? "campus" : "university",
      now: new Date(),
    });
    const eventSearchOR = [
      { title: { contains: normalized, mode: "insensitive" } },
      { description: { contains: normalized, mode: "insensitive" } },
      { location: { contains: normalized, mode: "insensitive" } },
    ];
    if (eventWhere.AND) {
      eventWhere.AND.push({ OR: eventSearchOR });
    } else {
      eventWhere.AND = [{ OR: eventSearchOR }];
    }

    // 3. Announcements Visibility Filter
    const annWhere = buildAnnouncementVisibilityFilter(ctx, {
      scope: ctx?.departmentId ? "department" : ctx?.campusId ? "campus" : "university",
    });
    const annSearchOR = [
      { title: { contains: normalized, mode: "insensitive" } },
      { content: { contains: normalized, mode: "insensitive" } },
    ];
    if (annWhere.AND) {
      annWhere.AND.push({ OR: annSearchOR });
    } else {
      annWhere.AND = [{ OR: annSearchOR }];
    }

    // 4. Resources Visibility Filter
    const resWhere = buildResourceVisibilityFilter(ctx, {
      scope: ctx?.departmentId ? "department" : "university",
    });
    const resSearchOR = [
      { title: { contains: normalized, mode: "insensitive" } },
      { description: { contains: normalized, mode: "insensitive" } },
    ];
    if (resWhere.AND) {
      resWhere.AND.push({ OR: resSearchOR });
    } else {
      resWhere.AND = [{ OR: resSearchOR }];
    }

    // Execute federated search concurrently with strict bounded limits
    const [rawCommunities, rawEvents, rawAnnouncements, rawResources] = await Promise.all([
      prisma.community.findMany({
        where: commWhere,
        take: limitPerCategory * 2,
        include: {
          university: { select: { id: true, name: true, shortName: true } },
          campus: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          _count: {
            select: { members: { where: { status: "ACTIVE" } } },
          },
        },
      }),
      prisma.communityEvent.findMany({
        where: eventWhere,
        take: limitPerCategory,
        orderBy: { startAt: "asc" },
        include: {
          community: { select: { name: true, slug: true } },
        },
      }),
      prisma.communityAnnouncement.findMany({
        where: annWhere,
        take: limitPerCategory,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: {
          community: { select: { name: true, slug: true } },
        },
      }),
      prisma.communityResource.findMany({
        where: resWhere,
        take: limitPerCategory,
        orderBy: { createdAt: "desc" },
        include: {
          community: { select: { name: true, slug: true } },
        },
      }),
    ]);

    // Rank communities deterministically
    const scoredCommunities = rawCommunities.map((c: any) => {
      const lowerName = c.name.toLowerCase();
      const lowerCourse = (c.courseCode || "").toLowerCase();

      const signals: RankingSignals = {
        exactNameMatch: lowerName === normalized,
        prefixNameMatch: lowerName.startsWith(normalized),
        acronymMatch: acronym ? lowerName.includes(acronym) : false,
        courseCodeMatch: lowerCourse.includes(normalized),
        departmentMatch: ctx?.departmentId ? c.departmentId === ctx.departmentId : false,
        campusMatch: ctx?.campusId ? c.campusId === ctx.campusId : false,
        universityMatch: ctx?.universityId ? c.universityId === ctx.universityId : false,
        isVerified: Boolean(c.isVerified),
        isActiveMember: ctx ? ctx.activeCommunityIds.includes(c.id) : false,
        hasUpcomingEvent: false,
        hasRecentAnnouncement: false,
      };

      return {
        id: c.id,
        title: c.name,
        subtitle: c.university?.shortName || c.university?.name || "Community",
        description: c.description,
        slug: c.slug,
        type: c.type,
        isVerified: c.isVerified,
        memberCount: c._count ? c._count.members : 0,
        href: `/dashboard/communities/${c.slug}`,
        relevanceScore: computeDiscoveryRelevanceScore(signals),
      };
    });

    scoredCommunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topCommunities = scoredCommunities.slice(0, limitPerCategory);

    // Safe mapping with relation fallbacks
    const formattedEvents = await Promise.all(
      rawEvents.map(async (e: any) => {
        let commName = e.community?.name;
        let commSlug = e.community?.slug;
        if (!commName && e.communityId) {
          const comm = await prisma.community.findUnique({
            where: { id: e.communityId },
            select: { name: true, slug: true },
          });
          commName = comm?.name || "Event";
          commSlug = comm?.slug || "community";
        }
        return {
          id: e.id,
          title: e.title,
          subtitle: `${commName || "Campus Event"} · ${new Date(e.startAt).toLocaleDateString()}`,
          description: e.description || e.location || (e.isOnline ? "Online Event" : "Campus Event"),
          communitySlug: commSlug || "community",
          startDate: e.startAt,
          href: `/dashboard/communities/${commSlug || "community"}?tab=events`,
        };
      })
    );

    const formattedAnnouncements = await Promise.all(
      rawAnnouncements.map(async (a: any) => {
        let commName = a.community?.name;
        let commSlug = a.community?.slug;
        if (!commName && a.communityId) {
          const comm = await prisma.community.findUnique({
            where: { id: a.communityId },
            select: { name: true, slug: true },
          });
          commName = comm?.name || "Announcement";
          commSlug = comm?.slug || "community";
        }
        return {
          id: a.id,
          title: a.title,
          subtitle: `${commName || "Announcement"} · ${new Date(a.createdAt).toLocaleDateString()}`,
          description: (a.content || "").slice(0, 120),
          isPinned: a.isPinned,
          communitySlug: commSlug || "community",
          href: `/dashboard/communities/${commSlug || "community"}?tab=announcements`,
        };
      })
    );

    const formattedResources = await Promise.all(
      rawResources.map(async (r: any) => {
        const domainInfo = evaluateVerifiedDomain(r.url);
        let commName = r.community?.name;
        if (!commName && r.communityId) {
          const comm = await prisma.community.findUnique({
            where: { id: r.communityId },
            select: { name: true },
          });
          commName = comm?.name || "Resource";
        }
        return {
          id: r.id,
          title: r.title,
          subtitle: `${commName || "Resource"}${r.courseCode ? ` · ${r.courseCode}` : ""}`,
          description: r.description || r.url,
          url: r.url,
          type: r.type,
          verifiedDomain: domainInfo.isVerified,
          badgeLabel: domainInfo.badgeLabel,
          href: r.url,
        };
      })
    );

    const totalCount =
      topCommunities.length +
      formattedEvents.length +
      formattedAnnouncements.length +
      formattedResources.length;

    return NextResponse.json({
      query,
      results: {
        communities: topCommunities,
        events: formattedEvents,
        announcements: formattedAnnouncements,
        resources: formattedResources,
      },
      totalCount,
    });
  } catch (error: any) {
    console.error("GET /api/discovery/search error:", error);
    return NextResponse.json(
      { error: "Internal server error performing discovery search." },
      { status: 500 }
    );
  }
}
