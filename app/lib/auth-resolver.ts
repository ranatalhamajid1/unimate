import "server-only";

import { NextRequest } from "next/server";
import { getSession } from "@/app/lib/session";
import { authenticateMobile } from "@/app/lib/mobile-auth";

export type ResolvedAuth = {
  userId: string;
  source: "mobile" | "web";
};

/**
 * Resolves user authentication from either:
 * 1. Mobile Authorization: Bearer <jwt> header
 * 2. Web Cookie session
 * Returns userId or null if unauthenticated.
 */
export async function resolveAuth(req: NextRequest): Promise<ResolvedAuth | null> {
  // 1. Check Bearer token first (Mobile)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const mobileSession = await authenticateMobile(req);
    if (mobileSession && mobileSession.userId) {
      return { userId: mobileSession.userId, source: "mobile" };
    }
  }

  // 2. Check Cookie session (Web)
  const webSession = await getSession();
  if (webSession && webSession.userId) {
    return { userId: webSession.userId, source: "web" };
  }

  return null;
}
