"use client";

import { useState } from "react";
import {
  Timer,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  StudySessionItem,
  WeeklyStudySummary,
} from "@/app/lib/study-session-definitions";
import { deleteStudySessionAction } from "@/app/actions/study-sessions";
import { LogSessionModal } from "@/components/study/log-session-modal";
import { formatPKTDate, formatPKTTime } from "@/app/lib/timezone";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type Props = {
  summary: WeeklyStudySummary;
  sessions: StudySessionItem[];
  courses: CourseOption[];
};

export function StudyView({ summary, sessions, courses }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this study session?")) return;
    setDeletingId(id);
    await deleteStudySessionAction(id);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Timer className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
              Study Sessions
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-3)]">
            Track your focused study hours, measure weekly consistency, and log revisions.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Log Study Session</span>
        </button>
      </div>

      {/* ── Overview Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Stat 1: This Week */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
              This Week
            </span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {summary.thisWeekHoursString}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-3)]">
            Mon – Sun (Asia/Karachi)
          </p>
        </div>

        {/* Stat 2: Today */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
              Today
            </span>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {summary.todayHoursString}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-3)]">
            {summary.todayMinutes > 0 ? "Great progress today!" : "No sessions logged today"}
          </p>
        </div>

        {/* Stat 3: Top Course */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
              Most Studied
            </span>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-base font-bold tracking-tight text-[var(--color-text)] truncate">
            {summary.mostStudiedCourse ? summary.mostStudiedCourse.courseCode : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-3)] truncate">
            {summary.mostStudiedCourse
              ? `${summary.mostStudiedCourse.formattedHours} logged`
              : "Log sessions to view"}
          </p>
        </div>

        {/* Stat 4: Total Sessions */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
              Total Logged
            </span>
            <BookOpen className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {summary.totalSessionsCount}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-3)]">
            Completed sessions
          </p>
        </div>
      </div>

      {/* ── Weekly 7-Day Visual Progress ────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)] mb-4">
          Weekly Study Consistency (Hours per day)
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {summary.dailyProgress.map((day) => {
            const maxVal = 6;
            const pct = Math.min(100, Math.round((day.hours / maxVal) * 100));
            return (
              <div key={day.day} className="flex flex-col items-center">
                <div className="relative flex h-28 w-full items-end justify-center rounded-xl bg-[var(--color-surface-2)] p-1">
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full max-w-[28px] rounded-lg transition-all duration-300 ${
                      day.isToday
                        ? "bg-blue-600 dark:bg-blue-500"
                        : day.hours > 0
                        ? "bg-blue-400/80 dark:bg-blue-600/60"
                        : "bg-transparent"
                    }`}
                  />
                  {day.hours > 0 && (
                    <span className="absolute top-1 text-[10px] font-bold text-[var(--color-text-2)]">
                      {day.hours}h
                    </span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    day.isToday
                      ? "font-bold text-blue-600 dark:text-blue-400"
                      : "text-[var(--color-text-3)]"
                  }`}
                >
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Study Session History ───────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
        <div className="border-b border-[var(--color-border-subtle)] px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Recent Sessions ({sessions.length})
          </h2>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <Timer className="mx-auto h-8 w-8 text-[var(--color-text-3)] opacity-40 mb-2" />
            <p className="text-xs font-medium text-[var(--color-text-2)]">
              No study sessions logged yet.
            </p>
            <p className="text-[11px] text-[var(--color-text-3)] mt-1">
              Start building your real study hours by logging your focused study sessions.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log first session</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {sessions.map((session) => {
              const durHours = Math.floor(session.duration / 60);
              const durMins = session.duration % 60;
              const durText =
                durHours > 0
                  ? `${durHours}h ${durMins > 0 ? `${durMins}m` : ""}`
                  : `${durMins}m`;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--color-text)] truncate">
                        {session.title}
                      </span>
                      {session.course ? (
                        <span
                          style={{
                            backgroundColor: `${session.course.color}15`,
                            color: session.course.color,
                            borderColor: `${session.course.color}30`,
                          }}
                          className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold shrink-0"
                        >
                          {session.course.code}
                        </span>
                      ) : (
                        <span className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-3)] shrink-0">
                          Self Study
                        </span>
                      )}

                      {session.source !== "MANUAL" && (
                        <span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.5 text-[9.5px] font-semibold shrink-0">
                          {session.source === "AI_PLAN" ? "AI Plan" : "Study Plan"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--color-text-3)]">
                      <span>{formatPKTDate(session.sessionDate, { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>·</span>
                      <span className="font-medium text-[var(--color-text-2)]">{durText}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                      aria-label="Delete study session"
                      className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log modal */}
      <LogSessionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        courses={courses}
      />
    </div>
  );
}
