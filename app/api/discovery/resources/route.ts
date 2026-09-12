import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  resolveStudentHierarchyContext,
  buildResourceVisibilityFilter,
  evaluateVerifiedDomain,
  normalizeSearchQuery,
} from "@/app/lib/discovery";
import { ResourceType } from "@/app/lib/communities";

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

    const type = searchParams.get("type") as ResourceType | null;
    const courseCode = searchParams.get("courseCode") || "";
    const verifiedDomainOnly = searchParams.get("verifiedDomainOnly") === "true";
    const query = searchParams.get("q") || searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const ctx = auth ? await resolveStudentHierarchyContext(auth.userId) : null;

    if (scope === "joined" && !auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const where = buildResourceVisibilityFilter(ctx, { scope });

    if (type && Object.values(ResourceType).includes(type)) {
      where.type = type;
    }

    const { normalized } = normalizeSearchQuery(query);
    if (normalized) {
      const searchOR = [
        { title: { contains: normalized, mode: "insensitive" } },
        { description: { contains: normalized, mode: "insensitive" } },
        { courseCode: { contains: normalized, mode: "insensitive" } },
      ];
      if (where.AND) {
        where.AND.push({ OR: searchOR });
      } else {
        where.AND = [{ OR: searchOR }];
      }
    }

    const [resources, total] = await Promise.all([
      prisma.communityResource.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
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
        },
      }),
      prisma.communityResource.count({ where }),
    ]);

    const formatted = resources.map((r: any) => {
      const domainInfo = evaluateVerifiedDomain(r.url);
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        url: r.url,
        type: r.type,
        courseCode: r.courseCode,
        createdAt: r.createdAt,
        community: r.community,
        verifiedDomain: domainInfo.isVerified,
        domainName: domainInfo.domainName,
        badgeLabel: domainInfo.badgeLabel,
      };
    });

    // If verifiedDomainOnly requested, filter in-memory
    const filtered = verifiedDomainOnly
      ? formatted.filter((r) => r.verifiedDomain)
      : formatted;

    return NextResponse.json({
      resources: filtered,
      total: verifiedDomainOnly ? filtered.length : total,
      page,
      limit,
      totalPages: Math.ceil((verifiedDomainOnly ? filtered.length : total) / limit),
    });
  } catch (error: any) {
    console.error("GET /api/discovery/resources error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching discovered resources." },
      { status: 500 }
    );
  }
}
