import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Features
          </p>
          <h2 className="text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-[var(--color-text)] sm:text-5xl">
            Your entire university life,
            <br />
            in one place.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-text-2)]">
            From your first class to your final exam, UniMate keeps everything
            organized.
          </p>
        </div>

        {/* ── Bento grid ─────────────────────────────────────────── */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* ─ Courses — 2-col wide ─ */}
          <div className="group relative col-span-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:border-[var(--color-border)] hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.10)] dark:hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)] sm:col-span-2 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white transition-colors duration-300 group-hover:bg-blue-600">
                  <BookOpen className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">
                  Courses
                </h3>
                <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-[var(--color-text-2)]">
                  Keep notes, assignments, labs and resources organized by
                  course. Everything in one place, always findable.
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-3)] transition-colors group-hover:text-blue-500" />
            </div>

            {/* Mini course list */}
            <div className="mt-5 space-y-2">
              {[
                { code: "CS301", name: "Digital Logic Design", credits: "3 cr" },
                { code: "CS302", name: "Web Engineering", credits: "3 cr" },
                { code: "CS303", name: "TAFL", credits: "3 cr" },
              ].map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/70 px-4 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {c.code}
                    </span>
                    <span className="truncate text-[13px] text-[var(--color-text-2)]">
                      {c.name}
                    </span>
                  </div>
                  <span className="ml-3 shrink-0 text-[11px] text-[var(--color-text-3)]">
                    {c.credits}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─ Smart Timetable ─ */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:border-[var(--color-border)] hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.10)] dark:hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white transition-colors duration-300 group-hover:bg-blue-600">
              <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">
              Smart Timetable
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Know exactly where you need to be and when.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { time: "10:00", label: "DLD" },
                { time: "12:00", label: "Web Eng" },
                { time: "14:00", label: "TAFL" },
              ].map((s) => (
                <div
                  key={s.time}
                  className="flex items-center gap-2.5 text-[12.5px]"
                >
                  <span className="w-10 shrink-0 tabular-nums text-[var(--color-text-3)]">
                    {s.time}
                  </span>
                  <span className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 font-medium text-blue-700 dark:text-blue-400">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─ Assignments ─ */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:border-[var(--color-border)] hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.10)] dark:hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white transition-colors duration-300 group-hover:bg-blue-600">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">
              Assignments
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Track deadlines and never miss an assignment again.
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="text-[12.5px] font-medium text-[var(--color-text)]">
                    DLD Lab 05
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Tomorrow
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-2)] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[var(--color-text-3)]" />
                  <span className="text-[12.5px] text-[var(--color-text-2)]">
                    Web Eng Project
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-text-3)]">Fri</span>
              </div>
            </div>
          </div>

          {/* ─ Exams & GPA ─ */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:border-[var(--color-border)] hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.10)] dark:hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white transition-colors duration-300 group-hover:bg-blue-600">
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">
              Exams &amp; GPA
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Track exams, calculate GPA and understand your academic progress.
            </p>

            <div className="mt-4 flex items-end gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Current GPA
                </p>
                <p className="mt-0.5 text-[2.25rem] font-semibold leading-none tracking-tight text-[var(--color-text)]">
                  3.50
                </p>
              </div>
              <div className="mb-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[12px] font-medium">+0.08</span>
              </div>
            </div>
          </div>

          {/* ─ Expenses ─ */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:border-[var(--color-border)] hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.10)] dark:hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white transition-colors duration-300 group-hover:bg-blue-600">
              <Wallet className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">
              Expenses
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Track university spending, hostel costs, food and transport.
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                { label: "Hostel", pct: 60 },
                { label: "Food", pct: 35 },
                { label: "Transport", pct: 15 },
              ].map((e) => (
                <div key={e.label}>
                  <div className="mb-1 flex justify-between text-[11.5px]">
                    <span className="text-[var(--color-text-2)]">{e.label}</span>
                    <span className="text-[var(--color-text-3)]">{e.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${e.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        {/* ─── NOTE: AI Study Buddy card intentionally removed from bento grid.
            The full-width AIStudyBuddy section immediately follows this component. ─── */}
      </div>
    </section>
  );
}
