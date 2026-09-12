import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3 w-3" />
            Features
          </div>
          <h2 className="mt-4 text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-text)] sm:text-5xl">
            Your entire university life,
            <br />
            in one place.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-text-2)]">
            From your first class to your final exam, UniMate keeps everything
            organized with high-precision academic intelligence.
          </p>
        </div>

        {/* ── Spatial Bento Grid ─────────────────────────────────────────── */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">

          {/* ─ HERO CARD 1: Courses & Smart Timetable (Dominant, spans 2 cols) ─ */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)] p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.1)] sm:col-span-2 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20 transition-transform duration-300 group-hover:scale-105">
                  <CalendarClock className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-[var(--color-text)]">
                  Courses &amp; Smart Timetable
                </h3>
                <p className="mt-1 max-w-md text-[14px] leading-relaxed text-[var(--color-text-2)]">
                  Auto-detects timetable gaps, schedules focused study sessions between lectures, and keeps lecture notes and syllabi mapped per course.
                </p>
              </div>
              <span className="hidden items-center gap-1 rounded-full border border-blue-200/70 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-3 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 sm:flex">
                <span>Adaptive Scheduling</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>

            {/* Timetable visual track */}
            <div className="mt-6 space-y-2.5">
              {[
                {
                  time: "10:00 - 11:30 AM",
                  code: "CS301",
                  name: "Digital Logic Design",
                  room: "Room 204",
                  status: "In Progress",
                  statusColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
                },
                {
                  time: "11:30 - 01:00 PM",
                  code: "GAP",
                  name: "Auto-Allocated Study Session · K-Maps Review",
                  room: "Library 2F",
                  status: "Focus Block",
                  statusColor: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
                },
                {
                  time: "01:00 - 02:30 PM",
                  code: "CS302",
                  name: "Web Engineering",
                  room: "Lab 3",
                  status: "Upcoming",
                  statusColor: "bg-slate-100 dark:bg-slate-800 text-[var(--color-text-3)] border-transparent",
                },
              ].map((slot) => (
                <div
                  key={slot.time}
                  className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11.5px] font-semibold text-blue-600 dark:text-blue-400">
                      {slot.code}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--color-text)]">
                      {slot.name}
                    </span>
                    <span className="hidden text-[11px] text-[var(--color-text-3)] md:inline">
                      · {slot.room}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${slot.statusColor}`}>
                      {slot.status}
                    </span>
                    <span className="font-mono text-[11.5px] tabular-nums text-[var(--color-text-3)]">
                      {slot.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─ CARD 2: Attendance Safety & Threshold (1 col) ─ */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)] p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.1)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-[var(--color-text)]">
              Attendance Safety
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Real-time calculations prevent debarment and track allowed absences.
            </p>

            {/* Circular Gauge Display */}
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    strokeWidth="3.5"
                    className="text-emerald-100 dark:text-emerald-900/40"
                    stroke="currentColor"
                    fill="none"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    strokeWidth="3.5"
                    strokeDasharray="100.5"
                    strokeDashoffset="9"
                    strokeLinecap="round"
                    className="text-emerald-600 dark:text-emerald-400"
                    stroke="currentColor"
                    fill="none"
                  />
                </svg>
                <span className="absolute font-mono text-[12.5px] font-bold text-emerald-700 dark:text-emerald-300">
                  91%
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Safe Zone
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-600/90 dark:text-emerald-400/90">
                  3 absences remaining before 75% threshold
                </p>
              </div>
            </div>
          </div>

          {/* ─ CARD 3: Assignments & Deliverables ─ */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)] p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_16px_40px_-12px_rgba(245,158,11,0.1)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20 transition-transform duration-300 group-hover:scale-105">
              <ClipboardCheck className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-[var(--color-text)]">
              Assignments &amp; Deadlines
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Track multi-course submissions, weights, and automated reminders.
            </p>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[12.5px] font-medium text-[var(--color-text)]">
                    DLD Lab 05
                  </span>
                </div>
                <span className="rounded-md bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                  Tomorrow
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[var(--color-text-3)]" />
                  <span className="text-[12.5px] text-[var(--color-text-2)]">
                    Web Eng Project
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[var(--color-text-3)]">Fri</span>
              </div>
            </div>
          </div>

          {/* ─ CARD 4: Exams & GPA Simulator ─ */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)] p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.1)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-[var(--color-text)]">
              Exams &amp; GPA What-If
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Simulate semester grade scenarios and model what it takes to hit your target.
            </p>

            <div className="mt-5 flex items-end justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/60 p-3.5">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Current GPA
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-[2.25rem] font-bold leading-none tracking-tight text-[var(--color-text)]">
                    3.50
                  </span>
                  <span className="flex items-center gap-0.5 font-mono text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    +0.08
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-md bg-blue-50 dark:bg-blue-950/60 px-2 py-1 text-[10.5px] font-semibold text-blue-600 dark:text-blue-400">
                  Target: 3.65
                </span>
                <p className="mt-1 text-[10px] text-[var(--color-text-3)]">
                  CS Dept · Rank Top 10%
                </p>
              </div>
            </div>
          </div>

          {/* ─ CARD 5: Student Expenses & Budget ─ */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)] p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_16px_40px_-12px_rgba(99,102,241,0.1)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20 transition-transform duration-300 group-hover:scale-105">
              <Wallet className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-[var(--color-text)]">
              University Expenses
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-2)]">
              Categorize hostel fees, food, books, transport, and personal budgets.
            </p>

            <div className="mt-5 space-y-3">
              {[
                { label: "Hostel & Rent", pct: 60, color: "bg-blue-600" },
                { label: "Food & Mess", pct: 25, color: "bg-indigo-500" },
                { label: "Transport & Books", pct: 15, color: "bg-purple-500" },
              ].map((e) => (
                <div key={e.label}>
                  <div className="mb-1 flex justify-between text-[11.5px]">
                    <span className="font-medium text-[var(--color-text-2)]">{e.label}</span>
                    <span className="font-mono text-[var(--color-text-3)]">{e.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${e.color}`}
                      style={{ width: `${e.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
