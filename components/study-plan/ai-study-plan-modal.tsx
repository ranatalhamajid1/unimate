"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Trash2,
  AlertCircle,
  Check,
} from "lucide-react";
import { DraftStudyPlan, DraftPlanItem } from "@/app/lib/study-plan-definitions";
import { createStudyPlanAction } from "@/app/actions/study-plans";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AiStudyPlanModal({ isOpen, onClose, onSuccess }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [availableHours, setAvailableHours] = useState<number>(3);
  const [preferredStartTime, setPreferredStartTime] = useState<string>("18:00");
  const [focusInstruction, setFocusInstruction] = useState<string>("");
  const [draftPlan, setDraftPlan] = useState<DraftStudyPlan | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setDraftPlan(null);

    try {
      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableHours,
          preferredStartTime,
          targetDate: todayStr,
          focusInstruction: focusInstruction.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate plan.");
      }

      setDraftPlan(data.plan);
      setIsFallback(Boolean(data.isFallback));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating study plan.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  function handleRemoveDraftItem(index: number) {
    if (!draftPlan) return;
    const newItems = draftPlan.items.filter((_, i) => i !== index);
    setDraftPlan({ ...draftPlan, items: newItems });
  }

  async function handleConfirmAndSave() {
    if (!draftPlan || draftPlan.items.length === 0) {
      setError("Study plan must have at least one session.");
      return;
    }

    setSaving(true);
    setError(null);

    const targetDate = new Date(`${draftPlan.targetDate}T12:00:00`);

    const itemsPayload = draftPlan.items.map((it, idx) => {
      // Calculate scheduledAt based on suggestedTime or staggered
      const [h, m] = (it.suggestedTime || "18:00").split(":").map(Number);
      const scheduledAt = new Date(targetDate);
      scheduledAt.setHours(h || 18, m || 0, 0, 0);

      return {
        courseId: it.courseId || null,
        title: it.title,
        description: it.reason,
        scheduledAt,
        duration: it.duration,
        order: idx,
      };
    });

    const res = await createStudyPlanAction(
      {
        title: draftPlan.title,
        startDate: targetDate,
        endDate: targetDate,
      },
      itemsPayload
    );

    setSaving(false);

    if (!res.success) {
      setError(res.message || "Failed to save study plan.");
    } else {
      onClose();
      if (onSuccess) onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-study-plan-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 id="ai-study-plan-title" className="text-base font-semibold text-[var(--color-text)]">
                AI Study Plan Generator
              </h2>
              <p className="text-[11px] text-[var(--color-text-3)]">
                Generates a personalized schedule matching your open gaps and deadlines.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {!draftPlan ? (
          /* Step 1: Configuration Form */
          <form onSubmit={handleGenerate} className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-2)]">
                  Available Study Time Today
                </label>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {availableHours} hours ({availableHours * 60}m)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setAvailableHours(h)}
                    className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                      availableHours === h
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                        : "border-[var(--color-border-subtle)] text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)]"
                    }`}
                  >
                    {h} {h === 1 ? "hour" : "hours"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-2)] mb-1.5">
                Preferred Start Time
              </label>
              <input
                type="time"
                value={preferredStartTime}
                onChange={(e) => setPreferredStartTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs text-[var(--color-text)] focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-2)] mb-1.5">
                Optional Focus / Special Instructions
              </label>
              <input
                type="text"
                value={focusInstruction}
                onChange={(e) => setFocusInstruction(e.target.value)}
                placeholder="e.g. Focus on DLD Boolean algebra or finish Lab 4"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-3)] focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{generating ? "Analyzing & Generating..." : "Generate Draft Plan"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Draft Review & Confirmation */
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--color-text)]">
                  {draftPlan.title}
                </h3>
                {isFallback ? (
                  <span className="rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20 px-1.5 py-0.5 text-[9.5px] font-semibold">
                    Local Planner
                  </span>
                ) : (
                  <span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.5 text-[9.5px] font-semibold">
                    AI Suggested
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-2)]">
                {draftPlan.summary}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--color-text-2)] mb-2">
                Proposed Study Blocks ({draftPlan.items.length}):
              </p>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {draftPlan.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {item.courseCode && (
                          <span className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 text-[9.5px] font-bold">
                            {item.courseCode}
                          </span>
                        )}
                        <p className="text-xs font-semibold text-[var(--color-text)] truncate">
                          {item.title}
                        </p>
                        <span className="text-[11px] font-semibold text-[var(--color-text-3)] shrink-0">
                          {item.duration}m
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--color-text-3)] line-clamp-1">
                        {item.reason}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDraftItem(idx)}
                      aria-label="Remove item"
                      className="rounded-lg p-1 text-[var(--color-text-3)] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setDraftPlan(null)}
                className="text-xs font-medium text-[var(--color-text-3)] hover:text-[var(--color-text)]"
              >
                Back to Edit
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  disabled={saving || draftPlan.items.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{saving ? "Saving..." : "Confirm & Save Plan"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
