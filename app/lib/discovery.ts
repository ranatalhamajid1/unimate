import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  CommunityScope,
  CommunityVisibility,
  CommunityModerationStatus,
  MembershipStatus,
  EventStatus,
  AIRGAPPED_USER_SELECT,
  sanitizeMemberUser,
} from "@/app/lib/communities";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------
export interface StudentHierarchyContext {
  userId: string;
  universityId: string | null;
  campusId: string | null;
  departmentId: string | null;
  activeCommunityIds: string[];
  pendingCommunityIds: string[];
}

export interface VerifiedDomainInfo {
  isVerified: boolean;
  domainName: string | null;
  badgeLabel: string | null;
}

// ---------------------------------------------------------------------------
// Exact Trusted Domain Allowlists (Strictly No Naive Suffix Matching)
// ---------------------------------------------------------------------------
export const TRUSTED_DOMAIN_ALLOWLIST = new Set([
  "drive.google.com",
  "docs.google.com",
  "github.com",
  "gist.github.com",
  "gitlab.com",
  "notion.so",
  "notion.site",
  "overleaf.com",
  "arxiv.org",
  "kaggle.com",
  "stackoverflow.com",
  "youtube.com",
  "youtu.be",
  "wikipedia.org",
  "en.wikipedia.org",
  "medium.com",
  "coursera.org",
  "edx.org",
  "khanacademy.org",
  "sciencedirect.com",
  "ieee.org",
  "ieeexplore.ieee.org",
  "acm.org",
  "dl.acm.org",
  "springer.com",
  "jstor.org",
  "nih.gov",
  "ncbi.nlm.nih.gov",
]);

/**
 * Evaluates whether a resource URL belongs to a trusted academic or educational domain.
 * Uses exact host matching or strictly controlled root domains (no naive suffix matching).
 */
export function evaluateVerifiedDomain(urlStr: string): VerifiedDomainInfo {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().trim();

    if (TRUSTED_DOMAIN_ALLOWLIST.has(host)) {
      return {
        isVerified: true,
        domainName: host,
        badgeLabel: "Recognized Academic Source",
      };
    }

    return {
      isVerified: false,
      domainName: host,
      badgeLabel: null,
    };
  } catch {
    return {
      isVerified: false,
      domainName: null,
      badgeLabel: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Text Normalization for Search & Acronym Extraction
// ---------------------------------------------------------------------------
export function normalizeSearchQuery(text: string): {
  normalized: string;
  tokens: string[];
  acronym: string;
} {
  if (!text) {
    return { normalized: "", tokens: [], acronym: "" };
  }

  // Normalize case, convert punctuation/dashes/underscores to spaces, collapse whitespace
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized.split(" ").filter((t) => t.length > 0);

  // Generate acronym from tokens if multiple words exist (e.g. "fast computing society" -> "fcs")
  const acronym = tokens.length > 1 ? tokens.map((t) => t[0]).join("") : "";

  return { normalized, tokens, acronym };
}

// ---------------------------------------------------------------------------
// Student Hierarchy & Membership Context Resolution
// ---------------------------------------------------------------------------
export async function resolveStudentHierarchyContext(
  userId: string
): Promise<StudentHierarchyContext> {
  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        universityId: true,
        campusId: true,
        departmentId: true,
      },
    }),
    prisma.communityMember.findMany({
      where: {
        userId,
        status: { in: [MembershipStatus.ACTIVE, MembershipStatus.PENDING] },
      },
      select: { communityId: true, status: true },
    }),
  ]);

  const activeCommunityIds: string[] = [];
  const pendingCommunityIds: string[] = [];

  for (const m of memberships) {
    if (m.status === MembershipStatus.ACTIVE) {
      activeCommunityIds.push(m.communityId);
    } else if (m.status === MembershipStatus.PENDING) {
      pendingCommunityIds.push(m.communityId);
    }
  }

  return {
    userId,
    universityId: user?.universityId || null,
    campusId: user?.campusId || null,
    departmentId: user?.departmentId || null,
    activeCommunityIds,
    pendingCommunityIds,
  };
}

// ---------------------------------------------------------------------------
// Safe Visibility Filter Builder for Communities
// ---------------------------------------------------------------------------
export function buildCommunityVisibilityFilter(
  ctx: StudentHierarchyContext | null,
  options: {
    tab?: "university" | "campus" | "department" | "joined" | "explore";
    verifiedOnly?: boolean;
    type?: string | null;
  } = {}
): any {
  const { tab = "university", verifiedOnly, type } = options;

  const baseWhere: any = {
    moderationStatus: CommunityModerationStatus.APPROVED,
  };

  if (verifiedOnly) {
    baseWhere.isVerified = true;
  }

  if (type) {
    baseWhere.type = type;
  }

  // 1. Explore Tab: Strictly public communities (cross-university discoverable)
  if (tab === "explore" || !ctx || !ctx.universityId) {
    return {
      ...baseWhere,
      visibility: CommunityVisibility.PUBLIC,
    };
  }

  // 2. Joined Tab: Active or Pending memberships of the authenticated student
  if (tab === "joined") {
    const allowedJoinedIds = [...ctx.activeCommunityIds, ...ctx.pendingCommunityIds];
    if (allowedJoinedIds.length === 0) {
      return { ...baseWhere, id: "NO_JOINED_COMMUNITIES_MATCH" };
    }
    return {
      ...baseWhere,
      id: { in: allowedJoinedIds },
    };
  }

  // 3. Department Tab: Exact University + Department hierarchy check
  if (tab === "department") {
    if (!ctx.departmentId) {
      return { ...baseWhere, id: "NO_DEPARTMENT_MATCH" };
    }
    return {
      ...baseWhere,
      universityId: ctx.universityId,
      departmentId: ctx.departmentId,
      OR: [
        { visibility: CommunityVisibility.PUBLIC },
        ...(ctx.campusId
          ? [{ visibility: CommunityVisibility.CAMPUS_ONLY, campusId: ctx.campusId }]
          : []),
        ...(ctx.activeCommunityIds.length > 0
          ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
          : []),
      ],
    };
  }

  // 4. Campus Tab: Matching Campus + University hierarchy check
  if (tab === "campus") {
    if (!ctx.campusId) {
      return { ...baseWhere, id: "NO_CAMPUS_MATCH" };
    }
    return {
      ...baseWhere,
      universityId: ctx.universityId,
      campusId: ctx.campusId,
      OR: [
        { visibility: CommunityVisibility.PUBLIC },
        { visibility: CommunityVisibility.CAMPUS_ONLY },
        ...(ctx.activeCommunityIds.length > 0
          ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
          : []),
      ],
    };
  }

  // 5. University Tab (Default): Matching University context
  const visibilityClauses: any[] = [{ visibility: CommunityVisibility.PUBLIC }];

  if (ctx.campusId) {
    visibilityClauses.push({
      visibility: CommunityVisibility.CAMPUS_ONLY,
      campusId: ctx.campusId,
    });
  }

  if (ctx.activeCommunityIds.length > 0) {
    visibilityClauses.push({
      visibility: CommunityVisibility.PRIVATE,
      id: { in: ctx.activeCommunityIds },
    });
  }

  return {
    ...baseWhere,
    universityId: ctx.universityId,
    OR: visibilityClauses,
  };
}

// ---------------------------------------------------------------------------
// Safe Visibility Filter Builder for Events
// Schema field is `startAt` and `endAt`
// ---------------------------------------------------------------------------
export function buildEventVisibilityFilter(
  ctx: StudentHierarchyContext | null,
  options: {
    timeline?: "upcoming" | "today" | "this_week" | "past";
    scope?: "university" | "campus" | "department" | "joined" | "all";
    now?: Date;
  } = {}
): any {
  const { timeline = "upcoming", scope = "all", now = new Date() } = options;

  const baseWhere: any = {
    status: EventStatus.SCHEDULED,
    community: {
      moderationStatus: CommunityModerationStatus.APPROVED,
    },
  };

  // Timeline bounds on startAt
  if (timeline === "upcoming") {
    baseWhere.startAt = { gte: now };
  } else if (timeline === "today") {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    baseWhere.startAt = { gte: startOfDay, lte: endOfDay };
  } else if (timeline === "this_week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    baseWhere.startAt = { gte: now, lte: endOfWeek };
  } else if (timeline === "past") {
    baseWhere.startAt = { lt: now };
  }

  // If no student context or scope === "all", strictly public community events
  if (!ctx || !ctx.universityId || scope === "all") {
    baseWhere.community.visibility = CommunityVisibility.PUBLIC;
    return baseWhere;
  }

  // Scope isolation
  if (scope === "joined") {
    if (ctx.activeCommunityIds.length === 0) {
      return { ...baseWhere, id: "NO_EVENTS_JOINED" };
    }
    baseWhere.communityId = { in: ctx.activeCommunityIds };
    return baseWhere;
  }

  if (scope === "department") {
    if (!ctx.departmentId) {
      return { ...baseWhere, id: "NO_EVENTS_DEPARTMENT" };
    }
    baseWhere.community.universityId = ctx.universityId;
    baseWhere.community.departmentId = ctx.departmentId;
    baseWhere.community.OR = [
      { visibility: CommunityVisibility.PUBLIC },
      ...(ctx.campusId
        ? [{ visibility: CommunityVisibility.CAMPUS_ONLY, campusId: ctx.campusId }]
        : []),
      ...(ctx.activeCommunityIds.length > 0
        ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
        : []),
    ];
    return baseWhere;
  }

  if (scope === "campus") {
    if (!ctx.campusId) {
      return { ...baseWhere, id: "NO_EVENTS_CAMPUS" };
    }
    baseWhere.community.universityId = ctx.universityId;
    baseWhere.community.campusId = ctx.campusId;
    baseWhere.community.OR = [
      { visibility: CommunityVisibility.PUBLIC },
      { visibility: CommunityVisibility.CAMPUS_ONLY },
      ...(ctx.activeCommunityIds.length > 0
        ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
        : []),
    ];
    return baseWhere;
  }

  // scope === "university"
  baseWhere.community.universityId = ctx.universityId;
  const visibilityConditions: any[] = [{ visibility: CommunityVisibility.PUBLIC }];

  if (ctx.campusId) {
    visibilityConditions.push({
      visibility: CommunityVisibility.CAMPUS_ONLY,
      campusId: ctx.campusId,
    });
  }

  if (ctx.activeCommunityIds.length > 0) {
    visibilityConditions.push({
      visibility: CommunityVisibility.PRIVATE,
      id: { in: ctx.activeCommunityIds },
    });
  }

  baseWhere.community.OR = visibilityConditions;
  return baseWhere;
}

// ---------------------------------------------------------------------------
// Safe Visibility Filter Builder for Announcements
// ---------------------------------------------------------------------------
export function buildAnnouncementVisibilityFilter(
  ctx: StudentHierarchyContext | null,
  options: {
    scope?: "university" | "campus" | "department" | "joined" | "all";
  } = {}
): any {
  const { scope = "all" } = options;

  const baseWhere: any = {
    community: {
      moderationStatus: CommunityModerationStatus.APPROVED,
    },
  };

  if (!ctx || !ctx.universityId || scope === "all") {
    baseWhere.community.visibility = CommunityVisibility.PUBLIC;
    return baseWhere;
  }

  if (scope === "joined") {
    if (ctx.activeCommunityIds.length === 0) {
      return { ...baseWhere, id: "NO_ANNOUNCEMENTS_JOINED" };
    }
    baseWhere.communityId = { in: ctx.activeCommunityIds };
    return baseWhere;
  }

  if (scope === "department") {
    if (!ctx.departmentId) {
      return { ...baseWhere, id: "NO_ANNOUNCEMENTS_DEPARTMENT" };
    }
    baseWhere.community.universityId = ctx.universityId;
    baseWhere.community.departmentId = ctx.departmentId;
    baseWhere.community.OR = [
      { visibility: CommunityVisibility.PUBLIC },
      ...(ctx.campusId
        ? [{ visibility: CommunityVisibility.CAMPUS_ONLY, campusId: ctx.campusId }]
        : []),
      ...(ctx.activeCommunityIds.length > 0
        ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
        : []),
    ];
    return baseWhere;
  }

  if (scope === "campus") {
    if (!ctx.campusId) {
      return { ...baseWhere, id: "NO_ANNOUNCEMENTS_CAMPUS" };
    }
    baseWhere.community.universityId = ctx.universityId;
    baseWhere.community.campusId = ctx.campusId;
    baseWhere.community.OR = [
      { visibility: CommunityVisibility.PUBLIC },
      { visibility: CommunityVisibility.CAMPUS_ONLY },
      ...(ctx.activeCommunityIds.length > 0
        ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
        : []),
    ];
    return baseWhere;
  }

  // Default: university
  baseWhere.community.universityId = ctx.universityId;
  const visibilityConditions: any[] = [{ visibility: CommunityVisibility.PUBLIC }];

  if (ctx.campusId) {
    visibilityConditions.push({
      visibility: CommunityVisibility.CAMPUS_ONLY,
      campusId: ctx.campusId,
    });
  }

  if (ctx.activeCommunityIds.length > 0) {
    visibilityConditions.push({
      visibility: CommunityVisibility.PRIVATE,
      id: { in: ctx.activeCommunityIds },
    });
  }

  baseWhere.community.OR = visibilityConditions;
  return baseWhere;
}

// ---------------------------------------------------------------------------
// Safe Visibility Filter Builder for Resources
// ---------------------------------------------------------------------------
export function buildResourceVisibilityFilter(
  ctx: StudentHierarchyContext | null,
  options: {
    scope?: "university" | "campus" | "department" | "joined" | "all";
  } = {}
): any {
  const { scope = "all" } = options;

  const baseWhere: any = {
    community: {
      moderationStatus: CommunityModerationStatus.APPROVED,
    },
  };

  if (!ctx || !ctx.universityId || scope === "all") {
    baseWhere.community.visibility = CommunityVisibility.PUBLIC;
    return baseWhere;
  }

  if (scope === "joined") {
    if (ctx.activeCommunityIds.length === 0) {
      return { ...baseWhere, id: "NO_RESOURCES_JOINED" };
    }
    baseWhere.communityId = { in: ctx.activeCommunityIds };
    return baseWhere;
  }

  if (scope === "department") {
    if (!ctx.departmentId) {
      return { ...baseWhere, id: "NO_RESOURCES_DEPARTMENT" };
    }
    baseWhere.community.universityId = ctx.universityId;
    baseWhere.community.departmentId = ctx.departmentId;
    baseWhere.community.OR = [
      { visibility: CommunityVisibility.PUBLIC },
      ...(ctx.campusId
        ? [{ visibility: CommunityVisibility.CAMPUS_ONLY, campusId: ctx.campusId }]
        : []),
      ...(ctx.activeCommunityIds.length > 0
        ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
        : []),
    ];
    return baseWhere;
  }

  if (scope === "campus") {
    if (!ctx.campusId) {
      return { ...baseWhere, id: "NO_RESOURCES_CAMPUS" };
    }
    baseWhere.community.universityId = ctx.universityId;
    baseWhere.community.campusId = ctx.campusId;
    baseWhere.community.OR = [
      { visibility: CommunityVisibility.PUBLIC },
      { visibility: CommunityVisibility.CAMPUS_ONLY },
      ...(ctx.activeCommunityIds.length > 0
        ? [{ visibility: CommunityVisibility.PRIVATE, id: { in: ctx.activeCommunityIds } }]
        : []),
    ];
    return baseWhere;
  }

  // Default: university
  baseWhere.community.universityId = ctx.universityId;
  const visibilityConditions: any[] = [{ visibility: CommunityVisibility.PUBLIC }];

  if (ctx.campusId) {
    visibilityConditions.push({
      visibility: CommunityVisibility.CAMPUS_ONLY,
      campusId: ctx.campusId,
    });
  }

  if (ctx.activeCommunityIds.length > 0) {
    visibilityConditions.push({
      visibility: CommunityVisibility.PRIVATE,
      id: { in: ctx.activeCommunityIds },
    });
  }

  baseWhere.community.OR = visibilityConditions;
  return baseWhere;
}

// ---------------------------------------------------------------------------
// Deterministic Relevance Ranking Formula
// ---------------------------------------------------------------------------
export interface RankingSignals {
  exactNameMatch: boolean;
  prefixNameMatch: boolean;
  acronymMatch: boolean;
  courseCodeMatch: boolean;
  departmentMatch: boolean;
  campusMatch: boolean;
  universityMatch: boolean;
  isVerified: boolean;
  isActiveMember: boolean;
  hasUpcomingEvent: boolean;
  hasRecentAnnouncement: boolean;
}

export function computeDiscoveryRelevanceScore(signals: RankingSignals): number {
  let score = 0;

  // Text signals
  if (signals.exactNameMatch) score += 100;
  else if (signals.prefixNameMatch) score += 60;

  if (signals.courseCodeMatch) score += 50;
  if (signals.acronymMatch) score += 40;

  // Context signals
  if (signals.departmentMatch) score += 35;
  if (signals.campusMatch) score += 25;
  if (signals.universityMatch) score += 20;

  // Trust signals
  if (signals.isVerified) score += 25;
  if (signals.isActiveMember) score += 30;

  // Activity signals
  if (signals.hasUpcomingEvent) score += 10;
  if (signals.hasRecentAnnouncement) score += 5;

  return score;
}

// ---------------------------------------------------------------------------
// Deterministic Campus Intelligence Engine
// Zero AI quota consumed on page load
// ---------------------------------------------------------------------------
export interface CampusIntelligenceData {
  stats: {
    upcomingEventsThisWeek: number;
    newAnnouncementsCount: number;
    newDepartmentResourcesCount: number;
    activeCommunitiesJoinedCount: number;
  };
  highlights: {
    nextEvent: {
      id: string;
      title: string;
      startDate: Date;
      communityName: string;
      communitySlug: string;
      isAttending: boolean;
    } | null;
    latestAnnouncement: {
      id: string;
      title: string;
      publishedAt: Date;
      communityName: string;
      communitySlug: string;
      isPinned: boolean;
    } | null;
    topResource: {
      id: string;
      title: string;
      url: string;
      communityName: string;
      isVerifiedDomain: boolean;
      courseCode: string | null;
    } | null;
  };
}

export async function getCampusIntelligence(
  ctx: StudentHierarchyContext
): Promise<CampusIntelligenceData> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Event filter for student's institutional scope (or joined communities)
  const eventWhere = buildEventVisibilityFilter(ctx, {
    timeline: "this_week",
    scope: ctx.campusId ? "campus" : "university",
    now,
  });

  // 2. Announcement filter for student's institutional scope
  const announcementWhere = buildAnnouncementVisibilityFilter(ctx, {
    scope: ctx.departmentId ? "department" : ctx.campusId ? "campus" : "university",
  });
  announcementWhere.createdAt = { gte: sevenDaysAgo };

  // 3. Department resource filter
  const resourceWhere = buildResourceVisibilityFilter(ctx, {
    scope: ctx.departmentId ? "department" : "university",
  });
  resourceWhere.createdAt = { gte: sevenDaysAgo };

  // Parallel database execution with bounded limits
  const [
    upcomingEventsCount,
    newAnnouncementsCount,
    newResourcesCount,
    nextEventRecord,
    latestAnnouncementRecord,
    topResourceRecord,
  ] = await Promise.all([
    prisma.communityEvent.count({ where: eventWhere }),
    prisma.communityAnnouncement.count({ where: announcementWhere }),
    prisma.communityResource.count({ where: resourceWhere }),
    prisma.communityEvent.findFirst({
      where: {
        ...eventWhere,
        startAt: { gte: now },
      },
      orderBy: { startAt: "asc" },
      include: {
        community: { select: { name: true, slug: true } },
        attendees: {
          where: { userId: ctx.userId },
          select: { status: true },
        },
      },
    }),
    prisma.communityAnnouncement.findFirst({
      where: announcementWhere,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        community: { select: { name: true, slug: true } },
      },
    }),
    prisma.communityResource.findFirst({
      where: resourceWhere,
      orderBy: { createdAt: "desc" },
      include: {
        community: { select: { name: true, slug: true } },
      },
    }),
  ]);

  // Safe fallback for community name/slug when relations are mocked
  let eventCommunityName = "Campus Event";
  let eventCommunitySlug = "community";
  if (nextEventRecord) {
    if (nextEventRecord.community?.name) {
      eventCommunityName = nextEventRecord.community.name;
      eventCommunitySlug = nextEventRecord.community.slug;
    } else if (nextEventRecord.communityId) {
      const comm = await prisma.community.findUnique({
        where: { id: nextEventRecord.communityId },
        select: { name: true, slug: true },
      });
      if (comm) {
        eventCommunityName = comm.name;
        eventCommunitySlug = comm.slug;
      }
    }
  }

  let annCommunityName = "Announcement";
  let annCommunitySlug = "community";
  if (latestAnnouncementRecord) {
    if (latestAnnouncementRecord.community?.name) {
      annCommunityName = latestAnnouncementRecord.community.name;
      annCommunitySlug = latestAnnouncementRecord.community.slug;
    } else if (latestAnnouncementRecord.communityId) {
      const comm = await prisma.community.findUnique({
        where: { id: latestAnnouncementRecord.communityId },
        select: { name: true, slug: true },
      });
      if (comm) {
        annCommunityName = comm.name;
        annCommunitySlug = comm.slug;
      }
    }
  }

  let resCommunityName = "Resource";
  if (topResourceRecord) {
    if (topResourceRecord.community?.name) {
      resCommunityName = topResourceRecord.community.name;
    } else if (topResourceRecord.communityId) {
      const comm = await prisma.community.findUnique({
        where: { id: topResourceRecord.communityId },
        select: { name: true },
      });
      if (comm) {
        resCommunityName = comm.name;
      }
    }
  }

  return {
    stats: {
      upcomingEventsThisWeek: upcomingEventsCount,
      newAnnouncementsCount,
      newDepartmentResourcesCount: newResourcesCount,
      activeCommunitiesJoinedCount: ctx.activeCommunityIds.length,
    },
    highlights: {
      nextEvent: nextEventRecord
        ? {
            id: nextEventRecord.id,
            title: nextEventRecord.title,
            startDate: nextEventRecord.startAt,
            communityName: eventCommunityName,
            communitySlug: eventCommunitySlug,
            isAttending: nextEventRecord.attendees && nextEventRecord.attendees.length > 0,
          }
        : null,
      latestAnnouncement: latestAnnouncementRecord
        ? {
            id: latestAnnouncementRecord.id,
            title: latestAnnouncementRecord.title,
            publishedAt: latestAnnouncementRecord.createdAt,
            communityName: annCommunityName,
            communitySlug: annCommunitySlug,
            isPinned: latestAnnouncementRecord.isPinned,
          }
        : null,
      topResource: topResourceRecord
        ? {
            id: topResourceRecord.id,
            title: topResourceRecord.title,
            url: topResourceRecord.url,
            communityName: resCommunityName,
            isVerifiedDomain: evaluateVerifiedDomain(topResourceRecord.url).isVerified,
            courseCode: (topResourceRecord as any).courseCode || null,
          }
        : null,
    },
  };
}
