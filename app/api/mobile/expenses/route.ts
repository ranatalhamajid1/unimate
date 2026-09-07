import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import {
  getUserExpenses,
  getExpenseSummary,
  getCategoryBreakdown,
  createExpenseRecord,
} from "@/app/lib/expenses";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/app/lib/expense-definitions";

export async function GET(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const [expenses, summary, categories] = await Promise.all([
      getUserExpenses(session.userId),
      getExpenseSummary(session.userId),
      getCategoryBreakdown(session.userId),
    ]);

    return NextResponse.json({
      success: true,
      expenses,
      summary,
      categories,
    });
  } catch (error) {
    console.error("Error in GET /api/mobile/expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch expenses." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    const category = String(body.category ?? "").trim().toUpperCase();
    const description = String(body.description ?? "").trim();
    const expenseDateRaw = String(body.expenseDate ?? "").trim();

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive number." },
        { status: 400 }
      );
    }

    if (!EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
      return NextResponse.json(
        { success: false, error: `Category must be one of: ${EXPENSE_CATEGORIES.join(", ")}.` },
        { status: 400 }
      );
    }

    const expenseDate = expenseDateRaw ? new Date(expenseDateRaw) : new Date();
    if (isNaN(expenseDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid expense date." },
        { status: 400 }
      );
    }

    if (description.length > 200) {
      return NextResponse.json(
        { success: false, error: "Description cannot exceed 200 characters." },
        { status: 400 }
      );
    }

    const expense = await createExpenseRecord(session.userId, {
      amount,
      category: category as ExpenseCategory,
      description,
      expenseDate,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/mobile/expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create expense record." },
      { status: 500 }
    );
  }
}
