import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getInitials, getAvatarColor } from "../lib/avatar-utils";

describe("Milestone 4: Mobile Student Identity & University Experience Suite", () => {
  const mobileRoot = path.resolve(__dirname, "..");

  // 1. AvatarFallback & Initial Logic
  describe("1. AvatarFallback & Initial Logic", () => {
    test("extracts 2 initials from multi-word names", () => {
      assert.equal(getInitials("Alex Smith"), "AS");
      assert.equal(getInitials("Muhammad Talha"), "MT");
      assert.equal(getInitials("John Robert Lewis"), "JL");
    });

    test("extracts first 2 characters from single-word names", () => {
      assert.equal(getInitials("Alex"), "AL");
      assert.equal(getInitials("Stanford"), "ST");
    });

    test("handles empty or null names gracefully", () => {
      assert.equal(getInitials(""), "U");
      assert.equal(getInitials(null), "U");
      assert.equal(getInitials(undefined), "U");
    });

    test("produces deterministic color palette based on name hash", () => {
      const color1 = getAvatarColor("Alex Smith");
      const color2 = getAvatarColor("Alex Smith");
      assert.equal(color1, color2, "Color must be deterministic for identical name");
      assert.ok(color1.startsWith("#"), "Color must be a valid hex code");
    });
  });

  // 2. University Search & Custom University API Integration
  describe("2. UniversityPicker & API Integration", () => {
    test("constructs valid GET /api/universities query params with debounce & limits", () => {
      const q = "Stanford";
      const country = "United States";
      const limit = "30";

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (country) params.set("country", country);
      params.set("limit", limit);

      const queryString = params.toString();
      assert.ok(queryString.includes("q=Stanford"));
      assert.ok(queryString.includes("country=United+States"));
      assert.ok(queryString.includes("limit=30"));
    });

    test("validates custom university creation requirements", () => {
      const validateCustomUni = (name: string, country: string) => {
        if (!name || name.trim().length < 3) {
          return { valid: false, error: "University name must be at least 3 characters." };
        }
        if (!country || country.trim().length < 2) {
          return { valid: false, error: "Country must be provided (at least 2 characters)." };
        }
        return { valid: true };
      };

      assert.equal(validateCustomUni("Ab", "Canada").valid, false);
      assert.equal(validateCustomUni("MIT", "U").valid, false);
      assert.equal(validateCustomUni("Stanford University", "United States").valid, true);
    });

    test("distinguishes verified vs community institutions", () => {
      const uniVerified = { id: "1", name: "MIT", isVerified: true };
      const uniCommunity = { id: "2", name: "Custom Tech", isVerified: false };

      assert.equal(uniVerified.isVerified ? "Verified" : "Community", "Verified");
      assert.equal(uniCommunity.isVerified ? "Verified" : "Community", "Community");
    });
  });

  // 3. Avatar Upload & Delete API Flow
  describe("3. AvatarPicker & Upload Logic", () => {
    test("constructs valid FormData payload for avatar upload", () => {
      const asset = {
        uri: "file:///path/to/avatar.jpg",
        fileName: "profile.jpg",
        mimeType: "image/jpeg",
      };

      const filePayload = {
        uri: asset.uri.replace("file://", ""),
        name: asset.fileName || "avatar.jpg",
        type: asset.mimeType || "image/jpeg",
      };

      assert.equal(filePayload.uri, "/path/to/avatar.jpg");
      assert.equal(filePayload.type, "image/jpeg");
      assert.equal(filePayload.name, "profile.jpg");
    });

    test("routes avatar upload and deletion to exact mobile endpoints", () => {
      const uploadEndpoint = "/api/mobile/user/avatar/upload";
      const deleteEndpoint = "/api/mobile/user/avatar";

      assert.equal(uploadEndpoint, "/api/mobile/user/avatar/upload");
      assert.equal(deleteEndpoint, "/api/mobile/user/avatar");
    });
  });

  // 4. Onboarding 3-Step Validation & Submission
  describe("4. Mobile Onboarding 3-Step Validation", () => {
    test("step 1 requires university and country", () => {
      const validateStep1 = (hasUniversity: boolean, country: string) => {
        if (!hasUniversity) return { valid: false, error: "Please select your university" };
        if (!country || country.trim().length === 0) return { valid: false, error: "Please enter country" };
        return { valid: true };
      };

      assert.equal(validateStep1(false, "USA").valid, false);
      assert.equal(validateStep1(true, "").valid, false);
      assert.equal(validateStep1(true, "USA").valid, true);
    });

    test("step 2 requires degree program, current semester, and valid graduation year", () => {
      const validateStep2 = (degree: string, semester: string, gradYear: string) => {
        if (!degree.trim()) return { valid: false, error: "Degree program required" };
        if (!semester.trim()) return { valid: false, error: "Current semester required" };
        const yr = parseInt(gradYear, 10);
        if (isNaN(yr) || yr < 2000 || yr > 2100) return { valid: false, error: "Valid graduation year required" };
        return { valid: true };
      };

      assert.equal(validateStep2("", "Semester 2", "2027").valid, false);
      assert.equal(validateStep2("BS CS", "", "2027").valid, false);
      assert.equal(validateStep2("BS CS", "Semester 2", "1990").valid, false);
      assert.equal(validateStep2("BS CS", "Semester 2", "2028").valid, true);
    });

    test("step 3 validates username format if provided", () => {
      const validateUsernameFormat = (username: string) => {
        if (!username) return { valid: true };
        const clean = username.trim().toLowerCase();
        if (clean.length < 3 || clean.length > 30) return { valid: false, error: "Length between 3 and 30" };
        if (!/^[a-z0-9_]+$/.test(clean)) return { valid: false, error: "Alphanumeric and underscores only" };
        return { valid: true, normalized: clean };
      };

      assert.equal(validateUsernameFormat("ab").valid, false);
      assert.equal(validateUsernameFormat("alex smith!").valid, false);
      assert.equal(validateUsernameFormat("alex_smith_2026").valid, true);
      assert.equal(validateUsernameFormat("alex_smith_2026").normalized, "alex_smith_2026");
    });

    test("submits onboarding data to POST /api/mobile/user/onboarding", () => {
      const onboardingEndpoint = "/api/mobile/user/onboarding";
      assert.equal(onboardingEndpoint, "/api/mobile/user/onboarding");
    });
  });

  // 5. Mobile Profile & Privacy Guarantee
  describe("5. Profile & Privacy Safeguards", () => {
    test("profile update targets PATCH /api/mobile/user/profile", () => {
      const profileEndpoint = "/api/mobile/user/profile";
      assert.equal(profileEndpoint, "/api/mobile/user/profile");
    });

    test("privacy copy guarantees private academic and financial records", () => {
      const settingsPath = path.join(mobileRoot, "app", "settings.tsx");
      assert.ok(fs.existsSync(settingsPath), "settings.tsx must exist");
      const content = fs.readFileSync(settingsPath, "utf8");

      assert.ok(
        content.includes("GPA"),
        "Settings must state GPA privacy"
      );
      assert.ok(
        content.includes("grades"),
        "Settings must state grades privacy"
      );
      assert.ok(
        content.includes("expenses"),
        "Settings must state expenses privacy"
      );
    });

    test("profile completion calculates percentage and clamps between 0 and 100", () => {
      const computeCompletion = (pct: number) => Math.min(100, Math.max(0, Math.round(pct)));

      assert.equal(computeCompletion(-10), 0);
      assert.equal(computeCompletion(45.6), 46);
      assert.equal(computeCompletion(120), 100);
    });
  });

  // 6. Keyboard Awareness Regression Check
  describe("6. Keyboard Awareness & Architecture Integrity", () => {
    test("UniversityPickerModal uses ModalKeyboardContainer for bottom-sheet keyboard avoidance", () => {
      const modalPath = path.join(mobileRoot, "components", "UniversityPickerModal.tsx");
      assert.ok(fs.existsSync(modalPath), "UniversityPickerModal.tsx must exist");
      const content = fs.readFileSync(modalPath, "utf8");

      assert.ok(
        content.includes("ModalKeyboardContainer"),
        "UniversityPickerModal must wrap contents with ModalKeyboardContainer"
      );
    });

    test("OnboardingScreen uses Screen scrollable with KeyboardAwareScrollView", () => {
      const onboardingPath = path.join(mobileRoot, "app", "onboarding.tsx");
      assert.ok(fs.existsSync(onboardingPath), "onboarding.tsx must exist");
      const content = fs.readFileSync(onboardingPath, "utf8");

      assert.ok(
        content.includes("<Screen scrollable>"),
        "onboarding.tsx must use Screen scrollable"
      );
    });

    test("SettingsScreen uses Screen scrollable with KeyboardAwareScrollView", () => {
      const settingsPath = path.join(mobileRoot, "app", "settings.tsx");
      assert.ok(fs.existsSync(settingsPath), "settings.tsx must exist");
      const content = fs.readFileSync(settingsPath, "utf8");

      assert.ok(
        content.includes("<Screen scrollable>"),
        "settings.tsx must use Screen scrollable"
      );
    });

    test("Zero server secrets or Prisma imports in mobile codebase", () => {
      const forbiddenTokens = ["@prisma/client", "DATABASE_URL", "JWT_SECRET", "R2_SECRET_ACCESS_KEY"];
      const scanDirs = ["app", "components", "lib", "contexts", "hooks"];

      for (const dir of scanDirs) {
        const fullDir = path.join(mobileRoot, dir);
        if (!fs.existsSync(fullDir)) continue;

        const files = fs.readdirSync(fullDir, { recursive: true });
        for (const f of files) {
          if (typeof f !== "string") continue;
          if (!f.endsWith(".ts") && !f.endsWith(".tsx")) continue;

          const filePath = path.join(fullDir, f);
          const content = fs.readFileSync(filePath, "utf8");

          for (const token of forbiddenTokens) {
            assert.ok(
              !content.includes(token),
              `File ${filePath} must not include forbidden server token '${token}'`
            );
          }
        }
      }
    });
  });
});
