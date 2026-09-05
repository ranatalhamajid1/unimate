"use client";

import {
  GraduationCap,
  BookOpen,
  Car,
  Utensils,
  Home,
  FileText,
  HeartPulse,
  Film,
  Tag,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  Expense,
  formatPKR,
  getCategoryMetadata,
} from "@/app/lib/expense-definitions";

type ExpenseCardProps = {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "GraduationCap":
      return <GraduationCap className={className} />;
    case "BookOpen":
      return <BookOpen className={className} />;
    case "Car":
      return <Car className={className} />;
    case "Utensils":
      return <Utensils className={className} />;
    case "Home":
      return <Home className={className} />;
    case "FileText":
      return <FileText className={className} />;
    case "HeartPulse":
      return <HeartPulse className={className} />;
    case "Film":
      return <Film className={className} />;
    default:
      return <Tag className={className} />;
  }
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const meta = getCategoryMetadata(expense.category);

  const formattedDate = new Date(expense.expenseDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition-all duration-200 hover:border-slate-300 hover:shadow-sm sm:p-5">
      {/* Left info */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Category Icon */}
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: `${meta.barColor}15`, color: meta.barColor }}
        >
          <CategoryIcon name={meta.iconName} className="h-5 w-5" />
        </div>

        {/* Text info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${meta.badgeClass}`}
            >
              {meta.label}
            </span>
            <span className="text-[12px] text-slate-400">{formattedDate}</span>
          </div>
          <p className="mt-1 text-[14px] font-medium text-slate-800 truncate">
            {expense.description || "No description"}
          </p>
        </div>
      </div>

      {/* Right info & actions */}
      <div className="flex items-center gap-4 flex-shrink-0 ml-3">
        <p className="text-[16px] font-bold text-slate-900 tracking-tight sm:text-[17px]">
          {formatPKR(expense.amount)}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(expense)}
            title="Edit expense"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(expense)}
            title="Delete expense"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
