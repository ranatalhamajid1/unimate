import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { mockState, resetMockState } from "./setup-prisma";

import { GET as dashboardRoute } from "../app/api/mobile/dashboard/route";
import { generateMobileToken } from "../app/lib/mobile-auth";

describe("Phase 15 Step 3: Mobile Command Center Dashboard Suite", () => {
  const user1Id = "user-dash-1";
  const user2Id = "user-dash-2";
  let user1Token = "";
  let user2Token = "";

  beforeEach(async () => {
    resetMockState();

    // Setup User 1 & User 2
    mockState.users.push(
      {
        id: user1Id,
        email: "alex.dash@unimate.test",
        name: "Alex Dash",
        passwordHash: "hash-alex",
        createdAt: new Date("2026-09-01T08:00:00Z"),
        updatedAt: new Date("2026-09-01T08:00:00Z"),
      },
      {
        id: user2Id,
        email: "sarah.dash@unimate.test",
        name: "Sarah Dash",
        passwordHash: "hash-sarah",
        createdAt: new Date("2026-09-01T08:00:00Z"),
        updatedAt: new Date("2026-09-01T08:00:00Z"),
      }
    );

    // User 1 Pro subscription
    mockState.subscriptions.push({
      id: "sub-dash-1",
      userId: user1Id,
      plan: "PRO",
      status: "ACTIVE",
      provider: "NONE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    user1Token = await generateMobileToken({
      userId: user1Id,
      name: "Alex Dash",
      email: "alex.dash@unimate.test",
    });

    user2Token = await generateMobileToken({
      userId: user2Id,
      name: "Sarah Dash",
      email: "sarah.dash@unimate.test",
    });
  });

  // ── 1. Authentication Guards ───────────────────────────────────────────────
  test("1. GET /api/mobile/dashboard rejects unauthenticated request with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/dashboard", {
      method: "GET",
    });

    const res = await dashboardRoute(req);
    assert.equal(res.status, 401);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.code, "UNAUTHORIZED");
  });

  test("2. GET /api/mobile/dashboard rejects invalid or tampered Bearer token with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/dashboard", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid.token.payload",
      },
    });

    const res = await dashboardRoute(req);
    assert.equal(res.status, 401);
  });

  // ── 2. Empty State Handling ────────────────────────────────────────────────
  test("3. GET /api/mobile/dashboard returns valid empty structures when user has no data", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/dashboard", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });

    const res = await dashboardRoute(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.user.id, user2Id);
    assert.equal(json.user.name, "Sarah Dash");
    assert.equal(json.subscription.plan, "FREE");
    assert.equal(json.subscription.isPro, false);

    // Empty collections
    assert.deepEqual(json.todaySchedule, []);
    assert.deepEqual(json.upcomingAssignments, []);
    assert.equal(json.nextExam, null);
    assert.equal(json.activeStudyPlan, null);
    assert.ok(json.goals.every((g: any) => !g.isConfigured));
    assert.equal(json.priorities.isCaughtUp, true);
    assert.equal(json.monthlySpending, undefined);

    // Verify stats defaults
    assert.ok(json.stats.gpa);
    assert.ok(json.stats.attendance);
    assert.equal(json.stats.assignmentsDue.count, 0);
    assert.equal(json.stats.studyHours.minutes, 0);

    // Security: no passwordHash or secrets returned
    assert.equal((json.user as any).passwordHash, undefined);
  });

  // ── 3. Real Data Mapping & Command Center Aggregation ───────────────────────
  test("4. GET /api/mobile/dashboard correctly maps real classes, assignments, exams, and study hours", async () => {
    const courseId = "course-math-1";
    mockState.courses.push({
      id: courseId,
      userId: user1Id,
      name: "Calculus I",
      code: "MATH101",
      color: "#2563eb",
      creditHours: 3,
      semester: "Fall",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Class today
    const now = new Date();
    // Monday = 1, Tuesday = 2...
    const jsDay = now.getUTCDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    mockState.timetable.push({
      id: "time-1",
      userId: user1Id,
      courseId,
      dayOfWeek,
      startTime: "09:00",
      endTime: "10:30",
      room: "Hall B",
      type: "Lecture",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Upcoming assignment
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    mockState.assignments.push({
      id: "assign-1",
      userId: user1Id,
      courseId,
      title: "Problem Set 1",
      description: "Exercises 1-10",
      dueDate,
      priority: "HIGH",
      status: "NOT_STARTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Upcoming exam
    const examDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    mockState.exams.push({
      id: "exam-1",
      userId: user1Id,
      courseId,
      title: "Midterm Exam",
      examDate,
      room: "Hall A",
      type: "MIDTERM",
      status: "UPCOMING",
      preparationProgress: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Study session this week
    mockState.studySessions.push({
      id: "study-1",
      userId: user1Id,
      courseId,
      title: "Calculus revision",
      duration: 120, // 2 hours
      sessionDate: now,
      source: "MANUAL",
      completed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/mobile/dashboard", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    const res = await dashboardRoute(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.user.id, user1Id);

    // Verify real timetable class mapped
    assert.ok(json.todaySchedule.length >= 1);
    const cls = json.todaySchedule.find((c: any) => c.id === "time-1");
    assert.ok(cls);
    assert.equal(cls.name, "Calculus I");
    assert.equal(cls.code, "MATH101");
    assert.equal(cls.room, "Hall B");
    assert.equal(cls.time, "09:00 - 10:30");

    // Verify assignment mapped
    assert.ok(json.upcomingAssignments.length >= 1);
    const assign = json.upcomingAssignments.find((a: any) => a.id === "assign-1");
    assert.ok(assign);
    assert.equal(assign.title, "Problem Set 1");
    assert.equal(assign.courseName, "Calculus I");
    assert.equal(assign.dueSoon, true);

    // Verify next exam mapped
    assert.ok(json.nextExam);
    assert.equal(json.nextExam.title, "Midterm Exam");
    assert.equal(json.nextExam.courseCode, "MATH101");
    assert.equal(json.nextExam.daysRemaining, 3);
    assert.equal(json.nextExam.preparationProgress, 60);

    // Verify study hours
    assert.equal(json.stats.studyHours.minutes, 120);
    assert.equal(json.stats.studyHours.formatted, "2h");

    // Verify priorities generated
    assert.ok(json.priorities.items.length >= 1);
  });

  // ── 4. User Isolation ──────────────────────────────────────────────────────
  test("5. User Isolation: User 2 cannot see User 1's classes, assignments, or exams", async () => {
    // User 2 requests dashboard
    const req = new NextRequest("http://localhost:3000/api/mobile/dashboard", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });

    const res = await dashboardRoute(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.user.id, user2Id);
    assert.equal(json.todaySchedule.length, 0);
    assert.equal(json.upcomingAssignments.length, 0);
    assert.equal(json.nextExam, null);
    assert.equal(json.stats.studyHours.minutes, 0);
  });

  // ── 5. Security Check: No Secrets or Expenses in AI Context ────────────────
  test("6. Dashboard payload strictly excludes passwordHash and server secrets", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/dashboard", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    const res = await dashboardRoute(req);
    const json = await res.json();

    assert.equal((json as any).passwordHash, undefined);
    assert.equal((json.user as any).passwordHash, undefined);
    assert.equal((json as any).DATABASE_URL, undefined);
    assert.equal((json as any).SESSION_SECRET, undefined);
  });
});
