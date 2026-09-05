/**
 * Dashboard Overview page — /dashboard
 *
 * Server Component — fetches real timetable & assignment data server-side.
 * Auth guard is in layout.tsx (and proxy.ts as primary).
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
} from "@/app/lib/dashboard-data";

// Data
import {
  DEMO_STATS,
  DEMO_STUDY_PROGRESS,
} from "@/app/lib/dashboard-data";

// Components
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { UpcomingAssignments } from "@/components/dashboard/upcoming-assignments";
import { NextExam } from "@/components/dashboard/next-exam";
import { StudyProgress } from "@/components/dashboard/study-progress";
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
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  // Secondary session guard (layout.tsx + proxy.ts are primary)
  const session = await getSession();
  if (!session) redirect("/login");

  // Time-based values computed on the server
  const now = new Date();
  const currentHour = now.getHours();
  const greeting = getGreeting(currentHour);
  const dateString = getDateString(now);

  // Fetch real timetable for today (1=Mon ... 7=Sun) and real upcoming assignments
  const jsDay = now.getDay();
  const todayDayIndex = jsDay === 0 ? 7 : jsDay;

  // Trigger academic notification generation
  await generateAcademicNotifications(session.userId);

  const [
    todayEntries,
    upcomingAssignments,
    dueThisWeekCount,
    nextExamRecord,
    academicOverview,
    expenseSummary,
    recentNotifications,
    unreadNotificationCount,
  ] = await Promise.all([
    getTodayTimetable(session.userId, todayDayIndex),
    getUpcomingAssignments(session.userId, 5),
    getDueThisWeekCount(session.userId),
    getNextExam(session.userId),
    getAcademicOverview(session.userId),
    getExpenseSummary(session.userId),
    getUserNotifications(session.userId, { limit: 5 }),
    getUnreadNotificationCount(session.userId),
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

  const updatedStats = DEMO_STATS.map((s) => {
    if (s.id === "gpa") {
      return {
        ...s,
        value: academicOverview.gpaString,
        sub: academicOverview.gpaSub,
      };
    }
    if (s.id === "attendance") {
      return {
        ...s,
        value: academicOverview.attendanceString,
        sub: academicOverview.attendanceSub,
      };
    }
    if (s.id === "assignments") {
      return {
        ...s,
        value: String(dueThisWeekCount),
        sub: "Due this week",
      };
    }
    return s;
  });

  return (
    <div className="animate-fade-in">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <DashboardHeader
        name={session.name}
        greeting={greeting}
        dateString={dateString}
        notifications={recentNotifications}
        unreadCount={unreadNotificationCount}
      />

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <StatsCards stats={updatedStats} />

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Left column — 2/3 width on desktop */}
        <div className="space-y-4 lg:col-span-2">
          <TodaySchedule
            classes={realSchedule}
            currentHour={currentHour}
          />
          <UpcomingAssignments assignments={realAssignments} />
          <StudyProgress days={DEMO_STUDY_PROGRESS} />
          <QuickActions />
        </div>

        {/* Right column — 1/3 width on desktop */}
        <div className="space-y-4">
          <NextExam exam={nextExamData} />

          {/* Academic Performance Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                <h2 className="text-[14px] font-semibold text-slate-900">Academic Standing</h2>
              </div>
              <Link
                href="/dashboard/academics"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">GPA</p>
                <p className="text-[18px] font-bold text-blue-700 mt-0.5">{academicOverview.gpaString}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{academicOverview.gpaSub}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Attendance</p>
                <p className="text-[18px] font-bold text-emerald-700 mt-0.5">{academicOverview.attendanceString}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{academicOverview.attendanceSub}</p>
              </div>
            </div>
            <Link
              href="/dashboard/academics"
              className="mt-3 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1"
            >
              <span>View Academic Performance</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Monthly Spending Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-violet-600" />
                <h2 className="text-[14px] font-semibold text-slate-900">This Month Spending</h2>
              </div>
              <Link
                href="/dashboard/expenses"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
            <div>
              <p className="text-[1.75rem] font-bold text-slate-900 tracking-tight leading-tight">
                {expenseSummary.thisMonthSpendingString}
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                {expenseSummary.hasExpenses
                  ? `Total tracked: ${expenseSummary.totalSpendingString}`
                  : "No expenses logged this month"}
              </p>
            </div>
            <Link
              href="/dashboard/expenses"
              className="mt-3 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1"
            >
              <span>View Expenses</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <AiBuddyCard />
        </div>
      </div>
    </div>
  );
}
