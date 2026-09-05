/**
 * proxy.ts — Next.js 16 route protection (replaces deprecated middleware.ts).
 *
 * NOTE: In Next.js 16, the file must be named `proxy.ts` and the exported
 * function must be named `proxy` (not `middleware`). The middleware.ts
 * convention is deprecated and silently ignored in Next.js 16.
 *
 * Optimistic checks only — reads the session JWT from the cookie without
 * hitting the database. This is intentional for performance; the actual
 * route/page can perform a deeper verification if needed.
 *
 * Rules:
 *  - Unauthenticated users visiting /dashboard  → redirect to /login
 *  - Authenticated users visiting /login|/signup → redirect to /dashboard
 *  - All other routes pass through
 */

import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/app/lib/session";

const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Read session JWT from cookie (optimistic — no DB call)
  const token = req.cookies.get("session")?.value;
  const session = await decrypt(token);

  const isAuthenticated = Boolean(session?.userId);

  // Unauthenticated → block protected routes
  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated → redirect away from auth pages
  if (isAuthRoute && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run proxy on all routes except Next.js internals and static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
