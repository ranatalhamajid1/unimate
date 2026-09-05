import { LayoutGrid, BrainCircuit, Sparkles, Building2 } from "lucide-react";

const ITEMS = [
  { icon: LayoutGrid, label: "10+ productivity tools" },
  { icon: BrainCircuit, label: "Smart study planning" },
  { icon: Sparkles, label: "AI-powered learning" },
  { icon: Building2, label: "Built for university life" },
];

export function TrustBar() {
  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="h-px bg-slate-100" />

        <div className="py-7">
          <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Everything students need. One place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10">
            {ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-blue-500" strokeWidth={2} />
                <span className="text-[13px] font-medium text-slate-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />
      </div>
    </section>
  );
}
