"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Expense, formatPKR, getCategoryLabel } from "@/app/lib/expense-definitions";
import { deleteExpense } from "@/app/actions/expenses";

type DeleteExpenseDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSuccess?: () => void;
};

export function DeleteExpenseDialog({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: DeleteExpenseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteExpense(expense.id);
      if (!result.success) {
        setError(result.message || "Failed to delete expense.");
      } else {
        onSuccess?.();
        onClose();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl transition-all">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h3 className="text-[17px] font-semibold text-[var(--color-text)]">
            Delete this expense?
          </h3>
          <p className="mt-1 text-[13px] text-[var(--color-text-3)]">
            This action cannot be undone.
          </p>

          <div className="mt-4 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--color-text-3)]">
                {getCategoryLabel(expense.category)}
              </span>
              <span className="text-[13px] font-bold text-[var(--color-text)]">
                {formatPKR(expense.amount)}
              </span>
            </div>
            {expense.description && (
              <p className="mt-1 text-[12px] text-[var(--color-text-2)] line-clamp-1">
                {expense.description}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-3 text-[12px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
          )}

          <div className="mt-6 flex w-full items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-1/2 rounded-xl border border-[var(--color-border)] py-2.5 text-[13px] font-medium text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-1/2 rounded-xl bg-rose-600 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
