import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityType,
  CommunityScope,
  CommunityVisibility,
  CommunityModerationStatus,
  MemberRole,
  MembershipStatus,
  generateUniqueSlug,
  validateCommunityScope,
  checkDuplicateCommunity,
  checkOfficialImpersonation,
} from "@/app/lib/communities";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    const { searchParams } = new URL(req.url);

    const tab = searchParams.get("tab") || (auth ? "university" : "explore");
    const type = searchParams.get("type") as CommunityType | null;
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    let user: any = null;
    let joinedCommunityIds: string[] = [];

    if (auth) {
      user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          universityId: true,
          campusId: true,
          departmentId: true,
        },
      });

      const memberships = await prisma.communityMember.findMany({
        where: { userId: auth.userId, status: MembershipStatus.ACTIVE },
        select: { communityId: true },
      });
      joinedCommunityIds = memberships.map((m) => m.communityId);
    }

    // Build query conditions
    const where: any = {
      moderationStatus: CommunityModerationStatus.APPROVED,
    };

    if (type && Object.values(CommunityType).includes(type)) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { courseCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Tab-specific scoping & privacy-first visibility isolation
    if (tab === "explore") {
      // Explore All: only public communities across universities
      where.visibility = CommunityVisibility.PUBLIC;
    } else if (tab === "joined") {
      if (!auth) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      where.id = { in: joinedCommunityIds };
    } else if (tab === "campus") {
      if (!auth || !user?.campusId) {
        return NextResponse.json({
          communities: [],
          total: 0,
          page,
          limit,
          message: "Please link your campus in your profile to view campus-scoped communities.",
        });
      }
      where.campusId = user.campusId;
      where.visibility = { in: [CommunityVisibility.PUBLIC, CommunityVisibility.CAMPUS_ONLY] };
    } else if (tab === "department") {
      if (!auth || !user?.departmentId) {
        return NextResponse.json({
          communities: [],
          total: 0,
          page,
          limit,
          message: "Please link your department in your profile to view department-scoped communities.",
        });
      }
      where.departmentId = user.departmentId;
      where.visibility = CommunityVisibility.PUBLIC;
    } else {
      // Default tab: "university"
      if (!auth || !user?.universityId) {
        // If not authenticated or has no university, fallback to public
        where.visibility = CommunityVisibility.PUBLIC;
      } else {
        where.universityId = user.universityId;
        // Never leak private communities to non-members
        // A user can see:
        // 1. PUBLIC
        // 2. CAMPUS_ONLY if their campus matches community's campusId
        // 3. PRIVATE only if they are an active member
        const visibilityConditions: any[] = [{ visibility: CommunityVisibility.PUBLIC }];
        if (user.campusId) {
          visibilityConditions.push({
            visibility: CommunityVisibility.CAMPUS_ONLY,
            campusId: user.campusId,
          });
        }
        if (joinedCommunityIds.length > 0) {
          visibilityConditions.push({
            visibility: CommunityVisibility.PRIVATE,
            id: { in: joinedCommunityIds },
          });
        }

        if (where.OR) {
          // Combine search OR and visibility OR
          where.AND = [{ OR: where.OR }, { OR: visibilityConditions }];
          delete where.OR;
        } else {
          where.OR = visibilityConditions;
        }
      }
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          university: {
            select: { id: true, name: true, shortName: true },
          },
          campus: {
            select: { id: true, name: true },
          },
          department: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              members: {
                where: { status: MembershipStatus.ACTIVE },
              },
            },
          },
        },
      }),
      prisma.community.count({ where }),
    ]);

    // Format output with student membership context if authenticated
    const communityIds = communities.map((c) => c.id);
    let userMembershipsMap = new Map<string, { role: MemberRole; status: MembershipStatus }>();

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
        userMembershipsMap.set(m.communityId, { role: m.role, status: m.status });
      });
    }

    const payload = communities.map((c) => {
      const mem = userMembershipsMap.get(c.id);
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
        memberCount: (c as any)._count?.members ?? 0,
        currentUserRole: mem?.role ?? null,
        currentUserStatus: mem?.status ?? null,
        isMember: mem?.status === MembershipStatus.ACTIVE,
      };
    });

    return NextResponse.json({
      communities: payload,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("GET /api/communities error:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        universityId: true,
        campusId: true,
        departmentId: true,
      },
    });

    if (!user || !user.universityId) {
      return NextResponse.json(
        { error: "You must belong to a university to create a community." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      type = CommunityType.ACADEMIC,
      scope = CommunityScope.UNIVERSITY,
      visibility = CommunityVisibility.PUBLIC,
      campusId,
      departmentId,
      courseCode,
      requiresApproval = false,
      maxMembers = 500,
    } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 3 || name.trim().length > 80) {
      return NextResponse.json(
        { error: "Community name must be between 3 and 80 characters." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (description && (typeof description !== "string" || description.length > 500)) {
      return NextResponse.json(
        { error: "Description cannot exceed 500 characters." },
        { status: 400 }
      );
    }

    if (!Object.values(CommunityType).includes(type)) {
      return NextResponse.json({ error: "Invalid community type." }, { status: 400 });
    }

    if (!Object.values(CommunityScope).includes(scope)) {
      return NextResponse.json({ error: "Invalid community scope." }, { status: 400 });
    }

    if (!Object.values(CommunityVisibility).includes(visibility)) {
      return NextResponse.json({ error: "Invalid community visibility." }, { status: 400 });
    }

    // Anti-impersonation check
    const impersonation = checkOfficialImpersonation(trimmedName, false);
    if (impersonation.isImpersonating) {
      return NextResponse.json(
        { error: impersonation.reason || "Reserved university title cannot be used." },
        { status: 400 }
      );
    }

    // Scope integrity check (server-enforced)
    const scopeCheck = await validateCommunityScope(prisma, {
      scope,
      universityId: user.universityId,
      campusId: campusId || null,
      departmentId: departmentId || null,
    });

    if (!scopeCheck.valid) {
      return NextResponse.json({ error: scopeCheck.error }, { status: 400 });
    }

    // Duplicate prevention check (normalized alphanumeric/punctuation check within same university)
    const dupCheck = await checkDuplicateCommunity(prisma, user.universityId, trimmedName);
    if (dupCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: `A community with this name already exists in your university ("${dupCheck.existingName}").`,
        },
        { status: 409 }
      );
    }

    // Atomic transaction for slug generation, community creation, and owner membership creation
    const createdCommunity = await prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(tx, trimmedName);

      const community = await tx.community.create({
        data: {
          slug,
          name: trimmedName,
          description: description?.trim() || "",
          type,
          scope,
          visibility,
          universityId: user.universityId!,
          campusId: scope === CommunityScope.CAMPUS ? campusId : null,
          departmentId: scope === CommunityScope.DEPARTMENT ? departmentId : null,
          courseCode: courseCode ? courseCode.trim().toUpperCase() : null,
          isVerified: false, // Explicitly false; student creation never grants isVerified
          moderationStatus: CommunityModerationStatus.APPROVED,
          createdByUserId: user.id,
          requiresApproval: Boolean(requiresApproval),
          maxMembers: Math.min(2000, Math.max(10, Number(maxMembers) || 500)),
        },
        include: {
          university: { select: { id: true, name: true, shortName: true } },
          campus: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      });

      // Creator is granted OWNER role
      await tx.communityMember.create({
        data: {
          communityId: community.id,
          userId: user.id,
          role: MemberRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      return community;
    });

    return NextResponse.json(
      {
        message: "Community created successfully",
        community: {
          ...createdCommunity,
          currentUserRole: MemberRole.OWNER,
          currentUserStatus: MembershipStatus.ACTIVE,
          isMember: true,
          memberCount: 1,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/communities error:", error);
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}
