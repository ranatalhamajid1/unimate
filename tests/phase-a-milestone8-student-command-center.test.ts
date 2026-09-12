import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockPrisma, resetMockState, mockState } from "./setup-prisma";

// Import Milestone 8 Service Layer
import { getDashboardData } from "../app/lib/dashboard-aggregation";
import { GET as getBriefing } from "../app/api/intelligence/briefing/route";
import { GET as getMobileDashboard } from "../app/api/mobile/dashboard/route";
import { generateMobileToken } from "../app/lib/mobile-auth";

function createMockRequest(url: string, options: any = {}) {
  const headers = new Headers(options.headers || {});
  return {
    url,
    headers,
    json: async () => options.json || {},
  } as any;
}

describe("Milestone 8: Student Operating System & Personal Academic Command Center 2.0", () => {
  const testUserId = "user-m8-test";
  const otherUserId = "user-m8-other";
  const now = new Date("2026-10-15T10:00:00.000Z");

  beforeEach(() => {
    resetMockState();

    // Seed test users
    mockState.users = [
      {
        id: testUserId,
        name: "Talha Student",
        email: "talha@example.edu",
        degreeProgram: "BS Computer Science",
        currentSemester: "Semester 5",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: otherUserId,
        name: "Other Student",
        email: "other@example.edu",
        degreeProgram: "BBA",
        currentSemester: "Semester 1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];

    mockState.subscriptions = [
      {
        id: "sub-1",
        userId: testUserId,
        plan: "PRO",
        status: "ACTIVE",
      },
    ];
  });

  // -------------------------------------------------------------------------
  // 1. REUSABLE DASHBOARD AGGREGATION VIEW-MODEL
  // -------------------------------------------------------------------------
  describe("1. Normalized Dashboard Aggregation Layer", () => {
    test("Aggregates student profile, greeting, and empty academic metrics cleanly", async () => {
      const data = await getDashboardData(testUserId, now);

      assert.equal(data.profile.degreeProgram, "BS Computer Science");
      assert.equal(data.profile.currentSemester, "Semester 5");
      assert.equal(data.isPro, true);
      assert.ok(data.greeting.includes("Good morning") || data.greeting.includes("Good afternoon") || data.greeting.includes("Good evening"));
      assert.equal(data.schedule.length, 0);
      assert.equal(data.assignments.length, 0);
      assert.equal(data.nextExam, null);
      assert.equal(data.academic.attendedClassesCount, 0);
      assert.equal(data.academic.isBelowThreshold, false);
      assert.ok(data.whyTheseMatter.includes("clean"));
    });

    test("Integrates canonical priorities, schedule, exams, and attendance with configurable threshold", async () => {
      // Seed course
      mockState.courses = [
        {
          id: "c-algo",
          userId: testUserId,
          name: "Design & Analysis of Algorithms",
          code: "CS301",
          color: "#4f46e5",
        },
      ];

      // Seed overdue assignment
      mockState.assignments = [
        {
          id: "assign-due",
          userId: testUserId,
          courseId: "c-algo",
          title: "Dynamic Programming Problem Set",
          dueDate: new Date("2026-10-14T10:00:00.000Z"), // 1 day overdue
          priority: "HIGH",
          status: "NOT_STARTED",
          updatedAt: new Date("2026-10-14T10:00:00.000Z"),
        },
      ];

      // Seed exam
      mockState.exams = [
        {
          id: "exam-mid",
          userId: testUserId,
          courseId: "c-algo",
          title: "Midterm Examination",
          examDate: new Date("2026-10-18T09:00:00.000Z"),
          room: "Auditorium 1",
          type: "MIDTERM",
          status: "UPCOMING",
          preparationProgress: 50,
        },
      ];

      // Seed attendance: 6 attended out of 10 (60% -> below 75% threshold)
      mockState.attendance = [
        {
          id: "att-1",
          userId: testUserId,
          courseId: "c-algo",
          attendedClasses: 6,
          totalClasses: 10,
        },
      ];

      const data = await getDashboardData(testUserId, now, 0.75);

      // Verify canonical priorities included
      assert.ok(data.priorities.length >= 1);
      assert.equal(data.priorities[0].urgencyTier, "OVERDUE");
      assert.ok(data.priorities[0].reason.includes("Overdue"));

      // Verify next exam mapped
      assert.ok(data.nextExam);
      assert.equal(data.nextExam.title, "Midterm Examination");
      assert.equal(data.nextExam.room, "Auditorium 1");

      // Verify attendance reflects threshold
      assert.equal(data.academic.configuredThreshold, 0.75);
      assert.equal(data.academic.isBelowThreshold, true);
      assert.equal(data.academic.attendedClassesCount, 6);
      assert.equal(data.academic.totalClassesCount, 10);
    });

    test("Enforces multi-tenant data isolation: User 2 never receives User 1 academic data", async () => {
      // User 1 has data
      mockState.courses = [
        {
          id: "c-user1",
          userId: testUserId,
          name: "Secret User 1 Course",
          code: "SEC101",
          color: "#000",
        },
      ];
      mockState.assignments = [
        {
          id: "assign-user1",
          userId: testUserId,
          courseId: "c-user1",
          title: "Secret Assignment",
          dueDate: new Date("2026-10-16T10:00:00.000Z"),
          priority: "HIGH",
          status: "NOT_STARTED",
          updatedAt: new Date(),
        },
      ];

      const dataUser2 = await getDashboardData(otherUserId, now);

      assert.equal(dataUser2.schedule.length, 0);
      assert.equal(dataUser2.assignments.length, 0);
      assert.equal(dataUser2.priorities.length, 0);
      assert.equal(dataUser2.profile.degreeProgram, "BBA");
    });
  });

  // -------------------------------------------------------------------------
  // 2. AI DAILY BRIEFING HYDRATION & QUOTA SAFETY
  // -------------------------------------------------------------------------
  describe("2. AI Daily Briefing Hydration & Quota Safety", () => {
    test("Default GET /api/intelligence/briefing returns deterministic briefing without burning AI quota", async () => {
      const token = await generateMobileToken({ userId: testUserId, name: "Talha Student", email: "talha@example.edu" });
      const req = createMockRequest("http://localhost/api/intelligence/briefing", {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await getBriefing(req);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.success, true);
      assert.equal(json.data.source, "deterministic");
      assert.ok(json.data.headline);
      assert.ok(json.data.strategy);
    });

    test("GET /api/intelligence/briefing?ai=true gracefully falls back to deterministic briefing when AI is unconfigured or rate limited", async () => {
      const token = await generateMobileToken({ userId: testUserId, name: "Talha Student", email: "talha@example.edu" });
      const req = createMockRequest("http://localhost/api/intelligence/briefing?ai=true", {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await getBriefing(req);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.success, true);
      assert.ok(json.data.source === "deterministic" || json.data.source === "ai");
      assert.ok(json.data.strategy.length > 0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. MOBILE DASHBOARD ALIGNMENT & SECRETS SANITIZATION
  // -------------------------------------------------------------------------
  describe("3. Mobile Command Center API Parity & Privacy", () => {
    test("GET /api/mobile/dashboard returns aligned academic metrics and excludes database secrets", async () => {
      const token = await generateMobileToken({ userId: testUserId, name: "Talha Student", email: "talha@example.edu" });
      const req = createMockRequest("http://localhost/api/mobile/dashboard", {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await getMobileDashboard(req);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.success, true);
      assert.equal(json.user.id, testUserId);
      assert.ok(json.stats.gpa);
      assert.ok(json.stats.attendance);
      assert.ok(json.priorities);

      // Verify secrets exclusion
      const rawString = JSON.stringify(json);
      assert.equal(rawString.includes("passwordHash"), false);
      assert.equal(rawString.includes("SESSION_SECRET"), false);
      assert.equal(rawString.includes("R2_SECRET"), false);
      assert.equal(rawString.includes("DATABASE_URL"), false);
    });
  });
});
