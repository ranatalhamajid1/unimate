import Link from "next/link";
import { GraduationCap, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs">
          <GraduationCap className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <p className="text-[12px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            404 Error
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Page not found
          </h1>
          <p className="text-[14.5px] leading-relaxed text-[var(--color-text-2)]">
            Sorry, we couldn&apos;t find the page you were looking for. It might have been moved or doesn&apos;t exist.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-colors hover:bg-blue-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--color-text)] shadow-xs transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
