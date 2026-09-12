/**
 * University Search & Ranking Utility
 * Implements multi-tier relevancy scoring, punctuation-insensitive acronym normalization,
 * and conservative duplicate detection for the Global University Directory.
 */

/**
 * Normalizes a search term or institutional name:
 * - Lowercases
 * - Replaces punctuation (dots, hyphens, underscores, slashes) with spaces
 * - Collapses multiple spaces
 * - Trims
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[.\-_/\\,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips all non-alphanumeric characters for compact acronym matching:
 * e.g. "FAST-NUCES" -> "fastnuces", "FAST.NUCES" -> "fastnuces", "FAST NUCES" -> "fastnuces"
 */
export function compactAlphanumeric(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Computes a multi-tier relevancy score for a candidate university given a search query.
 *
 * Scoring breakdown:
 * - Exact acronym/shortName match: +120
 * - Exact full name match: +100
 * - ShortName starts with query: +85
 * - Name starts with query: +70
 * - Word boundary match (all query words match word prefixes): +55
 * - Substring match in name: +40
 * - Substring match in shortName: +35
 * - City match: +30
 * - Verified institution boost: +10
 */
export function scoreUniversityRelevancy(
  univ: {
    name: string;
    shortName?: string | null;
    city?: string | null;
    domain?: string | null;
    isVerified?: boolean;
  },
  rawQuery: string
): number {
  if (!rawQuery || !rawQuery.trim()) {
    return univ.isVerified ? 10 : 0;
  }

  const normQuery = normalizeSearchTerm(rawQuery);
  const compactQuery = compactAlphanumeric(rawQuery);

  const normName = normalizeSearchTerm(univ.name);
  const compactName = compactAlphanumeric(univ.name);

  const normShort = normalizeSearchTerm(univ.shortName || "");
  const compactShort = compactAlphanumeric(univ.shortName || "");

  const normCity = normalizeSearchTerm(univ.city || "");

  let score = 0;

  // 1. Exact match on shortName / acronym
  if (compactShort && compactShort === compactQuery) {
    score += 120;
  }
  // 2. Exact match on full name
  else if (normName === normQuery || compactName === compactQuery) {
    score += 100;
  }
  // 3. ShortName starts with query
  else if (compactShort && compactShort.startsWith(compactQuery)) {
    score += 85;
  }
  // 4. Name starts with query
  else if (normName.startsWith(normQuery) || compactName.startsWith(compactQuery)) {
    score += 70;
  }
  // 5. Word boundary match in name (any word in name starts with query)
  else {
    const nameWords = normName.split(" ").filter(Boolean);
    const queryWords = normQuery.split(" ").filter(Boolean);
    const matchesAllQueryWords =
      queryWords.length > 0 &&
      queryWords.every((qw) => nameWords.some((nw) => nw.startsWith(qw)));

    if (matchesAllQueryWords) {
      score += 55;
    } else if (normName.includes(normQuery)) {
      score += 40;
    } else if (compactShort && compactShort.includes(compactQuery)) {
      score += 35;
    }
  }

  // City matching bonus
  if (normCity && (normCity === normQuery || normCity.startsWith(normQuery))) {
    score += 30;
  } else if (normCity && normCity.includes(normQuery)) {
    score += 15;
  }

  // Verified boost (verified institutions prioritized in ranking)
  if (univ.isVerified) {
    score += 10;
  }

  return score;
}

/**
 * Conservative duplicate check for custom university creation:
 * Returns true if an existing university in the same country is identical
 * after normalization of punctuation, spacing, and case.
 */
export function isConservativeDuplicate(
  existingName: string,
  existingShortName: string | null | undefined,
  candidateName: string,
  candidateShortName: string | null | undefined
): boolean {
  const compCandidateName = compactAlphanumeric(candidateName);
  const compExistingName = compactAlphanumeric(existingName);

  if (compCandidateName === compExistingName) {
    return true;
  }

  const normCandidateName = normalizeSearchTerm(candidateName);
  const normExistingName = normalizeSearchTerm(existingName);
  if (normCandidateName === normExistingName) {
    return true;
  }

  // Check if candidate matches existing shortName/acronym
  if (existingShortName) {
    const compExistingShort = compactAlphanumeric(existingShortName);
    if (compExistingShort.length >= 3 && compExistingShort === compCandidateName) {
      return true;
    }
  }

  // Check if candidate shortName matches existing shortName or name
  if (candidateShortName) {
    const compCandidateShort = compactAlphanumeric(candidateShortName);
    if (compCandidateShort.length >= 3) {
      if (compCandidateShort === compExistingName) {
        return true;
      }
      if (existingShortName && compCandidateShort === compactAlphanumeric(existingShortName)) {
        return true;
      }
    }
  }

  return false;
}
