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
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            Dashboard
          </p>
          <h2 className="text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Your university dashboard.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-500">
            Every piece of your academic life, elegantly organized in one view.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.04)]">

          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <div className="ml-3 flex flex-1 items-center gap-2 rounded-lg bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-200/60">
              <span className="h-2 w-2 rounded-full bg-slate-200" />
              <span className="text-[11px] text-slate-400">
                app.unimate.io/dashboard
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-slate-300" />
              <Settings className="h-3.5 w-3.5 text-slate-300" />
            </div>
          </div>

          {/* App layout: sidebar + main */}
          <div className="flex">

            {/* Sidebar — hidden on mobile, visible sm+ */}
            <aside className="hidden w-48 shrink-0 flex-col justify-between border-r border-slate-100 bg-slate-50/50 sm:flex">
              <div className="p-3">
                {/* Logo */}
                <div className="mb-5 flex items-center gap-2 px-2 py-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
                    <GraduationCap className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-900">
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
                          ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(15,23,42,0.07)]"
                          : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${active ? "text-blue-600" : ""}`}
                        strokeWidth={active ? 2.25 : 1.75}
                      />
                      <span className="truncate">{label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* User card — part of sidebar flex flow (not absolute) */}
              <div className="m-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700">
                    AR
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-slate-800">
                      Alex Raza
                    </p>
                    <p className="text-[10.5px] text-slate-400">
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
                  <h3 className="text-[15px] font-semibold text-slate-900">
                    Good afternoon, Alex 👋
                  </h3>
                  <p className="mt-0.5 text-[12px] text-slate-400">
                    Thursday, Sep 4 · Here&apos;s what&apos;s on your plate.
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[12px] font-semibold text-blue-700">
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
                    color: "text-emerald-600",
                  },
                  {
                    label: "Attendance",
                    value: "91%",
                    sub: "6 courses",
                    color: "text-slate-400",
                  },
                  {
                    label: "Assignments",
                    value: "2 due",
                    sub: "this week",
                    color: "text-slate-400",
                  },
                  {
                    label: "Study hrs",
                    value: "14h",
                    sub: "this week",
                    color: "text-slate-400",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <p className="text-[10.5px] font-medium text-slate-400">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-[18px] font-semibold leading-none text-slate-900">
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
                <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
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
                        <span className="text-slate-700">{c.name}</span>
                        <span className="tabular-nums text-slate-400">
                          {c.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Assignments */}
                <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                    <FileClock className="h-3 w-3 text-blue-500" />
                    Assignments
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-[12px]">
                      <span className="truncate pr-2 text-slate-700">
                        DLD Lab 05
                      </span>
                      <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                        Tomorrow
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-[12px]">
                      <span className="truncate pr-2 text-slate-700">
                        Web Eng Project
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        Fri
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Exam + study progress */}
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-blue-600">
                      <Timer className="h-3 w-3" />
                      Next Exam
                    </div>
                    <p className="text-[14px] font-semibold text-blue-800">
                      DLD Final
                    </p>
                    <p className="text-[11px] text-blue-600">In 2 days</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                    <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                      <BarChart3 className="h-3 w-3 text-blue-500" />
                      Study Progress
                    </div>
                    <div className="flex h-8 items-end gap-1">
                      {[40, 65, 50, 80, 45, 90, 30].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-full rounded-sm bg-blue-500/70"
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
