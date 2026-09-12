import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function CTA() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070B14] px-8 py-16 text-center shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset] sm:px-16 sm:py-20">
          {/* Ambient Restrained Atmospheric Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute left-1/2 top-[-20%] h-[380px] w-[600px] -translate-x-1/2 rounded-full opacity-35"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(37,99,235,0.25) 0%, rgba(99,102,241,0.1) 45%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-400 backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              Get started
            </div>

            <h2 className="mt-4 text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl">
              Ready to make
              <br />
              university easier?
            </h2>

            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-slate-400">
              Join thousands of students organizing courses, mastering exams, and studying smarter with UniMate.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/signup"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-7 py-3.5 text-[14.5px] font-semibold text-slate-900 shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all duration-200 hover:bg-blue-600 hover:text-white active:scale-[0.985] sm:w-auto"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>No credit card required · Free for university students</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
