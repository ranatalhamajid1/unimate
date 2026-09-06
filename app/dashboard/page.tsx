/**
 * Dashboard Overview page — /dashboard
 *
 * Upgraded into a true Student Command Center:
 * - Server-side intelligence layer with ranked daily priorities
 * - Real study hours from PostgreSQL StudySession
 * - Dynamic academic insights
 * - Active study plan tasks
 * - Dynamic student goals progress
 */

import Link from "next/link";
import { Award, ArrowRight, Wallet } from "lucide-react";
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { getTodayTimetable } from "@/app/lib/timetable";
import { getUpcomingAssignments, getDueThisWeekCount } from "@/app/lib/assignments";
import { getNextExam } from "@/app/lib/exams";
import { getAcademicOverview } from "@/app/lib/academic";
import { getExpenseSummary } from "@/app/lib/expenses";
import {
  generateAcademicNotifications,
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/app/lib/notifications";
import { getStudentPriorities } from "@/app/lib/student-intelligence";
import { getWeeklyStudyTotal, getWeeklyStudyProgress } from "@/app/lib/study-sessions";
import { getAcademicInsights } from "@/app/lib/academic-insights";
import { calculateStudentGoalsProgress } from "@/app/lib/goals";
import { getUserActiveStudyPlan } from "@/app/lib/study-plans";
import { getPKTDateParts } from "@/app/lib/timezone";
import {
  formatDueLabel,
  ASSIGNMENT_STATUSES,
} from "@/app/lib/assignment-definitions";
import {
  formatExamDate,
  formatExamTime,
  formatCountdown,
  calculateDaysRemaining,
  EXAM_TYPES,
} from "@/app/lib/exam-definitions";
import type {
  ScheduleClass,
  Assignment as DashboardAssignment,
  StatCard,
} from "@/app/lib/dashboard-data";
import { DEMO_STATS } from "@/app/lib/dashboard-data";

// Components
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DailyPriorities } from "@/components/dashboard/daily-priorities";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { TodayStudyPlan } from "@/components/dashboard/today-study-plan";
import { UpcomingAssignments } from "@/components/dashboard/upcoming-assignments";
import { NextExam } from "@/components/dashboard/next-exam";
import { StudyProgress } from "@/components/dashboard/study-progress";
import { AcademicInsightsCard } from "@/components/dashboard/academic-insights-card";
import { GoalsCard } from "@/components/dashboard/goals-card";
import { AiBuddyCard } from "@/components/dashboard/ai-buddy-card";
import { QuickActions } from "@/components/dashboard/quick-actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDateString(now: Date): string {
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const pkt = getPKTDateParts(now);
  const currentHour = pkt.hours;
  const greeting = getGreeting(currentHour);
  const dateString = getDateString(now);

  // Trigger academic notification generation
  await generateAcademicNotifications(session.userId);

  // Parallel fetch of all Command Center data
  const [
    prioritiesReport,
    todayEntries,
    upcomingAssignments,
    dueThisWeekCount,
    nextExamRecord,
    academicOverview,
    expenseSummary,
    recentNotifications,
    unreadNotificationCount,
    weeklyStudy,
    studyDays,
    academicInsights,
    studentGoals,
    activePlan,
  ] = await Promise.all([
    getStudentPriorities(session.userId, now),
    getTodayTimetable(session.userId, pkt.dayOfWeek),
    getUpcomingAssignments(session.userId, 5),
    getDueThisWeekCount(session.userId),
    getNextExam(session.userId),
    getAcademicOverview(session.userId),
    getExpenseSummary(session.userId),
    getUserNotifications(session.userId, { limit: 5 }),
    getUnreadNotificationCount(session.userId),
    getWeeklyStudyTotal(session.userId, now),
    getWeeklyStudyProgress(session.userId, now),
    getAcademicInsights(session.userId),
    calculateStudentGoalsProgress(session.userId),
    getUserActiveStudyPlan(session.userId),
  ]);

  const realSchedule: ScheduleClass[] = todayEntries.map((e) => ({
    id: e.id,
    time: `${e.startTime} - ${e.endTime}`,
    name: e.course ? `${e.course.code} — ${e.course.name}` : "Class",
    room: e.room || "Room TBA",
    type: (e.type.toLowerCase() === "lab" ? "lab" : "lecture") as "lecture" | "lab",
  }));

  const realAssignments: DashboardAssignment[] = upcomingAssignments.map((a) => {
    const dueInfo = formatDueLabel(new Date(a.dueDate), a.status);
    let status: "not-started" | "in-progress" | "completed" = "not-started";
    if (a.status === ASSIGNMENT_STATUSES.COMPLETED) status = "completed";
    else if (a.status === ASSIGNMENT_STATUSES.IN_PROGRESS) status = "in-progress";

    return {
      id: a.id,
      title: a.title,
      course: a.course ? `${a.course.code} · ${a.course.name}` : "Course",
      dueLabel: dueInfo.text,
      dueSoon: dueInfo.isSoon,
      status,
    };
  });

  const nextExamData = (nextExamRecord && nextExamRecord.course)
    ? {
        id: nextExamRecord.id,
        courseName: nextExamRecord.course.name,
        courseCode: nextExamRecord.course.code,
        courseColor: nextExamRecord.course.color,
        title: nextExamRecord.title,
        type: EXAM_TYPES[nextExamRecord.type as keyof typeof EXAM_TYPES] || nextExamRecord.type,
        date: formatExamDate(new Date(nextExamRecord.examDate)),
        time: formatExamTime(new Date(nextExamRecord.examDate)),
        room: nextExamRecord.room,
        countdown: formatCountdown(new Date(nextExamRecord.examDate), nextExamRecord.status).text,
        daysRemaining: calculateDaysRemaining(new Date(nextExamRecord.examDate)),
        preparationProgress: nextExamRecord.preparationProgress,
      }
    : null;

  // Real stats replacing all demo values
  const updatedStats: StatCard[] = [
    {
      id: "gpa",
      label: "GPA",
      value: academicOverview.gpaString,
      sub: academicOverview.gpaSub,
      trend: "up",
    },
    {
      id: "attendance",
      label: "Attendance",
      value: academicOverview.attendanceString,
      sub: academicOverview.attendanceSub,
      trend: "neutral",
    },
    {
      id: "assignments",
      label: "Assignments",
      value: String(dueThisWeekCount),
      sub: "Due this week",
      trend: "neutral",
    },
    {
      id: "study-hours",
      label: "Study hours",
      value: weeklyStudy.formatted,
      sub: "This week (real)",
      trend: "up",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <DashboardHeader
        name={session.name}
        greeting={greeting}
        dateString={dateString}
        notifications={recentNotifications}
        unreadCount={unreadNotificationCount}
      />

      {/* ── Today's Priorities (Smart Intelligence Layer) ──────────── */}
      <DailyPriorities report={prioritiesReport} />

      {/* ── Overview Stats Row ──────────────────────────────────────── */}
      <StatsCards stats={updatedStats} />

      {/* ── Main Command Center Grid ────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — 2/3 width on desktop */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Schedule */}
          <TodaySchedule
            classes={realSchedule}
            currentHour={currentHour}
          />

          {/* Today's Active Study Plan Tasks */}
          <TodayStudyPlan plan={activePlan} />

          {/* Upcoming Assignments */}
          <UpcomingAssignments assignments={realAssignments} />

          {/* Real Study Progress Chart */}
          <StudyProgress days={studyDays} />

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column — 1/3 width on desktop */}
        <div className="space-y-6">
          {/* Academic Insights */}
          <AcademicInsightsCard insights={academicInsights} />

          {/* Next Exam */}
          <NextExam exam={nextExamData} />

          {/* Goals Card */}
          <GoalsCard goals={studentGoals} />

          {/* Academic Standing Card */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-semibold text-[var(--color-text)]">
                  Academic Standing
                </h2>
              </div>
              <Link
                href="/dashboard/academics"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
                <p className="text-[10.5px] font-bold text-[var(--color-text-3)] uppercase tracking-wider">GPA</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">{academicOverview.gpaString}</p>
                <p className="text-[11px] text-[var(--color-text-3)] mt-0.5">{academicOverview.gpaSub}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
                <p className="text-[10.5px] font-bold text-[var(--color-text-3)] uppercase tracking-wider">Attendance</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{academicOverview.attendanceString}</p>
                <p className="text-[11px] text-[var(--color-text-3)] mt-0.5">{academicOverview.attendanceSub}</p>
              </div>
            </div>
          </div>

          {/* Monthly Spending Card */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <h2 className="text-sm font-semibold text-[var(--color-text)]">
                  This Month Spending
                </h2>
              </div>
              <Link
                href="/dashboard/expenses"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
                {expenseSummary.thisMonthSpendingString}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-3)]">
                {expenseSummary.hasExpenses
                  ? `Total tracked: ${expenseSummary.totalSpendingString}`
                  : "No expenses logged this month"}
              </p>
            </div>
          </div>

          {/* AI Study Buddy Card */}
          <AiBuddyCard />
        </div>
      </div>
    </div>
  );
}
