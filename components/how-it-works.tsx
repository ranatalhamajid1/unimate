import { Sparkles, UserCheck, CalendarRange, BrainCircuit } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Create your profile",
    description: "Add your university, degree program, semester and courses in under 2 minutes.",
    icon: UserCheck,
    tag: "Instant Setup",
  },
  {
    number: "02",
    title: "Organize your semester",
    description: "Input your timetable, upcoming assignments, exam schedules, and course resources.",
    icon: CalendarRange,
    tag: "Full Synthesis",
  },
  {
    number: "03",
    title: "Let UniMate handle the rest",
    description: "Receive adaptive study plans, attendance warnings, and AI-driven revision summaries.",
    icon: BrainCircuit,
    tag: "Automated Flow",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3 w-3" />
            How it works
          </div>
          <h2 className="mt-4 text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-text)] sm:text-5xl">
            Up and running
            <br />
            in minutes.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-text-2)]">
            A frictionless onboarding experience that transforms chaotic university schedules into a synchronized workflow.
          </p>
        </div>

        {/* Steps with Connected Timeline */}
        <div className="relative mt-16 sm:mt-20">
          {/* Connecting gradient hairline — desktop */}
          <div
            aria-hidden
            className="absolute left-[15%] right-[15%] top-7 hidden h-px sm:block"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(37,99,235,0.3) 20%, rgba(99,102,241,0.5) 50%, rgba(37,99,235,0.3) 80%, transparent)",
            }}
          />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative flex flex-col items-start rounded-3xl border border-slate-200/80 dark:border-slate-800/90 bg-[var(--color-surface)]/80 p-6 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.1)] sm:items-center sm:text-center"
                >
                  {/* Step node bubble with illuminated ring */}
                  <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200/80 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/60 shadow-[0_4px_16px_rgba(37,99,235,0.15)] transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                    <span className="absolute -bottom-2.5 rounded-full bg-slate-900 dark:bg-blue-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs">
                      {step.number}
                    </span>
                  </div>

                  {/* Tag */}
                  <span className="mb-2 inline-block rounded-md bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10.5px] font-semibold text-blue-600 dark:text-blue-400">
                    {step.tag}
                  </span>

                  {/* Title */}
                  <h3 className="text-[17px] font-semibold tracking-tight text-[var(--color-text)]">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-2)] sm:max-w-[240px]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
