"use client";

import { PieChart } from "lucide-react";
import { CategoryBreakdownItem } from "@/app/lib/expense-definitions";

type CategoryBreakdownProps = {
  items: CategoryBreakdownItem[];
};

export function CategoryBreakdown({ items }: CategoryBreakdownProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Spending by Category</h3>
        </div>
        <div className="py-8 text-center">
          <p className="text-[13px] text-[var(--color-text-2)] font-medium">No spending data yet.</p>
          <p className="mt-1 text-[12px] text-[var(--color-text-3)]">
            Log expenses to see your category breakdown.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Spending by Category</h3>
        </div>
        <span className="text-[12px] font-medium text-[var(--color-text-3)]">
          {items.length} {items.length === 1 ? "category" : "categories"}
        </span>
      </div>

      <div className="space-y-3.5">
        {items.map((item) => (
          <div key={item.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-[var(--color-text)]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-text)]">{item.amountString}</span>
                <span className="text-[11.5px] font-medium text-[var(--color-text-3)] w-9 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
