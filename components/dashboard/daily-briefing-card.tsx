"use client";

import { Sparkles, Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { ScheduleGap } from "@/app/lib/intelligence/schedule-gaps";
import { AiBriefingHydrator } from "./ai-briefing-hydrator";

type DailyBriefingCardProps = {
  headline: string;
  dateString: string;
  todayClassesCount: number;
  upcomingExamsCount: number;
  criticalTasksCount: number;
  scheduleGaps: ScheduleGap[];
  whyTheseMatter: string;
  isPro: boolean;
};

export function DailyBriefingCard({
  headline,
  dateString,
  todayClassesCount,
  upcomingExamsCount,
  criticalTasksCount,
  scheduleGaps,
  whyTheseMatter,
  isPro,
}: DailyBriefingCardProps) {
  const hasCritical = criticalTasksCount > 0;
  const isHeavy = hasCritical || (criticalTasksCount + todayClassesCount > 5);

  const statusBadge = hasCritical
    ? { label: "High Priority Day", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
    : isHeavy
      ? { label: "Full Schedule", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" }
      : { label: "Manageable Day", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-standard">
      {/* Subtle AI gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Daily Briefing
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)] mt-1.5">
            {headline}
          </h2>
          <p className="text-xs text-[var(--color-text-2)]">{dateString}</p>
        </div>

        {/* Quick count chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-2)] border border-[var(--color-border)]">
            <Calendar className="w-3 h-3 text-[var(--color-accent)]" />
            {todayClassesCount} {todayClassesCount === 1 ? "Class" : "Classes"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-2)] border border-[var(--color-border)]">
            <Clock className="w-3 h-3 text-amber-500" />
            {criticalTasksCount} {criticalTasksCount === 1 ? "Priority" : "Priorities"}
          </span>
          {upcomingExamsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-2)] border border-[var(--color-border)]">
              <BookOpen className="w-3 h-3 text-purple-500" />
              {upcomingExamsCount} {upcomingExamsCount === 1 ? "Exam" : "Exams"} soon
            </span>
          )}
        </div>
      </div>

      {/* Strategic Synthesis + AI Hydration Layer */}
      <AiBriefingHydrator
        initialStrategy={whyTheseMatter}
        initialHeadline={headline}
        isPro={isPro}
      />

      {/* Footer navigation */}
      <div className="mt-4 pt-3 flex items-center justify-between border-t border-[var(--color-border-subtle)] text-xs">
        {scheduleGaps.length > 0 ? (
          <span className="text-[var(--color-text-2)]">
            Suggested focus: <span className="font-medium text-[var(--color-text)]">{scheduleGaps[0].label}</span> ({scheduleGaps[0].startTime} - {scheduleGaps[0].endTime})
          </span>
        ) : (
          <span className="text-[var(--color-text-2)]">Track your academic velocity</span>
        )}

        <Link
          href="/dashboard/ai-buddy"
          className="inline-flex items-center gap-1 font-medium text-[var(--color-accent)] hover:underline transition-micro"
        >
          Ask Academic Advisor <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
