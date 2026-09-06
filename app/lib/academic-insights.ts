import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getAcademicOverview } from "@/app/lib/academic";
import { getUpcomingExams } from "@/app/lib/exams";
import { getUpcomingAssignments } from "@/app/lib/assignments";
import { getWeeklyStudyTotal } from "@/app/lib/study-sessions";
import { getPKTWeekBounds, PKT_OFFSET_MS } from "@/app/lib/timezone";
import { calculateDaysRemaining } from "@/app/lib/exam-definitions";
import { ASSIGNMENT_STATUSES } from "@/app/lib/assignment-definitions";

export type InsightSeverity = "POSITIVE" | "INFO" | "WARNING" | "CRITICAL";

export type AcademicInsight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  actionUrl?: string;
  category: "ATTENDANCE" | "ACADEMICS" | "EXAMS" | "ASSIGNMENTS" | "STUDY";
};

/**
 * Generates deterministic, factual insights from the student's real data.
 * Strictly avoids fabricating historical trends (e.g. fake GPA changes) not stored in DB.
 */
export async function getAcademicInsights(userId: string): Promise<AcademicInsight[]> {
  try {
    const now = new Date();
    const insights: AcademicInsight[] = [];

    // Parallel fetch
    const [academicOverview, upcomingExams, assignments, currentWeekStudy] = await Promise.all([
      getAcademicOverview(userId),
      getUpcomingExams(userId),
      prisma.assignment.findMany({
        where: { userId },
        select: { status: true, dueDate: true, title: true },
      }),
      getWeeklyStudyTotal(userId, now),
    ]);

    // Calculate last week's study hours for factual comparison
    const { start: currentWeekStart } = getPKTWeekBounds(now);
    const lastWeekDate = new Date(currentWeekStart.getTime() - 24 * 60 * 60 * 1000);
    const lastWeekStudy = await getWeeklyStudyTotal(userId, lastWeekDate);

    // 1. Attendance Insights
    if (academicOverview.overallAttendance !== null) {
      if (academicOverview.overallAttendance < 75) {
        insights.push({
          id: "attendance-below-threshold",
          severity: academicOverview.overallAttendance < 70 ? "CRITICAL" : "WARNING",
          title: "Attendance Below Target",
          description: `Your overall attendance is ${academicOverview.attendanceString}, below the 75% required university threshold.`,
          actionUrl: "/dashboard/academics",
          category: "ATTENDANCE",
        });
      } else if (academicOverview.overallAttendance >= 90) {
        insights.push({
          id: "attendance-stellar",
          severity: "POSITIVE",
          title: "Excellent Attendance",
          description: `You're maintaining a stellar ${academicOverview.attendanceString} overall attendance across your courses!`,
          actionUrl: "/dashboard/academics",
          category: "ATTENDANCE",
        });
      }

      // Course with lowest attendance
      const coursesWithAtt = academicOverview.courses.filter(
        (c) => c.attendancePercentage !== null
      );
      if (coursesWithAtt.length > 1) {
        const sorted = [...coursesWithAtt].sort(
          (a, b) => (a.attendancePercentage ?? 0) - (b.attendancePercentage ?? 0)
        );
        const lowest = sorted[0];
        if (lowest.attendancePercentage !== null && lowest.attendancePercentage < 75) {
          insights.push({
            id: `lowest-attendance-${lowest.courseCode}`,
            severity: "WARNING",
            title: `Low Attendance in ${lowest.courseCode}`,
            description: `${lowest.courseName} has your lowest attendance at ${lowest.attendancePercentage}%.`,
            actionUrl: "/dashboard/academics",
            category: "ATTENDANCE",
          });
        }
      }
    }

    // 2. Exam Preparation Insights
    if (upcomingExams.length > 0) {
      const nearest = upcomingExams[0];
      const daysLeft = calculateDaysRemaining(nearest.examDate);

      if (daysLeft <= 5 && nearest.preparationProgress < 50) {
        insights.push({
          id: `exam-prep-low-${nearest.id}`,
          severity: "CRITICAL",
          title: "Urgent Exam Revision Needed",
          description: `${nearest.title} (${nearest.course?.code || "Exam"}) is in ${daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `${daysLeft} days`} with preparation at ${nearest.preparationProgress}%.`,
          actionUrl: "/dashboard/exams",
          category: "EXAMS",
        });
      } else if (daysLeft <= 7 && nearest.preparationProgress >= 80) {
        insights.push({
          id: `exam-prep-high-${nearest.id}`,
          severity: "POSITIVE",
          title: "Strong Exam Preparation",
          description: `You are well prepared (${nearest.preparationProgress}%) for ${nearest.title} with ${daysLeft} days remaining.`,
          actionUrl: "/dashboard/exams",
          category: "EXAMS",
        });
      }
    }

    // 3. Assignment Completion Rate
    if (assignments.length > 0) {
      const completed = assignments.filter((a) => a.status === ASSIGNMENT_STATUSES.COMPLETED).length;
      const total = assignments.length;
      const completionRate = Math.round((completed / total) * 100);

      if (completionRate >= 80) {
        insights.push({
          id: "assignments-high-completion",
          severity: "POSITIVE",
          title: "Consistent Coursework",
          description: `You have completed ${completed} of ${total} assignments (${completionRate}%) this term.`,
          actionUrl: "/dashboard/assignments",
          category: "ASSIGNMENTS",
        });
      } else if (completionRate < 60) {
        insights.push({
          id: "assignments-pending-alert",
          severity: "INFO",
          title: "Pending Assignments",
          description: `You have ${total - completed} unfinished assignments awaiting completion.`,
          actionUrl: "/dashboard/assignments",
          category: "ASSIGNMENTS",
        });
      }
    }

    // 4. Study Volume Trend
    if (currentWeekStudy.hours > 0 || lastWeekStudy.hours > 0) {
      const diff = Math.round((currentWeekStudy.hours - lastWeekStudy.hours) * 10) / 10;
      if (diff > 0 && lastWeekStudy.hours > 0) {
        insights.push({
          id: "study-volume-up",
          severity: "POSITIVE",
          title: "Study Momentum Increasing",
          description: `You've studied ${diff}h more this week (${currentWeekStudy.formatted}) compared to last week (${lastWeekStudy.formatted}).`,
          actionUrl: "/dashboard/study",
          category: "STUDY",
        });
      } else if (currentWeekStudy.hours >= 10) {
        insights.push({
          id: "study-milestone",
          severity: "POSITIVE",
          title: "Productive Study Week",
          description: `You have achieved ${currentWeekStudy.formatted} of focused study time this week.`,
          actionUrl: "/dashboard/study",
          category: "STUDY",
        });
      }
    }

    // 5. Default baseline insight if few activities logged yet
    if (insights.length === 0) {
      if (academicOverview.courses.length === 0) {
        insights.push({
          id: "get-started",
          severity: "INFO",
          title: "Welcome to Command Center",
          description: "Add your university courses and timetable to generate real academic insights.",
          actionUrl: "/dashboard/courses",
          category: "ACADEMICS",
        });
      } else {
        insights.push({
          id: "steady-standing",
          severity: "INFO",
          title: "Academic Data Grounded",
          description: `Enrolled in ${academicOverview.courses.length} courses with GPA ${academicOverview.gpaString}. Keep tracking assignments and study sessions for deeper trends.`,
          actionUrl: "/dashboard/academics",
          category: "ACADEMICS",
        });
      }
    }

    return insights;
  } catch (error) {
    console.error("Error generating academic insights:", error);
    return [];
  }
}
