import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-16 text-center sm:px-16 sm:py-20">
          {/* Ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% -10%, rgba(37,99,235,0.28) 0%, transparent 70%)",
            }}
          />

          {/* Subtle noise texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
            }}
          />

          <div className="relative">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-blue-400">
              Get started
            </p>
            <h2 className="text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl">
              Ready to make
              <br />
              university easier?
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-[15.5px] leading-relaxed text-slate-400">
              Everything you need to stay organized, focused and ahead.
            </p>

            <a
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14.5px] font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:bg-blue-600 hover:text-white"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>

            <p className="mt-3.5 text-[12px] text-slate-600">
              No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
