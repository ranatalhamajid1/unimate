/**
 * Dashboard Overview page — /dashboard
 *
 * Milestone 15.1: Adaptive Today Workspace & Personal Academic Command Center
 * Answering: "What should this student do today, in what order, and why?"
 * Unified execution hierarchy: ATTENTION → TODAY → NEXT → LATER → COMPLETED TODAY.
 */

import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { getAdaptiveTodayWorkspace } from "@/app/lib/today-workspace";
import { getDashboardData } from "@/app/lib/dashboard-aggregation";

// Components
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { AttentionQueue } from "@/components/dashboard/attention-queue";
import { TodayExecutionView } from "@/components/dashboard/today-execution-view";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Bounded parallel queries for Today Workspace and profile header data
  const [todayData, dashboardData] = await Promise.all([
    getAdaptiveTodayWorkspace(session.userId),
    getDashboardData(session.userId),
  ]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Keyboard Command Palette (Ctrl/Cmd + K or '/') */}
      <CommandPalette />

      {/* ── 1. Page Header with Student Identity ────────────────────── */}
      <DashboardHeader
        name={session.name}
        greeting={dashboardData.greeting}
        dateString={todayData.dateString}
        notifications={dashboardData.notifications}
        unreadCount={dashboardData.unreadNotificationCount}
        avatarUrl={dashboardData.profile.avatarUrl}
        universityName={dashboardData.profile.universityName}
        universityVerified={dashboardData.profile.universityVerified}
        degreeProgram={dashboardData.profile.degreeProgram}
        currentSemester={dashboardData.profile.currentSemester}
        profileCompletionPercentage={dashboardData.profile.profileCompletionPercentage}
      />

      {/* ── 2. Fintech Glass KPI Metrics (GPA, Attendance, Assignments, Study Hours) ── */}
      <StatsCards stats={dashboardData.stats} />

      {/* ── 3. What needs attention now? (Urgent Alert Band) ────────── */}
      <AttentionQueue
        items={todayData.attention.items}
        attendanceWarning={todayData.attention.attendanceWarning}
        timetableConflictCount={todayData.attention.timetableConflictCount}
      />

      {/* ── 4. Today's Execution Workspace (Timeline + Action Queue + Next/Later) ─ */}
      <TodayExecutionView data={todayData} />
    </div>
  );
}
