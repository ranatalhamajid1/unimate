/**
 * Centralized Expense Categories, Currency Formatting, and Type Definitions.
 */

// ---------------------------------------------------------------------------
// Expense Categories
// ---------------------------------------------------------------------------

export const EXPENSE_CATEGORIES = [
  "TUITION",
  "BOOKS",
  "TRANSPORT",
  "FOOD",
  "HOSTEL",
  "STATIONERY",
  "HEALTH",
  "ENTERTAINMENT",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type CategoryMetadata = {
  value: ExpenseCategory;
  label: string;
  iconName: string;
  badgeClass: string;
  barColor: string;
  dotColor: string;
};

export const CATEGORY_CONFIG: Record<ExpenseCategory, CategoryMetadata> = {
  TUITION: {
    value: "TUITION",
    label: "Tuition & Fees",
    iconName: "GraduationCap",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60",
    barColor: "#2563eb",
    dotColor: "bg-blue-600",
  },
  BOOKS: {
    value: "BOOKS",
    label: "Books & Study Material",
    iconName: "BookOpen",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60",
    barColor: "#d97706",
    dotColor: "bg-amber-600",
  },
  TRANSPORT: {
    value: "TRANSPORT",
    label: "Transport & Travel",
    iconName: "Car",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    barColor: "#059669",
    dotColor: "bg-emerald-600",
  },
  FOOD: {
    value: "FOOD",
    label: "Food & Dining",
    iconName: "Utensils",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200/60",
    barColor: "#ea580c",
    dotColor: "bg-orange-600",
  },
  HOSTEL: {
    value: "HOSTEL",
    label: "Hostel & Housing",
    iconName: "Home",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    barColor: "#4f46e5",
    dotColor: "bg-indigo-600",
  },
  STATIONERY: {
    value: "STATIONERY",
    label: "Stationery & Supplies",
    iconName: "FileText",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200/60",
    barColor: "#0d9488",
    dotColor: "bg-teal-600",
  },
  HEALTH: {
    value: "HEALTH",
    label: "Health & Medical",
    iconName: "HeartPulse",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/60",
    barColor: "#e11d48",
    dotColor: "bg-rose-600",
  },
  ENTERTAINMENT: {
    value: "ENTERTAINMENT",
    label: "Entertainment & Leisure",
    iconName: "Film",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/60",
    barColor: "#9333ea",
    dotColor: "bg-purple-600",
  },
  OTHER: {
    value: "OTHER",
    label: "Other Expenses",
    iconName: "Tag",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200/60",
    barColor: "#64748b",
    dotColor: "bg-slate-500",
  },
};

export function getCategoryMetadata(category: string): CategoryMetadata {
  const upper = category?.toUpperCase() as ExpenseCategory;
  return (
    CATEGORY_CONFIG[upper] || {
      value: "OTHER",
      label: category || "Other",
      iconName: "Tag",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200/60",
      barColor: "#64748b",
      dotColor: "bg-slate-500",
    }
  );
}

export function getCategoryLabel(category: string): string {
  return getCategoryMetadata(category).label;
}

// ---------------------------------------------------------------------------
// Currency Formatting (PKR / Rs)
// ---------------------------------------------------------------------------

/**
 * Formats a monetary amount to PKR format, e.g. "Rs 1,500" or "Rs 12,500.50".
 * Uses comma grouping and clean decimal display.
 */
export function formatPKR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "Rs 0";
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "Rs 0";

  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${formatted}`;
}

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type Expense = {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseFormValues = {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  expenseDate: Date;
};

export type ExpenseSummary = {
  totalSpending: number;
  totalSpendingString: string;
  thisMonthSpending: number;
  thisMonthSpendingString: string;
  thisWeekSpending: number;
  thisWeekSpendingString: string;
  averageMonthlySpending: number | null;
  averageMonthlySpendingString: string;
  hasExpenses: boolean;
  expenseCount: number;
};

export type CategoryBreakdownItem = {
  category: ExpenseCategory;
  label: string;
  amount: number;
  amountString: string;
  percentage: number;
  count: number;
  color: string;
  dotColor: string;
  badgeClass: string;
};

export type MonthlyTrendItem = {
  monthKey: string; // "2026-09"
  label: string;    // "Sep 2026"
  amount: number;
  amountString: string;
};

export type SpendingInsight = {
  topCategory: {
    category: string;
    label: string;
    amount: number;
    amountString: string;
  } | null;
  monthOverMonthPercentage: number | null;
  monthOverMonthTrend: "up" | "down" | "neutral" | null;
  insightText: string;
};
