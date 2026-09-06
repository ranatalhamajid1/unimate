"use client";

import { useState } from "react";
import { X, Timer, BookOpen, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { createStudySessionAction } from "@/app/actions/study-sessions";
import { StudySessionFormValues } from "@/app/lib/study-session-definitions";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseOption[];
  defaultCourseId?: string;
  onSuccess?: () => void;
};

const QUICK_DURATIONS = [25, 45, 60, 90, 120];

export function LogSessionModal({
  isOpen,
  onClose,
  courses,
  defaultCourseId,
  onSuccess,
}: Props) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [courseId, setCourseId] = useState<string>(defaultCourseId || "");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [sessionDate, setSessionDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title or topic for your study session.");
      return;
    }
    if (duration <= 0 || duration > 1440) {
      setError("Duration must be between 1 and 1440 minutes.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: StudySessionFormValues = {
      courseId: courseId || null,
      title: title.trim(),
      duration: Math.round(duration),
      sessionDate: new Date(`${sessionDate}T12:00:00`),
      source: "MANUAL",
      completed: true,
    };

    const res = await createStudySessionAction(payload);
    setLoading(false);

    if (!res.success) {
      setError(res.message || "Failed to log session. Please try again.");
    } else {
      setTitle("");
      setDuration(60);
      onClose();
      if (onSuccess) onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-session-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Timer className="h-4 w-4" />
            </span>
            <h2 id="log-session-title" className="text-base font-semibold text-[var(--color-text)]">
              Log Study Session
            </h2>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Course selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-2)] mb-1.5">
              Course (Optional)
            </label>
            <div className="relative">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">General / Self Study</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Session Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-2)] mb-1.5">
              Topic / Activity <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Practice Problems, Final Prep"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-3)] focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Duration in minutes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-2)]">
                Duration (minutes) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}h ` : ""}
                {duration % 60 > 0 || Math.floor(duration / 60) === 0 ? `${duration % 60}m` : ""}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              {QUICK_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold border transition-all ${
                    duration === d
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                      : "border-[var(--color-border-subtle)] text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)]"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              max="1440"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs text-[var(--color-text)] focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-2)] mb-1.5">
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs text-[var(--color-text)] focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
