import Link from "next/link";
import { Layers, Clock, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { StudyPlanData } from "@/app/lib/study-plan-definitions";
import { formatPKTTime } from "@/app/lib/timezone";

type Props = {
  plan: StudyPlanData | null;
};

export function TodayStudyPlan({ plan }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];

  const todayTasks = plan?.items.filter((item) => {
    const itemDate = new Date(item.scheduledAt).toISOString().split("T")[0];
    return itemDate === todayStr;
  }) || [];

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Today&apos;s Study Plan
          </h2>
        </div>
        <Link
          href="/dashboard/study-plan"
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
        >
          {plan ? "View Plan" : "Create Plan"}
        </Link>
      </div>

      {todayTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center">
          <p className="text-xs font-medium text-[var(--color-text-2)]">
            No study sessions scheduled for today.
          </p>
          <Link
            href="/dashboard/study-plan"
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate Study Plan</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {todayTasks.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {item.course && (
                    <span
                      style={{
                        backgroundColor: `${item.course.color}15`,
                        color: item.course.color,
                      }}
                      className="rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
                    >
                      {item.course.code}
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold truncate ${
                      item.completed ? "line-through text-[var(--color-text-3)]" : "text-[var(--color-text)]"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--color-text-3)]">
                  <span>{formatPKTTime(item.scheduledAt)}</span>
                  <span>·</span>
                  <span>{item.duration}m</span>
                </div>
              </div>

              {item.completed ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Done
                </span>
              ) : (
                <Link
                  href="/dashboard/study-plan"
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Start
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
