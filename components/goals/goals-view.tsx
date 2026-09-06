"use client";

import { useState } from "react";
import {
  Target,
  Award,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertTriangle,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { GoalProgressItem, GoalType, GOAL_TYPE_CONFIG } from "@/app/lib/goal-definitions";
import { upsertGoalAction, deleteGoalAction } from "@/app/actions/goals";

type Props = {
  goals: GoalProgressItem[];
};

export function GoalsView({ goals }: Props) {
  const [editingType, setEditingType] = useState<GoalType | null>(null);
  const [targetValue, setTargetValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(goal: GoalProgressItem) {
    setEditingType(goal.type);
    setTargetValue(goal.isConfigured ? goal.targetValue : goal.suggestedDefault);
    setError(null);
  }

  async function handleSave(type: GoalType) {
    setLoading(true);
    setError(null);

    const res = await upsertGoalAction(type, targetValue);
    setLoading(false);

    if (!res.success) {
      setError(res.message || "Failed to save goal.");
    } else {
      setEditingType(null);
    }
  }

  async function handleDelete(goalId: string) {
    if (!confirm("Remove this goal target?")) return;
    setLoading(true);
    await deleteGoalAction(goalId);
    setLoading(false);
  }

  function getGoalIcon(type: GoalType) {
    switch (type) {
      case "TARGET_GPA":
        return <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "WEEKLY_STUDY_HOURS":
        return <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case "ATTENDANCE":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case "ASSIGNMENT_COMPLETION":
        return <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Target className="h-4 w-4" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
            Academic & Study Goals
          </h1>
        </div>
        <p className="text-xs text-[var(--color-text-3)]">
          Set clear personal targets. UniMate measures your progress dynamically against your real academic grades, class attendance, and study hours.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* ── Goals Grid ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((goal) => {
          const isEditing = editingType === goal.type;
          const config = GOAL_TYPE_CONFIG[goal.type];
          const pctCapped = Math.min(100, Math.max(0, goal.percentage));

          return (
            <div
              key={goal.type}
              className={`rounded-2xl border bg-[var(--color-surface)] p-5 shadow-xs transition-all ${
                goal.isConfigured
                  ? "border-[var(--color-border-subtle)]"
                  : "border-dashed border-[var(--color-border)] opacity-95"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-2)]">
                    {getGoalIcon(goal.type)}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-text)]">
                      {goal.label}
                    </h2>
                    <span className="text-[11px] text-[var(--color-text-3)]">
                      {goal.isConfigured ? `Active · ${goal.period}` : "Not configured yet"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {goal.isAtRisk && (
                    <span className="flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold">
                      <AlertTriangle className="h-3 w-3" />
                      At Risk
                    </span>
                  )}
                  {goal.isConfigured && goal.goalId && !isEditing && (
                    <button
                      onClick={() => handleDelete(goal.goalId!)}
                      aria-label="Remove goal"
                      className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs text-[var(--color-text-2)] line-clamp-2">
                {goal.description}
              </p>

              {/* Display or Edit form */}
              {isEditing ? (
                <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--color-text-2)]">
                      Set Target {config.unit}
                    </label>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {config.formatValue(targetValue)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingType(null)}
                      className="rounded-lg px-2.5 py-1 text-xs text-[var(--color-text-3)] hover:bg-[var(--color-surface)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(goal.type)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-bold tracking-tight text-[var(--color-text)]">
                        {goal.formattedCurrent}
                      </span>
                      <span className="text-xs text-[var(--color-text-3)] ml-1">
                        / {goal.formattedTarget}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {goal.percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      style={{ width: `${pctCapped}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.percentage >= 100
                          ? "bg-emerald-500"
                          : goal.isAtRisk
                          ? "bg-amber-500"
                          : "bg-blue-600 dark:bg-blue-500"
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[var(--color-text-3)]">
                      {goal.isConfigured
                        ? goal.percentage >= 100
                          ? "Target achieved! 🎉"
                          : `${100 - goal.percentage}% remaining`
                        : `Default suggestion (${config.formatValue(goal.suggestedDefault)})`}
                    </span>

                    <button
                      onClick={() => startEdit(goal)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{goal.isConfigured ? "Adjust" : "Set Target"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
