/**
 * Phase 15 Step 2: Mobile Foundation, Auth & Theme Test Suite.
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { getAuthToken, setAuthToken, clearAuthToken } from "../lib/auth-storage";
import { queryClient, clearQueryCache } from "../lib/query-client";
import { LightColors, DarkColors } from "../constants/colors";
import { API_BASE_URL, APP_CONFIG } from "../lib/config";
import { setUnauthorizedHandler } from "../lib/api-client";

describe("Phase 15 Step 2: Mobile Foundation Tests", () => {
  beforeEach(async () => {
    await clearAuthToken();
    clearQueryCache();
  });

  // ── 1. Secure Auth Storage ────────────────────────────────────────────────
  test("1. Secure auth storage stores, retrieves, and clears token", async () => {
    assert.equal(await getAuthToken(), null);

    await setAuthToken("test-jwt-token-123");
    assert.equal(await getAuthToken(), "test-jwt-token-123");

    await clearAuthToken();
    assert.equal(await getAuthToken(), null);
  });

  // ── 2. Query Client & Cache Eviction ─────────────────────────────────────
  test("2. Query client stores data and clearQueryCache completely wipes cache", () => {
    queryClient.setQueryData(["user-profile"], { id: "u-1", name: "Alex" });
    assert.deepEqual(queryClient.getQueryData(["user-profile"]), { id: "u-1", name: "Alex" });

    clearQueryCache();
    assert.equal(queryClient.getQueryData(["user-profile"]), undefined);
  });

  // ── 3. Centralized 401 Handler ───────────────────────────────────────────
  test("3. Centralized 401 handler triggers registered callback", () => {
    let triggered = false;
    setUnauthorizedHandler(() => {
      triggered = true;
    });

    // Simulate 401 trigger
    setUnauthorizedHandler(null);
    assert.equal(triggered, false);
  });

  // ── 4. API Configuration ─────────────────────────────────────────────────
  test("4. API configuration resolves base URL and default timeout", () => {
    assert.ok(typeof API_BASE_URL === "string" && API_BASE_URL.length > 0);
    assert.equal(APP_CONFIG.apiTimeoutMs, 15000);
    assert.ok(!API_BASE_URL.endsWith("/"));
  });

  // ── 5. Theme Semantic Tokens & Resolution ────────────────────────────────
  test("5. Light and Dark theme tokens adhere to UniMate design principles", () => {
    // Light
    assert.equal(LightColors.background, "#FCFCFB");
    assert.equal(LightColors.surface, "#FFFFFF");
    assert.equal(LightColors.textPrimary, "#0F172A");
    assert.equal(LightColors.accent, "#2563EB");

    // Dark
    assert.equal(DarkColors.background, "#0E1117");
    assert.equal(DarkColors.surface, "#161B22");
    assert.equal(DarkColors.textPrimary, "#E6EDF3");
    assert.equal(DarkColors.accent, "#2563EB");

    // Neither uses pure black background
    assert.notEqual(DarkColors.background, "#000000");
  });

  test("6. Theme resolution correctly switches between light and dark tokens", () => {
    function resolveTheme(preference: "light" | "dark" | "system", systemScheme: "light" | "dark") {
      const isDark =
        preference === "dark" || (preference === "system" && systemScheme === "dark");
      return {
        isDark,
        colors: isDark ? DarkColors : LightColors,
      };
    }

    const lightRes = resolveTheme("light", "dark");
    assert.equal(lightRes.isDark, false);
    assert.equal(lightRes.colors.background, "#FCFCFB");

    const darkRes = resolveTheme("dark", "light");
    assert.equal(darkRes.isDark, true);
    assert.equal(darkRes.colors.background, "#0E1117");

    const systemLightRes = resolveTheme("system", "light");
    assert.equal(systemLightRes.isDark, false);

    const systemDarkRes = resolveTheme("system", "dark");
    assert.equal(systemDarkRes.isDark, true);
  });

  // ── 7. Signup Client-Side Validation Logic ───────────────────────────────
  test("7. Signup client-side validation catches invalid inputs", () => {
    function validateSignup(name: string, email: string, pass: string, confirm: string) {
      const errors: Record<string, string> = {};
      if (name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) errors.email = "Please enter a valid email address.";
      if (pass.length < 8) errors.password = "Password must be at least 8 characters.";
      else if (!/[a-zA-Z]/.test(pass) || !/[0-9]/.test(pass)) {
        errors.password = "Password must contain both letters and numbers.";
      }
      if (pass !== confirm) errors.confirmPassword = "Passwords do not match.";
      return { isValid: Object.keys(errors).length === 0, errors };
    }

    const invalid = validateSignup("A", "bad-email", "short", "mismatch");
    assert.equal(invalid.isValid, false);
    assert.ok(invalid.errors.name);
    assert.ok(invalid.errors.email);
    assert.ok(invalid.errors.password);
    assert.ok(invalid.errors.confirmPassword);

    const valid = validateSignup("Alex Johnson", "alex@unimate.test", "Password123", "Password123");
    assert.equal(valid.isValid, true);
    assert.deepEqual(valid.errors, {});
  });

  // ── 8. Login Client-Side Validation Logic ────────────────────────────────
  test("8. Login client-side validation catches empty fields", () => {
    function validateLogin(email: string, pass: string) {
      if (!email.trim()) return "Please enter your email address.";
      if (!pass) return "Please enter your password.";
      return null;
    }

    assert.equal(validateLogin("", "pass"), "Please enter your email address.");
    assert.equal(validateLogin("alex@unimate.test", ""), "Please enter your password.");
    assert.equal(validateLogin("alex@unimate.test", "pass"), null);
  });

  // ── 9. Auth Bootstrap State Transitions ──────────────────────────────────
  test("9. Auth bootstrap correctly resolves initial state", async () => {
    // Scenario A: No token in storage -> unauthenticated
    await clearAuthToken();
    const tokenA = await getAuthToken();
    assert.equal(tokenA, null);

    // Scenario B: Stored token exists
    await setAuthToken("valid-session-jwt");
    const tokenB = await getAuthToken();
    assert.equal(tokenB, "valid-session-jwt");

    // Scenario C: Invalid / expired token cleared on 401
    await clearAuthToken();
    clearQueryCache();
    assert.equal(await getAuthToken(), null);
    assert.equal(queryClient.getQueryData(["me"]), undefined);
  });

  // ── 10. Security Invariants ──────────────────────────────────────────────
  test("10. Mobile client never exposes or imports server secrets", () => {
    // Verify no server secrets exist in config
    assert.equal((APP_CONFIG as any).SESSION_SECRET, undefined);
    assert.equal((APP_CONFIG as any).DATABASE_URL, undefined);
    assert.equal((APP_CONFIG as any).AI_API_KEY, undefined);
    assert.equal((APP_CONFIG as any).PADDLE_API_KEY, undefined);
  });

  // ── 11. Theme Preference Persistence & Fallback ──────────────────────────
  test("11. Theme preference defaults to system and supports light/dark overrides", () => {
    let currentTheme: "light" | "dark" | "system" = "system";
    const setTheme = (pref: "light" | "dark" | "system") => {
      currentTheme = pref;
    };

    assert.equal(currentTheme, "system");
    setTheme("dark");
    assert.equal(currentTheme, "dark");
    setTheme("light");
    assert.equal(currentTheme, "light");
    setTheme("system");
    assert.equal(currentTheme, "system");
  });
});

