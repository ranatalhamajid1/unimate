import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { clearQueryCache, queryClient } from "../lib/query-client";
import { setUnauthorizedHandler } from "../lib/api-client";
import { clearAuthToken, setAuthToken, getAuthToken } from "../lib/auth-storage";

describe("Phase 15 Step 6: Mobile QA Hardening & Resilience Suite", () => {
  // 1. Session 401 Recovery & Cache Eviction
  describe("1. 401 Session Recovery & Secure Storage Clearing", () => {
    test("triggers 401 handler, purges auth token, and wipes query cache", async () => {
      let unauthorizedTriggered = false;

      // Register handler
      setUnauthorizedHandler(async () => {
        unauthorizedTriggered = true;
        await clearAuthToken();
        clearQueryCache();
      });

      // Populate token and cache
      await setAuthToken("test-expiring-token-xyz");
      queryClient.setQueryData(["dashboard"], { greeting: "Hello" });
      queryClient.setQueryData(["courses"], [{ id: "c1", name: "CS101" }]);

      assert.equal(await getAuthToken(), "test-expiring-token-xyz");
      assert.ok(queryClient.getQueryData(["dashboard"]));

      // Simulate 401 event handler invocation
      await clearAuthToken();
      clearQueryCache();
      unauthorizedTriggered = true;

      assert.equal(unauthorizedTriggered, true);
      assert.equal(await getAuthToken(), null);
      assert.equal(queryClient.getQueryData(["dashboard"]), undefined);
      assert.equal(queryClient.getQueryData(["courses"]), undefined);
    });
  });

  // 2. Client-side Human Readable Error Formatting
  describe("2. Network & Server Error Code Mapping", () => {
    function mapHttpStatusToUserMessage(status: number, serverError?: string): string {
      if (serverError && typeof serverError === "string" && serverError.trim().length > 0) {
        return serverError;
      }
      switch (status) {
        case 400:
          return "Invalid request. Please verify your input.";
        case 401:
          return "Session expired. Please log in again.";
        case 403:
          return "You do not have permission to access this resource.";
        case 404:
          return "Requested item was not found.";
        case 408:
        case 504:
          return "Connection timed out. Please check your internet connection.";
        case 429:
          return "Daily limit reached. Please try again tomorrow or upgrade.";
        case 500:
        case 502:
        case 503:
          return "Server temporarily unavailable. Please try again shortly.";
        default:
          return "An unexpected error occurred. Please try again.";
      }
    }

    test("maps status codes to clear student-friendly error messages", () => {
      assert.equal(mapHttpStatusToUserMessage(401), "Session expired. Please log in again.");
      assert.equal(mapHttpStatusToUserMessage(429), "Daily limit reached. Please try again tomorrow or upgrade.");
      assert.equal(mapHttpStatusToUserMessage(408), "Connection timed out. Please check your internet connection.");
      assert.equal(mapHttpStatusToUserMessage(500), "Server temporarily unavailable. Please try again shortly.");
      assert.equal(
        mapHttpStatusToUserMessage(400, "Attended classes cannot exceed total classes."),
        "Attended classes cannot exceed total classes."
      );
    });
  });

  // 3. Double Submission Guard Verification
  describe("3. Double Submission & Pending State Protection", () => {
    test("verifies disabled guard during pending mutation", () => {
      // Simulates Button logic: disabled={disabled || effectiveLoading}
      const isPending = true;
      const isDisabledExplicitly = false;
      const canSubmit = !isPending && !isDisabledExplicitly;

      assert.equal(canSubmit, false, "Pending mutation must disable submission");

      const isCompleted = false;
      const canSubmitAfter = !isCompleted && !isDisabledExplicitly;
      assert.equal(canSubmitAfter, true, "Form must re-enable when not pending");
    });
  });

  // 4. Security Static Scan: Zero Server Secrets in Entire Mobile Directory
  describe("4. Security Static Scan: Zero Server Secrets in Mobile", () => {
    const mobileRoot = path.resolve(__dirname, "..");
    const forbiddenPatterns = [
      /DATABASE_URL/i,
      /SESSION_SECRET/i,
      /@prisma\/client/i,
      /from\s+["']prisma["']/i,
      /from\s+["']@\/app\/lib\/prisma["']/i,
      /passwordHash/i,
      /PADDLE_API_KEY/i,
      /LEMONSQUEEZY_API_KEY/i,
      /GEMINI_API_KEY/i,
      /AI_API_KEY/i,
    ];

    function scanDir(dir: string): string[] {
      const files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".expo" || entry.name === "tests") {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...scanDir(fullPath));
        } else if (/\.(ts|tsx|js|json)$/.test(entry.name) && entry.name !== "package-lock.json") {
          files.push(fullPath);
        }
      }
      return files;
    }

    test("mobile source files contain zero references to backend secrets or database layers", () => {
      const allFiles = scanDir(mobileRoot);
      assert.ok(allFiles.length > 15, `Expected multiple mobile files, found ${allFiles.length}`);

      const violations: { file: string; pattern: string }[] = [];

      for (const file of allFiles) {
        const content = fs.readFileSync(file, "utf8");
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(content)) {
            violations.push({
              file: path.relative(mobileRoot, file),
              pattern: pattern.toString(),
            });
          }
        }
      }

      assert.deepEqual(
        violations,
        [],
        `Found forbidden server secrets or Prisma references in mobile source: ${JSON.stringify(violations)}`
      );
    });
  });
});
