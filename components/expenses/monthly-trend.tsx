"use client";

import { BarChart3 } from "lucide-react";
import { MonthlyTrendItem } from "@/app/lib/expense-definitions";

type MonthlyTrendProps = {
  trend: MonthlyTrendItem[];
};

export function MonthlyTrend({ trend }: MonthlyTrendProps) {
  const maxAmount = Math.max(...trend.map((t) => t.amount), 0);
  const hasData = maxAmount > 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <h3 className="text-[14px] font-semibold text-slate-900">Monthly Spending Trend</h3>
        </div>
        <div className="py-8 text-center">
          <p className="text-[13px] text-slate-500 font-medium">No spending trend yet.</p>
          <p className="mt-1 text-[12px] text-slate-400">
            Expenses will be visualized here month by month.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <h3 className="text-[14px] font-semibold text-slate-900">Monthly Spending Trend</h3>
        </div>
        <span className="text-[12px] font-medium text-slate-400">Last 6 Months</span>
      </div>

      {/* Bar visual chart */}
      <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
        {trend.map((item) => {
          const heightPct = maxAmount > 0 ? Math.round((item.amount / maxAmount) * 100) : 0;
          const isCurrentMonth = item === trend[trend.length - 1];

          return (
            <div
              key={item.monthKey}
              className="group flex flex-1 flex-col items-center gap-2 h-full justify-end"
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10.5px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-1">
                {item.amountString}
              </div>

              {/* Bar */}
              <div className="w-full max-w-[38px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-full">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isCurrentMonth
                      ? "bg-blue-600 group-hover:bg-blue-700"
                      : "bg-slate-300 group-hover:bg-slate-400"
                  }`}
                  style={{ height: `${Math.max(item.amount > 0 ? 8 : 2, heightPct)}%` }}
                />
              </div>

              {/* Label */}
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                {item.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
