import "server-only";

import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";
import { encryptToken, decryptToken } from "./token-cipher";
import { IntegrationProvider, OAuthClientType } from "@prisma/client";

/**
 * Milestone 14: Server-Side OAuth Transaction Manager
 *
 * Provides cryptographic state nonce generation, PKCE verifier encryption at rest,
 * and atomic single-use state consumption to prevent replay attacks and CSRF.
 */

export const OAUTH_TRANSACTION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type CreateOAuthTransactionParams = {
  userId: string;
  provider: IntegrationProvider;
  clientType: OAuthClientType;
  codeVerifier?: string;
  ttlMs?: number;
};

export type ConsumedOAuthTransaction = {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  clientType: OAuthClientType;
  state: string;
  codeVerifier: string | null;
  expiresAt: Date;
  consumedAt: Date;
  createdAt: Date;
};

export type ConsumeOAuthResult =
  | { success: true; transaction: ConsumedOAuthTransaction }
  | { success: false; error: "NOT_FOUND" | "ALREADY_CONSUMED" | "EXPIRED" };

/**
 * Creates a server-side OAuth transaction with high-entropy state nonce
 * and encrypted PKCE verifier.
 */
export async function createOAuthTransaction(
  params: CreateOAuthTransactionParams
): Promise<{ state: string; expiresAt: Date }> {
  // Generate 32 bytes (256 bits) cryptographically random state hex
  const state = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (params.ttlMs ?? OAUTH_TRANSACTION_TTL_MS));

  // Encrypt PKCE verifier if present
  const encryptedCodeVerifier = params.codeVerifier
    ? encryptToken(params.codeVerifier)
    : null;

  await prisma.oAuthTransaction.create({
    data: {
      userId: params.userId,
      provider: params.provider,
      clientType: params.clientType,
      state,
      codeVerifier: encryptedCodeVerifier,
      expiresAt,
      consumedAt: null,
    },
  });

  return { state, expiresAt };
}

/**
 * Atomically consumes an OAuth transaction by state.
 * If the transaction does not exist, is expired, or was already consumed,
 * the atomic update matches 0 rows and returns a specific failure code.
 */
export async function consumeOAuthTransaction(
  state: string
): Promise<ConsumeOAuthResult> {
  if (!state || typeof state !== "string") {
    return { success: false, error: "NOT_FOUND" };
  }

  const now = new Date();

  // 1. Atomic consumption query
  const updateResult = await prisma.oAuthTransaction.updateMany({
    where: {
      state,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      consumedAt: now,
    },
  });

  // 2. If no rows updated, investigate failure cause
  if (updateResult.count === 0) {
    const existing = await prisma.oAuthTransaction.findUnique({
      where: { state },
    });

    if (!existing) {
      return { success: false, error: "NOT_FOUND" };
    }
    if (existing.consumedAt !== null) {
      return { success: false, error: "ALREADY_CONSUMED" };
    }
    if (existing.expiresAt <= now) {
      return { success: false, error: "EXPIRED" };
    }
    return { success: false, error: "NOT_FOUND" };
  }

  // 3. Fetch consumed transaction and decrypt PKCE verifier
  const transaction = await prisma.oAuthTransaction.findUnique({
    where: { state },
  });

  if (!transaction || !transaction.consumedAt) {
    return { success: false, error: "NOT_FOUND" };
  }

  const decryptedVerifier = transaction.codeVerifier
    ? decryptToken(transaction.codeVerifier)
    : null;

  return {
    success: true,
    transaction: {
      id: transaction.id,
      userId: transaction.userId,
      provider: transaction.provider,
      clientType: transaction.clientType,
      state: transaction.state,
      codeVerifier: decryptedVerifier,
      expiresAt: transaction.expiresAt,
      consumedAt: transaction.consumedAt,
      createdAt: transaction.createdAt,
    },
  };
}
