import { LayoutGrid, BrainCircuit, Sparkles, Building2 } from "lucide-react";

const ITEMS = [
  { icon: LayoutGrid, label: "10+ productivity tools", desc: "Integrated academic workspace" },
  { icon: BrainCircuit, label: "Smart study planning", desc: "Timetable-aware time allocation" },
  { icon: Sparkles, label: "AI-powered learning", desc: "Notes-to-revision synthesis" },
  { icon: Building2, label: "Built for university life", desc: "Semester, courses & GPA tracking" },
];

export function TrustBar() {
  return (
    <section className="relative px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Top Hairline Separator with gradient fade */}
        <div
          aria-hidden
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent 5%, var(--color-border) 25%, var(--color-border) 75%, transparent 95%)",
          }}
        />

        <div className="py-8 sm:py-10">
          <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-3)]">
            Designed for high-performance university students
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {ITEMS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 dark:border-slate-800/70 bg-[var(--color-surface)]/70 p-4 text-center shadow-[0_1px_3px_rgba(15,23,42,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-blue-500/30 hover:shadow-[0_4px_16px_rgba(37,99,235,0.06)]"
              >
                <span className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20 transition-transform duration-200 group-hover:scale-105">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-[13.5px] font-semibold tracking-tight text-[var(--color-text)]">
                  {label}
                </span>
                <span className="mt-0.5 text-[11.5px] text-[var(--color-text-3)]">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Hairline Separator with gradient fade */}
        <div
          aria-hidden
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent 5%, var(--color-border) 25%, var(--color-border) 75%, transparent 95%)",
          }}
        />
      </div>
    </section>
  );
}
