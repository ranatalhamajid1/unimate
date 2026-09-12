import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { mockState, resetMockState } from "./setup-prisma";
import { encrypt } from "../app/lib/session";
import { GET as getTodayWeb } from "../app/api/today/route";
import { GET as getTodayMobile } from "../app/api/mobile/today/route";

describe("Milestone 15.1: Today Workspace API Routes Suite", () => {
  const user1Id = "u-api-1";
  const user2Id = "u-api-2";

  beforeEach(() => {
    resetMockState();

    mockState.users.push(
      {
        id: user1Id,
        email: "u1@uni.edu",
        name: "Student One",
        passwordHash: "secret_hash_1",
      },
      {
        id: user2Id,
        email: "u2@uni.edu",
        name: "Student Two",
        passwordHash: "secret_hash_2",
      }
    );

    mockState.courses.push(
      {
        id: "c-1",
        userId: user1Id,
        name: "Compiler Design",
        code: "CS401",
        color: "#2563eb",
      },
      {
        id: "c-2",
        userId: user2Id,
        name: "Private Math",
        code: "MATH999",
        color: "#dc2626",
      }
    );

    mockState.assignments.push(
      {
        id: "asgn-u1",
        userId: user1Id,
        courseId: "c-1",
        title: "Parser Generator",
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // Due in 12 hours
        priority: "HIGH",
        status: "NOT_STARTED",
      },
      {
        id: "asgn-u2",
        userId: user2Id,
        courseId: "c-2",
        title: "Classified Math Proof",
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        priority: "HIGH",
        status: "NOT_STARTED",
      }
    );
  });

  test("1. GET /api/today returns 401 when web session cookie is missing", async () => {
    (globalThis as any).__mockSessionCookie = null;

    const req = new NextRequest("http://localhost:3000/api/today", {
      method: "GET",
    });

    const res = await getTodayWeb(req);
    assert.equal(res.status, 401);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, "Unauthorized");
  });

  test("2. GET /api/today returns 200 with sanitized data when authenticated via web session", async () => {
    const sessionCookie = await encrypt({
      userId: user1Id,
      email: "u1@uni.edu",
      name: "Student One",
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    });
    (globalThis as any).__mockSessionCookie = sessionCookie;

    const req = new NextRequest("http://localhost:3000/api/today", {
      method: "GET",
    });

    const res = await getTodayWeb(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data);
    assert.ok(json.data.capacity);
    assert.ok(json.data.today);

    // Tenant isolation: only User 1 assignment is present
    const taskTitles = json.data.today.allocatedTasks.map((t: any) => t.title);
    assert.ok(taskTitles.includes("Parser Generator"));
    assert.ok(!taskTitles.includes("Classified Math Proof"));

    // Sanitization: secrets must never leak
    assert.equal(json.data.passwordHash, undefined);
    assert.equal(json.data.encryptedAccessToken, undefined);
  });

  test("3. GET /api/mobile/today returns 401 when Bearer header is missing or invalid", async () => {
    const reqNoHeader = new NextRequest("http://localhost:3000/api/mobile/today", {
      method: "GET",
    });
    const resNoHeader = await getTodayMobile(reqNoHeader);
    assert.equal(resNoHeader.status, 401);

    const reqInvalid = new NextRequest("http://localhost:3000/api/mobile/today", {
      method: "GET",
      headers: { Authorization: "Bearer invalid_garbage_token" },
    });
    const resInvalid = await getTodayMobile(reqInvalid);
    assert.equal(resInvalid.status, 401);
  });

  test("4. GET /api/mobile/today returns 200 when authenticated with valid Bearer JWT", async () => {
    const token = await encrypt({
      userId: user2Id,
      email: "u2@uni.edu",
      name: "Student Two",
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/mobile/today", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await getTodayMobile(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data);

    // Tenant isolation: User 2 sees User 2's data only
    const taskTitles = json.data.today.allocatedTasks.map((t: any) => t.title);
    assert.ok(taskTitles.includes("Classified Math Proof"));
    assert.ok(!taskTitles.includes("Parser Generator"));
  });

  test("5. Cross-user isolation: User A's token never retrieves User B's attendance or timetable", async () => {
    const todayDayOfWeek = (await import("../app/lib/timezone")).getPKTDateParts(new Date()).dayOfWeek;

    mockState.timetable.push(
      {
        id: "tt-u1",
        userId: user1Id,
        courseId: "c-1",
        dayOfWeek: todayDayOfWeek,
        startTime: "09:00",
        endTime: "10:30",
        room: "Lab 1",
        type: "Lecture",
      },
      {
        id: "tt-u2",
        userId: user2Id,
        courseId: "c-2",
        dayOfWeek: todayDayOfWeek,
        startTime: "14:00",
        endTime: "15:30",
        room: "Room 999",
        type: "Lecture",
      }
    );

    const tokenU1 = await encrypt({
      userId: user1Id,
      email: "u1@uni.edu",
      name: "Student One",
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/mobile/today", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenU1}` },
    });

    const res = await getTodayMobile(req);
    const json = await res.json();

    const scheduleRooms = json.data.today.schedule
      .filter((s: any) => s.type === "CLASS")
      .map((s: any) => s.room);

    assert.ok(scheduleRooms.includes("Lab 1"));
    assert.ok(!scheduleRooms.includes("Room 999"));
  });
});
