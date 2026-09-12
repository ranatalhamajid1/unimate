"use client";

import Link from "next/link";
import { Award, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react";
import type { AcademicOverviewData } from "@/app/lib/dashboard-aggregation";

interface AcademicSnapshotCardProps {
  academic: AcademicOverviewData;
  examReadinessStatus?: "ON TRACK" | "NEEDS ATTENTION" | "AT RISK" | "INSUFFICIENT DATA";
  examReadinessReason?: string;
}

export function AcademicSnapshotCard({
  academic,
  examReadinessStatus = "ON TRACK",
  examReadinessReason,
}: AcademicSnapshotCardProps) {
  // Attendance status assessment
  const isBelowThreshold = academic.isBelowThreshold;
  const configuredThresholdPercent = Math.round(academic.configuredThreshold * 100);

  // Exam readiness pill styling
  const readinessBadge = {
    "ON TRACK": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "NEEDS ATTENTION": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "AT RISK": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    "INSUFFICIENT DATA": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  }[examReadinessStatus];

  return (
    <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl p-5 shadow-xs transition-standard [box-shadow:var(--shadow-xs),var(--specular-top)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Award className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Academic Standing
          </h2>
        </div>
        <Link
          href="/dashboard/academics"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Primary 2-column metric cards */}
      <div className="grid grid-cols-2 gap-3 py-1">
        {/* GPA Tile */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 backdrop-blur-sm p-3">
          <p className="text-[10.5px] font-bold text-[var(--color-text-3)] uppercase tracking-wider">
            Cumulative GPA
          </p>
          <p className="kpi-numeric text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {academic.gpaString}
          </p>
          <p className="text-[11px] text-[var(--color-text-3)] mt-0.5 truncate">
            {academic.gpaSub}
          </p>
        </div>

        {/* Attendance Tile */}
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-bold text-[var(--color-text-3)] uppercase tracking-wider">
              Attendance
            </p>
            {isBelowThreshold ? (
              <span title="Below configured threshold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              </span>
            ) : (
              <span title="Threshold met">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </span>
            )}
          </div>
          <p
            className={`kpi-numeric text-xl font-bold mt-1 ${
              isBelowThreshold
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {academic.attendanceString}
          </p>
          <p className="text-[11px] text-[var(--color-text-3)] mt-0.5 truncate">
            {academic.attendanceSub}
          </p>
        </div>
      </div>

      {/* Attendance Policy Notice */}
      {isBelowThreshold && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          <p className="font-medium">
            Attendance is below your configured threshold ({configuredThresholdPercent}%).
          </p>
          {academic.totalClassesCount > 0 && (
            <p className="mt-0.5 text-[11px] opacity-90">
              {academic.attendedClassesCount} attended out of {academic.totalClassesCount} scheduled classes.
            </p>
          )}
        </div>
      )}

      {/* Exam Readiness Indicator */}
      <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-text)]">Exam Readiness</p>
          {examReadinessReason && (
            <p className="text-[11px] text-[var(--color-text-3)] truncate mt-0.5">
              {examReadinessReason}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${readinessBadge}`}
        >
          {examReadinessStatus}
        </span>
      </div>
    </div>
  );
}
