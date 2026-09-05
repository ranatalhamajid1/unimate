"use client";

/**
 * Sidebar — desktop persistent nav + mobile drawer.
 *
 * On desktop (lg+): fixed left sidebar, 240px wide.
 * On mobile: hidden by default, slides in as a drawer when open.
 * Receives `session` data as props (passed from the server-rendered page).
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileText,
  Timer,
  Award,
  Wallet,
  Sparkles,
  Bell,
  Settings,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import { logout } from "@/app/actions/auth";

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  soon: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard, soon: false },
  { id: "courses", label: "Courses", href: "/dashboard/courses", icon: BookOpen, soon: false },
  { id: "timetable", label: "Timetable", href: "/dashboard/timetable", icon: Calendar, soon: false },
  { id: "assignments", label: "Assignments", href: "/dashboard/assignments", icon: FileText, soon: false },
  { id: "exams", label: "Exams", href: "/dashboard/exams", icon: Timer, soon: false },
  { id: "academics", label: "Academics", href: "/dashboard/academics", icon: Award, soon: false },
  { id: "expenses", label: "Expenses", href: "/dashboard/expenses", icon: Wallet, soon: false },
  { id: "ai-buddy", label: "AI Study Buddy", href: "/dashboard/ai", icon: Sparkles, soon: false },
  { id: "notifications", label: "Notifications", href: "/dashboard/notifications", icon: Bell, soon: false },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SidebarProps = {
  name: string;
  email: string;
  isOpen: boolean;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Inner nav content (shared between desktop & mobile)
// ---------------------------------------------------------------------------

function SidebarContent({
  name,
  email,
  onClose,
}: {
  name: string;
  email: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">
          UniMate
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, href, icon: Icon, soon }) => {
            const isActive = pathname === href;
            return (
              <li key={id}>
                <Link
                  href={soon ? "#" : href}
                  onClick={onClose}
                  aria-disabled={soon}
                  className={`group flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  } ${soon ? "opacity-60 cursor-default" : ""}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {label}
                  </span>
                  {soon && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      Soon
                    </span>
                  )}
                  {isActive && !soon && (
                    <ChevronRight className="h-3.5 w-3.5 text-blue-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom — user + actions */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-3 space-y-0.5">
        {/* Settings */}
        <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-500 transition-all duration-150 hover:bg-slate-100/80 hover:text-slate-900 opacity-60 cursor-default">
          <Settings className="h-4 w-4 shrink-0 text-slate-400" />
          Settings
          <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            Soon
          </span>
        </button>

        {/* Logout */}
        <form action={logout}>
          <button
            id="sidebar-logout"
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-600 transition-all duration-150 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </form>

        {/* User info */}
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[13px] font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-slate-800">
              {name}
            </p>
            <p className="truncate text-[11px] text-slate-500">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar (desktop + mobile drawer)
// ---------------------------------------------------------------------------

export function Sidebar({ name, email, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-[240px] lg:flex-col lg:border-r lg:border-slate-100 lg:bg-white">
        <SidebarContent name={name} email={email} />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
            aria-hidden
          />
          {/* Drawer panel */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-100 bg-white shadow-[4px_0_32px_rgba(15,23,42,0.12)] lg:hidden">
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent name={name} email={email} onClose={onClose} />
          </aside>
        </>
      )}
    </>
  );
}
