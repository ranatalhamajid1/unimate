import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { prisma } from "@/app/lib/prisma";
import { validateImageMagicBytes, sanitizeImageBuffer } from "@/app/lib/image-validation";
import { getStorageProvider, extractAvatarKey } from "@/app/lib/storage";
import { checkAvatarRateLimit } from "@/app/lib/avatar-rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session || !session.userId) {
      return unauthorizedResponse();
    }

    if (!checkAvatarRateLimit(session.userId)) {
      return NextResponse.json(
        { success: false, error: "Too many avatar upload attempts. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // Validate magic bytes & size
    const validation = validateImageMagicBytes(rawBuffer);
    if (!validation.valid || !validation.mimeType) {
      return NextResponse.json({ success: false, error: validation.error || "Invalid file" }, { status: 400 });
    }

    // Strip EXIF / GPS metadata
    const sanitizedBuffer = sanitizeImageBuffer(rawBuffer, validation.mimeType);

    // Fetch existing user to find old avatar key
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true },
    });

    const storage = getStorageProvider();

    // 1. Upload new avatar first
    const uploadResult = await storage.uploadAvatar(session.userId, sanitizedBuffer, validation.mimeType);

    // 2. Update database atomically
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: uploadResult.url },
    });

    // 3. Delete old avatar only after successful DB update
    if (currentUser?.avatarUrl) {
      const oldKey = extractAvatarKey(currentUser.avatarUrl);
      if (oldKey) {
        await storage.deleteAvatar(oldKey).catch((err) => {
          console.warn("Could not delete previous avatar:", err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl: uploadResult.url,
    });
  } catch (error: any) {
    console.error("Error in POST /api/mobile/user/avatar/upload:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload avatar." },
      { status: 500 }
    );
  }
}
