import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LightColors, DarkColors } from "../constants/colors";
import { BorderRadius, Layout } from "../constants/layout";
import { FontSize, FontWeight } from "../constants/typography";

describe("Milestone 5: Premium Design System & Motion Suite", () => {
  const mobileRoot = path.resolve(__dirname, "..");

  // 1. Unified Visual Tokens (Light & Dark)
  describe("1. Unified Color Tokens & Semantics", () => {
    test("Light theme conforms to approved palette tokens", () => {
      assert.equal(LightColors.background, "#FCFCFD");
      assert.equal(LightColors.surface, "#FFFFFF");
      assert.equal(LightColors.surfaceSecondary, "#F8F9FA");
      assert.equal(LightColors.surfaceTertiary, "#F1F3F5");
      assert.equal(LightColors.border, "#E2E8F0");
      assert.equal(LightColors.textPrimary, "#0F172A");
      assert.equal(LightColors.textSecondary, "#64748B");
      assert.equal(LightColors.accent, "#2563EB");
      assert.equal(LightColors.primarySoft, "#EFF6FF");
      assert.equal(LightColors.ai, "#8B5CF6");
      assert.equal(LightColors.aiSubtle, "#F5F3FF");
      assert.equal(LightColors.info, "#0284C7");
    });

    test("Dark theme conforms to approved palette tokens", () => {
      assert.equal(DarkColors.background, "#0B0E14");
      assert.equal(DarkColors.surface, "#121721");
      assert.equal(DarkColors.surfaceSecondary, "#18202F");
      assert.equal(DarkColors.surfaceTertiary, "#222C3E");
      assert.equal(DarkColors.border, "#263042");
      assert.equal(DarkColors.textPrimary, "#F1F5F9");
      assert.equal(DarkColors.textSecondary, "#94A3B8");
      assert.equal(DarkColors.accent, "#3B82F6");
      assert.equal(DarkColors.primarySoft, "#1E293B");
      assert.equal(DarkColors.ai, "#A78BFA");
      assert.equal(DarkColors.aiSubtle, "#2E1065");
      assert.equal(DarkColors.info, "#38BDF8");
    });

    test("Neither theme uses pure black or harsh unrefined tones", () => {
      assert.notEqual(DarkColors.background, "#000000");
      assert.notEqual(LightColors.background, "#000000");
    });
  });

  // 2. Restrained Radius Hierarchy
  describe("2. Restrained Radius Hierarchy", () => {
    test("Controls (buttons, inputs) target 8px radius", () => {
      assert.equal(BorderRadius.md, 8);
    });

    test("Standard cards target 12px radius", () => {
      assert.equal(BorderRadius.lg, 12);
    });

    test("Prominent feature surfaces & modals target 16px radius", () => {
      assert.equal(BorderRadius.xl, 16);
    });
  });

  // 3. Typography & Touch Targets
  describe("3. Typography & Layout Standards", () => {
    test("Font scale provides clear hierarchical sizing", () => {
      assert.equal(FontSize.xs, 11);
      assert.equal(FontSize.sm, 13);
      assert.equal(FontSize.base, 15);
      assert.equal(FontSize.lg, 20);
      assert.equal(FontSize.xl, 24);
      assert.equal(FontSize.xxl, 28);
    });

    test("Accessible minimum touch target meets 44px platform requirement", () => {
      assert.equal(Layout.minTouchTarget, 44);
    });
  });

  // 4. Safe Haptics Fallback
  describe("4. Haptics System Behavior", () => {
    test("Haptics utility defines safe methods with platform error suppression", () => {
      const hapticsPath = path.join(mobileRoot, "lib", "haptics.ts");
      assert.ok(fs.existsSync(hapticsPath), "lib/haptics.ts must exist");
      const content = fs.readFileSync(hapticsPath, "utf8");

      assert.ok(content.includes("triggerSelectionFeedback"), "Must export triggerSelectionFeedback");
      assert.ok(content.includes("triggerSuccessFeedback"), "Must export triggerSuccessFeedback");
      assert.ok(content.includes("triggerDestructiveFeedback"), "Must export triggerDestructiveFeedback");
      assert.ok(content.includes("Platform.OS === \"web\""), "Must guard against web execution");
      assert.ok(content.includes("catch"), "Must catch and suppress unsupported device errors");
    });
  });

  // 5. Keyboard Safety Verification
  describe("5. Keyboard Safety Regression Check", () => {
    test("FormInput component preserves forwardRef and useKeyboardAware integration", () => {
      const formInputPath = path.join(mobileRoot, "components", "ui", "FormInput.tsx");
      assert.ok(fs.existsSync(formInputPath));
      const content = fs.readFileSync(formInputPath, "utf8");

      assert.ok(content.includes("useKeyboardAware"), "FormInput must use useKeyboardAware");
      assert.ok(content.includes("scrollToFocusedInput"), "FormInput must call scrollToFocusedInput");
      assert.ok(content.includes("forwardRef"), "FormInput must forwardRef");
    });

    test("ModalKeyboardContainer component wraps modal content in KeyboardAvoidingView", () => {
      const modalContainerPath = path.join(mobileRoot, "components", "ui", "ModalKeyboardContainer.tsx");
      assert.ok(fs.existsSync(modalContainerPath));
      const content = fs.readFileSync(modalContainerPath, "utf8");

      assert.ok(content.includes("KeyboardAvoidingView"));
      assert.ok(content.includes("ScrollView"));
    });

    test("All modal forms utilize ModalKeyboardContainer", () => {
      const modalFormFiles = [
        "app/courses/index.tsx",
        "app/assignments/index.tsx",
        "app/exams/index.tsx",
        "app/academics/index.tsx",
        "app/expenses/index.tsx",
        "app/goals/index.tsx",
        "app/study-plans/index.tsx",
        "components/UniversityPickerModal.tsx",
      ];

      for (const relPath of modalFormFiles) {
        const fullPath = path.join(mobileRoot, relPath);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, "utf8");
        assert.ok(
          content.includes("ModalKeyboardContainer"),
          `File ${relPath} must implement ModalKeyboardContainer`
        );
      }
    });

    test("Zero server secrets or Prisma imports in mobile source files", () => {
      const forbiddenTokens = ["@prisma/client", "DATABASE_URL", "JWT_SECRET", "R2_SECRET_ACCESS_KEY"];
      const scanDirs = ["app", "components", "lib", "contexts", "hooks", "constants"];

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
