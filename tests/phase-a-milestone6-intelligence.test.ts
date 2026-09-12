import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockPrisma, resetMockState, mockState } from "./setup-prisma";

// Import Deterministic Intelligence Engines
import { calculateTaskUrgency, RawTaskInput } from "../app/lib/intelligence/priority-engine";
import { simulateGpaCalculation, CourseGradeState, CourseSimulationInput } from "../app/lib/intelligence/gpa-simulator";
import { calculateAttendanceInsight } from "../app/lib/intelligence/attendance-intel";
import { calculateExamReadiness } from "../app/lib/intelligence/exam-readiness";
import { detectScheduleGaps, TimetableSlotInput } from "../app/lib/intelligence/schedule-gaps";

import { generateMobileToken } from "../app/lib/mobile-auth";

// Route Handlers
import { GET as getBriefing } from "../app/api/intelligence/briefing/route";
import { POST as postGpaSimulator } from "../app/api/intelligence/gpa-simulator/route";
import { GET as getAttendanceInsights } from "../app/api/intelligence/attendance-insights/route";
import { GET as getExamReadiness } from "../app/api/intelligence/exam-readiness/route";
import { GET as getWeeklyProgress } from "../app/api/intelligence/weekly-progress/route";

function createMockRequest(url: string, options: any = {}) {
  const headers = new Headers(options.headers || {});
  return {
    url,
    headers,
    json: async () => options.json || {},
  } as any;
}

describe("Milestone 6: Student Intelligence Engine Test Suite", () => {
  const baseNow = new Date("2026-10-15T10:00:00.000Z");

  // -------------------------------------------------------------------------
  // 1. SMART PRIORITY ENGINE
  // -------------------------------------------------------------------------
  describe("1. Deterministic Priority Engine", () => {
    test("Overdue task receives maximum score (100) and OVERDUE tier", () => {
      const pastDate = new Date("2026-10-14T10:00:00.000Z"); // 24h overdue
      const task: RawTaskInput = {
        id: "task-1",
        courseId: "c-1",
        courseName: "Algorithms",
        courseCode: "CS201",
        title: "Assignment 1",
        dueDate: pastDate,
        priority: "MEDIUM",
        status: "NOT_STARTED",
      };

      const result = calculateTaskUrgency(task, null, baseNow);
      assert.equal(result.urgencyScore, 100);
      assert.equal(result.urgencyTier, "OVERDUE");
      assert.ok(result.deadlineLabel.includes("Overdue by 1 day"));
      assert.ok(result.reason.includes("Overdue by 1 day"));
    });

    test("Due today task receives base score 65 and CRITICAL tier", () => {
      const dueToday = new Date("2026-10-15T22:00:00.000Z"); // 12 hours away
      const task: RawTaskInput = {
        id: "task-2",
        courseId: "c-1",
        courseName: "Algorithms",
        courseCode: "CS201",
        title: "Lab Report",
        dueDate: dueToday,
        priority: "NORMAL",
        status: "NOT_STARTED",
      };

      const result = calculateTaskUrgency(task, null, baseNow);
      assert.equal(result.urgencyScore, 65);
      assert.equal(result.urgencyTier, "CRITICAL");
      assert.equal(result.deadlineLabel, "Due today");
      assert.ok(result.reason.includes("Due within 24 hours"));
    });

    test("Due tomorrow task receives score 50 and HIGH tier", () => {
      const dueTomorrow = new Date("2026-10-16T18:00:00.000Z"); // 32 hours away
      const task: RawTaskInput = {
        id: "task-3",
        courseId: "c-1",
        courseName: "Algorithms",
        courseCode: "CS201",
        title: "Problem Set",
        dueDate: dueTomorrow,
        priority: "LOW",
        status: "NOT_STARTED",
      };

      const result = calculateTaskUrgency(task, null, baseNow);
      assert.equal(result.urgencyScore, 50);
      assert.equal(result.urgencyTier, "HIGH");
      assert.equal(result.deadlineLabel, "Due tomorrow");
    });

    test("HIGH priority adds +20 points and promotes tier", () => {
      const dueIn4Days = new Date("2026-10-19T10:00:00.000Z");
      const task: RawTaskInput = {
        id: "task-4",
        courseId: "c-1",
        courseName: "Operating Systems",
        courseCode: "CS301",
        title: "Kernel Project",
        dueDate: dueIn4Days,
        priority: "HIGH",
        status: "NOT_STARTED",
      };

      const result = calculateTaskUrgency(task, null, baseNow);
      // 35 base (3-5 days) + 20 (HIGH) = 55
      assert.equal(result.urgencyScore, 55);
      assert.equal(result.urgencyTier, "HIGH");
      assert.ok(result.reason.includes("Marked as High priority"));
    });

    test("Related course exam in <= 7 days adds +15 exam proximity boost", () => {
      const dueIn4Days = new Date("2026-10-19T10:00:00.000Z");
      const task: RawTaskInput = {
        id: "task-5",
        courseId: "c-1",
        courseName: "Operating Systems",
        courseCode: "CS301",
        title: "Kernel Project",
        dueDate: dueIn4Days,
        priority: "HIGH",
        status: "NOT_STARTED",
      };

      // Related exam in 3 days
      const result = calculateTaskUrgency(task, 3, baseNow);
      // 35 base + 20 priority + 15 exam = 70
      assert.equal(result.urgencyScore, 70);
      assert.ok(result.reason.includes("Related course exam in 3 days"));
    });

    test("Urgency score is strictly clamped between 0 and 100", () => {
      const overdue = new Date("2026-10-10T10:00:00.000Z");
      const task: RawTaskInput = {
        id: "task-6",
        courseId: "c-1",
        courseName: "Algorithms",
        courseCode: "CS201",
        title: "Overdue High Task",
        dueDate: overdue,
        priority: "HIGH",
        status: "NOT_STARTED",
      };

      const result = calculateTaskUrgency(task, 1, baseNow);
      assert.equal(result.urgencyScore, 100);
    });
  });

  // -------------------------------------------------------------------------
  // 2. GPA WHAT-IF SIMULATION ENGINE
  // -------------------------------------------------------------------------
  describe("2. Pure GPA Simulation Engine", () => {
    const sampleCourses: CourseGradeState[] = [
      {
        courseId: "c-1",
        courseName: "Data Structures",
        courseCode: "CS201",
        creditHours: 3,
        currentGrade: "B+",
        currentGradePoints: 3.3,
        isGraded: true,
      },
      {
        courseId: "c-2",
        courseName: "Linear Algebra",
        courseCode: "MATH201",
        creditHours: 3,
        currentGrade: "B",
        currentGradePoints: 3.0,
        isGraded: true,
      },
      {
        courseId: "c-3",
        courseName: "Software Engineering",
        courseCode: "CS305",
        creditHours: 4,
        currentGrade: null,
        currentGradePoints: null,
        isGraded: false,
      },
    ];

    test("Calculates current GPA accurately based on graded courses", () => {
      const result = simulateGpaCalculation(sampleCourses, [], 3.5);
      // Graded: CS201 (3 * 3.3 = 9.9) + MATH201 (3 * 3.0 = 9.0) = 18.9 / 6 = 3.15
      assert.equal(result.currentGpa, 3.15);
      assert.equal(result.gradedCredits, 6);
      assert.equal(result.totalCredits, 10);
      assert.equal(result.targetGpa, 3.5);
      assert.equal(result.targetMet, false);
    });

    test("Simulating an 'A' on an ungraded 4-credit course raises projected GPA", () => {
      const scenarios: CourseSimulationInput[] = [
        { courseId: "c-3", simulatedGrade: "A" }, // 4 credits * 4.0 = 16.0
      ];

      const result = simulateGpaCalculation(sampleCourses, scenarios, 3.5);
      // Total points: 18.9 (existing) + 16.0 (simulated) = 34.9 / 10 = 3.49
      assert.equal(result.projectedGpa, 3.49);
      assert.equal(result.delta, 0.34);
      assert.equal(result.deltaString, "+0.34");
      assert.equal(result.targetMet, false); // 3.49 < 3.50
    });

    test("Simulating 'A+' on multiple courses meets or exceeds target GPA", () => {
      const scenarios: CourseSimulationInput[] = [
        { courseId: "c-2", simulatedGrade: "A" },  // replace B (3.0) with A (4.0) -> +3.0 pts
        { courseId: "c-3", simulatedGrade: "A+" }, // 4 * 4.0 = 16.0 pts
      ];

      const result = simulateGpaCalculation(sampleCourses, scenarios, 3.5);
      // Points: CS201 (9.9) + MATH201 simulated (12.0) + CS305 simulated (16.0) = 37.9 / 10 = 3.79
      assert.equal(result.projectedGpa, 3.79);
      assert.equal(result.delta, 0.64);
      assert.equal(result.targetMet, true); // 3.79 >= 3.50
    });

    test("Handles ungradeable courses and invalid scenario input gracefully", () => {
      const scenarios: CourseSimulationInput[] = [
        { courseId: "non-existent", simulatedGrade: "A" },
        { courseId: "c-3", simulatedGrade: "INVALID_GRADE" },
      ];

      const result = simulateGpaCalculation(sampleCourses, scenarios);
      // Ungraded c-3 remains unsimulated, current GPA matches projected GPA
      assert.equal(result.currentGpa, 3.15);
      assert.equal(result.projectedGpa, 3.15);
      assert.equal(result.delta, 0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. ATTENDANCE INTELLIGENCE ENGINE
  // -------------------------------------------------------------------------
  describe("3. Configurable Attendance Intelligence Engine", () => {
    test("Returns INSUFFICIENT_DATA when total classes is 0", () => {
      const result = calculateAttendanceInsight(0, 0, 0.75);
      assert.equal(result.status, "INSUFFICIENT_DATA");
      assert.equal(result.percentage, null);
      assert.equal(result.safeBufferClasses, 0);
      assert.equal(result.recoveryClassesRequired, 0);
      assert.ok(result.recommendation.includes("Insufficient attendance records"));
    });

    test("Calculates AT_RISK status and required recovery classes when below threshold", () => {
      // 14 attended out of 22 total = 63.6% (below 75%)
      const result = calculateAttendanceInsight(14, 22, 0.75);
      assert.equal(result.status, "AT_RISK");
      assert.equal(result.percentage, 63.6);
      // Recovery formula: ceil((0.75 * 22 - 14) / (1 - 0.75)) = ceil((16.5 - 14) / 0.25) = ceil(2.5 / 0.25) = 10
      assert.equal(result.recoveryClassesRequired, 10);
      assert.equal(result.safeBufferClasses, 0);
      assert.ok(result.recommendation.includes("attend the next 10 consecutive classes"));
      assert.ok(result.recommendation.includes("configured threshold (75%)"));
    });

    test("Calculates WATCH status and remaining safe buffer when close to threshold", () => {
      // 18 attended out of 23 total = 78.3% (between 75% and 80%)
      const resultWithBuffer = calculateAttendanceInsight(18, 23, 0.75);
      assert.equal(resultWithBuffer.status, "WATCH");
      assert.equal(resultWithBuffer.percentage, 78.3);
      // Buffer: floor((18 - 0.75 * 23) / 0.75) = floor(0.75 / 0.75) = 1
      assert.equal(resultWithBuffer.safeBufferClasses, 1);
      assert.ok(resultWithBuffer.recommendation.includes("Attendance is close to the limit"));
      assert.ok(resultWithBuffer.recommendation.includes("miss approximately 1 future class"));

      // 17 attended out of 22 total = 77.3% (buffer = 0, right at threshold)
      const resultEdge = calculateAttendanceInsight(17, 22, 0.75);
      assert.equal(resultEdge.status, "WATCH");
      assert.equal(resultEdge.safeBufferClasses, 0);
      assert.ok(resultEdge.recommendation.includes("Attendance is right at the threshold"));
    });

    test("Calculates SAFE status and comfortable buffer when well above threshold", () => {
      // 26 attended out of 28 total = 92.9% (well above 75%)
      const result = calculateAttendanceInsight(26, 28, 0.75);
      assert.equal(result.status, "SAFE");
      assert.equal(result.percentage, 92.9);
      // Buffer: floor((26 - 0.75 * 28) / 0.75) = floor((26 - 21) / 0.75) = floor(5 / 0.75) = 6
      assert.equal(result.safeBufferClasses, 6);
      assert.equal(result.recoveryClassesRequired, 0);
      assert.ok(result.recommendation.includes("miss approximately 6 future classes"));
      assert.ok(result.recommendation.includes("configured threshold (75%)"));
    });

    test("Supports custom configurable threshold (e.g. 80% or 70%)", () => {
      // 20 attended out of 25 = 80.0%
      // At 85% threshold, 80% is AT_RISK
      const resultHighThreshold = calculateAttendanceInsight(20, 25, 0.85);
      assert.equal(resultHighThreshold.status, "AT_RISK");
      assert.ok(resultHighThreshold.recommendation.includes("85%"));

      // At 70% threshold, 80% is SAFE
      const resultLowThreshold = calculateAttendanceInsight(20, 25, 0.70);
      assert.equal(resultLowThreshold.status, "SAFE");
      assert.ok(resultLowThreshold.recommendation.includes("70%"));
    });
  });

  // -------------------------------------------------------------------------
  // 4. EXAM PREPARATION READINESS ENGINE
  // -------------------------------------------------------------------------
  describe("4. Exam Preparation Readiness Engine", () => {
    test("Returns INSUFFICIENT DATA when preparation progress has not been recorded", () => {
      const examDate = new Date("2026-10-20T09:00:00.000Z"); // 5 days away
      const result = calculateExamReadiness(examDate, null, false, baseNow);
      assert.equal(result.status, "INSUFFICIENT DATA");
      assert.equal(result.suggestedFocusHours, null);
      assert.ok(result.recommendation.includes("Update your preparation progress"));
    });

    test("Classifies imminent exam (<= 2 days) with low progress as AT RISK", () => {
      const examDate = new Date("2026-10-16T09:00:00.000Z"); // 1 day away
      const result = calculateExamReadiness(examDate, 30, true, baseNow);
      assert.equal(result.status, "AT RISK");
      assert.equal(result.daysRemaining, 1);
      assert.equal(result.suggestedFocusHours, 6);
      assert.ok(result.recommendation.includes("Exam is imminent"));
    });

    test("Classifies exam in 5 days with 45% progress as NEEDS ATTENTION", () => {
      const examDate = new Date("2026-10-20T09:00:00.000Z"); // 5 days away
      const result = calculateExamReadiness(examDate, 45, true, baseNow);
      assert.equal(result.status, "NEEDS ATTENTION");
      assert.equal(result.daysRemaining, 5);
      assert.equal(result.suggestedFocusHours, 5);
      assert.ok(result.recommendation.includes("Exam in 5 days with 45% progress"));
    });

    test("Classifies exam in 5 days with 80% progress as ON TRACK", () => {
      const examDate = new Date("2026-10-20T09:00:00.000Z"); // 5 days away
      const result = calculateExamReadiness(examDate, 80, true, baseNow);
      assert.equal(result.status, "ON TRACK");
      assert.equal(result.daysRemaining, 5);
      assert.equal(result.suggestedFocusHours, 3);
      assert.ok(result.recommendation.includes("Preparation is on pace"));
    });

    test("Returns INSUFFICIENT DATA for passed exam date", () => {
      const pastExam = new Date("2026-10-10T09:00:00.000Z");
      const result = calculateExamReadiness(pastExam, 90, true, baseNow);
      assert.equal(result.status, "INSUFFICIENT DATA");
      assert.equal(result.daysRemaining, 0);
      assert.ok(result.recommendation.includes("passed"));
    });
  });

  // -------------------------------------------------------------------------
  // 5. SCHEDULE GAP DETECTION
  // -------------------------------------------------------------------------
  describe("5. Timetable Schedule Gap Detection", () => {
    test("Identifies open day when no classes are scheduled", () => {
      const gaps = detectScheduleGaps([]);
      assert.equal(gaps.length, 1);
      assert.equal(gaps[0].startTime, "08:00");
      assert.equal(gaps[0].endTime, "20:00");
      assert.ok(gaps[0].label.includes("Open day"));
    });

    test("Identifies free study windows >= 45 minutes between lectures", () => {
      const slots: TimetableSlotInput[] = [
        { startTime: "09:00", endTime: "10:30", courseName: "Database Systems" },
        { startTime: "12:00", endTime: "13:30", courseName: "Algorithms" },
        { startTime: "14:00", endTime: "15:00", courseName: "Operating Systems" },
      ];

      const gaps = detectScheduleGaps(slots, 8 * 60, 18 * 60, 45);
      // Gaps:
      // 1. 08:00 to 09:00 (60 mins)
      // 2. 10:30 to 12:00 (90 mins)
      // (13:30 to 14:00 is 30 mins, which is < 45 mins, so ignored)
      // 3. 15:00 to 18:00 (180 mins)
      assert.equal(gaps.length, 3);
      assert.equal(gaps[0].startTime, "08:00");
      assert.equal(gaps[0].endTime, "09:00");
      assert.equal(gaps[0].durationMinutes, 60);

      assert.equal(gaps[1].startTime, "10:30");
      assert.equal(gaps[1].endTime, "12:00");
      assert.equal(gaps[1].durationMinutes, 90);

      assert.equal(gaps[2].startTime, "15:00");
      assert.equal(gaps[2].endTime, "18:00");
      assert.equal(gaps[2].durationMinutes, 180);
    });
  });

  // -------------------------------------------------------------------------
  // 6. API AUTHENTICATION, ENTITLEMENTS & NON-MUTATING VERIFICATION
  // -------------------------------------------------------------------------
  describe("6. Intelligence API Layer & Security Safeguards", () => {
    let proUser: any;
    let freeUser: any;
    let proToken: string;
    let freeToken: string;

    beforeEach(async () => {
      resetMockState();

      proUser = await mockPrisma.user.create({
        data: {
          id: "pro-student-1",
          name: "Zainab Ali",
          email: "zainab@unimate.test",
          passwordHash: "$2a$10$testhash",
        },
      });

      freeUser = await mockPrisma.user.create({
        data: {
          id: "free-student-2",
          name: "Hamza Tariq",
          email: "hamza@unimate.test",
          passwordHash: "$2a$10$testhash",
        },
      });

      // Pro subscription
      mockState.subscriptions.push({
        id: "sub-pro",
        userId: proUser.id,
        plan: "PRO",
        status: "ACTIVE",
        provider: "MOCK",
      });

      // Free subscription
      mockState.subscriptions.push({
        id: "sub-free",
        userId: freeUser.id,
        plan: "FREE",
        status: "ACTIVE",
        provider: "NONE",
      });

      proToken = await generateMobileToken({ userId: proUser.id, name: proUser.name, email: proUser.email });
      freeToken = await generateMobileToken({ userId: freeUser.id, name: freeUser.name, email: freeUser.email });

      // Seed academic records for Pro user
      const course1 = await mockPrisma.course.create({
        data: {
          id: "course-1",
          userId: proUser.id,
          name: "Computer Networks",
          code: "CS401",
          creditHours: 3,
          color: "#2563eb",
        },
      });

      mockState.courseGrades.push({
        id: "grade-1",
        userId: proUser.id,
        courseId: course1.id,
        grade: "B+",
        gradePoints: 3.3,
      });

      mockState.attendance.push({
        id: "att-1",
        userId: proUser.id,
        courseId: course1.id,
        attendedClasses: 18,
        totalClasses: 20,
      });

      await mockPrisma.assignment.create({
        data: {
          id: "assign-1",
          userId: proUser.id,
          courseId: course1.id,
          title: "Packet Tracer Lab",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          priority: "HIGH",
          status: "NOT_STARTED",
        },
      });
    });

    test("Unauthenticated requests reject with 401 across all intelligence routes", async () => {
      const unauthReq = createMockRequest("http://localhost:3000/api/intelligence/briefing");
      const resBriefing = await getBriefing(unauthReq);
      assert.equal(resBriefing.status, 401);

      const resGpa = await postGpaSimulator(unauthReq);
      assert.equal(resGpa.status, 401);

      const resAtt = await getAttendanceInsights(unauthReq);
      assert.equal(resAtt.status, 401);

      const resExam = await getExamReadiness(unauthReq);
      assert.equal(resExam.status, 401);
    });

    test("GET /api/intelligence/briefing returns deterministic briefing for authenticated user", async () => {
      const req = createMockRequest("http://localhost:3000/api/intelligence/briefing", {
        headers: { authorization: `Bearer ${proToken}` },
      });

      const res = await getBriefing(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.headline.includes("Zainab"));
      assert.equal(json.data.topPriorities.length, 1);
      assert.equal(json.data.topPriorities[0].title, "Packet Tracer Lab");
      assert.ok(json.data.whyTheseMatter.length > 0);
    });

    test("POST /api/intelligence/gpa-simulator blocks FREE users with 403 UPGRADE_REQUIRED", async () => {
      const req = createMockRequest("http://localhost:3000/api/intelligence/gpa-simulator", {
        headers: { authorization: `Bearer ${freeToken}` },
        json: { scenarios: [{ courseId: "course-1", simulatedGrade: "A" }] },
      });

      const res = await postGpaSimulator(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, "UPGRADE_REQUIRED");
      assert.equal(json.feature, "ADVANCED_INSIGHTS");
    });

    test("POST /api/intelligence/gpa-simulator calculates for PRO user WITHOUT mutating database", async () => {
      const initialGradesCount = mockState.courseGrades.length;
      const initialGrade = mockState.courseGrades[0].grade;

      const req = createMockRequest("http://localhost:3000/api/intelligence/gpa-simulator", {
        headers: { authorization: `Bearer ${proToken}` },
        json: { scenarios: [{ courseId: "course-1", simulatedGrade: "A" }] },
      });

      const res = await postGpaSimulator(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.projectedGpa, 4.0);

      // Verify Database is completely untouched
      assert.equal(mockState.courseGrades.length, initialGradesCount);
      assert.equal(mockState.courseGrades[0].grade, initialGrade);
    });

    test("GET /api/intelligence/attendance-insights respects configurable threshold parameter", async () => {
      // 18 / 20 = 90%
      // Default 75% threshold -> SAFE
      const req75 = createMockRequest("http://localhost:3000/api/intelligence/attendance-insights?threshold=0.75", {
        headers: { authorization: `Bearer ${proToken}` },
      });
      const res75 = await getAttendanceInsights(req75);
      const json75 = await res75.json();
      assert.equal(json75.data.courses[0].status, "SAFE");
      assert.equal(json75.data.courses[0].thresholdPercentage, 75);

      // High 95% threshold -> AT_RISK
      const req95 = createMockRequest("http://localhost:3000/api/intelligence/attendance-insights?threshold=0.95", {
        headers: { authorization: `Bearer ${proToken}` },
      });
      const res95 = await getAttendanceInsights(req95);
      const json95 = await res95.json();
      assert.equal(json95.data.courses[0].status, "AT_RISK");
      assert.equal(json95.data.courses[0].thresholdPercentage, 95);
    });

    test("User Isolation: User B receives strictly User B's empty priorities and never sees User A's data", async () => {
      const req = createMockRequest("http://localhost:3000/api/intelligence/briefing", {
        headers: { authorization: `Bearer ${freeToken}` },
      });

      const res = await getBriefing(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.headline.includes("Hamza"));
      assert.equal(json.data.topPriorities.length, 0); // User B has 0 assignments
    });
  });
});
