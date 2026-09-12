"use client";

/**
 * Sidebar — desktop persistent nav + mobile drawer.
 *
 * On desktop (lg+): fixed left sidebar, 240px wide.
 * On mobile: hidden by default, slides in as a drawer when open.
 * Receives `session` data as props (passed from the server-rendered page).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
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
  Clock,
  Layers,
  Target,
  CreditCard,
  Users,
  Share2,
  TrendingUp,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// ---------------------------------------------------------------------------
// Nav items & Groups
// ---------------------------------------------------------------------------

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  soon: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "ACADEMICS",
    items: [
      { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard, soon: false },
      { id: "courses", label: "Courses", href: "/dashboard/courses", icon: BookOpen, soon: false },
      { id: "timetable", label: "Timetable", href: "/dashboard/timetable", icon: Calendar, soon: false },
      { id: "calendar", label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, soon: false },
      { id: "assignments", label: "Assignments", href: "/dashboard/assignments", icon: FileText, soon: false },
      { id: "exams", label: "Exams", href: "/dashboard/exams", icon: Timer, soon: false },
      { id: "academics", label: "Academics", href: "/dashboard/academics", icon: Award, soon: false },
    ],
  },
  {
    title: "NETWORK",
    items: [
      { id: "communities", label: "Campus Network", href: "/dashboard/communities", icon: Users, soon: false },
    ],
  },
  {
    title: "PRODUCTIVITY",
    items: [
      { id: "study", label: "Study Tracking", href: "/dashboard/study", icon: Clock, soon: false },
      { id: "study-plan", label: "Study Planner", href: "/dashboard/study-plan", icon: Layers, soon: false },
      { id: "weekly-review", label: "Weekly Review", href: "/dashboard/review", icon: TrendingUp, soon: false },
      { id: "goals", label: "Goals", href: "/dashboard/goals", icon: Target, soon: false },
    ],
  },
  {
    title: "PERSONAL",
    items: [
      { id: "expenses", label: "Expenses", href: "/dashboard/expenses", icon: Wallet, soon: false },
    ],
  },
  {
    title: "AI",
    items: [
      { id: "ai-buddy", label: "AI Study Buddy", href: "/dashboard/ai", icon: Sparkles, soon: false },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { id: "billing", label: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard, soon: false },
      { id: "integrations", label: "Integrations", href: "/dashboard/integrations", icon: Share2, soon: false },
    ],
  },
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
      {/* Logo & Brand Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-glass-border)] px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-[0_2px_10px_rgba(99,102,241,0.35)]">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
            UniMate
          </span>
        </div>

        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          aria-label="Notifications"
          className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)]/70 hover:text-[var(--color-text)] transition-micro"
        >
          <Bell className="h-4 w-4" />
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-2.5 pb-1.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--color-text-3)]/90">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ id, label, href, icon: Icon, soon }) => {
                const isActive = pathname === href;
                return (
                  <li key={id}>
                    <Link
                      href={soon ? "#" : href}
                      onClick={onClose}
                      aria-disabled={soon}
                      className={`group flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-micro border ${
                        isActive
                          ? "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 font-semibold border-indigo-500/20 dark:border-indigo-500/30 shadow-[0_1px_4px_rgba(99,102,241,0.08)]"
                          : "border-transparent text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]/80 hover:text-[var(--color-text)]"
                      } ${soon ? "opacity-60 cursor-default" : ""}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-micro ${
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-[var(--color-text-3)] group-hover:text-[var(--color-text-2)]"
                          }`}
                        />
                        {label}
                      </span>
                      {soon && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-3)]">
                          Soon
                        </span>
                      )}
                      {isActive && !soon && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section — user + controls */}
      <div className="shrink-0 border-t border-[var(--color-glass-border)] px-3 py-3 space-y-1 bg-[var(--color-glass-bg)]/40">
        {/* Theme Toggle */}
        <div className="px-1 py-1.5">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
            Appearance
          </p>
          <ThemeToggle variant="segmented" className="w-full" />
        </div>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[var(--color-text-2)] transition-micro hover:bg-[var(--color-surface-2)]/80 hover:text-[var(--color-text)]"
          onClick={onClose}
        >
          <Settings className="h-4 w-4 shrink-0 text-[var(--color-text-3)]" />
          Settings
        </Link>

        {/* Logout */}
        <form action={logout}>
          <button
            id="sidebar-logout"
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[var(--color-text-2)] transition-micro hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </form>

        {/* User profile capsule */}
        <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/60 backdrop-blur-sm px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[12px] font-semibold text-white shadow-xs">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-[var(--color-text)]">
              {name}
            </p>
            <p className="truncate text-[10.5px] text-[var(--color-text-3)]">{email}</p>
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
      {/* Desktop sidebar — floating glass navigation rail */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-[248px] lg:flex-col lg:border-r lg:border-[var(--color-glass-border)] lg:bg-[var(--color-glass-bg)] lg:backdrop-blur-2xl [box-shadow:4px_0_24px_rgba(15,23,42,0.04),var(--specular-top)] dark:[box-shadow:4px_0_32px_rgba(0,0,0,0.45),var(--specular-top)]">
        <SidebarContent name={name} email={email} />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 dark:bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={onClose}
            aria-hidden
          />
          {/* Drawer panel */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-[var(--color-glass-border)] bg-[var(--color-surface)] dark:bg-[var(--color-surface)] shadow-[4px_0_40px_rgba(15,23,42,0.18)] dark:shadow-[4px_0_40px_rgba(0,0,0,0.6)] lg:hidden">
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-2)] hover:bg-slate-100 dark:hover:bg-slate-700/50"
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
