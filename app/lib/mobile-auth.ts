/**
 * Mobile Authentication & Session Verification Helper.
 *
 * Dedicated Bearer JWT authentication for UniMate mobile application.
 * Verifies short-lived/stateless JWTs signed with SESSION_SECRET server-side.
 * Never trusts client-supplied userId.
 */

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { encrypt, decrypt } from "@/app/lib/session";

import { findUserById } from "@/app/lib/users";

export interface MobileSession {
  userId: string;
  name: string;
  email: string;
}

/**
 * Authenticates a mobile request via Authorization: Bearer <token>.
 * Returns the verified session or null if missing/invalid/expired or user nonexistent.
 */
export async function authenticateMobile(
  req: NextRequest | Request
): Promise<MobileSession | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  const payload = await decrypt(token);
  if (!payload || !payload.userId) {
    return null;
  }

  // Verify the user exists in PostgreSQL (guards against deleted/nonexistent user tokens)
  const user = await findUserById(payload.userId);
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Generates a signed Bearer JWT for mobile clients.
 */
export async function generateMobileToken(payload: {
  userId: string;
  name: string;
  email: string;
}): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return encrypt({
    userId: payload.userId,
    name: payload.name,
    email: payload.email,
    expiresAt,
  });
}

/**
 * Standardized 401 Unauthorized response for mobile API.
 */
export function unauthorizedResponse(
  message = "Unauthorized: Missing or invalid token"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}
