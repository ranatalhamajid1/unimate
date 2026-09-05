"use client";

import { useEffect, useState } from "react";
import { Menu, X, GraduationCap } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "AI Study Buddy", href: "#ai-study-buddy" },
  { label: "Dashboard", href: "#dashboard" },
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
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5 ${
          scrolled
            ? "border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-8px_rgba(15,23,42,0.10)] backdrop-blur-xl"
            : "border border-slate-200/40 backdrop-blur-md"
        }`}
        style={{
          backgroundColor: scrolled
            ? "rgba(255,255,255,0.92)"
            : "rgba(255,255,255,0.65)",
        }}
      >
        {/* Logo */}
        <a href="#" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            UniMate
          </span>
        </a>

        {/* Center nav — desktop */}
        <ul className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-slate-500 transition-colors duration-200 hover:bg-slate-100/80 hover:text-slate-900"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right — desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <a
            href="/login"
            className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="ml-1 rounded-lg bg-slate-900 px-4 py-2 text-[13.5px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-600"
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
        >
          {menuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {/* Mobile menu — animated fade/slide */}
      <div
        className={`absolute left-4 right-4 top-[68px] z-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_32px_-8px_rgba(15,23,42,0.14)] transition-all duration-300 md:hidden ${
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
                  className="block rounded-xl px-3.5 py-2.5 text-[14.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2.5">
            <a
              href="/login"
              className="rounded-xl px-3.5 py-2.5 text-center text-[14.5px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-xl bg-slate-900 px-3.5 py-2.5 text-center text-[14.5px] font-medium text-white"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
