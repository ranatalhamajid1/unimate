import "./setup-prisma";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState, mockPrisma } from "./setup-prisma";
import { seedUniversityDirectory, SEED_UNIVERSITIES } from "../scripts/seed-universities";

describe("Milestone 1: Database Migration & Global University Directory Test Suite", () => {
  beforeEach(() => {
    resetMockState();
  });

  test("1. Seed script runs idempotently and populates universities, campuses, and departments", async () => {
    const firstRun = await seedUniversityDirectory(mockPrisma as any);

    assert.ok(firstRun.universities >= 30, `Expected at least 30 universities, got ${firstRun.universities}`);
    assert.ok(firstRun.campuses >= 30, `Expected campuses to be populated, got ${firstRun.campuses}`);
    assert.ok(firstRun.departments >= 30, `Expected departments to be populated, got ${firstRun.departments}`);

    const countBeforeSecondRun = mockState.universities.length;
    const campusCountBefore = mockState.campuses.length;
    const deptCountBefore = mockState.departments.length;

    // Second run: MUST be idempotent without duplicate key collisions or count doubling
    const secondRun = await seedUniversityDirectory(mockPrisma as any);

    assert.equal(secondRun.universities, firstRun.universities);
    assert.equal(mockState.universities.length, countBeforeSecondRun, "No duplicate universities after 2nd seed run");
    assert.equal(mockState.campuses.length, campusCountBefore, "No duplicate campuses after 2nd seed run");
    assert.equal(mockState.departments.length, deptCountBefore, "No duplicate departments after 2nd seed run");
  });

  test("2. Seeded universities cover Pakistan, USA, UK, Canada, Australia, Germany, UAE, and international hubs", async () => {
    await seedUniversityDirectory(mockPrisma as any);

    const countries = new Set(mockState.universities.map((u: any) => u.countryCode));
    assert.ok(countries.has("PK"), "Pakistan must be seeded");
    assert.ok(countries.has("US"), "United States must be seeded");
    assert.ok(countries.has("GB"), "United Kingdom must be seeded");
    assert.ok(countries.has("CA"), "Canada must be seeded");
    assert.ok(countries.has("AU"), "Australia must be seeded");
    assert.ok(countries.has("DE"), "Germany must be seeded");
    assert.ok(countries.has("AE"), "UAE must be seeded");
    assert.ok(countries.has("SG"), "Singapore must be seeded");
    assert.ok(countries.has("CH"), "Switzerland must be seeded");
    assert.ok(countries.has("JP"), "Japan must be seeded");

    // Spot check NUST (Pakistan)
    const nust = mockState.universities.find((u: any) => u.shortName === "NUST");
    assert.ok(nust, "NUST should exist");
    assert.equal(nust.country, "Pakistan");
    assert.equal(nust.timezone, "Asia/Karachi");
    assert.equal(nust.isVerified, true);

    // Spot check MIT (USA)
    const mit = mockState.universities.find((u: any) => u.shortName === "MIT");
    assert.ok(mit, "MIT should exist");
    assert.equal(mit.countryCode, "US");
    assert.equal(mit.timezone, "America/New_York");
  });

  test("3. User profile nullable extensions do not break legacy users or relations", async () => {
    // 1. Create a legacy user without new identity fields
    const legacyUser = await mockPrisma.user.create({
      data: {
        name: "Legacy Student",
        email: "legacy@unimate.test",
        passwordHash: "$2a$10$legacyhashsomething",
      },
    });

    assert.ok(legacyUser.id);
    assert.equal(legacyUser.name, "Legacy Student");
    assert.equal(legacyUser.email, "legacy@unimate.test");
    // New fields should safely be undefined/null on legacy records
    assert.equal(legacyUser.avatarUrl, undefined);
    assert.equal(legacyUser.universityId, undefined);
    assert.equal(legacyUser.onboardingCompleted, undefined);

    // 2. Fetch user
    const fetched = await mockPrisma.user.findUnique({
      where: { email: "legacy@unimate.test" },
    });
    assert.ok(fetched);
    assert.equal(fetched.name, "Legacy Student");

    // 3. User can update profile with university relation and handle
    const updated = await mockPrisma.user.update({
      where: { id: legacyUser.id },
      data: {
        username: "legacystudent",
        universityId: "univ-pk-nust",
        degreeProgram: "B.S. Software Engineering",
        currentSemester: "Semester 5",
        graduationYear: 2027,
        onboardingCompleted: true,
      },
    });

    assert.equal(updated.username, "legacystudent");
    assert.equal(updated.universityId, "univ-pk-nust");
    assert.equal(updated.onboardingCompleted, true);
  });

  test("4. University search query logic filters by name, shortName, and country", async () => {
    await seedUniversityDirectory(mockPrisma as any);

    // Search query: "Karachi"
    const searchResults = await mockPrisma.university.findMany({
      where: {
        OR: [
          { name: { contains: "Karachi" } },
          { shortName: { contains: "Karachi" } },
          { city: { contains: "Karachi" } },
        ],
      },
    });

    assert.ok(searchResults.length >= 2, "Should find multiple Karachi institutions");
    for (const res of searchResults) {
      const match =
        res.name.includes("Karachi") ||
        res.shortName?.includes("Karachi") ||
        res.city?.includes("Karachi");
      assert.ok(match, `Result ${res.name} should match query`);
    }

    // Country filter: Germany
    const germanUnivs = await mockPrisma.university.findMany({
      where: { countryCode: "DE" },
    });
    assert.ok(germanUnivs.length >= 4, "Should return German universities");
    assert.ok(germanUnivs.every((u: any) => u.countryCode === "DE"));
  });
});
