/**
 * Profile & Identity Business Logic & Validation Helpers.
 *
 * Implements:
 * - Profile completion percentage calculation
 * - Username formatting, validation & normalization
 * - Academic relationship validation (university, campus, department)
 * - Safe response sanitization (never leaking passwords or sensitive academic records)
 */

import "server-only";
import { prisma } from "@/app/lib/prisma";

export interface CleanUserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  degreeProgram: string | null;
  currentSemester: string | null;
  graduationYear: number | null;
  skills: string[];
  interests: string[];
  languages: string[];
  socialLinks: Record<string, string> | null;
  onboardingCompleted: boolean;
  isPublicProfile: boolean;
  profileCompletionPercentage: number;
  completionDetails?: ProfileCompletionDetails;
  createdAt: string;
  university?: {
    id: string;
    name: string;
    shortName: string | null;
    country: string;
    isVerified: boolean;
  } | null;
  campus?: {
    id: string;
    name: string;
    city: string | null;
    isMain: boolean;
  } | null;
  department?: {
    id: string;
    name: string;
    faculty: string | null;
  } | null;
}

export interface ProfileCheckpoint {
  key: string;
  label: string;
  weight: number;
  completed: boolean;
  actionUrl: string;
}

export interface ProfileCompletionDetails {
  percentage: number;
  completedCount: number;
  totalCount: number;
  checkpoints: ProfileCheckpoint[];
  nextSuggestedAction: { key: string; label: string; actionUrl: string } | null;
}

export const PROFILE_CHECKPOINT_CONFIG = [
  { key: "avatarUrl", label: "Upload profile photo", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "username", label: "Claim student @handle", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "bio", label: "Add academic bio", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "country", label: "Select your country", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "universityId", label: "Link your university", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "campusId", label: "Select your campus", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "departmentId", label: "Select department / faculty", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "degreeProgram", label: "Specify degree program", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "currentSemester", label: "Set current semester", weight: 10, actionUrl: "/dashboard/settings" },
  { key: "graduationYear", label: "Set expected graduation year", weight: 10, actionUrl: "/dashboard/settings" },
] as const;

/**
 * Calculates deterministic profile completion percentage (0-100%).
 */
export function calculateProfileCompletion(user: {
  avatarUrl?: string | null;
  username?: string | null;
  bio?: string | null;
  universityId?: string | null;
  campusId?: string | null;
  departmentId?: string | null;
  degreeProgram?: string | null;
  currentSemester?: string | null;
  graduationYear?: number | null;
  country?: string | null;
}): number {
  const details = getProfileCompletionDetails(user);
  return details.percentage;
}

/**
 * Computes deterministic profile completion breakdown and next suggested actions.
 */
export function getProfileCompletionDetails(user: {
  avatarUrl?: string | null;
  username?: string | null;
  bio?: string | null;
  universityId?: string | null;
  campusId?: string | null;
  departmentId?: string | null;
  degreeProgram?: string | null;
  currentSemester?: string | null;
  graduationYear?: number | null;
  country?: string | null;
}): ProfileCompletionDetails {
  const isPresent = (key: string): boolean => {
    switch (key) {
      case "avatarUrl":
        return Boolean(user.avatarUrl);
      case "username":
        return Boolean(user.username);
      case "bio":
        return Boolean(user.bio && user.bio.trim().length > 0);
      case "country":
        return Boolean(user.country);
      case "universityId":
        return Boolean(user.universityId);
      case "campusId":
        return Boolean(user.campusId);
      case "departmentId":
        return Boolean(user.departmentId);
      case "degreeProgram":
        return Boolean(user.degreeProgram);
      case "currentSemester":
        return Boolean(user.currentSemester);
      case "graduationYear":
        return Boolean(user.graduationYear);
      default:
        return false;
    }
  };

  const checkpoints: ProfileCheckpoint[] = PROFILE_CHECKPOINT_CONFIG.map((cfg) => ({
    key: cfg.key,
    label: cfg.label,
    weight: cfg.weight,
    completed: isPresent(cfg.key),
    actionUrl: cfg.actionUrl,
  }));

  const completedCount = checkpoints.filter((c) => c.completed).length;
  const percentage = Math.min(100, Math.round((completedCount / checkpoints.length) * 100));
  const firstIncomplete = checkpoints.find((c) => !c.completed);

  return {
    percentage,
    completedCount,
    totalCount: checkpoints.length,
    checkpoints,
    nextSuggestedAction: firstIncomplete
      ? {
          key: firstIncomplete.key,
          label: firstIncomplete.label,
          actionUrl: firstIncomplete.actionUrl,
        }
      : null,
  };
}

/**
 * Validates a student @handle / username.
 * Rules:
 * - 3 to 30 characters
 * - lowercase alphanumeric, underscores, and dots
 * - cannot start or end with underscore or dot
 * - no consecutive dots or underscores
 */
export function validateUsername(username: string): { valid: boolean; normalized?: string; error?: string } {
  const normalized = username.trim().toLowerCase();

  if (normalized.length < 3 || normalized.length > 30) {
    return { valid: false, error: "Username must be between 3 and 30 characters." };
  }

  const validRegex = /^[a-z0-9]+([._][a-z0-9]+)*$/;
  if (!validRegex.test(normalized)) {
    return {
      valid: false,
      error: "Username may only contain lowercase letters, numbers, single dots, or underscores.",
    };
  }

  // Reserved system keywords
  const reserved = ["admin", "api", "auth", "support", "unimate", "root", "moderator", "system", "dashboard"];
  if (reserved.includes(normalized)) {
    return { valid: false, error: "This username is reserved." };
  }

  return { valid: true, normalized };
}

/**
 * Validates that campus and department belong to the specified university.
 */
/**
 * Validates that campus and department belong to the specified university,
 * and that the university belongs to the specified country if provided.
 */
export async function validateAcademicHierarchy(
  universityId: string | null | undefined,
  campusId: string | null | undefined,
  departmentId: string | null | undefined,
  country?: string | null | undefined
): Promise<{ valid: boolean; error?: string }> {
  if (campusId && !universityId) {
    return { valid: false, error: "A university must be selected before choosing a campus." };
  }

  if (departmentId && !universityId) {
    return { valid: false, error: "A university must be selected before choosing a department." };
  }

  if (universityId) {
    const univ = await prisma.university.findUnique({
      where: { id: universityId },
      include: { campuses: true, departments: true },
    });

    if (!univ) {
      return { valid: false, error: "Selected university does not exist." };
    }

    if (country && country.trim()) {
      const c = country.trim().toLowerCase();
      const code = univ.countryCode ? univ.countryCode.toLowerCase() : null;
      const name = univ.country ? univ.country.toLowerCase() : "";
      if (code !== c && name !== c) {
        return {
          valid: false,
          error: `The selected university (${univ.name}) does not belong to the selected country (${country}).`,
        };
      }
    }

    if (campusId) {
      const match = univ.campuses.some((c) => c.id === campusId);
      if (!match) {
        return { valid: false, error: "The selected campus does not belong to this university." };
      }
    }

    if (departmentId) {
      const match = univ.departments.some((d) => d.id === departmentId);
      if (!match) {
        return { valid: false, error: "The selected department does not belong to this university." };
      }
    }
  }

  return { valid: true };
}

/**
 * Fetches user profile with university associations and sanitizes it.
 */
export async function getUserProfile(userId: string): Promise<CleanUserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      university: {
        select: {
          id: true,
          name: true,
          shortName: true,
          country: true,
          isVerified: true,
        },
      },
      campus: {
        select: {
          id: true,
          name: true,
          city: true,
          isMain: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
          faculty: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const completionDetails = getProfileCompletionDetails({
    avatarUrl: user.avatarUrl,
    username: user.username,
    bio: user.bio,
    universityId: user.universityId,
    campusId: user.campusId,
    departmentId: user.departmentId,
    degreeProgram: user.degreeProgram,
    currentSemester: user.currentSemester,
    graduationYear: user.graduationYear,
    country: user.country,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    country: user.country,
    city: user.city,
    degreeProgram: user.degreeProgram,
    currentSemester: user.currentSemester,
    graduationYear: user.graduationYear,
    skills: user.skills || [],
    interests: user.interests || [],
    languages: user.languages || [],
    socialLinks: (user.socialLinks as Record<string, string>) || null,
    onboardingCompleted: user.onboardingCompleted,
    isPublicProfile: user.isPublicProfile,
    profileCompletionPercentage: completionDetails.percentage,
    completionDetails,
    createdAt: user.createdAt.toISOString(),
    university: user.university || null,
    campus: user.campus || null,
    department: user.department || null,
  };
}
