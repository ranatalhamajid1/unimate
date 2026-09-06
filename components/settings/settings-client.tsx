"use client";

import Link from "next/link";
import { User, Moon, ShieldCheck, LogOut, Sparkles, CreditCard, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logout } from "@/app/actions/auth";

interface SettingsClientProps {
  name: string;
  email: string;
  plan?: string;
  isPro?: boolean;
}

export function SettingsClient({ name, email, plan = "FREE", isPro = false }: SettingsClientProps) {
  const initial = name?.trim() ? name.trim()[0].toUpperCase() : "U";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-2)]">
          Manage your account profile, appearance preferences, and session.
        </p>
      </div>

      {/* Profile Section */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Profile Information
            </h2>
            <p className="text-xs text-[var(--color-text-3)]">
              Your personal account details
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {initial}
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2 w-full">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Full Name
              </label>
              <div className="mt-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-text)]">
                {name}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Email Address
              </label>
              <div className="mt-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-text)]">
                {email}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription & Plan Section */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Subscription &amp; Membership
            </h2>
            <p className="text-xs text-[var(--color-text-3)]">
              Your active plan status and billing management
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-text)]">
                {isPro ? "UniMate Pro" : "UniMate Free Tier"}
              </span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold tracking-wider uppercase ${
                  isPro
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                    : "bg-slate-200 dark:bg-slate-700/60 text-[var(--color-text-2)]"
                }`}
              >
                {isPro ? "PRO ACTIVE" : "FREE FOREVER"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-2)] leading-relaxed">
              {isPro
                ? "Full access to AI Study Plans, Smart Command Center priorities, and 50 daily AI prompts."
                : "Standard access to courses, timetable, exams, GPA tracking, and 5 daily AI prompts."}
            </p>
          </div>

          <Link
            href="/dashboard/billing"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors shrink-0"
          >
            <span>{isPro ? "Manage Subscription" : "View Billing & Upgrade"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Appearance & Theme
            </h2>
            <p className="text-xs text-[var(--color-text-3)]">
              Customize how UniMate looks on your device
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              Interface Theme
            </p>
            <p className="text-xs text-[var(--color-text-2)] mt-0.5">
              Select Light, Dark, or sync automatically with your system settings.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <ThemeToggle variant="segmented" />
          </div>
        </div>
      </section>

      {/* Security & Session */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Security & Session
            </h2>
            <p className="text-xs text-[var(--color-text-3)]">
              Session management and data protection
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">
                Active Session
              </p>
              <p className="text-xs text-[var(--color-text-2)] mt-0.5">
                Encrypted JWT session with HTTP-only cookie protection.
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* About Section */}
      <div className="flex items-center justify-between px-2 text-xs text-[var(--color-text-3)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <span>UniMate Academic Suite v1.0.0</span>
        </div>
        <p>Production Ready &bull; Encrypted</p>
      </div>
    </div>
  );
}
