import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function GET(req: NextRequest) {
  // Strictly disabled in production
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return NextResponse.json(
      { error: "SESSION_SECRET environment variable is not configured" },
      { status: 500 }
    );
  }

  const encodedKey = new TextEncoder().encode(sessionSecret);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const token = await new SignJWT({
    userId: "student-dev-test",
    name: "Alex Johnson",
    email: "alex@unimate.test",
    expiresAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  let safeRedirect = "/dashboard";
  const redirectParam = req.nextUrl.searchParams.get("redirect");
  if (
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//") &&
    !redirectParam.startsWith("/\\") &&
    !redirectParam.includes("://")
  ) {
    safeRedirect = redirectParam;
  }

  const url = new URL(safeRedirect, req.url);

  const res = NextResponse.redirect(url);
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return res;
}
