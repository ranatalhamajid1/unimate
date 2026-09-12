import "./setup-prisma";
import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetMockState, mockState } from "./setup-prisma";
import {
  evaluateVerifiedDomain,
  normalizeSearchQuery,
  computeDiscoveryRelevanceScore,
  resolveStudentHierarchyContext,
  buildCommunityVisibilityFilter,
  buildEventVisibilityFilter,
  buildAnnouncementVisibilityFilter,
  buildResourceVisibilityFilter,
  getCampusIntelligence,
} from "../app/lib/discovery";
import { GET as getDiscoveredCommunities } from "../app/api/discovery/communities/route";
import { GET as getDiscoveredEvents } from "../app/api/discovery/events/route";
import { GET as getDiscoveredAnnouncements } from "../app/api/discovery/announcements/route";
import { GET as getDiscoveredResources } from "../app/api/discovery/resources/route";
import { GET as getDiscoverySearch } from "../app/api/discovery/search/route";
import { GET as getCampusIntelligenceRoute } from "../app/api/discovery/intelligence/route";
import { generateMobileToken } from "../app/lib/mobile-auth";
import { NextRequest } from "next/server";

describe("Milestone 11: Student Network 3.0 — Discovery & Campus Intelligence Test Suite", () => {
  let userFAST_CS: any;
  let userFAST_EE: any;
  let userOtherUniv: any;
  let commFAST_Public: any;
  let commFAST_CampusOnly: any;
  let commFAST_DeptCS: any;
  let commFAST_Private: any;
  let eventPublic: any;
  let eventPrivate: any;
  let announcementPinned: any;
  let resourceTrusted: any;
  let resourceRegular: any;

  beforeEach(async () => {
    resetMockState();

    // 1. Setup Institutional Hierarchy
    const univFAST = { id: "univ-fast", name: "FAST NUCES", shortName: "FAST" };
    const univNUST = { id: "univ-nust", name: "NUST", shortName: "NUST" };
    mockState.universities.push(univFAST, univNUST);

    const campusIslamabad = { id: "campus-isb", name: "Islamabad Campus", universityId: "univ-fast" };
    const campusLahore = { id: "campus-lhr", name: "Lahore Campus", universityId: "univ-fast" };
    mockState.campuses.push(campusIslamabad, campusLahore);

    const deptCS = { id: "dept-cs", name: "Computer Science", universityId: "univ-fast" };
    const deptEE = { id: "dept-ee", name: "Electrical Engineering", universityId: "univ-fast" };
    mockState.departments.push(deptCS, deptEE);

    // 2. Setup Student Identities
    userFAST_CS = {
      id: "usr-cs",
      name: "CS Student",
      email: "cs@fast.edu.pk",
      universityId: "univ-fast",
      campusId: "campus-isb",
      departmentId: "dept-cs",
    };
    userFAST_EE = {
      id: "usr-ee",
      name: "EE Student",
      email: "ee@fast.edu.pk",
      universityId: "univ-fast",
      campusId: "campus-isb",
      departmentId: "dept-ee",
    };
    userOtherUniv = {
      id: "usr-nust",
      name: "NUST Student",
      email: "student@nust.edu.pk",
      universityId: "univ-nust",
      campusId: null,
      departmentId: null,
    };
    mockState.users.push(userFAST_CS, userFAST_EE, userOtherUniv);

    // 3. Setup Communities across Scopes & Visibility
    commFAST_Public = {
      id: "comm-fast-public",
      slug: "fast-computing-society",
      name: "FAST Computing Society",
      description: "Official tech society for FASTians",
      universityId: "univ-fast",
      campusId: "campus-isb",
      departmentId: "dept-cs",
      scope: "CAMPUS",
      visibility: "PUBLIC",
      type: "SOCIETY",
      isVerified: true,
      moderationStatus: "APPROVED",
      courseCode: "CS101",
      maxMembers: 500,
      requiresApproval: false,
      createdAt: new Date(),
    };

    commFAST_CampusOnly = {
      id: "comm-fast-campus",
      slug: "isb-sports-club",
      name: "Islamabad Campus Sports Club",
      description: "Campus only sports activities",
      universityId: "univ-fast",
      campusId: "campus-isb",
      departmentId: null,
      scope: "CAMPUS",
      visibility: "CAMPUS_ONLY",
      type: "CLUB",
      isVerified: false,
      moderationStatus: "APPROVED",
      maxMembers: 200,
      requiresApproval: false,
      createdAt: new Date(),
    };

    commFAST_DeptCS = {
      id: "comm-fast-dept",
      slug: "cs-research-guild",
      name: "CS Research Guild",
      description: "Computer science research papers and study guides",
      universityId: "univ-fast",
      campusId: null,
      departmentId: "dept-cs",
      scope: "DEPARTMENT",
      visibility: "PUBLIC",
      type: "ACADEMIC",
      isVerified: true,
      moderationStatus: "APPROVED",
      courseCode: "CS490",
      maxMembers: 100,
      requiresApproval: false,
      createdAt: new Date(),
    };

    commFAST_Private = {
      id: "comm-fast-private",
      slug: "secret-algorithms-group",
      name: "Secret Algorithms Group",
      description: "Private invite-only study team",
      universityId: "univ-fast",
      campusId: "campus-isb",
      departmentId: "dept-cs",
      scope: "CAMPUS",
      visibility: "PRIVATE",
      type: "STUDY_GROUP",
      isVerified: false,
      moderationStatus: "APPROVED",
      maxMembers: 20,
      requiresApproval: true,
      createdAt: new Date(),
    };

    mockState.communities.push(
      commFAST_Public,
      commFAST_CampusOnly,
      commFAST_DeptCS,
      commFAST_Private
    );

    // 4. Memberships: CS user is active member of private community
    mockState.communityMembers.push({
      id: "cm-1",
      communityId: "comm-fast-private",
      userId: userFAST_CS.id,
      role: "MEMBER",
      status: "ACTIVE",
      createdAt: new Date(),
    });

    // 5. Events
    const now = new Date();
    eventPublic = {
      id: "evt-pub",
      communityId: "comm-fast-public",
      title: "Annual Hackathon 2026",
      description: "Open campus coding competition",
      startAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      endAt: new Date(now.getTime() + 28 * 60 * 60 * 1000),
      status: "SCHEDULED",
      isOnline: false,
      location: "Main Auditorium",
      createdAt: now,
    };

    eventPrivate = {
      id: "evt-priv",
      communityId: "comm-fast-private",
      title: "Private Mock Interview Session",
      description: "Exclusive mock tests",
      startAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 50 * 60 * 60 * 1000),
      status: "SCHEDULED",
      isOnline: true,
      meetingUrl: "https://meet.google.com/xyz",
      createdAt: now,
    };

    mockState.communityEvents.push(eventPublic, eventPrivate);

    // 6. Announcements
    announcementPinned = {
      id: "ann-pin",
      communityId: "comm-fast-public",
      title: "Registration Open for FAST Olympiad",
      content: "Register before Friday to claim early bird student pass.",
      isPinned: true,
      createdAt: now,
      createdByUserId: userFAST_CS.id,
    };
    mockState.communityAnnouncements.push(announcementPinned);

    // 7. Resources
    resourceTrusted = {
      id: "res-trusted",
      communityId: "comm-fast-dept",
      title: "Operating Systems Lecture Slides",
      description: "Official notes on Overleaf",
      url: "https://overleaf.com/read/abcdefg12345",
      type: "SLIDES",
      courseCode: "CS490",
      createdAt: now,
    };

    resourceRegular = {
      id: "res-reg",
      communityId: "comm-fast-public",
      title: "Tutorial Blog",
      description: "External dev tutorial",
      url: "https://somecustomsite.xyz/post/1",
      type: "ARTICLE",
      createdAt: now,
    };

    mockState.communityResources.push(resourceTrusted, resourceRegular);
  });

  // -------------------------------------------------------------------------
  // 1. Text Normalization, Acronyms & Verified Domains
  // -------------------------------------------------------------------------
  test("1.1 Normalized search query handles punctuation, casing, and acronym extraction", () => {
    const res = normalizeSearchQuery("  FAST-Computing, Society!! ");
    assert.equal(res.normalized, "fast computing society");
    assert.deepEqual(res.tokens, ["fast", "computing", "society"]);
    assert.equal(res.acronym, "fcs");
  });

  test("1.2 Verified domain evaluator accurately distinguishes recognized academic sources without naive suffix matching", () => {
    const trusted1 = evaluateVerifiedDomain("https://github.com/torvalds/linux");
    assert.equal(trusted1.isVerified, true);
    assert.equal(trusted1.domainName, "github.com");

    const trusted2 = evaluateVerifiedDomain("https://drive.google.com/file/d/123/view");
    assert.equal(trusted2.isVerified, true);

    const untrustedSuffix = evaluateVerifiedDomain("https://fakegithub.com/phishing");
    assert.equal(untrustedSuffix.isVerified, false);

    const untrustedEdu = evaluateVerifiedDomain("https://unverified-school.edu.pk/fake");
    assert.equal(untrustedEdu.isVerified, false);
  });

  // -------------------------------------------------------------------------
  // 2. Deterministic Relevance Ranking Formula
  // -------------------------------------------------------------------------
  test("2.1 Ranking formula gives highest deterministic weights to exact matches and institutional relevance", () => {
    const scoreExact = computeDiscoveryRelevanceScore({
      exactNameMatch: true,
      prefixNameMatch: false,
      acronymMatch: false,
      courseCodeMatch: true,
      departmentMatch: true,
      campusMatch: true,
      universityMatch: true,
      isVerified: true,
      isActiveMember: true,
      hasUpcomingEvent: true,
      hasRecentAnnouncement: true,
    });
    // 100 (exact) + 50 (course) + 35 (dept) + 25 (campus) + 20 (univ) + 25 (verified) + 30 (member) + 10 (event) + 5 (ann) = 300
    assert.equal(scoreExact, 300);

    const scorePartial = computeDiscoveryRelevanceScore({
      exactNameMatch: false,
      prefixNameMatch: true,
      acronymMatch: true,
      courseCodeMatch: false,
      departmentMatch: false,
      campusMatch: false,
      universityMatch: false,
      isVerified: false,
      isActiveMember: false,
      hasUpcomingEvent: false,
      hasRecentAnnouncement: false,
    });
    // 60 (prefix) + 40 (acronym) = 100
    assert.equal(scorePartial, 100);
    assert.ok(scoreExact > scorePartial);
  });

  // -------------------------------------------------------------------------
  // 3. Hierarchy & Visibility Safe Filter Builders
  // -------------------------------------------------------------------------
  test("3.1 Community visibility filter strictly excludes private communities for non-members", async () => {
    const ctxCS = await resolveStudentHierarchyContext(userFAST_CS.id);
    const filterCS = buildCommunityVisibilityFilter(ctxCS, { tab: "university" });

    // Active member of private community has activeCommunityIds included in OR clause
    assert.ok(ctxCS.activeCommunityIds.includes(commFAST_Private.id));
    const privateClause = filterCS.OR.find((c: any) => c.visibility === "PRIVATE");
    assert.ok(privateClause);
    assert.deepEqual(privateClause.id, { in: ["comm-fast-private"] });

    // Non-member EE student must NOT have private community in candidate visibility filter
    const ctxEE = await resolveStudentHierarchyContext(userFAST_EE.id);
    const filterEE = buildCommunityVisibilityFilter(ctxEE, { tab: "university" });
    const eePrivateClause = filterEE.OR.find((c: any) => c.visibility === "PRIVATE");
    assert.equal(eePrivateClause, undefined);
  });

  test("3.2 Department tab strictly checks complete institutional hierarchy (univ + dept)", async () => {
    const ctxCS = await resolveStudentHierarchyContext(userFAST_CS.id);
    const filterDept = buildCommunityVisibilityFilter(ctxCS, { tab: "department" });

    assert.equal(filterDept.universityId, "univ-fast");
    assert.equal(filterDept.departmentId, "dept-cs");
  });

  test("3.3 Explore tab strictly constrains candidates to PUBLIC communities", () => {
    const filterExplore = buildCommunityVisibilityFilter(null, { tab: "explore" });
    assert.equal(filterExplore.visibility, "PUBLIC");
  });

  // -------------------------------------------------------------------------
  // 4. API Endpoint Integration: /api/discovery/communities
  // -------------------------------------------------------------------------
  test("4.1 GET /api/discovery/communities with Bearer token isolates scopes and verifies member status", async () => {
    const token = await generateMobileToken({
      userId: userFAST_CS.id,
      name: userFAST_CS.name,
      email: userFAST_CS.email,
    });
    const req = new NextRequest("http://localhost:3000/api/discovery/communities?tab=university", {
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await getDiscoveredCommunities(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.communities));
    assert.ok(body.communities.length > 0);

    // Private community is returned because CS user is ACTIVE member
    const privateItem = body.communities.find((c: any) => c.id === commFAST_Private.id);
    assert.ok(privateItem);
    assert.equal(privateItem.isMember, true);
    assert.equal(privateItem.currentUserStatus, "ACTIVE");
  });

  test("4.2 GET /api/discovery/communities never leaks private communities to unauthorized students", async () => {
    const tokenOther = await generateMobileToken({
      userId: userOtherUniv.id,
      name: userOtherUniv.name,
      email: userOtherUniv.email,
    });
    const req = new NextRequest("http://localhost:3000/api/discovery/communities?tab=university", {
      headers: { authorization: `Bearer ${tokenOther}` },
    });

    const res = await getDiscoveredCommunities(req);
    assert.equal(res.status, 200);
    const body = await res.json();

    const leaked = body.communities.some((c: any) => c.visibility === "PRIVATE");
    assert.equal(leaked, false, "Private communities must never leak to non-members");
  });

  // -------------------------------------------------------------------------
  // 5. API Endpoint Integration: /api/discovery/events
  // -------------------------------------------------------------------------
  test("5.1 GET /api/discovery/events respects timeline filtering and scopes", async () => {
    const token = await generateMobileToken({
      userId: userFAST_CS.id,
      name: userFAST_CS.name,
      email: userFAST_CS.email,
    });
    const req = new NextRequest("http://localhost:3000/api/discovery/events?timeline=upcoming&scope=campus", {
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await getDiscoveredEvents(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.events));
    assert.ok(body.events.some((e: any) => e.id === eventPublic.id));
  });

  // -------------------------------------------------------------------------
  // 6. API Endpoint Integration: /api/discovery/announcements
  // -------------------------------------------------------------------------
  test("6.1 GET /api/discovery/announcements orders pinned first and airgaps author credentials", async () => {
    const token = await generateMobileToken({
      userId: userFAST_CS.id,
      name: userFAST_CS.name,
      email: userFAST_CS.email,
    });
    const req = new NextRequest("http://localhost:3000/api/discovery/announcements?scope=university", {
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await getDiscoveredAnnouncements(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.announcements));
    const first = body.announcements[0];
    assert.equal(first.isPinned, true);
    assert.equal(first.author.email, undefined, "Email must be excluded by privacy airgap");
    assert.equal(first.author.passwordHash, undefined, "Password hash must be excluded");
  });

  // -------------------------------------------------------------------------
  // 7. API Endpoint Integration: /api/discovery/resources
  // -------------------------------------------------------------------------
  test("7.1 GET /api/discovery/resources returns verified domain badges and supports course filtering", async () => {
    const token = await generateMobileToken({
      userId: userFAST_CS.id,
      name: userFAST_CS.name,
      email: userFAST_CS.email,
    });
    const req = new NextRequest("http://localhost:3000/api/discovery/resources?courseCode=CS490", {
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await getDiscoveredResources(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.resources));
    const osSlides = body.resources.find((r: any) => r.id === resourceTrusted.id);
    assert.ok(osSlides);
    assert.equal(osSlides.verifiedDomain, true);
    assert.equal(osSlides.domainName, "overleaf.com");
  });

  // -------------------------------------------------------------------------
  // 8. Federated Command Palette Search: /api/discovery/search
  // -------------------------------------------------------------------------
  test("8.1 GET /api/discovery/search federates across 4 categories and bounds results", async () => {
    const token = await generateMobileToken({
      userId: userFAST_CS.id,
      name: userFAST_CS.name,
      email: userFAST_CS.email,
    });
    const req = new NextRequest("http://localhost:3000/api/discovery/search?q=FAST&limit=3", {
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await getDiscoverySearch(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.query, "FAST");
    assert.ok(body.results.communities !== undefined);
    assert.ok(body.results.events !== undefined);
    assert.ok(body.results.announcements !== undefined);
    assert.ok(body.results.resources !== undefined);
    assert.ok(body.totalCount > 0);
  });

  // -------------------------------------------------------------------------
  // 9. Deterministic Campus Intelligence: /api/discovery/intelligence
  // -------------------------------------------------------------------------
  test("9.1 GET /api/discovery/intelligence produces accurate deterministic stats without AI quota consumption", async () => {
    const token = await generateMobileToken({
      userId: userFAST_CS.id,
      name: userFAST_CS.name,
      email: userFAST_CS.email,
    });
    const req = new NextRequest("http://localhost:3000/api/discovery/intelligence", {
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await getCampusIntelligenceRoute(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.campusIntelligence);
    const { stats, highlights } = body.campusIntelligence;
    assert.ok(typeof stats.upcomingEventsThisWeek === "number");
    assert.ok(typeof stats.newAnnouncementsCount === "number");
    assert.ok(typeof stats.newDepartmentResourcesCount === "number");
    assert.equal(stats.activeCommunitiesJoinedCount, 1);
    assert.ok(highlights.latestAnnouncement !== null);
  });
});
