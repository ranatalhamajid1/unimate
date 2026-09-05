"use client";

/**
 * MobileHeader — compact top bar for small screens (hidden on lg+).
 * Shows hamburger menu, UniMate logo, and user avatar.
 */

import Link from "next/link";
import { Menu, GraduationCap, Bell } from "lucide-react";

type MobileHeaderProps = {
  name: string;
  onMenuOpen: () => void;
};

export function MobileHeader({ name, onMenuOpen }: MobileHeaderProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md lg:hidden">
      {/* Left — hamburger */}
      <button
        onClick={onMenuOpen}
        aria-label="Open menu"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Center — logo */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
          <GraduationCap className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
        </span>
        <span className="text-[14px] font-semibold tracking-tight text-slate-900">
          UniMate
        </span>
      </div>

      {/* Right — avatar */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/notifications"
          aria-label="View notifications"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[12px] font-semibold text-white">
          {initial}
        </div>
      </div>
    </header>
  );
}
