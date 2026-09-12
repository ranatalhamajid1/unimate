"use client";

/**
 * MobileHeader — compact top bar for small screens (hidden on lg+).
 * Shows hamburger menu, UniMate logo, and user avatar + theme toggle.
 */

import Link from "next/link";
import { Menu, GraduationCap, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type MobileHeaderProps = {
  name: string;
  onMenuOpen: () => void;
};

export function MobileHeader({ name, onMenuOpen }: MobileHeaderProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-glass-border)] bg-[var(--color-glass-bg)]/85 px-4 backdrop-blur-xl [box-shadow:var(--shadow-xs),var(--specular-top)] lg:hidden">
      {/* Left — hamburger */}
      <button
        onClick={onMenuOpen}
        aria-label="Open menu"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-2)] transition-micro hover:bg-[var(--color-surface-2)]"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Center — logo */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
          <GraduationCap className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
        </span>
        <span className="text-[14px] font-semibold tracking-tight text-[var(--color-text)]">
          UniMate
        </span>
      </div>

      {/* Right — theme toggle + notifications + avatar */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle variant="icon" />
        <Link
          href="/dashboard/notifications"
          aria-label="View notifications"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-3)] transition-micro hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[11.5px] font-semibold text-white shadow-xs">
          {initial}
        </div>
      </div>
    </header>
  );
}
