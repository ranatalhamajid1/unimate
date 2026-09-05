import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniMate — Your university life, organized.",
  description:
    "Manage your courses, assignments, exams, timetable, expenses and study plans — all in one place. Built for university students.",
  openGraph: {
    title: "UniMate — Your university life, organized.",
    description: "Manage your courses, assignments, exams, timetable, expenses and study plans — all in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="overflow-x-hidden font-sans antialiased bg-[var(--color-bg)] text-[var(--color-text)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}