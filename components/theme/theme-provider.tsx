"use client";

/**
 * ThemeProvider — wraps next-themes provider.
 * Must be a client component so it can read localStorage + window.matchMedia.
 * attribute="class" makes next-themes add `dark` class to <html>, which
 * is compatible with Tailwind's dark: variant.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="unimate-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
