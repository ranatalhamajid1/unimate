import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";
import { getWeeklyReview } from "../app/lib/weekly-review";

describe("Milestone 15.5: Weekly Review Test Suite", () => {
  const userId = "user-rev-student";
  const proUserId = "user-rev-pro";
  const foreignUserId = "user-rev-foreign";
  const courseId1 = "course-cs101";
  const courseId2 = "course-mth201";

  // Reference date: Wednesday Sep 16, 2026
  const refDate = new Date("2026-09-16T12:00:00.000Z");
  // Week bounds for weekOffset = 0: Sep 14 (Mon) to Sep 20 (Sun)
  // Week bounds for weekOffset = -1: Sep 7 (Mon) to Sep 13 (Sun)

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
        id: foreignUserId,
        email: "foreign@uni.edu",
        name: "Foreign Student",
        passwordHash: "hash3",
      }
    );

    mockState.courses.push(
      {
        id: courseId1,
        userId,
        name: "Data Structures",
        code: "CS101",
        color: "#2563EB",
      },
      {
        id: courseId2,
        userId,
        name: "Calculus II",
        code: "MTH201",
        color: "#10B981",
      }
    );
  });

  test("1. Empty week returns baseline data with INCOMPLETE grade and INSUFFICIENT_DATA planning/focus", async () => {
    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });

    assert.strictEqual(review.userId, userId);
    assert.strictEqual(review.metrics.totalClassesScheduled, 0);
    assert.strictEqual(review.metrics.totalFocusMinutes, 0);
    assert.strictEqual(review.metrics.assignmentsCompleted, 0);
    assert.strictEqual(review.scorecard.planning.rating, "INSUFFICIENT_DATA");
    assert.strictEqual(review.scorecard.focus.rating, "INSUFFICIENT_DATA");
    assert.strictEqual(review.scorecard.execution.rating, "ON_TRACK");
    assert.ok(review.recommendations.length >= 1);
  });

  test("2. Execution rating: STRONG when >= 80% deadlines completed", async () => {
    mockState.assignments.push(
      {
        id: "asg-1",
        userId,
        courseId: courseId1,
        title: "Assignment 1",
        dueDate: new Date("2026-09-15T10:00:00.000Z"),
        status: "COMPLETED",
      },
      {
        id: "asg-2",
        userId,
        courseId: courseId1,
        title: "Assignment 2",
        dueDate: new Date("2026-09-16T10:00:00.000Z"),
        status: "SUBMITTED",
      },
      {
        id: "asg-3",
        userId,
        courseId: courseId1,
        title: "Assignment 3",
        dueDate: new Date("2026-09-17T10:00:00.000Z"),
        status: "NOT_STARTED",
      }
    );

    // 2/3 = 66.7% -> ON_TRACK
    let review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.execution.rating, "ON_TRACK");

    // Add 2 more completed assignments (4/5 = 80%) -> STRONG
    mockState.assignments.push(
      {
        id: "asg-4",
        userId,
        courseId: courseId2,
        title: "Assignment 4",
        dueDate: new Date("2026-09-18T10:00:00.000Z"),
        status: "COMPLETED",
      },
      {
        id: "asg-5",
        userId,
        courseId: courseId2,
        title: "Assignment 5",
        dueDate: new Date("2026-09-19T10:00:00.000Z"),
        status: "COMPLETED",
      }
    );

    review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.execution.rating, "STRONG");
    assert.strictEqual(review.metrics.assignmentsCompleted, 4);
    assert.strictEqual(review.metrics.assignmentsDue, 5);
  });

  test("3. Execution rating: NEEDS_ATTENTION when < 50% deadlines completed", async () => {
    mockState.assignments.push(
      {
        id: "asg-1",
        userId,
        courseId: courseId1,
        title: "Assignment 1",
        dueDate: new Date("2026-09-15T10:00:00.000Z"),
        status: "NOT_STARTED",
      },
      {
        id: "asg-2",
        userId,
        courseId: courseId1,
        title: "Assignment 2",
        dueDate: new Date("2026-09-16T10:00:00.000Z"),
        status: "NOT_STARTED",
      },
      {
        id: "asg-3",
        userId,
        courseId: courseId1,
        title: "Assignment 3",
        dueDate: new Date("2026-09-17T10:00:00.000Z"),
        status: "COMPLETED",
      }
    );

    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.execution.rating, "NEEDS_ATTENTION");
  });

  test("4. Planning rating: STRONG when >= 75% study plan items completed", async () => {
    // Add study plan
    mockState.studyPlans.push({
      id: "plan-1",
      userId,
      title: "Week Plan",
      status: "ACTIVE",
    });

    mockState.studyPlanItems.push(
      {
        id: "item-1",
        studyPlanId: "plan-1",
        courseId: courseId1,
        title: "Trees Review",
        duration: 45,
        scheduledAt: new Date("2026-09-15T14:00:00.000Z"),
        status: "COMPLETED",
      },
      {
        id: "item-2",
        studyPlanId: "plan-1",
        courseId: courseId1,
        title: "Graphs Review",
        duration: 45,
        scheduledAt: new Date("2026-09-16T14:00:00.000Z"),
        status: "COMPLETED",
      },
      {
        id: "item-3",
        studyPlanId: "plan-1",
        courseId: courseId1,
        title: "Heap Review",
        duration: 45,
        scheduledAt: new Date("2026-09-17T14:00:00.000Z"),
        status: "COMPLETED",
      },
      {
        id: "item-4",
        studyPlanId: "plan-1",
        courseId: courseId2,
        title: "Integrals Review",
        duration: 45,
        scheduledAt: new Date("2026-09-18T14:00:00.000Z"),
        status: "PENDING",
      }
    );

    // 3/4 = 75% -> STRONG
    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.planning.rating, "STRONG");
    assert.strictEqual(review.metrics.studyPlanItemsCompleted, 3);
    assert.strictEqual(review.metrics.studyPlanItemsTotal, 4);
  });

  test("5. Focus rating: STRONG when total focus minutes >= 300m", async () => {
    mockState.studySessions.push(
      {
        id: "sess-1",
        userId,
        courseId: courseId1,
        duration: 120,
        sessionDate: new Date("2026-09-15T15:00:00.000Z"),
        status: "COMPLETED",
      },
      {
        id: "sess-2",
        userId,
        courseId: courseId2,
        duration: 190,
        sessionDate: new Date("2026-09-16T15:00:00.000Z"),
        status: "COMPLETED",
      }
    );

    // Total = 310m >= 300m -> STRONG
    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.focus.rating, "STRONG");
    assert.strictEqual(review.metrics.totalFocusMinutes, 310);
  });

  test("6. Focus rating: ON_TRACK when 120m-299m, and NEEDS_ATTENTION when < 120m", async () => {
    mockState.studySessions.push({
      id: "sess-1",
      userId,
      courseId: courseId1,
      duration: 60,
      sessionDate: new Date("2026-09-15T15:00:00.000Z"),
      status: "COMPLETED",
    });

    let review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.focus.rating, "NEEDS_ATTENTION");

    mockState.studySessions.push({
      id: "sess-2",
      userId,
      courseId: courseId2,
      duration: 90,
      sessionDate: new Date("2026-09-16T15:00:00.000Z"),
      status: "COMPLETED",
    });

    // Total = 150m -> ON_TRACK
    review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.focus.rating, "ON_TRACK");
  });

  test("7. Academic Health rating reflects attendance percentage thresholds", async () => {
    // 10 total classes, 7 attended = 70% < 75% -> NEEDS_ATTENTION
    mockState.attendance.push({
      id: "att-1",
      userId,
      courseId: courseId1,
      attendedClasses: 7,
      totalClasses: 10,
    });

    let review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.academicHealth.rating, "NEEDS_ATTENTION");
    assert.strictEqual(review.metrics.attendanceRate, 70);

    // Update attendance to 9/10 = 90% >= 85% -> STRONG
    mockState.attendance[0].attendedClasses = 9;
    review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.academicHealth.rating, "STRONG");
    assert.strictEqual(review.metrics.attendanceRate, 90);
  });

  test("8. Overall grade computation: 'A' on 3+ STRONG and 0 NEEDS_ATTENTION", async () => {
    // Attendance 90% (STRONG)
    mockState.attendance.push({
      id: "att-1",
      userId,
      courseId: courseId1,
      attendedClasses: 9,
      totalClasses: 10,
    });

    // Deliverables 100% (STRONG)
    mockState.assignments.push({
      id: "asg-1",
      userId,
      courseId: courseId1,
      title: "Paper",
      dueDate: new Date("2026-09-15T12:00:00.000Z"),
      status: "COMPLETED",
    });

    // Focus 320m (STRONG)
    mockState.studySessions.push({
      id: "sess-1",
      userId,
      courseId: courseId1,
      duration: 320,
      sessionDate: new Date("2026-09-15T14:00:00.000Z"),
      status: "COMPLETED",
    });

    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.scorecard.overallGrade, "A");
  });

  test("9. Course breakdown accurately computes per-course metrics and grades", async () => {
    mockState.attendance.push(
      {
        id: "att-1",
        userId,
        courseId: courseId1,
        attendedClasses: 8,
        totalClasses: 10,
      },
      {
        id: "att-2",
        userId,
        courseId: courseId2,
        attendedClasses: 6,
        totalClasses: 10,
      }
    );

    mockState.courseGrades.push({
      id: "cg-1",
      userId,
      courseId: courseId1,
      grade: "A",
      gradePoints: 4.0,
    });

    mockState.studySessions.push({
      id: "sess-1",
      userId,
      courseId: courseId1,
      duration: 90,
      sessionDate: new Date("2026-09-15T12:00:00.000Z"),
      status: "COMPLETED",
    });

    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    const cs101 = review.courseSummaries.find((c) => c.courseCode === "CS101");
    assert.ok(cs101);
    assert.strictEqual(cs101.attendance.percentage, 80);
    assert.strictEqual(cs101.focusMinutes, 90);
    assert.strictEqual(cs101.grade?.letter, "A");
    assert.strictEqual(cs101.grade?.points, 4.0);

    const mth201 = review.courseSummaries.find((c) => c.courseCode === "MTH201");
    assert.ok(mth201);
    assert.strictEqual(mth201.attendance.percentage, 60);
    assert.strictEqual(mth201.grade, null);
  });

  test("10. Actionable recommendations generated for low attendance course", async () => {
    // MTH201 attendance is 50% (< 75%)
    mockState.attendance.push({
      id: "att-2",
      userId,
      courseId: courseId2,
      attendedClasses: 5,
      totalClasses: 10,
    });

    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    const hasAttendanceRec = review.recommendations.some(
      (r) => r.includes("MTH201") && r.includes("attendance")
    );
    assert.ok(hasAttendanceRec, "Expected recommendation to mention recovering MTH201 attendance");
  });

  test("11. Strict tenant isolation: other user's sessions and deliverables do not leak", async () => {
    mockState.studySessions.push({
      id: "sess-foreign",
      userId: foreignUserId,
      courseId: "course-foreign",
      duration: 600,
      sessionDate: new Date("2026-09-15T14:00:00.000Z"),
      status: "COMPLETED",
    });
    mockState.assignments.push({
      id: "asg-foreign",
      userId: foreignUserId,
      courseId: "course-foreign",
      title: "Foreign Project",
      dueDate: new Date("2026-09-15T12:00:00.000Z"),
      status: "COMPLETED",
    });

    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(review.metrics.totalFocusMinutes, 0);
    assert.strictEqual(review.metrics.assignmentsCompleted, 0);
  });

  test("12. Week offset navigation: weekOffset = -1 computes previous week", async () => {
    // Assignment due in previous week (Sep 10)
    mockState.assignments.push({
      id: "asg-prev",
      userId,
      courseId: courseId1,
      title: "Past Homework",
      dueDate: new Date("2026-09-10T12:00:00.000Z"),
      status: "COMPLETED",
    });

    // Current week (weekOffset = 0) should not include it
    const currentReview = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    assert.strictEqual(currentReview.metrics.assignmentsDue, 0);

    // Previous week (weekOffset = -1) should include it
    const pastReview = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: -1 });
    assert.strictEqual(pastReview.metrics.assignmentsDue, 1);
    assert.strictEqual(pastReview.metrics.assignmentsCompleted, 1);
  });

  test("13. Cancelled and active/paused sessions are strictly excluded from completed focus minutes", async () => {
    // Add completed session (60m)
    mockState.studySessions.push({
      id: "sess-done",
      userId,
      courseId: courseId1,
      duration: 60,
      sessionDate: new Date("2026-09-15T10:00:00.000Z"),
      status: "COMPLETED",
    });

    // Add cancelled session (120m)
    mockState.studySessions.push({
      id: "sess-canc",
      userId,
      courseId: courseId1,
      duration: 120,
      sessionDate: new Date("2026-09-15T12:00:00.000Z"),
      status: "CANCELLED",
    });

    // Add active session (90m)
    mockState.studySessions.push({
      id: "sess-act",
      userId,
      courseId: courseId1,
      duration: 90,
      sessionDate: new Date("2026-09-15T15:00:00.000Z"),
      status: "ACTIVE",
    });

    // Add paused session (45m)
    mockState.studySessions.push({
      id: "sess-pau",
      userId,
      courseId: courseId1,
      duration: 45,
      sessionDate: new Date("2026-09-15T18:00:00.000Z"),
      status: "PAUSED",
    });

    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    // Strictly only 60m should be counted
    assert.strictEqual(review.metrics.totalFocusMinutes, 60);
    assert.strictEqual(review.metrics.totalSessionsCount, 1);
  });

  test("14. Sanitized API response: zero password hashes or secrets in review payload", async () => {
    const review = await getWeeklyReview(userId, { referenceDate: refDate, weekOffset: 0 });
    const raw = JSON.stringify(review);
    assert.strictEqual(raw.includes("passwordHash"), false);
    assert.strictEqual(raw.includes("hash1"), false);
    assert.strictEqual(raw.includes("SESSION_SECRET"), false);
  });

  test("15. Pro tier Gemini synthesis fallback: returns valid deterministic review when AI is disabled", async () => {
    // Pro user with AI fallback
    const review = await getWeeklyReview(proUserId, {
      referenceDate: refDate,
      weekOffset: 0,
      isPro: true,
    });

    assert.ok(review.scorecard);
    assert.ok(review.scorecard.overallGrade);
    assert.ok(review.recommendations.length >= 1);
    assert.strictEqual(typeof review.metrics.attendanceRate, "number");
  });
});
