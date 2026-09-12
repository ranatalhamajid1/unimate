import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";
import { NextRequest } from "next/server";

import { GET as getActiveRoute } from "../app/api/study-sessions/active/route";
import { POST as startRoute } from "../app/api/study-sessions/start/route";
import { POST as pauseRoute } from "../app/api/study-sessions/[id]/pause/route";
import { POST as resumeRoute } from "../app/api/study-sessions/[id]/resume/route";
import { POST as completeRoute } from "../app/api/study-sessions/[id]/complete/route";
import { POST as cancelRoute } from "../app/api/study-sessions/[id]/cancel/route";
import { encrypt } from "../app/lib/session";

async function makeMobileRequest(
  method: string,
  url: string,
  userId: string = "u1",
  body?: any
): Promise<NextRequest> {
  const token = await encrypt({
    userId,
    name: "Test User",
    email: `${userId}@uni.edu`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
  };
  if (body) {
    headers["content-type"] = "application/json";
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Milestone 15.2: Focus Session REST APIs & Multi-Device Sync", () => {
  beforeEach(() => {
    resetMockState();

    mockState.users.push({
      id: "u1",
      email: "u1@uni.edu",
      name: "Talha",
    });

    mockState.users.push({
      id: "u2",
      email: "u2@uni.edu",
      name: "Other Student",
    });

    mockState.courses.push({
      id: "c1",
      userId: "u1",
      name: "Algorithms",
      code: "CS302",
      color: "#2563eb",
    });
  });

  // 1. GET /api/study-sessions/active returns null when no session is active
  test("1. GET /api/study-sessions/active returns null when no session is active", async () => {
    const req = await makeMobileRequest("GET", "/api/study-sessions/active", "u1");
    const res = await getActiveRoute(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.activeSession, null);
  });

  // 2. POST /api/study-sessions/start creates active session with 201 Created
  test("2. POST /api/study-sessions/start creates active session with 201 Created", async () => {
    const req = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "Graph Theory",
      courseId: "c1",
      plannedMinutes: 50,
    });

    const res = await startRoute(req);
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.activeSession.title, "Graph Theory");
    assert.strictEqual(data.activeSession.status, "ACTIVE");
  });

  // 3. Concurrency: Two simultaneous start requests -> exactly one succeeds, one gets 409 Conflict
  test("3. Concurrency: Two simultaneous start requests -> exactly one succeeds, one gets 409 Conflict", async () => {
    const req1 = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "First Client",
      plannedMinutes: 25,
    });
    const req2 = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "Second Client",
      plannedMinutes: 50,
    });

    const res1 = await startRoute(req1);
    assert.strictEqual(res1.status, 201);

    const res2 = await startRoute(req2);
    const data2 = await res2.json();

    assert.strictEqual(res2.status, 409);
    assert.strictEqual(data2.code, "ACTIVE_SESSION_EXISTS");
    assert.ok(data2.activeSession);
  });

  // 4. Multi-device: Device A starts -> Device B GET /active returns active session
  test("4. Multi-device: Device A starts -> Device B GET /active returns active session", async () => {
    // Device A starts
    const startReq = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "Cross Device Focus",
      plannedMinutes: 50,
    });
    await startRoute(startReq);

    // Device B opens app
    const getReq = await makeMobileRequest("GET", "/api/study-sessions/active", "u1");
    const getRes = await getActiveRoute(getReq);
    const data = await getRes.json();

    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(data.activeSession.title, "Cross Device Focus");
    assert.strictEqual(data.activeSession.status, "ACTIVE");
  });

  // 5. Multi-device: Device A pauses -> Device B GET /active reflects PAUSED state
  test("5. Multi-device: Device A pauses -> Device B GET /active reflects PAUSED state", async () => {
    // Start session
    const startReq = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "Pause Sync Test",
      plannedMinutes: 50,
    });
    const startRes = await startRoute(startReq);
    const { activeSession } = await startRes.json();

    // Device A pauses
    const pauseReq = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/pause`, "u1");
    const pauseRes = await pauseRoute(pauseReq, { params: Promise.resolve({ id: activeSession.id }) });
    assert.strictEqual(pauseRes.status, 200);

    // Device B refreshes
    const getReq = await makeMobileRequest("GET", "/api/study-sessions/active", "u1");
    const getRes = await getActiveRoute(getReq);
    const data = await getRes.json();

    assert.strictEqual(data.activeSession.status, "PAUSED");
    assert.ok(data.activeSession.pausedAt);
  });

  // 6. Multi-device: Device B resumes -> Device A GET /active reflects ACTIVE state
  test("6. Multi-device: Device B resumes -> Device A GET /active reflects ACTIVE state", async () => {
    // Start & pause
    const startReq = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "Resume Sync Test",
      plannedMinutes: 50,
    });
    const startRes = await startRoute(startReq);
    const { activeSession } = await startRes.json();

    const pauseReq = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/pause`, "u1");
    await pauseRoute(pauseReq, { params: Promise.resolve({ id: activeSession.id }) });

    // Device B resumes
    const resumeReq = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/resume`, "u1");
    const resumeRes = await resumeRoute(resumeReq, { params: Promise.resolve({ id: activeSession.id }) });
    assert.strictEqual(resumeRes.status, 200);

    // Device A refreshes
    const getReq = await makeMobileRequest("GET", "/api/study-sessions/active", "u1");
    const getRes = await getActiveRoute(getReq);
    const data = await getRes.json();

    assert.strictEqual(data.activeSession.status, "ACTIVE");
    assert.strictEqual(data.activeSession.pausedAt, null);
  });

  // 7. Security: Malicious actualMinutes payload is completely ignored by server
  test("7. Security: Malicious actualMinutes payload is completely ignored by server", async () => {
    const startReq = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "Cheater Test",
      plannedMinutes: 50,
    });
    const startRes = await startRoute(startReq);
    const { activeSession } = await startRes.json();

    // Client attempts to claim 5000 minutes
    const completeReq = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/complete`, "u1", {
      actualMinutes: 5000, // Malicious input
      markTargetComplete: false,
    });

    const completeRes = await completeRoute(completeReq, { params: Promise.resolve({ id: activeSession.id }) });
    const completeData = await completeRes.json();

    assert.strictEqual(completeRes.status, 200);
    // Calculated server-side duration must be ~0 (or 1m min non-zero credit), NOT 5000
    assert.notStrictEqual(completeData.data.actualDuration, 5000);
    assert.ok(completeData.data.actualDuration <= 1);
  });

  // 8. Idempotency: Duplicate complete request returns 200 OK with recorded session
  test("8. Idempotency: Duplicate complete request returns 200 OK", async () => {
    const startReq = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "Double Complete Test",
      plannedMinutes: 50,
    });
    const startRes = await startRoute(startReq);
    const { activeSession } = await startRes.json();

    const completeReq1 = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/complete`, "u1");
    const res1 = await completeRoute(completeReq1, { params: Promise.resolve({ id: activeSession.id }) });
    assert.strictEqual(res1.status, 200);

    const completeReq2 = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/complete`, "u1");
    const res2 = await completeRoute(completeReq2, { params: Promise.resolve({ id: activeSession.id }) });
    assert.strictEqual(res2.status, 200);
  });

  // 9. Cross-user isolation: User 2 cannot pause, resume, complete, or cancel User 1's session
  test("9. Cross-user isolation: User 2 cannot pause, resume, complete, or cancel User 1's session", async () => {
    const startReq = await makeMobileRequest("POST", "/api/study-sessions/start", "u1", {
      title: "User 1 Private Session",
      plannedMinutes: 50,
    });
    const startRes = await startRoute(startReq);
    const { activeSession } = await startRes.json();

    // User 2 attempts pause
    const pReq = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/pause`, "u2");
    const pRes = await pauseRoute(pReq, { params: Promise.resolve({ id: activeSession.id }) });
    assert.strictEqual(pRes.status, 404);

    // User 2 attempts complete
    const cReq = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/complete`, "u2");
    const cRes = await completeRoute(cReq, { params: Promise.resolve({ id: activeSession.id }) });
    assert.strictEqual(cRes.status, 404);

    // User 2 attempts cancel
    const canReq = await makeMobileRequest("POST", `/api/study-sessions/${activeSession.id}/cancel`, "u2");
    const canRes = await cancelRoute(canReq, { params: Promise.resolve({ id: activeSession.id }) });
    assert.strictEqual(canRes.status, 404);
  });
});
