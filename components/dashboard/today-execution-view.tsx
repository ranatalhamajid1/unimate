"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Info,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { AdaptiveTodayWorkspaceData, TodayActionItem } from "@/app/lib/today-workspace";
import { TodayTimeline } from "./today-timeline";
import { FocusSessionModal } from "@/components/focus/focus-session-modal";
import { ActiveSessionBanner } from "@/components/focus/active-session-banner";
import type { ActiveFocusSessionPayload } from "@/app/lib/study-session-definitions";

interface TodayExecutionViewProps {
  data: AdaptiveTodayWorkspaceData;
}

export function TodayExecutionView({ data }: TodayExecutionViewProps) {
  const [nextExpanded, setNextExpanded] = useState(true);
  const [laterExpanded, setLaterExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // Focus Session State
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveFocusSessionPayload | null>(null);
  const [targetFocusTask, setTargetFocusTask] = useState<{
    id?: string;
    title: string;
    courseId?: string;
    courseCode?: string;
    courseName?: string;
    courseColor?: string;
    estimatedMinutes?: number;
    entityType?: "ASSIGNMENT" | "EXAM" | "STUDY_PLAN_ITEM" | "COURSE_STUDY" | "GENERAL";
  } | null>(null);

  const fetchActiveSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/study-sessions/active");
      if (res.ok) {
        const json = await res.json();
        setActiveSession(json.activeSession || null);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  React.useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  const handleStartFocus = (task: TodayActionItem) => {
    setTargetFocusTask({
      id: task.id,
      title: task.title,
      courseId: task.courseId,
      courseCode: task.courseCode,
      courseName: task.courseName,
      courseColor: task.courseColor,
      estimatedMinutes: task.estimatedMinutes,
      entityType: task.entityType as any,
    });
    setFocusModalOpen(true);
  };

  const { capacity, today, next, later, completedToday, calendarSync, emptyState } = data;

  const getUrgencyBadge = (tier: TodayActionItem["urgencyTier"]) => {
    switch (tier) {
      case "OVERDUE":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
      case "CRITICAL":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "HIGH":
        return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
      case "MEDIUM":
        return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
      default:
        return "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── 1. Main Execution Grid (Timeline + Allocated Actions) ──── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Chronological Timeline (5 of 12 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <TodayTimeline schedule={today.schedule} dayName={data.dayName} />

          {/* Calendar Sync Status Card */}
          {calendarSync.status !== "NOT_CONFIGURED" && (
            <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-4 text-xs flex items-center justify-between gap-3 [box-shadow:var(--shadow-xs),var(--specular-top)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    calendarSync.status === "CONNECTED"
                      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"
                      : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                  }`}
                />
                <span className="text-[var(--color-text-2)] truncate">
                  {calendarSync.status === "CONNECTED"
                    ? `Google Calendar Synced${calendarSync.accountEmail ? ` (${calendarSync.accountEmail})` : ""}`
                    : "Google Calendar Reconnection Needed"}
                </span>
              </div>
              <Link
                href="/dashboard/integrations"
                className="text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 font-medium inline-flex items-center gap-1"
              >
                Manage <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Allocated Action Queue & Capacity (7 of 12 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Capacity Guardrail Header */}
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-standard ${
              capacity.isOverCapacity
                ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/25 text-[var(--color-text)] [box-shadow:0_0_24px_-8px_rgba(245,158,11,0.15),var(--specular-top)]"
                : "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20 text-[var(--color-text)] [box-shadow:0_0_24px_-8px_rgba(99,102,241,0.15),var(--specular-top)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 border ${
                  capacity.isOverCapacity
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {capacity.isOverCapacity ? (
                  <AlertTriangle className="h-4.5 w-4.5" />
                ) : (
                  <Sparkles className="h-4.5 w-4.5" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Academic Capacity</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-surface)]/80 text-[var(--color-text-2)]">
                    ~{Math.round(capacity.allocatedWorkMinutes / 60)}h planned / ~{(capacity.availableStudyMinutes / 60).toFixed(1)}h free
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed text-[var(--color-text-2)]">
                  {capacity.notice}
                </p>
              </div>
            </div>
          </div>

          {/* Allocated Action Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <span>Recommended Focus Queue</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text-3)]">
                {today.allocatedTasks.length} item{today.allocatedTasks.length !== 1 ? "s" : ""}
              </span>
            </div>

            {today.allocatedTasks.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-8 text-center [box-shadow:var(--shadow-xs),var(--specular-top)]">
                <div className="mx-auto w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-[var(--color-text)]">
                  All caught up for today!
                </h4>
                <p className="text-xs text-[var(--color-text-3)] mt-1 max-w-sm mx-auto">
                  No urgent deadlines, overdue work, or imminent exams requiring today's focus.
                </p>
              </div>
            ) : (
              today.allocatedTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="group rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl p-4 sm:p-5 [box-shadow:var(--shadow-xs),var(--specular-top)] spatial-interactive transition-standard hover:border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="kpi-numeric text-xs font-bold text-[var(--color-text-3)]">
                        #{index + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getUrgencyBadge(
                          task.urgencyTier
                        )}`}
                      >
                        {task.deadlineLabel}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-2)]">
                        {task.courseCode}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-3)]">
                        • {task.estimatedLabel}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-[var(--color-text)] truncate">
                      {task.title}
                    </h4>

                    <p className="text-xs text-[var(--color-text-3)] line-clamp-1">
                      {task.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartFocus(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-500/25 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500 hover:text-white transition-standard shadow-xs cursor-pointer"
                      title="Start timed Focus Session for this task"
                    >
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      <span>Start Focus</span>
                    </button>

                    <Link
                      href={task.actionHref}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-standard shadow-xs"
                    >
                      {task.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── 2. NEXT (Upcoming Days 2 to 5) ─────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-5 [box-shadow:var(--shadow-xs),var(--specular-top)]">
        <button
          onClick={() => setNextExpanded(!nextExpanded)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Calendar className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Next (Upcoming Work in 2–5 Days)
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text-3)]">
              {next.length}
            </span>
          </div>
          {nextExpanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--color-text-3)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--color-text-3)]" />
          )}
        </button>

        {nextExpanded && (
          <div className="mt-4 space-y-2.5">
            {next.length === 0 ? (
              <p className="text-xs text-[var(--color-text-3)] py-2">
                No assignments or exams due in the next 2–5 days.
              </p>
            ) : (
              next.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/60 text-xs transition-standard hover:border-indigo-500/20"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-text)] truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--color-text-3)]">
                        ({item.courseCode})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-3)] mt-0.5">
                      <span>{item.deadlineLabel}</span>
                      <span>• {item.estimatedLabel}</span>
                      {item.deferredReason && (
                        <span className="text-amber-600 dark:text-amber-400">
                          • {item.deferredReason}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={item.actionHref}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── 3. LATER (Backlog & Long-Range) ─────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-5 [box-shadow:var(--shadow-xs),var(--specular-top)]">
        <button
          onClick={() => setLaterExpanded(!laterExpanded)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
              <Clock className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Later (Future Backlog & Long-Range Goals)
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text-3)]">
              {later.length}
            </span>
          </div>
          {laterExpanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--color-text-3)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--color-text-3)]" />
          )}
        </button>

        {laterExpanded && (
          <div className="mt-4 space-y-2">
            {later.length === 0 ? (
              <p className="text-xs text-[var(--color-text-3)] py-2">
                No long-range tasks or backlog items recorded.
              </p>
            ) : (
              later.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/60 text-xs transition-standard hover:border-indigo-500/20"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-[var(--color-text)]">
                      {item.title} ({item.courseCode})
                    </span>
                    <span className="text-[11px] text-[var(--color-text-3)] block mt-0.5">
                      {item.deadlineLabel}
                    </span>
                  </div>
                  <Link
                    href={item.actionHref}
                    className="text-[var(--color-text-3)] hover:text-[var(--color-text)] font-medium"
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── 4. COMPLETED TODAY (Dedicated Reflection Section) ──────── */}
      {completedToday.count > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-5 [box-shadow:var(--shadow-xs),var(--specular-top)]">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                Completed Today ({completedToday.count} task{completedToday.count !== 1 ? "s" : ""} done)
              </h3>
            </div>
            {completedExpanded ? (
              <ChevronDown className="h-4 w-4 text-emerald-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-emerald-600" />
            )}
          </button>

          {completedExpanded && (
            <div className="mt-4 space-y-2">
              {completedToday.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--color-surface)]/80 border border-emerald-500/20 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[var(--color-text)] font-medium line-through">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-3)]">({item.courseCode})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 5. Focus Session Modal & Mini-Banner ────────────────────── */}
      <FocusSessionModal
        isOpen={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
        initialTask={targetFocusTask}
        activeSession={activeSession}
        onSessionUpdated={fetchActiveSession}
      />

      <ActiveSessionBanner
        activeSession={activeSession}
        onOpenModal={() => setFocusModalOpen(true)}
        onSessionUpdated={fetchActiveSession}
      />
    </div>
  );
}
