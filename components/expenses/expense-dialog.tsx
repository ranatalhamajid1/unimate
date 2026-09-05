"use client";

import { useState, useEffect } from "react";
import { X, Receipt, Calendar, DollarSign, Tag, FileText } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  Expense,
  getCategoryLabel,
} from "@/app/lib/expense-definitions";
import { createExpense, updateExpense } from "@/app/actions/expenses";

type ExpenseDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  onSuccess?: () => void;
};

export function ExpenseDialog({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: ExpenseDialogProps) {
  const isEditing = !!expense;

  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD");
  const [description, setDescription] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setAmount(expense.amount.toString());
        setCategory((expense.category as ExpenseCategory) || "FOOD");
        setDescription(expense.description || "");
        const d = new Date(expense.expenseDate);
        setExpenseDate(d.toISOString().split("T")[0]);
      } else {
        setAmount("");
        setCategory("FOOD");
        setDescription("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
      }
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, expense]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        amount,
        category,
        description,
        expenseDate,
      };

      const result = isEditing
        ? await updateExpense(expense.id, payload)
        : await createExpense(payload);

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(result.errors);
        } else {
          setError(result.message || "Failed to save expense.");
        }
      } else {
        onSuccess?.();
        onClose();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="h-4 w-4" />
            </span>
            <h2 className="text-[17px] font-semibold text-slate-900">
              {isEditing ? "Edit Expense" : "Add Expense"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-[13px] text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Amount (PKR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-slate-400">
                Rs
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-[14px] font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
            {fieldErrors.amount && (
              <p className="mt-1 text-[12px] text-rose-600">{fieldErrors.amount[0]}</p>
            )}
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.category && (
              <p className="mt-1 text-[12px] text-rose-600">{fieldErrors.category[0]}</p>
            )}
          </div>

          {/* Date input */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
            {fieldErrors.expenseDate && (
              <p className="mt-1 text-[12px] text-rose-600">{fieldErrors.expenseDate[0]}</p>
            )}
          </div>

          {/* Description input */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              maxLength={200}
              placeholder="e.g. Lunch at cafeteria, semester textbooks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-[12px] text-rose-600">{fieldErrors.description[0]}</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Expense"
                : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
