"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Brain,
  Loader2,
  X,
  Target,
} from "lucide-react";
import { AcademicAdvisorOverview, AcademicAdvisorAIReport } from "@/app/lib/intelligence/academic-advisor";

type Props = {
  initialOverview?: AcademicAdvisorOverview | null;
  dailyAiQuota?: {
    remaining: number;
    limit: number;
  };
};

export function AcademicAdvisorCard({ initialOverview, dailyAiQuota }: Props) {
  const [overview, setOverview] = useState<AcademicAdvisorOverview | null>(initialOverview ?? null);
  const [aiReport, setAiReport] = useState<AcademicAdvisorAIReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [quotaRemaining, setQuotaRemaining] = useState<number>(dailyAiQuota?.remaining ?? 5);
  const [quotaLimit] = useState<number>(dailyAiQuota?.limit ?? 5);

  const handleConsultAdvisor = async () => {
    setIsGenerating(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/intelligence/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusArea: "COMPREHENSIVE" }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAiReport(json.data);
        if (json.data.overview) {
          setOverview(json.data.overview);
        }
        if (typeof json.data.quotaRemaining === "number") {
          setQuotaRemaining(json.data.quotaRemaining);
        }
        setIsModalOpen(true);
      } else {
        setErrorMsg(json.error || "Failed to generate AI Advisor evaluation.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error reaching advisor service.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!overview) {
    return null;
  }

  const getHealthBadge = () => {
    switch (overview.academicHealth) {
      case "EXCELLENT":
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
          label: "Exceptional",
          style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        };
      case "GOOD":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />,
          label: "On Track",
          style: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        };
      case "NEEDS_ATTENTION":
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
          label: "Action Needed",
          style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        };
      case "CRITICAL":
        return {
          icon: <AlertOctagon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />,
          label: "Critical Attention",
          style: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
        };
      case "INSUFFICIENT_DATA":
      default:
        return {
          icon: <Sparkles className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />,
          label: "Setup Records",
          style: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
        };
    }
  };

  const health = getHealthBadge();

  return (
    <>
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs transition-all hover:border-[var(--color-border)]">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Brain className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              AI Academic Advisor
            </h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${health.style}`}>
            {health.icon}
            {health.label}
          </span>
        </div>

        {/* Primary Focus */}
        {overview.primaryFocus && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 mb-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              <span>PRIMARY FOCUS</span>
              {overview.primaryFocus.courseCode && (
                <span className="rounded bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.2">
                  {overview.primaryFocus.courseCode}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text)]">
              {overview.primaryFocus.action}
            </p>
            <p className="text-[11px] text-[var(--color-text-2)] mt-0.5">
              {overview.primaryFocus.reason}
            </p>
          </div>
        )}

        {/* Predictive Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Attendance Forecast */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-2.5">
            <span className="text-[10px] font-semibold text-[var(--color-text-3)] uppercase tracking-wider block mb-1">
              Attendance Health
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-[var(--color-text)]">
                {overview.attendanceSummary.overallPercentageString}
              </span>
              <span className="text-[10.5px] text-[var(--color-text-2)]">
                {overview.attendanceSummary.atRiskCount > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    {overview.attendanceSummary.atRiskCount} at risk
                  </span>
                ) : overview.attendanceSummary.watchCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {overview.attendanceSummary.watchCount} on watch
                  </span>
                ) : (
                  "Safe buffer"
                )}
              </span>
            </div>
          </div>

          {/* GPA & Target Feasibility */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-2.5">
            <span className="text-[10px] font-semibold text-[var(--color-text-3)] uppercase tracking-wider block mb-1">
              GPA Standing
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-[var(--color-text)]">
                {overview.gpaStanding.currentGpaString}
              </span>
              {overview.gpaStanding.targetGpa !== null ? (
                <span className="text-[10.5px] text-[var(--color-text-2)]">
                  Target: {overview.gpaStanding.targetGpaString}
                </span>
              ) : (
                <span className="text-[10.5px] text-[var(--color-text-3)]">
                  No target
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button & Quota Counter */}
        <div className="pt-1 flex items-center justify-between gap-2 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-3)]">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>
              {quotaRemaining} / {quotaLimit} AI requests left today
            </span>
          </div>

          <button
            onClick={handleConsultAdvisor}
            disabled={isGenerating || quotaRemaining <= 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Brain className="h-3.5 w-3.5" />
                <span>Ask Advisor</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">
            {errorMsg}
          </p>
        )}
      </div>

      {/* AI Academic Advisor Modal */}
      {isModalOpen && aiReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Brain className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">
                    Academic Advisor Strategy
                  </h3>
                  <span className="text-[11px] text-[var(--color-text-3)] flex items-center gap-1">
                    {aiReport.source === "ai" ? "Gemini AI Synthesized" : "Deterministic Engine Plan"}
                    {aiReport.explanationNote ? ` • ${aiReport.explanationNote}` : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-[var(--color-text)]">
              {/* Executive Summary */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Executive Briefing
                </span>
                <p className="leading-relaxed text-[12.5px] text-[var(--color-text)]">
                  {aiReport.executiveSummary}
                </p>
              </div>

              {/* Primary Recommendation */}
              <div>
                <span className="text-[10px] font-bold text-[var(--color-text-3)] uppercase tracking-wider block mb-1">
                  Immediate Priority
                </span>
                <p className="text-[12.5px] font-semibold text-[var(--color-text)]">
                  {aiReport.primaryRecommendation}
                </p>
              </div>

              {/* Action Plan */}
              <div>
                <span className="text-[10px] font-bold text-[var(--color-text-3)] uppercase tracking-wider block mb-1.5">
                  Strategic Action Steps
                </span>
                <ul className="space-y-1.5">
                  {aiReport.strategicActionPlan.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-2.5 text-[12px] leading-relaxed"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Study Strategy */}
              {aiReport.studyStrategy && (
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
                  <span className="text-[10px] font-bold text-[var(--color-text-3)] uppercase tracking-wider block mb-1">
                    Daily Schedule Optimization
                  </span>
                  <p className="text-[12px] text-[var(--color-text-2)] leading-relaxed">
                    {aiReport.studyStrategy}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[var(--color-border)] px-5 py-3 flex items-center justify-between bg-[var(--color-surface-2)]">
              <span className="text-[11px] text-[var(--color-text-3)]">
                {quotaRemaining} / {quotaLimit} AI requests left today
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
