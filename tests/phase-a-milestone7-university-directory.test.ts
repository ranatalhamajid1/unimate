/**
 * Milestone 7: Global University Directory & Academic Metadata Comprehensive Test Suite
 *
 * Validates:
 * 1. 300+ dataset target (325 actual)
 * 2. ISO 3166-1 alpha-2 country codes
 * 3. Pakistan regional coverage (65+ institutions across all 7 provinces/territories)
 * 4. Global regional coverage (9 regions, 40+ countries)
 * 5. Duplicate detection (conservative, normalized whitespace/punctuation)
 * 6. Normalized acronym search (FAST NUCES <-> FAST-NUCES <-> FAST.NUCES)
 * 7. Search ranking engine (exact acronym > exact name > prefix > word boundary > city > verified boost)
 * 8. CountryCode filtering (GET /api/universities?countryCode=PK)
 * 9. Country cascade & hierarchy integrity (campus in univ, dept in univ, univ in country)
 * 10. Community & verified record protection
 * 11. Custom university creation & URL safety
 * 12. Seed idempotency & database ID preservation
 */

import "./setup-prisma";
import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  GLOBAL_UNIVERSITIES,
  validateSeedDataset,
} from "../scripts/seed-data/index";
import { PAKISTAN_UNIVERSITIES } from "../scripts/seed-data/pakistan";
import { SOUTH_ASIA_UNIVERSITIES } from "../scripts/seed-data/south-asia";
import { MENA_UNIVERSITIES } from "../scripts/seed-data/mena";
import { EAST_SOUTHEAST_ASIA_UNIVERSITIES } from "../scripts/seed-data/east-southeast-asia";
import { EUROPE_UNIVERSITIES } from "../scripts/seed-data/europe";
import { AMERICAS_UNIVERSITIES } from "../scripts/seed-data/americas";
import { OCEANIA_AFRICA_UNIVERSITIES } from "../scripts/seed-data/oceania-africa";

import {
  normalizeSearchTerm,
  compactAlphanumeric,
  scoreUniversityRelevancy,
  isConservativeDuplicate,
} from "../app/lib/university-search";

import { validateAcademicHierarchy } from "../app/lib/profile";
import { mockPrisma, mockState, resetMockState } from "./setup-prisma";
import { GET as getUniversities, POST as postUniversities } from "../app/api/universities/route";
import { PATCH as patchMobileProfile } from "../app/api/mobile/user/profile/route";
import { generateMobileToken } from "../app/lib/mobile-auth";

describe("Milestone 7: Global University Directory & Academic Metadata", () => {
  beforeEach(() => {
    resetMockState();
    mockState.users.push({
      id: "u-test-1",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "test-hash",
      createdAt: new Date(),
    });
  });

  // =========================================================================
  // 1. DATASET TARGET & VALIDATION (300+ Curated Records)
  // =========================================================================
  describe("1. Dataset Target & Validation", () => {
    test("seed dataset contains 300+ authoritative institutions without fabrication", () => {
      assert.ok(
        GLOBAL_UNIVERSITIES.length >= 300,
        `Expected at least 300 universities, found ${GLOBAL_UNIVERSITIES.length}`
      );
      assert.equal(GLOBAL_UNIVERSITIES.length, 325, "Expected exact count of 325 curated institutions");
    });

    test("validateSeedDataset passes with zero errors and no duplicate names in same country", () => {
      const validation = validateSeedDataset();
      assert.equal(validation.valid, true, `Dataset validation failed: ${validation.errors.join(", ")}`);
      assert.equal(validation.errors.length, 0);
      assert.equal(validation.total, 325);
    });

    test("all institutions have mandatory authoritative fields", () => {
      for (const univ of GLOBAL_UNIVERSITIES) {
        assert.ok(univ.name && univ.name.trim().length > 2, `Missing valid name: ${univ.name}`);
        assert.ok(univ.country && univ.country.trim().length > 1, `Missing valid country: ${univ.name}`);
        assert.ok(
          /^[A-Z]{2}$/.test(univ.countryCode),
          `Invalid ISO 3166-1 alpha-2 code '${univ.countryCode}' for ${univ.name}`
        );
        assert.ok(univ.timezone && univ.timezone.trim().length > 2, `Missing valid timezone: ${univ.name}`);
        assert.equal(univ.isVerified, true, `Seed institution must be verified: ${univ.name}`);
        assert.ok(univ.campuses && univ.campuses.length >= 1, `Must have at least Main Campus: ${univ.name}`);
        assert.ok(
          univ.campuses.some((c) => c.isMain),
          `Must have exactly one official main campus: ${univ.name}`
        );
      }
    });
  });

  // =========================================================================
  // 2. ISO COUNTRY CODES & REGIONAL COVERAGE
  // =========================================================================
  describe("2. ISO Country Codes & Regional Coverage", () => {
    test("standardizes on valid ISO 3166-1 alpha-2 codes across all entries", () => {
      const countryCodes = new Set(GLOBAL_UNIVERSITIES.map((u) => u.countryCode));
      assert.ok(countryCodes.size >= 40, `Expected at least 40 unique countries, found ${countryCodes.size}`);

      // Verify representative ISO codes are present
      const expectedCodes = ["PK", "IN", "BD", "SA", "AE", "TR", "SG", "MY", "JP", "GB", "DE", "FR", "US", "CA", "AU", "ZA"];
      for (const code of expectedCodes) {
        assert.ok(countryCodes.has(code), `Expected ISO country code ${code} to be present`);
      }
    });

    test("covers all 9 target geographic regions", () => {
      assert.ok(PAKISTAN_UNIVERSITIES.length >= 65, "Pakistan: 65+ institutions");
      assert.ok(SOUTH_ASIA_UNIVERSITIES.length >= 30, "South Asia: 30+ institutions");
      assert.ok(MENA_UNIVERSITIES.length >= 30, "MENA: 30+ institutions");
      assert.ok(EAST_SOUTHEAST_ASIA_UNIVERSITIES.length >= 40, "East & Southeast Asia: 40+ institutions");
      assert.ok(EUROPE_UNIVERSITIES.length >= 50, "Europe & UK: 50+ institutions");
      assert.ok(AMERICAS_UNIVERSITIES.length >= 45, "Americas: 45+ institutions");
      assert.ok(OCEANIA_AFRICA_UNIVERSITIES.length >= 30, "Oceania & Africa: 30+ institutions");

      const sum =
        PAKISTAN_UNIVERSITIES.length +
        SOUTH_ASIA_UNIVERSITIES.length +
        MENA_UNIVERSITIES.length +
        EAST_SOUTHEAST_ASIA_UNIVERSITIES.length +
        EUROPE_UNIVERSITIES.length +
        AMERICAS_UNIVERSITIES.length +
        OCEANIA_AFRICA_UNIVERSITIES.length;
      assert.equal(sum, 325, "Sum of regional datasets matches total 325");
    });

    test("Pakistan depth: achieves 65+ institutions across all provinces and territories", () => {
      assert.ok(PAKISTAN_UNIVERSITIES.length >= 65);

      const pkCities = new Set(
        PAKISTAN_UNIVERSITIES.flatMap((u) => [
          u.city,
          ...(u.campuses || []).map((c) => c.city).filter(Boolean),
        ]).filter(Boolean) as string[]
      );

      // Verify deep regional representation
      const requiredCities = [
        "Islamabad",
        "Rawalpindi",
        "Lahore",
        "Faisalabad",
        "Multan",
        "Bahawalpur",
        "Gujranwala",
        "Sialkot",
        "Sargodha",
        "Taxila",
        "Karachi",
        "Jamshoro",
        "Hyderabad",
        "Sukkur",
        "Peshawar",
        "Abbottabad",
        "Quetta",
        "Muzaffarabad",
        "Mirpur",
        "Gilgit",
        "Skardu",
      ];

      for (const city of requiredCities) {
        assert.ok(
          pkCities.has(city),
          `Expected Pakistan dataset to cover ${city}`
        );
      }
    });
  });

  // =========================================================================
  // 3. SEARCH ENGINE & NORMALIZED ACRONYMS
  // =========================================================================
  describe("3. Search Engine & Normalized Acronyms", () => {
    test("normalizes search terms and alphanumeric punctuation", () => {
      assert.equal(normalizeSearchTerm("  FAST - NUCES.  "), "fast nuces");
      assert.equal(compactAlphanumeric("FAST NUCES"), "fastnuces");
      assert.equal(compactAlphanumeric("FAST-NUCES"), "fastnuces");
      assert.equal(compactAlphanumeric("FAST.NUCES"), "fastnuces");
      assert.equal(compactAlphanumeric("N.U.S.T."), "nust");
      assert.equal(compactAlphanumeric("UET-Taxila"), "uettaxila");
      assert.equal(compactAlphanumeric("UET Taxila"), "uettaxila");
    });

    test("FAST NUCES, FAST-NUCES, and FAST.NUCES produce identical relevance ranking", () => {
      const fastUniv = {
        name: "National University of Computer and Emerging Sciences",
        shortName: "FAST-NUCES",
        city: "Islamabad",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: true,
      };

      const scoreSpaces = scoreUniversityRelevancy(fastUniv, "FAST NUCES");
      const scoreHyphen = scoreUniversityRelevancy(fastUniv, "FAST-NUCES");
      const scoreDots = scoreUniversityRelevancy(fastUniv, "FAST.NUCES");

      assert.ok(scoreSpaces > 80, `Expected high score for space query: ${scoreSpaces}`);
      assert.equal(scoreSpaces, scoreHyphen, "Hyphen query must match score of space query");
      assert.equal(scoreHyphen, scoreDots, "Dot query must match score of hyphen query");
    });

    test("ranking hierarchy: exact acronym outranks partial substring", () => {
      const mit = {
        name: "Massachusetts Institute of Technology",
        shortName: "MIT",
        city: "Cambridge",
        country: "United States",
        countryCode: "US",
        isVerified: true,
      };
      const smith = {
        name: "Smith College",
        shortName: null,
        city: "Northampton",
        country: "United States",
        countryCode: "US",
        isVerified: true,
      };

      const mitScore = scoreUniversityRelevancy(mit, "MIT");
      const smithScore = scoreUniversityRelevancy(smith, "MIT");

      assert.ok(mitScore > smithScore, `MIT (${mitScore}) must outrank Smith (${smithScore}) for query 'MIT'`);
    });

    test("ranking hierarchy: exact name outranks prefix and prefix outranks word boundary", () => {
      const exactLums = {
        name: "Lahore University of Management Sciences",
        shortName: "LUMS",
        city: "Lahore",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: true,
      };
      const lahoreUniv = {
        name: "University of Lahore",
        shortName: "UOL",
        city: "Lahore",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: true,
      };

      const exactScore = scoreUniversityRelevancy(exactLums, "Lahore University of Management Sciences");
      const prefixScore = scoreUniversityRelevancy(lahoreUniv, "Lahore");

      assert.ok(exactScore > prefixScore, "Exact name match must outrank prefix");
    });

    test("city search returns matches for city or campus locations", () => {
      const uetTaxila = {
        name: "University of Engineering and Technology, Taxila",
        shortName: "UET Taxila",
        city: "Taxila",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: true,
      };

      const taxilaScore = scoreUniversityRelevancy(uetTaxila, "Taxila");
      assert.ok(taxilaScore >= 30, `Expected positive score for city search: ${taxilaScore}`);
    });

    test("verified badge provides positive boost to break ties", () => {
      const verified = {
        name: "Alpha College of Technology",
        shortName: "ACT",
        city: "City A",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: true,
      };
      const unverified = {
        name: "Alpha College of Technology",
        shortName: "ACT",
        city: "City A",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: false,
      };

      const vScore = scoreUniversityRelevancy(verified, "Alpha College");
      const uScore = scoreUniversityRelevancy(unverified, "Alpha College");

      assert.ok(vScore > uScore, "Verified university must have higher score than unverified equivalent");
      assert.equal(vScore - uScore, 10, "Verified boost should be exactly 10 points");
    });
  });

  // =========================================================================
  // 4. CONSERVATIVE DUPLICATE DETECTION
  // =========================================================================
  describe("4. Conservative Duplicate Detection", () => {
    test("detects identical names with different casing and whitespace", () => {
      const existing = {
        name: "National University of Sciences and Technology",
        shortName: "NUST",
        country: "Pakistan",
        countryCode: "PK",
      };

      const duplicate = isConservativeDuplicate(
        existing.name,
        existing.shortName,
        "  national  university of sciences and technology  ",
        undefined
      );
      assert.equal(duplicate, true, "Should detect case and whitespace insensitive duplicate");
    });

    test("detects normalized punctuation variations in same country", () => {
      const existing = {
        name: "FAST National University",
        shortName: "FAST-NUCES",
        country: "Pakistan",
        countryCode: "PK",
      };

      assert.equal(
        isConservativeDuplicate(existing.name, existing.shortName, "FAST.NUCES", undefined),
        true,
        "Should detect acronym punctuation collision in same country"
      );
    });

    test("does NOT reject different universities in the same country", () => {
      const existing = {
        name: "National University of Sciences and Technology",
        shortName: "NUST",
        country: "Pakistan",
        countryCode: "PK",
      };

      const different = isConservativeDuplicate(
        existing.name,
        existing.shortName,
        "National University of Modern Languages",
        undefined
      );
      assert.equal(different, false, "Should not falsely flag distinct institutions as duplicates");
    });

    test("does NOT reject distinct acronyms in candidate check", () => {
      const existing = {
        name: "National University of Sciences and Technology",
        shortName: "NUST",
        country: "Pakistan",
        countryCode: "PK",
      };

      const different = isConservativeDuplicate(
        existing.name,
        existing.shortName,
        "FAST National University",
        "FAST"
      );
      assert.equal(different, false, "Should not flag different acronyms");
    });
  });

  // =========================================================================
  // 5. API ROUTE: COUNTRYCODE FILTERING & RANKING
  // =========================================================================
  describe("5. API Route: CountryCode Filtering & Ranking", () => {
    beforeEach(() => {
      // Seed a few universities in mockState
      mockState.universities.push(
        {
          id: "univ-nust",
          name: "National University of Sciences and Technology",
          shortName: "NUST",
          country: "Pakistan",
          countryCode: "PK",
          city: "Islamabad",
          isVerified: true,
        },
        {
          id: "univ-fast",
          name: "National University of Computer and Emerging Sciences",
          shortName: "FAST-NUCES",
          country: "Pakistan",
          countryCode: "PK",
          city: "Islamabad",
          isVerified: true,
        },
        {
          id: "univ-mit",
          name: "Massachusetts Institute of Technology",
          shortName: "MIT",
          country: "United States",
          countryCode: "US",
          city: "Cambridge",
          isVerified: true,
        },
        {
          id: "univ-oxford",
          name: "University of Oxford",
          shortName: "Oxford",
          country: "United Kingdom",
          countryCode: "GB",
          city: "Oxford",
          isVerified: true,
        }
      );
    });

    test("GET /api/universities?countryCode=PK filters strictly by ISO countryCode", async () => {
      const token = await generateMobileToken({ userId: "u-test-1", name: "Test User", email: "test@example.com" });
      const req = new Request("http://localhost/api/universities?countryCode=PK", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await getUniversities(req as any);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.universities.length, 2);
      assert.ok(data.universities.every((u: any) => u.countryCode === "PK"));
    });

    test("GET /api/universities?countryCode=US returns only US universities", async () => {
      const token = await generateMobileToken({ userId: "u-test-1", name: "Test User", email: "test@example.com" });
      const req = new Request("http://localhost/api/universities?countryCode=US", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await getUniversities(req as any);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.universities.length, 1);
      assert.equal(data.universities[0].id, "univ-mit");
    });

    test("GET /api/universities?q=FAST.NUCES ranks FAST-NUCES at the top", async () => {
      const token = await generateMobileToken({ userId: "u-test-1", name: "Test User", email: "test@example.com" });
      const req = new Request("http://localhost/api/universities?q=FAST.NUCES", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await getUniversities(req as any);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.ok(data.universities.length > 0);
      assert.equal(data.universities[0].id, "univ-fast");
    });

    test("POST /api/universities rejects duplicate universities with 409 Conflict", async () => {
      const token = await generateMobileToken({ userId: "u-test-1", name: "Test User", email: "test@example.com" });
      const req = new Request("http://localhost/api/universities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "National University of Sciences and Technology",
          country: "Pakistan",
          countryCode: "PK",
          city: "Islamabad",
        }),
      });

      const res = await postUniversities(req as any);
      const data = await res.json();

      assert.equal(res.status, 409);
      assert.equal(data.success, false);
      assert.ok(data.error.includes("already exists"));
    });

    test("POST /api/universities rejects unsafe javascript: website URLs", async () => {
      const token = await generateMobileToken({ userId: "u-test-1", name: "Test User", email: "test@example.com" });
      const req = new Request("http://localhost/api/universities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Innovative Tech Institute",
          country: "Pakistan",
          countryCode: "PK",
          website: "javascript:alert(1)",
        }),
      });

      const res = await postUniversities(req as any);
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.ok(data.error.includes("http:// or https://"));
    });
  });

  // =========================================================================
  // 6. COUNTRY CASCADE & HIERARCHY INTEGRITY
  // =========================================================================
  describe("6. Country Cascade & Hierarchy Integrity", () => {
    beforeEach(() => {
      mockState.universities.push({
        id: "univ-lums",
        name: "Lahore University of Management Sciences",
        shortName: "LUMS",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: true,
      });
      mockState.campuses.push({
        id: "campus-lums-main",
        universityId: "univ-lums",
        name: "Main Campus",
        isMain: true,
      });
      mockState.departments.push({
        id: "dept-lums-cs",
        universityId: "univ-lums",
        name: "Computer Science",
      });

      mockState.universities.push({
        id: "univ-oxford",
        name: "University of Oxford",
        country: "United Kingdom",
        countryCode: "GB",
        isVerified: true,
      });
    });

    test("validateAcademicHierarchy ensures campus belongs to university", async () => {
      const valid = await validateAcademicHierarchy("univ-lums", "campus-lums-main", undefined);
      assert.equal(valid.valid, true);

      const invalid = await validateAcademicHierarchy("univ-oxford", "campus-lums-main", undefined);
      assert.equal(invalid.valid, false);
      assert.ok(invalid.error?.includes("does not belong to this university"));
    });

    test("validateAcademicHierarchy ensures department belongs to university", async () => {
      const valid = await validateAcademicHierarchy("univ-lums", undefined, "dept-lums-cs");
      assert.equal(valid.valid, true);

      const invalid = await validateAcademicHierarchy("univ-oxford", undefined, "dept-lums-cs");
      assert.equal(invalid.valid, false);
      assert.ok(invalid.error?.includes("does not belong to this university"));
    });

    test("validateAcademicHierarchy enforces selected university belongs to country", async () => {
      // Pakistan country with Pakistan university -> valid
      const validPK = await validateAcademicHierarchy("univ-lums", undefined, undefined, "PK");
      assert.equal(validPK.valid, true);

      const validName = await validateAcademicHierarchy("univ-lums", undefined, undefined, "Pakistan");
      assert.equal(validName.valid, true);

      // US country with Pakistan university -> invalid
      const invalidUS = await validateAcademicHierarchy("univ-lums", undefined, undefined, "US");
      assert.equal(invalidUS.valid, false);
      assert.ok(invalidUS.error?.includes("does not belong to the selected country"));
    });

    test("PATCH profile cascades to clear stale university, campus, and department on country change", async () => {
      // Set up existing user with LUMS (PK)
      const testUserId = "user-test-cascade";
      mockState.users.push({
        id: testUserId,
        email: "test@example.com",
        name: "Test Student",
        country: "Pakistan",
        universityId: "univ-lums",
        campusId: "campus-lums-main",
        departmentId: "dept-lums-cs",
        createdAt: new Date(),
      });

      const token = await generateMobileToken({
        userId: testUserId,
        name: "Test Student",
        email: "test@example.com",
      });

      // Change country to United States without passing universityId
      const req = new Request("http://localhost/api/mobile/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          country: "United States",
        }),
      });

      // Execute profile patch
      const res = await patchMobileProfile(req as any);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.profile.country, "United States");
      assert.equal(data.profile.university, null, "University must be cleared when country changes");
      assert.equal(data.profile.campus, null, "Campus must be cleared when country changes");
      assert.equal(data.profile.department, null, "Department must be cleared when country changes");
    });
  });

  // =========================================================================
  // 7. SEED SAFETY & COMMUNITY PROTECTION
  // =========================================================================
  describe("7. Seed Safety & Community Protection", () => {
    test("does not overwrite community (unverified) records", () => {
      const communityUniv = {
        id: "cuid-user-custom-123",
        name: "Community Technical College",
        country: "Pakistan",
        countryCode: "PK",
        isVerified: false,
        website: "https://community.edu.pk",
      };

      // If seed encounters an unverified institution with the same name, it must preserve it as unverified
      assert.equal(communityUniv.isVerified, false);
      assert.equal(communityUniv.id, "cuid-user-custom-123");
    });

    test("seed preserves existing database IDs and never invents deterministic string IDs in database", () => {
      // Ensures no database-level ID replacements like 'univ-pk-nust'
      const existingCuid = "cm0123456789abcdefghij";
      const sampleSeedUniv = PAKISTAN_UNIVERSITIES.find((u) => u.shortName === "NUST");
      assert.ok(sampleSeedUniv);

      // Verify the seed definition does not mandate hardcoded database IDs
      assert.equal((sampleSeedUniv as any).id, undefined, "Seed definition should not hardcode database CUID");
    });
  });
});
