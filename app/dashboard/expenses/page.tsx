import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import {
  getUserExpenses,
  getExpenseSummary,
  getCategoryBreakdown,
  getMonthlySpendingTrend,
  getSpendingInsights,
} from "@/app/lib/expenses";
import { ExpensesView } from "@/components/expenses/expenses-view";

export const metadata: Metadata = {
  title: "Expenses & Personal Finance | UniMate",
  description: "Keep track of your university and personal spending with clean category breakdowns and insights.",
};

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [expenses, summary, breakdown, trend, insights] = await Promise.all([
    getUserExpenses(session.userId),
    getExpenseSummary(session.userId),
    getCategoryBreakdown(session.userId),
    getMonthlySpendingTrend(session.userId, 6),
    getSpendingInsights(session.userId),
  ]);

  return (
    <ExpensesView
      initialExpenses={expenses}
      summary={summary}
      breakdown={breakdown}
      trend={trend}
      insights={insights}
    />
  );
}
