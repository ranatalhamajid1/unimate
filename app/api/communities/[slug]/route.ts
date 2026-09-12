import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  CommunityVisibility,
  MemberRole,
  MembershipStatus,
  generateUniqueSlug,
  checkDuplicateCommunity,
  checkOfficialImpersonation,
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
      include: {
        university: { select: { id: true, name: true, shortName: true } },
        campus: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        _count: {
          select: {
            members: {
              where: { status: MembershipStatus.ACTIVE },
            },
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    let user: any = null;
    let membership: any = null;

    if (auth) {
      user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { id: true, universityId: true, campusId: true },
      });

      membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: auth.userId,
          },
        },
      });
    }

    const isActiveMember = membership?.status === MembershipStatus.ACTIVE;

    // Visibility & Slug enumeration protection:
    // PRIVATE communities MUST return 404 to non-members
    if (community.visibility === CommunityVisibility.PRIVATE && !isActiveMember) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // CAMPUS_ONLY isolation
    if (
      community.visibility === CommunityVisibility.CAMPUS_ONLY &&
      !isActiveMember &&
      (!user || user.campusId !== community.campusId)
    ) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
        description: community.description,
        avatarUrl: community.avatarUrl,
        bannerUrl: community.bannerUrl,
        type: community.type,
        scope: community.scope,
        visibility: community.visibility,
        isVerified: community.isVerified,
        courseCode: community.courseCode,
        maxMembers: community.maxMembers,
        requiresApproval: community.requiresApproval,
        createdAt: community.createdAt,
        university: community.university,
        campus: community.campus,
        department: community.department,
        memberCount: (community as any)._count?.members ?? 0,
        currentUserRole: membership?.role ?? null,
        currentUserStatus: membership?.status ?? null,
        isMember: isActiveMember,
      },
    });
  } catch (error: any) {
    console.error("GET /api/communities/[slug] error:", error);
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { slug } = await params;
    const community = await prisma.community.findUnique({
      where: { slug },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check authorization: must be OWNER or ADMIN
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: auth.userId,
        },
      },
    });

    if (
      !membership ||
      membership.status !== MembershipStatus.ACTIVE ||
      (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to modify this community." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Mass assignment prevention: strictly destructure permitted mutable fields
    const {
      description,
      avatarUrl,
      bannerUrl,
      requiresApproval,
      maxMembers,
      courseCode,
      name,
    } = body;

    const dataToUpdate: any = {};

    if (description !== undefined) {
      if (typeof description !== "string" || description.length > 500) {
        return NextResponse.json(
          { error: "Description cannot exceed 500 characters." },
          { status: 400 }
        );
      }
      dataToUpdate.description = description.trim();
    }

    if (avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    }

    if (bannerUrl !== undefined) {
      dataToUpdate.bannerUrl = bannerUrl ? String(bannerUrl).trim() : null;
    }

    if (courseCode !== undefined) {
      dataToUpdate.courseCode = courseCode ? String(courseCode).trim().toUpperCase() : null;
    }

    if (requiresApproval !== undefined) {
      dataToUpdate.requiresApproval = Boolean(requiresApproval);
    }

    if (maxMembers !== undefined) {
      dataToUpdate.maxMembers = Math.min(2000, Math.max(10, Number(maxMembers) || 500));
    }

    // Only OWNER can rename a community
    if (name !== undefined && name.trim() !== community.name) {
      if (membership.role !== MemberRole.OWNER) {
        return NextResponse.json(
          { error: "Only the community owner can rename the community." },
          { status: 403 }
        );
      }

      const trimmedName = name.trim();
      if (trimmedName.length < 3 || trimmedName.length > 80) {
        return NextResponse.json(
          { error: "Name must be between 3 and 80 characters." },
          { status: 400 }
        );
      }

      const impersonation = checkOfficialImpersonation(trimmedName, community.isVerified);
      if (impersonation.isImpersonating) {
        return NextResponse.json(
          { error: impersonation.reason || "Reserved university title cannot be used." },
          { status: 400 }
        );
      }

      const dupCheck = await checkDuplicateCommunity(
        prisma,
        community.universityId,
        trimmedName,
        community.id
      );
      if (dupCheck.isDuplicate) {
        return NextResponse.json(
          { error: `A community with this name already exists in your university ("${dupCheck.existingName}").` },
          { status: 409 }
        );
      }

      dataToUpdate.name = trimmedName;
      dataToUpdate.slug = await generateUniqueSlug(prisma, trimmedName);
    }

    const updatedCommunity = await prisma.community.update({
      where: { id: community.id },
      data: dataToUpdate,
      include: {
        university: { select: { id: true, name: true, shortName: true } },
        campus: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      message: "Community updated successfully",
      community: updatedCommunity,
    });
  } catch (error: any) {
    console.error("PATCH /api/communities/[slug] error:", error);
    return NextResponse.json({ error: "Failed to update community" }, { status: 500 });
  }
}
