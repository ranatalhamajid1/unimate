import "server-only";

import { prisma } from "@/app/lib/prisma";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------
// Database User Persistence Layer (PostgreSQL via Prisma)
// ---------------------------------------------------------------------------

/**
 * Find a user by their unique email address.
 * Normalizes email to lowercase.
 */
export async function findUserByEmail(
  email: string
): Promise<StoredUser | null> {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

/**
 * Find a user by their unique ID (cuid).
 */
export async function findUserById(id: string): Promise<StoredUser | null> {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

/**
 * Create a new user in PostgreSQL.
 * Passwords must already be hashed with bcryptjs before calling this function.
 */
export async function createUser(
  name: string,
  email: string,
  passwordHash: string
): Promise<StoredUser> {
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    },
  });

  return user;
}
