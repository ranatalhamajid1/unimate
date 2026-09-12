import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import "./setup-prisma";
import { mockState, resetMockState, mockPrisma } from "./setup-prisma";
const prisma = mockPrisma as any;
import {
  initiateGoogleCalendarOAuth,
  handleGoogleCalendarCallback,
  getOrRefreshGoogleAccessToken,
  getOrCreateUniMateCalendar,
  syncGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  computeEntitySyncHash,
  generatePKCE,
  acquireSyncLock,
  releaseSyncLock,
  SyncConcurrencyError,
  ReauthRequiredError,
  DEDICATED_CALENDAR_SUMMARY,
  DEFAULT_ACADEMIC_TIMEZONE,
  GOOGLE_CALENDAR_SCOPES,
} from "../app/lib/integrations/google-calendar";
import { encryptToken, decryptToken } from "../app/lib/integrations/token-cipher";
import { NextRequest } from "next/server";
import { GET as getStatusRoute } from "../app/api/integrations/google-calendar/status/route";
import { POST as syncRoute } from "../app/api/integrations/google-calendar/sync/route";
import { POST as disconnectRoute } from "../app/api/integrations/google-calendar/disconnect/route";
import { POST as authUrlRoute } from "../app/api/integrations/google-calendar/auth-url/route";
import { GET as callbackRoute } from "../app/api/integrations/google-calendar/callback/route";
import { POST as mobileSyncRoute } from "../app/api/mobile/integrations/google-calendar/sync/route";
import { GET as mobileStatusRoute } from "../app/api/mobile/integrations/google-calendar/status/route";
import { encrypt } from "../app/lib/session";
import { generateMobileToken } from "../app/lib/mobile-auth";

describe("Milestone 14 Phase 14.2 — Google Calendar Integration Suite", () => {
  beforeEach(() => {
    resetMockState();
  });

  describe("1. OAuth 2.0 PKCE, Minimum Scopes & State Security", () => {
    it("requests strictly the single minimum required scope for dedicated calendar management", () => {
      assert.deepEqual(
        GOOGLE_CALENDAR_SCOPES,
        ["https://www.googleapis.com/auth/calendar"],
        "Must strictly request https://www.googleapis.com/auth/calendar without redundant calendar.events"
      );
    });

    it("generates high-entropy PKCE verifier and S256 code_challenge", () => {
      const { codeVerifier, codeChallenge } = generatePKCE();
      assert.ok(codeVerifier.length >= 43, "codeVerifier must be at least 43 characters");
      assert.ok(codeChallenge.length >= 43, "codeChallenge must be at least 43 characters");
      assert.notEqual(codeVerifier, codeChallenge, "Verifier and challenge must be distinct");
    });

    it("initiates OAuth with server-side transaction and valid Google authorization URL", async () => {
      const { authUrl, state } = await initiateGoogleCalendarOAuth({
        userId: "user-test-1",
        clientType: "WEB",
        baseOrigin: "http://localhost:3000",
      });

      const parsedUrl = new URL(authUrl);
      assert.equal(parsedUrl.origin, "https://accounts.google.com");
      assert.equal(parsedUrl.pathname, "/o/oauth2/v2/auth");
      assert.equal(parsedUrl.searchParams.get("response_type"), "code");
      assert.equal(parsedUrl.searchParams.get("access_type"), "offline");
      assert.equal(parsedUrl.searchParams.get("prompt"), "consent");
      assert.equal(parsedUrl.searchParams.get("code_challenge_method"), "S256");
      assert.equal(parsedUrl.searchParams.get("state"), state);
      assert.equal(parsedUrl.searchParams.get("scope"), "https://www.googleapis.com/auth/calendar");

      // Verify transaction in DB
      const tx = mockState.oauthTransactions.find((t: any) => t.state === state);
      assert.ok(tx, "OAuth transaction must exist in database");
      assert.equal(tx.userId, "user-test-1");
      assert.equal(tx.clientType, "WEB");
      assert.ok(tx.codeVerifier.startsWith("v1:"), "PKCE verifier must be encrypted at rest");
    });

    it("handles OAuth callback, exchanges code, and saves encrypted credentials", async () => {
      const { state } = await initiateGoogleCalendarOAuth({
        userId: "user-test-2",
        clientType: "WEB",
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        if (typeof url === "string" && url.includes("oauth2.googleapis.com/token")) {
          return new Response(
            JSON.stringify({
              access_token: "mock-access-token-123",
              refresh_token: "mock-refresh-token-456",
              expires_in: 3600,
              scope: "https://www.googleapis.com/auth/calendar",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return originalFetch(url, options);
      };

      try {
        const result = await handleGoogleCalendarCallback({
          code: "valid-auth-code",
          state,
        });

        assert.equal(result.success, true);
        assert.equal(result.userId, "user-test-2");
        assert.equal(result.clientType, "WEB");

        const integration = await prisma.userIntegration.findUnique({
          where: {
            userId_provider: {
              userId: "user-test-2",
              provider: "GOOGLE_CALENDAR",
            },
          },
        });

        assert.ok(integration, "UserIntegration must be created");
        assert.equal(integration.status, "CONNECTED");
        assert.ok(integration.encryptedAccessToken?.startsWith("v1:"), "Access token must be encrypted");
        assert.ok(integration.encryptedRefreshToken?.startsWith("v1:"), "Refresh token must be encrypted");
        assert.equal(decryptToken(integration.encryptedAccessToken!), "mock-access-token-123");
        assert.equal(decryptToken(integration.encryptedRefreshToken!), "mock-refresh-token-456");

        const tx = mockState.oauthTransactions.find((t: any) => t.state === state);
        assert.ok(tx.consumedAt instanceof Date, "Transaction must be consumed");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("rejects replayed OAuth callback with ALREADY_CONSUMED", async () => {
      const { state } = await initiateGoogleCalendarOAuth({
        userId: "user-test-3",
        clientType: "WEB",
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ access_token: "token-1", refresh_token: "refresh-1", expires_in: 3600 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      try {
        const first = await handleGoogleCalendarCallback({ code: "code-1", state });
        assert.equal(first.success, true);

        const second = await handleGoogleCalendarCallback({ code: "code-1", state });
        assert.equal(second.success, false);
        assert.ok(second.error?.includes("ALREADY_CONSUMED"));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("mobile callback redirects to unimate:// scheme with zero secrets in URL", async () => {
      const { state } = await initiateGoogleCalendarOAuth({
        userId: "user-mobile-1",
        clientType: "MOBILE",
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ access_token: "secret-token", refresh_token: "secret-refresh", expires_in: 3600 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      try {
        const req = new NextRequest(`http://localhost:3000/api/integrations/google-calendar/callback?code=mock-code&state=${state}`);
        const response = await callbackRoute(req);

        assert.equal(response.status, 307);
        const redirectLocation = response.headers.get("location") || "";

        assert.ok(redirectLocation.startsWith("unimate://integrations/callback"), "Must redirect to unimate:// scheme");
        assert.ok(redirectLocation.includes("status=success"));
        assert.ok(redirectLocation.includes("provider=google_calendar"));
        assert.ok(!redirectLocation.includes("secret-token"), "Must not leak access token in deep link");
        assert.ok(!redirectLocation.includes("secret-refresh"), "Must not leak refresh token in deep link");
        assert.ok(!redirectLocation.includes("user-mobile-1"), "Must not leak userId in deep link");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("2. Token Lifecycle, Refresh & Security Isolation", () => {
    it("refreshes expired access token and updates encrypted credentials", async () => {
      const integration = await prisma.userIntegration.create({
        data: {
          userId: "user-refresh-1",
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("old-access-token"),
          encryptedRefreshToken: encryptToken("valid-refresh-token"),
          tokenExpiresAt: new Date(Date.now() - 60 * 1000),
        },
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        if (typeof url === "string" && url.includes("oauth2.googleapis.com/token")) {
          return new Response(
            JSON.stringify({ access_token: "brand-new-access-token", expires_in: 3600 }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return originalFetch(url, options);
      };

      try {
        const freshToken = await getOrRefreshGoogleAccessToken("user-refresh-1", integration);
        assert.equal(freshToken, "brand-new-access-token");

        const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
        assert.equal(decryptToken(updated!.encryptedAccessToken!), "brand-new-access-token");
        assert.ok(updated!.tokenExpiresAt!.getTime() > Date.now());
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("handles invalid_grant by setting NEEDS_REAUTH and creating deduplicated notification", async () => {
      const integration = await prisma.userIntegration.create({
        data: {
          userId: "user-reauth-1",
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("old-token"),
          encryptedRefreshToken: encryptToken("revoked-refresh-token"),
          tokenExpiresAt: new Date(Date.now() - 10000),
        },
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Token has been expired or revoked." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      };

      try {
        await assert.rejects(
          async () => {
            await getOrRefreshGoogleAccessToken("user-reauth-1", integration);
          },
          ReauthRequiredError
        );

        const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
        assert.equal(updated!.status, "NEEDS_REAUTH");

        const notifications = await prisma.notification.findMany({
          where: { userId: "user-reauth-1" },
        });
        assert.equal(notifications.length, 1);
        assert.equal(notifications[0].type, "INTEGRATION_REAUTH_REQUIRED");
        assert.equal(notifications[0].relatedId, "integration:google_calendar:reauth_required");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("status API strictly redacts all encrypted token fields", async () => {
      await prisma.userIntegration.create({
        data: {
          userId: "user-status-1",
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("sensitive-access-token"),
          encryptedRefreshToken: encryptToken("sensitive-refresh-token"),
          calendarId: "cal-unimate-1",
          scopes: ["https://www.googleapis.com/auth/calendar"],
        },
      });

      const status = await getGoogleCalendarStatus("user-status-1");
      assert.equal(status.connected, true);
      assert.equal(status.calendarId, "cal-unimate-1");
      assert.equal((status as any).encryptedAccessToken, undefined, "Encrypted access token must never be in status");
      assert.equal((status as any).encryptedRefreshToken, undefined, "Encrypted refresh token must never be in status");
    });
  });

  describe("3. Dedicated Calendar Creation & Discovery", () => {
    it("discovers existing UniMate Academic calendar from calendarList", async () => {
      const integration = await prisma.userIntegration.create({
        data: {
          userId: "user-cal-1",
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
        },
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        if (typeof url === "string" && url.includes("/users/me/calendarList")) {
          return new Response(
            JSON.stringify({
              items: [
                { id: "primary", summary: "Personal Calendar" },
                { id: "discovered-unimate-cal-123", summary: DEDICATED_CALENDAR_SUMMARY, deleted: false },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return originalFetch(url);
      };

      try {
        const calId = await getOrCreateUniMateCalendar("mock-token", integration);
        assert.equal(calId, "discovered-unimate-cal-123");

        const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
        assert.equal(updated!.calendarId, "discovered-unimate-cal-123");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("creates dedicated UniMate Academic calendar with Asia/Karachi timezone if none exists", async () => {
      const integration = await prisma.userIntegration.create({
        data: {
          userId: "user-cal-2",
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
        },
      });

      let createPayload: any = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        if (typeof url === "string" && url.includes("/users/me/calendarList")) {
          return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (typeof url === "string" && url.endsWith("/calendars") && options?.method === "POST") {
          createPayload = JSON.parse(options.body);
          return new Response(JSON.stringify({ id: "newly-created-cal-456" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, options);
      };

      try {
        const calId = await getOrCreateUniMateCalendar("mock-token", integration);
        assert.equal(calId, "newly-created-cal-456");
        assert.equal(createPayload.summary, DEDICATED_CALENDAR_SUMMARY);
        assert.equal(createPayload.timeZone, DEFAULT_ACADEMIC_TIMEZONE);

        const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
        assert.equal(updated!.calendarId, "newly-created-cal-456");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("4. Sync Lock Ownership & Concurrency Protection", () => {
    it("fencing token prevents an expired lock owner from clearing a newer owner's lease", async () => {
      const integration = await prisma.userIntegration.create({
        data: {
          userId: "user-fence-1",
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
          calendarId: "cal-fence",
        },
      });

      // 1. Sync A acquires lock
      const lockA = await acquireSyncLock(integration.id);
      assert.equal(lockA.acquired, true);
      assert.ok(lockA.lockToken);

      // 2. Simulate lease expiry by fast-forwarding syncLockExpiresAt to the past
      await prisma.userIntegration.update({
        where: { id: integration.id },
        data: { syncLockExpiresAt: new Date(Date.now() - 1000) },
      });

      // 3. Sync B acquires the expired lock
      const lockB = await acquireSyncLock(integration.id);
      assert.equal(lockB.acquired, true);
      assert.ok(lockB.lockToken);
      assert.notEqual(lockA.lockToken, lockB.lockToken, "Sync B must receive a distinct lock token");

      // 4. Sync A finishes late and attempts to release the lock with tokenA
      const releasedByA = await releaseSyncLock(integration.id, lockA.lockToken!);
      assert.equal(releasedByA, false, "Sync A must NOT be allowed to release Sync B's lock");

      // 5. Verify Sync B's lock is still intact in the database
      const stateAfterA = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
      assert.equal(stateAfterA!.syncLockToken, lockB.lockToken, "Sync B's lock token must still be active");
      assert.ok(stateAfterA!.syncLockExpiresAt!.getTime() > Date.now(), "Sync B's lease must not be cleared");

      // 6. Sync B finishes and releases the lock with tokenB
      const releasedByB = await releaseSyncLock(integration.id, lockB.lockToken!);
      assert.equal(releasedByB, true, "Sync B must successfully release its own lock");

      const stateAfterB = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
      assert.equal(stateAfterB!.syncLockToken, null);
      assert.equal(stateAfterB!.syncLockExpiresAt, null);
    });

    it("prevents concurrent sync via active lock returning 409 Conflict", async () => {
      const userId = "user-lock-active";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
          calendarId: "cal-1",
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          syncLockExpiresAt: new Date(Date.now() + 60 * 1000), // Active lock
          syncLockToken: "active-lock-token",
        },
      });

      await assert.rejects(
        async () => {
          await syncGoogleCalendar(userId);
        },
        SyncConcurrencyError
      );
    });
  });

  describe("5. Timetable Recurring Events & Deterministic Deduplication", () => {
    it("maps 1 TimetableEntry to exactly 1 recurring Google event with RFC 5545 recurrence", async () => {
      const userId = "user-tt-1";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
          calendarId: "cal-tt-1",
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // Seed a class on Tuesday (dayOfWeek: 2) from 10:00 to 11:30
      const entry = await prisma.timetableEntry.create({
        data: {
          userId,
          courseId: "course-cs101",
          dayOfWeek: 2, // Tuesday
          startTime: "10:00",
          endTime: "11:30",
          room: "Lecture Hall B",
          type: "Lecture",
        },
      });

      let createdEventPayload: any = null;
      let patchPayload: any = null;
      let postCallCount = 0;
      let patchCallCount = 0;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        if (typeof url === "string" && url.includes("/events/") && options?.method === "PATCH") {
          patchCallCount++;
          patchPayload = JSON.parse(options.body);
          return new Response(JSON.stringify({ id: "gcal-recurring-class-1" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (typeof url === "string" && url.includes("/events") && options?.method === "POST") {
          postCallCount++;
          createdEventPayload = JSON.parse(options.body);
          return new Response(JSON.stringify({ id: "gcal-recurring-class-1" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (typeof url === "string" && url.includes("/calendars/")) {
          return new Response(JSON.stringify({ id: "cal-tt-1" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, options);
      };

      try {
        // 1. First sync creates exactly ONE recurring event
        const firstSync = await syncGoogleCalendar(userId);
        assert.equal(firstSync.timetableSynced, 1);
        assert.equal(postCallCount, 1);
        assert.ok(createdEventPayload.recurrence);
        assert.deepEqual(createdEventPayload.recurrence, ["RRULE:FREQ=WEEKLY;BYDAY=TU"], "Recurrence must specify BYDAY=TU for Tuesday");

        // Verify exactly ONE mapping was created
        const mappings = await prisma.externalRecordMapping.findMany({
          where: { userId, provider: "GOOGLE_CALENDAR", entityType: "TIMETABLE", internalId: entry.id },
        });
        assert.equal(mappings.length, 1, "Must create exactly 1 mapping for timetable entry");
        assert.equal(mappings[0].externalId, "gcal-recurring-class-1");

        // 2. Second sync with no changes makes ZERO Google API calls
        const secondSync = await syncGoogleCalendar(userId);
        assert.equal(secondSync.skippedUnchanged, 1);
        assert.equal(secondSync.timetableSynced, 0);
        assert.equal(postCallCount, 1, "Must make 0 new event creations");
        assert.equal(patchCallCount, 0, "Must make 0 patch updates");

        // 3. Update the timetable entry room
        await prisma.timetableEntry.update({
          where: { id: entry.id },
          data: { room: "Room 304" },
        });

        // 4. Third sync updates the SAME recurring event
        const thirdSync = await syncGoogleCalendar(userId);
        assert.equal(thirdSync.timetableSynced, 1);
        assert.equal(patchCallCount, 1, "Must patch the existing recurring event");
        assert.equal(patchPayload.location, "Room 304");

        // Still exactly ONE mapping in the database
        const mappingsAfter = await prisma.externalRecordMapping.findMany({
          where: { userId, provider: "GOOGLE_CALENDAR", entityType: "TIMETABLE", internalId: entry.id },
        });
        assert.equal(mappingsAfter.length, 1);
        assert.equal(mappingsAfter[0].externalId, "gcal-recurring-class-1");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("6. Disconnect Resilience & Provider Outages", () => {
    it("safely clears local credentials and mappings when Google revocation fails (provider outage)", async () => {
      const userId = "user-outage-1";
      const integration = await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok-outage"),
          encryptedRefreshToken: encryptToken("ref-outage"),
          calendarId: "cal-outage-1",
        },
      });

      const exam = await prisma.exam.create({
        data: {
          userId,
          courseId: "c1",
          title: "Physics Exam",
          examDate: new Date(),
          type: "FINAL",
          status: "UPCOMING",
        },
      });

      await prisma.externalRecordMapping.create({
        data: {
          userId,
          integrationId: integration.id,
          provider: "GOOGLE_CALENDAR",
          entityType: "EXAM",
          internalId: exam.id,
          externalId: "gcal-evt-phys",
        },
      });

      // Simulate Google outage on revoke and calendar delete
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        if (typeof url === "string" && (url.includes("oauth2.googleapis.com/revoke") || url.includes("/calendars/"))) {
          return new Response("Internal Server Error (Google 500 Outage)", { status: 500 });
        }
        return originalFetch(url);
      };

      try {
        const res = await disconnectGoogleCalendar(userId, true);
        assert.equal(res.success, true);
        assert.equal(res.calendarDeleted, false, "Must report calendar deletion failure separately");

        // Stale local credentials MUST be safely cleared regardless of provider failure
        const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
        assert.equal(updated!.status, "DISCONNECTED");
        assert.equal(updated!.encryptedAccessToken, null);
        assert.equal(updated!.encryptedRefreshToken, null);

        // Mappings deleted
        const remainingMappings = await prisma.externalRecordMapping.findMany({
          where: { userId, provider: "GOOGLE_CALENDAR" },
        });
        assert.equal(remainingMappings.length, 0);

        // UniMate academic records 100% preserved
        const preservedExam = await prisma.exam.findFirst({ where: { userId, id: exam.id } });
        assert.ok(preservedExam, "Internal UniMate exam must never be deleted due to external provider outage");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("7. Strict Mobile vs. Web Authentication Boundary", () => {
    it("web sync route rejects request without Web Cookie session", async () => {
      const req = new NextRequest("http://localhost:3000/api/integrations/google-calendar/sync", {
        method: "POST",
      });
      const res = await syncRoute(req);
      assert.equal(res.status, 401, "Web route must reject unauthenticated request");
    });

    it("mobile sync route rejects request without Mobile Bearer JWT header", async () => {
      const req = new NextRequest("http://localhost:3000/api/mobile/integrations/google-calendar/sync", {
        method: "POST",
      });
      const res = await mobileSyncRoute(req);
      assert.equal(res.status, 401, "Mobile route must reject request without Bearer token");
    });

    it("mobile route accepts valid Mobile Bearer JWT and executes sync", async () => {
      const userId = "mobile-bearer-user";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
          calendarId: "cal-mob",
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      await prisma.user.create({
        data: {
          id: userId,
          email: "student@example.com",
          name: "Student",
          passwordHash: "dummy-hash",
        },
      });

      const token = await generateMobileToken({
        userId,
        email: "student@example.com",
        name: "Student",
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        if (typeof url === "string" && url.includes("/calendars/")) {
          return new Response(JSON.stringify({ id: "cal-mob" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url);
      };

      try {
        const req = new NextRequest("http://localhost:3000/api/mobile/integrations/google-calendar/sync", {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        const res = await mobileSyncRoute(req);
        assert.equal(res.status, 200, "Mobile route must authenticate valid Bearer JWT");
        const json = await res.json();
        assert.equal(json.success, true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
