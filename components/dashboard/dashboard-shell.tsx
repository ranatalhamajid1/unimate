"use client";

/**
 * DashboardShell — client component that manages sidebar open/close state.
 *
 * Why client: the sidebar drawer requires useState for open/close.
 * The parent (layout.tsx) is a Server Component that reads the session
 * and passes name/email down as props — no client-side auth needed here.
 */

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

type Props = {
  name: string;
  email: string;
  children: React.ReactNode;
};

export function DashboardShell({ name, email, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200">
      {/* Layer 0: Spatial Atmospheric Illumination (Pure CSS, static, hardware-accelerated) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Top-right subtle Electric Indigo ambient light */}
        <div className="absolute -top-[20%] right-[-10%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,rgba(99,102,241,0.02)_45%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,rgba(99,102,241,0.02)_50%,transparent_75%)] blur-3xl" />

        {/* Mid-left subtle Violet atmospheric field */}
        <div className="absolute top-[25%] -left-[15%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.04)_0%,rgba(139,92,246,0.01)_50%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,rgba(139,92,246,0.015)_50%,transparent_75%)] blur-3xl" />

        {/* Bottom-right extremely faint Cyan highlight */}
        <div className="absolute -bottom-[10%] right-[15%] h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.025)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(34,211,238,0.035)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Sidebar (desktop floating glass rail + mobile drawer) */}
      <Sidebar
        name={name}
        email={email}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile top bar */}
      <MobileHeader name={name} onMenuOpen={() => setSidebarOpen(true)} />

      {/* Main academic workspace — offset by floating glass sidebar rail */}
      <main className="relative z-10 lg:pl-[248px]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

