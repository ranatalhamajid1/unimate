import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Keyboard Awareness & Input Visibility Suite", () => {
  const mobileRoot = path.resolve(__dirname, "..");

  // 1. Android Soft Keyboard Configuration
  describe("1. Android System & Expo Configuration", () => {
    test("app.json explicitly sets softwareKeyboardLayoutMode to 'resize'", () => {
      const appJsonPath = path.join(mobileRoot, "app.json");
      assert.ok(fs.existsSync(appJsonPath), "app.json must exist");

      const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
      assert.equal(
        appJson.expo?.android?.softwareKeyboardLayoutMode,
        "resize",
        "Android softwareKeyboardLayoutMode must be 'resize' to ensure window resizes when keyboard opens"
      );
    });
  });

  // 2. Focused Input Visibility & Scroll Calculation Logic
  describe("2. Focused Input Offset & Visibility Calculations", () => {
    function computeScrollAdjustment(params: {
      windowHeight: number;
      keyboardHeight: number;
      inputY: number;
      inputHeight: number;
      extraOffset?: number;
      isAndroid?: boolean;
    }) {
      const {
        windowHeight,
        keyboardHeight,
        inputY,
        inputHeight,
        extraOffset = 48,
        isAndroid = true,
      } = params;

      // On Android with 'resize', the windowHeight itself is resized
      const effectiveKeyboardTop = isAndroid
        ? windowHeight
        : windowHeight - keyboardHeight;

      const inputBottom = inputY + inputHeight + extraOffset;
      const diff = inputBottom - effectiveKeyboardTop;

      if (diff > 0) {
        return { shouldScroll: true, direction: "down" as const, delta: diff };
      } else if (inputY < 60) {
        return {
          shouldScroll: true,
          direction: "up" as const,
          delta: 60 - inputY,
        };
      }
      return { shouldScroll: false, direction: "none" as const, delta: 0 };
    }

    test("scrolls down when focused input is occluded by the keyboard (375px compact device)", () => {
      // 375px compact screen, window resized to 500px on keyboard open
      const result = computeScrollAdjustment({
        windowHeight: 500,
        keyboardHeight: 300,
        inputY: 440,
        inputHeight: 48,
        extraOffset: 40,
        isAndroid: true,
      });

      assert.equal(result.shouldScroll, true);
      assert.equal(result.direction, "down");
      assert.ok(result.delta > 0, "Must scroll down to reveal input");
      // inputBottom = 440 + 48 + 40 = 528. effectiveKeyboardTop = 500. diff = 28
      assert.equal(result.delta, 28);
    });

    test("scrolls down when focused input is occluded on standard 390px screen", () => {
      // 390px standard screen, window resized to 540px on keyboard open
      const result = computeScrollAdjustment({
        windowHeight: 540,
        keyboardHeight: 320,
        inputY: 480,
        inputHeight: 50,
        extraOffset: 48,
        isAndroid: true,
      });

      assert.equal(result.shouldScroll, true);
      assert.equal(result.direction, "down");
      assert.equal(result.delta, 480 + 50 + 48 - 540); // 38px
    });

    test("scrolls down when focused input is near bottom on larger 412px Android device", () => {
      // 412px large screen, window resized to 580px
      const result = computeScrollAdjustment({
        windowHeight: 580,
        keyboardHeight: 340,
        inputY: 530,
        inputHeight: 52,
        extraOffset: 48,
        isAndroid: true,
      });

      assert.equal(result.shouldScroll, true);
      assert.equal(result.direction, "down");
      assert.equal(result.delta, 530 + 52 + 48 - 580); // 50px
    });

    test("does not trigger unnecessary scrolling when input is comfortably visible", () => {
      const result = computeScrollAdjustment({
        windowHeight: 500,
        keyboardHeight: 300,
        inputY: 150,
        inputHeight: 48,
        extraOffset: 40,
        isAndroid: true,
      });

      assert.equal(result.shouldScroll, false);
      assert.equal(result.direction, "none");
      assert.equal(result.delta, 0);
    });

    test("scrolls up when input is scrolled behind a top navigation header", () => {
      const result = computeScrollAdjustment({
        windowHeight: 500,
        keyboardHeight: 300,
        inputY: 20, // too close to top
        inputHeight: 48,
        extraOffset: 40,
        isAndroid: true,
      });

      assert.equal(result.shouldScroll, true);
      assert.equal(result.direction, "up");
      assert.equal(result.delta, 40); // 60 - 20 = 40px
    });

    test("calculates correct scroll on iOS using windowHeight - keyboardHeight", () => {
      // On iOS, window height remains 844, keyboard height is 336, effective keyboard top is 508
      const result = computeScrollAdjustment({
        windowHeight: 844,
        keyboardHeight: 336,
        inputY: 480,
        inputHeight: 50,
        extraOffset: 40,
        isAndroid: false,
      });

      assert.equal(result.shouldScroll, true);
      assert.equal(result.direction, "down");
      // inputBottom = 480 + 50 + 40 = 570. effectiveKeyboardTop = 844 - 336 = 508. diff = 62
      assert.equal(result.delta, 62);
    });
  });

  // 3. Screen and Reusable Keyboard Architecture Verification
  describe("3. Reusable Architecture & Component Integration", () => {
    test("Screen component integrates KeyboardAwareScrollView when scrollable is true", () => {
      const screenPath = path.join(mobileRoot, "components", "ui", "Screen.tsx");
      const content = fs.readFileSync(screenPath, "utf8");

      assert.ok(
        content.includes("KeyboardAwareScrollView"),
        "Screen.tsx must use KeyboardAwareScrollView"
      );
      assert.ok(
        content.includes("keyboardAvoiding && !scrollable"),
        "Screen.tsx must avoid duplicate KeyboardAvoidingView when scrollable is true"
      );
    });

    test("FormInput component forwards ref and connects to KeyboardAwareContext", () => {
      const formInputPath = path.join(
        mobileRoot,
        "components",
        "ui",
        "FormInput.tsx"
      );
      const content = fs.readFileSync(formInputPath, "utf8");

      assert.ok(
        content.includes("forwardRef"),
        "FormInput must be wrapped in forwardRef"
      );
      assert.ok(
        content.includes("useKeyboardAware"),
        "FormInput must consume useKeyboardAware context"
      );
      assert.ok(
        content.includes("scrollToFocusedInput(containerRef)"),
        "FormInput must trigger scrollToFocusedInput onFocus"
      );
    });

    test("ModalKeyboardContainer component wraps modal content in KeyboardAvoidingView and ScrollView", () => {
      const modalPath = path.join(
        mobileRoot,
        "components",
        "ui",
        "ModalKeyboardContainer.tsx"
      );
      assert.ok(fs.existsSync(modalPath), "ModalKeyboardContainer must exist");

      const content = fs.readFileSync(modalPath, "utf8");
      assert.ok(
        content.includes("KeyboardAvoidingView"),
        "ModalKeyboardContainer must include KeyboardAvoidingView"
      );
      assert.ok(
        content.includes("ScrollView"),
        "ModalKeyboardContainer must wrap modal card in ScrollView"
      );
      assert.ok(
        content.includes('keyboardShouldPersistTaps="handled"'),
        "ModalKeyboardContainer must have keyboardShouldPersistTaps='handled'"
      );
    });
  });

  // 4. Verification of All Form Screens & Modals
  describe("4. Form Screens & Modals Coverage", () => {
    test("Login and Signup screens implement scrollable Screen and sequential input chaining", () => {
      const loginPath = path.join(mobileRoot, "app", "(auth)", "login.tsx");
      const loginContent = fs.readFileSync(loginPath, "utf8");
      assert.ok(
        loginContent.includes("<Screen scrollable"),
        "LoginScreen must use <Screen scrollable>"
      );
      assert.ok(
        loginContent.includes("passwordRef"),
        "LoginScreen must maintain passwordRef for next focus"
      );

      const signupPath = path.join(mobileRoot, "app", "(auth)", "signup.tsx");
      const signupContent = fs.readFileSync(signupPath, "utf8");
      assert.ok(
        signupContent.includes("<Screen scrollable"),
        "SignupScreen must use <Screen scrollable>"
      );
      assert.ok(
        signupContent.includes("emailRef") &&
          signupContent.includes("passwordRef") &&
          signupContent.includes("confirmPasswordRef"),
        "SignupScreen must chain focus across Name, Email, Password, and Confirm Password"
      );
    });

    test("All 8 modal forms utilize ModalKeyboardContainer", () => {
      const modalFiles = [
        "app/courses/index.tsx",
        "app/assignments/index.tsx",
        "app/exams/index.tsx",
        "app/expenses/index.tsx",
        "app/goals/index.tsx",
        "app/study-plans/index.tsx",
        "app/(tabs)/schedule.tsx",
        "app/academics/index.tsx",
      ];

      for (const relPath of modalFiles) {
        const fullPath = path.join(mobileRoot, relPath);
        assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
        const content = fs.readFileSync(fullPath, "utf8");
        assert.ok(
          content.includes("ModalKeyboardContainer"),
          `${relPath} must wrap modal content with ModalKeyboardContainer`
        );
      }
    });

    test("AI Study Buddy disables Screen keyboardAvoiding to prevent duplicate conflict", () => {
      const aiBuddyPath = path.join(
        mobileRoot,
        "app",
        "ai-buddy",
        "index.tsx"
      );
      const content = fs.readFileSync(aiBuddyPath, "utf8");
      assert.ok(
        content.includes("keyboardAvoiding={false}"),
        "AI Study Buddy must disable outer Screen keyboardAvoiding"
      );
      assert.ok(
        content.includes("scrollToEnd"),
        "AI Study Buddy must scroll chat to end when message input focuses"
      );
    });
  });
});
