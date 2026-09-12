import {
  LayoutDashboard,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  Bot,
  CalendarCheck,
  FileClock,
  Timer,
  BarChart3,
  Bell,
  Settings,
  Sparkles,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: BookOpen, label: "Courses" },
  { icon: CalendarClock, label: "Timetable" },
  { icon: ClipboardCheck, label: "Assignments" },
  { icon: GraduationCap, label: "Exams" },
  { icon: Wallet, label: "Expenses" },
  { icon: Bot, label: "AI Study Buddy" },
];

export function DashboardPreview() {
  return (
    <section id="dashboard" className="scroll-mt-24 px-4 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3 w-3" />
            Dashboard
          </div>
          <h2 className="mt-4 text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-text)] sm:text-5xl">
            Your university dashboard.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-text-2)]">
            Every piece of your academic life, elegantly organized into a single high-performance cockpit.
          </p>
        </div>

        {/* Dashboard Operating System Mockup */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)] shadow-[0_32px_80px_-24px_rgba(15,23,42,0.16),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:shadow-[0_32px_80px_-24px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset]">

          {/* Window Chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/80 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57] shadow-[0_0_4px_rgba(255,95,87,0.3)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] shadow-[0_0_4px_rgba(255,189,46,0.3)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840] shadow-[0_0_4px_rgba(40,200,64,0.3)]" />
            </div>

            <div className="ml-3 flex flex-1 items-center gap-2 rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-[var(--color-surface)] px-3 py-1 text-[11px] font-medium text-[var(--color-text-3)] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono">app.unimate.io/dashboard</span>
            </div>

            <div className="ml-auto flex items-center gap-2 text-[var(--color-text-3)]">
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <Settings className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* App layout: sidebar + main */}
          <div className="flex">

            {/* Sidebar — visible sm+ */}
            <aside className="hidden w-52 shrink-0 flex-col justify-between border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/50 p-4 sm:flex">
              <div>
                {/* Brand */}
                <div className="mb-6 flex items-center gap-2.5 px-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                    <GraduationCap className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
                  </span>
                  <span className="text-[13.5px] font-semibold tracking-tight text-[var(--color-text)]">
                    UniMate
                  </span>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1">
                  {SIDEBAR_ITEMS.map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-medium transition-all ${
                        active
                          ? "border border-slate-200/80 dark:border-slate-700/80 bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                          : "text-[var(--color-text-2)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-text)]"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : ""}`}
                        strokeWidth={active ? 2.25 : 1.75}
                      />
                      <span className="truncate">{label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Student Profile Card */}
              <div className="mt-8 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-[var(--color-surface)] p-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/60 font-mono text-[11.5px] font-bold text-blue-700 dark:text-blue-400">
                    AR
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-[var(--color-text)]">
                      Alex Raza
                    </p>
                    <p className="text-[10.5px] text-[var(--color-text-3)]">
                      BS CS · Semester 5
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Arena */}
            <main className="min-w-0 flex-1 p-5 sm:p-6">
              {/* Header Greeting */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-semibold text-[var(--color-text)]">
                    Good afternoon, Alex 👋
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[var(--color-text-3)]">
                    Thursday, Sep 4 · 3 lectures scheduled · 2 priority deliverables
                  </p>
                </div>
                <span className="hidden rounded-full border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 sm:inline-flex">
                  Semester Week 4
                </span>
              </div>

              {/* Fintech-style Metric KPIs */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Current GPA",
                    value: "3.50",
                    sub: "↑ +0.08 delta",
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: "Attendance Rate",
                    value: "91%",
                    sub: "6 courses safe",
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: "Active Deadlines",
                    value: "2 due",
                    sub: "this week",
                    color: "text-amber-600 dark:text-amber-400",
                  },
                  {
                    label: "Study Hours",
                    value: "14.5h",
                    sub: "92% of target",
                    color: "text-blue-600 dark:text-blue-400",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/70 p-3.5 shadow-xs"
                  >
                    <p className="text-[11px] font-medium text-[var(--color-text-3)]">
                      {s.label}
                    </p>
                    <p className="mt-1 font-mono text-[20px] font-bold leading-none tracking-tight text-[var(--color-text)]">
                      {s.value}
                    </p>
                    <p className={`mt-1 font-mono text-[10.5px] font-medium ${s.color}`}>
                      {s.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Lower 3-column Operational Layout */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Col 1: Today's Classes */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
                  <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    <CalendarCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Today&apos;s Classes
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      { code: "CS301", name: "Digital Logic Design", time: "10:00 AM", active: true },
                      { code: "CS302", name: "Web Engineering", time: "12:00 PM", active: false },
                      { code: "CS303", name: "TAFL", time: "02:00 PM", active: false },
                    ].map((c) => (
                      <li
                        key={c.name}
                        className="flex items-center justify-between text-[12.5px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${c.active ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`} />
                          <span className="font-medium text-[var(--color-text)]">{c.name}</span>
                        </div>
                        <span className="font-mono text-[11px] tabular-nums text-[var(--color-text-3)]">
                          {c.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Col 2: Priority Assignments */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
                  <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    <FileClock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Assignments
                  </div>
                  <ul className="space-y-2.5">
                    <li className="flex items-center justify-between text-[12.5px]">
                      <span className="truncate pr-2 font-medium text-[var(--color-text)]">
                        DLD Lab 05
                      </span>
                      <span className="shrink-0 rounded-md bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                        Tomorrow
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-[12.5px]">
                      <span className="truncate pr-2 font-medium text-[var(--color-text)]">
                        Web Eng Project
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-text-3)]">
                        Fri
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Col 3: Exam Countdown & Study Histogram */}
                <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 shadow-xs">
                    <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      <Timer className="h-3 w-3" />
                      Next Exam
                    </div>
                    <p className="text-[14px] font-semibold text-blue-900 dark:text-blue-200">
                      DLD Final
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400">In 2 days · Room 301</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3.5 shadow-xs">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                        <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        Weekly Study Load
                      </div>
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        +18% vs avg
                      </span>
                    </div>
                    <div className="flex h-9 items-end gap-1.5">
                      {[40, 65, 50, 85, 45, 95, 30].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <span
                            style={{ height: `${h}%` }}
                            className={`w-full rounded-sm ${
                              i === 5
                                ? "bg-blue-600"
                                : "bg-blue-200 dark:bg-blue-900/60"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </section>
  );
}
