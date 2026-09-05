"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  Calendar,
  Plus,
  Receipt,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import {
  Expense,
  ExpenseSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  SpendingInsight,
} from "@/app/lib/expense-definitions";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { DeleteExpenseDialog } from "@/components/expenses/delete-expense-dialog";
import { ExpenseFilters, DateFilterOption } from "@/components/expenses/expense-filters";
import { CategoryBreakdown } from "@/components/expenses/category-breakdown";
import { MonthlyTrend } from "@/components/expenses/monthly-trend";

type ExpensesViewProps = {
  initialExpenses: Expense[];
  summary: ExpenseSummary;
  breakdown: CategoryBreakdownItem[];
  trend: MonthlyTrendItem[];
  insights: SpendingInsight;
};

export function ExpensesView({
  initialExpenses,
  summary,
  breakdown,
  trend,
  insights,
}: ExpensesViewProps) {
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterOption>("ALL");

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (expense: Expense) => {
    setDeletingExpense(expense);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedDateFilter("ALL");
  };

  const hasActiveFilters =
    search.trim() !== "" || selectedCategory !== "ALL" || selectedDateFilter !== "ALL";

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Start & End of this week
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return initialExpenses.filter((item) => {
      // 1. Search
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const descMatch = item.description?.toLowerCase().includes(query);
        const catMatch = item.category?.toLowerCase().includes(query);
        if (!descMatch && !catMatch) return false;
      }

      // 2. Category
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      // 3. Date Filter
      if (selectedDateFilter === "THIS_MONTH") {
        const d = new Date(item.expenseDate);
        if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) {
          return false;
        }
      } else if (selectedDateFilter === "THIS_WEEK") {
        const d = new Date(item.expenseDate);
        if (d < startOfWeek || d > endOfWeek) {
          return false;
        }
      }

      return true;
    });
  }, [initialExpenses, search, selectedCategory, selectedDateFilter]);

  return (
    <div className="space-y-7">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Expenses
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Keep track of your university and personal spending.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Spending */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Spending
            </p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <p className="text-[1.85rem] font-bold leading-none tracking-tight text-slate-900">
            {summary.totalSpendingString}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-slate-500">
            {summary.hasExpenses ? `Across ${summary.expenseCount} expenses` : "No expenses recorded"}
          </p>
        </div>

        {/* This Month */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/70 to-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
              This Month
            </p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <p className="text-[1.85rem] font-bold leading-none tracking-tight text-blue-700">
            {summary.thisMonthSpendingString}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-slate-500">
            Current calendar month
          </p>
        </div>

        {/* This Week */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 to-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
              This Week
            </p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <p className="text-[1.85rem] font-bold leading-none tracking-tight text-emerald-700">
            {summary.thisWeekSpendingString}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-slate-500">
            Monday to Sunday
          </p>
        </div>

        {/* Average Monthly */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
              Average Monthly
            </p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="text-[1.85rem] font-bold leading-none tracking-tight text-slate-900">
            {summary.averageMonthlySpendingString}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-slate-500">
            Active spending months
          </p>
        </div>
      </div>

      {/* ── Spending Insight Banner ─────────────────────────────────── */}
      {summary.hasExpenses && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/40 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-900">
                Spending Insight
              </p>
              <p className="text-[12px] text-slate-600">
                {insights.topCategory ? (
                  <>
                    Highest expense category:{" "}
                    <span className="font-semibold text-slate-800">
                      {insights.topCategory.label} ({insights.topCategory.amountString})
                    </span>
                    . {insights.insightText}
                  </>
                ) : (
                  insights.insightText
                )}
              </p>
            </div>
          </div>

          {insights.monthOverMonthPercentage !== null && (
            <div
              className={`inline-flex items-center gap-1 self-start sm:self-auto rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                insights.monthOverMonthTrend === "up"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : insights.monthOverMonthTrend === "down"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {insights.monthOverMonthTrend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {insights.monthOverMonthPercentage > 0 ? "+" : ""}
              {insights.monthOverMonthPercentage}% vs last month
            </div>
          )}
        </div>
      )}

      {/* ── Visual Analytics: Breakdown & Trend ─────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <CategoryBreakdown items={breakdown} />
        <MonthlyTrend trend={trend} />
      </div>

      {/* ── Filter Controls ─────────────────────────────────────────── */}
      <ExpenseFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDateFilter={selectedDateFilter}
        onDateFilterChange={setSelectedDateFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── Expenses List ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">
            Transactions ({filteredExpenses.length})
          </h2>
          {hasActiveFilters && (
            <span className="text-[12px] text-slate-500">
              Showing filtered results
            </span>
          )}
        </div>

        {initialExpenses.length === 0 ? (
          /* Empty state: No expenses logged yet */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-900">
              No expenses yet
            </h3>
            <p className="mt-1 max-w-sm text-[13px] text-slate-500">
              Start tracking your spending to understand where your money goes.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        ) : filteredExpenses.length === 0 ? (
          /* Empty state: Filter returned 0 */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center">
            <p className="text-[14px] font-medium text-slate-700">
              No expenses match your filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-3 text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* List of expense cards */
          <div className="space-y-2.5">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Dialog Modals ───────────────────────────────────────────── */}
      <ExpenseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        expense={editingExpense}
      />

      <DeleteExpenseDialog
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        expense={deletingExpense}
      />
    </div>
  );
}
