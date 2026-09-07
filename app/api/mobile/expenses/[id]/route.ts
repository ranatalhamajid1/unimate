import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { updateExpenseRecord, deleteExpenseRecord } from "@/app/lib/expenses";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/app/lib/expense-definitions";
import { prisma } from "@/app/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Expense ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Expense not found or unauthorized." },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const amount = Number(body.amount ?? Number(existing.amount));
    const category = String(body.category ?? existing.category).trim().toUpperCase();
    const description = String(body.description ?? existing.description).trim();
    const expenseDate = body.expenseDate ? new Date(body.expenseDate) : existing.expenseDate;

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

    const updated = await updateExpenseRecord(id, session.userId, {
      amount,
      category: category as ExpenseCategory,
      description,
      expenseDate,
    });

    return NextResponse.json({ success: true, expense: updated });
  } catch (error) {
    console.error("Error in PUT /api/mobile/expenses/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update expense." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Expense ID is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Expense not found or unauthorized." },
        { status: 404 }
      );
    }

    await deleteExpenseRecord(id, session.userId);
    return NextResponse.json({ success: true, message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/mobile/expenses/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete expense." },
      { status: 500 }
    );
  }
}
