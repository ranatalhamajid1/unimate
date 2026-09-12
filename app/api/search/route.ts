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
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const limitPerCategory = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "4", 10)));

    const emptyResponse = {
      query: "",
      personal: {
        courses: [],
        assignments: [],
        exams: [],
        goals: [],
      },
      campus: {
        communities: [],
        events: [],
        announcements: [],
        resources: [],
      },
      totalCount: 0,
    };

    if (!query || query.length < 2) {
      return NextResponse.json(emptyResponse);
    }

    const { normalized, tokens, acronym } = normalizeSearchQuery(query);
    const ctx = await resolveStudentHierarchyContext(auth.userId);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Campus Network Visibility Filters (Milestone 11 Canonical Helpers)
    // ──────────────────────────────────────────────────────────────────────────

    // 1a. Communities Filter
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

    // 1b. Events Filter
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

    // 1c. Announcements Filter
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

    // 1d. Resources Filter
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

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Personal Academic Filters (Strictly Scoped to auth.userId)
    // ──────────────────────────────────────────────────────────────────────────
    const courseWhere: any = {
      userId: auth.userId,
      OR: [
        { name: { contains: normalized, mode: "insensitive" } },
        { code: { contains: normalized, mode: "insensitive" } },
      ],
    };

    const assignmentWhere: any = {
      userId: auth.userId,
      OR: [
        { title: { contains: normalized, mode: "insensitive" } },
        { description: { contains: normalized, mode: "insensitive" } },
      ],
    };

    const examWhere: any = {
      userId: auth.userId,
      OR: [
        { title: { contains: normalized, mode: "insensitive" } },
      ],
    };

    const goalWhere: any = {
      userId: auth.userId,
      OR: [
        { title: { contains: normalized, mode: "insensitive" } },
        { type: { contains: normalized, mode: "insensitive" } },
      ],
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Single-Pass Bounded Concurrent Fetching (Zero N+1)
    // ──────────────────────────────────────────────────────────────────────────
    const [
      rawCourses,
      rawAssignments,
      rawExams,
      rawGoals,
      rawCommunities,
      rawEvents,
      rawAnnouncements,
      rawResources,
    ] = await Promise.all([
      // Personal
      prisma.course.findMany({
        where: courseWhere,
        take: limitPerCategory,
      }),
      prisma.assignment.findMany({
        where: assignmentWhere,
        take: limitPerCategory,
        include: {
          course: { select: { name: true, code: true } },
        },
      }),
      prisma.exam.findMany({
        where: examWhere,
        take: limitPerCategory,
        include: {
          course: { select: { name: true, code: true } },
        },
      }),
      prisma.studentGoal.findMany({
        where: goalWhere,
        take: limitPerCategory,
      }),
      // Campus
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

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Format Personal Results
    // ──────────────────────────────────────────────────────────────────────────
    const formattedCourses = rawCourses.map((c: any) => ({
      id: c.id,
      title: c.name,
      subtitle: c.code,
      color: c.color || "#2563eb",
      category: "Course",
      href: "/dashboard/academics",
    }));

    const formattedAssignments = rawAssignments.map((a: any) => ({
      id: a.id,
      title: a.title,
      subtitle: a.course?.name ? `${a.course.code || a.course.name} · Due ${new Date(a.dueDate).toLocaleDateString()}` : `Due ${new Date(a.dueDate).toLocaleDateString()}`,
      status: a.status,
      category: "Assignment",
      href: "/dashboard/assignments",
    }));

    const formattedExams = rawExams.map((e: any) => ({
      id: e.id,
      title: e.title,
      subtitle: e.course?.name ? `${e.course.code || e.course.name} · ${new Date(e.examDate).toLocaleDateString()}` : new Date(e.examDate).toLocaleDateString(),
      category: "Exam",
      href: "/dashboard/exams",
    }));

    const formattedGoals = rawGoals.map((g: any) => ({
      id: g.id,
      title: g.title || `Target: ${g.type}`,
      subtitle: `Target: ${g.targetValue} · ${g.period || "Semester"}`,
      category: "Goal",
      href: "/dashboard/goals",
    }));

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Score & Format Campus Results
    // ──────────────────────────────────────────────────────────────────────────
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
        category: "Community",
        href: `/dashboard/communities/${c.slug}`,
        relevanceScore: computeDiscoveryRelevanceScore(signals),
      };
    });

    scoredCommunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topCommunities = scoredCommunities.slice(0, limitPerCategory);

    const formattedEvents = rawEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      subtitle: `${e.community?.name || "Campus Event"} · ${new Date(e.startAt).toLocaleDateString()}`,
      description: e.description || e.location || (e.isOnline ? "Online Event" : "Campus Event"),
      communitySlug: e.community?.slug || "community",
      category: "Event",
      startDate: e.startAt,
      href: `/dashboard/communities/${e.community?.slug || "community"}?tab=events`,
    }));

    const formattedAnnouncements = rawAnnouncements.map((a: any) => ({
      id: a.id,
      title: a.title,
      subtitle: `${a.community?.name || "Announcement"} · ${new Date(a.createdAt).toLocaleDateString()}`,
      description: (a.content || "").slice(0, 120),
      isPinned: a.isPinned,
      communitySlug: a.community?.slug || "community",
      category: "Announcement",
      href: `/dashboard/communities/${a.community?.slug || "community"}?tab=announcements`,
    }));

    const formattedResources = rawResources.map((r: any) => {
      const domainInfo = evaluateVerifiedDomain(r.url);
      return {
        id: r.id,
        title: r.title,
        subtitle: `${r.community?.name || "Resource"}${r.courseCode ? ` · ${r.courseCode}` : ""}`,
        description: r.description || r.url,
        url: r.url,
        type: r.type,
        verifiedDomain: domainInfo.isVerified,
        badgeLabel: domainInfo.badgeLabel,
        category: "Resource",
        href: r.url,
        isExternal: true,
      };
    });

    const totalCount =
      formattedCourses.length +
      formattedAssignments.length +
      formattedExams.length +
      formattedGoals.length +
      topCommunities.length +
      formattedEvents.length +
      formattedAnnouncements.length +
      formattedResources.length;

    return NextResponse.json({
      query,
      personal: {
        courses: formattedCourses,
        assignments: formattedAssignments,
        exams: formattedExams,
        goals: formattedGoals,
      },
      campus: {
        communities: topCommunities,
        events: formattedEvents,
        announcements: formattedAnnouncements,
        resources: formattedResources,
      },
      totalCount,
    });
  } catch (error: any) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { error: "Internal server error performing universal search." },
      { status: 500 }
    );
  }
}
