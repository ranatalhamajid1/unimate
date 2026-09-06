"use client";

import { useState } from "react";
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Calendar,
  Layers,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { StudyPlanData } from "@/app/lib/study-plan-definitions";
import {
  toggleStudyPlanItemAction,
  deleteStudyPlanItemAction,
  deleteStudyPlanAction,
} from "@/app/actions/study-plans";
import { AiStudyPlanModal } from "@/components/study-plan/ai-study-plan-modal";
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

export function StudyPlanView({ plan, courses }: Props) {
  const [aiModalOpen, setAiModalOpen] = useState(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
              Study Planner
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-3)]">
            Organize scheduled study blocks. Completing tasks automatically logs real study hours.
          </p>
        </div>

        <button
          onClick={() => setAiModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate Plan with AI</span>
        </button>
      </div>

      {!plan ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-[var(--color-text)]">
            No Active Study Plan
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--color-text-3)]">
            Create an intelligent study schedule tailored to your upcoming exams, deadlines, and free gap hours.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => setAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate with AI</span>
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
                <span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Active Study Plan
                </span>
                <h2 className="mt-2 text-base font-bold text-[var(--color-text)]">
                  {plan.title}
                </h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-3)]">
                  <span>{plan.items.length} sessions scheduled</span>
                  <span>·</span>
                  <span>{Math.round((plan.totalDurationMinutes / 60) * 10) / 10}h total duration</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--color-text-3)] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                >
                  Delete Plan
                </button>
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--color-text-2)]">Completion Progress</span>
                <span className="text-purple-600 dark:text-purple-400">{plan.progressPercentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <div
                  style={{ width: `${plan.progressPercentage}%` }}
                  className="h-full rounded-full bg-purple-600 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Plan Tasks List */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
            <div className="border-b border-[var(--color-border-subtle)] px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Scheduled Tasks
              </h3>
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {plan.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between px-5 py-3.5 transition-colors ${
                    item.completed ? "bg-slate-50/50 dark:bg-slate-900/20" : "hover:bg-[var(--color-surface-2)]"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleItem(item.id, item.completed)}
                      disabled={togglingId === item.id}
                      aria-label={`Mark task ${item.completed ? "incomplete" : "complete"}`}
                      className="mt-0.5 text-purple-600 dark:text-purple-400 shrink-0 cursor-pointer"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 fill-purple-600 text-white dark:text-slate-900" />
                      ) : (
                        <Circle className="h-5 w-5 text-[var(--color-text-3)] hover:text-purple-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold truncate ${
                            item.completed ? "line-through text-[var(--color-text-3)]" : "text-[var(--color-text)]"
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

                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-3)]">
                          {item.duration}m
                        </span>
                      </div>

                      {item.description && (
                        <p className="mt-1 text-xs text-[var(--color-text-3)]">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--color-text-3)]">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatPKTTime(item.scheduledAt)} ·{" "}
                          {formatPKTDate(item.scheduledAt, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    aria-label="Delete study task"
                    className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors ml-3"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      <AiStudyPlanModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />
    </div>
  );
}
