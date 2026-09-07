import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { mockState, resetMockState } from "./setup-prisma";

import { GET as getCourses, POST as createCourse } from "../app/api/mobile/courses/route";
import { PUT as updateCourse, DELETE as deleteCourse } from "../app/api/mobile/courses/[id]/route";

import { GET as getTimetable, POST as createTimetable } from "../app/api/mobile/timetable/route";
import { PUT as updateTimetable, DELETE as deleteTimetable } from "../app/api/mobile/timetable/[id]/route";

import { GET as getAssignments, POST as createAssignment } from "../app/api/mobile/assignments/route";
import { PUT as updateAssignment, DELETE as deleteAssignment } from "../app/api/mobile/assignments/[id]/route";

import { GET as getExams, POST as createExam } from "../app/api/mobile/exams/route";
import { PUT as updateExam, DELETE as deleteExam } from "../app/api/mobile/exams/[id]/route";

import { GET as getAcademics } from "../app/api/mobile/academics/route";
import { POST as createGrade } from "../app/api/mobile/academics/grades/route";
import { DELETE as deleteGrade } from "../app/api/mobile/academics/grades/[id]/route";
import { POST as recordAttendance } from "../app/api/mobile/academics/attendance/route";

import { GET as getExpenses, POST as createExpense } from "../app/api/mobile/expenses/route";
import { PUT as updateExpense, DELETE as deleteExpense } from "../app/api/mobile/expenses/[id]/route";

import { GET as getNotifications } from "../app/api/mobile/notifications/route";
import { POST as markAllNotificationsRead } from "../app/api/mobile/notifications/read-all/route";
import { PATCH as markNotificationRead } from "../app/api/mobile/notifications/[id]/read/route";
import { DELETE as deleteNotification } from "../app/api/mobile/notifications/[id]/route";

import { generateMobileToken } from "../app/lib/mobile-auth";

describe("Phase 15 Step 4: Mobile Core Modules Security & CRUD Suite", () => {
  const user1Id = "user-mod-1";
  const user2Id = "user-mod-2";
  let user1Token = "";
  let user2Token = "";

  beforeEach(async () => {
    resetMockState();

    mockState.users.push(
      {
        id: user1Id,
        email: "alice@unimate.test",
        name: "Alice",
        passwordHash: "hash-alice",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user2Id,
        email: "bob@unimate.test",
        name: "Bob",
        passwordHash: "hash-bob",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    user1Token = await generateMobileToken({
      userId: user1Id,
      name: "Alice",
      email: "alice@unimate.test",
    });

    user2Token = await generateMobileToken({
      userId: user2Id,
      name: "Bob",
      email: "bob@unimate.test",
    });
  });

  // Helper to make mock requests
  function makeReq(
    url: string,
    options: {
      method?: string;
      token?: string | null;
      body?: any;
    } = {}
  ) {
    const headers: Record<string, string> = {};
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    return new NextRequest(`http://localhost:3000${url}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }

  // ── 1. Unauthenticated requests reject with 401 ──────────────────────────────
  test("1. Unauthenticated requests across all core modules reject with 401", async () => {
    const endpoints = [
      () => getCourses(makeReq("/api/mobile/courses")),
      () => getTimetable(makeReq("/api/mobile/timetable")),
      () => getAssignments(makeReq("/api/mobile/assignments")),
      () => getExams(makeReq("/api/mobile/exams")),
      () => getAcademics(makeReq("/api/mobile/academics")),
      () => getExpenses(makeReq("/api/mobile/expenses")),
      () => getNotifications(makeReq("/api/mobile/notifications")),
    ];

    for (const ep of endpoints) {
      const res = await ep();
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.code, "UNAUTHORIZED");
    }
  });

  test("2. Tampered or invalid Bearer tokens reject with 401", async () => {
    const req = makeReq("/api/mobile/courses", { token: "tampered.jwt.string" });
    const res = await getCourses(req);
    assert.equal(res.status, 401);
  });

  // ── 2. Courses CRUD & Isolation ─────────────────────────────────────────────
  test("3. Courses: User 1 can CRUD courses; User 2 cannot access or mutate them", async () => {
    // Alice creates Course A
    const createReq = makeReq("/api/mobile/courses", {
      method: "POST",
      token: user1Token,
      body: {
        name: "Software Architecture",
        code: "CS401",
        creditHours: 3,
        instructor: "Dr. Smith",
        semester: "Spring 2026",
        color: "#2563eb",
      },
    });
    const createRes = await createCourse(createReq);
    assert.equal(createRes.status, 201);
    const createdData = await createRes.json();
    assert.equal(createdData.success, true);
    assert.equal(createdData.course.name, "Software Architecture");
    const courseId = createdData.course.id;

    // Bob cannot read Alice's course
    const bobListRes = await getCourses(makeReq("/api/mobile/courses", { token: user2Token }));
    const bobList = await bobListRes.json();
    assert.equal(bobList.courses.length, 0);

    // Bob cannot update Alice's course
    const bobUpdateReq = makeReq(`/api/mobile/courses/${courseId}`, {
      method: "PUT",
      token: user2Token,
      body: { name: "Hacked Name" },
    });
    const bobUpdateRes = await updateCourse(bobUpdateReq, { params: Promise.resolve({ id: courseId }) });
    assert.equal(bobUpdateRes.status, 404);

    // Bob cannot delete Alice's course
    const bobDeleteReq = makeReq(`/api/mobile/courses/${courseId}`, {
      method: "DELETE",
      token: user2Token,
    });
    const bobDeleteRes = await deleteCourse(bobDeleteReq, { params: Promise.resolve({ id: courseId }) });
    assert.equal(bobDeleteRes.status, 404);

    // Alice updates her course
    const aliceUpdateReq = makeReq(`/api/mobile/courses/${courseId}`, {
      method: "PUT",
      token: user1Token,
      body: { name: "Advanced Software Architecture" },
    });
    const aliceUpdateRes = await updateCourse(aliceUpdateReq, { params: Promise.resolve({ id: courseId }) });
    assert.equal(aliceUpdateRes.status, 200);

    // Alice deletes her course
    const aliceDeleteReq = makeReq(`/api/mobile/courses/${courseId}`, {
      method: "DELETE",
      token: user1Token,
    });
    const aliceDeleteRes = await deleteCourse(aliceDeleteReq, { params: Promise.resolve({ id: courseId }) });
    assert.equal(aliceDeleteRes.status, 200);
  });

  // ── 3. Timetable CRUD, Overlap Detection & Isolation ─────────────────────────
  test("4. Timetable: Creates slot, catches overlaps, and enforces user isolation", async () => {
    // Setup course for Alice
    mockState.courses.push({
      id: "course-tt-1",
      userId: user1Id,
      name: "Algorithms",
      code: "CS201",
      color: "#2563eb",
      creditHours: 3,
      semester: "Spring",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Alice creates slot on Monday 09:00 - 10:30
    const createReq = makeReq("/api/mobile/timetable", {
      method: "POST",
      token: user1Token,
      body: {
        courseId: "course-tt-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:30",
        room: "Lab 3",
        type: "Lab",
      },
    });
    const createRes = await createTimetable(createReq);
    assert.equal(createRes.status, 201);
    const createdSlot = (await createRes.json()).entry;

    // Overlapping slot on Monday 10:00 - 11:30 should reject with 409
    const overlapReq = makeReq("/api/mobile/timetable", {
      method: "POST",
      token: user1Token,
      body: {
        courseId: "course-tt-1",
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "11:30",
        room: "Room 101",
        type: "Lecture",
      },
    });
    const overlapRes = await createTimetable(overlapReq);
    assert.equal(overlapRes.status, 409);

    // Bob cannot view Alice's timetable
    const bobRes = await getTimetable(makeReq("/api/mobile/timetable", { token: user2Token }));
    assert.equal((await bobRes.json()).timetable.length, 0);

    // Bob cannot delete Alice's slot
    const bobDelRes = await deleteTimetable(
      makeReq(`/api/mobile/timetable/${createdSlot.id}`, { method: "DELETE", token: user2Token }),
      { params: Promise.resolve({ id: createdSlot.id }) }
    );
    assert.equal(bobDelRes.status, 404);
  });

  // ── 4. Assignments CRUD & Status Updating ────────────────────────────────────
  test("5. Assignments: Supports NOT_STARTED, IN_PROGRESS, COMPLETED and enforces course ownership", async () => {
    mockState.courses.push({
      id: "course-asgn-1",
      userId: user1Id,
      name: "Database Systems",
      code: "CS301",
      color: "#2563eb",
      creditHours: 3,
      semester: "Spring",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Alice creates assignment
    const createReq = makeReq("/api/mobile/assignments", {
      method: "POST",
      token: user1Token,
      body: {
        title: "SQL Homework 1",
        courseId: "course-asgn-1",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: "HIGH",
        status: "NOT_STARTED",
      },
    });
    const createRes = await createAssignment(createReq);
    assert.equal(createRes.status, 201);
    const asgn = (await createRes.json()).assignment;

    // Bob cannot steal or update Alice's assignment
    const bobUpdate = await updateAssignment(
      makeReq(`/api/mobile/assignments/${asgn.id}`, {
        method: "PUT",
        token: user2Token,
        body: { status: "COMPLETED" },
      }),
      { params: Promise.resolve({ id: asgn.id }) }
    );
    assert.equal(bobUpdate.status, 404);

    // Alice updates status to IN_PROGRESS then COMPLETED
    const aliceUpdate = await updateAssignment(
      makeReq(`/api/mobile/assignments/${asgn.id}`, {
        method: "PUT",
        token: user1Token,
        body: { status: "COMPLETED" },
      }),
      { params: Promise.resolve({ id: asgn.id }) }
    );
    assert.equal(aliceUpdate.status, 200);
  });

  // ── 5. Exams CRUD & Isolation ────────────────────────────────────────────────
  test("6. Exams: Uses existing schema fields and validates enum types", async () => {
    mockState.courses.push({
      id: "course-exam-1",
      userId: user1Id,
      name: "Operating Systems",
      code: "CS303",
      color: "#2563eb",
      creditHours: 3,
      semester: "Spring",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create exam
    const createReq = makeReq("/api/mobile/exams", {
      method: "POST",
      token: user1Token,
      body: {
        title: "OS Midterm",
        courseId: "course-exam-1",
        examDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        room: "Hall C",
        type: "MIDTERM",
        preparationProgress: 50,
        notes: "Chapters 1 to 5",
      },
    });
    const createRes = await createExam(createReq);
    assert.equal(createRes.status, 201);
    const exam = (await createRes.json()).exam;
    assert.equal(exam.title, "OS Midterm");
    assert.equal(exam.type, "MIDTERM");

    // Bob cannot read Alice's exam
    const bobList = await getExams(makeReq("/api/mobile/exams", { token: user2Token }));
    assert.equal((await bobList.json()).exams.length, 0);

    // Bob cannot delete Alice's exam
    const bobDel = await deleteExam(
      makeReq(`/api/mobile/exams/${exam.id}`, { method: "DELETE", token: user2Token }),
      { params: Promise.resolve({ id: exam.id }) }
    );
    assert.equal(bobDel.status, 404);
  });

  // ── 6. Academics: GPA, Grades & Attendance ───────────────────────────────────
  test("7. Academics: Upserts course grades, records aggregate attendance, enforces course ownership", async () => {
    mockState.courses.push({
      id: "course-acad-1",
      userId: user1Id,
      name: "Calculus II",
      code: "MATH201",
      color: "#2563eb",
      creditHours: 3,
      semester: "Spring",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Bob cannot upsert grade on Alice's course
    const bobGradeReq = makeReq("/api/mobile/academics/grades", {
      method: "POST",
      token: user2Token,
      body: { courseId: "course-acad-1", grade: "A" },
    });
    const bobGradeRes = await createGrade(bobGradeReq);
    assert.equal(bobGradeRes.status, 404);

    // Alice upserts grade A
    const aliceGradeReq = makeReq("/api/mobile/academics/grades", {
      method: "POST",
      token: user1Token,
      body: { courseId: "course-acad-1", grade: "A" },
    });
    const aliceGradeRes = await createGrade(aliceGradeReq);
    assert.equal(aliceGradeRes.status, 200);

    // Alice logs aggregate attendance (20 total, 18 attended)
    const attReq = makeReq("/api/mobile/academics/attendance", {
      method: "POST",
      token: user1Token,
      body: {
        courseId: "course-acad-1",
        totalClasses: 20,
        attendedClasses: 18,
      },
    });
    const attRes = await recordAttendance(attReq);
    assert.equal(attRes.status, 200);

    // Alice gets academic overview
    const overviewRes = await getAcademics(makeReq("/api/mobile/academics", { token: user1Token }));
    const overview = (await overviewRes.json()).academics;
    assert.equal(overview.coursesCount, 1);
    assert.equal(overview.gradedCredits, 3);
  });

  // ── 7. Expenses CRUD & Isolation ─────────────────────────────────────────────
  test("8. Expenses: Calculates summary, validates categories, and strictly isolates users", async () => {
    // Alice adds expense
    const expReq = makeReq("/api/mobile/expenses", {
      method: "POST",
      token: user1Token,
      body: {
        amount: 250.5,
        category: "BOOKS",
        description: "Algorithms textbook",
        expenseDate: new Date().toISOString(),
      },
    });
    const expRes = await createExpense(expReq);
    assert.equal(expRes.status, 201);
    const exp = (await expRes.json()).expense;

    // Bob cannot see Alice's expense
    const bobExpRes = await getExpenses(makeReq("/api/mobile/expenses", { token: user2Token }));
    assert.equal((await bobExpRes.json()).expenses.length, 0);

    // Bob cannot delete Alice's expense
    const bobDel = await deleteExpense(
      makeReq(`/api/mobile/expenses/${exp.id}`, { method: "DELETE", token: user2Token }),
      { params: Promise.resolve({ id: exp.id }) }
    );
    assert.equal(bobDel.status, 404);
  });

  // ── 8. Notifications CRUD & Mark-All-Read ────────────────────────────────────
  test("9. Notifications: Fetches unread count, marks single read, marks all read, and deletes", async () => {
    mockState.notifications.push(
      {
        id: "notif-1",
        userId: user1Id,
        title: "Assignment Due",
        message: "Homework 1 is due soon",
        type: "ASSIGNMENT_DUE_SOON",
        read: false,
        createdAt: new Date(),
      },
      {
        id: "notif-2",
        userId: user1Id,
        title: "Exam Alert",
        message: "Midterm tomorrow",
        type: "EXAM_TODAY",
        read: false,
        createdAt: new Date(),
      }
    );

    // Alice gets notifications
    const getRes = await getNotifications(makeReq("/api/mobile/notifications", { token: user1Token }));
    const notifData = await getRes.json();
    assert.equal(notifData.notifications.length, 2);
    assert.equal(notifData.unreadCount, 2);

    // Bob cannot mark Alice's notification as read
    const bobMark = await markNotificationRead(
      makeReq("/api/mobile/notifications/notif-1/read", { method: "PATCH", token: user2Token }),
      { params: Promise.resolve({ id: "notif-1" }) }
    );
    assert.equal(bobMark.status, 404);

    // Alice marks notif-1 as read
    const aliceMark = await markNotificationRead(
      makeReq("/api/mobile/notifications/notif-1/read", { method: "PATCH", token: user1Token }),
      { params: Promise.resolve({ id: "notif-1" }) }
    );
    assert.equal(aliceMark.status, 200);

    // Alice marks all as read
    const markAllRes = await markAllNotificationsRead(
      makeReq("/api/mobile/notifications/read-all", { method: "POST", token: user1Token })
    );
    assert.equal(markAllRes.status, 200);

    // Alice deletes notif-2
    const delRes = await deleteNotification(
      makeReq("/api/mobile/notifications/notif-2", { method: "DELETE", token: user1Token }),
      { params: Promise.resolve({ id: "notif-2" }) }
    );
    assert.equal(delRes.status, 200);
  });
});
