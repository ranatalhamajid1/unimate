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
    <section id="dashboard" className="scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Dashboard
          </p>
          <h2 className="text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-[var(--color-text)] sm:text-5xl">
            Your university dashboard.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-text-2)]">
            Every piece of your academic life, elegantly organized in one view.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_32px_80px_-24px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.04)]">

          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <div className="ml-3 flex flex-1 items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-1 shadow-sm ring-1 ring-[var(--color-border)]">
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-[11px] text-[var(--color-text-3)]">
                app.unimate.io/dashboard
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-[var(--color-text-3)]" />
              <Settings className="h-3.5 w-3.5 text-[var(--color-text-3)]" />
            </div>
          </div>

          {/* App layout: sidebar + main */}
          <div className="flex">

            {/* Sidebar — hidden on mobile, visible sm+ */}
            <aside className="hidden w-48 shrink-0 flex-col justify-between border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] sm:flex">
              <div className="p-3">
                {/* Logo */}
                <div className="mb-5 flex items-center gap-2 px-2 py-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
                    <GraduationCap className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--color-text)]">
                    UniMate
                  </span>
                </div>

                {/* Nav */}
                <nav className="space-y-0.5">
                  {SIDEBAR_ITEMS.map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                        active
                          ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_1px_4px_rgba(15,23,42,0.07)]"
                          : "text-[var(--color-text-2)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-text)]"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : ""}`}
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

              {/* User card — part of sidebar flex flow */}
              <div className="m-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                    AR
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-[var(--color-text)]">
                      Alex Raza
                    </p>
                    <p className="text-[10.5px] text-[var(--color-text-3)]">
                      CS — Sem 5
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1 p-4 sm:p-5">
              {/* Greeting */}
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
                    Good afternoon, Alex 👋
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[var(--color-text-3)]">
                    Thursday, Sep 4 · Here&apos;s what&apos;s on your plate.
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[12px] font-semibold text-blue-700 dark:text-blue-400">
                  AR
                </span>
              </div>

              {/* Stats row */}
              <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  {
                    label: "GPA",
                    value: "3.50",
                    sub: "↑ +0.08",
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: "Attendance",
                    value: "91%",
                    sub: "6 courses",
                    color: "text-[var(--color-text-3)]",
                  },
                  {
                    label: "Assignments",
                    value: "2 due",
                    sub: "this week",
                    color: "text-[var(--color-text-3)]",
                  },
                  {
                    label: "Study hrs",
                    value: "14h",
                    sub: "this week",
                    color: "text-[var(--color-text-3)]",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3"
                  >
                    <p className="text-[10.5px] font-medium text-[var(--color-text-3)]">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-[18px] font-semibold leading-none text-[var(--color-text)]">
                      {s.value}
                    </p>
                    <p className={`mt-0.5 text-[10.5px] ${s.color}`}>
                      {s.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {/* Today's classes */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    <CalendarCheck className="h-3 w-3 text-blue-500" />
                    Today&apos;s Classes
                  </div>
                  <ul className="space-y-2">
                    {[
                      { name: "DLD", time: "10:00 AM" },
                      { name: "Web Eng", time: "12:00 PM" },
                      { name: "TAFL", time: "2:00 PM" },
                    ].map((c) => (
                      <li
                        key={c.name}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <span className="text-[var(--color-text-2)]">{c.name}</span>
                        <span className="tabular-nums text-[var(--color-text-3)]">
                          {c.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Assignments */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    <FileClock className="h-3 w-3 text-blue-500" />
                    Assignments
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-[12px]">
                      <span className="truncate pr-2 text-[var(--color-text-2)]">
                        DLD Lab 05
                      </span>
                      <span className="shrink-0 rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        Tomorrow
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-[12px]">
                      <span className="truncate pr-2 text-[var(--color-text-2)]">
                        Web Eng Project
                      </span>
                      <span className="shrink-0 rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-3)]">
                        Fri
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Exam + study progress */}
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      <Timer className="h-3 w-3" />
                      Next Exam
                    </div>
                    <p className="text-[14px] font-semibold text-blue-800 dark:text-blue-300">
                      DLD Final
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400">In 2 days</p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                    <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                      <BarChart3 className="h-3 w-3 text-blue-500" />
                      Study Progress
                    </div>
                    <div className="flex h-8 items-end gap-1">
                      {[40, 65, 50, 80, 45, 90, 30].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-full rounded-sm bg-blue-500/70 dark:bg-blue-500/50"
                        />
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
