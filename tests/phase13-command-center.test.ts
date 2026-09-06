import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";

import { getStudentPriorities } from "../app/lib/student-intelligence";
import {
  createStudySessionRecord,
  updateStudySessionRecord,
  deleteStudySessionRecord,
  getWeeklyStudyTotal,
  getWeeklyStudyProgress,
} from "../app/lib/study-sessions";
import {
  upsertStudentGoal,
  deleteStudentGoal,
  calculateStudentGoalsProgress,
} from "../app/lib/goals";
import {
  createStudyPlanWithItems,
  toggleStudyPlanItemCompleted,
  deleteStudyPlanItem,
  deleteStudyPlan,
} from "../app/lib/study-plans";
import { getMonthCalendarEvents } from "../app/lib/calendar";
import { getAvailableStudyWindows } from "../app/lib/study-availability";
import { getAcademicInsights } from "../app/lib/academic-insights";
import { generateAcademicNotifications } from "../app/lib/notifications";
import { getPKTDateParts, getPKTWeekBounds, getPKTDayBounds } from "../app/lib/timezone";
import { generateStudyBuddyResponse } from "../app/lib/ai";
import { POST as studyPlanRoute } from "../app/api/ai/study-plan/route";
import { NextRequest } from "next/server";

describe("Phase 13: Student Command Center Suite", () => {
  beforeEach(() => {
    resetMockState();

    // User 1 base setup
    mockState.users.push({
      id: "u1",
      email: "u1@uni.edu",
      name: "Talha",
      passwordHash: "hash1",
    });

    // User 2 base setup
    mockState.users.push({
      id: "u2",
      email: "u2@uni.edu",
      name: "Other Student",
      passwordHash: "hash2",
    });

    // Courses
    mockState.courses.push({
      id: "c-dld",
      userId: "u1",
      name: "Digital Logic Design",
      code: "DLD",
      creditHours: 3,
      color: "#2563eb",
    });
    mockState.courses.push({
      id: "c-web",
      userId: "u1",
      name: "Web Engineering",
      code: "WEB",
      creditHours: 3,
      color: "#059669",
    });
    mockState.courses.push({
      id: "c-other",
      userId: "u2",
      name: "Physics",
      code: "PHY",
      creditHours: 4,
      color: "#dc2626",
    });
  });

  // 1. Student intelligence prioritizes overdue assignment correctly
  test("1. Student intelligence prioritizes overdue assignment as CRITICAL", async () => {
    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    mockState.assignments.push({
      id: "asgn-overdue",
      userId: "u1",
      courseId: "c-dld",
      title: "Boolean Algebra Lab",
      dueDate: yesterday,
      priority: "HIGH",
      status: "NOT_STARTED",
    });

    const report = await getStudentPriorities("u1");
    assert.strictEqual(report.criticalCount >= 1, true);
    assert.strictEqual(report.priorities[0].severity, "CRITICAL");
    assert.strictEqual(report.priorities[0].type, "OVERDUE_ASSIGNMENT");
    assert.match(report.priorities[0].title, /Boolean Algebra Lab is overdue/);
  });

  // 2. Upcoming exam priority works
  test("2. Upcoming exam priority correctly marks imminent exams", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockState.exams.push({
      id: "exam-dld",
      userId: "u1",
      courseId: "c-dld",
      title: "DLD Final Exam",
      examDate: tomorrow,
      type: "FINAL",
      status: "UPCOMING",
      preparationProgress: 35,
    });

    const report = await getStudentPriorities("u1");
    const examPrio = report.priorities.find((p) => p.type === "EXAM_TOMORROW");
    assert.ok(examPrio);
    assert.strictEqual(examPrio.severity, "CRITICAL"); // low prep (<60%) + tomorrow = CRITICAL
  });

  // 3. Attendance warning works
  test("3. Attendance warning flags course under 75%", async () => {
    mockState.attendance.push({
      id: "att-dld",
      userId: "u1",
      courseId: "c-dld",
      totalClasses: 20,
      attendedClasses: 14, // 70%
    });

    const report = await getStudentPriorities("u1");
    const attPrio = report.priorities.find((p) => p.type === "ATTENDANCE_WARNING");
    assert.ok(attPrio);
    assert.strictEqual(attPrio.courseCode, "DLD");
  });

  // 4. No fake priority when data absent (calm empty state)
  test("4. No fake priority when data absent — returns caught up empty state", async () => {
    const report = await getStudentPriorities("u1");
    assert.strictEqual(report.isCaughtUp, true);
    assert.strictEqual(report.criticalCount, 0);
    assert.strictEqual(report.highCount, 0);
    assert.strictEqual(report.priorities.length, 0);
  });

  // 5. StudySession create
  test("5. StudySession create persists record and calculates duration", async () => {
    const sess = await createStudySessionRecord("u1", {
      courseId: "c-dld",
      title: "K-Map Practice",
      duration: 75,
      sessionDate: new Date(),
    });

    assert.ok(sess.id);
    assert.strictEqual(sess.duration, 75);
    assert.strictEqual(sess.userId, "u1");
    assert.strictEqual(mockState.studySessions.length, 1);
  });

  // 6. StudySession edit
  test("6. StudySession edit updates duration and title", async () => {
    const sess = await createStudySessionRecord("u1", {
      courseId: "c-dld",
      title: "Initial Topic",
      duration: 45,
      sessionDate: new Date(),
    });

    await updateStudySessionRecord("u1", sess.id, {
      title: "Updated Topic",
      duration: 60,
    });

    const updated = mockState.studySessions.find((s: any) => s.id === sess.id);
    assert.strictEqual(updated.title, "Updated Topic");
    assert.strictEqual(updated.duration, 60);
  });

  // 7. StudySession delete
  test("7. StudySession delete removes the record", async () => {
    const sess = await createStudySessionRecord("u1", {
      courseId: "c-dld",
      title: "Session to delete",
      duration: 30,
      sessionDate: new Date(),
    });

    await deleteStudySessionRecord("u1", sess.id);
    assert.strictEqual(mockState.studySessions.length, 0);
  });

  // 8. Cross-user StudySession blocked
  test("8. Cross-user StudySession edit and delete are blocked", async () => {
    const sess = await createStudySessionRecord("u1", {
      courseId: "c-dld",
      title: "User 1 Study",
      duration: 50,
      sessionDate: new Date(),
    });

    // User 2 attempts edit
    await assert.rejects(
      async () => {
        await updateStudySessionRecord("u2", sess.id, { title: "Hacked" });
      },
      { message: "Study session not found or unauthorized." }
    );

    // User 2 attempts delete
    await assert.rejects(
      async () => {
        await deleteStudySessionRecord("u2", sess.id);
      },
      { message: "Study session not found or unauthorized." }
    );
  });

  // 9. Goals create/update
  test("9. Goals create and update persist correctly", async () => {
    const goal = await upsertStudentGoal("u1", "TARGET_GPA", 3.8);
    assert.ok(goal.id);
    assert.strictEqual(goal.targetValue, 3.8);

    // Update existing goal
    const updated = await upsertStudentGoal("u1", "TARGET_GPA", 3.9);
    assert.strictEqual(updated.id, goal.id);
    assert.strictEqual(updated.targetValue, 3.9);
  });

  // 10. Goal progress calculation
  test("10. Goal progress calculates actual vs target from real database", async () => {
    // Add real grade
    mockState.courseGrades.push({
      id: "g1",
      userId: "u1",
      courseId: "c-dld",
      grade: "A",
      gradePoints: 4.0,
    });
    // Add real study session
    mockState.studySessions.push({
      id: "s1",
      userId: "u1",
      title: "Revision",
      duration: 360, // 6 hours
      sessionDate: new Date(),
      completed: true,
    });

    await upsertStudentGoal("u1", "TARGET_GPA", 3.8);
    await upsertStudentGoal("u1", "WEEKLY_STUDY_HOURS", 10);

    const progress = await calculateStudentGoalsProgress("u1");
    const gpaGoal = progress.find((p) => p.type === "TARGET_GPA");
    const studyGoal = progress.find((p) => p.type === "WEEKLY_STUDY_HOURS");

    assert.ok(gpaGoal);
    assert.strictEqual(gpaGoal.currentValue, 4.0);
    assert.strictEqual(gpaGoal.targetValue, 3.8);

    assert.ok(studyGoal);
    assert.strictEqual(studyGoal.currentValue, 6.0);
    assert.strictEqual(studyGoal.targetValue, 10);
    assert.strictEqual(studyGoal.percentage, 60);
  });

  // 11. Cross-user goals blocked
  test("11. Cross-user goal delete is blocked", async () => {
    const goal = await upsertStudentGoal("u1", "TARGET_GPA", 3.7);

    await assert.rejects(
      async () => {
        await deleteStudentGoal("u2", goal.id);
      },
      { message: "Goal not found or unauthorized." }
    );
  });

  // 12. StudyPlan creation
  test("12. StudyPlan creation saves plan and child items", async () => {
    const plan = await createStudyPlanWithItems(
      "u1",
      {
        title: "Tonight Study Plan",
        startDate: new Date(),
        endDate: new Date(),
      },
      [
        {
          courseId: "c-dld",
          title: "Boolean Algebra",
          duration: 60,
          scheduledAt: new Date(),
        },
      ]
    );

    assert.ok(plan.id);
    assert.strictEqual(plan.items.length, 1);
    assert.strictEqual(plan.items[0].duration, 60);
  });

  // 13. StudyPlanItem completion & auto-logging StudySession
  test("13. StudyPlanItem completion marks task and auto-logs StudySession", async () => {
    const plan = await createStudyPlanWithItems(
      "u1",
      {
        title: "Study Plan",
        startDate: new Date(),
        endDate: new Date(),
      },
      [
        {
          courseId: "c-dld",
          title: "Complete Flip Flops",
          duration: 45,
          scheduledAt: new Date(),
        },
      ]
    );

    const itemId = plan.items[0].id;
    await toggleStudyPlanItemCompleted("u1", itemId, true, true);

    const updatedItem = mockState.studyPlanItems.find((it: any) => it.id === itemId);
    assert.strictEqual(updatedItem.completed, true);

    // Auto-logged session check
    const loggedSession = mockState.studySessions.find((s: any) => s.title === "Complete Flip Flops");
    assert.ok(loggedSession);
    assert.strictEqual(loggedSession.duration, 45);
    assert.strictEqual(loggedSession.source, "STUDY_PLAN");
  });

  // 14. Cross-user StudyPlan blocked
  test("14. Cross-user StudyPlan delete and task completion are blocked", async () => {
    const plan = await createStudyPlanWithItems(
      "u1",
      {
        title: "Private Plan",
        startDate: new Date(),
        endDate: new Date(),
      },
      [
        {
          courseId: "c-dld",
          title: "Private Task",
          duration: 30,
          scheduledAt: new Date(),
        },
      ]
    );

    await assert.rejects(
      async () => {
        await deleteStudyPlan("u2", plan.id);
      },
      { message: "Study plan not found or unauthorized." }
    );

    await assert.rejects(
      async () => {
        await toggleStudyPlanItemCompleted("u2", plan.items[0].id, true);
      },
      { message: "Study plan item not found or unauthorized." }
    );
  });

  // 15. Foreign course IDs rejected
  test("15. Foreign course IDs in StudyPlan or StudySession are rejected", async () => {
    // Attempting to attach User 2's course (c-other) to User 1's study plan
    await assert.rejects(
      async () => {
        await createStudyPlanWithItems(
          "u1",
          {
            title: "Illegitimate Plan",
            startDate: new Date(),
            endDate: new Date(),
          },
          [
            {
              courseId: "c-other", // belongs to u2
              title: "Unauthorized Course",
              duration: 45,
              scheduledAt: new Date(),
            },
          ]
        );
      },
      { message: "Foreign or unauthorized course ID detected." }
    );
  });

  // 16. Academic calendar combines real event types
  test("16. Academic calendar aggregates classes, assignments, exams, and study sessions", async () => {
    const today = new Date();
    const pkt = getPKTDateParts(today);

    // Add Timetable entry for today's day of week
    mockState.timetable.push({
      id: "t1",
      userId: "u1",
      courseId: "c-dld",
      dayOfWeek: pkt.dayOfWeek,
      startTime: "10:00",
      endTime: "11:30",
      type: "Lecture",
    });

    // Add Assignment
    mockState.assignments.push({
      id: "a1",
      userId: "u1",
      courseId: "c-web",
      title: "Project Milestone",
      dueDate: today,
      priority: "HIGH",
      status: "IN_PROGRESS",
    });

    // Add Exam
    mockState.exams.push({
      id: "e1",
      userId: "u1",
      courseId: "c-dld",
      title: "Midterm Exam",
      examDate: today,
      type: "MIDTERM",
      status: "UPCOMING",
      preparationProgress: 70,
    });

    // Add Study Session
    mockState.studySessions.push({
      id: "s1",
      userId: "u1",
      title: "Self Revision",
      duration: 60,
      sessionDate: today,
      completed: true,
    });

    const cal = await getMonthCalendarEvents("u1", today);
    const types = new Set(cal.events.map((e) => e.eventType));

    assert.ok(types.has("CLASS"));
    assert.ok(types.has("ASSIGNMENT"));
    assert.ok(types.has("EXAM"));
    assert.ok(types.has("STUDY"));
  });

  // 17. Calendar timezone is Asia/Karachi
  test("17. Calendar correctly converts UTC instant to Asia/Karachi date key", () => {
    // 2026-08-31 21:00:00 UTC is September 1st, 2026 in PKT (UTC+5)
    const utcInstant = new Date("2026-08-31T21:00:00.000Z");
    const pktParts = getPKTDateParts(utcInstant);

    assert.strictEqual(pktParts.year, 2026);
    assert.strictEqual(pktParts.month, 8); // September (0-indexed: 8)
    assert.strictEqual(pktParts.day, 1);
    assert.strictEqual(pktParts.hours, 2); // 02:00 AM
  });

  // 18. AI study-plan endpoint requires authentication
  test("18. POST /api/ai/study-plan returns 401 when unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/study-plan", {
      method: "POST",
      body: JSON.stringify({ availableHours: 3 }),
    });

    const res = await studyPlanRoute(req);
    assert.strictEqual(res.status, 401);
  });

  // 19. Available study windows avoid timetable conflicts
  test("19. Available study windows avoid timetable class times", async () => {
    const today = new Date();
    const pkt = getPKTDateParts(today);

    // Timetable class from 10:00 to 12:00
    mockState.timetable.push({
      id: "t-class",
      userId: "u1",
      courseId: "c-dld",
      dayOfWeek: pkt.dayOfWeek,
      startTime: "10:00",
      endTime: "12:00",
      type: "Lecture",
    });

    const avail = await getAvailableStudyWindows("u1", today, {
      wakeTime: "08:00",
      sleepTime: "14:00",
    });

    // There should be a window 08:00 to 10:00 and 12:00 to 14:00, but NEVER 10:00 to 12:00
    assert.strictEqual(avail.windows.length, 2);
    assert.strictEqual(avail.windows[0].startTime, "08:00");
    assert.strictEqual(avail.windows[0].endTime, "10:00");
    assert.strictEqual(avail.windows[1].startTime, "12:00");
    assert.strictEqual(avail.windows[1].endTime, "14:00");
  });

  // 20. Academic Insights generates factual trends without fake historical GPA
  test("20. Academic Insights generates factual attendance and exam insights", async () => {
    mockState.attendance.push({
      id: "att-low",
      userId: "u1",
      courseId: "c-dld",
      totalClasses: 30,
      attendedClasses: 21, // 70%
    });

    const insights = await getAcademicInsights("u1");
    const attInsight = insights.find((i) => i.category === "ATTENDANCE");
    assert.ok(attInsight);
    assert.match(attInsight.description, /below the 75% required university threshold/);

    // Verify no fabricated historical GPA transitions
    for (const insight of insights) {
      assert.strictEqual(insight.description.includes("→"), false);
    }
  });

  // 21. Notification deduplication prevents spam
  test("21. Notification generation avoids duplicate study plan reminders", async () => {
    const today = new Date();
    const plan = await createStudyPlanWithItems(
      "u1",
      {
        title: "Daily Plan",
        startDate: today,
        endDate: today,
      },
      [
        {
          courseId: "c-dld",
          title: "Scheduled Session",
          duration: 60,
          scheduledAt: today,
        },
      ]
    );

    const firstRun = await generateAcademicNotifications("u1");
    assert.ok(firstRun >= 1);

    // Second immediate run must NOT create duplicate notifications
    const secondRun = await generateAcademicNotifications("u1");
    assert.strictEqual(secondRun, 0);
  });

  // 22. Regression: Existing AI Study Buddy still functions with sanitized context
  test("22. Regression: Existing AI Study Buddy still functions with sanitized context", async () => {
    const reply = await generateStudyBuddyResponse("u1", "What are my priorities?");
    assert.ok(reply);
    assert.strictEqual(typeof reply, "string");
  });

  // 23. AI study plan requires user confirmation before persistence
  test("23. AI study plan draft does NOT write to database autonomously", async () => {
    const initialPlanCount = mockState.studyPlans.length;
    const initialItemCount = mockState.studyPlanItems.length;

    // Direct invocation of endpoint or generator does not touch database
    const req = new NextRequest("http://localhost:3000/api/ai/study-plan", {
      method: "POST",
      body: JSON.stringify({ availableHours: 2 }),
    });
    await studyPlanRoute(req);

    assert.strictEqual(mockState.studyPlans.length, initialPlanCount);
    assert.strictEqual(mockState.studyPlanItems.length, initialItemCount);
  });

  // 24. AI context excludes expenses and credentials
  test("24. AI context strictly excludes expenses and password hashes", async () => {
    mockState.expenses.push({
      id: "exp-secret",
      userId: "u1",
      amount: "5000",
      category: "Food",
      expenseDate: new Date(),
    });

    const reply = await generateStudyBuddyResponse("u1", "Tell me about my financial status");
    assert.strictEqual(reply.toLowerCase().includes("5000"), false);
    assert.strictEqual(reply.toLowerCase().includes("hash1"), false);
  });

  // 25. Week Bounds in Asia/Karachi begins on Monday and ends on Sunday
  test("25. Week bounds in PKT covers exact 7 calendar days", () => {
    const { start, end } = getPKTWeekBounds(new Date());
    const durationMs = end.getTime() - start.getTime();
    // 7 days in ms is 7 * 86400 * 1000 - 1 ms = 604799999
    assert.strictEqual(durationMs, 604799999);
  });

  // 26. Weekly study summary aggregation
  test("26. Weekly study progress calculates 7 days Mon-Sun correctly", async () => {
    mockState.studySessions.push({
      id: "s-mon",
      userId: "u1",
      title: "Monday Study",
      duration: 120, // 2h
      sessionDate: new Date(),
      completed: true,
    });

    const progress = await getWeeklyStudyProgress("u1");
    assert.strictEqual(progress.length, 7);
    const dayWithStudy = progress.find((p) => p.hours > 0);
    assert.ok(dayWithStudy);
    assert.strictEqual(dayWithStudy.hours, 2.0);
  });

  // 27. Multiple goals progress calculation
  test("27. Goal calculation handles multiple active goal types gracefully", async () => {
    await upsertStudentGoal("u1", "ATTENDANCE", 85);
    await upsertStudentGoal("u1", "ASSIGNMENT_COMPLETION", 90);

    const goals = await calculateStudentGoalsProgress("u1");
    assert.strictEqual(goals.length, 4);

    const attGoal = goals.find((g) => g.type === "ATTENDANCE");
    assert.ok(attGoal);
    assert.strictEqual(attGoal.isConfigured, true);
    assert.strictEqual(attGoal.targetValue, 85);

    const asgnGoal = goals.find((g) => g.type === "ASSIGNMENT_COMPLETION");
    assert.ok(asgnGoal);
    assert.strictEqual(asgnGoal.isConfigured, true);
    assert.strictEqual(asgnGoal.targetValue, 90);
  });

  // 28. Course deletion cascades to study plan items / sets null
  test("28. Deleting a study plan cascades to study plan items", async () => {
    const plan = await createStudyPlanWithItems(
      "u1",
      { title: "To Delete", startDate: new Date(), endDate: new Date() },
      [{ title: "Item 1", duration: 30, scheduledAt: new Date() }]
    );

    assert.strictEqual(mockState.studyPlans.length, 1);
    assert.strictEqual(mockState.studyPlanItems.length, 1);

    await deleteStudyPlan("u1", plan.id);
    assert.strictEqual(mockState.studyPlans.length, 0);
    assert.strictEqual(mockState.studyPlanItems.length, 0);
  });
});
