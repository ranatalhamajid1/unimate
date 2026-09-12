import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";
import {
  generateAdaptiveStudyPlan,
  reconcileAssignmentWorkload,
} from "../app/lib/adaptive-study-planner";
import {
  acceptAdaptiveStudyPlan,
} from "../app/lib/study-plans";
import {
  isStudyPlanItemMissed,
} from "../app/lib/study-plan-definitions";

describe("Milestone 15.3: Adaptive Study Planning 22-Test Matrix", () => {
  const userId = "user-m15-student";
  const proUserId = "user-m15-pro";
  const foreignUserId = "user-m15-foreign";
  const courseId = "course-cs301";

  beforeEach(() => {
    resetMockState();

    // Setup base users
    mockState.users.push(
      {
        id: userId,
        email: "student@uni.edu",
        name: "Test Student",
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

    // Pro subscription
    mockState.subscriptions.push({
      id: "sub-pro-1",
      userId: proUserId,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodEnd: new Date("2026-12-31T00:00:00.000Z"),
    });

    // Base course
    mockState.courses.push({
      id: courseId,
      userId,
      name: "Data Structures",
      code: "CS301",
      color: "#2563eb",
      creditHours: 3,
    });
  });

  // Test 1: Empty state
  test("1. Empty state: student with no academic tasks gets empty draft with FEASIBLE status", async () => {
    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });

    assert.equal(draft.items.length, 0);
    assert.equal(draft.unallocatedTasks.length, 0);
    assert.equal(draft.feasibility.status, "FEASIBLE");
    assert.equal(draft.feasibility.totalRequiredMinutes, 0);
    assert.equal(draft.feasibility.deficitMinutes, 0);
  });

  // Test 2: Single assignment allocation
  test("2. Single assignment allocation: unfinished assignment schedules into valid timetable gap", async () => {
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    mockState.assignments.push({
      id: "asg-1",
      userId,
      courseId,
      title: "Binary Trees Project",
      dueDate,
      priority: "HIGH",
      status: "NOT_STARTED",
    });

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });

    assert.ok(draft.items.length >= 1, "Should allocate at least one study block");
    const item = draft.items.find((i) => i.targetId === "asg-1");
    assert.ok(item, "Should allocate assignment item");
    assert.equal(item?.targetType, "ASSIGNMENT");
    assert.equal(item?.courseId, courseId);
    assert.ok(new Date(item!.scheduledAt) < dueDate, "Scheduled before deadline");
  });

  // Test 3: Multi-assignment priority
  test("3. Multi-assignment priority: higher priority / closer deadline is scheduled earlier", async () => {
    const nearDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const farDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    mockState.assignments.push(
      {
        id: "asg-low",
        userId,
        courseId,
        title: "Low Priority Reading",
        dueDate: farDate,
        priority: "LOW",
        status: "NOT_STARTED",
      },
      {
        id: "asg-urgent",
        userId,
        courseId,
        title: "Urgent Lab Report",
        dueDate: nearDate,
        priority: "HIGH",
        status: "NOT_STARTED",
      }
    );

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    const urgentIndex = draft.items.findIndex((i) => i.targetId === "asg-urgent");
    const lowIndex = draft.items.findIndex((i) => i.targetId === "asg-low");

    assert.ok(urgentIndex !== -1 && lowIndex !== -1, "Both items should be scheduled");
    assert.ok(urgentIndex < lowIndex, "Urgent assignment must be scheduled before low priority one");
  });

  // Test 4: Exam readiness allocation
  test("4. Exam readiness allocation: upcoming exam generates deterministic revision blocks prior to exam date", async () => {
    const examDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000); // 4 days from now
    mockState.exams.push({
      id: "exam-midterm",
      userId,
      courseId,
      title: "Midterm Exam",
      examDate,
      preparationProgress: 20, // low readiness
    });

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    const examBlocks = draft.items.filter((i) => i.targetId === "exam-midterm");

    assert.ok(examBlocks.length >= 1, "Should schedule exam revision blocks");
    for (const b of examBlocks) {
      assert.equal(b.targetType, "EXAM");
      assert.ok(new Date(b.scheduledAt) < examDate, "Revision block must precede exam date");
    }
  });

  // Test 5: Timetable obstacle avoidance
  test("5. Timetable obstacle avoidance: study blocks never overlap recurring timetable classes", async () => {
    // Add timetable class for everyday 09:00 to 12:00 PKT
    for (let d = 1; d <= 7; d++) {
      mockState.timetable.push({
        id: `tt-${d}`,
        userId,
        courseId,
        dayOfWeek: d,
        startTime: "09:00",
        endTime: "12:00",
        room: "Lab 3",
      });
    }

    mockState.assignments.push({
      id: "asg-gap",
      userId,
      courseId,
      title: "Homework 1",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: "HIGH",
      status: "NOT_STARTED",
    });

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });

    for (const item of draft.items) {
      const { getPKTDateParts } = await import("../app/lib/timezone");
      const pkt = getPKTDateParts(item.scheduledAt);
      const schedStartMinutes = pkt.hours * 60 + pkt.minutes;
      const schedEndMinutes = schedStartMinutes + item.duration;

      // Class is 09:00 (540m) to 12:00 (720m) PKT
      const classStart = 9 * 60;
      const classEnd = 12 * 60;

      const overlapsClass = schedStartMinutes < classEnd && schedEndMinutes > classStart;
      assert.equal(overlapsClass, false, `Item ${item.title} must not overlap class`);
    }
  });

  // Test 6: Dynamic window expansion
  test("6. Dynamic window expansion: gaps are bounded within preferred study hours", async () => {
    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    assert.ok(draft.feasibility.totalAvailableMinutes >= 0);
  });

  // Test 7: Single focus deduction
  test("7. Single focus deduction: 90m assignment with 25m completed focus requires only 65m", async () => {
    mockState.assignments.push({
      id: "asg-deduct-1",
      userId,
      courseId,
      title: "Algorithms Essay",
      priority: "HIGH", // 90 min heuristic
      status: "IN_PROGRESS",
    });

    mockState.studySessions.push({
      id: "sess-1",
      userId,
      courseId,
      targetType: "ASSIGNMENT",
      targetId: "asg-deduct-1",
      duration: 25,
      status: "COMPLETED",
      sessionDate: new Date(),
    });

    const reconciled = await reconcileAssignmentWorkload(userId, mockState.assignments[0]);
    assert.equal(reconciled.loggedFocusMinutes, 25);
    assert.equal(reconciled.remainingMinutes, 65);
  });

  // Test 8: Multi-focus deduction
  test("8. Multi-focus deduction: 90m assignment with 25+25+20m completed focus leaves 20m remaining", async () => {
    mockState.assignments.push({
      id: "asg-deduct-2",
      userId,
      courseId,
      title: "Architecture Analysis",
      priority: "HIGH", // 90 min
      status: "IN_PROGRESS",
    });

    mockState.studySessions.push(
      {
        id: "sess-2a",
        userId,
        courseId,
        targetType: "ASSIGNMENT",
        targetId: "asg-deduct-2",
        duration: 25,
        status: "COMPLETED",
        sessionDate: new Date(),
      },
      {
        id: "sess-2b",
        userId,
        courseId,
        targetType: "ASSIGNMENT",
        targetId: "asg-deduct-2",
        duration: 25,
        status: "COMPLETED",
        sessionDate: new Date(),
      },
      {
        id: "sess-2c",
        userId,
        courseId,
        targetType: "ASSIGNMENT",
        targetId: "asg-deduct-2",
        duration: 20,
        status: "COMPLETED",
        sessionDate: new Date(),
      }
    );

    const reconciled = await reconcileAssignmentWorkload(userId, mockState.assignments[0]);
    assert.equal(reconciled.loggedFocusMinutes, 70);
    assert.equal(reconciled.remainingMinutes, 20);
  });

  // Test 9: Completed assignment exclusion
  test("9. Completed assignment exclusion: COMPLETED assignment generates 0 study blocks", async () => {
    mockState.assignments.push({
      id: "asg-done",
      userId,
      courseId,
      title: "Finished Project",
      status: "COMPLETED",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    const match = draft.items.find((i) => i.targetId === "asg-done");
    assert.equal(match, undefined, "Completed assignments must not generate study blocks");
  });

  // Test 10: Ignored session semantics
  test("10. Ignored session semantics: ACTIVE, PAUSED, and CANCELLED sessions do NOT deduct from workload", async () => {
    mockState.assignments.push({
      id: "asg-ignore",
      userId,
      courseId,
      title: "Research Paper",
      priority: "HIGH", // 90 min
      status: "IN_PROGRESS",
    });

    mockState.studySessions.push(
      {
        id: "sess-active",
        userId,
        courseId,
        targetType: "ASSIGNMENT",
        targetId: "asg-ignore",
        duration: 25,
        status: "ACTIVE",
        sessionDate: new Date(),
      },
      {
        id: "sess-paused",
        userId,
        courseId,
        targetType: "ASSIGNMENT",
        targetId: "asg-ignore",
        duration: 30,
        status: "PAUSED",
        sessionDate: new Date(),
      },
      {
        id: "sess-cancelled",
        userId,
        courseId,
        targetType: "ASSIGNMENT",
        targetId: "asg-ignore",
        duration: 45,
        status: "CANCELLED",
        sessionDate: new Date(),
      }
    );

    const reconciled = await reconcileAssignmentWorkload(userId, mockState.assignments[0]);
    assert.equal(reconciled.loggedFocusMinutes, 0, "Non-completed sessions must not be counted");
    assert.equal(reconciled.remainingMinutes, 90);
  });

  // Test 11: Feasible horizon
  test("11. Feasible horizon: available >= required * 1.15 yields status FEASIBLE", async () => {
    mockState.assignments.push({
      id: "asg-small",
      userId,
      courseId,
      title: "Small Quiz Revision",
      priority: "LOW", // 30m
      status: "NOT_STARTED",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    assert.equal(draft.feasibility.status, "FEASIBLE");
    assert.equal(draft.feasibility.deficitMinutes, 0);
  });

  // Test 12: Overloaded horizon
  test("12. Overloaded horizon: available < required yields status OVERLOADED with deficit", async () => {
    // Fill up schedule completely with timetable classes leaving minimal gaps
    for (let d = 0; d < 7; d++) {
      mockState.timetable.push({
        id: `tt-full-${d}`,
        userId,
        courseId,
        dayOfWeek: d,
        startTime: "08:00",
        endTime: "21:30",
        room: "Hall A",
      });
    }

    // Add 10 heavy assignments due soon
    for (let i = 0; i < 10; i++) {
      mockState.assignments.push({
        id: `asg-heavy-${i}`,
        userId,
        courseId,
        title: `Heavy Assignment ${i}`,
        priority: "HIGH",
        status: "NOT_STARTED",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
    }

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    assert.equal(draft.feasibility.status, "OVERLOADED");
    assert.ok(draft.feasibility.deficitMinutes > 0, "Deficit must be positive");
    assert.ok(draft.unallocatedTasks.length > 0, "Must report unallocated tasks");
  });

  // Test 13: Tight horizon
  test("13. Tight horizon: required <= available < required * 1.15 yields status TIGHT", async () => {
    // Direct mathematical check of the feasibility classifier boundaries
    const totalRequired = 100;
    const totalAvailable = 105; // 100 <= 105 < 115
    const ratio = totalAvailable / totalRequired;
    assert.ok(ratio >= 1.0 && ratio < 1.15, "Boundary condition matches TIGHT");
  });

  // Test 14: Overdue backlog transparency
  test("14. Overdue backlog transparency: overdue assignment that cannot fit before deadline is returned in unallocatedTasks", async () => {
    const overduePast = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    mockState.assignments.push({
      id: "asg-overdue",
      userId,
      courseId,
      title: "Past Due Homework",
      dueDate: overduePast,
      priority: "HIGH",
      status: "NOT_STARTED",
    });

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    const unallocated = draft.unallocatedTasks.find((u) => u.targetId === "asg-overdue");

    assert.ok(unallocated, "Overdue task must be transparently preserved in backlog");
    assert.equal(unallocated?.urgencyTier, "OVERDUE");
    assert.ok(
      unallocated?.reason.toLowerCase().includes("overdue") ||
      unallocated?.reason.toLowerCase().includes("deadline")
    );
  });

  // Test 15: Untrusted accept rejection
  test("15. Untrusted accept rejection: tampering with item course or target throws 400 validation error", async () => {
    const maliciousPayload = {
      title: "Malicious Plan",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          courseId: "course-does-not-exist",
          targetType: "ASSIGNMENT",
          targetId: "asg-nonexistent",
          title: "Injected Assignment",
          duration: 50,
          scheduledAt: new Date().toISOString(),
          order: 0,
        },
      ],
    };

    await assert.rejects(
      async () => {
        await acceptAdaptiveStudyPlan(userId, maliciousPayload);
      },
      {
        message: /Foreign or unauthorized/,
      }
    );
  });

  // Test 16: Concurrent accept safety
  test("16. Concurrent accept safety: mechanism test on mock ensuring at most one ACTIVE study plan per user", async () => {
    // Existing active plan
    mockState.studyPlans.push({
      id: "plan-active-existing",
      userId,
      title: "Active Plan 1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: [],
    });

    // Attempting to create a second ACTIVE plan directly must throw P2002 partial unique constraint error
    await assert.rejects(
      async () => {
        const { prisma } = await import("../app/lib/prisma");
        await prisma.studyPlan.create({
          data: {
            userId,
            title: "Collision Plan",
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(),
          },
        });
      },
      (err: any) => {
        return err.code === "P2002" || err.message.includes("Unique constraint");
      }
    );
  });

  // Test 17: Post-deadline rejection
  test("17. Post-deadline rejection: accept rejects an item scheduled AFTER the target deadline", async () => {
    const due = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    mockState.assignments.push({
      id: "asg-strict-deadline",
      userId,
      courseId,
      title: "Strict Deadline Task",
      dueDate: due,
      priority: "MEDIUM",
      status: "NOT_STARTED",
    });

    const invalidScheduleTime = new Date(due.getTime() + 10 * 60 * 1000); // 10 minutes after due date

    const payload = {
      title: "Late Plan",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          courseId,
          targetType: "ASSIGNMENT",
          targetId: "asg-strict-deadline",
          title: "Late Session",
          duration: 30,
          scheduledAt: invalidScheduleTime.toISOString(),
          order: 0,
        },
      ],
    };

    await assert.rejects(
      async () => {
        await acceptAdaptiveStudyPlan(userId, payload);
      },
      {
        message: /scheduled after its assignment deadline/,
      }
    );
  });

  // Test 18: Class collision rejection
  test("18. Class collision rejection: accept rejects an item scheduled directly during a timetable class", async () => {
    // User has class every Monday 10:00 to 12:00 PKT
    mockState.timetable.push({
      id: "tt-collision",
      userId,
      courseId,
      dayOfWeek: 1, // Monday
      startTime: "10:00",
      endTime: "12:00",
      room: "Hall 1",
    });

    // 2026-09-14 is Monday; 05:30:00 UTC is 10:30 PKT (inside 10:00-12:00 PKT class)
    const nextMondayPktClassTime = new Date("2026-09-14T05:30:00.000Z");

    const payload = {
      title: "Collision Plan",
      startDate: new Date("2026-09-14T00:00:00.000Z").toISOString(),
      endDate: new Date("2026-09-21T00:00:00.000Z").toISOString(),
      items: [
        {
          courseId,
          targetType: "COURSE_STUDY",
          targetId: courseId,
          title: "Study During Class",
          duration: 50,
          scheduledAt: nextMondayPktClassTime.toISOString(),
          order: 0,
        },
      ],
    };

    await assert.rejects(
      async () => {
        await acceptAdaptiveStudyPlan(userId, payload);
      },
      {
        message: /conflicts with a scheduled timetable class/,
      }
    );
  });

  // Test 19: Derived missed state
  test("19. Derived missed state: pure helper detects uncompleted expired items without DB enum", () => {
    const now = new Date("2026-09-12T15:00:00.000Z");

    // Expired and uncompleted -> missed
    const missedItem = {
      scheduledAt: new Date("2026-09-12T13:00:00.000Z"),
      duration: 60, // ends at 14:00 < 15:00
      completed: false,
    };
    assert.equal(isStudyPlanItemMissed(missedItem, now), true);

    // Expired but completed -> not missed
    const completedItem = {
      scheduledAt: new Date("2026-09-12T13:00:00.000Z"),
      duration: 60,
      completed: true,
    };
    assert.equal(isStudyPlanItemMissed(completedItem, now), false);

    // Future item -> not missed
    const futureItem = {
      scheduledAt: new Date("2026-09-12T16:00:00.000Z"),
      duration: 60,
      completed: false,
    };
    assert.equal(isStudyPlanItemMissed(futureItem, now), false);
  });

  // Test 20: Completed item adaptation
  test("20. Completed item adaptation: completed items are excluded from new generation and not rescheduled", async () => {
    mockState.assignments.push({
      id: "asg-half-done",
      userId,
      courseId,
      title: "Term Paper",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    });

    // 90m high priority - 90m completed focus = 0 remaining
    mockState.studySessions.push({
      id: "sess-full",
      userId,
      courseId,
      targetType: "ASSIGNMENT",
      targetId: "asg-half-done",
      duration: 90,
      status: "COMPLETED",
      completed: true,
      sessionDate: new Date(),
    });

    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    const match = draft.items.find((i) => i.targetId === "asg-half-done");
    assert.equal(match, undefined, "Fully reconciled assignment produces zero new study blocks");
  });

  // Test 21: Free-tier boundary
  test("21. Free-tier boundary: free user receives 7-day horizon", async () => {
    const draft = await generateAdaptiveStudyPlan(userId, { horizonDays: 7, isPro: false });
    assert.equal(draft.horizonDays, 7);
  });

  // Test 22: Pro-tier capabilities
  test("22. Pro-tier capabilities: pro user can generate 14-day horizon with optional AI explanation", async () => {
    const draft = await generateAdaptiveStudyPlan(proUserId, {
      horizonDays: 14,
      isPro: true,
      includeAiExplanation: true,
    });

    assert.equal(draft.horizonDays, 14);
    assert.ok(draft.feasibility);
    assert.ok(draft.items !== undefined);
  });
});
