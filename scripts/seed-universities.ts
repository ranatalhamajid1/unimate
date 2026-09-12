import { PrismaClient } from "@prisma/client";
import { ALL_SEED_UNIVERSITIES, SeedUniversity } from "./seed-data/index";

const prisma = new PrismaClient();

export { ALL_SEED_UNIVERSITIES };
export const SEED_UNIVERSITIES = ALL_SEED_UNIVERSITIES;
export type { SeedUniversity };

/**
 * Idempotently seeds the global university directory.
 *
 * Safety guarantees:
 * 1. Community institutions (isVerified: false): NEVER overwritten.
 * 2. Existing database IDs and foreign keys: strictly preserved.
 * 3. Never deletes existing universities, campuses, or departments.
 * 4. Safe to execute repeatedly without duplicating records.
 */
export async function seedUniversityDirectory(client: PrismaClient = prisma) {
  let seededUniversitiesCount = 0;
  let seededCampusesCount = 0;
  let seededDepartmentsCount = 0;
  let skippedCommunityCount = 0;

  for (const univ of ALL_SEED_UNIVERSITIES) {
    // 1. Check if university already exists (by canonical name in country)
    let existing = await client.university.findFirst({
      where: {
        name: { equals: univ.name, mode: "insensitive" },
        countryCode: univ.countryCode,
      },
      select: { id: true, isVerified: true, name: true },
    });

    let targetUnivId: string;

    if (existing) {
      // Safety Rule: Never overwrite student-created community universities
      if (!existing.isVerified) {
        skippedCommunityCount++;
        continue;
      }

      // Update existing verified record while keeping its existing database id intact
      await client.university.update({
        where: { id: existing.id },
        data: {
          name: univ.name,
          shortName: univ.shortName,
          country: univ.country,
          countryCode: univ.countryCode,
          city: univ.city,
          state: univ.state,
          website: univ.website,
          domain: univ.domain,
          timezone: univ.timezone,
          isVerified: true,
        },
      });
      targetUnivId = existing.id;
    } else {
      // Create new verified record with standard database CUID
      const created = await client.university.create({
        data: {
          name: univ.name,
          shortName: univ.shortName,
          country: univ.country,
          countryCode: univ.countryCode,
          city: univ.city,
          state: univ.state,
          website: univ.website,
          domain: univ.domain,
          timezone: univ.timezone,
          isVerified: true,
        },
      });
      targetUnivId = created.id;
    }

    seededUniversitiesCount++;

    // 2. Upsert Campuses using targetUnivId
    for (const campus of univ.campuses) {
      await client.campus.upsert({
        where: {
          universityId_name: {
            universityId: targetUnivId,
            name: campus.name,
          },
        },
        update: {
          city: campus.city,
          isMain: campus.isMain,
        },
        create: {
          universityId: targetUnivId,
          name: campus.name,
          city: campus.city,
          isMain: campus.isMain,
        },
      });
      seededCampusesCount++;
    }

    // 3. Upsert Departments using targetUnivId
    for (const dept of univ.departments) {
      await client.department.upsert({
        where: {
          universityId_name: {
            universityId: targetUnivId,
            name: dept.name,
          },
        },
        update: {
          faculty: dept.faculty,
        },
        create: {
          universityId: targetUnivId,
          name: dept.name,
          faculty: dept.faculty,
        },
      });
      seededDepartmentsCount++;
    }
  }

  return {
    universities: seededUniversitiesCount,
    campuses: seededCampusesCount,
    departments: seededDepartmentsCount,
    skippedCommunity: skippedCommunityCount,
  };
}

// Execute standalone if executed directly via tsx
if (process.argv[1]?.includes("seed-universities")) {
  seedUniversityDirectory()
    .then((stats) => {
      console.log(`✅ Successfully seeded global university directory:`);
      console.log(`   - Universities: ${stats.universities}`);
      console.log(`   - Campuses:     ${stats.campuses}`);
      console.log(`   - Departments:  ${stats.departments}`);
      if (stats.skippedCommunity > 0) {
        console.log(`   - Skipped Community: ${stats.skippedCommunity}`);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Failed seeding university directory:", err);
      process.exit(1);
    });
}
