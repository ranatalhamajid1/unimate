import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getUserCourses } from "@/app/lib/courses";
import { getTodayTimetable } from "@/app/lib/timetable";
import { getUpcomingAssignments } from "@/app/lib/assignments";
import { getUpcomingExams } from "@/app/lib/exams";
import { getAcademicOverview } from "@/app/lib/academic";
import { formatDueLabel } from "@/app/lib/assignment-definitions";
import { formatExamDate, formatExamTime, calculateDaysRemaining } from "@/app/lib/exam-definitions";

export type StudentAIContext = {
  studentName: string;
  currentDateStr: string;
  currentDayName: string;
  currentTimeStr: string;
  courses: Array<{
    name: string;
    code: string;
    instructor: string;
    creditHours: number;
    semester: string;
  }>;
  todayTimetable: Array<{
    course: string;
    startTime: string;
    endTime: string;
    room: string;
    type: string;
  }>;
  upcomingAssignments: Array<{
    title: string;
    course: string;
    dueDate: string;
    dueLabel: string;
    priority: string;
    status: string;
  }>;
  upcomingExams: Array<{
    title: string;
    course: string;
    examDate: string;
    examTime: string;
    daysRemaining: number;
    type: string;
    room: string;
    preparationProgress: number;
  }>;
  academics: {
    gpa: string;
    overallAttendance: string;
    gradedCredits: number;
    totalCredits: number;
    coursePerformance: Array<{
      courseName: string;
      courseCode: string;
      grade: string;
      gradePoints: number | null;
      attendancePercentage: number | null;
      attendanceStatus: string;
    }>;
  };
};

/**
 * Builds a secure, user-scoped academic context for the AI Study Buddy.
 * Strictly excludes:
 * - Passwords, hashes, authentication tokens
 * - Database IDs and credentials
 * - Financial/expense data
 */
export async function buildStudyBuddyContext(
  userId: string,
  defaultName?: string
): Promise<StudentAIContext> {
  const now = new Date();
  const jsDay = now.getDay();
  const todayDayIndex = jsDay === 0 ? 7 : jsDay;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayNames[jsDay];

  const currentDateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTimeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Parallel fetch of user data
  const [user, courses, timetable, assignments, exams, academics] = await Promise.all([
    prisma.user
      .findUnique({
        where: { id: userId },
        select: { name: true },
      })
      .catch(() => null),
    getUserCourses(userId),
    getTodayTimetable(userId, todayDayIndex),
    getUpcomingAssignments(userId, 10),
    getUpcomingExams(userId),
    getAcademicOverview(userId),
  ]);

  const studentName = user?.name || defaultName || "Student";

  return {
    studentName,
    currentDateStr,
    currentDayName,
    currentTimeStr,
    courses: courses.map((c) => ({
      name: c.name,
      code: c.code,
      instructor: c.instructor || "Not specified",
      creditHours: c.creditHours,
      semester: c.semester || "Current",
    })),
    todayTimetable: timetable.map((t) => ({
      course: t.course?.name || "Class",
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room || "TBA",
      type: t.type,
    })),
    upcomingAssignments: assignments.map((a) => ({
      title: a.title,
      course: a.course?.name || "General",
      dueDate: a.dueDate.toISOString().split("T")[0],
      dueLabel: formatDueLabel(a.dueDate, a.status).text,
      priority: a.priority,
      status: a.status,
    })),
    upcomingExams: exams.map((e) => {
      const days = calculateDaysRemaining(e.examDate);
      return {
        title: e.title,
        course: e.course?.name || "General",
        examDate: formatExamDate(e.examDate),
        examTime: formatExamTime(e.examDate),
        daysRemaining: days,
        type: e.type,
        room: e.room || "TBA",
        preparationProgress: e.preparationProgress,
      };
    }),
    academics: {
      gpa: academics.gpa !== null ? academics.gpaString : "Not available yet",
      overallAttendance:
        academics.overallAttendance !== null
          ? academics.attendanceString
          : "Not available yet",
      gradedCredits: academics.gradedCredits,
      totalCredits: academics.totalCredits,
      coursePerformance: academics.courses.map((item) => ({
        courseName: item.courseName,
        courseCode: item.courseCode,
        grade: item.grade || "In progress",
        gradePoints: item.gradePoints ?? null,
        attendancePercentage: item.attendancePercentage,
        attendanceStatus: item.attendanceStatus.label,
      })),
    },
  };
}

/**
 * Formats the student context into a concise, token-efficient prompt representation.
 */
export function formatContextPrompt(context: StudentAIContext): string {
  const lines: string[] = [];

  lines.push(`STUDENT PROFILE:`);
  lines.push(`Name: ${context.studentName}`);
  lines.push(`Current Date & Time: ${context.currentDateStr} (${context.currentDayName}), ${context.currentTimeStr}`);

  lines.push(`\nENROLLED COURSES (${context.courses.length}):`);
  if (context.courses.length === 0) {
    lines.push(`No enrolled courses found in UniMate.`);
  } else {
    context.courses.forEach((c) => {
      lines.push(`- ${c.name} (${c.code}), ${c.creditHours} credits, Semester: ${c.semester}, Instructor: ${c.instructor}`);
    });
  }

  lines.push(`\nTODAY'S SCHEDULE (${context.currentDayName}):`);
  if (context.todayTimetable.length === 0) {
    lines.push(`No scheduled classes today.`);
  } else {
    context.todayTimetable.forEach((t) => {
      lines.push(`- ${t.startTime} - ${t.endTime}: ${t.course} (${t.type}) [Room: ${t.room}]`);
    });
  }

  lines.push(`\nUPCOMING ASSIGNMENTS (${context.upcomingAssignments.length}):`);
  if (context.upcomingAssignments.length === 0) {
    lines.push(`No pending upcoming assignments.`);
  } else {
    context.upcomingAssignments.forEach((a) => {
      lines.push(`- "${a.title}" for ${a.course} | Due: ${a.dueDate} (${a.dueLabel}) | Priority: ${a.priority} | Status: ${a.status}`);
    });
  }

  lines.push(`\nUPCOMING EXAMS (${context.upcomingExams.length}):`);
  if (context.upcomingExams.length === 0) {
    lines.push(`No upcoming exams recorded.`);
  } else {
    context.upcomingExams.forEach((e) => {
      const countdownStr = e.daysRemaining === 0 ? "TODAY" : e.daysRemaining === 1 ? "TOMORROW" : `${e.daysRemaining} days remaining`;
      lines.push(`- "${e.title}" for ${e.course} | Date: ${e.examDate} at ${e.examTime} (${countdownStr}) | Type: ${e.type} | Room: ${e.room} | Prep: ${e.preparationProgress}%`);
    });
  }

  lines.push(`\nACADEMIC PERFORMANCE & ATTENDANCE:`);
  lines.push(`Current GPA: ${context.academics.gpa}`);
  lines.push(`Overall Attendance: ${context.academics.overallAttendance}`);
  if (context.academics.coursePerformance.length > 0) {
    lines.push(`Course breakdown:`);
    context.academics.coursePerformance.forEach((cp) => {
      const attStr = cp.attendancePercentage !== null ? `${cp.attendancePercentage}% (${cp.attendanceStatus})` : "No attendance data";
      lines.push(`  * ${cp.courseName} (${cp.courseCode}): Grade = ${cp.grade}, Attendance = ${attStr}`);
    });
  }

  return lines.join("\n");
}
