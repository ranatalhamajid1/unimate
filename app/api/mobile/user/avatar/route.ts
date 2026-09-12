import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { prisma } from "@/app/lib/prisma";
import { getStorageProvider, extractAvatarKey } from "@/app/lib/storage";

export async function DELETE(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session || !session.userId) {
      return unauthorizedResponse();
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true },
    });

    if (!currentUser || !currentUser.avatarUrl) {
      return NextResponse.json({ success: true, message: "No avatar to delete" });
    }

    const oldKey = extractAvatarKey(currentUser.avatarUrl);

    // 1. Clear database reference
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: null },
    });

    // 2. Delete from storage
    if (oldKey) {
      const storage = getStorageProvider();
      await storage.deleteAvatar(oldKey).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/mobile/user/avatar:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete avatar." },
      { status: 500 }
    );
  }
}
