"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Target,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { WeeklyReviewData, ScorecardRating } from "@/app/lib/weekly-review";

interface WeeklyReviewViewProps {
  initialData: WeeklyReviewData;
  isPro: boolean;
}

export function WeeklyReviewView({ initialData, isPro }: WeeklyReviewViewProps) {
  const [data, setData] = useState<WeeklyReviewData>(initialData);
  const [weekOffset, setWeekOffset] = useState<number>(initialData.isCurrentWeek ? 0 : -1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFetchWeek = async (offset: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/intelligence/weekly-review?weekOffset=${offset}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setWeekOffset(offset);
      }
    } catch (err) {
      console.error("Failed to fetch weekly review:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingBadge = (rating: ScorecardRating) => {
    switch (rating) {
      case "STRONG":
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Strong</span>;
      case "ON_TRACK":
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">On Track</span>;
      case "NEEDS_ATTENTION":
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Needs Attention</span>;
      case "INSUFFICIENT_DATA":
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-500/10 text-[var(--color-text-3)] border border-[var(--color-border-subtle)]">No Data</span>;
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "A":
        return <span className="text-xl font-black px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">Grade A</span>;
      case "B":
        return <span className="text-xl font-black px-3 py-1 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">Grade B</span>;
      case "C":
        return <span className="text-xl font-black px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Grade C</span>;
      case "D":
        return <span className="text-xl font-black px-3 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">Grade D</span>;
      default:
        return <span className="text-xl font-black px-3 py-1 rounded-xl bg-slate-500/10 text-[var(--color-text-3)] border border-[var(--color-border-subtle)]">Incomplete</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-fade-in">
      {/* Top Header & Week Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Performance OS
            </span>
            <span className="text-[var(--color-text-3)]">•</span>
            <span className="text-xs font-medium text-[var(--color-text-3)]">Milestone 15.5</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
            Weekly Review
            {getGradeBadge(data.scorecard.overallGrade)}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-3)] mt-1">
            Deterministic debrief of your academic execution, study stamina, and course health.
          </p>
        </div>

        {/* Week Controller */}
        <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-1.5 self-start md:self-auto shadow-xs">
          <button
            onClick={() => handleFetchWeek(weekOffset - 1)}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
            title="Previous Week"
            aria-label="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 text-center min-w-[140px]">
            <div className="text-xs font-semibold text-[var(--color-text)]">{data.weekLabel}</div>
            <div className="text-[10px] text-[var(--color-text-3)] kpi-numeric">
              {data.isCurrentWeek ? "Current Week" : `Week Offset ${weekOffset}`}
            </div>
          </div>
          <button
            onClick={() => handleFetchWeek(weekOffset + 1)}
            disabled={isLoading || weekOffset >= 0}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)] hover:text-[var(--color-text)] transition-colors disabled:opacity-30"
            title="Next Week"
            aria-label="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Coach's Debrief (Tier-2 Pro) */}
      {Boolean(data.aiExecutiveSummary) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/20 via-indigo-950/15 to-purple-950/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-500/20 p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--color-text)] tracking-wide uppercase">AI Academic Coach Debrief</h2>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">Pro Synthesized</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-2)] leading-relaxed">
                {data.aiExecutiveSummary}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isPro && (
        <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-4 text-xs text-[var(--color-text-2)] shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Upgrade to <strong>UniMate Pro</strong> to unlock personalized AI performance coaching and next-week strategic focus planning.</span>
          </div>
          <Link
            href="/dashboard/billing"
            className="ml-4 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium whitespace-nowrap transition-all shadow-xs"
          >
            Explore Pro
          </Link>
        </div>
      )}

      {/* 4-Dimension Academic Scorecard */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-[var(--color-text-3)]" />
          4-Dimension Performance Scorecard
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Execution */}
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-[var(--color-text)]">Execution</span>
              </div>
              {getRatingBadge(data.scorecard.execution.rating)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[var(--color-text)] kpi-numeric">{data.scorecard.execution.scorePercentage}%</span>
              <span className="text-xs text-[var(--color-text-3)]">completion</span>
            </div>
            <p className="text-xs text-[var(--color-text-2)] leading-relaxed">
              {data.scorecard.execution.summary}
            </p>
          </div>

          {/* 2. Planning */}
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-[var(--color-text)]">Planning</span>
              </div>
              {getRatingBadge(data.scorecard.planning.rating)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[var(--color-text)] kpi-numeric">{data.scorecard.planning.scorePercentage}%</span>
              <span className="text-xs text-[var(--color-text-3)]">adherence</span>
            </div>
            <p className="text-xs text-[var(--color-text-2)] leading-relaxed">
              {data.scorecard.planning.summary}
            </p>
          </div>

          {/* 3. Focus */}
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-[var(--color-text)]">Focus Stamina</span>
              </div>
              {getRatingBadge(data.scorecard.focus.rating)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[var(--color-text)] kpi-numeric">{(data.metrics.totalFocusMinutes / 60).toFixed(1)}h</span>
              <span className="text-xs text-[var(--color-text-3)]">logged</span>
            </div>
            <p className="text-xs text-[var(--color-text-2)] leading-relaxed">
              {data.scorecard.focus.summary}
            </p>
          </div>

          {/* 4. Academic Health */}
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-[var(--color-text)]">Academic Health</span>
              </div>
              {getRatingBadge(data.scorecard.academicHealth.rating)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[var(--color-text)] kpi-numeric">{data.metrics.attendanceRate}%</span>
              <span className="text-xs text-[var(--color-text-3)]">attendance</span>
            </div>
            <p className="text-xs text-[var(--color-text-2)] leading-relaxed">
              {data.scorecard.academicHealth.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Next-Week Recommendations & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommendations */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Next-Week Strategic Actions
            </h2>
            <Link
              href="/dashboard/study"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Study Hub <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ul className="space-y-2.5">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-[var(--color-text-2)]">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Highlights */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Weekly Wins & Milestones
          </h2>
          <ul className="space-y-2.5">
            {data.highlights.map((h, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-[var(--color-text-2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--color-text)]">Course-by-Course Performance Breakdown</h2>
          <span className="text-xs text-[var(--color-text-3)] font-medium kpi-numeric">{data.courseSummaries.length} enrolled subjects</span>
        </div>

        {data.courseSummaries.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-3)] text-xs">
            No courses enrolled. Add courses in the Academic Directory to track weekly course performance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--color-text-2)]">
              <thead className="bg-[var(--color-surface-2)] text-[var(--color-text-3)] font-semibold border-b border-[var(--color-border-subtle)]">
                <tr>
                  <th className="p-3.5">Course</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Assignments</th>
                  <th className="p-3.5">Focus Time</th>
                  <th className="p-3.5">Current Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {data.courseSummaries.map((c) => (
                  <tr key={c.courseId} className="hover:bg-[var(--color-surface-2)]/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.courseColor || "#3B82F6" }}
                        />
                        <div>
                          <div className="font-bold text-[var(--color-text)]">{c.courseCode}</div>
                          <div className="text-[11px] text-[var(--color-text-3)] line-clamp-1">{c.courseName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--color-text)] kpi-numeric">
                        {c.attendance.percentage}%
                      </div>
                      <div className="text-[11px] text-[var(--color-text-3)] kpi-numeric">
                        {c.attendance.attended}/{c.attendance.scheduled} classes
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--color-text)] kpi-numeric">
                        {c.assignments.completed}/{c.assignments.due} done
                      </div>
                      {c.assignments.overdue > 0 && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold kpi-numeric">
                          <AlertCircle className="w-3 h-3" /> {c.assignments.overdue} overdue
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--color-text)] kpi-numeric">
                      {(c.focusMinutes / 60).toFixed(1)}h
                    </td>
                    <td className="p-3.5">
                      {c.grade ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--color-text)] px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] w-fit kpi-numeric">
                            {c.grade.letter} ({c.grade.points})
                          </span>
                          <span className="text-[10px] text-[var(--color-text-3)] mt-0.5">Current Academic GPA</span>
                        </div>
                      ) : (
                        <span className="text-[var(--color-text-3)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
