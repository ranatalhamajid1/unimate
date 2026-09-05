const STEPS = [
  {
    number: "01",
    title: "Create your profile",
    description: "Add your university, semester and courses.",
  },
  {
    number: "02",
    title: "Organize your semester",
    description: "Add your timetable, assignments, exams and notes.",
  },
  {
    number: "03",
    title: "Let UniMate handle the rest",
    description: "Track your progress and study smarter with AI.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            How it works
          </p>
          <h2 className="text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Up and running
            <br />
            in minutes.
          </h2>
        </div>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Connecting line — desktop only, centered on the bubbles */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[26px] hidden sm:block"
            style={{
              background:
                "linear-gradient(to right, transparent 10%, #e2e8f0 22%, #e2e8f0 78%, transparent 90%)",
              height: "1px",
            }}
          />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, idx) => (
              <div
                key={step.number}
                className="relative flex gap-5 sm:flex-col sm:gap-0 sm:text-center"
              >
                {/* Vertical connector — mobile only */}
                {idx < STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute left-[1.625rem] top-14 bottom-[-2.5rem] w-px bg-slate-100 sm:hidden"
                  />
                )}

                {/* Number bubble */}
                <div className="relative z-10 flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:mx-auto sm:mb-5">
                  <span className="text-[14px] font-semibold text-blue-600">
                    {step.number}
                  </span>
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-[16.5px] font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500 sm:mx-auto sm:max-w-[200px]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
