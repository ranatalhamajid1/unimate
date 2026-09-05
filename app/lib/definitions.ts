/**
 * Shared type definitions and validation schemas for auth forms.
 * Uses Zod for server-side validation (never runs on the client).
 */

export type FormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

// ---------------------------------------------------------------------------
// Inline validation helpers — avoids adding a Zod dependency for an MVP.
// Swap for Zod schemas when the project grows.
// ---------------------------------------------------------------------------

export type SignupFields = {
  name: string;
  email: string;
  password: string;
};

export type LoginFields = {
  email: string;
  password: string;
};

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: NonNullable<FormState>["errors"] };

export function validateSignup(
  formData: FormData
): ValidationResult<SignupFields> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const errors: NonNullable<FormState>["errors"] = {};

  if (name.length < 2) {
    errors.name = ["Name must be at least 2 characters long."];
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = ["Please enter a valid email address."];
  }

  if (password.length < 8) {
    errors.password = errors.password ?? [];
    errors.password.push("Password must be at least 8 characters long.");
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.password = errors.password ?? [];
    errors.password.push("Password must contain at least one letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.password = errors.password ?? [];
    errors.password.push("Password must contain at least one number.");
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { name, email, password } };
}

export function validateLogin(
  formData: FormData
): ValidationResult<LoginFields> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const errors: NonNullable<FormState>["errors"] = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = ["Please enter a valid email address."];
  }

  if (!password) {
    errors.password = ["Password is required."];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { email, password } };
}
