"use client";

import { CheckCircle2, Clock, Sparkles, Trophy } from "lucide-react";
import type { WeeklyProgressSummary } from "@/app/lib/dashboard-aggregation";

interface WeeklyProgressCardProps {
  progress: WeeklyProgressSummary;
}

export function WeeklyProgressCard({ progress }: WeeklyProgressCardProps) {
  const hasActivity =
    progress.studyHoursTotal > 0 ||
    progress.assignmentsCompletedCount > 0 ||
    progress.studySessionsLoggedCount > 0;

  const keyWins = progress.whatWentWell || [];

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs transition-standard">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Weekly Progress
          </h2>
        </div>
        <span className="text-[11px] font-medium text-[var(--color-text-3)]">
          This Week
        </span>
      </div>

      {!hasActivity ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center">
          <p className="text-xs font-medium text-[var(--color-text-2)]">
            No study sessions or tasks logged this week yet.
          </p>
          <p className="text-[11px] text-[var(--color-text-3)] mt-1">
            Start a study session or complete an assignment to build momentum.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Study Time Tile */}
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[var(--color-text-3)] uppercase tracking-wider">
                <Clock className="w-3 h-3 text-blue-500" />
                Study Time
              </div>
              <p className="kpi-numeric text-lg font-bold text-[var(--color-text)] mt-1">
                {progress.studyHoursTotal}h
              </p>
              <p className="text-[11px] text-[var(--color-text-3)] mt-0.5">
                {progress.studySessionsLoggedCount} logged session{progress.studySessionsLoggedCount === 1 ? "" : "s"}
              </p>
            </div>

            {/* Completed Tasks Tile */}
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[var(--color-text-3)] uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Tasks Done
              </div>
              <p className="kpi-numeric text-lg font-bold text-[var(--color-text)] mt-1">
                {progress.assignmentsCompletedCount}
              </p>
              <p className="text-[11px] text-[var(--color-text-3)] mt-0.5">
                Completed
              </p>
            </div>
          </div>

          {/* Key Wins / Reflection */}
          {keyWins.length > 0 && (
            <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Highlights
              </p>
              {keyWins.map((win: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[var(--color-text-2)]">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{win}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
