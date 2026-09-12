import { GraduationCap } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "AI Study Buddy", href: "/#ai-study-buddy" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Help & FAQ", href: "/pricing#faqs" },
      { label: "Paddle Buyer Portal", href: "https://paddle.net" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="px-4 pb-12 pt-16">
      <div className="mx-auto max-w-6xl">
        {/* Top Hairline Separator with gradient fade */}
        <div
          aria-hidden
          className="mb-12 h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent 5%, var(--color-border) 25%, var(--color-border) 75%, transparent 95%)",
          }}
        />

        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <a href="#" className="group flex items-center gap-2.5">
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm transition-transform group-hover:scale-105">
                <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
                UniMate
              </span>
            </a>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--color-text-3)]">
              Your university life, organized. The unified academic operating system built for students.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-8 sm:gap-14">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] text-[var(--color-text-2)] transition-colors duration-150 hover:text-[var(--color-text)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start gap-2 border-t border-[var(--color-border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[var(--color-text-3)]">
            © 2026 UniMate. All rights reserved.
          </p>
          <p className="text-[12px] text-[var(--color-text-3)]">
            Built for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
}
