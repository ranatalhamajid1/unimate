"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Layers,
  Play,
  AlertTriangle,
  Flame,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import {
  StudyPlanData,
  AdaptiveDraftPlan,
  isStudyPlanItemMissed,
  PlanningHorizon,
} from "@/app/lib/study-plan-definitions";
import {
  toggleStudyPlanItemAction,
  deleteStudyPlanItemAction,
  deleteStudyPlanAction,
} from "@/app/actions/study-plans";
import { formatPKTDate, formatPKTTime } from "@/app/lib/timezone";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type Props = {
  plan: StudyPlanData | null;
  courses: CourseOption[];
};

export function StudyPlanView({ plan }: Props) {
  const [plannerModalOpen, setPlannerModalOpen] = useState(false);
  const [horizon, setHorizon] = useState<PlanningHorizon>(7);
  const [includeAi, setIncludeAi] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [draftPlan, setDraftPlan] = useState<AdaptiveDraftPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleItem(itemId: string, currentCompleted: boolean) {
    setTogglingId(itemId);
    await toggleStudyPlanItemAction(itemId, !currentCompleted, true);
    setTogglingId(null);
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Delete this scheduled study task?")) return;
    await deleteStudyPlanItemAction(itemId);
  }

  async function handleDeletePlan(planId: string) {
    if (!confirm("Delete this entire study plan?")) return;
    await deleteStudyPlanAction(planId);
  }

  async function handleGeneratePlan() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizonDays: horizon, includeAiExplanation: includeAi }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate adaptive plan.");
      }
      setDraftPlan(data.draftPlan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate plan.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAcceptDraft() {
    if (!draftPlan || draftPlan.items.length === 0) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plans/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftPlan.title,
          startDate: draftPlan.startDate,
          endDate: draftPlan.endDate,
          items: draftPlan.items,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept study plan.");
      }
      setPlannerModalOpen(false);
      setDraftPlan(null);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept plan.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
              Adaptive Study Planner
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-3)]">
            Intelligent, timetable-aware study schedules reconciled with your real Focus Session progress.
          </p>
        </div>

        <button
          onClick={() => {
            setPlannerModalOpen(true);
            handleGeneratePlan();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>{plan ? "Regenerate Plan" : "Generate Study Plan"}</span>
        </button>
      </div>

      {!plan ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-[var(--color-text)]">No Active Study Plan</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--color-text-3)]">
            UniMate analyzes your course assignments, exam readiness, and class schedule to build an actionable study plan.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setPlannerModalOpen(true);
                handleGeneratePlan();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Adaptive Plan</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Plan View */
        <div className="space-y-5">
          {/* Plan Header Card */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Active Plan
                  </span>
                  <span className="text-xs text-[var(--color-text-3)] kpi-numeric">
                    {formatPKTDate(plan.startDate, { month: "short", day: "numeric" })} –{" "}
                    {formatPKTDate(plan.endDate, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <h2 className="mt-2 text-base font-bold text-[var(--color-text)]">{plan.title}</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-3)]">
                  <span className="kpi-numeric font-medium">{plan.items.length} study blocks</span>
                  <span>·</span>
                  <span className="kpi-numeric font-medium">{Math.round((plan.totalDurationMinutes / 60) * 10) / 10}h scheduled</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--color-text-3)] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                >
                  Delete Plan
                </button>
                <button
                  onClick={() => {
                    setPlannerModalOpen(true);
                    handleGeneratePlan();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Adjust & Regenerate</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--color-text-2)]">Completion Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400 kpi-numeric font-bold">{plan.progressPercentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <div
                  style={{ width: `${plan.progressPercentage}%` }}
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Scheduled Tasks List */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
            <div className="border-b border-[var(--color-border-subtle)] px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Scheduled Study Blocks
              </h3>
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {plan.items.map((item) => {
                const isMissed = isStudyPlanItemMissed(item);
                const focusHref = `/dashboard/study?targetType=${encodeURIComponent(
                  item.targetType || "STUDY_PLAN_ITEM"
                )}&targetId=${encodeURIComponent(item.targetId || item.id)}&title=${encodeURIComponent(
                  item.title
                )}&courseId=${encodeURIComponent(item.courseId || "")}&plannedMinutes=${item.duration}`;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between px-5 py-3.5 transition-colors ${
                      item.completed
                        ? "bg-slate-50/50 dark:bg-slate-900/20"
                        : isMissed
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-[var(--color-surface-2)]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleItem(item.id, item.completed)}
                        disabled={togglingId === item.id}
                        aria-label={`Mark task ${item.completed ? "incomplete" : "complete"}`}
                        className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0 cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 fill-indigo-600 text-white dark:text-slate-900" />
                        ) : (
                          <Circle className="h-5 w-5 text-[var(--color-text-3)] hover:text-indigo-600" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-semibold truncate ${
                              item.completed
                                ? "line-through text-[var(--color-text-3)]"
                                : "text-[var(--color-text)]"
                            }`}
                          >
                            {item.title}
                          </span>

                          {item.course && (
                            <span
                              style={{
                                backgroundColor: `${item.course.color}15`,
                                color: item.course.color,
                                borderColor: `${item.course.color}30`,
                              }}
                              className="rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold shrink-0"
                            >
                              {item.course.code}
                            </span>
                          )}

                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-3)] kpi-numeric">
                            {item.duration}m
                          </span>

                          {isMissed && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 text-[9.5px] font-bold">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Missed Window
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="mt-1 text-xs text-[var(--color-text-3)]">{item.description}</p>
                        )}

                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--color-text-3)] kpi-numeric">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatPKTTime(item.scheduledAt)} ·{" "}
                            {formatPKTDate(item.scheduledAt, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {!item.completed && (
                        <Link
                          href={focusHref}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-[0.98] transition-all"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Start Focus</span>
                        </Link>
                      )}

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label="Delete study task"
                        className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Adaptive Study Planner Generation & Draft Modal */}
      {plannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-spatial overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-[var(--color-text)]">
                  Adaptive Study Plan Generator
                </h3>
              </div>
              <button
                onClick={() => setPlannerModalOpen(false)}
                className="rounded-lg p-1 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Horizon & Settings Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)]">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text)]">Planning Horizon</label>
                  <p className="text-[11px] text-[var(--color-text-3)]">
                    Allocate study windows across your weekly schedule
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setHorizon(7);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      horizon === 7
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-2)] hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    7 Days (Free)
                  </button>
                  <button
                    onClick={() => {
                      setHorizon(14);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      horizon === 14
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-2)] hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    14 Days (Pro)
                  </button>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generating}
                    className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{generating ? "Calculating..." : "Recalculate"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {generating ? (
                <div className="py-12 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <p className="mt-2 text-xs text-[var(--color-text-3)]">
                    Analyzing timetable gaps, exam readiness & priority backlog...
                  </p>
                </div>
              ) : draftPlan ? (
                <div className="space-y-4">
                  {/* Feasibility Overview Card */}
                  <div
                    className={`p-4 rounded-xl border ${
                      draftPlan.feasibility.status === "OVERLOADED"
                        ? "bg-rose-500/5 border-rose-500/25"
                        : draftPlan.feasibility.status === "TIGHT"
                        ? "bg-amber-500/5 border-amber-500/25"
                        : "bg-emerald-500/5 border-emerald-500/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            draftPlan.feasibility.status === "OVERLOADED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : draftPlan.feasibility.status === "TIGHT"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {draftPlan.feasibility.status}
                        </span>
                        <span className="text-xs font-semibold text-[var(--color-text)] kpi-numeric">
                          {(draftPlan.feasibility.totalAvailableMinutes / 60).toFixed(1)}h Available /{" "}
                          {(draftPlan.feasibility.totalRequiredMinutes / 60).toFixed(1)}h Required
                        </span>
                      </div>
                      {draftPlan.feasibility.deficitMinutes > 0 && (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 kpi-numeric">
                          -{(draftPlan.feasibility.deficitMinutes / 60).toFixed(1)}h deficit
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-text-2)]">{draftPlan.feasibility.notice}</p>
                  </div>

                  {/* AI Advice Pill if available */}
                  {draftPlan.aiExplanation && (
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
                      <div>
                        <span className="font-bold">AI Strategy Advice: </span>
                        <span>{draftPlan.aiExplanation}</span>
                      </div>
                    </div>
                  )}

                  {/* Unallocated Backlog Section */}
                  {draftPlan.unallocatedTasks.length > 0 && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Urgent Unallocated Backlog ({draftPlan.unallocatedTasks.length})</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-3)]">
                        These items could not fit before deadline due to packed timetable commitments:
                      </p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {draftPlan.unallocatedTasks.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]"
                          >
                            <span className="font-semibold text-[var(--color-text)] truncate mr-2">
                              {t.courseCode} · {t.title}
                            </span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold shrink-0 kpi-numeric">
                              {t.remainingMinutes}m shortfall
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated Blocks Preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                      Proposed Study Schedule ({draftPlan.items.length} blocks)
                    </h4>
                    <div className="divide-y divide-[var(--color-border-subtle)] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] overflow-hidden max-h-56 overflow-y-auto">
                      {draftPlan.items.map((it, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[var(--color-text)] truncate">{it.title}</span>
                              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[9.5px] font-bold text-[var(--color-text-3)]">
                                {it.courseCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--color-text-3)] mt-0.5 kpi-numeric">
                              {formatPKTTime(it.scheduledAt)} · {formatPKTDate(it.scheduledAt, { month: "short", day: "numeric" })} · {it.duration} min
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md shrink-0">
                            {it.urgencyTier}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] px-6 py-4 bg-[var(--color-surface)]">
              <button
                onClick={() => setPlannerModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] rounded-xl transition-colors"
              >
                Cancel
              </button>
              {draftPlan && (
                <button
                  onClick={handleAcceptDraft}
                  disabled={accepting || draftPlan.items.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{accepting ? "Saving Plan..." : "Accept & Commit Plan"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
