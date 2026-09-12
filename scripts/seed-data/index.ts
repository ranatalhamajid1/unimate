import { SeedUniversity } from "./types";
import { PAKISTAN_UNIVERSITIES } from "./pakistan";
import { SOUTH_ASIA_UNIVERSITIES } from "./south-asia";
import { MENA_UNIVERSITIES } from "./mena";
import { EAST_SOUTHEAST_ASIA_UNIVERSITIES } from "./east-southeast-asia";
import { EUROPE_UNIVERSITIES } from "./europe";
import { AMERICAS_UNIVERSITIES } from "./americas";
import { OCEANIA_AFRICA_UNIVERSITIES } from "./oceania-africa";

export * from "./types";

export const ALL_SEED_UNIVERSITIES: SeedUniversity[] = [
  ...PAKISTAN_UNIVERSITIES,
  ...SOUTH_ASIA_UNIVERSITIES,
  ...MENA_UNIVERSITIES,
  ...EAST_SOUTHEAST_ASIA_UNIVERSITIES,
  ...EUROPE_UNIVERSITIES,
  ...AMERICAS_UNIVERSITIES,
  ...OCEANIA_AFRICA_UNIVERSITIES,
];

export const GLOBAL_UNIVERSITIES = ALL_SEED_UNIVERSITIES;

/**
 * Validates the aggregated seed dataset for data integrity:
 * - seedKey uniqueness
 * - Unique (name, countryCode) pairs
 * - ISO-3166-1 alpha-2 validity (2 uppercase letters)
 * - Required campuses and at least one isMain: true
 */
export function validateSeedDataset(dataset: SeedUniversity[] = ALL_SEED_UNIVERSITIES): {
  valid: boolean;
  total: number;
  errors: string[];
} {
  const errors: string[] = [];
  const seenKeys = new Set<string>();
  const seenNameCountry = new Set<string>();

  for (const univ of dataset) {
    // 1. Seed key uniqueness
    if (seenKeys.has(univ.seedKey)) {
      errors.push(`Duplicate seedKey: ${univ.seedKey}`);
    }
    seenKeys.add(univ.seedKey);

    // 2. Name + country uniqueness
    const key = `${univ.name.toLowerCase()}|${univ.countryCode.toUpperCase()}`;
    if (seenNameCountry.has(key)) {
      errors.push(`Duplicate university name in country: "${univ.name}" (${univ.countryCode})`);
    }
    seenNameCountry.add(key);

    // 3. Country code format (ISO 2-letter)
    if (!/^[A-Z]{2}$/.test(univ.countryCode)) {
      errors.push(`Invalid countryCode "${univ.countryCode}" for ${univ.name}`);
    }

    // 4. Campuses validation
    if (!univ.campuses || univ.campuses.length === 0) {
      errors.push(`No campuses defined for ${univ.name}`);
    } else {
      const hasMain = univ.campuses.some((c) => c.isMain);
      if (!hasMain) {
        errors.push(`No main campus (isMain: true) for ${univ.name}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    total: dataset.length,
    errors,
  };
}
