import { Sparkles, Bot, User, CheckCircle2, Send, CornerDownLeft, BookOpen, Layers } from "lucide-react";

const PLAN_ITEMS = [
  { num: "01", label: "Number Systems & Logic Gates", time: "30 min", tag: "Warmup" },
  { num: "02", label: "Boolean Algebra & K-Maps", time: "45 min", tag: "High Yield" },
  { num: "03", label: "Flip-Flops & Latches", time: "60 min", tag: "Core Weight" },
  { num: "04", label: "Synchronous FSM Synthesis", time: "60 min", tag: "Critical" },
  { num: "05", label: "Active Recall & Mock Drills", time: "45 min", tag: "Validation" },
];

export function AIStudyBuddy() {
  return (
    <section
      id="ai-study-buddy"
      className="scroll-mt-24 relative overflow-hidden bg-[#070B14] px-4 py-20 sm:py-28 lg:py-32"
    >
      {/* Restrained Atmospheric Illumination (Subtle diffuse blue/indigo fields) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(37,99,235,0.2) 0%, rgba(99,102,241,0.08) 45%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute right-0 top-1/3 h-64 w-64 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-14">
        {/* ── Left: Copy & Intellectual Positioning (5 cols) ─────────── */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-widest text-blue-400 backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            AI STUDY BUDDY
          </div>

          <h2 className="mt-5 text-[2.5rem] font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl">
            Study smarter,
            <br />
            not harder.
          </h2>

          <p className="mt-4 text-[16px] leading-relaxed text-slate-400">
            Upload your lecture slides, notes, and past exams. UniMate turns them into
            structured study roadmaps, practice questions, and high-yield revision plans.
          </p>

          {/* Feature chips */}
          <div className="mt-7 flex flex-wrap gap-2">
            {["Summaries", "Flashcards", "Quizzes", "Revision Plans"].map((f) => (
              <span
                key={f}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12.5px] font-medium text-slate-300 shadow-xs backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Academic Context signals */}
          <div className="mt-8 space-y-3 border-t border-white/[0.08] pt-6">
            <div className="flex items-center gap-2.5 text-[13px] text-slate-400">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span>Grounded in your specific university course syllabus</span>
            </div>
            <div className="flex items-center gap-2.5 text-[13px] text-slate-400">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Weight-based study allocation for high-stakes exams</span>
            </div>
          </div>
        </div>

        {/* ── Right: Structured Spatial Chat UI (7 cols) ─────────────── */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.12] bg-[#0E1524]/90 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl lg:col-span-7">
          {/* Spatial Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_2px_10px_rgba(37,99,235,0.4)]">
                <Bot className="h-4 w-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0E1524] bg-emerald-400" />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-white">
                  UniMate AI Study Buddy
                </p>
                <p className="text-[11px] text-slate-400">
                  Course Context: CS301 Digital Logic Design
                </p>
              </div>
            </div>

            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              ● Ready for Revision
            </span>
          </div>

          {/* Conversation Stream */}
          <div className="space-y-4 p-5 sm:p-6">
            {/* User message */}
            <div className="flex items-start justify-end gap-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-[13.5px] leading-relaxed text-white shadow-md">
                I have my DLD final exam in 2 days and I haven&apos;t finished sequential circuits. How should I allocate 4 hours tonight?
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <User className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* AI message */}
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <div className="max-w-[88%] space-y-3">
                <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[13.5px] leading-relaxed text-slate-200">
                  Don&apos;t worry. Based on past papers and your syllabus weight, I&apos;ve synthesized a 4-Hour High-Yield Revision Plan targeting 40% of the exam points:
                </div>

                {/* Structured Roadmap Card */}
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25">
                  <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Emergency Revision Roadmap
                    </span>
                    <span className="font-mono text-[11px] font-medium text-blue-400">
                      4h 00m total
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.05]">
                    {PLAN_ITEMS.map((item) => (
                      <div
                        key={item.num}
                        className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] transition-colors hover:bg-white/[0.02]"
                      >
                        <span className="font-mono text-[11px] font-semibold text-slate-500">
                          {item.num}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="flex-1 font-medium text-slate-200">
                          {item.label}
                        </span>
                        <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {item.tag}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-slate-400">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Input Bar */}
          <div className="border-t border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-black/30 px-4 py-2.5">
              <input
                type="text"
                readOnly
                placeholder="Ask anything about your syllabus or notes..."
                className="w-full bg-transparent text-[13.5px] text-slate-200 placeholder-slate-500 outline-none"
              />
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10.5px] text-slate-400 sm:inline-flex">
                  <CornerDownLeft className="h-2.5 w-2.5" />
                  ↵
                </span>
                <button
                  aria-label="Send message"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
