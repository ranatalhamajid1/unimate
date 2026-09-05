import {
  ArrowRight,
  PlayCircle,
  Clock,
  FileText,
  Timer,
  TrendingUp,
  Bot,
  Sparkles,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:pb-20 sm:pt-36 lg:pb-24 lg:pt-40">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% -5%, rgba(37,99,235,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
        {/* ── Left: Copy ────────────────────────────────────────────── */}
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
          {/* Eyebrow */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-blue-200/70 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-3.5 py-1.5 text-[11.5px] font-semibold tracking-widest text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3 w-3" />
            BUILT FOR UNIVERSITY STUDENTS
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 mt-6 text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-[3.25rem]">
            Everything you need to{" "}
            <span className="text-blue-600 dark:text-blue-400">survive university.</span>
          </h1>

          {/* Body */}
          <p className="animate-fade-up delay-200 mx-auto mt-5 max-w-md text-[16.5px] leading-relaxed text-[var(--color-text-2)] lg:mx-0">
            Manage your courses, assignments, exams, timetable, expenses and
            study plans — all in one place.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300 mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:items-start lg:justify-start">
            <a
              href="/signup"
              className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 px-6 py-3.5 text-[14.5px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-600 dark:hover:bg-blue-500 sm:w-auto"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 text-[14.5px] font-medium text-[var(--color-text-2)] shadow-sm transition-all duration-200 hover:border-[var(--color-border)] hover:text-[var(--color-text)] sm:w-auto"
            >
              <PlayCircle className="h-4 w-4" />
              See How It Works
            </a>
          </div>

          {/* Micro-copy */}
          <p className="animate-fade-up delay-400 mt-4 text-[12.5px] tracking-wide text-[var(--color-text-3)]">
            No credit card required&nbsp;·&nbsp;Built for students
          </p>
        </div>

        {/* ── Right: Dashboard Mockup ───────────────────────────────── */}
        <div className="animate-scale-in delay-200 relative mx-auto w-full max-w-[480px] lg:mx-0 lg:max-w-none">
          {/* Glow behind card */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at 60% 40%, rgba(37,99,235,0.09), transparent 65%)",
              filter: "blur(24px)",
            }}
          />

          {/* Dashboard card */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_64px_-20px_rgba(15,23,42,0.20),0_2px_8px_rgba(15,23,42,0.04)] dark:shadow-[0_24px_64px_-20px_rgba(0,0,0,0.6),0_2px_8px_rgba(0,0,0,0.3)]">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/70 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 flex-1 truncate rounded-md bg-slate-200/70 dark:bg-slate-700/60 px-3 py-0.5 text-[10px] text-[var(--color-text-3)]">
                app.unimate.io/dashboard
              </span>
            </div>

            {/* Greeting */}
            <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
              <p className="text-[13px] font-semibold text-[var(--color-text)]">
                Good afternoon, Alex 👋
              </p>
              <p className="text-[11.5px] text-[var(--color-text-3)]">
                Thursday, September 4 — Here&apos;s your day.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              {/* Today's schedule */}
              <div className="col-span-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/60 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  <Clock className="h-3 w-3" />
                  Today&apos;s Schedule
                </div>
                <div className="space-y-1.5">
                  {[
                    { time: "10:00 AM", name: "DLD", room: "Room 204" },
                    { time: "12:00 PM", name: "Web Engineering", room: "Lab 3" },
                    { time: "2:00 PM", name: "TAFL", room: "Room 108" },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-2.5 py-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span className="truncate text-[12px] font-medium text-[var(--color-text-2)]">
                          {c.name}
                        </span>
                        <span className="hidden text-[10.5px] text-[var(--color-text-3)] sm:inline">
                          {c.room}
                        </span>
                      </div>
                      <span className="ml-2 shrink-0 text-[10.5px] tabular-nums text-[var(--color-text-3)]">
                        {c.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam countdown */}
              <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-500/10 p-3">
                <div className="mb-1.5 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Timer className="h-3 w-3" />
                  Exam
                </div>
                <div className="text-[20px] font-semibold leading-none text-blue-700 dark:text-blue-300">
                  2 days
                </div>
                <div className="mt-1 text-[10.5px] text-blue-500 dark:text-blue-400">DLD Final</div>
              </div>

              {/* GPA */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
                <div className="mb-1.5 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  <TrendingUp className="h-3 w-3" />
                  GPA
                </div>
                <div className="text-[20px] font-semibold leading-none text-[var(--color-text)]">
                  3.50
                </div>
                <div className="mt-1 text-[10.5px] text-emerald-600 dark:text-emerald-400">
                  ↑ This semester
                </div>
              </div>

              {/* Upcoming assignments */}
              <div className="col-span-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  <FileText className="h-3 w-3" />
                  Upcoming Assignments
                </div>
                <div className="space-y-1.5">
                  {[
                    { name: "DLD Lab 05", due: "Tomorrow" },
                    { name: "Web Engineering Project", due: "Fri" },
                  ].map((a) => (
                    <div key={a.name} className="flex items-center justify-between">
                      <span className="truncate pr-2 text-[12px] text-[var(--color-text-2)]">
                        {a.name}
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          a.due === "Tomorrow"
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-slate-100 dark:bg-slate-700/50 text-[var(--color-text-3)]"
                        }`}
                      >
                        {a.due}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Study Buddy chip */}
              <div className="col-span-2 flex items-center gap-3 rounded-xl bg-slate-900 dark:bg-slate-800/80 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-white">
                    AI Study Buddy
                  </div>
                  <div className="truncate text-[10.5px] text-slate-400">
                    Your DLD revision plan is ready — 4 hr plan
                  </div>
                </div>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
