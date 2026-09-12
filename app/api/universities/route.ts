import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { authenticateMobile } from "@/app/lib/mobile-auth";
import { prisma } from "@/app/lib/prisma";
import {
  normalizeSearchTerm,
  scoreUniversityRelevancy,
  isConservativeDuplicate,
} from "@/app/lib/university-search";

export async function GET(req: NextRequest) {
  try {
    // Support either web session cookie OR mobile Bearer token
    const webSession = await getSession();
    let userId = webSession?.userId;

    if (!userId) {
      const mobileSession = await authenticateMobile(req);
      userId = mobileSession?.userId;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const countryParam = (searchParams.get("countryCode") || searchParams.get("country"))?.trim();
    const limitParam = parseInt(searchParams.get("limit") || "25", 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 25 : limitParam), 50); // Enforce [1, 50]

    const whereClause: Record<string, any> = {};

    if (countryParam) {
      if (countryParam.length === 2) {
        whereClause.countryCode = countryParam.toUpperCase();
      } else {
        whereClause.OR = [
          { country: { equals: countryParam, mode: "insensitive" } },
          { countryCode: { equals: countryParam.toUpperCase() } },
        ];
      }
    }

    if (q && q.length > 0) {
      const normQ = normalizeSearchTerm(q);
      const searchOR: any[] = [
        { name: { contains: q, mode: "insensitive" } },
        { shortName: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];

      // Add individual tokens (e.g. FAST.NUCES -> "FAST", "NUCES")
      const tokens = q.split(/[^a-zA-Z0-9]+/).filter((t) => t.length >= 2);
      for (const token of tokens) {
        searchOR.push(
          { name: { contains: token, mode: "insensitive" } },
          { shortName: { contains: token, mode: "insensitive" } }
        );
      }

      if (normQ && normQ !== q.toLowerCase()) {
        searchOR.push(
          { name: { contains: normQ, mode: "insensitive" } },
          { shortName: { contains: normQ, mode: "insensitive" } }
        );
      }

      if (whereClause.OR) {
        whereClause.AND = [{ OR: whereClause.OR }, { OR: searchOR }];
        delete whereClause.OR;
      } else if (whereClause.countryCode) {
        whereClause.AND = [{ countryCode: whereClause.countryCode }, { OR: searchOR }];
        delete whereClause.countryCode;
      } else {
        whereClause.OR = searchOR;
      }
    }

    const candidates = await prisma.university.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        shortName: true,
        country: true,
        countryCode: true,
        city: true,
        state: true,
        website: true,
        domain: true,
        isVerified: true,
        campuses: {
          select: {
            id: true,
            name: true,
            city: true,
            isMain: true,
          },
          orderBy: { isMain: "desc" },
        },
        departments: {
          select: {
            id: true,
            name: true,
            faculty: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      take: q ? Math.min(limit * 3, 100) : limit,
    });

    // Multi-tier relevancy ranking when search query is present
    let universities = candidates;
    if (q && q.length > 0) {
      universities = [...candidates].sort((a, b) => {
        const scoreA = scoreUniversityRelevancy(a, q);
        const scoreB = scoreUniversityRelevancy(b, q);
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    const finalResults = universities.slice(0, limit);

    return NextResponse.json({
      success: true,
      universities: finalResults,
      count: finalResults.length,
    });
  } catch (error: any) {
    console.error("Error in GET /api/universities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search universities." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const webSession = await getSession();
    let userId = webSession?.userId;

    if (!userId) {
      const mobileSession = await authenticateMobile(req);
      userId = mobileSession?.userId;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const country = String(body.country || "").trim();
    const city = body.city ? String(body.city).trim() : null;
    const website = body.website ? String(body.website).trim() : null;
    const shortName = body.shortName ? String(body.shortName).trim().toUpperCase() : null;

    if (name.length < 3 || name.length > 150) {
      return NextResponse.json(
        { success: false, error: "University name must be between 3 and 150 characters." },
        { status: 400 }
      );
    }

    if (country.length < 2 || country.length > 70) {
      return NextResponse.json(
        { success: false, error: "Country must be provided (2 to 70 characters)." },
        { status: 400 }
      );
    }

    // Validate website URL safety if provided
    if (website) {
      const lower = website.toLowerCase();
      if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
        return NextResponse.json(
          { success: false, error: "Website must begin with http:// or https://" },
          { status: 400 }
        );
      }
      if (lower.includes("javascript:") || lower.includes("data:") || lower.includes("vbscript:")) {
        return NextResponse.json(
          { success: false, error: "Invalid website URL." },
          { status: 400 }
        );
      }
    }

    const countryCode = body.countryCode
      ? String(body.countryCode).trim().toUpperCase()
      : (country.length === 2 ? country.toUpperCase() : null);

    // Conservative duplicate detection across all universities in the same country
    const countryOrClauses: any[] = [
      { country: { equals: country, mode: "insensitive" } },
      { countryCode: { equals: country.toUpperCase() } },
    ];
    if (countryCode) {
      countryOrClauses.push({ countryCode: { equals: countryCode } });
    }

    const existingInCountry = await prisma.university.findMany({
      where: {
        OR: countryOrClauses,
      },
      select: { id: true, name: true, shortName: true, isVerified: true },
    });

    const duplicate = existingInCountry.find((existing) =>
      isConservativeDuplicate(existing.name, existing.shortName, name, shortName)
    );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "A university with this name or acronym already exists in this country.",
          university: duplicate,
        },
        { status: 409 }
      );
    }

    // Create custom university: ALWAYS unverified (isVerified: false), linked to createdByUserId
    const newUniversity = await prisma.university.create({
      data: {
        name,
        shortName,
        country,
        countryCode,
        city,
        website,
        isVerified: false,
        createdByUserId: userId,
        campuses: {
          create: [
            {
              name: "Main Campus",
              city,
              isMain: true,
            },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        country: true,
        countryCode: true,
        city: true,
        website: true,
        isVerified: true,
        campuses: {
          select: {
            id: true,
            name: true,
            isMain: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        university: newUniversity,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/universities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create custom university." },
      { status: 500 }
    );
  }
}
