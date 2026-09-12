import { test, describe } from "node:test";
import assert from "node:assert/strict";

import type {
  MobileActiveFocusSession,
  MobileFocusSessionStatus,
  MobileFocusTargetType,
} from "../lib/types";

describe("Milestone 15.2: Mobile Focus Session Contract & Types", () => {
  // 1. MobileActiveFocusSession type contracts
  test("1. MobileActiveFocusSession correctly shapes active session payload", () => {
    const mockSession: MobileActiveFocusSession = {
      id: "sess_123",
      userId: "u1",
      courseId: "c1",
      courseName: "Algorithms",
      courseCode: "CS302",
      courseColor: "#2563eb",
      title: "Binary Search Trees",
      duration: 0,
      plannedDuration: 50,
      sessionDate: "2026-09-12T10:00:00.000Z",
      status: "ACTIVE",
      targetType: "ASSIGNMENT",
      targetId: "asgn_1",
      pausedAt: null,
      totalPausedSeconds: 0,
      serverNow: "2026-09-12T10:15:00.000Z",
      elapsedSeconds: 900,
    };

    assert.strictEqual(mockSession.status, "ACTIVE");
    assert.strictEqual(mockSession.plannedDuration, 50);
    assert.strictEqual(mockSession.elapsedSeconds, 900);
  });

  // 2. Mobile status transitions
  test("2. Status types conform to allowed focus session states", () => {
    const statuses: MobileFocusSessionStatus[] = [
      "ACTIVE",
      "PAUSED",
      "COMPLETED",
      "CANCELLED",
    ];
    assert.strictEqual(statuses.length, 4);
  });

  // 3. Target types conform to supported entities
  test("3. Target types support all canonical academic focus targets", () => {
    const targets: MobileFocusTargetType[] = [
      "ASSIGNMENT",
      "EXAM",
      "STUDY_PLAN_ITEM",
      "COURSE_STUDY",
      "GENERAL",
    ];
    assert.strictEqual(targets.length, 5);
  });
});
