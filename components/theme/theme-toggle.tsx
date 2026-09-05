"use client";

/**
 * ThemeToggle — compact segmented control for Light / System / Dark.
 *
 * Variants:
 *  - "segmented" (default): three icon buttons side-by-side (for sidebar)
 *  - "icon": single cycling icon button (for mobile header / navbar)
 */

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type ThemeToggleProps = {
  variant?: "segmented" | "icon";
  className?: string;
};

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light mode" },
  { value: "system", icon: Monitor, label: "System mode" },
  { value: "dark", icon: Moon, label: "Dark mode" },
] as const;

export function ThemeToggle({ variant = "segmented", className = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder matching the expected size to avoid layout shift
    if (variant === "icon") {
      return (
        <div className={`h-8 w-8 rounded-lg bg-transparent ${className}`} aria-hidden />
      );
    }
    return (
      <div className={`h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`} aria-hidden />
    );
  }

  // ── Icon variant (single cycling button) ──────────────────────────
  if (variant === "icon") {
    const isDark = resolvedTheme === "dark";
    const Icon = isDark ? Sun : Moon;
    const nextLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
    const nextTheme = isDark ? "light" : "dark";

    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={nextLabel}
        title={nextLabel}
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${className}`}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  // ── Segmented variant (three-button control) ───────────────────────
  return (
    <div
      className={`flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 p-0.5 ${className}`}
      role="group"
      aria-label="Choose theme"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={label}
            title={label}
            aria-pressed={isActive}
            className={`flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              isActive
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
