"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Minimize2,
  Clock,
  BookOpen,
} from "lucide-react";
import { FocusTimerRing } from "./focus-timer-ring";
import {
  ActiveFocusSessionPayload,
  calculateElapsedSeconds,
  FOCUS_DURATION_PRESETS,
} from "@/app/lib/study-session-definitions";

interface FocusSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: {
    id?: string;
    title: string;
    courseId?: string;
    courseCode?: string;
    courseName?: string;
    courseColor?: string;
    estimatedMinutes?: number;
    entityType?: "ASSIGNMENT" | "EXAM" | "STUDY_PLAN_ITEM" | "COURSE_STUDY" | "GENERAL";
  } | null;
  activeSession: ActiveFocusSessionPayload | null;
  onSessionUpdated: () => void;
}

export function FocusSessionModal({
  isOpen,
  onClose,
  initialTask,
  activeSession,
  onSessionUpdated,
}: FocusSessionModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(50);
  const [customDuration, setCustomDuration] = useState<number>(50);
  const [isCustom, setIsCustom] = useState(false);
  const [markComplete, setMarkComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Local ticker state updated every second
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    if (!isOpen || !activeSession) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeSession]);

  if (!isOpen) return null;

  // Handle preset duration from task on first open if no active session
  useEffect(() => {
    if (initialTask?.estimatedMinutes && !activeSession) {
      const est = initialTask.estimatedMinutes;
      if (FOCUS_DURATION_PRESETS.includes(est as any)) {
        setSelectedDuration(est);
        setIsCustom(false);
      } else {
        setCustomDuration(Math.min(180, Math.max(5, est)));
        setIsCustom(true);
      }
    }
  }, [initialTask, activeSession]);

  // Calculate current elapsed and remaining time
  const plannedMinutes = activeSession?.plannedDuration || (isCustom ? customDuration : selectedDuration);
  const plannedSeconds = plannedMinutes * 60;

  let elapsedSeconds = 0;
  if (activeSession) {
    elapsedSeconds = calculateElapsedSeconds({
      sessionDate: activeSession.sessionDate,
      pausedAt: activeSession.pausedAt,
      totalPausedSeconds: activeSession.totalPausedSeconds,
      serverNow: new Date(nowMs),
    });
  }

  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);
  const progress = Math.min(1, elapsedSeconds / plannedSeconds);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Actions
  async function handleStart() {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/study-sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: initialTask?.title || "Focus Study",
          courseId: initialTask?.courseId || null,
          targetType: initialTask?.entityType || "GENERAL",
          targetId: initialTask?.id || null,
          plannedMinutes: isCustom ? customDuration : selectedDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start session.");
      }
      onSessionUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  async function handlePause() {
    if (!activeSession) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/study-sessions/${activeSession.id}/pause`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to pause session.");
      onSessionUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  async function handleResume() {
    if (!activeSession) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/study-sessions/${activeSession.id}/resume`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resume session.");
      onSessionUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  async function handleComplete() {
    if (!activeSession) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/study-sessions/${activeSession.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markTargetComplete: markComplete,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete session.");
      onSessionUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  async function handleCancel() {
    if (!activeSession) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/study-sessions/${activeSession.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel session.");
      setShowCancelConfirm(false);
      onSessionUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  const isRunning = activeSession?.status === "ACTIVE";
  const isPaused = activeSession?.status === "PAUSED";
  const hasActiveSession = Boolean(activeSession);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] [box-shadow:var(--shadow-spatial),var(--specular-top)] p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                {hasActiveSession ? "Focus Mode Active" : "Start Focus Session"}
              </h2>
              <p className="text-xs text-[var(--color-text-3)]">
                {hasActiveSession
                  ? "Distraction-free academic execution"
                  : "Turn this today task into focused academic study"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-micro"
            aria-label="Minimize or close"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Target Task Card Header */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
              style={{
                borderColor: `${activeSession?.courseColor || initialTask?.courseColor || "#6366f1"}40`,
                backgroundColor: `${activeSession?.courseColor || initialTask?.courseColor || "#6366f1"}15`,
                color: activeSession?.courseColor || initialTask?.courseColor || "#6366f1",
              }}
            >
              {activeSession?.courseCode || initialTask?.courseCode || "STUDY"}
            </span>
            <span className="text-xs text-[var(--color-text-3)] truncate">
              {activeSession?.courseName || initialTask?.courseName || "General Academic"}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
            {activeSession?.title || initialTask?.title || "Independent Focus"}
          </h3>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pre-Start Duration Presets (Shown when no session is active) */}
        {!hasActiveSession && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[var(--color-text-2)]">
              Select Session Duration
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {FOCUS_DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setSelectedDuration(mins);
                    setIsCustom(false);
                  }}
                  className={`py-3 px-2 rounded-2xl border text-center transition-micro cursor-pointer font-bold ${
                    !isCustom && selectedDuration === mins
                      ? "border-[var(--color-accent)] bg-blue-50 dark:bg-blue-950/40 text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-subtle)] text-[var(--color-text-2)]"
                  }`}
                >
                  <div className="text-base">{mins}m</div>
                  <div className="text-[10px] font-normal text-[var(--color-text-3)]">
                    {mins === 25 ? "Sprint" : mins === 50 ? "Standard" : "Deep Work"}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {isCustom ? "Use standard presets" : "Set custom duration..."}
              </button>
              {isCustom && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-24 accent-indigo-600"
                  />
                  <span className="kpi-numeric text-xs font-bold text-[var(--color-text)] w-10 text-right">
                    {customDuration}m
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleStart}
              className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Begin Focus ({isCustom ? customDuration : selectedDuration} min)</span>
            </button>
          </div>
        )}

        {/* Active Timer Display (Shown when active session exists) */}
        {hasActiveSession && (
          <div className="flex flex-col items-center justify-center space-y-6 py-2">
            <FocusTimerRing
              progress={progress}
              size={240}
              strokeWidth={10}
              color={activeSession?.courseColor || "#6366f1"}
            >
              <div className="space-y-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    isPaused
                      ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 animate-pulse"
                  }`}
                >
                  {isPaused ? "PAUSED" : "FOCUSING"}
                </span>

                <div className="kpi-numeric text-4xl font-extrabold tracking-tight text-[var(--color-text)] font-mono">
                  {formatTime(remainingSeconds)}
                </div>

                <div className="text-xs text-[var(--color-text-3)]">
                  {formatTime(elapsedSeconds)} elapsed of {plannedMinutes}m
                </div>
              </div>
            </FocusTimerRing>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full">
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Pause className="h-4 w-4 fill-white" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleComplete}
                className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Complete Session</span>
              </button>
            </div>

            {/* Optional Task Completion Toggle */}
            {activeSession?.targetId && (
              <label className="flex items-center gap-2.5 text-xs text-[var(--color-text-2)] select-none cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] h-4 w-4"
                />
                <span>Also mark the underlying task as completed today</span>
              </label>
            )}

            {/* Cancel Button / Confirm */}
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer pt-2"
              >
                Cancel Session
              </button>
            ) : (
              <div className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-2 text-center">
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                  Are you sure? If cancelled, only actual focused time will be preserved.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] cursor-pointer"
                  >
                    Keep Going
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
