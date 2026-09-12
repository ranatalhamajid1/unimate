import "./setup-prisma";
import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetMockState, mockState } from "./setup-prisma";
import {
  calculateProfileCompletion,
  getProfileCompletionDetails,
  validateUsername,
  getUserProfile,
} from "../app/lib/profile";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  deleteNotification,
  generateAcademicNotifications,
  createNotification,
} from "../app/lib/notifications";
import { NOTIFICATION_TYPES } from "../app/lib/notification-definitions";
import { GET as universalSearch } from "../app/api/search/route";
import { generateMobileToken } from "../app/lib/mobile-auth";
import { NextRequest } from "next/server";

describe("Milestone 13: Student Experience 3.0 — Personalization, UX & Global Student Workspace", () => {
  let userAlice: any;
  let userBob: any;
  let userAttacker: any;
  let univFAST: any;
  let univNUST: any;
  let campusIsb: any;
  let campusLhr: any;
  let deptCS_FAST: any;
  let deptCS_NUST: any;

  let aliceToken: string;
  let bobToken: string;

  beforeEach(async () => {
    resetMockState();

    // 1. Universities & Campuses
    univFAST = { id: "univ-fast", name: "FAST NUCES", shortName: "FAST", country: "Pakistan", isVerified: true };
    univNUST = { id: "univ-nust", name: "NUST", shortName: "NUST", country: "Pakistan", isVerified: true };
    mockState.universities.push(univFAST, univNUST);

    campusIsb = { id: "campus-isb", name: "Islamabad Campus", universityId: "univ-fast", isMain: true };
    campusLhr = { id: "campus-lhr", name: "Lahore Campus", universityId: "univ-fast", isMain: false };
    mockState.campuses.push(campusIsb, campusLhr);

    deptCS_FAST = { id: "dept-cs-fast", name: "Computer Science", universityId: "univ-fast" };
    deptCS_NUST = { id: "dept-cs-nust", name: "Computer Science", universityId: "univ-nust" };
    mockState.departments.push(deptCS_FAST, deptCS_NUST);

    // 2. Users (Tenants)
    userAlice = {
      id: "usr-alice",
      name: "Alice Smith",
      email: "alice@fast.edu.pk",
      username: "alice_smith",
      country: "Pakistan",
      universityId: "univ-fast",
      campusId: "campus-isb",
      departmentId: "dept-cs-fast",
      degreeProgram: "BS Computer Science",
      currentSemester: "Semester 5",
      graduationYear: 2027,
      bio: "Undergraduate CS student passionate about distributed systems.",
      avatarUrl: "https://example.com/alice.jpg",
      isPublicProfile: false,
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userBob = {
      id: "usr-bob",
      name: "Bob Jones",
      email: "bob@fast.edu.pk",
      username: "bob_jones",
      country: "Pakistan",
      universityId: "univ-fast",
      campusId: "campus-lhr", // Different campus!
      departmentId: "dept-cs-fast",
      degreeProgram: "BS Computer Science",
      currentSemester: "Semester 3",
      graduationYear: 2028,
      isPublicProfile: false,
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userAttacker = {
      id: "usr-attacker",
      name: "Mallory Attacker",
      email: "attacker@malicious.com",
      isPublicProfile: false,
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockState.users.push(userAlice, userBob, userAttacker);

    aliceToken = await generateMobileToken({ userId: userAlice.id, name: userAlice.name, email: userAlice.email });
    bobToken = await generateMobileToken({ userId: userBob.id, name: userBob.name, email: userBob.email });

    // 3. Alice's Personal Data
    mockState.courses.push({
      id: "crs-alice-algo",
      userId: userAlice.id,
      name: "Design and Analysis of Algorithms",
      code: "CS301",
      color: "#2563eb",
    });

    mockState.assignments.push({
      id: "asgn-alice-p1",
      userId: userAlice.id,
      courseId: "crs-alice-algo",
      title: "Algorithms Problem Set 1",
      description: "Divide and conquer analysis",
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days
      status: "in-progress",
    });

    mockState.exams.push({
      id: "exam-alice-mid",
      userId: userAlice.id,
      courseId: "crs-alice-algo",
      title: "Algorithms Midterm Exam",
      examDate: new Date(Date.now() + 86400000 * 5),
    });

    mockState.studentGoals.push({
      id: "goal-alice-gpa",
      userId: userAlice.id,
      title: "Semester Target GPA 3.8",
      type: "TARGET_GPA",
      targetValue: 3.8,
      period: "SEMESTER",
      active: true,
    });

    // 4. Bob's Personal Data (Isolated)
    mockState.courses.push({
      id: "crs-bob-db",
      userId: userBob.id,
      name: "Database Systems",
      code: "CS302",
      color: "#10b981",
    });

    mockState.assignments.push({
      id: "asgn-bob-sql",
      userId: userBob.id,
      courseId: "crs-bob-db",
      title: "SQL Query Optimization",
      description: "Index tuning",
      dueDate: new Date(Date.now() + 86400000 * 2),
      status: "in-progress",
    });

    // 5. Campus Communities
    // Public FAST community
    mockState.communities.push({
      id: "comm-fast-public",
      name: "FAST Computing Society",
      slug: "fast-cs-society",
      universityId: "univ-fast",
      campusId: null,
      visibility: "PUBLIC",
      moderationStatus: "APPROVED",
      isVerified: true,
    });

    // Campus-only Lahore community (Alice is in Islamabad)
    mockState.communities.push({
      id: "comm-fast-lhr-only",
      name: "FAST Lahore Robotics",
      slug: "fast-lhr-robotics",
      universityId: "univ-fast",
      campusId: "campus-lhr",
      visibility: "CAMPUS_ONLY",
      moderationStatus: "APPROVED",
      isVerified: false,
    });

    // Private community where Alice is NOT an active member
    mockState.communities.push({
      id: "comm-private-secret",
      name: "Alpha Secret Study Group",
      slug: "alpha-secret",
      universityId: "univ-fast",
      visibility: "PRIVATE",
      moderationStatus: "APPROVED",
      isVerified: false,
    });

    // Banned community (must NEVER be exposed)
    mockState.communities.push({
      id: "comm-banned",
      name: "Banned Underground Club",
      slug: "banned-club",
      universityId: "univ-fast",
      visibility: "PUBLIC",
      moderationStatus: "BANNED",
      isVerified: false,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. PROFILE COMPLETION ENGINE & PRIVACY
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Profile Completion Engine & Identity Privacy", () => {
    test("calculates 100% when all 10 checkpoints are fulfilled", () => {
      const details = getProfileCompletionDetails(userAlice);
      assert.equal(details.percentage, 100);
      assert.equal(details.completedCount, 10);
      assert.equal(details.totalCount, 10);
      assert.equal(details.nextSuggestedAction, null);
    });

    test("calculates deterministic partial completion (5/10 = 50%)", () => {
      const partialUser = {
        avatarUrl: null,
        username: "student_partial",
        bio: null,
        country: "Pakistan",
        universityId: "univ-fast",
        campusId: "campus-isb",
        departmentId: null,
        degreeProgram: "BSCS",
        currentSemester: null,
        graduationYear: null,
      };

      const details = getProfileCompletionDetails(partialUser);
      assert.equal(details.percentage, 50);
      assert.equal(details.completedCount, 5);
      assert.equal(details.totalCount, 10);
      assert.ok(details.nextSuggestedAction);
      assert.equal(details.nextSuggestedAction.key, "avatarUrl");
    });

    test("profile is private by default and getUserProfile never leaks passwordHash", async () => {
      const profile = await getUserProfile(userAlice.id);
      assert.ok(profile);
      assert.equal(profile.isPublicProfile, false);
      assert.equal((profile as any).passwordHash, undefined);
      assert.equal(profile.email, userAlice.email);
      assert.equal(profile.profileCompletionPercentage, 100);
      assert.ok(profile.completionDetails);
      assert.equal(profile.completionDetails.percentage, 100);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. UNIVERSAL SEARCH API: MULTI-TENANT ISOLATION & CAMPUS PRIVACY
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Universal Search API Multi-Tenant Isolation", () => {
    test("unauthenticated search returns 401 Unauthorized", async () => {
      const req = new NextRequest("http://localhost/api/search?q=algo");
      const res = await universalSearch(req);
      assert.equal(res.status, 401);
    });

    test("query length < 2 returns empty categorized results without searching", async () => {
      const req = new NextRequest("http://localhost/api/search?q=a", {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });
      const res = await universalSearch(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.totalCount, 0);
      assert.equal(data.personal.courses.length, 0);
      assert.equal(data.campus.communities.length, 0);
    });

    test("Alice searches 'algo' and receives her personal course, assignment, exam, and goal", async () => {
      const req = new NextRequest("http://localhost/api/search?q=algo", {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });
      const res = await universalSearch(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.ok(data.personal.courses.some((c: any) => c.title.includes("Algorithms")));
      assert.ok(data.personal.assignments.some((a: any) => a.title.includes("Algorithms")));
      assert.ok(data.personal.exams.some((e: any) => e.title.includes("Algorithms")));
    });

    test("Security Isolation: Alice CANNOT search or discover Bob's personal assignments or courses", async () => {
      // Bob has "SQL Query Optimization" and "Database Systems"
      const req = new NextRequest("http://localhost/api/search?q=SQL", {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });
      const res = await universalSearch(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      // Alice must NOT see Bob's SQL assignment
      assert.equal(data.personal.assignments.length, 0);
      assert.equal(data.personal.courses.length, 0);
    });

    test("Campus Privacy: Campus-only community cannot cross campus boundary", async () => {
      // "FAST Lahore Robotics" is CAMPUS_ONLY for campus-lhr.
      // Alice is on campus-isb; she must NOT discover it.
      const reqAlice = new NextRequest("http://localhost/api/search?q=Robotics", {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });
      const resAlice = await universalSearch(reqAlice);
      assert.equal(resAlice.status, 200);
      const dataAlice = await resAlice.json();
      assert.equal(dataAlice.campus.communities.length, 0);

      // Bob IS on campus-lhr; Bob CAN discover it.
      const reqBob = new NextRequest("http://localhost/api/search?q=Robotics", {
        headers: { Authorization: `Bearer ${bobToken}` },
      });
      const resBob = await universalSearch(reqBob);
      assert.equal(resBob.status, 200);
      const dataBob = await resBob.json();
      assert.equal(dataBob.campus.communities.length, 1);
      assert.equal(dataBob.campus.communities[0].slug, "fast-lhr-robotics");
    });

    test("Campus Privacy: Private community existence is never leaked to non-members", async () => {
      const req = new NextRequest("http://localhost/api/search?q=Secret", {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });
      const res = await universalSearch(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.campus.communities.length, 0);
    });

    test("Campus Privacy: Banned community is never returned under any circumstances", async () => {
      const req = new NextRequest("http://localhost/api/search?q=Banned", {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });
      const res = await universalSearch(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.campus.communities.length, 0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. NOTIFICATION CENTER 2.0: DISMISSAL & DEDUPLICATION INVARIANTS
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. Notification Center 2.0 Invariants", () => {
    test("deleting a notification marks it dismissed and does not recreate it on subsequent generation", async () => {
      // 1. Create overdue assignment for Alice
      const overdueAsgn = {
        id: "asgn-overdue-1",
        userId: userAlice.id,
        courseId: "crs-alice-algo",
        title: "Overdue Lab",
        dueDate: new Date(Date.now() - 3600000 * 24), // 1 day in the past
        status: "in-progress",
        course: { name: "Algorithms", code: "CS301" },
      };
      mockState.assignments.push(overdueAsgn);

      // 2. Generate notifications
      const createdCount = await generateAcademicNotifications(userAlice.id);
      assert.ok(createdCount > 0);

      const notifs = await getUserNotifications(userAlice.id);
      const overdueNotif = notifs.find((n) => n.relatedId === "asgn-overdue-1:overdue");
      assert.ok(overdueNotif, "Overdue notification must be created");

      // 3. Alice deletes (dismisses) the notification
      const delSuccess = await deleteNotification(userAlice.id, overdueNotif.id);
      assert.equal(delSuccess, true);

      // 4. Deleted notification must not appear in active notifications list
      const notifsAfterDel = await getUserNotifications(userAlice.id);
      assert.ok(!notifsAfterDel.some((n) => n.id === overdueNotif.id), "Deleted notification must not appear in active list");

      // 5. Subsequent run of generateAcademicNotifications must NOT recreate it
      const regeneratedCount = await generateAcademicNotifications(userAlice.id);
      assert.equal(regeneratedCount, 0, "Dismissed notification must not be recreated");

      const notifsFinal = await getUserNotifications(userAlice.id);
      assert.ok(!notifsFinal.some((n) => n.relatedId === "asgn-overdue-1:overdue"));
    });

    test("notification mutations enforce strict user tenant isolation", async () => {
      const notif = await createNotification(userAlice.id, {
        type: NOTIFICATION_TYPES.ATTENDANCE_WARNING,
        title: "Alice Attendance Alert",
        message: "Attendance warning message",
        relatedId: "crs-alice-algo:warning",
      });
      assert.ok(notif);

      // Attacker attempts to mark Alice's notification as read
      const attackerMark = await markNotificationAsRead(userAttacker.id, notif.id);
      assert.equal(attackerMark, false, "Cross-user mark read must return false");

      // Attacker attempts to delete Alice's notification
      const attackerDel = await deleteNotification(userAttacker.id, notif.id);
      assert.equal(attackerDel, false, "Cross-user delete must return false");

      // Alice can successfully mark it as read
      const ownMark = await markNotificationAsRead(userAlice.id, notif.id);
      assert.equal(ownMark, true);
    });
  });
});
