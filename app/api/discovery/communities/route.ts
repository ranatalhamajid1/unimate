import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  resolveStudentHierarchyContext,
  buildCommunityVisibilityFilter,
  computeDiscoveryRelevanceScore,
  normalizeSearchQuery,
  RankingSignals,
} from "@/app/lib/discovery";
import { CommunityType } from "@/app/lib/communities";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    const { searchParams } = new URL(req.url);

    const tab = (searchParams.get("tab") || (auth ? "university" : "explore")) as
      | "university"
      | "campus"
      | "department"
      | "joined"
      | "explore";

    const type = searchParams.get("type") as CommunityType | null;
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const query = searchParams.get("q") || searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Resolve student hierarchy context server-side
    const ctx = auth ? await resolveStudentHierarchyContext(auth.userId) : null;

    // Security boundary: if user requested institutional tabs without authentication or institutional affiliation
    if (tab === "joined" && !auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (tab === "campus" && (!auth || !ctx?.campusId)) {
      return NextResponse.json({
        communities: [],
        total: 0,
        page,
        limit,
        message: "Please link your campus in your profile to view campus-scoped communities.",
      });
    }
    if (tab === "department" && (!auth || !ctx?.departmentId)) {
      return NextResponse.json({
        communities: [],
        total: 0,
        page,
        limit,
        message: "Please link your department in your profile to view department-scoped communities.",
      });
    }

    // Build visibility filter strictly enforcing hierarchy
    const where = buildCommunityVisibilityFilter(ctx, {
      tab,
      verifiedOnly,
      type: type && Object.values(CommunityType).includes(type) ? type : null,
    });

    const { normalized, tokens, acronym } = normalizeSearchQuery(query);

    // Apply search filter if query provided
    if (normalized) {
      const searchOR: any[] = [
        { name: { contains: normalized, mode: "insensitive" } },
        { description: { contains: normalized, mode: "insensitive" } },
        { courseCode: { contains: normalized, mode: "insensitive" } },
      ];
      for (const token of tokens) {
        if (token.length >= 3) {
          searchOR.push({ name: { contains: token, mode: "insensitive" } });
        }
      }

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const candidateLimit = normalized ? Math.min(100, limit * 4) : limit;

    const [rawCommunities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        take: candidateLimit,
        skip: normalized ? 0 : skip,
        orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
        include: {
          university: { select: { id: true, name: true, shortName: true } },
          campus: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          _count: {
            select: {
              members: { where: { status: "ACTIVE" } },
            },
          },
        },
      }),
      prisma.community.count({ where }),
    ]);

    // Lookup user memberships across discovered community IDs for exact role/status resolution
    const communityIds = rawCommunities.map((c) => c.id);
    const userMembershipMap = new Map<string, { role: any; status: any }>();

    if (auth && communityIds.length > 0) {
      const userMemberships = await prisma.communityMember.findMany({
        where: {
          communityId: { in: communityIds },
          userId: auth.userId,
        },
        select: {
          communityId: true,
          role: true,
          status: true,
        },
      });
      userMemberships.forEach((m) => {
        userMembershipMap.set(m.communityId, { role: m.role, status: m.status });
      });
    }

    const mapped = rawCommunities.map((c: any) => {
      const membership = userMembershipMap.get(c.id);
      const lowerName = c.name.toLowerCase();
      const lowerCourse = (c.courseCode || "").toLowerCase();

      const signals: RankingSignals = {
        exactNameMatch: normalized ? lowerName === normalized : false,
        prefixNameMatch: normalized ? lowerName.startsWith(normalized) : false,
        acronymMatch: acronym ? lowerName.includes(acronym) : false,
        courseCodeMatch: normalized ? lowerCourse.includes(normalized) : false,
        departmentMatch: ctx?.departmentId ? c.departmentId === ctx.departmentId : false,
        campusMatch: ctx?.campusId ? c.campusId === ctx.campusId : false,
        universityMatch: ctx?.universityId ? c.universityId === ctx.universityId : false,
        isVerified: Boolean(c.isVerified),
        isActiveMember: membership?.status === "ACTIVE",
        hasUpcomingEvent: false,
        hasRecentAnnouncement: false,
      };

      const relevanceScore = computeDiscoveryRelevanceScore(signals);

      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        avatarUrl: c.avatarUrl,
        bannerUrl: c.bannerUrl,
        type: c.type,
        scope: c.scope,
        visibility: c.visibility,
        isVerified: c.isVerified,
        courseCode: c.courseCode,
        maxMembers: c.maxMembers,
        requiresApproval: c.requiresApproval,
        createdAt: c.createdAt,
        university: c.university,
        campus: c.campus,
        department: c.department,
        memberCount: c._count ? c._count.members : 0,
        currentUserRole: membership?.role || null,
        currentUserStatus: membership?.status || null,
        isMember: membership?.status === "ACTIVE",
        relevanceScore,
      };
    });

    if (normalized) {
      mapped.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    const paginatedItems = normalized ? mapped.slice(skip, skip + limit) : mapped;

    return NextResponse.json({
      communities: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/discovery/communities error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching discovered communities." },
      { status: 500 }
    );
  }
}
