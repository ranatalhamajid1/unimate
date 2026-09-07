/**
 * Device Push Token management for mobile notifications.
 */

import "server-only";
import { prisma } from "@/app/lib/prisma";

export async function registerDevicePushToken(
  userId: string,
  token: string,
  platform: string
): Promise<{ success: boolean; id: string }> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("Token cannot be empty");
  }

  const normalizedPlatform = platform.toLowerCase() === "ios" ? "ios" : "android";

  const record = await prisma.devicePushToken.upsert({
    where: { token: trimmed },
    create: {
      userId,
      token: trimmed,
      platform: normalizedPlatform,
    },
    update: {
      userId,
      platform: normalizedPlatform,
    },
  });

  return { success: true, id: record.id };
}

export async function revokeDevicePushToken(
  userId: string,
  token: string
): Promise<boolean> {
  const trimmed = token.trim();
  const res = await prisma.devicePushToken.deleteMany({
    where: {
      userId,
      token: trimmed,
    },
  });
  return res.count > 0;
}
