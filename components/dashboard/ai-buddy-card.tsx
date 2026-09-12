/**
 * AiBuddyCard — functional AI Study Buddy dashboard card.
 * Connected to /dashboard/ai with refined Linear-style intelligence visual treatment.
 */

import Link from "next/link";
import { Sparkles, ArrowRight, MessageSquare } from "lucide-react";

export function AiBuddyCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-2)] dark:from-[#131722] dark:to-[#0f131c] p-5 shadow-xs transition-standard card-hover">
      {/* Subtle intelligent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.14) 0%, transparent 70%)",
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/15 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
              AI Study Buddy
            </h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-violet-600 dark:text-violet-400 border border-violet-500/25">
            Intelligence
          </span>
        </div>

        {/* Body */}
        <p className="mb-4 text-[13px] leading-relaxed text-[var(--color-text-2)]">
          Need help preparing for your next exam or managing deadlines? Let AI organize an adaptive study schedule.
        </p>

        {/* Suggestion chip */}
        <Link
          href="/dashboard/ai?prompt=Plan%20my%20study%20day%20based%20on%20my%20timetable%20and%20upcoming%20tasks"
          className="mb-4 block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 transition-micro hover:border-violet-500/40 hover:bg-violet-500/5 interactive-press"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-0.5">
            Suggested Prompt
          </p>
          <p className="text-[13px] text-[var(--color-text)]">
            Plan my study day based on my timetable and tasks →
          </p>
        </Link>

        {/* Buttons */}
        <div className="flex gap-2">
          <Link
            href="/dashboard/ai?prompt=Create%20a%20study%20plan%20for%20today"
            aria-label="Create study plan"
            className="group flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-[13px] font-medium text-white transition-micro hover:bg-violet-700 active:scale-[0.985]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create study plan
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/dashboard/ai"
            aria-label="Ask AI Study Buddy"
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-text)] transition-micro hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400 active:scale-[0.985]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask AI
          </Link>
        </div>
      </div>
    </div>
  );
}
