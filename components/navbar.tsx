"use client";

import { useEffect, useState } from "react";
import { Menu, X, GraduationCap, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "AI Study Buddy", href: "/#ai-study-buddy" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3.5 sm:pt-4">
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-5 ${
          scrolled
            ? "border border-slate-200/80 dark:border-slate-800/90 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-xl"
            : "border border-slate-200/50 dark:border-slate-800/50 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
        }`}
        style={{
          backgroundColor: scrolled
            ? "color-mix(in srgb, var(--color-surface) 88%, transparent)"
            : "color-mix(in srgb, var(--color-surface) 72%, transparent)",
        }}
      >
        {/* Logo */}
        <a href="#" className="group flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 shadow-[0_2px_8px_rgba(37,99,235,0.35)] transition-transform duration-200 group-hover:scale-105">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
            <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/25" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
            UniMate
          </span>
        </a>

        {/* Center nav — desktop */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium tracking-[-0.01em] text-[var(--color-text-2)] transition-all duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-[var(--color-text)]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right — desktop */}
        <div className="hidden items-center gap-1.5 md:flex">
          <ThemeToggle variant="icon" className="mr-0.5" />
          <a
            href="/login"
            className="rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium text-[var(--color-text-2)] transition-colors duration-150 hover:text-[var(--color-text)]"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="group relative ml-1 inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-slate-900 dark:bg-blue-600 px-4 py-1.5 text-[13.5px] font-medium text-white shadow-[0_2px_10px_rgba(15,23,42,0.16)] dark:shadow-[0_2px_12px_rgba(37,99,235,0.35)] transition-all duration-200 hover:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.98]"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-white/25" />
            Get Started
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle variant="icon" />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-2)] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu — animated fade/slide */}
      <div
        className={`absolute left-4 right-4 top-[64px] z-40 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-[var(--color-surface)]/95 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-2"
        }`}
      >
        <div className="p-3">
          <ul className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-[var(--color-text)] transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-col gap-2 border-t border-[var(--color-border-subtle)] pt-2.5">
            <a
              href="/login"
              className="rounded-xl px-3.5 py-2.5 text-center text-[14px] font-medium text-[var(--color-text-2)] transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 px-3.5 py-2.5 text-center text-[14px] font-medium text-white shadow-sm transition-all hover:bg-blue-600 dark:hover:bg-blue-500"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
