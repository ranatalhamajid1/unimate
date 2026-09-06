import Link from "next/link";
import { GraduationCap, ArrowLeft, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Refund & Cancellation Policy — UniMate",
  description: "Understand UniMate's transparent 14-day refund and subscription cancellation policies.",
};

export default function RefundPage() {
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
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Buyer Protection</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--color-text)]">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-3)]">
            Last Updated: September 6, 2026
          </p>

          <div className="mt-8 space-y-8 text-sm sm:text-[15px] leading-relaxed text-[var(--color-text-2)] border-t border-[var(--color-border)] pt-8">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">1. Easy Self-Service Cancellation</h2>
              <p>
                You may cancel your UniMate Pro subscription at any time with a single click:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Log in to your UniMate account and navigate to <strong>Dashboard &gt; Billing &amp; Plans</strong>.</li>
                <li>Click <strong>Manage Subscription</strong> to open the Paddle customer portal.</li>
                <li>Select <strong>Cancel Subscription</strong>.</li>
              </ol>
              <p>
                Upon cancellation, your Pro benefits remain active until the end of your prepaid monthly billing period. You will not be billed again.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">2. 14-Day Refund Window</h2>
              <p>
                We want students to feel 100% confident trying UniMate Pro. If you are not satisfied with UniMate Pro for any reason, you are eligible for a full refund within <strong>14 days</strong> of your initial subscription purchase or renewal.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">3. How to Request a Refund</h2>
              <p>
                To request a refund within the 14-day window:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Send an email to <a href="mailto:support@unimate.app" className="text-blue-600 underline">support@unimate.app</a> from the email address associated with your UniMate account.</li>
                <li>Include your account email and, if available, your Paddle order or transaction reference number.</li>
                <li>Our support team will process your request within 24–48 business hours.</li>
              </ul>
              <p>
                Once approved, refunds are credited back to your original payment method (card or PayPal) by Paddle, typically reflecting on your statement within 3 to 7 business days depending on your bank.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">4. Merchant of Record Role</h2>
              <p>
                As our authorized Merchant of Record, <strong>Paddle.com Market Ltd</strong> handles order fulfillment, returns, and dispute management. You may also contact Paddle Buyer Support directly via <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">paddle.net</a> to inquire about charges or receipt lookups.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">5. Questions &amp; Support</h2>
              <p>
                If you have any questions regarding your subscription, charges, or cancellation, reach out to us at <a href="mailto:support@unimate.app" className="text-blue-600 underline">support@unimate.app</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
