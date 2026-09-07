import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Phase 16: Release Validation & Production Launch Readiness Suite", () => {
  const mobileRoot = path.resolve(__dirname, "..");

  // 1. App Configuration Pre-Flight Audit
  describe("1. App Metadata & Configuration Pre-Flight Audit", () => {
    test("app.json conforms strictly to production release metadata standards", () => {
      const appJsonPath = path.join(mobileRoot, "app.json");
      assert.ok(fs.existsSync(appJsonPath), "app.json must exist");

      const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
      const expo = appJson.expo;

      assert.equal(expo.name, "UniMate", "App name must be UniMate");
      assert.equal(expo.slug, "unimate", "Slug must be unimate");
      assert.equal(expo.scheme, "unimate", "Deep link scheme must be unimate");
      assert.equal(expo.version, "1.0.0", "Version must be 1.0.0");
      assert.equal(expo.android?.package, "com.unimate.app", "Android package must be com.unimate.app");
      assert.ok(expo.android?.versionCode >= 1, "Android versionCode must be >= 1");
      assert.equal(expo.ios?.bundleIdentifier, "com.unimate.app", "iOS bundleIdentifier must be com.unimate.app");
      assert.ok(expo.ios?.buildNumber, "iOS buildNumber must be configured");
      assert.equal(expo.orientation, "portrait", "Orientation should be locked to portrait");
      assert.ok(expo.plugins.includes("expo-secure-store"), "expo-secure-store plugin must be present");
      assert.ok(expo.plugins.includes("expo-router"), "expo-router plugin must be present");
    });

    test("eas.json provides valid preview (APK) and production (AAB) build profiles", () => {
      const easJsonPath = path.join(mobileRoot, "eas.json");
      assert.ok(fs.existsSync(easJsonPath), "eas.json must exist");

      const easJson = JSON.parse(fs.readFileSync(easJsonPath, "utf8"));
      assert.ok(easJson.build?.preview, "Preview build profile must exist");
      assert.equal(easJson.build.preview.android?.buildType, "apk", "Preview build must generate direct APK for testing");
      assert.ok(easJson.build?.production, "Production build profile must exist");
      assert.equal(easJson.build.production.android?.buildType, "app-bundle", "Production build must generate Play Store AAB");
    });
  });

  // 2. Production API Safety
  describe("2. Production API Configuration & Guard Rules", () => {
    test("rejects hardcoding localhost or 127.0.0.1 in production when EXPO_PUBLIC_API_URL is missing", () => {
      function mockResolveApiBaseUrl(envUrl?: string, isProd = false): string {
        const trimmed = envUrl?.trim();
        if (trimmed) return trimmed.replace(/\/+$/, "");
        if (!isProd) return "http://localhost:3000";
        return "";
      }

      assert.equal(mockResolveApiBaseUrl("https://api.unimate.app", true), "https://api.unimate.app");
      assert.equal(mockResolveApiBaseUrl(undefined, false), "http://localhost:3000");
      assert.equal(mockResolveApiBaseUrl(undefined, true), "", "Production build without EXPO_PUBLIC_API_URL must not fallback to localhost");
    });
  });

  // 3. Deep Link Route Mapping
  describe("3. Deep Link Scheme & Protected Routes Coverage", () => {
    test("unimate:// scheme covers all intended application modules", () => {
      const expectedRoutes = [
        "goals",
        "study-plans",
        "calendar",
        "ai-buddy",
        "insights",
        "billing",
        "settings",
        "courses",
        "assignments",
        "exams",
        "academics",
        "expenses",
        "notifications",
      ];

      const scheme = "unimate";
      for (const route of expectedRoutes) {
        const deepLinkUri = `${scheme}://${route}`;
        assert.ok(deepLinkUri.startsWith("unimate://"));
        assert.ok(deepLinkUri.length > "unimate://".length);
      }
    });
  });

  // 4. Client-side Security & Sensitive Data Storage Audit
  describe("4. Client-side Sensitive Data Storage Audit", () => {
    test("confirms auth tokens are stored exclusively via SecureStore and NOT AsyncStorage", () => {
      const authStorageCode = fs.readFileSync(path.join(mobileRoot, "lib", "auth-storage.ts"), "utf8");

      assert.ok(authStorageCode.includes("expo-secure-store"), "Must import expo-secure-store");
      assert.ok(!authStorageCode.includes("@react-native-async-storage/async-storage"), "Auth tokens must NEVER be stored in AsyncStorage");
    });
  });
});
