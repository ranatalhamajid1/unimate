import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  resolveStudentHierarchyContext,
  buildAnnouncementVisibilityFilter,
  normalizeSearchQuery,
} from "@/app/lib/discovery";
import { sanitizeMemberUser } from "@/app/lib/communities";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    const { searchParams } = new URL(req.url);

    const scope = (searchParams.get("scope") || (auth ? "university" : "all")) as
      | "university"
      | "campus"
      | "department"
      | "joined"
      | "all";

    const query = searchParams.get("q") || searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const ctx = auth ? await resolveStudentHierarchyContext(auth.userId) : null;

    if (scope === "joined" && !auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const where = buildAnnouncementVisibilityFilter(ctx, { scope });

    const { normalized } = normalizeSearchQuery(query);
    if (normalized) {
      const searchOR = [
        { title: { contains: normalized, mode: "insensitive" } },
        { content: { contains: normalized, mode: "insensitive" } },
      ];
      if (where.AND) {
        where.AND.push({ OR: searchOR });
      } else {
        where.AND = [{ OR: searchOR }];
      }
    }

    // Pinned announcements first, then chronological descending
    const [announcements, total] = await Promise.all([
      prisma.communityAnnouncement.findMany({
        where,
        take: limit,
        skip,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
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
          createdByUser: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              degreeProgram: true,
              currentSemester: true,
              isPublicProfile: true,
            },
          },
        },
      }),
      prisma.communityAnnouncement.count({ where }),
    ]);

    const formatted = announcements.map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      isPinned: a.isPinned,
      createdAt: a.createdAt,
      community: a.community,
      author: sanitizeMemberUser(a.createdByUser || a.author),
    }));

    return NextResponse.json({
      announcements: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/discovery/announcements error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching discovered announcements." },
      { status: 500 }
    );
  }
}
