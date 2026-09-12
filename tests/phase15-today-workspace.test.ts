import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";
import {
  getAdaptiveTodayWorkspace,
  getHeuristicTaskDuration,
} from "../app/lib/today-workspace";
import { getPKTDateParts, getPKTDayBounds } from "../app/lib/timezone";

describe("Milestone 15.1: Adaptive Today Workspace Service Suite", () => {
  const userId = "user-today-1";
  const now = new Date("2026-09-15T05:00:00.000Z"); // Tuesday 10:00 AM PKT
  const pkt = getPKTDateParts(now);

  beforeEach(() => {
    resetMockState();

    // Base user setup
    mockState.users.push({
      id: userId,
      email: "student@uni.edu",
      name: "Talha Student",
      passwordHash: "hash123",
    });

    // Courses
    mockState.courses.push(
      {
        id: "c-cs301",
        userId,
        name: "Data Structures",
        code: "CS301",
        color: "#2563eb",
      },
      {
        id: "c-cs302",
        userId,
        name: "Database Systems",
        code: "CS302",
        color: "#16a34a",
      },
      {
        id: "c-math201",
        userId,
        name: "Linear Algebra",
        code: "MATH201",
        color: "#9333ea",
      }
    );
  });

  test("1. Effort estimation heuristics provide explicit non-factual estimates", () => {
    const high = getHeuristicTaskDuration("HIGH");
    assert.equal(high.minutes, 90);
    assert.equal(high.label, "~90 min estimated");

    const med = getHeuristicTaskDuration("MEDIUM");
    assert.equal(med.minutes, 60);
    assert.equal(med.label, "~60 min estimated");

    const low = getHeuristicTaskDuration("LOW");
    assert.equal(low.minutes, 45);
    assert.equal(low.label, "~45 min estimated");

    // When StudyPlanItem duration is provided, it supersedes the heuristic
    const planned = getHeuristicTaskDuration("HIGH", 75);
    assert.equal(planned.minutes, 75);
    assert.equal(planned.label, "~75 min planned");
  });

  test("2. Overdue assignments receive score 100, OVERDUE tier, and surface in ATTENTION and TODAY", async () => {
    const pastDue = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    mockState.assignments.push({
      id: "asgn-overdue-1",
      userId,
      courseId: "c-cs301",
      title: "Binary Tree Implementation",
      dueDate: pastDue,
      priority: "HIGH",
      status: "NOT_STARTED",
      createdAt: pastDue,
      updatedAt: pastDue,
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    assert.equal(workspace.attention.criticalCount, 1);
    assert.equal(workspace.attention.items[0].id, "asgn-overdue-1");
    assert.equal(workspace.attention.items[0].urgencyTier, "OVERDUE");
    assert.equal(workspace.attention.items[0].urgencyScore, 100);

    // Canonical single actionable presence in today.allocatedTasks
    const todayItem = workspace.today.allocatedTasks.find((t) => t.id === "asgn-overdue-1");
    assert.ok(todayItem);
    assert.equal(todayItem.isAttentionItem, true);
    assert.match(todayItem.reason, /Overdue/);
  });

  test("3. Overdue tasks older than 30 days are never dropped by future query filters", async () => {
    const veryOldPastDue = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // 45 days ago

    mockState.assignments.push({
      id: "asgn-old-overdue",
      userId,
      courseId: "c-cs301",
      title: "Project Proposal",
      dueDate: veryOldPastDue,
      priority: "MEDIUM",
      status: "NOT_STARTED",
      createdAt: veryOldPastDue,
      updatedAt: veryOldPastDue,
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    const found = workspace.today.allocatedTasks.find((t) => t.id === "asgn-old-overdue");
    assert.ok(found, "Old overdue assignment must remain in today's allocated tasks");
    assert.equal(found.urgencyTier, "OVERDUE");
  });

  test("4. Assignments due today (<24h) receive CRITICAL tier and score 65+", async () => {
    const dueToday = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now

    mockState.assignments.push({
      id: "asgn-due-today",
      userId,
      courseId: "c-cs302",
      title: "SQL Joins Lab",
      dueDate: dueToday,
      priority: "MEDIUM",
      status: "NOT_STARTED",
      createdAt: now,
      updatedAt: now,
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    const task = workspace.today.allocatedTasks.find((t) => t.id === "asgn-due-today");
    assert.ok(task);
    assert.equal(task.urgencyTier, "CRITICAL");
    assert.ok(task.urgencyScore >= 65);
    assert.equal(task.isAttentionItem, true);
  });

  test("5. Imminent exam (<48h) with low prep is flagged as critical attention", async () => {
    const examDate = new Date(now.getTime() + 30 * 60 * 60 * 1000); // ~30 hours from now

    mockState.exams.push({
      id: "exam-imminent-1",
      userId,
      courseId: "c-cs301",
      title: "Midterm Exam",
      type: "MIDTERM",
      examDate,
      preparationProgress: 30, // Low prep
      status: "UPCOMING",
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    const examTask = workspace.today.allocatedTasks.find((t) => t.id === "exam-imminent-1");
    assert.ok(examTask);
    assert.equal(examTask.urgencyTier, "CRITICAL");
    assert.equal(examTask.isAttentionItem, true);
    assert.match(examTask.reason, /imminent/i);
  });

  test("6. Attendance below 75% threshold produces explainable attendanceWarning", async () => {
    mockState.attendance.push({
      id: "att-1",
      userId,
      courseId: "c-cs301",
      totalClasses: 10,
      attendedClasses: 6, // 60% < 75%
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    assert.ok(workspace.attention.attendanceWarning);
    assert.equal(workspace.attention.attendanceWarning.courseCode, "CS301");
    assert.equal(workspace.attention.attendanceWarning.percentageString, "60%");
    assert.ok(workspace.attention.attendanceWarning.recoveryClassesRequired > 0);
  });

  test("7. Timetable classes and study gaps >= 45m are merged into a chronological timeline", async () => {
    // Tuesday classes
    mockState.timetable.push(
      {
        id: "tt-1",
        userId,
        courseId: "c-cs301",
        dayOfWeek: pkt.dayOfWeek,
        startTime: "09:00",
        endTime: "10:30",
        room: "Room 101",
        type: "Lecture",
      },
      {
        id: "tt-2",
        userId,
        courseId: "c-cs302",
        dayOfWeek: pkt.dayOfWeek,
        startTime: "12:00",
        endTime: "13:30",
        room: "Lab 2",
        type: "Lab",
      }
    );

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    const schedule = workspace.today.schedule;
    assert.ok(schedule.length >= 3); // 2 classes + gaps (08:00-09:00, 10:30-12:00, 13:30-20:00)

    // Gap between 10:30 and 12:00 (90 min gap)
    const midGap = schedule.find((s) => s.type === "STUDY_GAP" && s.startTime === "10:30" && s.endTime === "12:00");
    assert.ok(midGap);
    assert.equal(midGap.durationMinutes, 90);
  });

  test("8. Capacity model allocates realistic tasks to TODAY and defers overflow to NEXT", async () => {
    // Single class from 09:00 to 18:00, leaving very small study gap
    mockState.timetable.push({
      id: "tt-full",
      userId,
      courseId: "c-cs301",
      dayOfWeek: pkt.dayOfWeek,
      startTime: "09:00",
      endTime: "18:30",
      room: "Hall A",
      type: "Seminar",
    });

    // 4 tasks: 2 due today/tomorrow, 2 due in 3 days
    mockState.assignments.push(
      {
        id: "asgn-must-1",
        userId,
        courseId: "c-cs301",
        title: "Urgent Task 1",
        dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Due today
        priority: "HIGH", // ~90 min
        status: "NOT_STARTED",
      },
      {
        id: "asgn-defer-1",
        userId,
        courseId: "c-cs302",
        title: "Upcoming Task 2",
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // In 3 days
        priority: "HIGH", // ~90 min
        status: "NOT_STARTED",
      },
      {
        id: "asgn-defer-2",
        userId,
        courseId: "c-math201",
        title: "Upcoming Task 3",
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // In 4 days
        priority: "MEDIUM", // ~60 min
        status: "NOT_STARTED",
      }
    );

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    // Urgent task must be in today
    assert.ok(workspace.today.allocatedTasks.some((t) => t.id === "asgn-must-1"));

    // Over-capacity tasks due in 3-4 days should be deferred to NEXT
    assert.ok(workspace.next.some((t) => t.id === "asgn-defer-1"));
    assert.ok(workspace.next.some((t) => t.id === "asgn-defer-2"));
  });

  test("9. Completed tasks appear in completedToday and are strictly NOT in LATER", async () => {
    const { start: dayStart } = getPKTDayBounds(now);
    const completedAt = new Date(dayStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours after midnight PKT

    mockState.assignments.push({
      id: "asgn-done-today",
      userId,
      courseId: "c-cs301",
      title: "Completed Essay",
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      priority: "LOW",
      status: "COMPLETED",
      createdAt: dayStart,
      updatedAt: completedAt,
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    assert.equal(workspace.completedToday.count, 1);
    assert.equal(workspace.completedToday.items[0].id, "asgn-done-today");

    // Must NOT be in later or today's active tasks
    assert.ok(!workspace.later.some((t) => t.id === "asgn-done-today"));
    assert.ok(!workspace.today.allocatedTasks.some((t) => t.id === "asgn-done-today"));
  });

  test("10. Brand new student receives honest onboarding empty states without fabricated metrics", async () => {
    const freshUserId = "user-fresh";
    mockState.users.push({
      id: freshUserId,
      email: "new@uni.edu",
      name: "Fresh Student",
    });

    const workspace = await getAdaptiveTodayWorkspace(freshUserId, now);

    assert.equal(workspace.emptyState.isNewStudent, true);
    assert.deepEqual(workspace.emptyState.missingSections, [
      "COURSES",
      "TIMETABLE",
      "ASSIGNMENTS",
      "EXAMS",
    ]);
    assert.equal(workspace.today.allocatedTasks.length, 0);
    assert.equal(workspace.attention.criticalCount, 0);
  });

  test("11. Day with no classes does NOT claim student should study all day", async () => {
    // 0 timetable classes for today
    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    assert.equal(workspace.emptyState.hasNoClassesToday, true);
    assert.match(workspace.capacity.notice, /open study time/i);
    assert.ok(!workspace.capacity.notice.includes("study all day"));
  });

  test("12. Google Calendar integration status is sanitized without leaking secrets or tokens", async () => {
    mockState.userIntegrations.push({
      id: "integ-1",
      userId,
      provider: "GOOGLE_CALENDAR",
      status: "CONNECTED",
      encryptedAccessToken: "v1:sensitive_cipher",
      encryptedRefreshToken: "v1:sensitive_refresh",
      syncLockToken: "secret_lock_token",
      externalAccountEmail: "student@gmail.com",
      lastSyncAt: new Date("2026-09-15T04:30:00.000Z"),
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    assert.equal(workspace.calendarSync.status, "CONNECTED");
    assert.equal(workspace.calendarSync.accountEmail, "student@gmail.com");
    assert.ok(workspace.calendarSync.lastSyncAt);

    // Verify raw secrets are NOT on workspace
    assert.equal((workspace as any).encryptedAccessToken, undefined);
    assert.equal((workspace as any).syncLockToken, undefined);
    assert.equal((workspace.calendarSync as any).encryptedAccessToken, undefined);
  });

  test("13. Tenant isolation: User A cannot see User B's assignments or timetable", async () => {
    const user2Id = "user-other-2";
    mockState.users.push({
      id: user2Id,
      email: "other@uni.edu",
      name: "Other",
    });

    mockState.courses.push({
      id: "c-other",
      userId: user2Id,
      name: "Secret Course",
      code: "SEC999",
      color: "#000",
    });

    mockState.assignments.push({
      id: "asgn-other",
      userId: user2Id,
      courseId: "c-other",
      title: "Secret Assignment",
      dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      priority: "HIGH",
      status: "NOT_STARTED",
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    assert.ok(!workspace.today.allocatedTasks.some((t) => t.id === "asgn-other"));
    assert.ok(!workspace.next.some((t) => t.id === "asgn-other"));
    assert.ok(!workspace.attention.items.some((t) => t.id === "asgn-other"));
  });

  test("14. Deterministic output: Multiple calls with same data return identical results", async () => {
    const run1 = await getAdaptiveTodayWorkspace(userId, now);
    const run2 = await getAdaptiveTodayWorkspace(userId, now);

    assert.deepEqual(run1.capacity, run2.capacity);
    assert.deepEqual(run1.attention, run2.attention);
    assert.deepEqual(run1.today, run2.today);
    assert.deepEqual(run1.next, run2.next);
  });

  test("15. Cumulative focus reconciliation: estimatedMinutes is reduced by already-logged assignment focus", async () => {
    const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Due in 2 hours

    mockState.assignments.push({
      id: "asgn-focus-reconcile",
      userId,
      courseId: "c-cs301",
      title: "Focus Reconcile Assignment",
      dueDate,
      priority: "HIGH", // heuristic = 90 min
      status: "IN_PROGRESS",
      createdAt: now,
      updatedAt: now,
    });

    // Simulate 45 minutes of logged focus sessions for this assignment
    mockState.studySessions.push({
      id: "sess-focus-1",
      userId,
      courseId: "c-cs301",
      targetType: "ASSIGNMENT",
      targetId: "asgn-focus-reconcile",
      title: "Focus Block 1",
      duration: 25,
      completed: true,
      status: "COMPLETED",
      sessionDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      source: "FOCUS_SESSION",
      plannedDuration: 25,
      pausedAt: null,
      totalPausedSeconds: 0,
      createdAt: now,
      updatedAt: now,
    });
    mockState.studySessions.push({
      id: "sess-focus-2",
      userId,
      courseId: "c-cs301",
      targetType: "ASSIGNMENT",
      targetId: "asgn-focus-reconcile",
      title: "Focus Block 2",
      duration: 20,
      completed: true,
      status: "COMPLETED",
      sessionDate: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      source: "FOCUS_SESSION",
      plannedDuration: 25,
      pausedAt: null,
      totalPausedSeconds: 0,
      createdAt: now,
      updatedAt: now,
    });

    const workspace = await getAdaptiveTodayWorkspace(userId, now);

    const item = workspace.today.allocatedTasks.find((t) => t.id === "asgn-focus-reconcile");
    assert.ok(item, "Assignment must appear in today's tasks");

    // Heuristic was 90m, 45m logged -> residual should be 45m
    assert.strictEqual(item.estimatedMinutes, 45);
    assert.match(item.estimatedLabel, /45 min remaining/);
    assert.match(item.estimatedLabel, /45 min logged/);
  });

  test("16. Cumulative focus reconciliation: multi-session 90m -> 25m+25m+20m=70m logged -> 20m remaining", async () => {
    const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    mockState.assignments.push({
      id: "asgn-multi-session",
      userId,
      courseId: "c-cs301",
      title: "Multi-Session Reconcile Assignment",
      dueDate,
      priority: "HIGH", // heuristic = 90 min
      status: "IN_PROGRESS",
      createdAt: now,
      updatedAt: now,
    });

    // 3 completed sessions: 25 + 25 + 20 = 70 min
    mockState.studySessions.push(
      {
        id: "sess-multi-1",
        userId,
        courseId: "c-cs301",
        targetType: "ASSIGNMENT",
        targetId: "asgn-multi-session",
        title: "Focus 1",
        duration: 25,
        completed: true,
        status: "COMPLETED",
        sessionDate: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        source: "FOCUS_SESSION",
        plannedDuration: 25,
        pausedAt: null,
        totalPausedSeconds: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "sess-multi-2",
        userId,
        courseId: "c-cs301",
        targetType: "ASSIGNMENT",
        targetId: "asgn-multi-session",
        title: "Focus 2",
        duration: 25,
        completed: true,
        status: "COMPLETED",
        sessionDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        source: "FOCUS_SESSION",
        plannedDuration: 25,
        pausedAt: null,
        totalPausedSeconds: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "sess-multi-3",
        userId,
        courseId: "c-cs301",
        targetType: "ASSIGNMENT",
        targetId: "asgn-multi-session",
        title: "Focus 3",
        duration: 20,
        completed: true,
        status: "COMPLETED",
        sessionDate: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        source: "FOCUS_SESSION",
        plannedDuration: 25,
        pausedAt: null,
        totalPausedSeconds: 0,
        createdAt: now,
        updatedAt: now,
      }
    );

    const workspace = await getAdaptiveTodayWorkspace(userId, now);
    const item = workspace.today.allocatedTasks.find((t) => t.id === "asgn-multi-session");
    assert.ok(item, "Assignment must appear in today's tasks");

    // 90m base - 70m logged = 20m residual
    assert.strictEqual(item.estimatedMinutes, 20);
    assert.strictEqual(item.estimatedLabel, "~20 min remaining (70 min logged)");
  });
});
