"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import {
  createExpenseRecord,
  updateExpenseRecord,
  deleteExpenseRecord,
} from "@/app/lib/expenses";
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  ExpenseFormValues,
} from "@/app/lib/expense-definitions";

export type ExpenseActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function validateExpenseInput(data: {
  amount: number | string;
  category: string;
  description?: string;
  expenseDate: string | Date;
}): {
  isValid: boolean;
  validatedData?: ExpenseFormValues;
  errors: Record<string, string[]>;
} {
  const errors: Record<string, string[]> = {};

  // 1. Amount validation
  const numAmount = typeof data.amount === "string" ? parseFloat(data.amount) : Number(data.amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    errors.amount = ["Amount must be greater than 0."];
  } else if (numAmount > 99999999.99) {
    errors.amount = ["Amount exceeds the maximum limit (Rs 99,999,999.99)."];
  }

  // Check decimal precision (at most 2 decimal places)
  if (!isNaN(numAmount)) {
    const parts = numAmount.toString().split(".");
    if (parts.length > 1 && parts[1].length > 2) {
      errors.amount = ["Amount cannot have more than 2 decimal places."];
    }
  }

  // 2. Category validation
  const upperCategory = data.category?.trim().toUpperCase() as ExpenseCategory;
  if (!EXPENSE_CATEGORIES.includes(upperCategory)) {
    errors.category = [`Category must be one of: ${EXPENSE_CATEGORIES.join(", ")}`];
  }

  // 3. Description validation
  const description = data.description?.trim() || "";
  if (description.length > 200) {
    errors.description = ["Description cannot exceed 200 characters."];
  }

  // 4. Date validation
  const parsedDate = new Date(data.expenseDate);
  if (isNaN(parsedDate.getTime())) {
    errors.expenseDate = ["Please provide a valid date."];
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    validatedData: {
      amount: Math.round(numAmount * 100) / 100,
      category: upperCategory,
      description,
      expenseDate: parsedDate,
    },
    errors: {},
  };
}

/**
 * Server Action: Create a new expense.
 * Scoped strictly to session.userId.
 */
export async function createExpense(data: {
  amount: number | string;
  category: string;
  description?: string;
  expenseDate: string | Date;
}): Promise<ExpenseActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const { isValid, validatedData, errors } = validateExpenseInput(data);
    if (!isValid || !validatedData) {
      return { success: false, errors };
    }

    await createExpenseRecord(session.userId, validatedData);

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");

    return { success: true, message: "Expense logged successfully." };
  } catch (error) {
    console.error("Error creating expense:", error);
    return {
      success: false,
      message: "An unexpected error occurred while saving the expense.",
    };
  }
}

/**
 * Server Action: Update an existing expense.
 * Validates ownership using session.userId.
 */
export async function updateExpense(
  expenseId: string,
  data: {
    amount: number | string;
    category: string;
    description?: string;
    expenseDate: string | Date;
  }
): Promise<ExpenseActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!expenseId || typeof expenseId !== "string" || expenseId.trim() === "") {
      return { success: false, message: "Invalid expense ID." };
    }

    const { isValid, validatedData, errors } = validateExpenseInput(data);
    if (!isValid || !validatedData) {
      return { success: false, errors };
    }

    await updateExpenseRecord(expenseId, session.userId, validatedData);

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");

    return { success: true, message: "Expense updated successfully." };
  } catch (error) {
    console.error("Error updating expense:", error);
    return {
      success: false,
      message: "An unexpected error occurred while updating the expense.",
    };
  }
}

/**
 * Server Action: Delete an expense record.
 * Scoped by expenseId and session.userId.
 */
export async function deleteExpense(expenseId: string): Promise<ExpenseActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!expenseId || typeof expenseId !== "string" || expenseId.trim() === "") {
      return { success: false, message: "Invalid expense ID." };
    }

    await deleteExpenseRecord(expenseId, session.userId);

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");

    return { success: true, message: "Expense deleted successfully." };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return {
      success: false,
      message: "Failed to delete expense record.",
    };
  }
}
