import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "@/app/lib/users";
import { generateMobileToken } from "@/app/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const errors: Record<string, string[]> = {};

    if (name.length < 2) {
      errors.name = ["Name must be at least 2 characters long."];
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = ["Please enter a valid email address."];
    }

    const passwordErrors: string[] = [];
    if (password.length < 8) {
      passwordErrors.push("Password must be at least 8 characters long.");
    }
    if (!/[a-zA-Z]/.test(password)) {
      passwordErrors.push("Password must contain at least one letter.");
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push("Password must contain at least one number.");
    }
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors;
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed.",
          errors,
        },
        { status: 400 }
      );
    }

    // Check for duplicate user
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
          errors: {
            email: ["An account with this email already exists."],
          },
        },
        { status: 409 }
      );
    }

    // Hash password with salt rounds = 12
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in PostgreSQL
    const user = await createUser(name, email, hashedPassword);

    // Issue mobile Bearer token
    const token = await generateMobileToken({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in mobile signup API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }
}
