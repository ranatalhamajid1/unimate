"use client";

import { Calendar, Clock, Award, FileText, Sparkles } from "lucide-react";

export const STARTER_PROMPTS = [
  {
    icon: Calendar,
    title: "Plan my study day",
    prompt: "Plan my study day based on my timetable and upcoming tasks.",
  },
  {
    icon: FileText,
    title: "What's due this week?",
    prompt: "What assignments are due this week and which one should I do first?",
  },
  {
    icon: Clock,
    title: "Which exam should I prepare for?",
    prompt: "Which exam is coming up next and how should I start preparing?",
  },
  {
    icon: Award,
    title: "How can I improve my attendance?",
    prompt: "How is my attendance looking across all my courses, and where do I need to be careful?",
  },
];

export function StarterPrompts({
  onSelectPrompt,
  disabled = false,
}: {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {STARTER_PROMPTS.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-left text-[var(--color-text-2)] shadow-xs transition-all duration-150 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 hover:text-blue-900 dark:hover:text-blue-300 disabled:opacity-50 disabled:pointer-events-none group"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50 text-[var(--color-text-2)] transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[var(--color-text)] truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                {item.title}
              </p>
              <p className="text-[11.5px] text-[var(--color-text-3)] truncate">
                {item.prompt}
              </p>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-blue-500 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
