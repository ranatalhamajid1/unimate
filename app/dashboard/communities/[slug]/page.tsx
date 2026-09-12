import { notFound, redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { CommunityVisibility, MembershipStatus } from "@/app/lib/communities";
import { CommunityDetailView } from "@/components/communities/community-detail-view";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;

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
    notFound();
  }

  const membership = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId: community.id,
        userId: session.userId,
      },
    },
  });

  const isActiveMember = membership?.status === MembershipStatus.ACTIVE;

  // Private enumeration protection: return 404 to non-members
  if (community.visibility === CommunityVisibility.PRIVATE && !isActiveMember) {
    notFound();
  }

  // Campus-only isolation
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { campusId: true },
  });

  if (
    community.visibility === CommunityVisibility.CAMPUS_ONLY &&
    !isActiveMember &&
    (!user || user.campusId !== community.campusId)
  ) {
    notFound();
  }

  const payload = {
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
    createdAt: community.createdAt.toISOString(),
    university: community.university,
    campus: community.campus,
    department: community.department,
    memberCount: (community as any)._count?.members ?? 0,
    currentUserRole: membership?.role ?? null,
    currentUserStatus: membership?.status ?? null,
    isMember: isActiveMember,
  };

  return <CommunityDetailView initialCommunity={payload} currentUserId={session.userId} />;
}
