"use server";

/**
 * Authentication Server Actions.
 *
 * signup — validate → hash → store user (Postgres/Prisma) → create session → redirect /dashboard
 * login  — validate → find user (Postgres/Prisma) → compare hash → create session → redirect /dashboard
 * logout — delete session → redirect /
 *
 * Security notes:
 *  - Login always returns a generic "Invalid email or password" error to avoid
 *    user enumeration (never reveals whether an email exists).
 *  - Passwords are never stored in plaintext — bcryptjs hashes with salt=12.
 *  - redirect() is called AFTER all awaited operations to avoid swallowing errors.
 */

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import {
  FormState,
  validateSignup,
  validateLogin,
} from "@/app/lib/definitions";
import { findUserByEmail, createUser } from "@/app/lib/users";
import { createSession, deleteSession } from "@/app/lib/session";

// ---------------------------------------------------------------------------
// signup
// ---------------------------------------------------------------------------

export async function signup(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate inputs
  const validated = validateSignup(formData);
  if (!validated.success) {
    return { errors: validated.errors };
  }

  const { name, email, password } = validated.data;

  // 2. Check for duplicate email
  let existing;
  try {
    existing = await findUserByEmail(email);
  } catch (error) {
    console.error("Database error during signup check:", error);
    return { message: "Database connection error. Please verify PostgreSQL is running." };
  }

  if (existing) {
    return {
      errors: {
        email: ["An account with this email already exists."],
      },
    };
  }

  // 3. Hash password (salt rounds = 12)
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Persist user via Prisma
  let user;
  try {
    user = await createUser(name, email, hashedPassword);
  } catch (error) {
    console.error("Database error during user creation:", error);
    return { message: "Failed to create account. Please verify database connection." };
  }

  // 5. Create session
  await createSession(user.id, user.name, user.email);

  // 6. Redirect (throws internally — must be outside try/catch)
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

export async function login(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate inputs
  const validated = validateLogin(formData);
  if (!validated.success) {
    return { errors: validated.errors };
  }

  const { email, password } = validated.data;

  // 2. Find user — use generic error to avoid user enumeration
  let user;
  try {
    user = await findUserByEmail(email);
  } catch (error) {
    console.error("Database error during login:", error);
    return { message: "Database connection error. Please verify PostgreSQL is running." };
  }

  if (!user) {
    return { message: "Invalid email or password." };
  }

  // 3. Compare password
  const passwordMatch = await bcrypt.compare(
    password,
    user.passwordHash || user.hashedPassword || ""
  );
  if (!passwordMatch) {
    return { message: "Invalid email or password." };
  }

  // 4. Create session
  await createSession(user.id, user.name, user.email);

  // 5. Redirect
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
