/**
 * AiBuddyCard — functional AI Study Buddy dashboard card.
 * Connected to /dashboard/ai.
 */

import Link from "next/link";
import { Sparkles, ArrowRight, MessageSquare } from "lucide-react";

export function AiBuddyCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5">
      {/* Subtle glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <h2 className="text-[14px] font-semibold text-white">
              AI Study Buddy
            </h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[10.5px] font-medium text-blue-300 border border-blue-500/30">
            Active
          </span>
        </div>

        {/* Body */}
        <p className="mb-4 text-[13px] leading-relaxed text-slate-400">
          Need help preparing for your next exam or managing deadlines? Let AI create a personalized study schedule.
        </p>

        {/* Suggestion chip */}
        <Link
          href="/dashboard/ai?prompt=Plan%20my%20study%20day%20based%20on%20my%20timetable%20and%20upcoming%20tasks"
          className="mb-4 block rounded-xl border border-slate-700/60 bg-slate-800/60 px-3.5 py-2.5 transition-colors hover:border-blue-500/50 hover:bg-slate-800"
        >
          <p className="text-[11.5px] font-medium text-slate-400 mb-0.5">
            Suggested
          </p>
          <p className="text-[13px] text-slate-200">
            Plan my study day based on my timetable and tasks →
          </p>
        </Link>

        {/* Buttons */}
        <div className="flex gap-2">
          <Link
            href="/dashboard/ai?prompt=Create%20a%20study%20plan%20for%20today"
            aria-label="Create study plan"
            className="group flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-blue-500"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create study plan
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/dashboard/ai"
            aria-label="Ask AI Study Buddy"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3.5 py-2.5 text-[13px] font-medium text-slate-300 transition-all duration-200 hover:border-slate-600 hover:text-white"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask AI
          </Link>
        </div>
      </div>
    </div>
  );
}
