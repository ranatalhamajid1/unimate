"use client";

/**
 * Sign Up page — /signup
 *
 * Uses useActionState (React 19 / Next.js 16) to call the `signup` Server Action.
 * Styled identically to the login page using the UniMate design system.
 */

import { useActionState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { signup } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="min-h-screen bg-[#FCFCFB] flex flex-col">
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
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            UniMate
          </span>
        </Link>
        <p className="text-[13.5px] text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Log in
          </Link>
        </p>
      </header>

      {/* ── Main card ────────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] animate-scale-in">
          {/* Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.04)] sm:p-8">
            {/* Heading */}
            <div className="mb-7 text-center">
              <h1 className="text-[1.6rem] font-semibold tracking-tight text-slate-900">
                Create your account
              </h1>
              <p className="mt-1.5 text-[13.5px] text-slate-500">
                Free forever — built for university students
              </p>
            </div>

            {/* Benefits chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {[
                "Timetable & schedule",
                "Assignment tracker",
                "AI Study Buddy",
                "Exam countdowns",
              ].map((benefit) => (
                <span
                  key={benefit}
                  className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700"
                >
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  {benefit}
                </span>
              ))}
            </div>

            {/* Generic error banner */}
            {state?.message && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700"
              >
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{state.message}</span>
              </div>
            )}

            {/* Form */}
            <form action={action} className="space-y-4">
              {/* Full name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="mb-1.5 block text-[13px] font-medium text-slate-700"
                >
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Johnson"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      state?.errors?.name
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  />
                </div>
                {state?.errors?.name && (
                  <p className="mt-1.5 text-[12px] text-red-600">
                    {state.errors.name[0]}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-1.5 block text-[13px] font-medium text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@university.edu"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      state?.errors?.email
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  />
                </div>
                {state?.errors?.email && (
                  <p className="mt-1.5 text-[12px] text-red-600">
                    {state.errors.email[0]}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1.5 block text-[13px] font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      state?.errors?.password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  />
                </div>
                {state?.errors?.password && (
                  <ul className="mt-2 space-y-1">
                    {state.errors.password.map((err) => (
                      <li
                        key={err}
                        className="flex items-center gap-1.5 text-[12px] text-red-600"
                      >
                        <span className="shrink-0">•</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                )}
                {!state?.errors?.password && (
                  <p className="mt-1.5 text-[11.5px] text-slate-400">
                    Must be at least 8 characters with a letter and number.
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={pending}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-[14px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Get Started — It&apos;s Free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-5 text-center text-[13px] text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[12px] text-slate-400">
            By signing up, you agree to UniMate&apos;s{" "}
            <span className="underline underline-offset-2">Terms</span> and{" "}
            <span className="underline underline-offset-2">Privacy Policy</span>.
            No credit card required.
          </p>
        </div>
      </main>
    </div>
  );
}
