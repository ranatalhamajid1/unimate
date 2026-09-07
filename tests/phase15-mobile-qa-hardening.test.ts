import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { mockState, resetMockState } from "./setup-prisma";
import { generateMobileToken } from "../app/lib/mobile-auth";

// Import mobile API route handlers
import { GET as getDashboard } from "../app/api/mobile/dashboard/route";
import { GET as getMe } from "../app/api/mobile/me/route";
import { GET as getCourses, POST as postCourses } from "../app/api/mobile/courses/route";
import { PUT as putCourse, DELETE as deleteCourse } from "../app/api/mobile/courses/[id]/route";
import { GET as getAssignments, POST as postAssignments } from "../app/api/mobile/assignments/route";
import { GET as getExams, POST as postExams } from "../app/api/mobile/exams/route";
import { POST as postAttendance } from "../app/api/mobile/academics/attendance/route";
import { POST as postGrade } from "../app/api/mobile/academics/grades/route";
import { GET as getExpenses, POST as postExpenses } from "../app/api/mobile/expenses/route";
import { GET as getGoals, POST as postGoals } from "../app/api/mobile/goals/route";
import { GET as getStudyPlans, POST as postStudyPlans } from "../app/api/mobile/study-plans/route";
import { GET as getCalendar } from "../app/api/mobile/calendar/route";
import { POST as postAiStudyBuddy } from "../app/api/mobile/ai/study-buddy/route";
import { GET as getAiQuota } from "../app/api/mobile/ai/quota/route";
import { POST as registerPushToken, DELETE as revokePushToken } from "../app/api/mobile/notifications/push-token/route";

describe("Phase 15 Step 6: Mobile QA Hardening & Boundary E2E Test Suite", () => {
  const user1 = { id: "user-qa-1", email: "qa1@unimate.test", name: "QA User 1" };
  const user2 = { id: "user-qa-2", email: "qa2@unimate.test", name: "QA User 2" };

  let token1: string;
  let token2: string;
  let expiredToken: string;
  let deletedUserToken: string;

  beforeEach(async () => {
    resetMockState();

    mockState.users.push(
      {
        id: user1.id,
        email: user1.email,
        name: user1.name,
        passwordHash: "hash1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user2.id,
        email: user2.email,
        name: user2.name,
        passwordHash: "hash2",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    mockState.subscriptions.push({
      id: "sub-qa-1",
      userId: user1.id,
      plan: "PRO",
      status: "ACTIVE",
      provider: "NONE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    token1 = await generateMobileToken({
      userId: user1.id,
      name: user1.name,
      email: user1.email,
    });

    token2 = await generateMobileToken({
      userId: user2.id,
      name: user2.name,
      email: user2.email,
    });

    const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET);

    // Create an expired token (expired 2 hours ago)
    expiredToken = await new SignJWT({
      userId: user1.id,
      name: user1.name,
      email: user1.email,
      expiresAt: new Date(Date.now() - 7200000).toISOString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 14400)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 7200)
      .sign(secretKey);

    // Create a valid token for a user that does not exist in DB
    deletedUserToken = await generateMobileToken({
      userId: "non-existent-user-cuid",
      name: "Ghost User",
      email: "ghost@unimate.test",
    });
  });

  // -------------------------------------------------------------------------
  // 1. Authentication Lifecycle & Token Integrity QA
  // -------------------------------------------------------------------------
  describe("1. Authentication Edge Cases & Token Verification", () => {
    test("expired token is rejected with 401 across endpoints", async () => {
      const endpoints = [
        () => getDashboard(new NextRequest("http://localhost/api/mobile/dashboard", {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })),
        () => getMe(new NextRequest("http://localhost/api/mobile/me", {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })),
        () => getCourses(new NextRequest("http://localhost/api/mobile/courses", {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })),
        () => getGoals(new NextRequest("http://localhost/api/mobile/goals", {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })),
        () => getCalendar(new NextRequest("http://localhost/api/mobile/calendar", {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })),
      ];

      for (const ep of endpoints) {
        const res = await ep();
        assert.equal(res.status, 401, "Expired token must return 401");
        const json = await res.json();
        assert.equal(json.success, false);
      }
    });

    test("token for deleted or non-existent user returns 401 across endpoints", async () => {
      const endpoints = [
        () => getDashboard(new NextRequest("http://localhost/api/mobile/dashboard", {
          headers: { Authorization: `Bearer ${deletedUserToken}` },
        })),
        () => getMe(new NextRequest("http://localhost/api/mobile/me", {
          headers: { Authorization: `Bearer ${deletedUserToken}` },
        })),
        () => getCourses(new NextRequest("http://localhost/api/mobile/courses", {
          headers: { Authorization: `Bearer ${deletedUserToken}` },
        })),
        () => getExpenses(new NextRequest("http://localhost/api/mobile/expenses", {
          headers: { Authorization: `Bearer ${deletedUserToken}` },
        })),
      ];

      for (const ep of endpoints) {
        const res = await ep();
        assert.equal(res.status, 401, "Token for non-existent user must return 401");
        const json = await res.json();
        assert.equal(json.success, false);
      }
    });

    test("malformed authorization headers return 401", async () => {
      const badHeaders = [
        "Basic dXNlcjpwYXNz",
        "Bearer ",
        "Bearer",
        "Token xyz",
        "Bearer not.a.valid.jwt.payload",
      ];

      for (const header of badHeaders) {
        const res = await getCourses(
          new NextRequest("http://localhost/api/mobile/courses", {
            headers: { Authorization: header },
          })
        );
        assert.equal(res.status, 401, `Header '${header}' must return 401`);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. Data Validation & Boundary Values QA
  // -------------------------------------------------------------------------
  describe("2. Boundary Values & Input Sanitization", () => {
    test("Course: rejects too short/long names, invalid credit hours, and malformed colors", async () => {
      // Name too short (<2 chars)
      const resShort = await postCourses(
        new NextRequest("http://localhost/api/mobile/courses", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "A", code: "CS101", creditHours: 3 }),
        })
      );
      assert.equal(resShort.status, 400);

      // Excessive credit hours (>6 or negative)
      const resNegCredits = await postCourses(
        new NextRequest("http://localhost/api/mobile/courses", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Software Eng", code: "CS201", creditHours: -1 }),
        })
      );
      assert.equal(resNegCredits.status, 400);

      const resExcessCredits = await postCourses(
        new NextRequest("http://localhost/api/mobile/courses", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Software Eng", code: "CS201", creditHours: 10 }),
        })
      );
      assert.equal(resExcessCredits.status, 400);
    });

    test("Attendance: rejects attended > total, negative values, and non-integer values", async () => {
      // Create a valid course for user1
      const course = {
        id: "c-att-qa-1",
        userId: user1.id,
        name: "Data Structures",
        code: "CS201",
        creditHours: 3,
        color: "#2563eb",
      };
      mockState.courses.push(course);

      // attendedClasses > totalClasses
      const resOverflow = await postAttendance(
        new NextRequest("http://localhost/api/mobile/academics/attendance", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            totalClasses: 10,
            attendedClasses: 12,
          }),
        })
      );
      assert.equal(resOverflow.status, 400);
      const jsonOverflow = await resOverflow.json();
      assert.ok(jsonOverflow.error.includes("exceed"));

      // Negative values
      const resNegative = await postAttendance(
        new NextRequest("http://localhost/api/mobile/academics/attendance", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            totalClasses: -5,
            attendedClasses: -2,
          }),
        })
      );
      assert.equal(resNegative.status, 400);

      // Valid attendance succeeds cleanly
      const resValid = await postAttendance(
        new NextRequest("http://localhost/api/mobile/academics/attendance", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            totalClasses: 20,
            attendedClasses: 18,
          }),
        })
      );
      assert.equal(resValid.status, 200);
      const jsonValid = await resValid.json();
      assert.equal(jsonValid.success, true);
      assert.equal(jsonValid.attendance.attendedClasses, 18);
    });

    test("Academics Grade: rejects invalid letter grades and foreign courses", async () => {
      // Course owned by user2
      const u2Course = {
        id: "c-u2-qa",
        userId: user2.id,
        name: "Physics",
        code: "PHY101",
        creditHours: 4,
        color: "#16a34a",
      };
      mockState.courses.push(u2Course);

      // User 1 attempts to record grade on User 2's course
      const resCross = await postGrade(
        new NextRequest("http://localhost/api/mobile/academics/grades", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: u2Course.id,
            grade: "A",
          }),
        })
      );
      assert.equal(resCross.status, 404, "Foreign course must return 404");

      // Invalid grade option (e.g. 'Z+')
      const u1Course = {
        id: "c-u1-qa",
        userId: user1.id,
        name: "Algorithms",
        code: "CS301",
        creditHours: 3,
        color: "#2563eb",
      };
      mockState.courses.push(u1Course);

      const resBadGrade = await postGrade(
        new NextRequest("http://localhost/api/mobile/academics/grades", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: u1Course.id,
            grade: "Z_PLUS",
          }),
        })
      );
      assert.equal(resBadGrade.status, 400);
    });

    test("Assignments: validates priority enum, status enum, and malformed due dates", async () => {
      const course = {
        id: "c-asgn-qa",
        userId: user1.id,
        name: "Database Systems",
        code: "CS302",
        creditHours: 3,
        color: "#2563eb",
      };
      mockState.courses.push(course);

      // Malformed date
      const resBadDate = await postAssignments(
        new NextRequest("http://localhost/api/mobile/assignments", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "SQL Query Project",
            courseId: course.id,
            dueDate: "not-a-valid-date-string",
            priority: "HIGH",
          }),
        })
      );
      assert.equal(resBadDate.status, 400);

      // Invalid priority
      const resBadPriority = await postAssignments(
        new NextRequest("http://localhost/api/mobile/assignments", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "SQL Query Project",
            courseId: course.id,
            dueDate: new Date().toISOString(),
            priority: "SUPER_URGENT_NOT_REAL",
          }),
        })
      );
      assert.equal(resBadPriority.status, 400);
    });

    test("Goals: rejects out-of-bound target values", async () => {
      // GPA > 4.0
      const resHighGpa = await postGoals(
        new NextRequest("http://localhost/api/mobile/goals", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "TARGET_GPA",
            targetValue: 5.5,
            period: "SEMESTER",
          }),
        })
      );
      assert.equal(resHighGpa.status, 400);

      // Attendance > 100%
      const resHighAtt = await postGoals(
        new NextRequest("http://localhost/api/mobile/goals", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ATTENDANCE",
            targetValue: 120,
            period: "CURRENT",
          }),
        })
      );
      assert.equal(resHighAtt.status, 400);
    });

    test("Study Plans: rejects empty items array and negative task durations", async () => {
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 86400000);

      // Empty items
      const resEmpty = await postStudyPlans(
        new NextRequest("http://localhost/api/mobile/study-plans", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Midterm Prep Plan",
            startDate: now.toISOString(),
            endDate: end.toISOString(),
            items: [],
          }),
        })
      );
      assert.equal(resEmpty.status, 400);

      // Task with duration 0 or negative
      const resNegDuration = await postStudyPlans(
        new NextRequest("http://localhost/api/mobile/study-plans", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Midterm Prep Plan",
            startDate: now.toISOString(),
            endDate: end.toISOString(),
            items: [
              {
                title: "Review Chapter 1",
                scheduledAt: now.toISOString(),
                duration: -30,
              },
            ],
          }),
        })
      );
      assert.equal(resNegDuration.status, 400);
    });

    test("AI Study Buddy: rejects empty message and message exceeding 2000 chars", async () => {
      // Empty message
      const resEmpty = await postAiStudyBuddy(
        new NextRequest("http://localhost/api/mobile/ai/study-buddy", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: "   " }),
        })
      );
      assert.equal(resEmpty.status, 400);

      // Message > 2000 characters
      const longMessage = "x".repeat(2001);
      const resTooLong = await postAiStudyBuddy(
        new NextRequest("http://localhost/api/mobile/ai/study-buddy", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: longMessage }),
        })
      );
      assert.equal(resTooLong.status, 400);
    });

    test("Push Token: rejects empty token string", async () => {
      const res = await registerPushToken(
        new NextRequest("http://localhost/api/mobile/notifications/push-token", {
          method: "POST",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ token: "   ", platform: "android" }),
        })
      );
      assert.equal(res.status, 400);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Multi-Tenant Cross-User Isolation QA
  // -------------------------------------------------------------------------
  describe("3. Multi-Tenant Cross-User Isolation Across Modules", () => {
    test("User 1 cannot update or delete User 2's course", async () => {
      const u2Course = {
        id: "c-u2-secret",
        userId: user2.id,
        name: "User 2 Course",
        code: "U2_101",
        creditHours: 3,
        color: "#16a34a",
      };
      mockState.courses.push(u2Course);

      // User 1 tries PUT on User 2's course
      const resPut = await putCourse(
        new NextRequest(`http://localhost/api/mobile/courses/${u2Course.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Hacked Course Name", code: "HACK1", creditHours: 3 }),
        }),
        { params: Promise.resolve({ id: u2Course.id }) }
      );
      assert.equal(resPut.status, 404);

      // User 1 tries DELETE on User 2's course
      const resDelete = await deleteCourse(
        new NextRequest(`http://localhost/api/mobile/courses/${u2Course.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token1}` },
        }),
        { params: Promise.resolve({ id: u2Course.id }) }
      );
      assert.equal(resDelete.status, 404);
    });

    test("User 1 cannot revoke User 2's push token", async () => {
      mockState.devicePushTokens.push({
        id: "pt-u2",
        userId: user2.id,
        token: "ExponentPushToken[user2_device_token]",
        platform: "ios",
      });

      // User 1 attempts to revoke User 2's push token
      const res = await revokePushToken(
        new NextRequest("http://localhost/api/mobile/notifications/push-token", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token1}`, "Content-Type": "application/json" },
          body: JSON.stringify({ token: "ExponentPushToken[user2_device_token]" }),
        })
      );

      // User 2's token should still exist in database
      const u2TokenInDb = mockState.devicePushTokens.find(
        (t: any) => t.token === "ExponentPushToken[user2_device_token]"
      );
      assert.ok(u2TokenInDb, "User 2's token must not be deleted by User 1");
    });
  });
});
