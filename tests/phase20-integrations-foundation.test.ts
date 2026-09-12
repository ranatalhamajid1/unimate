import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import "./setup-prisma";
import { mockState, resetMockState, mockPrisma } from "./setup-prisma";
const prisma = mockPrisma as any;
import {
  encryptToken,
  decryptToken,
  CURRENT_CIPHER_VERSION,
} from "../app/lib/integrations/token-cipher";
import {
  createOAuthTransaction,
  consumeOAuthTransaction,
  OAUTH_TRANSACTION_TTL_MS,
} from "../app/lib/integrations/oauth-transaction";
import {
  NOTIFICATION_TYPES,
  getIntegrationNotificationKey,
  getTypeConfig,
} from "../app/lib/notification-definitions";

describe("Milestone 14 Phase 14.1 — Student Integrations Platform Foundation", () => {
  beforeEach(() => {
    resetMockState();
  });

  describe("1. Versioned Token Cipher (AES-256-GCM)", () => {
    it("encrypts and decrypts a token successfully with version prefix", () => {
      const secretToken = "ya29.a0AfH6SMD_test_google_oauth_refresh_token_12345";
      const encrypted = encryptToken(secretToken);

      assert.ok(encrypted.startsWith("v1:"), "Ciphertext must be prefixed with version v1:");
      const parts = encrypted.split(":");
      assert.equal(parts.length, 4, "Ciphertext must have 4 segments: v1:iv:tag:ciphertext");

      const decrypted = decryptToken(encrypted);
      assert.equal(decrypted, secretToken, "Decrypted token must exactly match original token");
    });

    it("rejects encrypting empty or null tokens", () => {
      assert.throws(() => encryptToken(""), /Cannot encrypt empty token/);
    });

    it("rejects decrypting malformed ciphertext format", () => {
      assert.throws(
        () => decryptToken("not-a-valid-ciphertext"),
        /Malformed versioned ciphertext format/
      );
      assert.throws(
        () => decryptToken("v1:only_two:parts"),
        /Malformed versioned ciphertext format/
      );
    });

    it("detects ciphertext tampering and fails GCM authentication", () => {
      const secretToken = "sensitive_access_token_abc";
      const encrypted = encryptToken(secretToken);
      const parts = encrypted.split(":");

      // Tamper with the ciphertext segment (last part)
      const tamperedCt = Buffer.from(parts[3], "base64");
      tamperedCt[0] ^= 0xff; // Flip bits
      parts[3] = tamperedCt.toString("base64");

      const tamperedPayload = parts.join(":");
      assert.throws(
        () => decryptToken(tamperedPayload),
        /Decryption failed: Token may be tampered/
      );
    });

    it("detects authentication tag tampering and fails decryption", () => {
      const secretToken = "sensitive_access_token_xyz";
      const encrypted = encryptToken(secretToken);
      const parts = encrypted.split(":");

      // Tamper with the auth tag segment (index 2)
      const tamperedTag = Buffer.from(parts[2], "base64");
      tamperedTag[0] ^= 0xff;
      parts[2] = tamperedTag.toString("base64");

      const tamperedPayload = parts.join(":");
      assert.throws(
        () => decryptToken(tamperedPayload),
        /Decryption failed: Token may be tampered/
      );
    });

    it("rejects unsupported key versions gracefully", () => {
      assert.throws(
        () => decryptToken("v99:invalid:invalid:invalid"),
        /Unknown encryption key version: v99/
      );
    });
  });

  describe("2. Server-Side OAuth Transaction & Replay Protection", () => {
    it("creates an OAuth transaction with high-entropy state and encrypted PKCE verifier", async () => {
      const { state, expiresAt } = await createOAuthTransaction({
        userId: "user-101",
        provider: "GOOGLE_CALENDAR",
        clientType: "WEB",
        codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      });

      assert.ok(state.length >= 64, "State nonce must be at least 64 hex characters (256-bit entropy)");
      assert.ok(expiresAt.getTime() > Date.now(), "Transaction must expire in the future");

      // Verify that codeVerifier is encrypted at rest in the database
      const record = mockState.oauthTransactions.find((tx: any) => tx.state === state);
      assert.ok(record, "Transaction must be stored in database");
      assert.ok(record.codeVerifier.startsWith("v1:"), "PKCE codeVerifier must be encrypted at rest");
      assert.notEqual(record.codeVerifier, "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk", "Plaintext PKCE verifier must never be stored in database");
    });

    it("atomically consumes an OAuth transaction and decrypts the PKCE verifier", async () => {
      const rawVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const { state } = await createOAuthTransaction({
        userId: "user-102",
        provider: "GOOGLE_CALENDAR",
        clientType: "MOBILE",
        codeVerifier: rawVerifier,
      });

      const result = await consumeOAuthTransaction(state);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.transaction.userId, "user-102");
        assert.equal(result.transaction.provider, "GOOGLE_CALENDAR");
        assert.equal(result.transaction.clientType, "MOBILE");
        assert.equal(result.transaction.codeVerifier, rawVerifier, "PKCE verifier must be successfully decrypted on consumption");
        assert.ok(result.transaction.consumedAt instanceof Date, "consumedAt must be recorded");
      }
    });

    it("prevents callback replay attacks: consuming a state a second time fails", async () => {
      const { state } = await createOAuthTransaction({
        userId: "user-103",
        provider: "GOOGLE_CALENDAR",
        clientType: "WEB",
        codeVerifier: "verifier-103",
      });

      // First consumption succeeds
      const firstConsumption = await consumeOAuthTransaction(state);
      assert.equal(firstConsumption.success, true);

      // Replay attempt fails immediately
      const replayAttempt = await consumeOAuthTransaction(state);
      assert.equal(replayAttempt.success, false);
      if (!replayAttempt.success) {
        assert.equal(replayAttempt.error, "ALREADY_CONSUMED");
      }
    });

    it("rejects expired OAuth transactions", async () => {
      // Create transaction with negative TTL so it is expired immediately
      const { state } = await createOAuthTransaction({
        userId: "user-104",
        provider: "GOOGLE_CALENDAR",
        clientType: "WEB",
        codeVerifier: "verifier-104",
        ttlMs: -1000,
      });

      const result = await consumeOAuthTransaction(state);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error, "EXPIRED");
      }
    });

    it("returns NOT_FOUND for non-existent or random states", async () => {
      const result = await consumeOAuthTransaction("non-existent-state-12345");
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error, "NOT_FOUND");
      }
    });
  });

  describe("3. Bi-directional Mapping Uniqueness & Tenant Isolation", () => {
    it("enforces externalId uniqueness per user, provider, and entityType", async () => {
      await prisma.externalRecordMapping.create({
        data: {
          userId: "user-201",
          integrationId: "uint-1",
          provider: "GOOGLE_CALENDAR",
          entityType: "EXAM",
          internalId: "exam-101",
          externalId: "gcal-event-999",
        },
      });

      // Attempting to map the same external event to another exam must fail
      await assert.rejects(
        async () => {
          await prisma.externalRecordMapping.create({
            data: {
              userId: "user-201",
              integrationId: "uint-1",
              provider: "GOOGLE_CALENDAR",
              entityType: "EXAM",
              internalId: "exam-102", // Different internal exam
              externalId: "gcal-event-999", // Same external event
            },
          });
        },
        /Unique constraint violation: externalId already mapped/
      );
    });

    it("enforces internalId uniqueness per user, provider, and entityType", async () => {
      await prisma.externalRecordMapping.create({
        data: {
          userId: "user-202",
          integrationId: "uint-2",
          provider: "GOOGLE_CALENDAR",
          entityType: "EXAM",
          internalId: "exam-201",
          externalId: "gcal-event-111",
        },
      });

      // Attempting to map the same internal exam to another external event must fail
      await assert.rejects(
        async () => {
          await prisma.externalRecordMapping.create({
            data: {
              userId: "user-202",
              integrationId: "uint-2",
              provider: "GOOGLE_CALENDAR",
              entityType: "EXAM",
              internalId: "exam-201", // Same internal exam
              externalId: "gcal-event-222", // Different external event
            },
          });
        },
        /Unique constraint violation: internalId already mapped/
      );
    });

    it("allows different users to have distinct mappings without cross-tenant collision", async () => {
      const mappingUserA = await prisma.externalRecordMapping.create({
        data: {
          userId: "user-A",
          integrationId: "uint-A",
          provider: "GOOGLE_CALENDAR",
          entityType: "ASSIGNMENT",
          internalId: "assign-1",
          externalId: "ext-event-1",
        },
      });

      // User B with the same externalId does not collide because of tenant isolation
      const mappingUserB = await prisma.externalRecordMapping.create({
        data: {
          userId: "user-B",
          integrationId: "uint-B",
          provider: "GOOGLE_CALENDAR",
          entityType: "ASSIGNMENT",
          internalId: "assign-1",
          externalId: "ext-event-1",
        },
      });

      assert.notEqual(mappingUserA.id, mappingUserB.id);
      assert.equal(mappingUserA.userId, "user-A");
      assert.equal(mappingUserB.userId, "user-B");
    });
  });

  describe("4. Integration Failure Notification Deduplication Foundation", () => {
    it("generates deterministic deduplication keys for sync errors and reauthorization", () => {
      const syncKey = getIntegrationNotificationKey("GOOGLE_CALENDAR", "sync_error");
      assert.equal(syncKey, "integration:google_calendar:sync_error");

      const reauthKey = getIntegrationNotificationKey("GOOGLE_CALENDAR", "reauth_required");
      assert.equal(reauthKey, "integration:google_calendar:reauth_required");

      const canvasKey = getIntegrationNotificationKey("CANVAS", "reauth_required");
      assert.equal(canvasKey, "integration:canvas:reauth_required");
    });

    it("configures user-friendly action links and badge styling for integration notifications", () => {
      const syncConfig = getTypeConfig(NOTIFICATION_TYPES.INTEGRATION_SYNC_ERROR);
      assert.equal(syncConfig.category, "SYSTEM");
      assert.equal(syncConfig.actionUrl, "/dashboard/integrations");
      assert.equal(syncConfig.badgeLabel, "Sync error");

      const reauthConfig = getTypeConfig(NOTIFICATION_TYPES.INTEGRATION_REAUTH_REQUIRED);
      assert.equal(reauthConfig.category, "SYSTEM");
      assert.equal(reauthConfig.actionUrl, "/dashboard/integrations");
      assert.equal(reauthConfig.badgeLabel, "Reauth required");
    });
  });
});
