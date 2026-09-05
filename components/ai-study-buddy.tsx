import { Sparkles, Bot, User, CheckCircle2, Send } from "lucide-react";

const PLAN_ITEMS = [
  { num: "01", label: "Number Systems", time: "40 min" },
  { num: "02", label: "Boolean Algebra", time: "45 min" },
  { num: "03", label: "K-Maps", time: "60 min" },
  { num: "04", label: "Logic Gates", time: "30 min" },
  { num: "05", label: "Practice Questions", time: "45 min" },
];

export function AIStudyBuddy() {
  return (
    <section
      id="ai-study-buddy"
      className="scroll-mt-24 relative overflow-hidden bg-[#0B1120] px-4 py-20 sm:py-28"
    >
      {/* Ambient glow — top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 0%, rgba(37,99,235,0.16) 0%, transparent 70%)",
        }}
      />
      {/* Ambient glow — bottom right */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-2 lg:gap-16">
        {/* ── Left: Copy ──────────────────────────────────────────── */}
        <div className="lg:pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-widest text-blue-400">
            <Sparkles className="h-3 w-3" />
            AI STUDY BUDDY
          </div>

          <h2 className="mt-5 text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Study smarter,
            <br />
            not harder.
          </h2>

          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-slate-400">
            Upload your notes and let UniMate turn them into summaries,
            flashcards, quizzes and personalized revision plans.
          </p>

          {/* Feature chips */}
          <div className="mt-7 flex flex-wrap gap-2">
            {["Summaries", "Flashcards", "Quizzes", "Revision Plans"].map(
              (f) => (
                <span
                  key={f}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-slate-300"
                >
                  {f}
                </span>
              )
            )}
          </div>
        </div>

        {/* ── Right: Chat UI ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_32px_64px_-24px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.04] px-5 py-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">
                AI Study Buddy
              </p>
              <p className="text-[11px] text-emerald-400">● Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3.5 px-5 py-5">
            {/* Student message */}
            <div className="flex items-start justify-end gap-2.5">
              <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-[13.5px] leading-relaxed text-white">
                I have my DLD exam tomorrow and I haven&apos;t started.
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700">
                <User className="h-3.5 w-3.5 text-slate-300" />
              </span>
            </div>

            {/* AI message */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
                <Bot className="h-3.5 w-3.5 text-white" />
              </span>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white/[0.08] px-4 py-2.5 text-[13.5px] leading-relaxed text-slate-200">
                Don&apos;t worry. I&apos;ve created a 4-hour emergency revision
                plan based on your notes.
              </div>
            </div>

            {/* Plan card — fixed: ml-10 (valid) instead of ml-9.5 (invalid) */}
            <div className="ml-10 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
              <div className="border-b border-white/[0.06] px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  4-Hour Emergency Revision Plan
                </p>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {PLAN_ITEMS.map((item) => (
                  <div
                    key={item.num}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="w-5 shrink-0 text-[10.5px] font-semibold text-slate-600">
                      {item.num}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span className="text-[13px] text-slate-200">
                        {item.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11.5px] tabular-nums text-slate-500">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="border-t border-white/[0.08] px-4 py-3.5">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5">
              <span className="flex-1 text-[13px] text-slate-500">
                Ask anything about your studies...
              </span>
              <button
                aria-label="Send message"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-opacity hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
