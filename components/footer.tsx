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
    <footer className="px-4 pb-8 pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-px bg-[var(--color-border-subtle)]" />

        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-[200px]">
            <a href="#" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.25} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
                UniMate
              </span>
            </a>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--color-text-3)]">
              Your university life, organized.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-8 sm:gap-12">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13.5px] text-[var(--color-text-3)] transition-colors duration-150 hover:text-[var(--color-text)]"
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
        <div className="mt-10 flex flex-col items-start gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-[var(--color-text-3)]">
            © 2026 UniMate. All rights reserved.
          </p>
          <p className="text-[12px] text-[var(--color-border)]">
            Built for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
}
