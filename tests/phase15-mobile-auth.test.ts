import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { mockState, resetMockState } from "./setup-prisma";

import { POST as mobileLoginRoute } from "../app/api/mobile/auth/login/route";
import { POST as mobileSignupRoute } from "../app/api/mobile/auth/signup/route";
import { POST as mobileLogoutRoute } from "../app/api/mobile/auth/logout/route";
import { GET as mobileMeRoute } from "../app/api/mobile/me/route";
import {
  POST as registerPushTokenRoute,
  DELETE as revokePushTokenRoute,
} from "../app/api/mobile/notifications/push-token/route";
import {
  authenticateMobile,
  generateMobileToken,
  unauthorizedResponse,
} from "../app/lib/mobile-auth";
import { decrypt } from "../app/lib/session";

describe("Phase 15: Mobile Authentication & API Boundary Suite", () => {
  const testPassword = "Password123";
  let user1Id = "user-mobile-1";
  let user2Id = "user-mobile-2";
  let user1Hash = "";
  let user2Hash = "";

  beforeEach(async () => {
    resetMockState();
    user1Hash = await bcrypt.hash(testPassword, 12);
    user2Hash = await bcrypt.hash("OtherPass456", 12);

    mockState.users.push(
      {
        id: user1Id,
        email: "alex@unimate.test",
        name: "Alex Johnson",
        passwordHash: user1Hash,
        createdAt: new Date("2026-09-01T10:00:00Z"),
        updatedAt: new Date("2026-09-01T10:00:00Z"),
      },
      {
        id: user2Id,
        email: "sarah@unimate.test",
        name: "Sarah Connor",
        passwordHash: user2Hash,
        createdAt: new Date("2026-09-02T10:00:00Z"),
        updatedAt: new Date("2026-09-02T10:00:00Z"),
      }
    );

    mockState.subscriptions.push({
      id: "sub-1",
      userId: user1Id,
      plan: "PRO",
      status: "ACTIVE",
      provider: "NONE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // ── 1. Mobile Login ────────────────────────────────────────────────────────
  test("1. Mobile login with valid credentials issues valid Bearer JWT and user profile", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "alex@unimate.test",
        password: testPassword,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await mobileLoginRoute(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(typeof json.token === "string" && json.token.length > 20);
    assert.equal(json.user.id, user1Id);
    assert.equal(json.user.email, "alex@unimate.test");
    assert.equal(json.user.name, "Alex Johnson");
    assert.equal((json.user as any).passwordHash, undefined);

    // Verify token can be decrypted
    const decrypted = await decrypt(json.token);
    assert.ok(decrypted);
    assert.equal(decrypted.userId, user1Id);
    assert.equal(decrypted.email, "alex@unimate.test");
  });

  test("2. Mobile login rejects invalid password with generic 401 error", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "alex@unimate.test",
        password: "WrongPassword99",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await mobileLoginRoute(req);
    assert.equal(res.status, 401);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, "Invalid email or password.");
    assert.equal(json.token, undefined);
  });

  test("3. Mobile login rejects non-existent email with generic 401 error", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "ghost@unimate.test",
        password: testPassword,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await mobileLoginRoute(req);
    assert.equal(res.status, 401);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, "Invalid email or password.");
  });

  test("4. Mobile login validates missing fields and invalid JSON body", async () => {
    const reqMissing = new NextRequest("http://localhost:3000/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "alex@unimate.test" }),
      headers: { "Content-Type": "application/json" },
    });
    const resMissing = await mobileLoginRoute(reqMissing);
    assert.equal(resMissing.status, 400);

    const reqBadEmail = new NextRequest("http://localhost:3000/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email", password: "Password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const resBadEmail = await mobileLoginRoute(reqBadEmail);
    assert.equal(resBadEmail.status, 400);
  });

  // ── 2. Mobile Signup ───────────────────────────────────────────────────────
  test("5. Mobile signup validates name, email, and password complexity", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "A", // too short
        email: "invalid-email",
        password: "short", // too short, no number
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await mobileSignupRoute(req);
    assert.equal(res.status, 400);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.errors?.name);
    assert.ok(json.errors?.email);
    assert.ok(json.errors?.password);
  });

  test("6. Mobile signup prevents duplicate email registration (409)", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Alex Duplicate",
        email: "alex@unimate.test",
        password: "StrongPassword1",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await mobileSignupRoute(req);
    assert.equal(res.status, 409);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.error.includes("already exists"));
  });

  test("7. Mobile signup creates user, hashes password, and returns valid token without leaking hash", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "New Student",
        email: "newstudent@unimate.test",
        password: "ValidPassword123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await mobileSignupRoute(req);
    assert.equal(res.status, 201);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(typeof json.token === "string");
    assert.equal(json.user.name, "New Student");
    assert.equal(json.user.email, "newstudent@unimate.test");
    assert.equal((json.user as any).passwordHash, undefined);

    // Verify user stored in mock database with bcrypt hash
    const stored = mockState.users.find((u: any) => u.email === "newstudent@unimate.test");
    assert.ok(stored);
    assert.ok(stored.passwordHash.startsWith("$2"));
    assert.notEqual(stored.passwordHash, "ValidPassword123");
  });

  // ── 3. Mobile Logout ───────────────────────────────────────────────────────
  test("8. Mobile logout endpoint returns successful acknowledgment", async () => {
    const res = await mobileLogoutRoute();
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.message, "Logged out successfully.");
  });

  // ── 4. Mobile /me & Authorization Guard ────────────────────────────────────
  test("9. Mobile /me rejects unauthenticated request (missing header) with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/me", {
      method: "GET",
    });

    const res = await mobileMeRoute(req);
    assert.equal(res.status, 401);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.code, "UNAUTHORIZED");
  });

  test("10. Mobile /me rejects invalid/tampered Bearer token with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid.fake.token",
      },
    });

    const res = await mobileMeRoute(req);
    assert.equal(res.status, 401);
  });

  test("11. Mobile /me with valid Bearer token returns profile and subscription without secrets", async () => {
    const token = await generateMobileToken({
      userId: user1Id,
      name: "Alex Johnson",
      email: "alex@unimate.test",
    });

    const req = new NextRequest("http://localhost:3000/api/mobile/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await mobileMeRoute(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.user.id, user1Id);
    assert.equal(json.user.email, "alex@unimate.test");
    assert.equal(json.user.name, "Alex Johnson");
    assert.equal(json.subscription.plan, "PRO");
    assert.equal(json.subscription.isPro, true);
    assert.equal((json.user as any).passwordHash, undefined);
  });

  test("12. User Isolation: Bearer token for User 2 strictly returns User 2 data", async () => {
    const tokenUser2 = await generateMobileToken({
      userId: user2Id,
      name: "Sarah Connor",
      email: "sarah@unimate.test",
    });

    const req = new NextRequest("http://localhost:3000/api/mobile/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenUser2}`,
      },
    });

    const res = await mobileMeRoute(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.user.id, user2Id);
    assert.equal(json.user.email, "sarah@unimate.test");
    assert.notEqual(json.user.id, user1Id);
    // User 2 has no explicit subscription record -> default FREE
    assert.equal(json.subscription.plan, "FREE");
    assert.equal(json.subscription.isPro, false);
  });

  // ── 5. Push Token Registration & Revocation ────────────────────────────────
  test("13. Push token registration enforces Bearer authentication", async () => {
    const unauthReq = new NextRequest(
      "http://localhost:3000/api/mobile/notifications/push-token",
      {
        method: "POST",
        body: JSON.stringify({ token: "ExponentPushToken[abc123xyz]" }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const unauthRes = await registerPushTokenRoute(unauthReq);
    assert.equal(unauthRes.status, 401);
  });

  test("14. Authenticated push token registration and revocation work correctly", async () => {
    const token = await generateMobileToken({
      userId: user1Id,
      name: "Alex Johnson",
      email: "alex@unimate.test",
    });

    const pushTokenStr = "ExponentPushToken[111222333]";

    // Register
    const regReq = new NextRequest(
      "http://localhost:3000/api/mobile/notifications/push-token",
      {
        method: "POST",
        body: JSON.stringify({ token: pushTokenStr, platform: "ios" }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const regRes = await registerPushTokenRoute(regReq);
    assert.equal(regRes.status, 200);
    const regJson = await regRes.json();
    assert.equal(regJson.success, true);

    const registered = mockState.devicePushTokens.find(
      (t: any) => t.token === pushTokenStr
    );
    assert.ok(registered);
    assert.equal(registered.userId, user1Id);
    assert.equal(registered.platform, "ios");

    // Revoke
    const revokeReq = new NextRequest(
      `http://localhost:3000/api/mobile/notifications/push-token?token=${encodeURIComponent(
        pushTokenStr
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const revokeRes = await revokePushTokenRoute(revokeReq);
    assert.equal(revokeRes.status, 200);

    const remaining = mockState.devicePushTokens.find(
      (t: any) => t.token === pushTokenStr
    );
    assert.equal(remaining, undefined);
  });
});
