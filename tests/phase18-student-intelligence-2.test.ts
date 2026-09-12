import "./setup-prisma";
import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetMockState, mockState } from "./setup-prisma";
import {
  calculateRequiredGpaForTarget,
  simulateGpaCalculation,
} from "../app/lib/intelligence/gpa-simulator";
import {
  calculateAttendanceInsight,
} from "../app/lib/intelligence/attendance-intel";
import {
  calculateExamReadiness,
} from "../app/lib/intelligence/exam-readiness";
import {
  calculateTaskUrgency,
  RawTaskInput,
} from "../app/lib/intelligence/priority-engine";
import {
  getAcademicAdvisorOverview,
  generateAcademicAdvisorAIReport,
} from "../app/lib/intelligence/academic-advisor";
import { resolveAuth } from "../app/lib/auth-resolver";
import { FREE_DAILY_AI_LIMIT, PRO_DAILY_AI_LIMIT } from "../app/lib/ai-limits";
import { generateMobileToken } from "../app/lib/mobile-auth";
import { GET as getAdvisorRoute, POST as postAdvisorRoute } from "../app/api/intelligence/advisor/route";
import { POST as postGpaSimulatorRoute } from "../app/api/intelligence/gpa-simulator/route";
import { NextRequest } from "next/server";

describe("Milestone 12: Student Intelligence 2.0 Test Suite", () => {
  let user1: any;
  let user2: any;

  beforeEach(() => {
    resetMockState();

    user1 = {
      id: "u-intel-1",
      email: "intel1@nu.edu.pk",
      name: "Ahmed Khan",
      role: "STUDENT",
      plan: "PRO",
    };

    user2 = {
      id: "u-intel-2",
      email: "intel2@nu.edu.pk",
      name: "Bilal Tariq",
      role: "STUDENT",
      plan: "FREE",
    };

    mockState.users.push(user1, user2);
  });

  // =========================================================================
  // 1. GPA Simulator 2.0: calculateRequiredGpaForTarget
  // =========================================================================
  describe("GPA Simulator 2.0: calculateRequiredGpaForTarget", () => {
    test("returns ALREADY_MET when current GPA meets or exceeds target GPA", () => {
      const res = calculateRequiredGpaForTarget(3.8, 45, 3.5, 15);
      assert.equal(res.status, "ALREADY_MET");
      assert.equal(res.requiredGpa, null);
      assert.ok(res.explanation.includes("already meets or exceeds your target"));
    });

    test("returns ALREADY_MET when target GPA is exactly equal to current GPA", () => {
      const res = calculateRequiredGpaForTarget(3.5, 30, 3.5, 15);
      assert.equal(res.status, "ALREADY_MET");
    });

    test("returns ALREADY_MET when target GPA is below current GPA", () => {
      const res = calculateRequiredGpaForTarget(3.6, 60, 3.2, 15);
      assert.equal(res.status, "ALREADY_MET");
    });

    test("returns ACHIEVABLE when required GPA in remaining credits is <= 3.70", () => {
      // Current: 3.0 on 30 credits (90 pts). Target: 3.2 on 60 total credits (192 pts).
      // Remaining: 30 credits. Points needed: 192 - 90 = 102 pts. Required GPA: 102 / 30 = 3.40.
      const res = calculateRequiredGpaForTarget(3.0, 30, 3.2, 30);
      assert.equal(res.status, "ACHIEVABLE");
      assert.equal(res.requiredGpa, 3.4);
      assert.equal(res.requiredGpaString, "3.40");
      assert.equal(res.recommendedGradeBenchmark, "A- (3.70)");
      assert.ok(res.explanation.includes("Achievable"));
    });

    test("returns CHALLENGING when required GPA is between 3.71 and 4.00", () => {
      // Current: 3.0 on 30 credits (90 pts). Target: 3.45 on 60 total credits (207 pts).
      // Remaining: 30 credits. Points needed: 207 - 90 = 117 pts. Required GPA: 117 / 30 = 3.90.
      const res = calculateRequiredGpaForTarget(3.0, 30, 3.45, 30);
      assert.equal(res.status, "CHALLENGING");
      assert.equal(res.requiredGpa, 3.9);
      assert.equal(res.requiredGpaString, "3.90");
      assert.equal(res.recommendedGradeBenchmark, "A (4.00)");
      assert.ok(res.explanation.includes("Challenging"));
    });

    test("returns MATHEMATICALLY_IMPOSSIBLE when required GPA exceeds 4.00", () => {
      // Current: 2.0 on 60 credits (120 pts). Target: 3.8 on 75 total credits (285 pts).
      // Remaining: 15 credits. Points needed: 285 - 120 = 165 pts. Required GPA: 165 / 15 = 11.0 > 4.0
      const res = calculateRequiredGpaForTarget(2.0, 60, 3.8, 15);
      assert.equal(res.status, "MATHEMATICALLY_IMPOSSIBLE");
      assert.ok(res.requiredGpa! > 4.0);
      assert.ok(res.explanation.includes("Mathematically unattainable"));
    });

    test("returns MATHEMATICALLY_IMPOSSIBLE when target GPA is set above 4.0", () => {
      const res = calculateRequiredGpaForTarget(3.5, 30, 4.2, 30);
      assert.equal(res.status, "MATHEMATICALLY_IMPOSSIBLE");
      assert.ok(res.explanation.includes("exceeds the maximum achievable 4.00 scale"));
    });

    test("handles zero remaining credits: ALREADY_MET if current meets target, MATHEMATICALLY_IMPOSSIBLE if not", () => {
      const met = calculateRequiredGpaForTarget(3.6, 60, 3.5, 0);
      assert.equal(met.status, "ALREADY_MET");

      const impossible = calculateRequiredGpaForTarget(3.2, 60, 3.5, 0);
      assert.equal(impossible.status, "MATHEMATICALLY_IMPOSSIBLE");
      assert.ok(impossible.explanation.includes("zero remaining credits enrolled"));
    });

    test("handles zero completed credits correctly", () => {
      const res = calculateRequiredGpaForTarget(null, 0, 3.5, 15);
      assert.equal(res.status, "ACHIEVABLE");
      assert.equal(res.requiredGpa, 3.5);
      assert.ok(res.explanation.includes("With no completed credits yet"));
    });

    test("returns INSUFFICIENT_DATA for missing, zero, or invalid inputs", () => {
      assert.equal(calculateRequiredGpaForTarget(null, 0, null, 0).status, "INSUFFICIENT_DATA");
      assert.equal(calculateRequiredGpaForTarget(3.0, 30, NaN, 30).status, "INSUFFICIENT_DATA");
      assert.equal(calculateRequiredGpaForTarget(3.0, 30, -1, 30).status, "INSUFFICIENT_DATA");
      assert.equal(calculateRequiredGpaForTarget(3.0, -5, 3.5, 30).status, "INSUFFICIENT_DATA");
      assert.equal(calculateRequiredGpaForTarget(3.0, 0, 3.5, 0).status, "INSUFFICIENT_DATA");
    });
  });

  // =========================================================================
  // 2. Attendance Forecasting & Insufficient Data Handling
  // =========================================================================
  describe("Attendance Forecasting: calculateAttendanceInsight", () => {
    test("returns SAFE with calculated buffer when comfortably above threshold", () => {
      // 24 attended out of 25 = 96% (threshold 75%)
      const res = calculateAttendanceInsight(24, 25, 0.75);
      assert.equal(res.status, "SAFE");
      assert.equal(res.percentage, 96);
      assert.equal(res.safeBufferClasses, 7);
      assert.equal(res.recoveryClassesRequired, 0);
      assert.ok(res.recommendation.includes("approximately 7 future classes"));
      assert.ok(!res.recommendation.toLowerCase().includes("guarantee"));
    });

    test("returns WATCH when attendance is close to threshold", () => {
      // 31 attended out of 39 = 79.5% (close to 75% threshold)
      const res = calculateAttendanceInsight(31, 39, 0.75);
      assert.equal(res.status, "WATCH");
      assert.equal(res.percentage, 79.5);
      assert.equal(res.recoveryClassesRequired, 0);
      assert.equal(res.safeBufferClasses, 2);
      assert.ok(res.recommendation.includes("Attendance is close to the limit"));
    });

    test("returns AT_RISK with recovery classes when below threshold", () => {
      // 15 attended out of 25 = 60% (threshold 75%)
      const res = calculateAttendanceInsight(15, 25, 0.75);
      assert.equal(res.status, "AT_RISK");
      assert.equal(res.percentage, 60);
      assert.equal(res.recoveryClassesRequired, 15);
      assert.equal(res.safeBufferClasses, 0);
      assert.ok(res.recommendation.includes("attend the next 15 consecutive classes"));
    });

    test("returns INSUFFICIENT_DATA when total classes is 0 or negative", () => {
      const res1 = calculateAttendanceInsight(0, 0, 0.75);
      assert.equal(res1.status, "INSUFFICIENT_DATA");
      assert.equal(res1.percentage, null);
      assert.equal(res1.safeBufferClasses, 0);
      assert.equal(res1.recoveryClassesRequired, 0);

      const res2 = calculateAttendanceInsight(-1, 10, 0.75);
      assert.equal(res2.status, "INSUFFICIENT_DATA");
    });
  });

  // =========================================================================
  // 3. Exam Preparation Intelligence
  // =========================================================================
  describe("Exam Readiness: calculateExamReadiness", () => {
    const now = new Date("2026-09-12T10:00:00Z");

    test("returns ON TRACK for imminent exam with high preparation progress", () => {
      const examDate = new Date("2026-09-13T10:00:00Z"); // 1 day away
      const res = calculateExamReadiness(examDate, 90, true, now);
      assert.equal(res.status, "ON TRACK");
      assert.equal(res.daysRemaining, 1);
      assert.equal(res.suggestedFocusHours, 2);
      assert.ok(res.recommendation.includes("Solid preparation reported"));
    });

    test("returns AT RISK for imminent exam with low preparation progress", () => {
      const examDate = new Date("2026-09-13T10:00:00Z"); // 1 day away
      const res = calculateExamReadiness(examDate, 30, true, now);
      assert.equal(res.status, "AT RISK");
      assert.equal(res.daysRemaining, 1);
      assert.equal(res.suggestedFocusHours, 6);
      assert.ok(res.recommendation.includes("Exam is imminent (under 48 hours)"));
    });

    test("returns INSUFFICIENT DATA when prepProgress is null or hasPrepData is false", () => {
      const examDate = new Date("2026-09-16T10:00:00Z");
      const res = calculateExamReadiness(examDate, null, false, now);
      assert.equal(res.status, "INSUFFICIENT DATA");
      assert.equal(res.suggestedFocusHours, null);
      assert.ok(res.recommendation.includes("Update your preparation progress"));
    });
  });

  // =========================================================================
  // 4. Canonical Assignment Prioritization Engine
  // =========================================================================
  describe("Smart Assignment Prioritization (Canonical Engine)", () => {
    const now = new Date("2026-09-12T12:00:00Z");

    test("assigns score 100 and OVERDUE tier to tasks with past due dates", () => {
      const task: RawTaskInput = {
        id: "task-1",
        courseId: "c-1",
        courseName: "Algorithms",
        courseCode: "CS201",
        title: "Homework 3",
        dueDate: new Date("2026-09-11T12:00:00Z"), // 24h overdue
        priority: "HIGH",
        status: "NOT_STARTED",
      };

      const result = calculateTaskUrgency(task, null, now);
      assert.equal(result.urgencyTier, "OVERDUE");
      assert.equal(result.urgencyScore, 100);
      assert.ok(result.deadlineLabel.includes("Overdue"));
    });

    test("assigns CRITICAL tier to tasks due within 24 hours", () => {
      const task: RawTaskInput = {
        id: "task-2",
        courseId: "c-1",
        courseName: "Algorithms",
        courseCode: "CS201",
        title: "Quiz Prep",
        dueDate: new Date("2026-09-12T20:00:00Z"), // 8h remaining
        priority: "MEDIUM",
        status: "NOT_STARTED",
      };

      const result = calculateTaskUrgency(task, null, now);
      assert.equal(result.urgencyTier, "CRITICAL");
      assert.equal(result.deadlineLabel, "Due today");
    });

    test("applies exam proximity multiplier to boost priority score", () => {
      const task: RawTaskInput = {
        id: "task-3",
        courseId: "c-2",
        courseName: "Calculus",
        courseCode: "MATH101",
        title: "Problem Set",
        dueDate: new Date("2026-09-16T12:00:00Z"), // 4 days away
        priority: "NORMAL",
        status: "NOT_STARTED",
      };

      const withoutExam = calculateTaskUrgency(task, null, now);
      const withImminentExam = calculateTaskUrgency(task, 2, now); // Exam in 2 days

      assert.ok(withImminentExam.urgencyScore > withoutExam.urgencyScore);
      assert.ok(withImminentExam.reason.includes("Related course exam in 2 days"));
    });
  });

  // =========================================================================
  // 5. AI Quotas & Free/Pro Limits
  // =========================================================================
  describe("AI Quotas & Free/Pro Limits", () => {
    test("exports correct daily quota constants", () => {
      assert.equal(FREE_DAILY_AI_LIMIT, 5);
      assert.equal(PRO_DAILY_AI_LIMIT, 50);
    });
  });

  // =========================================================================
  // 6. Privacy Airgap Invariant in Academic Advisor Context
  // =========================================================================
  describe("Privacy Airgap & Multi-Tenant Scoping", () => {
    test("does not leak passwords, tokens, expenses, or database IDs", async () => {
      // Populate user1 course and grades in mockState
      const course = {
        id: "c-secret-123",
        userId: user1.id,
        name: "Computer Architecture",
        code: "CS301",
        instructor: "Dr. Smith",
        creditHours: 3,
        semester: "Fall 2026",
        color: "#3B82F6",
        createdAt: new Date(),
        updatedAt: new Date(),
        grades: [{ id: "g-1", grade: "A", gradePoints: 4.0, courseId: "c-secret-123", userId: user1.id, createdAt: new Date(), updatedAt: new Date() }],
        attendance: [{ id: "att-1", totalClasses: 20, attendedClasses: 19, courseId: "c-secret-123", userId: user1.id, createdAt: new Date(), updatedAt: new Date() }],
      };
      mockState.courses.push(course);

      const overview = await getAcademicAdvisorOverview(user1.id);

      // Verify returned overview does not contain user password, session tokens, or financial records
      const serialized = JSON.stringify(overview);
      assert.ok(!serialized.includes("password"));
      assert.ok(!serialized.includes("jwt"));
      assert.ok(!serialized.includes("secret"));
      assert.ok(!serialized.includes("expense"));
      assert.ok(!serialized.includes("billing"));
      assert.ok(!serialized.includes("c-secret-123"));
    });
  });

  // =========================================================================
  // 7. API Endpoints & Auth Resolver Parity
  // =========================================================================
  describe("API Endpoints & Auth Parity", () => {
    test("GET /api/intelligence/advisor with Mobile Bearer returns 200 with 0 quota consumed", async () => {
      const token = await generateMobileToken({ userId: user1.id, name: user1.name, email: user1.email });
      const req = new NextRequest("http://localhost:3000/api/intelligence/advisor", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const res = await getAdvisorRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.academicHealth);
      assert.ok(json.data.gpaStanding);
      assert.ok(json.data.attendanceSummary);
    });

    test("GET /api/intelligence/advisor rejects unauthenticated request with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/intelligence/advisor");
      const res = await getAdvisorRoute(req);
      assert.equal(res.status, 401);
    });

    test("POST /api/intelligence/gpa-simulator simulates scenario and returns feasibility", async () => {
      // Seed Pro subscription for user1
      mockState.subscriptions.push({
        id: "sub-user1",
        userId: user1.id,
        plan: "PRO",
        status: "ACTIVE",
        provider: "MOCK",
      });

      const token = await generateMobileToken({ userId: user1.id, name: user1.name, email: user1.email });
      const course = {
        id: "c-sim-1",
        userId: user1.id,
        name: "Software Engineering",
        code: "CS401",
        instructor: "Prof. Tariq",
        creditHours: 3,
        semester: "Fall 2026",
        color: "#10B981",
        createdAt: new Date(),
        updatedAt: new Date(),
        grades: [],
        attendance: [],
      };
      mockState.courses.push(course);

      const req = new NextRequest("http://localhost:3000/api/intelligence/gpa-simulator", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarios: [{ courseId: "c-sim-1", simulatedGrade: "A" }],
          targetGpa: 3.5,
        }),
      });

      const res = await postGpaSimulatorRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.projectedGpa, 4.0);
      assert.ok(json.data.targetFeasibility);
      assert.equal(json.data.targetFeasibility.status, "ACHIEVABLE");
    });
  });
});
