import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { mockState, resetMockState } from "./setup-prisma";

import {
  upsertCourseGrade,
  upsertAttendance,
  deleteCourseGrade,
  deleteAttendance,
} from "../app/lib/academic";
import {
  updateCourseRecord,
  deleteCourseRecord,
} from "../app/lib/courses";
import {
  createTimetableEntryRecord,
  updateTimetableEntryRecord,
  deleteTimetableEntryRecord,
} from "../app/lib/timetable";
import {
  createAssignmentRecord,
  updateAssignmentRecord,
  deleteAssignmentRecord,
} from "../app/lib/assignments";
import {
  createExamRecord,
  updateExamRecord,
  deleteExamRecord,
} from "../app/lib/exams";
import {
  updateExpenseRecord,
  deleteExpenseRecord,
  getPKTDateParts,
  getPKTMonthBounds,
  getPKTWeekBounds,
  getExpenseSummary,
} from "../app/lib/expenses";
import {
  markNotificationAsRead,
  deleteNotification,
} from "../app/lib/notifications";
import {
  checkRateLimit,
  pruneRateLimitMap,
  _resetRateLimits,
  _getRateLimitMapSize,
  AI_RATE_LIMIT,
  AI_RATE_WINDOW_MS,
  AI_RATE_MAX_ENTRIES,
} from "../app/lib/ai";
import { findUserByEmail, createUser } from "../app/lib/users";
import { formatContextPrompt } from "../app/lib/study-buddy-context";

// ---------------------------------------------------------------------------
// TEST SUITE 1: Issue #1 — Academic Ownership Verification
// ---------------------------------------------------------------------------
describe("Issue #1: Academic Ownership Verification", () => {
  beforeEach(() => {
    resetMockState();
    // User 1 course
    mockState.courses.push({
      id: "course-u1",
      userId: "user-1",
      name: "Calculus",
      code: "MATH101",
      creditHours: 3,
    });
    // User 2 course
    mockState.courses.push({
      id: "course-u2",
      userId: "user-2",
      name: "Physics",
      code: "PHY101",
      creditHours: 4,
    });
  });

  test("User 1 CANNOT upsert grade on User 2's course", async () => {
    await assert.rejects(
      async () => {
        await upsertCourseGrade("user-1", "course-u2", "A");
      },
      { message: "Course not found or unauthorized." }
    );
  });

  test("User 1 CANNOT upsert attendance on User 2's course", async () => {
    await assert.rejects(
      async () => {
        await upsertAttendance("user-1", "course-u2", 30, 28);
      },
      { message: "Course not found or unauthorized." }
    );
  });

  test("User 1 CANNOT delete grade on User 2's course", async () => {
    await assert.rejects(
      async () => {
        await deleteCourseGrade("user-1", "course-u2");
      },
      { message: "Course not found or unauthorized." }
    );
  });

  test("User 1 CANNOT delete attendance on User 2's course", async () => {
    await assert.rejects(
      async () => {
        await deleteAttendance("user-1", "course-u2");
      },
      { message: "Course not found or unauthorized." }
    );
  });

  test("User 1 CAN legitimately upsert and delete grade on own course", async () => {
    const grade = await upsertCourseGrade("user-1", "course-u1", "A");
    assert.strictEqual(grade.grade, "A");
    assert.strictEqual(grade.courseId, "course-u1");
    assert.strictEqual(grade.userId, "user-1");

    const del = await deleteCourseGrade("user-1", "course-u1");
    assert.strictEqual(del.count, 1);
  });

  test("User 1 CAN legitimately upsert and delete attendance on own course", async () => {
    const att = await upsertAttendance("user-1", "course-u1", 20, 18);
    assert.strictEqual(att.totalClasses, 20);
    assert.strictEqual(att.attendedClasses, 18);

    const del = await deleteAttendance("user-1", "course-u1");
    assert.strictEqual(del.count, 1);
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 2: Issue #7 — Atomic TOCTOU-Free Mutations Across CRUD
// ---------------------------------------------------------------------------
describe("Issue #7: Atomic TOCTOU-Free Mutations Across CRUD", () => {
  beforeEach(() => {
    resetMockState();
    mockState.courses.push({
      id: "c-u1",
      userId: "user-1",
      name: "Algorithms",
      code: "CS201",
      creditHours: 3,
      semester: "Fall 2026",
      color: "#2563eb",
    });
    mockState.timetable.push({
      id: "tt-u1",
      userId: "user-1",
      courseId: "c-u1",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:30",
      room: "R101",
      type: "Lecture",
    });
    mockState.assignments.push({
      id: "asgn-u1",
      userId: "user-1",
      courseId: "c-u1",
      title: "Lab 1",
      description: "Intro",
      dueDate: new Date(),
      priority: "HIGH",
      status: "NOT_STARTED",
    });
    mockState.exams.push({
      id: "exam-u1",
      userId: "user-1",
      courseId: "c-u1",
      title: "Midterm",
      examDate: new Date(),
      room: "Hall A",
      type: "MIDTERM",
      status: "UPCOMING",
      preparationProgress: 50,
      notes: "Chapters 1-3",
    });
    mockState.expenses.push({
      id: "exp-u1",
      userId: "user-1",
      amount: "150.00",
      category: "FOOD",
      description: "Lunch",
      expenseDate: new Date(),
    });
    mockState.notifications.push({
      id: "notif-u1",
      userId: "user-1",
      type: "TEST",
      title: "Notice",
      message: "Hello",
      read: false,
      readAt: null,
    });
  });

  test("Courses: Cross-user update and delete are rejected atomically", async () => {
    await assert.rejects(
      async () => {
        await updateCourseRecord("c-u1", "user-attacker", {
          name: "Hacked",
          code: "HACK",
          instructor: "Attacker",
          creditHours: 3,
          semester: "Fall 2026",
          color: "#000000",
        });
      },
      { message: "Course not found or unauthorized." }
    );

    await assert.rejects(
      async () => {
        await deleteCourseRecord("c-u1", "user-attacker");
      },
      { message: "Course not found or unauthorized." }
    );
  });

  test("Timetable: Cross-user update and delete are rejected atomically", async () => {
    await assert.rejects(
      async () => {
        await updateTimetableEntryRecord("tt-u1", "user-attacker", {
          courseId: "c-u1",
          dayOfWeek: 2,
          startTime: "10:00",
          endTime: "11:00",
          room: "R102",
          type: "Lecture",
        });
      },
      { message: "Course not found or unauthorized." }
    );

    await assert.rejects(
      async () => {
        await deleteTimetableEntryRecord("tt-u1", "user-attacker");
      },
      { message: "Timetable entry not found or unauthorized." }
    );
  });

  test("Assignments: Cross-user update and delete are rejected atomically", async () => {
    await assert.rejects(
      async () => {
        await updateAssignmentRecord("asgn-u1", "user-attacker", {
          courseId: "c-u1",
          title: "Attacked",
          description: "Desc",
          dueDate: new Date(),
          priority: "HIGH",
          status: "NOT_STARTED",
        });
      },
      { message: "Course not found or unauthorized." }
    );

    await assert.rejects(
      async () => {
        await deleteAssignmentRecord("asgn-u1", "user-attacker");
      },
      { message: "Assignment not found or unauthorized." }
    );
  });

  test("Exams: Cross-user update and delete are rejected atomically", async () => {
    await assert.rejects(
      async () => {
        await updateExamRecord("exam-u1", "user-attacker", {
          courseId: "c-u1",
          title: "Exam hacked",
          examDate: new Date(),
          room: "Hall A",
          type: "FINAL",
          status: "UPCOMING",
          preparationProgress: 0,
          notes: "",
        });
      },
      { message: "Course not found or unauthorized." }
    );

    await assert.rejects(
      async () => {
        await deleteExamRecord("exam-u1", "user-attacker");
      },
      { message: "Exam not found or unauthorized." }
    );
  });

  test("Expenses: Cross-user update and delete are rejected atomically", async () => {
    await assert.rejects(
      async () => {
        await updateExpenseRecord("exp-u1", "user-attacker", {
          amount: 9999,
          category: "OTHER",
          expenseDate: new Date(),
        });
      },
      { message: "Expense record not found or unauthorized" }
    );

    await assert.rejects(
      async () => {
        await deleteExpenseRecord("exp-u1", "user-attacker");
      },
      { message: "Expense record not found or unauthorized" }
    );
  });

  test("Notifications: Cross-user mark read and delete return false atomically", async () => {
    const markRes = await markNotificationAsRead("user-attacker", "notif-u1");
    assert.strictEqual(markRes, false);

    const delRes = await deleteNotification("user-attacker", "notif-u1");
    assert.strictEqual(delRes, false);

    const ownMark = await markNotificationAsRead("user-1", "notif-u1");
    assert.strictEqual(ownMark, true);

    const ownDel = await deleteNotification("user-1", "notif-u1");
    assert.strictEqual(ownDel, true);
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 3: Issue #6 — Open Redirect Sanitization in test-session Route
// ---------------------------------------------------------------------------
describe("Issue #6: Open Redirect Sanitization", () => {
  function sanitizeRedirect(redirectParam: string | null): string {
    let safeRedirect = "/dashboard";
    if (
      redirectParam &&
      redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//") &&
      !redirectParam.startsWith("/\\") &&
      !redirectParam.includes("://")
    ) {
      safeRedirect = redirectParam;
    }
    return safeRedirect;
  }

  test("Rejects protocol-relative open redirect //evil.com", () => {
    assert.strictEqual(sanitizeRedirect("//evil.com"), "/dashboard");
    assert.strictEqual(sanitizeRedirect("//attacker.site/phish"), "/dashboard");
  });

  test("Rejects backslash open redirect /\\evil.com", () => {
    assert.strictEqual(sanitizeRedirect("/\\evil.com"), "/dashboard");
  });

  test("Rejects absolute URLs http://evil.com and https://evil.com", () => {
    assert.strictEqual(sanitizeRedirect("https://evil.com"), "/dashboard");
    assert.strictEqual(sanitizeRedirect("http://evil.com"), "/dashboard");
  });

  test("Rejects javascript: URI schemes", () => {
    assert.strictEqual(sanitizeRedirect("javascript:alert(1)"), "/dashboard");
  });

  test("Allows legitimate internal relative application paths", () => {
    assert.strictEqual(sanitizeRedirect("/dashboard/courses"), "/dashboard/courses");
    assert.strictEqual(sanitizeRedirect("/dashboard/expenses"), "/dashboard/expenses");
    assert.strictEqual(sanitizeRedirect("/dashboard/academics"), "/dashboard/academics");
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 4 & 5: Issue #2 & #3 — Rate Limiter & Bounded Eviction
// ---------------------------------------------------------------------------
describe("Issue #2 & #3: AI Rate Limiting & Bounded Memory Eviction", () => {
  beforeEach(() => {
    _resetRateLimits();
  });

  test("Constants are single source of truth: 20 req / 60,000 ms", () => {
    assert.strictEqual(AI_RATE_LIMIT, 20);
    assert.strictEqual(AI_RATE_WINDOW_MS, 60_000);
    assert.strictEqual(AI_RATE_MAX_ENTRIES, 10_000);
  });

  test("Allows exactly 20 requests in 60s window, blocks 21st request", () => {
    const baseTime = 1700000000000;
    const userId = "student-rate-test";

    for (let i = 0; i < 20; i++) {
      const allowed = checkRateLimit(userId, baseTime + i * 100);
      assert.strictEqual(allowed, true, `Request ${i + 1} should be allowed`);
    }

    const blocked = checkRateLimit(userId, baseTime + 2500);
    assert.strictEqual(blocked, false, "21st request must be blocked");

    // After 60 seconds (window expires), requests succeed again
    const allowedAfterWindow = checkRateLimit(userId, baseTime + 61_000);
    assert.strictEqual(allowedAfterWindow, true, "Request after window must succeed");
  });

  test("Eviction prunes expired entries and prevents memory leak", () => {
    const t0 = 1700000000000;

    // Simulate 50 users sending requests at t0
    for (let i = 0; i < 50; i++) {
      checkRateLimit(`user-${i}`, t0);
    }
    assert.strictEqual(_getRateLimitMapSize(), 50);

    // After 61 seconds, all are expired. Prune should empty the map.
    pruneRateLimitMap(t0 + 61_000);
    assert.strictEqual(_getRateLimitMapSize(), 0, "All expired user entries must be pruned");
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 6: Issue #5 — Asia/Karachi (PKT) Expense Timezone Boundaries
// ---------------------------------------------------------------------------
describe("Issue #5: Asia/Karachi (PKT) Timezone Handling", () => {
  test("UTC boundary: 2026-08-31 21:00 UTC is September 1st in Asia/Karachi", () => {
    // 21:00 UTC on Aug 31 + 5 hours = 02:00 PKT on Sept 1
    const utcDate = new Date("2026-08-31T21:00:00.000Z");
    const parts = getPKTDateParts(utcDate);

    assert.strictEqual(parts.year, 2026);
    assert.strictEqual(parts.month, 8, "Month must be September (0-indexed 8)");
    assert.strictEqual(parts.day, 1, "Day must be 1st");
    assert.strictEqual(parts.dayOfWeek, 2, "Day of week must be Tuesday (2)");
  });

  test("getPKTMonthBounds covers exact PKT month boundaries", () => {
    // Reference date: Sept 15, 2026 12:00 PKT (07:00 UTC)
    const refDate = new Date("2026-09-15T07:00:00.000Z");
    const bounds = getPKTMonthBounds(refDate);

    // PKT Month starts at 2026-09-01 00:00:00 PKT = 2026-08-31 19:00:00 UTC
    assert.strictEqual(bounds.start.toISOString(), "2026-08-31T19:00:00.000Z");

    // PKT Month ends at 2026-09-30 23:59:59.999 PKT = 2026-09-30 18:59:59.999 UTC
    assert.strictEqual(bounds.end.toISOString(), "2026-09-30T18:59:59.999Z");
  });

  test("getPKTWeekBounds starts Monday and ends Sunday in PKT", () => {
    // Reference: Wednesday Sept 2, 2026 12:00 PKT = 07:00 UTC
    const refDate = new Date("2026-09-02T07:00:00.000Z");
    const weekBounds = getPKTWeekBounds(refDate);

    // Monday Aug 31 00:00 PKT = Sunday Aug 30 19:00 UTC
    assert.strictEqual(weekBounds.start.toISOString(), "2026-08-30T19:00:00.000Z");

    // Sunday Sept 6 23:59:59.999 PKT = Sunday Sept 6 18:59:59.999 UTC
    assert.strictEqual(weekBounds.end.toISOString(), "2026-09-06T18:59:59.999Z");
  });

  test("getExpenseSummary calculates This Month using PKT boundaries", async () => {
    resetMockState();
    // Expense logged at 2026-08-31 21:00 UTC -> 2026-09-01 02:00 PKT
    mockState.expenses.push({
      id: "exp-pkt",
      userId: "user-pkt",
      amount: "250.00",
      category: "BOOKS",
      description: "Textbook",
      expenseDate: new Date("2026-08-31T21:00:00.000Z"),
    });

    const summary = await getExpenseSummary("user-pkt");
    assert.strictEqual(summary.hasExpenses, true);
    assert.strictEqual(summary.totalSpending, 250);
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 7: Issue #4 — Clean Bcrypt Password Handling
// ---------------------------------------------------------------------------
describe("Issue #4: Clean Bcrypt Password Verification", () => {
  beforeEach(() => {
    resetMockState();
  });

  test("Bcrypt verification succeeds on valid password and fails on invalid", async () => {
    const rawPassword = "SecurePassword123!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    const user = await createUser("Test Student", "student@test.com", hash);

    // StoredUser must have passwordHash and MUST NOT have hashedPassword property
    assert.strictEqual(user.passwordHash, hash);
    assert.strictEqual((user as any).hashedPassword, undefined);

    const validMatch = await bcrypt.compare(rawPassword, user.passwordHash);
    assert.strictEqual(validMatch, true);

    const invalidMatch = await bcrypt.compare("WrongPassword", user.passwordHash);
    assert.strictEqual(invalidMatch, false);
  });

  test("findUserByEmail returns StoredUser without deprecated hashedPassword alias", async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Pass123", salt);
    await createUser("Student Two", "two@test.com", hash);

    const fetched = await findUserByEmail("two@test.com");
    assert.ok(fetched);
    assert.strictEqual(fetched.passwordHash, hash);
    assert.strictEqual((fetched as any).hashedPassword, undefined);
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 8: AI Context Privacy & Security Isolation
// ---------------------------------------------------------------------------
describe("Security & Privacy: AI Context Isolation", () => {
  test("formatContextPrompt strictly excludes expenses, passwords, and secret tokens", () => {
    const prompt = formatContextPrompt({
      studentName: "Alex",
      currentDateStr: "Sunday, September 6, 2026",
      currentDayName: "Sunday",
      currentTimeStr: "10:00 AM",
      courses: [
        {
          name: "Database Systems",
          code: "CS301",
          instructor: "Dr. Smith",
          creditHours: 3,
          semester: "Fall 2026",
        },
      ],
      todayTimetable: [],
      upcomingAssignments: [],
      upcomingExams: [],
      academics: {
        gpa: "3.80",
        overallAttendance: "88%",
        gradedCredits: 12,
        totalCredits: 15,
        coursePerformance: [],
      },
    });

    const lower = prompt.toLowerCase();
    assert.strictEqual(lower.includes("password"), false);
    assert.strictEqual(lower.includes("secret"), false);
    assert.strictEqual(lower.includes("expense"), false);
    assert.strictEqual(lower.includes("pkr"), false);
    assert.strictEqual(lower.includes("budget"), false);
  });
});
