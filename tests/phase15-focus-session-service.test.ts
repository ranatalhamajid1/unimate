import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";

import {
  calculateElapsedSeconds,
  calculateAuthoritativeMinutes,
  FOCUS_SESSION_STATUS,
  FOCUS_TARGET_TYPES,
  FOCUS_SESSION_VALIDATION,
} from "../app/lib/study-session-definitions";

import {
  startFocusSessionRecord,
  getActiveFocusSessionRecord,
  pauseFocusSessionRecord,
  resumeFocusSessionRecord,
  completeFocusSessionRecord,
  cancelFocusSessionRecord,
  ActiveSessionConflictError,
  getWeeklyStudyTotal,
} from "../app/lib/study-sessions";

describe("Milestone 15.2: Focus Session Domain & State Machine", () => {
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
      name: "Data Structures",
      code: "CS301",
      color: "#2563eb",
    });

    mockState.assignments.push({
      id: "asgn1",
      userId: "u1",
      courseId: "c1",
      title: "AVL Tree Assignment",
      status: "IN_PROGRESS",
      dueDate: new Date(Date.now() + 86400000),
      priority: "HIGH",
    });
  });

  // 1. calculateElapsedSeconds accurately excludes accumulated paused time
  test("1. calculateElapsedSeconds accurately excludes accumulated paused time", () => {
    const start = new Date("2026-09-12T10:00:00.000Z");
    const now = new Date("2026-09-12T10:30:00.000Z"); // 30 minutes later (1800s)
    const totalPaused = 300; // 5 minutes paused

    const elapsed = calculateElapsedSeconds({
      sessionDate: start,
      pausedAt: null,
      totalPausedSeconds: totalPaused,
      serverNow: now,
    });

    assert.strictEqual(elapsed, 1500); // 1800 - 300 = 1500s (25 min)
  });

  // 2. calculateElapsedSeconds freezes while session is in PAUSED state
  test("2. calculateElapsedSeconds freezes while session is in PAUSED state", () => {
    const start = new Date("2026-09-12T10:00:00.000Z");
    const pausedAt = new Date("2026-09-12T10:20:00.000Z"); // paused after 20m (1200s)
    const later = new Date("2026-09-12T10:50:00.000Z"); // 30m after pause
    const totalPaused = 120; // 2 minutes previous pause

    const elapsed = calculateElapsedSeconds({
      sessionDate: start,
      pausedAt,
      totalPausedSeconds: totalPaused,
      serverNow: later,
    });

    // Should freeze at pause moment: 1200s - 120s = 1080s (18 min)
    assert.strictEqual(elapsed, 1080);
  });

  // 3. calculateAuthoritativeMinutes rounds and clamps appropriately
  test("3. calculateAuthoritativeMinutes rounds and clamps appropriately", () => {
    assert.strictEqual(
      calculateAuthoritativeMinutes({ elapsedSeconds: 2520, plannedDurationMinutes: 50 }),
      42 // 2520 / 60 = 42 min
    );

    // 0 seconds active -> 0 min
    assert.strictEqual(
      calculateAuthoritativeMinutes({ elapsedSeconds: 0, plannedDurationMinutes: 50 }),
      0
    );

    // 30 seconds active -> 1 min (minimum non-zero credit)
    assert.strictEqual(
      calculateAuthoritativeMinutes({ elapsedSeconds: 30, plannedDurationMinutes: 50 }),
      1
    );
  });

  // 4. Clamping logic: any session running beyond 6 hours is capped at 360 minutes
  test("4. Clamping logic: any session running beyond 6 hours is capped at 360 minutes", () => {
    // 10 hours elapsed (36000 seconds) on a 50m planned session
    const clamped = calculateAuthoritativeMinutes({
      elapsedSeconds: 36000,
      plannedDurationMinutes: 50,
    });

    // Flat 360-minute absolute hard ceiling, regardless of planned duration
    assert.strictEqual(clamped, 360);
  });

  // 5. Absolute hard ceiling of 360 minutes (6 hours) applies regardless of planned duration
  test("5. Absolute hard ceiling of 360 minutes applies regardless of planned duration", () => {
    // 180m planned session left running for 24 hours
    const clamped = calculateAuthoritativeMinutes({
      elapsedSeconds: 86400,
      plannedDurationMinutes: 180,
    });

    // Flat 360-minute cap — not planned+30m formula
    assert.strictEqual(clamped, 360);
  });

  // 6. Planned presets validation rejects < 5m or > 180m custom inputs
  test("6. Planned presets validation rejects < 5m or > 180m custom inputs", async () => {
    await assert.rejects(
      async () => {
        await startFocusSessionRecord("u1", {
          title: "Invalid sprint",
          plannedMinutes: 2,
        });
      },
      { message: /between 5 and 180 minutes/ }
    );

    await assert.rejects(
      async () => {
        await startFocusSessionRecord("u1", {
          title: "Invalid marathon",
          plannedMinutes: 240,
        });
      },
      { message: /between 5 and 180 minutes/ }
    );
  });

  // 7. Valid full lifecycle: ACTIVE -> PAUSED -> ACTIVE -> COMPLETED
  test("7. Valid full lifecycle: ACTIVE -> PAUSED -> ACTIVE -> COMPLETED", async () => {
    // Start at T0
    const t0 = new Date("2026-09-12T10:00:00.000Z");
    const session = await startFocusSessionRecord("u1", {
      title: "Binary Search Trees",
      courseId: "c1",
      plannedMinutes: 50,
      targetType: "ASSIGNMENT",
      targetId: "asgn1",
      now: t0,
    } as any);

    assert.strictEqual(session.status, "ACTIVE");
    assert.strictEqual(session.duration, 0);

    // Pause at T0 + 15m
    const t1 = new Date("2026-09-12T10:15:00.000Z");
    const paused = await pauseFocusSessionRecord("u1", session.id, t1);
    assert.strictEqual(paused.status, "PAUSED");
    assert.ok(paused.pausedAt);

    // Resume at T0 + 20m (5m pause)
    const t2 = new Date("2026-09-12T10:20:00.000Z");
    const resumed = await resumeFocusSessionRecord("u1", session.id, t2);
    assert.strictEqual(resumed.status, "ACTIVE");
    assert.strictEqual(resumed.pausedAt, null);
    assert.strictEqual(resumed.totalPausedSeconds, 300); // 5 min = 300s

    // Complete at T0 + 55m (Total time 55m - 5m paused = 50m active)
    const t3 = new Date("2026-09-12T10:55:00.000Z");
    const completed = await completeFocusSessionRecord("u1", session.id, {
      markTargetComplete: true,
      now: t3,
    });

    assert.strictEqual(completed.actualMinutes, 50);
    assert.strictEqual(completed.session.completed, true);
    assert.strictEqual((completed.session as any).status, "COMPLETED");
    assert.strictEqual(completed.targetMarkedComplete, true);

    // Verify assignment was marked completed
    const asgn = mockState.assignments.find((a: any) => a.id === "asgn1");
    assert.strictEqual(asgn.status, "COMPLETED");
  });

  // 8. Invalid transition: cannot PAUSE an already PAUSED session (idempotent safe)
  test("8. Invalid transition: cannot PAUSE an already PAUSED session (idempotent)", async () => {
    const session = await startFocusSessionRecord("u1", {
      title: "Study",
      plannedMinutes: 25,
    });

    const p1 = await pauseFocusSessionRecord("u1", session.id);
    assert.strictEqual(p1.status, "PAUSED");

    // Second pause should return current paused state without corrupting pausedAt
    const p2 = await pauseFocusSessionRecord("u1", session.id);
    assert.strictEqual(p2.status, "PAUSED");
  });

  // 9. Invalid transition: cannot RESUME an already ACTIVE session (idempotent safe)
  test("9. Invalid transition: cannot RESUME an already ACTIVE session (idempotent)", async () => {
    const session = await startFocusSessionRecord("u1", {
      title: "Study",
      plannedMinutes: 25,
    });

    // Resume when already active
    const r = await resumeFocusSessionRecord("u1", session.id);
    assert.strictEqual(r.status, "ACTIVE");
  });

  // 10. Cancellation: < 1 min deletes row completely (accidental start)
  test("10. Cancellation: < 1 min deletes row completely (accidental start)", async () => {
    const t0 = new Date("2026-09-12T10:00:00.000Z");
    const session = await startFocusSessionRecord("u1", {
      title: "Accidental Click",
      plannedMinutes: 50,
      now: t0,
    } as any);

    // Cancel after 20 seconds
    const t1 = new Date("2026-09-12T10:00:20.000Z");
    const result = await cancelFocusSessionRecord("u1", session.id, t1);

    assert.strictEqual(result.action, "DISCARDED");
    assert.strictEqual(mockState.studySessions.length, 0);
  });

  // 11. Cancellation: >= 1 min marks CANCELLED and preserves partial minutes
  test("11. Cancellation: >= 1 min marks CANCELLED and preserves partial minutes", async () => {
    const t0 = new Date("2026-09-12T10:00:00.000Z");
    const session = await startFocusSessionRecord("u1", {
      title: "Partial Study",
      plannedMinutes: 50,
      now: t0,
    } as any);

    // Cancel after 25 minutes
    const t1 = new Date("2026-09-12T10:25:00.000Z");
    const result = await cancelFocusSessionRecord("u1", session.id, t1);

    assert.strictEqual(result.action, "RECORDED_PARTIAL");
    assert.strictEqual(result.actualMinutes, 25);

    const cancelledSess = mockState.studySessions.find((s: any) => s.id === session.id);
    assert.strictEqual(cancelledSess.status, "CANCELLED");
    assert.strictEqual(cancelledSess.completed, false); // Excluded from completed study stats
    assert.strictEqual(cancelledSess.duration, 25);
  });

  // 12. Task completion: markTargetComplete=false preserves underlying task status
  test("12. Task completion: markTargetComplete=false preserves underlying task status", async () => {
    const session = await startFocusSessionRecord("u1", {
      title: "Work on AVL",
      plannedMinutes: 50,
      targetType: "ASSIGNMENT",
      targetId: "asgn1",
    });

    const completed = await completeFocusSessionRecord("u1", session.id, {
      markTargetComplete: false,
    });

    assert.strictEqual(completed.targetMarkedComplete, false);
    const asgn = mockState.assignments.find((a: any) => a.id === "asgn1");
    assert.strictEqual(asgn.status, "IN_PROGRESS"); // Not completed
  });

  // 13. Single active session concurrency: second start throws ActiveSessionConflictError
  test("13. Single active session concurrency: second start throws ActiveSessionConflictError", async () => {
    await startFocusSessionRecord("u1", {
      title: "Session 1",
      plannedMinutes: 50,
    });

    await assert.rejects(
      async () => {
        await startFocusSessionRecord("u1", {
          title: "Session 2",
          plannedMinutes: 25,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ActiveSessionConflictError);
        assert.ok(err.activeSession);
        return true;
      }
    );
  });

  // 14. Completed session immediately updates getWeeklyStudyTotal
  test("14. Completed session immediately updates getWeeklyStudyTotal", async () => {
    const session = await startFocusSessionRecord("u1", {
      title: "Algorithms Review",
      courseId: "c1",
      plannedMinutes: 50,
    });

    const tComplete = new Date(Date.now() + 50 * 60 * 1000);
    await completeFocusSessionRecord("u1", session.id, { now: tComplete });

    const total = await getWeeklyStudyTotal("u1");
    assert.strictEqual(total.minutes, 50);
  });

  // 15. Cancelled session does NOT inflate completed weekly study total
  test("15. Cancelled session does NOT inflate completed weekly study total", async () => {
    const session = await startFocusSessionRecord("u1", {
      title: "Interrupted Study",
      plannedMinutes: 50,
    });

    const tCancel = new Date(Date.now() + 20 * 60 * 1000);
    await cancelFocusSessionRecord("u1", session.id, tCancel);

    const total = await getWeeklyStudyTotal("u1");
    assert.strictEqual(total.minutes, 0); // Still 0
  });

  // 16. Cross-user session modification is strictly rejected
  test("16. Cross-user session modification is strictly rejected", async () => {
    const session = await startFocusSessionRecord("u1", {
      title: "User 1 Private Focus",
      plannedMinutes: 50,
    });

    await assert.rejects(
      async () => {
        await pauseFocusSessionRecord("u2", session.id);
      },
      { message: "Focus session not found or unauthorized." }
    );

    await assert.rejects(
      async () => {
        await completeFocusSessionRecord("u2", session.id);
      },
      { message: "Focus session not found or unauthorized." }
    );
  });

  // 17. Linking to another user's course or assignment is rejected
  test("17. Linking to another user's course or assignment is rejected", async () => {
    // User 2 owns course c2
    mockState.courses.push({
      id: "c2",
      userId: "u2",
      name: "Secret Course",
      code: "SEC101",
    });

    await assert.rejects(
      async () => {
        await startFocusSessionRecord("u1", {
          title: "Hacked Course Link",
          courseId: "c2",
          plannedMinutes: 50,
        });
      },
      { message: "Course not found or unauthorized." }
    );
  });

  // 18. COURSE_STUDY targetType rejects another user's course as targetId
  test("18. COURSE_STUDY targetId must be an owned course (cross-user rejected)", async () => {
    // User 2 owns course c2
    mockState.courses.push({
      id: "c2",
      userId: "u2",
      name: "Another Secret Course",
      code: "SEC102",
    });

    await assert.rejects(
      async () => {
        await startFocusSessionRecord("u1", {
          title: "Hacking COURSE_STUDY link",
          plannedMinutes: 50,
          targetType: "COURSE_STUDY",
          targetId: "c2", // Belongs to u2
        });
      },
      { message: "Linked course not found or unauthorized." }
    );
  });

  // 19. A paused session can be completed directly (ACTIVE or PAUSED are both valid completion states)
  test("19. A paused session can be completed directly without resuming first", async () => {
    const t0 = new Date("2026-09-12T10:00:00.000Z");
    const session = await startFocusSessionRecord("u1", {
      title: "Pause-then-Complete",
      plannedMinutes: 50,
      now: t0,
    } as any);

    // Pause at T0 + 20m
    const t1 = new Date("2026-09-12T10:20:00.000Z");
    await pauseFocusSessionRecord("u1", session.id, t1);

    // Complete directly from PAUSED state at T0 + 25m
    const t2 = new Date("2026-09-12T10:25:00.000Z");
    const result = await completeFocusSessionRecord("u1", session.id, { now: t2 });

    // Elapsed = 20m active (session was paused at 20m, completion time is irrelevant for frozen clock)
    assert.strictEqual(result.session.completed, true);
    assert.strictEqual((result.session as any).status, "COMPLETED");
    assert.ok(result.actualMinutes >= 20 && result.actualMinutes <= 21);
  });

  // 20. Cannot complete a CANCELLED session (strict status guard)
  test("20. Cannot complete an already-cancelled session (strict status guard)", async () => {
    const t0 = new Date("2026-09-12T10:00:00.000Z");
    const session = await startFocusSessionRecord("u1", {
      title: "Cancel Me",
      plannedMinutes: 50,
      now: t0,
    } as any);

    // Cancel after 5 minutes
    const t1 = new Date("2026-09-12T10:05:00.000Z");
    await cancelFocusSessionRecord("u1", session.id, t1);

    // Now try to complete
    await assert.rejects(
      async () => {
        await completeFocusSessionRecord("u1", session.id, { now: new Date("2026-09-12T10:10:00.000Z") });
      },
      { message: /Cannot complete a session with status CANCELLED/ }
    );
  });

  // 21. EXAM targetType rejects another user's exam as targetId
  test("21. EXAM targetId must be an owned exam (cross-user rejected)", async () => {
    // User 2 owns exam e2
    mockState.exams.push({
      id: "e2",
      userId: "u2",
      courseId: "c2",
      title: "Midterm Exam",
      examDate: new Date(Date.now() + 86400000 * 7),
      status: "UPCOMING",
    });

    await assert.rejects(
      async () => {
        await startFocusSessionRecord("u1", {
          title: "Hacking EXAM link",
          plannedMinutes: 50,
          targetType: "EXAM",
          targetId: "e2", // Belongs to u2
        });
      },
      { message: "Linked exam not found or unauthorized." }
    );
  });

  // 22. State transition race safety: atomic conditional-write mechanism test
  test("22. State transition race safety: atomic conditional-write mechanism test", async () => {
    const t0 = new Date("2026-09-12T10:00:00.000Z");
    const session = await startFocusSessionRecord("u1", {
      title: "Concurrent Transition Test",
      plannedMinutes: 50,
      now: t0,
    } as any);

    // Concurrently trigger two pause requests via Promise.all
    // NOTE: This verifies the atomic conditional-write mechanism (updateMany where status=ACTIVE).
    // It does not prove wall-clock PostgreSQL concurrency in this in-memory test environment.
    const t1 = new Date("2026-09-12T10:15:00.000Z");
    const [p1, p2] = await Promise.all([
      pauseFocusSessionRecord("u1", session.id, t1),
      pauseFocusSessionRecord("u1", session.id, t1),
    ]);

    // Both return valid PAUSED state without error or corruption (first won write, second idempotent)
    assert.strictEqual(p1.status, "PAUSED");
    assert.strictEqual(p2.status, "PAUSED");
    assert.strictEqual(p1.id, p2.id);

    // Concurrently trigger complete and cancel via Promise.allSettled
    const t2 = new Date("2026-09-12T10:30:00.000Z");
    const results = await Promise.allSettled([
      completeFocusSessionRecord("u1", session.id, { now: t2 }),
      cancelFocusSessionRecord("u1", session.id, t2),
    ]);

    // Exactly one operation must succeed to a valid terminal state, avoiding split-brain
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    assert.strictEqual(fulfilled.length, 1, "Exactly one terminal transition must win");
    assert.strictEqual(rejected.length, 1, "The losing transition must be rejected");

    // Verify the record in DB has a consistent terminal state
    const current = mockState.studySessions.find((s: any) => s.id === session.id);
    assert.ok(
      current?.status === "COMPLETED" || current?.status === "CANCELLED",
      "Terminal state must be strictly either COMPLETED or CANCELLED"
    );
  });
});
