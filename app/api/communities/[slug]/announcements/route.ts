import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityVisibility,
  MembershipStatus,
  getMemberContext,
  checkCommunityVisibilityAccess,
  sanitizeMarkdownContent,
  dispatchCommunityNotification,
  createAnnouncementWithPinLock,
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
      select: {
        id: true,
        visibility: true,
        campusId: true,
      },
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

    const announcements = await prisma.communityAnnouncement.findMany({
      where: { communityId: community.id },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      take: 50,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("GET announcements error:", error);
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
      select: { id: true, name: true, visibility: true },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const memberCtx = await getMemberContext(prisma, community.id, auth.userId);
    if (!memberCtx.isModeratorOrAbove) {
      if (community.visibility === CommunityVisibility.PRIVATE && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Forbidden. Only moderators and administrators can post announcements." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title, content, isPinned = false } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Announcement title is required." }, { status: 400 });
    }
    if (title.trim().length > 150) {
      return NextResponse.json({ error: "Title cannot exceed 150 characters." }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Announcement content is required." }, { status: 400 });
    }
    if (content.trim().length > 5000) {
      return NextResponse.json({ error: "Content cannot exceed 5000 characters." }, { status: 400 });
    }

    const sanitizedContent = sanitizeMarkdownContent(content.trim());

    // Concurrency-safe announcement creation with Community row locking for pins
    const result = await createAnnouncementWithPinLock(prisma, {
      communityId: community.id,
      title: title.trim(),
      content: sanitizedContent,
      isPinned: Boolean(isPinned),
      createdByUserId: auth.userId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    const announcement = result.announcement;

    // Dispatch in-app notification to active members (excluding author)
    await dispatchCommunityNotification(prisma, {
      communityId: community.id,
      type: "COMMUNITY_ANNOUNCEMENT",
      title: `New announcement in ${community.name}`,
      message: announcement.title,
      relatedId: announcement.id,
      initiatingUserId: auth.userId,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("POST announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
