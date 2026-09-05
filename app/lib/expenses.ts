import "server-only";

import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  Expense,
  ExpenseFormValues,
  ExpenseSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  SpendingInsight,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  getCategoryMetadata,
  formatPKR,
} from "@/app/lib/expense-definitions";

/**
 * Fetch all expenses for a user with optional filtering, ordered by date descending.
 */
export async function getUserExpenses(
  userId: string,
  filters?: {
    category?: string;
    search?: string;
  }
): Promise<Expense[]> {
  try {
    const whereClause: Prisma.ExpenseWhereInput = { userId };

    if (filters?.category && filters.category !== "ALL") {
      whereClause.category = filters.category;
    }

    if (filters?.search && filters.search.trim() !== "") {
      whereClause.OR = [
        { description: { contains: filters.search.trim(), mode: "insensitive" } },
        { category: { contains: filters.search.trim(), mode: "insensitive" } },
      ];
    }

    const records = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { expenseDate: "desc" },
    });

    return records.map((e) => ({
      ...e,
      amount: Number(e.amount),
    }));
  } catch (error) {
    console.error("Database error in getUserExpenses:", error);
    return [];
  }
}

/**
 * Fetch a single expense by ID and userId.
 */
export async function getExpenseById(
  expenseId: string,
  userId: string
): Promise<Expense | null> {
  try {
    const record = await prisma.expense.findFirst({
      where: { id: expenseId, userId },
    });

    if (!record) return null;

    return {
      ...record,
      amount: Number(record.amount),
    };
  } catch (error) {
    console.error("Database error in getExpenseById:", error);
    return null;
  }
}

/**
 * Fetch recent expenses for the dashboard or overview list.
 */
export async function getRecentExpenses(
  userId: string,
  limit = 5
): Promise<Expense[]> {
  try {
    const records = await prisma.expense.findMany({
      where: { userId },
      orderBy: { expenseDate: "desc" },
      take: limit,
    });

    return records.map((e) => ({
      ...e,
      amount: Number(e.amount),
    }));
  } catch (error) {
    console.error("Database error in getRecentExpenses:", error);
    return [];
  }
}

/**
 * Calculate full expense summary metrics:
 * Total Spending, This Month, This Week, and Average Monthly Spending.
 */
export async function getExpenseSummary(userId: string): Promise<ExpenseSummary> {
  try {
    const allExpenses = await prisma.expense.findMany({
      where: { userId },
      select: { amount: true, expenseDate: true },
    });

    if (allExpenses.length === 0) {
      return {
        totalSpending: 0,
        totalSpendingString: "—",
        thisMonthSpending: 0,
        thisMonthSpendingString: "—",
        thisWeekSpending: 0,
        thisWeekSpendingString: "—",
        averageMonthlySpending: null,
        averageMonthlySpendingString: "—",
        hasExpenses: false,
        expenseCount: 0,
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Calculate start and end of this week (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let totalDecimal = new Prisma.Decimal(0);
    let thisMonthDecimal = new Prisma.Decimal(0);
    let thisWeekDecimal = new Prisma.Decimal(0);
    const monthsSet = new Set<string>();

    for (const exp of allExpenses) {
      const amt = exp.amount;
      totalDecimal = totalDecimal.plus(amt);

      const d = new Date(exp.expenseDate);
      const y = d.getFullYear();
      const m = d.getMonth();
      monthsSet.add(`${y}-${m}`);

      if (y === currentYear && m === currentMonth) {
        thisMonthDecimal = thisMonthDecimal.plus(amt);
      }

      if (d >= startOfWeek && d <= endOfWeek) {
        thisWeekDecimal = thisWeekDecimal.plus(amt);
      }
    }

    const totalSpending = totalDecimal.toNumber();
    const thisMonthSpending = thisMonthDecimal.toNumber();
    const thisWeekSpending = thisWeekDecimal.toNumber();

    // Average monthly spending across months where user actually has expenses
    const activeMonthsCount = Math.max(1, monthsSet.size);
    const averageMonthlySpending = totalSpending / activeMonthsCount;

    return {
      totalSpending,
      totalSpendingString: formatPKR(totalSpending),
      thisMonthSpending,
      thisMonthSpendingString: formatPKR(thisMonthSpending),
      thisWeekSpending,
      thisWeekSpendingString: formatPKR(thisWeekSpending),
      averageMonthlySpending,
      averageMonthlySpendingString: formatPKR(averageMonthlySpending),
      hasExpenses: true,
      expenseCount: allExpenses.length,
    };
  } catch (error) {
    console.error("Database error in getExpenseSummary:", error);
    return {
      totalSpending: 0,
      totalSpendingString: "—",
      thisMonthSpending: 0,
      thisMonthSpendingString: "—",
      thisWeekSpending: 0,
      thisWeekSpendingString: "—",
      averageMonthlySpending: null,
      averageMonthlySpendingString: "—",
      hasExpenses: false,
      expenseCount: 0,
    };
  }
}

/**
 * Calculate category breakdown with totals, counts, and percentages.
 */
export async function getCategoryBreakdown(
  userId: string
): Promise<CategoryBreakdownItem[]> {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      select: { category: true, amount: true },
    });

    if (expenses.length === 0) return [];

    let total = new Prisma.Decimal(0);
    const categoryTotals: Record<string, { total: Prisma.Decimal; count: number }> = {};

    for (const exp of expenses) {
      total = total.plus(exp.amount);
      const cat = exp.category;
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: new Prisma.Decimal(0), count: 0 };
      }
      categoryTotals[cat].total = categoryTotals[cat].total.plus(exp.amount);
      categoryTotals[cat].count += 1;
    }

    const totalNum = total.toNumber();

    const items: CategoryBreakdownItem[] = Object.entries(categoryTotals).map(
      ([cat, data]) => {
        const amt = data.total.toNumber();
        const meta = getCategoryMetadata(cat);
        const percentage = totalNum > 0 ? Math.round((amt / totalNum) * 100) : 0;

        return {
          category: cat as ExpenseCategory,
          label: meta.label,
          amount: amt,
          amountString: formatPKR(amt),
          percentage,
          count: data.count,
          color: meta.barColor,
          dotColor: meta.dotColor,
          badgeClass: meta.badgeClass,
        };
      }
    );

    // Sort categories descending by amount
    return items.sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error("Database error in getCategoryBreakdown:", error);
    return [];
  }
}

/**
 * Calculate monthly spending trend for the last N months.
 */
export async function getMonthlySpendingTrend(
  userId: string,
  monthsCount = 6
): Promise<MonthlyTrendItem[]> {
  try {
    const now = new Date();
    const months: { year: number; month: number; key: string; label: string }[] = [];

    // Generate month slots from (monthsCount - 1) months ago up to current month
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      months.push({ year, month, key, label });
    }

    const oldestDate = new Date(months[0].year, months[0].month, 1);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        expenseDate: { gte: oldestDate },
      },
      select: { amount: true, expenseDate: true },
    });

    const totalsMap: Record<string, Prisma.Decimal> = {};
    for (const m of months) {
      totalsMap[m.key] = new Prisma.Decimal(0);
    }

    for (const exp of expenses) {
      const d = new Date(exp.expenseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (totalsMap[key]) {
        totalsMap[key] = totalsMap[key].plus(exp.amount);
      }
    }

    return months.map((m) => {
      const amt = totalsMap[m.key]?.toNumber() || 0;
      return {
        monthKey: m.key,
        label: m.label,
        amount: amt,
        amountString: formatPKR(amt),
      };
    });
  } catch (error) {
    console.error("Database error in getMonthlySpendingTrend:", error);
    return [];
  }
}

/**
 * Calculate spending insights (top category and month-over-month comparison).
 */
export async function getSpendingInsights(userId: string): Promise<SpendingInsight> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const expenses = await prisma.expense.findMany({
      where: { userId },
      select: { amount: true, category: true, expenseDate: true },
    });

    if (expenses.length === 0) {
      return {
        topCategory: null,
        monthOverMonthPercentage: null,
        monthOverMonthTrend: null,
        insightText: "Start tracking expenses to see personalized spending insights.",
      };
    }

    let thisMonthTotal = new Prisma.Decimal(0);
    let prevMonthTotal = new Prisma.Decimal(0);
    const categoryTotals: Record<string, Prisma.Decimal> = {};

    for (const exp of expenses) {
      const d = new Date(exp.expenseDate);
      const y = d.getFullYear();
      const m = d.getMonth();

      // Top category tracking
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = new Prisma.Decimal(0);
      }
      categoryTotals[exp.category] = categoryTotals[exp.category].plus(exp.amount);

      if (y === currentYear && m === currentMonth) {
        thisMonthTotal = thisMonthTotal.plus(exp.amount);
      } else if (y === prevYear && m === prevMonth) {
        prevMonthTotal = prevMonthTotal.plus(exp.amount);
      }
    }

    // Determine top category
    let topCat: string | null = null;
    let topAmount = new Prisma.Decimal(0);

    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt.greaterThan(topAmount)) {
        topAmount = amt;
        topCat = cat;
      }
    }

    const topCategory = topCat
      ? {
          category: topCat,
          label: getCategoryMetadata(topCat).label,
          amount: topAmount.toNumber(),
          amountString: formatPKR(topAmount.toNumber()),
        }
      : null;

    // Month-over-month comparison
    const curVal = thisMonthTotal.toNumber();
    const prevVal = prevMonthTotal.toNumber();

    if (prevVal === 0) {
      return {
        topCategory,
        monthOverMonthPercentage: null,
        monthOverMonthTrend: null,
        insightText: "Not enough history for comparison.",
      };
    }

    const diffPct = Math.round(((curVal - prevVal) / prevVal) * 100);
    const trend: "up" | "down" | "neutral" =
      diffPct > 0 ? "up" : diffPct < 0 ? "down" : "neutral";

    const sign = diffPct > 0 ? "+" : "";
    const insightText = `${sign}${diffPct}% compared with previous month.`;

    return {
      topCategory,
      monthOverMonthPercentage: diffPct,
      monthOverMonthTrend: trend,
      insightText,
    };
  } catch (error) {
    console.error("Database error in getSpendingInsights:", error);
    return {
      topCategory: null,
      monthOverMonthPercentage: null,
      monthOverMonthTrend: null,
      insightText: "Not enough history for comparison.",
    };
  }
}

/**
 * Create a new expense record in PostgreSQL.
 */
export async function createExpenseRecord(
  userId: string,
  data: ExpenseFormValues
): Promise<Expense> {
  const amountDecimal = new Prisma.Decimal(data.amount.toFixed(2));

  const record = await prisma.expense.create({
    data: {
      userId,
      amount: amountDecimal,
      category: data.category,
      description: data.description?.trim() || "",
      expenseDate: data.expenseDate,
    },
  });

  return {
    ...record,
    amount: Number(record.amount),
  };
}

/**
 * Update an existing expense record, verifying userId ownership.
 */
export async function updateExpenseRecord(
  expenseId: string,
  userId: string,
  data: ExpenseFormValues
): Promise<Expense> {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!existing) {
    throw new Error("Expense record not found or unauthorized");
  }

  const amountDecimal = new Prisma.Decimal(data.amount.toFixed(2));

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      amount: amountDecimal,
      category: data.category,
      description: data.description?.trim() || "",
      expenseDate: data.expenseDate,
    },
  });

  return {
    ...updated,
    amount: Number(updated.amount),
  };
}

/**
 * Delete an expense record, verifying userId ownership.
 */
export async function deleteExpenseRecord(
  expenseId: string,
  userId: string
): Promise<boolean> {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!existing) {
    throw new Error("Expense record not found or unauthorized");
  }

  await prisma.expense.delete({
    where: { id: expenseId },
  });

  return true;
}
