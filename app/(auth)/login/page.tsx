"use client";

/**
 * Login page — /login
 *
 * Uses useActionState (React 19 / Next.js 16) to call the `login` Server Action.
 * Fully styled with the UniMate design system: same fonts, colors, card style,
 * and button styles as the landing page.
 */

import { useActionState } from "react";
import Link from "next/link";
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* ── Ambient glow ─────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% -5%, rgba(37,99,235,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
            UniMate
          </span>
        </Link>
        <p className="text-[13.5px] text-[var(--color-text-2)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </header>

      {/* ── Main card ────────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] animate-scale-in">
          {/* Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-lg)] sm:p-8">
            {/* Heading */}
            <div className="mb-7 text-center">
              <h1 className="text-[1.6rem] font-semibold tracking-tight text-[var(--color-text)]">
                Welcome back
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[var(--color-text-2)]">
                Log in to your UniMate account
              </p>
            </div>

            {/* Generic error banner */}
            {state?.message && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] text-red-700 dark:text-red-400"
              >
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{state.message}</span>
              </div>
            )}

            {/* Form */}
            <form action={action} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-3)]" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@university.edu"
                    className={`w-full rounded-xl border bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-3)] outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      state?.errors?.email
                        ? "border-red-300 dark:border-red-500/50 focus:border-red-400 focus:ring-red-500/10"
                        : "border-[var(--color-border)] hover:border-[var(--color-text-3)]"
                    }`}
                  />
                </div>
                {state?.errors?.email && (
                  <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">
                    {state.errors.email[0]}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-[13px] font-medium text-[var(--color-text)]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-3)]" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-3)] outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      state?.errors?.password
                        ? "border-red-300 dark:border-red-500/50 focus:border-red-400 focus:ring-red-500/10"
                        : "border-[var(--color-border)] hover:border-[var(--color-text-3)]"
                    }`}
                  />
                </div>
                {state?.errors?.password && (
                  <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">
                    {state.errors.password[0]}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={pending}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-blue-600 px-5 py-3 text-[14px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-600 dark:hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
              <span className="text-[11.5px] text-[var(--color-text-3)]">or</span>
              <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            </div>

            {/* Sign up link */}
            <p className="mt-4 text-center text-[13px] text-[var(--color-text-2)]">
              New to UniMate?{" "}
              <Link
                href="/signup"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Create a free account
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[12px] text-[var(--color-text-3)]">
            By continuing, you agree to UniMate&apos;s{" "}
            <span className="underline underline-offset-2">Terms</span> and{" "}
            <span className="underline underline-offset-2">Privacy Policy</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
