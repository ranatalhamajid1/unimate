import Link from "next/link";
import { Target, ArrowRight } from "lucide-react";
import { GoalProgressItem } from "@/app/lib/goal-definitions";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  goals: GoalProgressItem[];
};

export function GoalsCard({ goals }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Target className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Student Goals
          </h2>
        </div>
        <Link
          href="/dashboard/goals"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </Link>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals active"
          description="Set a target semester GPA or weekly study goal to track your momentum."
          actionLabel="Set a Goal"
          actionHref="/dashboard/goals"
          compact
        />
      ) : (
        <div className="space-y-3">
          {goals.slice(0, 3).map((goal) => {
            const pctCapped = Math.min(100, Math.max(0, goal.percentage));
            return (
              <div key={goal.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--color-text)]">
                    {goal.label}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--color-text-2)]">
                    {goal.formattedCurrent} / {goal.formattedTarget}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div
                    style={{ width: `${pctCapped}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      goal.percentage >= 100
                        ? "bg-emerald-500"
                        : goal.isAtRisk
                        ? "bg-amber-500"
                        : "bg-blue-600 dark:bg-blue-500"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/goals"
        className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 pt-1"
      >
        <span>Manage goals & targets</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
