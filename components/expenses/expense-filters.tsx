"use client";

import { Search, X } from "lucide-react";
import { EXPENSE_CATEGORIES, getCategoryLabel } from "@/app/lib/expense-definitions";

export type DateFilterOption = "ALL" | "THIS_MONTH" | "THIS_WEEK";

type ExpenseFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedDateFilter: DateFilterOption;
  onDateFilterChange: (value: DateFilterOption) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

export function ExpenseFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDateFilter,
  onDateFilterChange,
  onClearFilters,
  hasActiveFilters,
}: ExpenseFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-3)]" />
          <input
            type="text"
            placeholder="Search by description or category..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-8 py-2 text-[13px] text-[var(--color-text)] placeholder-[var(--color-text-3)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-3)] hover:text-[var(--color-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "ALL", label: "All Time" },
              { id: "THIS_MONTH", label: "This Month" },
              { id: "THIS_WEEK", label: "This Week" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onDateFilterChange(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition ${
                selectedDateFilter === tab.id
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                  : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills & Clear */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => onCategoryChange("ALL")}
            className={`rounded-lg px-2.5 py-1 text-[12px] font-medium whitespace-nowrap transition ${
              selectedCategory === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-2)] hover:text-[var(--color-text)]"
            }`}
          >
            All Categories
          </button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-lg px-2.5 py-1 text-[12px] font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-2)] hover:text-[var(--color-text)]"
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex-shrink-0 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
