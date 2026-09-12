/**
 * Session management — stateless JWT stored in an HttpOnly cookie.
 *
 * Uses `jose` for JWT sign/verify (Web Crypto compatible).
 * All functions are server-only — never imported by client components.
 */

import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Secret key
// ---------------------------------------------------------------------------

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is not set. " +
      "Generate one with: node -e \"require('crypto').randomBytes(32).toString('base64')\" " +
      "and add it to .env.local"
  );
}

const encodedKey = new TextEncoder().encode(SESSION_SECRET);

// ---------------------------------------------------------------------------
// Session payload shape
// ---------------------------------------------------------------------------

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
  expiresAt: string; // ISO 8601
};

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    // Expired or tampered token — treat as unauthenticated
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie operations
// ---------------------------------------------------------------------------

const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(
  userId: string,
  name: string,
  email: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const token = await encrypt({
    userId,
    name,
    email,
    expiresAt: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  if (process.env.NODE_ENV !== "production" && (globalThis as any).__mockSessionCookie !== undefined) {
    return decrypt((globalThis as any).__mockSessionCookie);
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    return decrypt(token);
  } catch {
    return null;
  }
}
