import Link from "next/link";
import { GraduationCap, Check, ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { getProPriceDisplay } from "@/app/lib/entitlement-definitions";
import { getSession } from "@/app/lib/session";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Pricing — UniMate",
  description:
    "Simple, transparent pricing for university students. Get started for free or supercharge your semester with UniMate Pro.",
};

const FAQS = [
  {
    q: "Is the Free plan really free forever?",
    a: "Yes! All core university organization tools—courses, timetable, assignments, exams, GPA calculation, and expense tracking—are completely free without any trial expiration.",
  },
  {
    q: "What does UniMate Pro unlock?",
    a: "UniMate Pro unlocks the AI Study Plan generator (which builds daily study blocks around your class timetable and deadlines), real-time Smart Command Center urgency ranking, and a 10x higher AI Study Buddy allowance.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We support all major international credit and debit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, and PayPal through our global Merchant of Record.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel with one click directly from your billing settings. You'll retain full Pro access until the end of your current billing period.",
  },
];

export default async function PricingPage() {
  const session = await getSession();
  const proPrice = getProPriceDisplay();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-sm text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">UniMate</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle variant="icon" />
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-xs hover:bg-blue-500 transition-colors"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-medium text-[var(--color-text-2)] hover:text-[var(--color-text)] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-xs hover:bg-blue-500 transition-colors"
                >
                  <span>Sign up</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>SaaS Monetization &amp; Fair Student Pricing</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[var(--color-text)]">
            Simple, honest pricing for students
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-text-2)] max-w-2xl mx-auto leading-relaxed">
            Organize your courses and deadlines for free forever. Upgrade to Pro when you want AI-generated study plans and full command center intelligence.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[var(--color-text)]">Free</h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-[var(--color-text-2)]">
                    Forever Free
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-2)]">
                  Everything you need to stay organized across your entire semester.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-[var(--color-text)]">$0</span>
                  <span className="text-sm text-[var(--color-text-3)]">/ free forever</span>
                </div>

                <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-4">
                    Core Academic Features
                  </p>
                  <ul className="space-y-3 text-sm text-[var(--color-text-2)]">
                    {[
                      "Unlimited courses & credit hour tracking",
                      "Weekly interactive class timetable matrix",
                      "Assignment tracker with due date urgency",
                      "Exam countdowns, room info & study notes",
                      "CGPA calculator & attendance tracking (75% alerts)",
                      "Personal university expense tracking (PKR)",
                      "Basic AI Study Buddy (5 questions / day)",
                      "Light, Dark & System adaptive appearance",
                    ].map((feat, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 mt-0.5">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={session ? "/dashboard" : "/signup"}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors shadow-xs"
                >
                  {session ? "Go to Dashboard" : "Get Started Free"}
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative flex flex-col justify-between rounded-3xl border border-blue-500/40 bg-gradient-to-b from-blue-500/10 via-[var(--color-surface)] to-[var(--color-surface)] p-8 shadow-md ring-1 ring-blue-500/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Ambitious Student Tier</span>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[var(--color-text)]">Pro</h3>
                  <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Pro Access
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-2)]">
                  Intelligent study schedules, proactive command center priorities, and 10x AI quota.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-[var(--color-text)]">{proPrice}</span>
                  <span className="text-sm text-[var(--color-text-3)]">/ month</span>
                </div>

                <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4">
                    Everything in Free, plus:
                  </p>
                  <ul className="space-y-3 text-sm text-[var(--color-text-2)]">
                    {[
                      "Smart AI Study Plan generator based on your real deadlines",
                      "Smart Command Center daily urgency ranking",
                      "10x higher AI Allowance (50 questions / day)",
                      "Conflict-free study slots automatically detected around classes",
                      "Unified calendar aggregation (classes, exams, assignments, study)",
                      "Advanced Academic Trend Insights & risk warnings",
                      "Priority Merchant-of-Record receipts & support",
                      "14-day no-questions-asked refund policy",
                    ].map((feat, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white mt-0.5">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span className="font-medium text-[var(--color-text)]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={session ? "/dashboard/billing" : "/signup?next=/dashboard/billing"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-[0.98] transition-all"
                >
                  <span>{session ? "Upgrade in Dashboard" : "Start UniMate Pro"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 py-16">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
              <HelpCircle className="h-4 w-4" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl font-bold text-center text-[var(--color-text)] mb-10">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
                >
                  <h3 className="font-semibold text-[var(--color-text)]">{faq.q}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-2)] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
