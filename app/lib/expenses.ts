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

export const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // Asia/Karachi is UTC+05:00 (no DST)

/**
 * Returns date parts (year, 0-indexed month, day, dayOfWeek: 0=Sun..6=Sat) in Asia/Karachi (PKT).
 */
export function getPKTDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
} {
  const pktDate = new Date(date.getTime() + PKT_OFFSET_MS);
  return {
    year: pktDate.getUTCFullYear(),
    month: pktDate.getUTCMonth(),
    day: pktDate.getUTCDate(),
    dayOfWeek: pktDate.getUTCDay(),
  };
}

/**
 * Returns UTC boundaries (start and end Date) for "This Month" in Asia/Karachi.
 */
export function getPKTMonthBounds(now = new Date()): { start: Date; end: Date } {
  const parts = getPKTDateParts(now);
  const startUtcMs = Date.UTC(parts.year, parts.month, 1, 0, 0, 0, 0) - PKT_OFFSET_MS;
  const endUtcMs = Date.UTC(parts.year, parts.month + 1, 1, 0, 0, 0, 0) - PKT_OFFSET_MS - 1;
  return {
    start: new Date(startUtcMs),
    end: new Date(endUtcMs),
  };
}

/**
 * Returns UTC boundaries (start and end Date) for "This Week" (Monday to Sunday) in Asia/Karachi.
 */
export function getPKTWeekBounds(now = new Date()): { start: Date; end: Date } {
  const parts = getPKTDateParts(now);
  // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
  // Monday is start of week: diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const diffToMonday = parts.dayOfWeek === 0 ? -6 : 1 - parts.dayOfWeek;
  const mondayDay = parts.day + diffToMonday;

  const startUtcMs = Date.UTC(parts.year, parts.month, mondayDay, 0, 0, 0, 0) - PKT_OFFSET_MS;
  const endUtcMs = Date.UTC(parts.year, parts.month, mondayDay + 7, 0, 0, 0, 0) - PKT_OFFSET_MS - 1;
  return {
    start: new Date(startUtcMs),
    end: new Date(endUtcMs),
  };
}

/**
 * Calculate full expense summary metrics:
 * Total Spending, This Month, This Week, and Average Monthly Spending.
 * Date boundaries are strictly evaluated in Asia/Karachi (PKT).
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
    const currentPkt = getPKTDateParts(now);
    const weekBounds = getPKTWeekBounds(now);

    let totalDecimal = new Prisma.Decimal(0);
    let thisMonthDecimal = new Prisma.Decimal(0);
    let thisWeekDecimal = new Prisma.Decimal(0);
    const monthsSet = new Set<string>();

    for (const exp of allExpenses) {
      const amt = exp.amount;
      totalDecimal = totalDecimal.plus(amt);

      const d = new Date(exp.expenseDate);
      const expPkt = getPKTDateParts(d);
      monthsSet.add(`${expPkt.year}-${expPkt.month}`);

      if (expPkt.year === currentPkt.year && expPkt.month === currentPkt.month) {
        thisMonthDecimal = thisMonthDecimal.plus(amt);
      }

      if (d >= weekBounds.start && d <= weekBounds.end) {
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
    const currentPkt = getPKTDateParts(now);
    const months: { year: number; month: number; key: string; label: string }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Generate month slots from (monthsCount - 1) months ago up to current month in PKT
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetDate = new Date(Date.UTC(currentPkt.year, currentPkt.month - i, 1));
      const year = targetDate.getUTCFullYear();
      const month = targetDate.getUTCMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      const label = `${monthNames[month]} ${year}`;
      months.push({ year, month, key, label });
    }

    // oldestDate bound in UTC
    const oldestStartUtcMs = Date.UTC(months[0].year, months[0].month, 1, 0, 0, 0, 0) - PKT_OFFSET_MS;
    const oldestDate = new Date(oldestStartUtcMs);

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
      const expPkt = getPKTDateParts(d);
      const key = `${expPkt.year}-${String(expPkt.month + 1).padStart(2, "0")}`;
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
 * Evaluated using Asia/Karachi (PKT) calendar boundaries.
 */
export async function getSpendingInsights(userId: string): Promise<SpendingInsight> {
  try {
    const now = new Date();
    const curPkt = getPKTDateParts(now);

    const prevDate = new Date(Date.UTC(curPkt.year, curPkt.month - 1, 1));
    const prevYear = prevDate.getUTCFullYear();
    const prevMonth = prevDate.getUTCMonth();

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
      const expPkt = getPKTDateParts(d);

      // Top category tracking
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = new Prisma.Decimal(0);
      }
      categoryTotals[exp.category] = categoryTotals[exp.category].plus(exp.amount);

      if (expPkt.year === curPkt.year && expPkt.month === curPkt.month) {
        thisMonthTotal = thisMonthTotal.plus(exp.amount);
      } else if (expPkt.year === prevYear && expPkt.month === prevMonth) {
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
 * Update an existing expense record, verifying userId ownership atomically.
 */
export async function updateExpenseRecord(
  expenseId: string,
  userId: string,
  data: ExpenseFormValues
): Promise<Expense> {
  const amountDecimal = new Prisma.Decimal(data.amount.toFixed(2));

  const result = await prisma.expense.updateMany({
    where: { id: expenseId, userId },
    data: {
      amount: amountDecimal,
      category: data.category,
      description: data.description?.trim() || "",
      expenseDate: data.expenseDate,
    },
  });

  if (result.count === 0) {
    throw new Error("Expense record not found or unauthorized");
  }

  const updated = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  return {
    ...updated!,
    amount: Number(updated!.amount),
  };
}

/**
 * Delete an expense record, verifying userId ownership atomically.
 */
export async function deleteExpenseRecord(
  expenseId: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.expense.deleteMany({
    where: { id: expenseId, userId },
  });

  if (result.count === 0) {
    throw new Error("Expense record not found or unauthorized");
  }

  return true;
}
