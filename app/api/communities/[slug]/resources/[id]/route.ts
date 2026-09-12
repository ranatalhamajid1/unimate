import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { getMemberContext } from "@/app/lib/communities";

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
    if (community.visibility === "PRIVATE" && !memberCtx.isActive) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const resource = await prisma.communityResource.findFirst({
      where: { id, communityId: community.id },
    });
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const isCreator = resource.createdByUserId === auth.userId;
    if (!memberCtx.isModeratorOrAbove && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.communityResource.delete({ where: { id } });

    return NextResponse.json({ message: "Resource deleted" });
  } catch (error) {
    console.error("DELETE resource error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
