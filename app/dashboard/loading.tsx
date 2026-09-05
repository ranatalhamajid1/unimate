/**
 * Dashboard loading skeleton — minimal, elegant skeleton matching UniMate cards.
 */

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3.5 w-28 rounded-md bg-slate-200 dark:bg-slate-700/60" />
        <div className="h-8 w-64 rounded-xl bg-slate-200 dark:bg-slate-700/60" />
        <div className="h-4 w-80 rounded-md bg-slate-200/70 dark:bg-slate-700/40" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3"
          >
            <div className="h-3 w-16 rounded-md bg-slate-200 dark:bg-slate-700/60" />
            <div className="h-7 w-20 rounded-md bg-slate-200 dark:bg-slate-700/60" />
            <div className="h-2.5 w-24 rounded-md bg-slate-100 dark:bg-slate-700/40" />
          </div>
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <div className="h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-700/60" />
            <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-700/40" />
            <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-700/40" />
          </div>
          <div className="h-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <div className="h-4 w-36 rounded-md bg-slate-200 dark:bg-slate-700/60" />
            <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-700/40" />
            <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-700/40" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-44 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-700/60" />
            <div className="h-14 w-full rounded-xl bg-slate-100 dark:bg-slate-700/40" />
          </div>
          <div className="h-56 rounded-2xl bg-slate-900 dark:bg-slate-800/80 p-5 space-y-3">
            <div className="h-4 w-32 rounded-md bg-slate-800 dark:bg-slate-700/80" />
            <div className="h-16 w-full rounded-xl bg-slate-800/80 dark:bg-slate-700/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
