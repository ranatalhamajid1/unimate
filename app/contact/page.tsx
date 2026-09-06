import Link from "next/link";
import { GraduationCap, ArrowLeft, Mail, MessageSquare, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Contact Us — UniMate",
  description: "Get in touch with the UniMate team for support, product questions, or academic partnership inquiries.",
};

export default function ContactPage() {
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
            <Mail className="h-3.5 w-3.5" />
            <span>Support &amp; Inquiries</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--color-text)]">
            Contact UniMate
          </h1>
          <p className="mt-2 text-base text-[var(--color-text-2)]">
            Have questions about UniMate, need help with your account, or want to give feedback? We&apos;re here to help.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text)]">Customer &amp; Student Support</h3>
              <p className="mt-1 text-sm text-[var(--color-text-2)]">
                Assistance with accounts, feature inquiries, bug reports, and billing questions.
              </p>
              <a
                href="mailto:support@unimate.app"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@unimate.app
              </a>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text)]">Billing &amp; Merchant Inquiries</h3>
              <p className="mt-1 text-sm text-[var(--color-text-2)]">
                For order receipts, invoice lookups, or transaction queries processed by Paddle.
              </p>
              <a
                href="https://paddle.net"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                paddle.net (Paddle Buyer Portal)
              </a>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-3)] mb-2">
              Operational Details
            </h3>
            <p className="text-sm text-[var(--color-text-2)] leading-relaxed">
              UniMate is an independent academic productivity SaaS operated for global university students. All online card and digital wallet transactions are securely handled by <strong>Paddle.com Market Ltd</strong> as Merchant of Record.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--color-text-3)]">
              <span>Response Time: Typically within 24 business hours</span>
              <span>•</span>
              <span>Available globally in English</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
