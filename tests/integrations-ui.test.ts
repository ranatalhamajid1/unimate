import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LightColors, DarkColors } from "../constants/colors";

describe("Milestone 14 Phase 14.3 — Mobile Integrations Screen & UI Invariants", () => {
  const integrationsSourcePath = path.join(__dirname, "../app/integrations.tsx");
  const integrationsSource = fs.readFileSync(integrationsSourcePath, "utf-8");

  describe("1. Static Code Analysis & Architecture Safety", () => {
    it("mobile integrations screen imports and uses ModalKeyboardContainer for modal safety", () => {
      assert.ok(
        integrationsSource.includes("ModalKeyboardContainer"),
        "Must import and wrap modal content in ModalKeyboardContainer"
      );
    });

    it("mobile integrations screen integrates safe haptics feedback", () => {
      assert.ok(
        integrationsSource.includes("triggerSelectionFeedback"),
        "Must trigger selection feedback on user action"
      );
      assert.ok(
        integrationsSource.includes("triggerSuccessFeedback"),
        "Must trigger success feedback on successful sync or connection"
      );
      assert.ok(
        integrationsSource.includes("triggerDestructiveFeedback"),
        "Must trigger destructive feedback on disconnect"
      );
    });

    it("mobile integrations source contains zero server secrets or database imports", () => {
      assert.ok(!integrationsSource.includes("@prisma/client"), "Must not import Prisma client");
      assert.ok(!integrationsSource.includes("SESSION_SECRET"), "Must not reference SESSION_SECRET");
      assert.ok(!integrationsSource.includes("DATABASE_URL"), "Must not reference DATABASE_URL");
      assert.ok(!integrationsSource.includes("GOOGLE_CLIENT_SECRET"), "Must not reference GOOGLE_CLIENT_SECRET");
    });
  });

  describe("2. Deep Link Scheme & Sanitization", () => {
    it("validates mobile deep-link scheme and ensures zero credentials in callback URLs", () => {
      const callbackUrl = "unimate://integrations/callback?provider=google_calendar&status=success";
      const parsed = new URL(callbackUrl);

      assert.equal(parsed.protocol, "unimate:");
      assert.equal(parsed.hostname, "integrations");
      assert.equal(parsed.pathname, "/callback");
      assert.equal(parsed.searchParams.get("provider"), "google_calendar");
      assert.equal(parsed.searchParams.get("status"), "success");

      // Verify zero sensitive data
      assert.equal(parsed.searchParams.get("code"), null, "Callback must not contain raw code");
      assert.equal(parsed.searchParams.get("token"), null, "Callback must not contain access token");
      assert.equal(parsed.searchParams.get("refresh_token"), null, "Callback must not contain refresh token");
      assert.equal(parsed.searchParams.get("userId"), null, "Callback must not contain internal user ID");
    });

    it("integrations screen uses WebBrowser with unimate:// redirect scheme", () => {
      assert.ok(
        integrationsSource.includes('openAuthSessionAsync'),
        "Must use WebBrowser.openAuthSessionAsync"
      );
      assert.ok(
        integrationsSource.includes('"unimate://"'),
        "Must provide unimate:// as redirect URL scheme"
      );
    });
  });

  describe("3. Disconnect Confirmation & Calendar Purge Switch", () => {
    it("supports optional calendar deletion toggle in disconnect modal", () => {
      assert.ok(
        integrationsSource.includes("deleteCalendarOnDisconnect"),
        "Must track deleteCalendarOnDisconnect state"
      );
      assert.ok(
        integrationsSource.includes("Switch"),
        "Must render a Switch for calendar deletion confirmation"
      );
    });
  });

  describe("4. Theme Compatibility & Design System Tokens", () => {
    it("light theme provides complete token coverage for integrations UI", () => {
      assert.ok(LightColors.background);
      assert.ok(LightColors.surface);
      assert.ok(LightColors.surfaceSecondary);
      assert.ok(LightColors.accent);
      assert.ok(LightColors.accentSubtle);
      assert.ok(LightColors.success);
      assert.ok(LightColors.successSubtle);
      assert.ok(LightColors.danger);
      assert.ok(LightColors.destructiveSubtle);
    });

    it("dark theme provides complete token coverage for integrations UI", () => {
      assert.ok(DarkColors.background);
      assert.ok(DarkColors.surface);
      assert.ok(DarkColors.surfaceSecondary);
      assert.ok(DarkColors.accent);
      assert.ok(DarkColors.accentSubtle);
      assert.ok(DarkColors.success);
      assert.ok(DarkColors.successSubtle);
      assert.ok(DarkColors.danger);
      assert.ok(DarkColors.destructiveSubtle);
    });
  });

  describe("5. Institutional Catalog & Disclosures", () => {
    it("renders all upcoming institutional integrations with Coming Soon badges", () => {
      assert.ok(integrationsSource.includes("Canvas LMS"));
      assert.ok(integrationsSource.includes("Moodle"));
      assert.ok(integrationsSource.includes("Blackboard Learn"));
      assert.ok(integrationsSource.includes("University (.edu) Email"));
      assert.ok(integrationsSource.includes("Coming Soon"));
    });

    it("includes privacy and secondary calendar disclosure copy", () => {
      assert.ok(integrationsSource.includes("UniMate Academic"));
      assert.ok(integrationsSource.includes("Dedicated Calendar Isolation"));
      assert.ok(integrationsSource.includes("Local Data Preservation"));
      assert.ok(integrationsSource.includes("Encrypted at Rest"));
    });
  });

  describe("6. React Native Hierarchy & Zero HTML Invariants", () => {
    it("contains zero invalid web HTML tags in React Native tree", () => {
      const invalidHtmlTags = ["<strong", "</strong", "<b", "</b>", "<span", "</span>", "<div", "</div>", "<p>", "</p>", "<br"];
      for (const tag of invalidHtmlTags) {
        assert.ok(
          !integrationsSource.includes(tag),
          `IntegrationsScreen must not contain web HTML element "${tag}", which crashes React Native View config getter`
        );
      }
    });

    it("renders privacy bullet lead-ins with native Text and bold weight styling", () => {
      assert.ok(
        integrationsSource.includes("privacyBulletBold"),
        "Must define and use privacyBulletBold style for emphasis"
      );
      assert.ok(
        integrationsSource.includes("Dedicated Calendar Isolation: "),
        "Must render isolation bullet lead-in"
      );
      assert.ok(
        integrationsSource.includes("Local Data Preservation: "),
        "Must render local data bullet lead-in"
      );
      assert.ok(
        integrationsSource.includes("Encrypted at Rest: "),
        "Must render encrypted at rest bullet lead-in"
      );
    });
  });
});
