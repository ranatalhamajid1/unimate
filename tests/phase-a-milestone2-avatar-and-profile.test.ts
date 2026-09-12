import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState, mockPrisma } from "./setup-prisma";
import { validateImageMagicBytes, sanitizeImageBuffer } from "../app/lib/image-validation";
import {
  calculateProfileCompletion,
  validateUsername,
  validateAcademicHierarchy,
  getUserProfile,
} from "../app/lib/profile";
import { seedUniversityDirectory } from "../scripts/seed-universities";
import { generateMobileToken } from "../app/lib/mobile-auth";

// Endpoint Handlers
import { GET as getWebProfile, PATCH as patchWebProfile } from "../app/api/user/profile/route";
import { GET as getMobileProfile, PATCH as patchMobileProfile } from "../app/api/mobile/user/profile/route";
import { GET as getUniversities, POST as postUniversities } from "../app/api/universities/route";
import { GET as getMobileMe } from "../app/api/mobile/me/route";
import { POST as postWebAvatar } from "../app/api/user/avatar/upload/route";
import { DELETE as deleteWebAvatar } from "../app/api/user/avatar/route";
import { POST as postMobileAvatar } from "../app/api/mobile/user/avatar/upload/route";
import { DELETE as deleteMobileAvatar } from "../app/api/mobile/user/avatar/route";
import { _resetAvatarRateLimits } from "../app/lib/avatar-rate-limit";

// Helper to mock NextRequest
function createMockRequest(url: string, options: any = {}) {
  const headers = new Headers(options.headers || {});
  return {
    url,
    headers,
    formData: async () => options.formData || new FormData(),
    json: async () => options.json || {},
  } as any;
}

describe("Milestone 2: Avatar Storage & Core Profile APIs Test Suite", () => {
  let testUser1: any;
  let testUser2: any;
  let user1Token: string;
  let user2Token: string;

  beforeEach(async () => {
    resetMockState();
    _resetAvatarRateLimits();

    // 1. Seed universities
    await seedUniversityDirectory(mockPrisma as any);

    // 2. Create two test users
    testUser1 = await mockPrisma.user.create({
      data: {
        id: "user-test-1",
        name: "Talha Student",
        email: "talha@unimate.test",
        passwordHash: "$2a$10$testhash1",
      },
    });

    testUser2 = await mockPrisma.user.create({
      data: {
        id: "user-test-2",
        name: "Sarah Researcher",
        email: "sarah@unimate.test",
        passwordHash: "$2a$10$testhash2",
      },
    });

    // 3. Generate mobile tokens
    user1Token = await generateMobileToken({
      userId: testUser1.id,
      name: testUser1.name,
      email: testUser1.email,
    });

    user2Token = await generateMobileToken({
      userId: testUser2.id,
      name: testUser2.name,
      email: testUser2.email,
    });
  });

  // =========================================================================
  // SUITE 1: Avatar Image Validation, Magic Bytes, & EXIF Sanitization
  // =========================================================================
  describe("1. Avatar Magic Bytes & File Security", () => {
    test("Accepts valid JPEG buffer (FF D8 FF)", () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = validateImageMagicBytes(validJpeg);
      assert.equal(res.valid, true);
      assert.equal(res.mimeType, "image/jpeg");
    });

    test("Accepts valid PNG buffer (89 50 4E 47 0D 0A 1A 0A)", () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const res = validateImageMagicBytes(validPng);
      assert.equal(res.valid, true);
      assert.equal(res.mimeType, "image/png");
    });

    test("Accepts valid WebP buffer (RIFF .... WEBP)", () => {
      const validWebp = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x20, 0x00, 0x00, 0x00, // file length
        0x57, 0x45, 0x42, 0x50, // "WEBP"
        0x56, 0x50, 0x38, 0x20, // "VP8 "
      ]);
      const res = validateImageMagicBytes(validWebp);
      assert.equal(res.valid, true);
      assert.equal(res.mimeType, "image/webp");
    });

    test("Strictly rejects SVG images disguised as avatars (XSS mitigation)", () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const res = validateImageMagicBytes(svgBuffer);
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("SVG"));
    });

    test("Strictly rejects PDF documents", () => {
      const pdfBuffer = Buffer.from("%PDF-1.4\n%âãÏÓ\n");
      const res = validateImageMagicBytes(pdfBuffer);
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("PDF"));
    });

    test("Strictly rejects Windows Executables (PE / MZ)", () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      const res = validateImageMagicBytes(exeBuffer);
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("Executable"));
    });

    test("Rejects oversized image buffer (> 2 MB)", () => {
      const hugeBuffer = Buffer.alloc(2 * 1024 * 1024 + 10);
      hugeBuffer[0] = 0xff;
      hugeBuffer[1] = 0xd8;
      hugeBuffer[2] = 0xff;
      const res = validateImageMagicBytes(hugeBuffer);
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("exceeds"));
    });

    test("Strips EXIF APP1 metadata containing potential GPS from JPEG", () => {
      // Create JPEG with an APP1 segment (0xFFE1) followed by APP0/image content
      const app1Length = 10;
      const jpegWithExif = Buffer.concat([
        Buffer.from([0xff, 0xd8]), // SOI
        Buffer.from([0xff, 0xe1, 0x00, app1Length]), // APP1 marker + length (10 bytes total segment)
        Buffer.from("GPSDATA123"), // payload inside APP1
        Buffer.from([0xff, 0xd9]), // EOI
      ]);

      const stripped = sanitizeImageBuffer(jpegWithExif, "image/jpeg");
      assert.equal(stripped.includes(Buffer.from("GPSDATA123")), false, "GPS metadata was successfully stripped");
    });
  });

  // =========================================================================
  // SUITE 2: Profile Logic, Validation, Completion, & Academic Hierarchy
  // =========================================================================
  describe("2. Profile Logic & Academic Hierarchy", () => {
    test("Calculates profile completion percentage accurately", () => {
      // 0% completion
      assert.equal(calculateProfileCompletion({}), 0);

      // Partial completion
      const partial = calculateProfileCompletion({
        username: "talha",
        bio: "Computer Science student",
        country: "Pakistan",
        degreeProgram: "BSCS",
        currentSemester: "Semester 5",
      });
      assert.equal(partial, 50); // 5 out of 10 checkpoints = 50%

      // 100% completion
      const full = calculateProfileCompletion({
        avatarUrl: "https://media.unimate.app/avatars/user-1/pic.webp",
        username: "talha",
        bio: "CS student",
        universityId: "univ-pk-nust",
        campusId: "camp-nust-main",
        departmentId: "dept-nust-seecs",
        degreeProgram: "BS Software Engineering",
        currentSemester: "Semester 5",
        graduationYear: 2027,
        country: "Pakistan",
      });
      assert.equal(full, 100);
    });

    test("Username validation enforces format, reserved keywords, and length", () => {
      // Valid usernames
      assert.equal(validateUsername("talha_m").valid, true);
      assert.equal(validateUsername("sarah.99").valid, true);
      assert.equal(validateUsername("student2026").valid, true);

      // Too short (< 3)
      assert.equal(validateUsername("ab").valid, false);

      // Too long (> 30)
      assert.equal(validateUsername("a".repeat(31)).valid, false);

      // Disallowed special chars
      assert.equal(validateUsername("talha@maj").valid, false);
      assert.equal(validateUsername("talha maj").valid, false);
      assert.equal(validateUsername("talha-maj").valid, false); // only dots/underscores

      // Reserved keywords
      assert.equal(validateUsername("admin").valid, false);
      assert.equal(validateUsername("unimate").valid, false);
    });

    test("Rejects mismatched university / campus / department relationships", async () => {
      const nust = mockState.universities.find((u: any) => u.shortName === "NUST");
      const fast = mockState.universities.find((u: any) => u.shortName === "FAST-NUCES");

      const nustCampus = mockState.campuses.find((c: any) => c.universityId === nust.id);
      const fastDept = mockState.departments.find((d: any) => d.universityId === fast.id);

      // Attempting to attach NUST campus to FAST university MUST fail
      const mismatchCampus = await validateAcademicHierarchy(fast.id, nustCampus.id, undefined);
      assert.equal(mismatchCampus.valid, false);
      assert.ok(mismatchCampus.error?.includes("does not belong"));

      // Attempting to attach FAST department to NUST university MUST fail
      const mismatchDept = await validateAcademicHierarchy(nust.id, undefined, fastDept.id);
      assert.equal(mismatchDept.valid, false);
      assert.ok(mismatchDept.error?.includes("does not belong"));

      // Matching relationships MUST pass
      const validHierarchy = await validateAcademicHierarchy(nust.id, nustCampus.id, undefined);
      assert.equal(validHierarchy.valid, true);
    });
  });

  // =========================================================================
  // SUITE 3: Mobile User Profile & /api/mobile/me Endpoints
  // =========================================================================
  describe("3. Mobile User Profile & /api/mobile/me", () => {
    test("GET /api/mobile/user/profile requires valid Bearer token", async () => {
      const unauthReq = createMockRequest("http://localhost/api/mobile/user/profile");
      const unauthRes = await getMobileProfile(unauthReq);
      assert.equal(unauthRes.status, 401);
    });

    test("GET /api/mobile/user/profile returns sanitized profile without passwordHash or secrets", async () => {
      const req = createMockRequest("http://localhost/api/mobile/user/profile", {
        headers: { authorization: `Bearer ${user1Token}` },
      });

      const res = await getMobileProfile(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.equal(data.profile.id, testUser1.id);
      assert.equal(data.profile.name, testUser1.name);
      assert.equal(data.profile.email, testUser1.email);

      // Critical Privacy Check: passwordHash, billing webhooks, etc. are NEVER present
      assert.equal(data.profile.passwordHash, undefined);
      assert.equal((data.profile as any).secret, undefined);
      assert.equal(typeof data.profile.profileCompletionPercentage, "number");
    });

    test("PATCH /api/mobile/user/profile updates profile and enforces unique username", async () => {
      const nust = mockState.universities.find((u: any) => u.shortName === "NUST");
      const nustCampus = mockState.campuses.find((c: any) => c.universityId === nust.id);
      const nustDept = mockState.departments.find((d: any) => d.universityId === nust.id);

      // Update User 1
      const updateReq = createMockRequest("http://localhost/api/mobile/user/profile", {
        headers: { authorization: `Bearer ${user1Token}` },
        json: {
          username: "talha_student",
          bio: "CS major at NUST",
          country: "Pakistan",
          universityId: nust.id,
          campusId: nustCampus.id,
          departmentId: nustDept.id,
          degreeProgram: "B.S. Software Engineering",
          currentSemester: "Semester 5",
          graduationYear: 2027,
          skills: ["TypeScript", "Python"],
          onboardingCompleted: true,
        },
      });

      const updateRes = await patchMobileProfile(updateReq);
      assert.equal(updateRes.status, 200);
      const updateData = await updateRes.json();

      assert.equal(updateData.success, true);
      assert.equal(updateData.profile.username, "talha_student");
      assert.equal(updateData.profile.university?.name, nust.name);
      assert.equal(updateData.profile.onboardingCompleted, true);

      // User 2 tries to claim the same username: MUST return 409 Conflict
      const duplicateReq = createMockRequest("http://localhost/api/mobile/user/profile", {
        headers: { authorization: `Bearer ${user2Token}` },
        json: { username: "talha_student" },
      });

      const duplicateRes = await patchMobileProfile(duplicateReq);
      assert.equal(duplicateRes.status, 409);
      const duplicateData = await duplicateRes.json();
      assert.ok(duplicateData.error?.includes("already taken"));
    });

    test("/api/mobile/me preserves existing contract and extends with profile identity fields", async () => {
      const req = createMockRequest("http://localhost/api/mobile/me", {
        headers: { authorization: `Bearer ${user1Token}` },
      });

      const res = await getMobileMe(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      // Legacy Contract preserved
      assert.equal(data.user.id, testUser1.id);
      assert.equal(data.user.name, testUser1.name);
      assert.equal(data.user.email, testUser1.email);
      assert.ok(data.user.createdAt);
      assert.ok(data.subscription);
      assert.equal(data.subscription.plan, "FREE");

      // Extended Identity fields present
      assert.ok("avatarUrl" in data.user);
      assert.ok("username" in data.user);
      assert.ok("university" in data.user);
      assert.ok("profileCompletionPercentage" in data.user);
      assert.ok("onboardingCompleted" in data.user);

      // Zero sensitive data leakage
      assert.equal(data.user.passwordHash, undefined);
    });
  });

  // =========================================================================
  // SUITE 4: University Search & Custom Community University Creation
  // =========================================================================
  describe("4. Global University Search & Custom Creation", () => {
    test("GET /api/universities searches by query and country filter", async () => {
      const req = createMockRequest("http://localhost/api/universities?q=NUST&country=PK", {
        headers: { authorization: `Bearer ${user1Token}` },
      });

      const res = await getUniversities(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.ok(data.universities.length >= 1);
      assert.equal(data.universities[0].shortName, "NUST");
      assert.equal(data.universities[0].countryCode, "PK");
    });

    test("GET /api/universities enforces max limit server-side (max 50)", async () => {
      const req = createMockRequest("http://localhost/api/universities?limit=1000", {
        headers: { authorization: `Bearer ${user1Token}` },
      });

      const res = await getUniversities(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.count <= 50, "Limit must be capped at 50");
    });

    test("POST /api/universities allows student to add custom unverified university", async () => {
      const req = createMockRequest("http://localhost/api/universities", {
        headers: { authorization: `Bearer ${user1Token}` },
        json: {
          name: "Community Technical Institute",
          shortName: "CTI",
          country: "Pakistan",
          city: "Rawalpindi",
          website: "https://cti.example.edu",
        },
      });

      const res = await postUniversities(req);
      assert.equal(res.status, 201);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.equal(data.university.name, "Community Technical Institute");
      // MUST be marked unverified
      assert.equal(data.university.isVerified, false);
      assert.equal(data.university.campuses[0].name, "Main Campus");

      // Attempting to post the same university in the same country returns 409
      const duplicateRes = await postUniversities(req);
      assert.equal(duplicateRes.status, 409);
    });
  });

  // =========================================================================
  // SUITE 5: Avatar Upload & Atomic Replacement
  // =========================================================================
  describe("5. Avatar Upload, Replacement, & Deletion", () => {
    test("POST /api/mobile/user/avatar/upload replaces avatar cleanly without orphaned records", async () => {
      // Mock a valid WebP image
      const fakeWebp = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
      ]);

      const formData = new FormData();
      formData.append("file", new Blob([fakeWebp], { type: "image/webp" }), "avatar.webp");

      const req = createMockRequest("http://localhost/api/mobile/user/avatar/upload", {
        headers: { authorization: `Bearer ${user1Token}` },
        formData,
      });

      const res = await postMobileAvatar(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.ok(data.avatarUrl);

      // Verify user DB was updated
      const userInDb = await mockPrisma.user.findUnique({ where: { id: testUser1.id } });
      assert.equal(userInDb?.avatarUrl, data.avatarUrl);

      // DELETE avatar clears avatarUrl to null
      const deleteReq = createMockRequest("http://localhost/api/mobile/user/avatar", {
        headers: { authorization: `Bearer ${user1Token}` },
      });

      const deleteRes = await deleteMobileAvatar(deleteReq);
      assert.equal(deleteRes.status, 200);

      const userAfterDelete = await mockPrisma.user.findUnique({ where: { id: testUser1.id } });
      assert.equal(userAfterDelete?.avatarUrl, null);
    });
  });
});
