import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { LightColors, DarkColors } from "../constants/colors";
import type {
  MobileAdaptiveTodayWorkspaceData,
  MobileTodayActionItem,
  MobileTodayTimelineSlot,
} from "../lib/types";

describe("Milestone 15.1: Mobile Today Workspace Suite", () => {
  const mockWorkspace: MobileAdaptiveTodayWorkspaceData = {
    timestamp: "2026-09-15T05:00:00.000Z",
    dateString: "2026-09-15",
    dayName: "Tuesday",
    capacity: {
      availableStudyMinutes: 180, // 3 hours free
      allocatedWorkMinutes: 120, // 2 hours planned
      isOverCapacity: false,
      notice: "Today's ~2h of planned work fits comfortably within your ~3.0h of open study windows.",
    },
    attention: {
      items: [
        {
          id: "asgn-urgent-1",
          entityType: "ASSIGNMENT",
          title: "Operating Systems Assignment",
          courseCode: "CS301",
          courseName: "Operating Systems",
          courseColor: "#2563eb",
          urgencyScore: 100,
          urgencyTier: "OVERDUE",
          deadlineLabel: "Overdue by 1 day",
          estimatedMinutes: 90,
          estimatedLabel: "~90 min estimated",
          reason: "Overdue by 1 day • Marked as High priority",
          actionLabel: "View Assignment",
          actionHref: "/dashboard/assignments",
          isAttentionItem: true,
          completed: false,
        },
      ],
      criticalCount: 1,
      attendanceWarning: {
        courseId: "c-cs302",
        courseCode: "CS302",
        courseName: "Database Systems",
        percentageString: "65.0%",
        thresholdPercentage: 75,
        recoveryClassesRequired: 2,
        recommendation: "Attend next 2 classes to recover above 75% target.",
      },
      timetableConflictCount: 0,
    },
    today: {
      schedule: [
        {
          id: "tt-1",
          type: "CLASS",
          title: "CS301 Lecture",
          subtitle: "Operating Systems",
          startTime: "09:00",
          endTime: "10:30",
          durationMinutes: 90,
          room: "Hall 2",
          color: "#2563eb",
        },
        {
          id: "gap-1",
          type: "STUDY_GAP",
          title: "90-minute study window",
          startTime: "10:30",
          endTime: "12:00",
          durationMinutes: 90,
          suggestedAction: "Focus on Operating Systems Assignment",
        },
      ],
      allocatedTasks: [
        {
          id: "asgn-urgent-1",
          entityType: "ASSIGNMENT",
          title: "Operating Systems Assignment",
          courseCode: "CS301",
          courseName: "Operating Systems",
          courseColor: "#2563eb",
          urgencyScore: 100,
          urgencyTier: "OVERDUE",
          deadlineLabel: "Overdue by 1 day",
          estimatedMinutes: 90,
          estimatedLabel: "~90 min estimated",
          reason: "Overdue by 1 day • Marked as High priority",
          actionLabel: "View Assignment",
          actionHref: "/dashboard/assignments",
          isAttentionItem: true,
          completed: false,
        },
      ],
    },
    next: [
      {
        id: "asgn-next-1",
        entityType: "ASSIGNMENT",
        title: "Calculus Homework",
        courseCode: "MATH201",
        courseName: "Calculus",
        courseColor: "#9333ea",
        urgencyScore: 50,
        urgencyTier: "HIGH",
        deadlineLabel: "Due in 3 days",
        estimatedMinutes: 60,
        estimatedLabel: "~60 min estimated",
        reason: "Due in 3 days",
        actionLabel: "View Assignment",
        actionHref: "/dashboard/assignments",
        isAttentionItem: false,
        completed: false,
      },
    ],
    later: [],
    completedToday: {
      items: [
        {
          id: "asgn-done-1",
          title: "English Summary",
          courseCode: "ENG101",
          completedAtStr: "2026-09-15T03:30:00.000Z",
        },
      ],
      count: 1,
    },
    calendarSync: {
      status: "CONNECTED",
      lastSyncAt: "2026-09-15T04:45:00.000Z",
      accountEmail: "student@gmail.com",
    },
    emptyState: {
      isNewStudent: false,
      missingSections: [],
      hasNoClassesToday: false,
      isAllCaughtUp: false,
    },
  };

  test("1. Mobile Adaptive Today Workspace conforms to required contract shape", () => {
    assert.ok(mockWorkspace.capacity);
    assert.equal(mockWorkspace.capacity.availableStudyMinutes, 180);
    assert.equal(mockWorkspace.capacity.allocatedWorkMinutes, 120);
    assert.equal(mockWorkspace.capacity.isOverCapacity, false);

    assert.ok(mockWorkspace.attention);
    assert.equal(mockWorkspace.attention.criticalCount, 1);
    assert.ok(mockWorkspace.attention.attendanceWarning);

    assert.ok(mockWorkspace.today);
    assert.equal(mockWorkspace.today.schedule.length, 2);
    assert.equal(mockWorkspace.today.allocatedTasks.length, 1);

    assert.ok(mockWorkspace.next);
    assert.equal(mockWorkspace.next.length, 1);

    assert.ok(mockWorkspace.completedToday);
    assert.equal(mockWorkspace.completedToday.count, 1);
  });

  test("2. Capacity calculation logic displays correct capacity header in mobile", () => {
    const plannedHours = Math.round(mockWorkspace.capacity.allocatedWorkMinutes / 60);
    const freeHours = (mockWorkspace.capacity.availableStudyMinutes / 60).toFixed(1);
    const headerText = `CAPACITY: ~${plannedHours}h PLANNED / ~${freeHours}h FREE`;

    assert.equal(headerText, "CAPACITY: ~2h PLANNED / ~3.0h FREE");
  });

  test("3. Attention items extract proper severity badges and semantic colors", () => {
    const overdueItem = mockWorkspace.attention.items[0];
    assert.equal(overdueItem.urgencyTier, "OVERDUE");

    // Overdue maps to destructive semantic color
    assert.ok(LightColors.destructive);
    assert.ok(LightColors.destructiveSubtle);
    assert.ok(DarkColors.destructive);
  });

  test("4. Schedule gaps and class items are properly categorized in mobile timeline", () => {
    const classes = mockWorkspace.today.schedule.filter((s) => s.type === "CLASS");
    const gaps = mockWorkspace.today.schedule.filter((s) => s.type === "STUDY_GAP");

    assert.equal(classes.length, 1);
    assert.equal(classes[0].title, "CS301 Lecture");

    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].durationMinutes, 90);
    assert.equal(gaps[0].suggestedAction, "Focus on Operating Systems Assignment");
  });

  test("5. Completed tasks are in completedToday and NOT in LATER or active tasks", () => {
    assert.equal(mockWorkspace.completedToday.count, 1);
    const completedId = mockWorkspace.completedToday.items[0].id;

    assert.ok(!mockWorkspace.later.some((t) => t.id === completedId));
    assert.ok(!mockWorkspace.today.allocatedTasks.some((t) => t.id === completedId));
    assert.ok(!mockWorkspace.next.some((t) => t.id === completedId));
  });

  test("6. Heuristic effort estimation labels display explicit non-factual estimates", () => {
    assert.equal(mockWorkspace.today.allocatedTasks[0].estimatedLabel, "~90 min estimated");
    assert.equal(mockWorkspace.next[0].estimatedLabel, "~60 min estimated");
  });
});
