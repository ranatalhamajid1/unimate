import { notFound, redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { getMemberContext } from "@/app/lib/communities";
import { CommunityOrganizerHub } from "@/components/communities/community-organizer-hub";

export default async function CommunityManagePage({
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
          members: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  if (!community) {
    notFound();
  }

  const memberCtx = await getMemberContext(prisma, community.id, session.userId);
  if (!memberCtx.isModeratorOrAbove) {
    redirect(`/dashboard/communities/${slug}`);
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
    currentUserRole: memberCtx.role,
    currentUserStatus: memberCtx.status,
    isOwner: memberCtx.isOwner,
    isAdmin: memberCtx.isAdminOrAbove,
    isModerator: memberCtx.isModeratorOrAbove,
  };

  return <CommunityOrganizerHub community={payload} currentUserId={session.userId} />;
}
