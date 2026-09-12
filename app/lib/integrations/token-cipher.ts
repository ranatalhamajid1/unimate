import "server-only";

import crypto from "crypto";

/**
 * Milestone 14: Versioned Token Cipher (AES-256-GCM)
 *
 * Enforces authenticated encryption at rest for external OAuth credentials,
 * refresh tokens, and PKCE verifiers.
 * Format: `v<version>:<iv_b64>:<authTag_b64>:<ciphertext_b64>`
 *
 * Supports zero-downtime key rotation via version prefix inspection.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128-bit authentication tag

// Derives a deterministic 32-byte key from an input secret or falls back safely in test/dev
function deriveKey(secretEnvName: string, fallbackSalt: string): Buffer {
  const secret = process.env[secretEnvName] || process.env.SESSION_SECRET || "default_test_integration_secret_key_32_bytes!!";
  // Always derive a strict 32-byte key using SHA-256
  return crypto.createHash("sha256").update(`${secret}:${fallbackSalt}`).digest();
}

// Key registry supporting key rotation
const KEY_REGISTRY: Record<string, Buffer> = {
  v1: deriveKey("INTEGRATION_ENCRYPTION_SECRET_V1", "unimate-integration-v1"),
  v2: deriveKey("INTEGRATION_ENCRYPTION_SECRET_V2", "unimate-integration-v2"),
};

export const CURRENT_CIPHER_VERSION = "v1";

/**
 * Encrypts a sensitive string (token, secret, PKCE verifier) using AES-256-GCM.
 * Never logs plaintext.
 */
export function encryptToken(
  plaintext: string,
  version: "v1" | "v2" = CURRENT_CIPHER_VERSION
): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty token");
  }

  const key = KEY_REGISTRY[version];
  if (!key) {
    throw new Error(`Unsupported encryption key version: ${version}`);
  }

  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${version}:${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/**
 * Decrypts a versioned AES-256-GCM ciphertext.
 * Inspects version prefix and verifies the GCM authentication tag.
 * Tampered ciphertext or wrong tags throw an Error.
 */
export function decryptToken(versionedCiphertext: string): string {
  if (!versionedCiphertext) {
    throw new Error("Cannot decrypt empty ciphertext");
  }

  const parts = versionedCiphertext.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed versioned ciphertext format. Expected v<num>:<iv>:<tag>:<ciphertext>");
  }

  const [version, ivB64, tagB64, ctB64] = parts;
  const key = KEY_REGISTRY[version];
  if (!key) {
    throw new Error(`Unknown encryption key version: ${version}`);
  }

  try {
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const ciphertext = Buffer.from(ctB64, "base64");

    if (iv.length !== IV_LENGTH_BYTES) {
      throw new Error("Invalid IV length");
    }
    if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new Error("Invalid authentication tag length");
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err: any) {
    throw new Error(`Decryption failed: Token may be tampered, corrupted, or encrypted with an invalid key (${err.message})`);
  }
}
