import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState } from "./setup-prisma";
import fs from "fs";
import path from "path";

// Data services under test
import { getStudentPriorities } from "../app/lib/student-intelligence";
import {
  getUserStudySessions,
  getWeeklyStudyTotal,
  getWeeklyStudyProgress,
  createStudySessionRecord,
} from "../app/lib/study-sessions";
import {
  upsertStudentGoal,
  calculateStudentGoalsProgress,
} from "../app/lib/goals";
import {
  getUserActiveStudyPlan,
  createStudyPlanWithItems,
  toggleStudyPlanItemCompleted,
} from "../app/lib/study-plans";
import { getMonthCalendarEvents } from "../app/lib/calendar";
import { getAvailableStudyWindows } from "../app/lib/study-availability";
import { getAcademicInsights } from "../app/lib/academic-insights";
import { getUserCourses, createCourseRecord } from "../app/lib/courses";
import { getUserAssignments, createAssignmentRecord } from "../app/lib/assignments";
import { getUserExams, createExamRecord } from "../app/lib/exams";
import { getUserGrades, getUserAttendance } from "../app/lib/academic";
import { getUserExpenses, getExpenseSummary, createExpenseRecord } from "../app/lib/expenses";
import { POST as studyPlanRoute } from "../app/api/ai/study-plan/route";
import { NextRequest } from "next/server";

describe("Phase 13: Production Readiness & End-to-End Smoke Test", () => {
  const userId = "u-smoke";

  beforeEach(() => {
    resetMockState();

    mockState.users.push({
      id: userId,
      email: "student@smoke.test",
      name: "Smoke Test Student",
      passwordHash: "hash-smoke",
    });

    mockState.courses.push({
      id: "course-1",
      userId,
      name: "Computer Networks",
      code: "CS401",
      creditHours: 3,
      color: "#2563eb",
    });
  });

  // 1. Smoke test: /dashboard loader dependencies
  test("Smoke Test 1: /dashboard loader dependencies run seamlessly", async () => {
    const priorities = await getStudentPriorities(userId);
    assert.ok(priorities);
    assert.strictEqual(typeof priorities.isCaughtUp, "boolean");

    const activePlan = await getUserActiveStudyPlan(userId);
    assert.strictEqual(activePlan, null);

    const goals = await calculateStudentGoalsProgress(userId);
    assert.ok(Array.isArray(goals));
    assert.strictEqual(goals.length, 4);

    const insights = await getAcademicInsights(userId);
    assert.ok(Array.isArray(insights));

    const studyTotal = await getWeeklyStudyTotal(userId);
    assert.strictEqual(typeof studyTotal.minutes, "number");
    assert.strictEqual(typeof studyTotal.hours, "number");
  });

  // 2. Smoke test: /dashboard/study loader dependencies
  test("Smoke Test 2: /dashboard/study loader dependencies run seamlessly", async () => {
    await createStudySessionRecord(userId, {
      courseId: "course-1",
      title: "Routing Protocols Deep Dive",
      duration: 90,
      sessionDate: new Date(),
    });

    const sessions = await getUserStudySessions(userId);
    assert.strictEqual(sessions.length, 1);
    assert.strictEqual(sessions[0].title, "Routing Protocols Deep Dive");
    assert.strictEqual(sessions[0].duration, 90);

    const weeklyProgress = await getWeeklyStudyProgress(userId);
    assert.strictEqual(weeklyProgress.length, 7);
    const dayWithStudy = weeklyProgress.find((p) => p.hours > 0);
    assert.ok(dayWithStudy);
    assert.strictEqual(dayWithStudy.hours, 1.5);
  });

  // 3. Smoke test: /dashboard/goals loader & update dependencies
  test("Smoke Test 3: /dashboard/goals loader and upsert run seamlessly", async () => {
    await upsertStudentGoal(userId, "TARGET_GPA", 3.85);
    await upsertStudentGoal(userId, "WEEKLY_STUDY_HOURS", 15);

    const goals = await calculateStudentGoalsProgress(userId);
    const gpa = goals.find((g) => g.type === "TARGET_GPA");
    const studyHours = goals.find((g) => g.type === "WEEKLY_STUDY_HOURS");

    assert.strictEqual(gpa?.targetValue, 3.85);
    assert.strictEqual(studyHours?.targetValue, 15);
  });

  // 4. Smoke test: /dashboard/study-plan & conflict-free slots
  test("Smoke Test 4: /dashboard/study-plan and slot availability run seamlessly", async () => {
    const today = new Date();
    const activePlan = await getUserActiveStudyPlan(userId);
    assert.strictEqual(activePlan, null); // No active plan initially

    const windows = await getAvailableStudyWindows(userId, today, {
      wakeTime: "08:00",
      sleepTime: "22:00",
    });
    assert.ok(Array.isArray(windows.windows));
    assert.ok(windows.windows.length >= 1);
  });

  // 5. Smoke test: /dashboard/calendar unified aggregation
  test("Smoke Test 5: /dashboard/calendar aggregates all event categories in Asia/Karachi", async () => {
    const today = new Date();

    // Assignment
    mockState.assignments.push({
      id: "asgn-1",
      userId,
      courseId: "course-1",
      title: "Subnetting Lab",
      dueDate: today,
      priority: "MEDIUM",
      status: "IN_PROGRESS",
    });

    // Exam
    mockState.exams.push({
      id: "exam-1",
      userId,
      courseId: "course-1",
      title: "CS401 Midterm",
      examDate: today,
      type: "MIDTERM",
      status: "UPCOMING",
      preparationProgress: 50,
    });

    const cal = await getMonthCalendarEvents(userId, today);
    assert.ok(cal.events.length >= 2);
    const eventTypes = new Set(cal.events.map((e) => e.eventType));
    assert.ok(eventTypes.has("ASSIGNMENT"));
    assert.ok(eventTypes.has("EXAM"));
  });

  // 6. Smoke test: AI study-plan generation endpoint requires authentication
  test("Smoke Test 6: AI study-plan generation route responds with 401 when unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/study-plan", {
      method: "POST",
      body: JSON.stringify({ availableHours: 3 }),
    });

    const res = await studyPlanRoute(req);
    assert.strictEqual(res.status, 401);
  });

  // 7. Smoke test: Save Plan confirmation flow
  test("Smoke Test 7: Save Plan confirmation creates plan with child items", async () => {
    const today = new Date();
    const createdPlan = await createStudyPlanWithItems(
      userId,
      {
        title: "Exam Sprint",
        startDate: today,
        endDate: today,
      },
      [
        {
          courseId: "course-1",
          title: "Review Dijkstra Algorithm",
          duration: 45,
          scheduledAt: today,
        },
        {
          courseId: "course-1",
          title: "BGP and OSPF Packet Tracer",
          duration: 60,
          scheduledAt: today,
        },
      ]
    );

    assert.ok(createdPlan.id);
    assert.strictEqual(createdPlan.items.length, 2);

    const fetchedActive = await getUserActiveStudyPlan(userId);
    assert.ok(fetchedActive);
    assert.strictEqual(fetchedActive.id, createdPlan.id);
  });

  // 8. Smoke test: Complete study-plan item -> StudySession auto-log
  test("Smoke Test 8: Complete study-plan item auto-logs a completed StudySession", async () => {
    const today = new Date();
    const createdPlan = await createStudyPlanWithItems(
      userId,
      {
        title: "Sprint Plan",
        startDate: today,
        endDate: today,
      },
      [
        {
          courseId: "course-1",
          title: "Packet Tracer Drill",
          duration: 50,
          scheduledAt: today,
        },
      ]
    );

    const itemId = createdPlan.items[0].id;
    const ok = await toggleStudyPlanItemCompleted(userId, itemId, true, true);
    assert.strictEqual(ok, true);

    const sessions = await getUserStudySessions(userId);
    const autoLogged = sessions.find((s) => s.title === "Packet Tracer Drill");
    assert.ok(autoLogged);
    assert.strictEqual(autoLogged.duration, 50);
    assert.strictEqual(autoLogged.source, "STUDY_PLAN");
    assert.strictEqual(autoLogged.completed, true);
  });

  // 9. Smoke test: Existing modules regression (courses, assignments, exams, academics, expenses)
  test("Smoke Test 9: Existing academic & finance modules operate seamlessly", async () => {
    // Courses
    const courses = await getUserCourses(userId);
    assert.strictEqual(courses.length, 1);

    // Assignments
    const asgn = await createAssignmentRecord(userId, {
      courseId: "course-1",
      title: "Socket Programming Project",
      description: "Implementing TCP socket client and server",
      dueDate: new Date(),
      priority: "HIGH",
      status: "NOT_STARTED",
    });
    assert.ok(asgn.id);
    const assignments = await getUserAssignments(userId);
    assert.strictEqual(assignments.length, 1);

    // Exams
    const exam = await createExamRecord(userId, {
      courseId: "course-1",
      title: "Final Exam",
      examDate: new Date(),
      room: "Lab 3",
      notes: "Chapters 1 to 5",
      type: "FINAL",
      status: "UPCOMING",
      preparationProgress: 10,
    });
    assert.ok(exam.id);
    const exams = await getUserExams(userId);
    assert.strictEqual(exams.length, 1);

    // Academics
    const grades = await getUserGrades(userId);
    assert.ok(Array.isArray(grades));
    const attendance = await getUserAttendance(userId);
    assert.ok(Array.isArray(attendance));

    // Expenses
    const expense = await createExpenseRecord(userId, {
      description: "Networking Text Book",
      amount: 2500,
      category: "BOOKS",
      expenseDate: new Date(),
    });
    assert.ok(expense.id);
    const summary = await getExpenseSummary(userId);
    assert.strictEqual(summary.expenseCount, 1);
    assert.strictEqual(summary.totalSpending, 2500);
  });

  // 10. Smoke test: Light / Dark / System theme tokens presence
  test("Smoke Test 10: Theme tokens light/dark definitions exist and are well-formed", () => {
    const cssPath = path.join(process.cwd(), "app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    assert.strictEqual(cssContent.includes(":root"), true);
    assert.strictEqual(cssContent.includes(".dark"), true);
    assert.strictEqual(cssContent.includes("--color-bg"), true);
    assert.strictEqual(cssContent.includes("--color-surface"), true);
    assert.strictEqual(cssContent.includes("--color-text"), true);
  });
});
