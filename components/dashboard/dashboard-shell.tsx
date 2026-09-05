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
    <div className="min-h-screen bg-[#FCFCFB]">
      {/* Sidebar (desktop fixed + mobile drawer) */}
      <Sidebar
        name={name}
        email={email}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile top bar */}
      <MobileHeader name={name} onMenuOpen={() => setSidebarOpen(true)} />

      {/* Main content — offset by sidebar width on desktop */}
      <main className="lg:pl-[240px]">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-8 lg:py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
