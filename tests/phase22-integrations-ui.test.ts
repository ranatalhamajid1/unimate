import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import "./setup-prisma";
import { mockState, resetMockState, mockPrisma } from "./setup-prisma";
const prisma = mockPrisma as any;
import {
  getGoogleCalendarStatus,
  GOOGLE_CALENDAR_SCOPES,
  DEDICATED_CALENDAR_SUMMARY,
} from "../app/lib/integrations/google-calendar";
import { encryptToken } from "../app/lib/integrations/token-cipher";
import { NextRequest } from "next/server";
import { GET as getStatusRoute } from "../app/api/integrations/google-calendar/status/route";
import { POST as syncRoute } from "../app/api/integrations/google-calendar/sync/route";
import { POST as disconnectRoute } from "../app/api/integrations/google-calendar/disconnect/route";
import { POST as authUrlRoute } from "../app/api/integrations/google-calendar/auth-url/route";
import { encrypt } from "../app/lib/session";

describe("Milestone 14 Phase 14.3 — Web Integration Center UI & API Invariants", () => {
  beforeEach(() => {
    resetMockState();
    (globalThis as any).__mockSessionCookie = undefined;
  });

  afterEach(() => {
    (globalThis as any).__mockSessionCookie = undefined;
  });

  describe("1. Connection States & Status Payload Hygiene", () => {
    it("returns clean DISCONNECTED state when user has never connected", async () => {
      const status = await getGoogleCalendarStatus("user-disc-1");
      assert.equal(status.connected, false);
      assert.equal(status.status, "DISCONNECTED");
      assert.equal(status.email, null);
      assert.equal(status.calendarId, null);
      assert.equal(status.lastSyncAt, null);
      assert.equal((status as any).encryptedAccessToken, undefined, "Zero token leakage");
      assert.equal((status as any).encryptedRefreshToken, undefined, "Zero token leakage");
    });

    it("returns clean CONNECTED state with email and calendar details", async () => {
      const userId = "user-conn-1";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("access-token-123"),
          encryptedRefreshToken: encryptToken("refresh-token-456"),
          externalAccountEmail: "student@university.edu",
          calendarId: "cal-unimate-academic",
          lastSyncAt: new Date("2026-09-12T10:00:00Z"),
          lastSyncStatus: "SUCCESS",
          scopes: GOOGLE_CALENDAR_SCOPES,
        },
      });

      const status = await getGoogleCalendarStatus(userId);
      assert.equal(status.connected, true);
      assert.equal(status.status, "CONNECTED");
      assert.equal(status.email, "student@university.edu");
      assert.equal(status.calendarId, "cal-unimate-academic");
      assert.ok(status.lastSyncAt);
      assert.equal(status.lastSyncStatus, "SUCCESS");

      // Verify zero sensitive credentials in returned object
      assert.equal((status as any).encryptedAccessToken, undefined);
      assert.equal((status as any).encryptedRefreshToken, undefined);
    });

    it("returns NEEDS_REAUTH state when token refresh fails with invalid_grant", async () => {
      const userId = "user-reauth-1";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "NEEDS_REAUTH",
          encryptedAccessToken: encryptToken("expired-token"),
          encryptedRefreshToken: encryptToken("invalid-refresh"),
          externalAccountEmail: "student@gmail.com",
          calendarId: "cal-1",
          lastError: "Google authorization expired or was revoked. Please reconnect.",
          scopes: GOOGLE_CALENDAR_SCOPES,
        },
      });

      const status = await getGoogleCalendarStatus(userId);
      assert.equal(status.connected, false);
      assert.equal(status.status, "NEEDS_REAUTH");
      assert.equal(status.email, "student@gmail.com");
      assert.ok(status.lastError?.includes("reconnect"));
    });

    it("returns ERROR state when a sync operation encountered a provider failure", async () => {
      const userId = "user-err-1";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "ERROR",
          encryptedAccessToken: encryptToken("valid-token"),
          calendarId: "cal-1",
          lastSyncStatus: "FAILED",
          lastError: "Google Calendar API 503 Backend Service Unavailable",
          scopes: GOOGLE_CALENDAR_SCOPES,
        },
      });

      const status = await getGoogleCalendarStatus(userId);
      assert.equal(status.connected, false);
      assert.equal(status.status, "ERROR");
      assert.equal(status.lastSyncStatus, "FAILED");
      assert.ok(status.lastError?.includes("503"));
    });
  });

  describe("2. Sync Now Flow & Feedback Handling", () => {
    it("reports sync counts and updates lastSyncAt upon successful synchronization", async () => {
      const userId = "user-sync-test";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("valid-tok"),
          encryptedRefreshToken: encryptToken("valid-ref"),
          calendarId: "cal-sync-test",
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // Seed 1 exam, 1 assignment, 1 timetable class
      await prisma.exam.create({
        data: {
          userId,
          courseId: "c1",
          title: "Operating Systems Final",
          examDate: new Date(Date.now() + 86400 * 1000 * 3),
        },
      });
      await prisma.assignment.create({
        data: {
          userId,
          courseId: "c1",
          title: "Kernel Module Lab",
          dueDate: new Date(Date.now() + 86400 * 1000 * 2),
        },
      });
      await prisma.timetableEntry.create({
        data: {
          userId,
          courseId: "c1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:30",
          type: "Lecture",
        },
      });

      const sessionCookie = await encrypt({
        userId,
        email: "user@test.com",
        name: "User",
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      });
      (globalThis as any).__mockSessionCookie = sessionCookie;

      const req = new NextRequest("http://localhost:3000/api/integrations/google-calendar/sync", {
        method: "POST",
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        if (typeof url === "string" && url.includes("/events")) {
          return new Response(JSON.stringify({ id: `gcal-ev-${Math.random()}` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (typeof url === "string" && url.includes("/calendars/")) {
          return new Response(JSON.stringify({ id: "cal-sync-test" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return originalFetch(url, options);
      };

      try {
        const res = await syncRoute(req);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.examsSynced, 1);
        assert.equal(json.assignmentsSynced, 1);
        assert.equal(json.timetableSynced, 1);

        // Verify status reflects update
        const updatedStatus = await getGoogleCalendarStatus(userId);
        assert.equal(updatedStatus.lastSyncStatus, "SUCCESS");
        assert.ok(updatedStatus.lastSyncAt);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("returns 409 Conflict when a concurrent sync is active", async () => {
      const userId = "user-conflict-test";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
          calendarId: "cal-conf",
          syncLockExpiresAt: new Date(Date.now() + 60 * 1000), // Active lock
          syncLockToken: "active-lock-token",
        },
      });

      const sessionCookie = await encrypt({
        userId,
        email: "user@test.com",
        name: "User",
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      });
      (globalThis as any).__mockSessionCookie = sessionCookie;

      const req = new NextRequest("http://localhost:3000/api/integrations/google-calendar/sync", {
        method: "POST",
      });

      const res = await syncRoute(req);
      assert.equal(res.status, 409);
      const json = await res.json();
      assert.ok(json.error);
    });
  });

  describe("3. Disconnect Confirmation & Calendar Purge Toggle", () => {
    it("disconnects integration without deleting calendar when deleteCalendar is false", async () => {
      const userId = "user-disc-retain";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
          calendarId: "cal-retain",
        },
      });

      let calendarDeleted = false;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        if (typeof url === "string" && url.includes("/calendars/cal-retain") && options?.method === "DELETE") {
          calendarDeleted = true;
          return new Response(null, { status: 204 });
        }
        if (typeof url === "string" && url.includes("oauth2.googleapis.com/revoke")) {
          return new Response("", { status: 200 });
        }
        return originalFetch(url, options);
      };

      try {
        const sessionCookie = await encrypt({
          userId,
          email: "user@test.com",
          name: "User",
          expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
        });
        (globalThis as any).__mockSessionCookie = sessionCookie;

        const req = new NextRequest("http://localhost:3000/api/integrations/google-calendar/disconnect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deleteCalendar: false }),
        });

        const res = await disconnectRoute(req);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.calendarDeleted, false);
        assert.equal(calendarDeleted, false, "Must NOT call Google DELETE calendar endpoint");

        const status = await getGoogleCalendarStatus(userId);
        assert.equal(status.status, "DISCONNECTED");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("purges secondary calendar on Google when deleteCalendar is true", async () => {
      const userId = "user-disc-delete";
      await prisma.userIntegration.create({
        data: {
          userId,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("tok"),
          encryptedRefreshToken: encryptToken("ref"),
          calendarId: "cal-delete",
        },
      });

      let calendarDeleted = false;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        if (typeof url === "string" && url.includes("/calendars/cal-delete") && options?.method === "DELETE") {
          calendarDeleted = true;
          return new Response(null, { status: 204 });
        }
        if (typeof url === "string" && url.includes("oauth2.googleapis.com/revoke")) {
          return new Response("", { status: 200 });
        }
        return originalFetch(url, options);
      };

      try {
        const sessionCookie = await encrypt({
          userId,
          email: "user@test.com",
          name: "User",
          expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
        });
        (globalThis as any).__mockSessionCookie = sessionCookie;

        const req = new Request("http://localhost:3000/api/integrations/google-calendar/disconnect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deleteCalendar: true }),
        }) as any;

        const res = await disconnectRoute(req);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.calendarDeleted, true);
        assert.equal(calendarDeleted, true, "Must call Google DELETE calendar endpoint");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("4. Tenant Isolation & Privacy Invariants", () => {
    it("User A session cannot access or view User B integration status", async () => {
      const userA = "user-isolated-a";
      const userB = "user-isolated-b";

      await prisma.userIntegration.create({
        data: {
          userId: userB,
          provider: "GOOGLE_CALENDAR",
          status: "CONNECTED",
          encryptedAccessToken: encryptToken("b-tok"),
          calendarId: "b-cal",
          externalAccountEmail: "userb@university.edu",
        },
      });

      const sessionA = await encrypt({
        userId: userA,
        email: "usera@test.com",
        name: "User A",
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      });
      (globalThis as any).__mockSessionCookie = sessionA;

      const req = new NextRequest("http://localhost:3000/api/integrations/google-calendar/status");

      const res = await getStatusRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.connected, false, "User A must see their own DISCONNECTED status, not User B's");
      assert.equal(json.email, null);
    });

    it("verifies dedicated secondary calendar summary conforms to specification", () => {
      assert.equal(DEDICATED_CALENDAR_SUMMARY, "UniMate Academic");
    });
  });
});
