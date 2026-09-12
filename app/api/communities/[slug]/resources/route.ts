import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  ResourceType,
  getMemberContext,
  checkCommunityVisibilityAccess,
  validateResourceUrl,
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
      select: { id: true, visibility: true, campusId: true },
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

    const resources = await prisma.communityResource.findMany({
      where: { communityId: community.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("GET resources error:", error);
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
      select: { id: true, visibility: true },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const memberCtx = await getMemberContext(prisma, community.id, auth.userId);
    if (!memberCtx.isActive) {
      if (community.visibility === "PRIVATE") {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Forbidden. Only active community members can add resources." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title, description, url, type = ResourceType.LINK } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (title.trim().length > 150) {
      return NextResponse.json({ error: "Title cannot exceed 150 characters." }, { status: 400 });
    }
    if (description && (typeof description !== "string" || description.trim().length > 500)) {
      return NextResponse.json({ error: "Description cannot exceed 500 characters." }, { status: 400 });
    }

    // Strict URL validation: HTTPS only, anti-SSRF, length <= 1000
    const urlValidation = validateResourceUrl(url);
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    const resource = await prisma.communityResource.create({
      data: {
        communityId: community.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        type: type === ResourceType.NOTE ? ResourceType.NOTE : ResourceType.LINK,
        url: url.trim(),
        createdByUserId: auth.userId,
      },
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("POST resource error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
