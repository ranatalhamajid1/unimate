import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";
import { getCalendarIntelligence } from "../app/lib/calendar-intelligence";

describe("Milestone 15.4: Calendar Intelligence Test Suite", () => {
  const userId = "user-cal-student";
  const proUserId = "user-cal-pro";
  const otherUserId = "user-cal-other";
  const courseId = "course-cs101";

  beforeEach(() => {
    resetMockState();

    mockState.users.push(
      {
        id: userId,
        email: "student@uni.edu",
        name: "Student",
        passwordHash: "hash1",
      },
      {
        id: proUserId,
        email: "pro@uni.edu",
        name: "Pro Student",
        passwordHash: "hash2",
      },
      {
        id: otherUserId,
        email: "other@uni.edu",
        name: "Other Student",
        passwordHash: "hash3",
      }
    );

    mockState.subscriptions.push({
      id: "sub-1",
      userId: proUserId,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodEnd: new Date("2026-12-31T00:00:00.000Z"),
    });

    mockState.courses.push({
      id: courseId,
      userId,
      name: "Computer Science",
      code: "CS101",
      color: "#2563EB",
    });
  });

  test("1. Empty calendar returns LIGHT workload and empty clusters/windows", async () => {
    const intel = await getCalendarIntelligence(userId, new Date("2026-09-15T10:00:00.000Z"));

    assert.strictEqual(intel.weekWorkload.overallTier, "LIGHT");
    assert.strictEqual(intel.deadlineClusters.length, 0);
    assert.strictEqual(intel.googleCalendar.connected, false);
    assert.strictEqual(intel.dailyWorkloads.length, 7);
  });

  test("2. Day workload classification: LIGHT when total hours < 3", async () => {
    // Add 1 timetable entry (1 hour = 60 mins)
    mockState.timetable.push({
      id: "tt-1",
      userId,
      courseId,
      dayOfWeek: 2, // Tuesday
      startTime: "09:00",
      endTime: "10:00",
      type: "LECTURE",
      room: "Hall A",
    });

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-15T10:00:00.000Z"));
    // 2026-09-15 is a Tuesday (dayOfWeek 2)
    const tuesday = intel.dailyWorkloads.find((d) => d.dateKey === "2026-09-15");
    assert.ok(tuesday);
    assert.strictEqual(tuesday.tier, "LIGHT");
    assert.strictEqual(tuesday.classCount, 1);
  });

  test("3. Day workload classification: BALANCED when total hours 3-5", async () => {
    // 4 hours of lectures on Tuesday
    mockState.timetable.push(
      {
        id: "tt-1",
        userId,
        courseId,
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "11:00",
        type: "LECTURE",
      },
      {
        id: "tt-2",
        userId,
        courseId,
        dayOfWeek: 2,
        startTime: "13:00",
        endTime: "15:00",
        type: "LAB",
      }
    );

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-15T10:00:00.000Z"));
    const tuesday = intel.dailyWorkloads.find((d) => d.dateKey === "2026-09-15");
    assert.ok(tuesday);
    assert.strictEqual(tuesday.tier, "BALANCED");
    assert.strictEqual(tuesday.classCount, 2);
  });

  test("4. Day workload classification: BUSY when total hours 5.1-7", async () => {
    mockState.timetable.push(
      {
        id: "tt-1",
        userId,
        courseId,
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "12:00",
        type: "LECTURE",
      },
      {
        id: "tt-2",
        userId,
        courseId,
        dayOfWeek: 2,
        startTime: "13:00",
        endTime: "16:00",
        type: "LAB",
      }
    );

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-15T10:00:00.000Z"));
    const tuesday = intel.dailyWorkloads.find((d) => d.dateKey === "2026-09-15");
    assert.ok(tuesday);
    assert.strictEqual(tuesday.tier, "BUSY");
  });

  test("5. Day workload classification: OVERLOADED when total hours > 7", async () => {
    // 8 hours of classes
    mockState.timetable.push(
      {
        id: "tt-1",
        userId,
        courseId,
        dayOfWeek: 2,
        startTime: "08:00",
        endTime: "12:00",
        type: "LECTURE",
      },
      {
        id: "tt-2",
        userId,
        courseId,
        dayOfWeek: 2,
        startTime: "13:00",
        endTime: "17:00",
        type: "LAB",
      },
      {
        id: "tt-3",
        userId,
        courseId,
        dayOfWeek: 2,
        startTime: "17:00",
        endTime: "18:00",
        type: "TUTORIAL",
      }
    );

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-15T10:00:00.000Z"));
    const tuesday = intel.dailyWorkloads.find((d) => d.dateKey === "2026-09-15");
    assert.ok(tuesday);
    assert.strictEqual(tuesday.tier, "OVERLOADED");
  });

  test("6. Deadline cluster detection: clusters 2+ events due within 48h", async () => {
    // Add two assignments due within 24 hours of each other
    mockState.assignments.push(
      {
        id: "asg-1",
        userId,
        courseId,
        title: "Assignment 1",
        dueDate: new Date("2026-09-16T10:00:00.000Z"),
        status: "NOT_STARTED",
      },
      {
        id: "asg-2",
        userId,
        courseId,
        title: "Assignment 2",
        dueDate: new Date("2026-09-17T09:00:00.000Z"),
        status: "IN_PROGRESS",
      }
    );

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-15T10:00:00.000Z"));
    assert.ok(intel.deadlineClusters.length >= 1);
    const cluster = intel.deadlineClusters[0];
    assert.strictEqual(cluster.itemCount, 2);
    assert.ok(cluster.severity === "HIGH" || cluster.severity === "MODERATE");
  });

  test("7. Deadline cluster severity: CRITICAL when containing an EXAM", async () => {
    mockState.assignments.push({
      id: "asg-1",
      userId,
      courseId,
      title: "Homework",
      dueDate: new Date("2026-09-16T10:00:00.000Z"),
      status: "NOT_STARTED",
    });

    mockState.exams.push({
      id: "exam-1",
      userId,
      courseId,
      title: "Midterm Exam",
      examDate: new Date("2026-09-17T09:00:00.000Z"),
    });

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-15T10:00:00.000Z"));
    assert.ok(intel.deadlineClusters.length >= 1);
    const cluster = intel.deadlineClusters[0];
    assert.strictEqual(cluster.severity, "CRITICAL");
  });

  test("8. Study windows avoid timetable obstacles", async () => {
    // Monday lecture from 10:00 to 14:00
    mockState.timetable.push({
      id: "tt-mon",
      userId,
      courseId,
      dayOfWeek: 1, // Monday
      startTime: "10:00",
      endTime: "14:00",
      type: "LECTURE",
    });

    // Add an urgent assignment due Wednesday
    mockState.assignments.push({
      id: "asg-urgent",
      userId,
      courseId,
      title: "Urgent Lab Report",
      dueDate: new Date("2026-09-16T12:00:00.000Z"),
      status: "NOT_STARTED",
    });

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-14T08:00:00.000Z"));
    const mondayWindows = intel.recommendedStudyWindows.filter((w) => w.dateKey === "2026-09-14");

    // No window should overlap with 10:00-14:00
    for (const win of mondayWindows) {
      assert.ok(
        win.endTime <= "10:00" || win.startTime >= "14:00",
        `Window ${win.startTime}-${win.endTime} overlaps with lecture 10:00-14:00`
      );
    }
  });

  test("9. Study windows are strictly within 08:00 and 22:00 PKT bounds", async () => {
    mockState.assignments.push({
      id: "asg-1",
      userId,
      courseId,
      title: "Paper Draft",
      dueDate: new Date("2026-09-18T10:00:00.000Z"),
      status: "NOT_STARTED",
    });

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-14T08:00:00.000Z"));
    for (const win of intel.recommendedStudyWindows) {
      assert.ok(win.startTime >= "08:00", `Window starts before 08:00: ${win.startTime}`);
      assert.ok(win.endTime <= "22:00", `Window ends after 22:00: ${win.endTime}`);
    }
  });

  test("10. Google Calendar connection status reflects UserIntegration record", async () => {
    mockState.userIntegrations.push({
      id: "ui-1",
      userId,
      provider: "GOOGLE_CALENDAR",
      status: "CONNECTED",
      lastSyncAt: new Date("2026-09-14T12:00:00.000Z"),
      calendarId: "unimate-academic-id",
    });

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-14T08:00:00.000Z"));
    assert.strictEqual(intel.googleCalendar.connected, true);
    assert.strictEqual(intel.googleCalendar.status, "CONNECTED");
    assert.ok(intel.googleCalendar.lastSyncAt);
  });

  test("11. Strict tenant isolation: other user's commitments do not affect student", async () => {
    // other user has heavy commitments
    mockState.timetable.push(
      {
        id: "tt-other-1",
        userId: otherUserId,
        courseId: "course-other",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "18:00",
        type: "LECTURE",
      }
    );
    mockState.assignments.push({
      id: "asg-other-1",
      userId: otherUserId,
      courseId: "course-other",
      title: "Other User Exam",
      dueDate: new Date("2026-09-15T12:00:00.000Z"),
      status: "NOT_STARTED",
    });

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-14T08:00:00.000Z"));
    assert.strictEqual(intel.weekWorkload.overallTier, "LIGHT");
    assert.strictEqual(intel.deadlineClusters.length, 0);
  });

  test("12. Completed assignments do not trigger deadline clusters", async () => {
    mockState.assignments.push(
      {
        id: "asg-comp-1",
        userId,
        courseId,
        title: "Done Project",
        dueDate: new Date("2026-09-15T12:00:00.000Z"),
        status: "COMPLETED",
      },
      {
        id: "asg-comp-2",
        userId,
        courseId,
        title: "Done Homework",
        dueDate: new Date("2026-09-15T18:00:00.000Z"),
        status: "SUBMITTED",
      }
    );

    const intel = await getCalendarIntelligence(userId, new Date("2026-09-14T08:00:00.000Z"));
    assert.strictEqual(intel.deadlineClusters.length, 0);
  });

  test("13. Google Calendar NEEDS_REAUTH state surfaces correctly without claiming connection", async () => {
    mockState.userIntegrations.push({
      id: "ui-reauth",
      userId,
      provider: "GOOGLE_CALENDAR",
      status: "NEEDS_REAUTH",
      calendarId: "unimate-academic-id",
    });

    const intel = await getCalendarIntelligence(userId, { referenceDate: new Date("2026-09-14T08:00:00.000Z") });
    assert.strictEqual(intel.googleCalendar.connected, false);
    assert.strictEqual(intel.googleCalendar.status, "NEEDS_REAUTH");
  });

  test("14. Sanitized API response: zero secrets, passwords, or OAuth tokens in payload", async () => {
    mockState.userIntegrations.push({
      id: "ui-sec",
      userId,
      provider: "GOOGLE_CALENDAR",
      status: "CONNECTED",
      encryptedAccessToken: "secret-enc-access",
      encryptedRefreshToken: "secret-enc-refresh",
      calendarId: "unimate-academic-id",
    });

    const intel = await getCalendarIntelligence(userId, { referenceDate: new Date("2026-09-14T08:00:00.000Z") });
    const rawStr = JSON.stringify(intel);
    assert.strictEqual(rawStr.includes("secret-enc-access"), false);
    assert.strictEqual(rawStr.includes("secret-enc-refresh"), false);
    assert.strictEqual(rawStr.includes("passwordHash"), false);
  });

  test("15. Study window collision avoidance: study windows avoid existing timetable blocks via study-availability", async () => {
    // Fill morning with classes 08:00 to 12:00
    mockState.timetable.push({
      id: "tt-full-morning",
      userId,
      courseId,
      dayOfWeek: 1, // Monday
      startTime: "08:00",
      endTime: "12:00",
      type: "LECTURE",
    });

    // Add assignment
    mockState.assignments.push({
      id: "asg-next",
      userId,
      courseId,
      title: "Reading",
      dueDate: new Date("2026-09-16T12:00:00.000Z"),
      status: "NOT_STARTED",
    });

    const intel = await getCalendarIntelligence(userId, { referenceDate: new Date("2026-09-14T08:00:00.000Z") });
    const monWindows = intel.recommendedStudyWindows.filter((w) => w.dateKey === "2026-09-14");
    for (const w of monWindows) {
      assert.ok(w.startTime >= "12:00", `Window ${w.startTime} overlaps with 08:00-12:00 lecture`);
    }
  });
});
