import Link from "next/link";
import { GraduationCap, ArrowLeft, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Privacy Policy — UniMate",
  description: "Learn how UniMate collects, uses, and protects your personal and academic information.",
};

export default function PrivacyPage() {
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
            <Lock className="h-3.5 w-3.5" />
            <span>Data Protection</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--color-text)]">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-3)]">
            Last Updated: September 6, 2026
          </p>

          <div className="mt-8 space-y-8 text-sm sm:text-[15px] leading-relaxed text-[var(--color-text-2)] border-t border-[var(--color-border)] pt-8">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">1. Information We Collect</h2>
              <p>
                When you use UniMate, we collect information you provide directly to us:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account Information:</strong> Your name, email address, and encrypted authentication password.</li>
                <li><strong>Academic Information:</strong> Enrolled courses, class schedules, assignments, exam dates, grades, study sessions, and study goals.</li>
                <li><strong>AI Prompts:</strong> Academic questions and context submitted to the AI Study Buddy or Study Plan generator.</li>
                <li><strong>Usage &amp; Device Information:</strong> Standard server logs, device type, browser metadata, and IP address for security and rate-limiting purposes.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">2. How We Use Your Information</h2>
              <p>
                We use your data strictly to provide, maintain, and enhance the UniMate service:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Displaying and managing your timetable, assignments, exams, and GPA.</li>
                <li>Generating customized AI study plans and academic recommendations.</li>
                <li>Enforcing tier entitlements and daily AI quota limits.</li>
                <li>Protecting against malicious activity, unauthorized access, or API abuse.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">3. Payment &amp; Billing Data</h2>
              <p>
                UniMate does not store credit card numbers or sensitive payment credentials on its servers. All payments and subscription transactions are processed by <strong>Paddle.com Market Ltd</strong> acting as our Merchant of Record. Paddle retains transaction data subject to their own stringent security and compliance standards (<a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Paddle Privacy Policy</a>).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">4. AI Processing &amp; Third-Party Services</h2>
              <p>
                AI features in UniMate are powered by secure LLM APIs (Google Gemini). Only relevant academic context needed to fulfill your specific prompt is sent. Your academic data is never sold to third-party advertisers or data brokers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">5. Data Retention &amp; Deletion</h2>
              <p>
                Your academic data is retained as long as your account remains active. You may export or permanently delete your account and all associated academic records at any time by contacting us at <a href="mailto:support@unimate.app" className="text-blue-600 underline">support@unimate.app</a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">6. Security Measures</h2>
              <p>
                We implement industry-standard security protocols including HTTPS TLS encryption in transit, Argon2/bcrypt password hashing, multi-tenant database isolation, and encrypted server-side session cookies to protect your personal data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">7. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy or your data rights, please contact our privacy team at <a href="mailto:privacy@unimate.app" className="text-blue-600 underline">privacy@unimate.app</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
