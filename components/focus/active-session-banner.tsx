"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Maximize2 } from "lucide-react";
import {
  ActiveFocusSessionPayload,
  calculateElapsedSeconds,
} from "@/app/lib/study-session-definitions";

interface ActiveSessionBannerProps {
  activeSession: ActiveFocusSessionPayload | null;
  onOpenModal: () => void;
  onSessionUpdated: () => void;
}

export function ActiveSessionBanner({
  activeSession,
  onOpenModal,
  onSessionUpdated,
}: ActiveSessionBannerProps) {
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const plannedSeconds = (activeSession.plannedDuration || 50) * 60;
  const elapsedSeconds = calculateElapsedSeconds({
    sessionDate: activeSession.sessionDate,
    pausedAt: activeSession.pausedAt,
    totalPausedSeconds: activeSession.totalPausedSeconds,
    serverNow: new Date(nowMs),
  });

  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);
  const isPaused = activeSession.status === "PAUSED";
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / Math.max(1, plannedSeconds)) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  async function handleTogglePause(e: React.MouseEvent) {
    e.stopPropagation();
    if (!activeSession) return;
    const endpoint = isPaused
      ? `/api/study-sessions/${activeSession.id}/resume`
      : `/api/study-sessions/${activeSession.id}/pause`;
    await fetch(endpoint, { method: "POST" });
    onSessionUpdated();
  }

  return (
    <div
      onClick={onOpenModal}
      role="region"
      aria-label="Active Focus Session"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3.5 rounded-2xl border border-indigo-500/30 bg-[var(--color-surface)]/90 dark:bg-[var(--color-surface)]/95 backdrop-blur-2xl [box-shadow:0_16px_40px_-8px_rgba(99,102,241,0.28),var(--specular-top)] px-4 py-2.5 cursor-pointer spatial-interactive hover:scale-[1.01] transition-standard group"
    >
      {/* Progress ring or status dot */}
      <div className="relative flex items-center justify-center shrink-0">
        <span
          className={`w-3 h-3 rounded-full ${
            isPaused
              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              : "bg-indigo-500 dark:bg-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.9)] animate-pulse"
          }`}
        />
      </div>

      {/* Tabular timer & title */}
      <div className="min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <span className="kpi-numeric font-heading font-bold text-base tracking-tight text-[var(--color-text)]">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-cyan-400">
            {isPaused ? "Paused" : "Focusing"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="h-1 w-16 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-[var(--color-text-3)] truncate max-w-[130px]">
            {activeSession.title}
          </span>
        </div>
      </div>

      {/* Tactile control buttons */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--color-glass-border)]">
        <button
          onClick={handleTogglePause}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-micro cursor-pointer"
          aria-label={isPaused ? "Resume focus" : "Pause focus"}
          title={isPaused ? "Resume focus" : "Pause focus"}
        >
          {isPaused ? <Play className="h-3.5 w-3.5 fill-current ml-0.5" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
        </button>

        <button
          onClick={onOpenModal}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-2)] hover:text-[var(--color-text)] border border-[var(--color-glass-border)] transition-micro cursor-pointer"
          aria-label="Expand session modal"
          title="Expand session"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
