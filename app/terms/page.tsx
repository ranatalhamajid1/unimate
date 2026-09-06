import Link from "next/link";
import { GraduationCap, ArrowLeft, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Terms of Service — UniMate",
  description: "Terms and conditions governing the use of UniMate student management SaaS.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-sm text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">UniMate</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-2)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--color-text)]">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-3)]">
            Last Updated: September 6, 2026
          </p>

          <div className="mt-8 space-y-8 text-sm sm:text-[15px] leading-relaxed text-[var(--color-text-2)] border-t border-[var(--color-border)] pt-8">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using UniMate (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">2. Description of the Service</h2>
              <p>
                UniMate is a university productivity platform providing timetable scheduling, assignment and exam tracking, GPA calculation, academic expense budgeting, and AI-assisted study planning. The Service is provided under Free and Pro subscription tiers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">3. User Accounts and Security</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. You agree to immediately notify UniMate of any unauthorized use or security compromise of your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">4. Subscriptions, Payments &amp; Merchant of Record</h2>
              <p>
                Our order process is conducted by our online Merchant of Record, <strong>Paddle.com Market Ltd (&quot;Paddle&quot;)</strong>. Paddle acts as the Merchant of Record for all our orders. Paddle handles customer service inquiries, billing management, sales tax collection, and returns.
              </p>
              <p>
                Subscription fees for UniMate Pro are billed on a recurring monthly basis. By subscribing, you authorize recurring charges until you cancel your subscription. Prices are displayed in USD and are subject to applicable local taxes collected by Paddle.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">5. Cancellation and Refund Policy</h2>
              <p>
                You may cancel your UniMate Pro subscription at any time via your in-app Billing Settings. Upon cancellation, your Pro benefits remain active until the end of the current billing cycle, with no further charges. For full details on refund eligibility within 14 days of purchase, please review our dedicated <Link href="/refund" className="text-blue-600 underline underline-offset-2">Refund Policy</Link>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">6. Acceptable Use &amp; AI Feature Guidelines</h2>
              <p>
                You agree not to misuse the AI Study Buddy or AI Study Planner features. Prohibited activities include attempting to bypass system prompts, reverse-engineering API endpoints, automated scraping, or generating unlawful, abusive, or infringing content. Excessive automated requests that degrade system performance may result in temporary throttling or account suspension.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">7. Limitation of Liability</h2>
              <p>
                UniMate and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data or academic standing, arising out of your access or inability to access the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">8. Contact Information</h2>
              <p>
                For questions regarding these Terms of Service, please contact us at <a href="mailto:support@unimate.app" className="text-blue-600 underline">support@unimate.app</a> or visit our <Link href="/contact" className="text-blue-600 underline">Contact Page</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
