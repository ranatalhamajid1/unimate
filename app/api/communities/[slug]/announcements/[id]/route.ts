import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityVisibility,
  getMemberContext,
  sanitizeMarkdownContent,
  updateAnnouncementWithPinLock,
} from "@/app/lib/communities";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
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
    if (!memberCtx.isModeratorOrAbove) {
      if (community.visibility === CommunityVisibility.PRIVATE && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.communityAnnouncement.findFirst({
      where: { id, communityId: community.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Moderators can only edit their own announcements; Admins/Owners can edit any
    if (!memberCtx.isAdminOrAbove && existing.createdByUserId !== auth.userId) {
      return NextResponse.json(
        { error: "Moderators can only edit their own announcements." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateData: any = { updatedByUserId: auth.userId };

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      if (body.title.trim().length > 150) {
        return NextResponse.json({ error: "Title cannot exceed 150 characters." }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.content !== undefined) {
      if (typeof body.content !== "string" || body.content.trim().length === 0) {
        return NextResponse.json({ error: "Content cannot be empty." }, { status: 400 });
      }
      if (body.content.trim().length > 5000) {
        return NextResponse.json({ error: "Content cannot exceed 5000 characters." }, { status: 400 });
      }
      updateData.content = sanitizeMarkdownContent(body.content.trim());
    }

    let targetPinned: boolean | undefined = undefined;
    if (body.isPinned !== undefined) {
      targetPinned = Boolean(body.isPinned);
      updateData.isPinned = targetPinned;
    }

    // Concurrency-safe announcement update with Community row locking if pinning
    const result = await updateAnnouncementWithPinLock(prisma, {
      communityId: community.id,
      announcementId: id,
      updateData,
      targetPinned,
      currentlyPinned: existing.isPinned,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    // Strictly NO notifications on edits or pin/unpin toggles
    return NextResponse.json({ announcement: result.announcement });
  } catch (error) {
    console.error("PATCH announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
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
    if (!memberCtx.isModeratorOrAbove) {
      if (community.visibility === CommunityVisibility.PRIVATE && !memberCtx.isActive) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.communityAnnouncement.findFirst({
      where: { id, communityId: community.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    if (!memberCtx.isAdminOrAbove && existing.createdByUserId !== auth.userId) {
      return NextResponse.json(
        { error: "Moderators can only delete their own announcements." },
        { status: 403 }
      );
    }

    await prisma.communityAnnouncement.delete({ where: { id } });

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("DELETE announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
