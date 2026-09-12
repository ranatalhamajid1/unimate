import "./setup-prisma";
import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetMockState, mockState, mockPrisma } from "./setup-prisma";
import {
  handleEventRSVP,
  validateReportTarget,
  validateResourceUrl,
  sanitizeMarkdownContent,
  dispatchCommunityNotification,
  AttendeeStatus,
  EventStatus,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  MemberRole,
  MembershipStatus,
} from "../app/lib/communities";
import { GET as getAnnouncements, POST as postAnnouncement } from "../app/api/communities/[slug]/announcements/route";
import { PATCH as patchAnnouncement } from "../app/api/communities/[slug]/announcements/[id]/route";
import { POST as postReport } from "../app/api/communities/[slug]/reports/route";
import { GET as getManageReports } from "../app/api/communities/[slug]/manage/reports/route";
import { PATCH as patchManageReport } from "../app/api/communities/[slug]/manage/reports/[id]/route";
import { GET as getEvents, POST as postEvent } from "../app/api/communities/[slug]/events/route";
import { POST as postRSVP } from "../app/api/communities/[slug]/events/[id]/rsvp/route";
import { GET as getAttendees } from "../app/api/communities/[slug]/events/[id]/attendees/route";
import { GET as getResources, POST as postResource } from "../app/api/communities/[slug]/resources/route";
import { PATCH as patchMember } from "../app/api/communities/[slug]/manage/members/[id]/route";
import { POST as postTransferOwnership } from "../app/api/communities/[slug]/manage/transfer-ownership/route";
import { NextRequest } from "next/server";
import { generateMobileToken } from "../app/lib/mobile-auth";

describe("Phase 16: Campus Network 2.0 (Milestone 10) Test Suite", () => {
  let userOwner: any;
  let userAdmin: any;
  let userMod: any;
  let userMember: any;
  let userBanned: any;
  let userPending: any;
  let userExternal: any;
  let communityA: any;
  let communityB: any;
  let privateCommunity: any;

  beforeEach(async () => {
    resetMockState();

    // 1. Setup Universities
    const univ = { id: "univ-1", name: "National University", shortName: "NUST" };
    mockState.universities.push(univ);

    // 2. Setup Users
    userOwner = { id: "usr-owner", name: "Owner User", email: "owner@nust.edu.pk", universityId: "univ-1" };
    userAdmin = { id: "usr-admin", name: "Admin User", email: "admin@nust.edu.pk", universityId: "univ-1" };
    userMod = { id: "usr-mod", name: "Mod User", email: "mod@nust.edu.pk", universityId: "univ-1" };
    userMember = { id: "usr-member", name: "Member User", email: "member@nust.edu.pk", universityId: "univ-1" };
    userBanned = { id: "usr-banned", name: "Banned User", email: "banned@nust.edu.pk", universityId: "univ-1" };
    userPending = { id: "usr-pending", name: "Pending User", email: "pending@nust.edu.pk", universityId: "univ-1" };
    userExternal = { id: "usr-external", name: "External User", email: "ext@other.edu.pk", universityId: null };

    mockState.users.push(userOwner, userAdmin, userMod, userMember, userBanned, userPending, userExternal);

    // 3. Setup Communities
    communityA = {
      id: "comm-a",
      slug: "ai-club",
      name: "AI Club",
      description: "AI enthusiasts",
      universityId: "univ-1",
      visibility: "PUBLIC",
      maxMembers: 100,
    };

    communityB = {
      id: "comm-b",
      slug: "robotics-society",
      name: "Robotics Society",
      description: "Robotics",
      universityId: "univ-1",
      visibility: "PUBLIC",
      maxMembers: 100,
    };

    privateCommunity = {
      id: "comm-priv",
      slug: "secret-research",
      name: "Secret Research",
      description: "Invitation only",
      universityId: "univ-1",
      visibility: "PRIVATE",
      maxMembers: 20,
    };

    mockState.communities.push(communityA, communityB, privateCommunity);

    // 4. Setup Community Memberships for Community A
    mockState.communityMembers.push(
      { id: "cm-1", communityId: "comm-a", userId: userOwner.id, role: "OWNER", status: "ACTIVE" },
      { id: "cm-admin", communityId: "comm-a", userId: userAdmin.id, role: "ADMIN", status: "ACTIVE" },
      { id: "cm-2", communityId: "comm-a", userId: userMod.id, role: "MODERATOR", status: "ACTIVE" },
      { id: "cm-3", communityId: "comm-a", userId: userMember.id, role: "MEMBER", status: "ACTIVE" },
      { id: "cm-4", communityId: "comm-a", userId: userBanned.id, role: "MEMBER", status: "BANNED" },
      { id: "cm-5", communityId: "comm-a", userId: userPending.id, role: "MEMBER", status: "PENDING" }
    );

    // Setup Community B Moderator
    mockState.communityMembers.push(
      { id: "cm-6", communityId: "comm-b", userId: userOwner.id, role: "OWNER", status: "ACTIVE" }
    );

    // Setup Private Community Member
    mockState.communityMembers.push(
      { id: "cm-7", communityId: "comm-priv", userId: userOwner.id, role: "OWNER", status: "ACTIVE" }
    );
  });

  // Helper for requests using Bearer JWT
  const makeReq = async (url: string, method: string, user?: any, body?: any) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (user) {
      const token = await generateMobileToken({ userId: user.id, name: user.name || "User", email: user.email });
      headers["authorization"] = `Bearer ${token}`;
    }
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  // -------------------------------------------------------------------------
  // 1. Report Target Ownership Invariants & Scoping
  // -------------------------------------------------------------------------
  test("1. Report Target Ownership: Rejects target belonging to another community", async () => {
    const annB = {
      id: "ann-b1",
      communityId: "comm-b",
      title: "Community B Event",
      content: "Content",
    };
    mockState.communityAnnouncements.push(annB);

    const req = await makeReq(
      "http://localhost/api/communities/ai-club/reports",
      "POST",
      userMember,
      {
        targetType: ReportTargetType.ANNOUNCEMENT,
        targetId: annB.id,
        reason: ReportReason.SPAM,
        description: "This is spam from another community",
      }
    );

    const res = await postReport(req, { params: Promise.resolve({ slug: "ai-club" }) });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /not found in this community|does not belong/i);
  });

  test("2. Report Target Ownership: Accepts legitimate target in matching community", async () => {
    const annA = {
      id: "ann-a1",
      communityId: "comm-a",
      title: "Legit Community A Item",
      content: "Content",
    };
    mockState.communityAnnouncements.push(annA);

    const req = await makeReq(
      "http://localhost/api/communities/ai-club/reports",
      "POST",
      userMember,
      {
        targetType: ReportTargetType.ANNOUNCEMENT,
        targetId: annA.id,
        reason: ReportReason.HARASSMENT,
        description: "Inappropriate language in this announcement",
      }
    );

    const res = await postReport(req, { params: Promise.resolve({ slug: "ai-club" }) });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.report.communityId, "comm-a");
    assert.equal(data.report.targetId, annA.id);
  });

  test("3. Anti-Spam: Prevents duplicate pending reports for the same target", async () => {
    const annA = { id: "ann-a2", communityId: "comm-a", title: "Target", content: "Content" };
    mockState.communityAnnouncements.push(annA);

    mockState.communityReports.push({
      id: "rep-1",
      communityId: "comm-a",
      reporterUserId: userMember.id,
      targetType: ReportTargetType.ANNOUNCEMENT,
      targetId: annA.id,
      status: ReportStatus.PENDING,
      reason: ReportReason.SPAM,
      description: "First report",
    });

    const req = await makeReq(
      "http://localhost/api/communities/ai-club/reports",
      "POST",
      userMember,
      {
        targetType: ReportTargetType.ANNOUNCEMENT,
        targetId: annA.id,
        reason: ReportReason.SPAM,
        description: "Second duplicate report",
      }
    );

    const res = await postReport(req, { params: Promise.resolve({ slug: "ai-club" }) });
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.match(data.error, /already have an active pending report/i);
  });

  test("4. Scoped Moderation: Community A moderator CANNOT access Community B reports", async () => {
    mockState.communityReports.push({
      id: "rep-b",
      communityId: "comm-b",
      reporterUserId: userMember.id,
      targetType: ReportTargetType.COMMUNITY,
      targetId: "comm-b",
      status: ReportStatus.PENDING,
      reason: ReportReason.OTHER,
      description: "B report",
    });

    const req = await makeReq("http://localhost/api/communities/robotics-society/manage/reports", "GET", userMod);
    const res = await getManageReports(req, { params: Promise.resolve({ slug: "robotics-society" }) });
    assert.equal(res.status, 403);
  });

  test("5. Scoped Moderation: Moderator resolves report with resolution notes", async () => {
    const report = {
      id: "rep-a1",
      communityId: "comm-a",
      reporterUserId: userMember.id,
      targetType: ReportTargetType.COMMUNITY,
      targetId: "comm-a",
      status: ReportStatus.PENDING,
      reason: ReportReason.SPAM,
      description: "Community spam",
    };
    mockState.communityReports.push(report);

    const req = await makeReq(
      "http://localhost/api/communities/ai-club/manage/reports/rep-a1",
      "PATCH",
      userMod,
      {
        status: ReportStatus.RESOLVED,
        resolutionNotes: "Issue investigated and resolved.",
      }
    );

    const res = await patchManageReport(req, { params: Promise.resolve({ slug: "ai-club", id: "rep-a1" }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.report.status, ReportStatus.RESOLVED);
    assert.equal(data.report.resolvedByUserId, userMod.id);
  });

  // -------------------------------------------------------------------------
  // 2. Announcements & Pin Limits
  // -------------------------------------------------------------------------
  test("6. Announcements: Regular member cannot post announcement (403)", async () => {
    const req = await makeReq("http://localhost/api/communities/ai-club/announcements", "POST", userMember, {
      title: "Member Announcement",
      content: "Hello everyone",
    });
    const res = await postAnnouncement(req, { params: Promise.resolve({ slug: "ai-club" }) });
    assert.equal(res.status, 403);
  });

  test("7. Announcements: Enforces maximum of 3 pinned announcements", async () => {
    mockState.communityAnnouncements.push(
      { id: "p1", communityId: "comm-a", title: "P1", content: "C", isPinned: true },
      { id: "p2", communityId: "comm-a", title: "P2", content: "C", isPinned: true },
      { id: "p3", communityId: "comm-a", title: "P3", content: "C", isPinned: true }
    );

    const req = await makeReq("http://localhost/api/communities/ai-club/announcements", "POST", userMod, {
      title: "P4",
      content: "Content",
      isPinned: true,
    });
    const res = await postAnnouncement(req, { params: Promise.resolve({ slug: "ai-club" }) });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /maximum of 3 announcements/i);
  });

  test("8. Announcements: Sanitizes dangerous HTML content", () => {
    const raw = `Hello <script>alert('xss')</script><b>World</b> <iframe src="evil.com"></iframe>`;
    const sanitized = sanitizeMarkdownContent(raw);
    assert.equal(sanitized.includes("<script>"), false);
    assert.equal(sanitized.includes("<iframe>"), false);
    assert.equal(sanitized.includes("<b>World</b>"), true);
  });

  // -------------------------------------------------------------------------
  // 3. Events Engine, Persistent RSVP & Concurrency Safety
  // -------------------------------------------------------------------------
  test("9. RSVP Invariant: Banned member cannot RSVP (403)", async () => {
    const event = {
      id: "ev-1",
      communityId: "comm-a",
      title: "Workshop",
      description: "Desc",
      startAt: new Date(Date.now() + 100000),
      endAt: new Date(Date.now() + 200000),
      capacity: 50,
      status: EventStatus.SCHEDULED,
    };
    mockState.communityEvents.push(event);

    const req = await makeReq("http://localhost/api/communities/ai-club/events/ev-1/rsvp", "POST", userBanned, {
      status: AttendeeStatus.GOING,
    });
    const res = await postRSVP(req, { params: Promise.resolve({ slug: "ai-club", id: "ev-1" }) });
    assert.equal(res.status, 403);
  });

  test("10. RSVP Invariant: Pending member cannot RSVP (403)", async () => {
    const req = await makeReq("http://localhost/api/communities/ai-club/events/ev-1/rsvp", "POST", userPending, {
      status: AttendeeStatus.GOING,
    });
    const res = await postRSVP(req, { params: Promise.resolve({ slug: "ai-club", id: "ev-1" }) });
    assert.equal(res.status, 403);
  });

  test("11. Persistent RSVP: Active member can RSVP GOING, MAYBE, and NOT_GOING", async () => {
    const event = {
      id: "ev-1",
      communityId: "comm-a",
      title: "Workshop",
      description: "Desc",
      startAt: new Date(Date.now() + 100000),
      endAt: new Date(Date.now() + 200000),
      capacity: 50,
      status: EventStatus.SCHEDULED,
    };
    mockState.communityEvents.push(event);

    // 1. RSVP GOING
    const reqGoing = await makeReq("http://localhost/api/communities/ai-club/events/ev-1/rsvp", "POST", userMember, {
      status: AttendeeStatus.GOING,
    });
    const resGoing = await postRSVP(reqGoing, { params: Promise.resolve({ slug: "ai-club", id: "ev-1" }) });
    assert.equal(resGoing.status, 200);

    // 2. RSVP MAYBE
    const reqMaybe = await makeReq("http://localhost/api/communities/ai-club/events/ev-1/rsvp", "POST", userMember, {
      status: AttendeeStatus.MAYBE,
    });
    const resMaybe = await postRSVP(reqMaybe, { params: Promise.resolve({ slug: "ai-club", id: "ev-1" }) });
    assert.equal(resMaybe.status, 200);

    // 3. RSVP NOT_GOING
    const reqNot = await makeReq("http://localhost/api/communities/ai-club/events/ev-1/rsvp", "POST", userMember, {
      status: AttendeeStatus.NOT_GOING,
    });
    const resNot = await postRSVP(reqNot, { params: Promise.resolve({ slug: "ai-club", id: "ev-1" }) });
    assert.equal(resNot.status, 200);

    // Verify NOT_GOING is excluded from attendee listings
    const reqAttendees = await makeReq("http://localhost/api/communities/ai-club/events/ev-1/attendees", "GET", userMember);
    const resAttendees = await getAttendees(reqAttendees, { params: Promise.resolve({ slug: "ai-club", id: "ev-1" }) });
    assert.equal(resAttendees.status, 200);
    const attendeesData = await resAttendees.json();
    assert.equal(attendeesData.attendees.length, 0); // NOT_GOING excluded!
  });

  test("12. Concurrency-Safe Capacity: Prevents overbooking when capacity is full", async () => {
    // Event with capacity = 1
    const eventLimited = {
      id: "ev-limited",
      communityId: "comm-a",
      title: "Exclusive Lab",
      description: "Limited seats",
      startAt: new Date(Date.now() + 100000),
      endAt: new Date(Date.now() + 200000),
      capacity: 1,
      status: EventStatus.SCHEDULED,
    };
    mockState.communityEvents.push(eventLimited);

    // First user takes the spot
    const res1 = await handleEventRSVP(mockPrisma as any, {
      communityId: "comm-a",
      eventId: "ev-limited",
      userId: userMember.id,
      status: AttendeeStatus.GOING,
    });
    assert.equal(res1.success, true);

    // Second user attempts to RSVP GOING to full event -> rejected with 409
    const res2 = await handleEventRSVP(mockPrisma as any, {
      communityId: "comm-a",
      eventId: "ev-limited",
      userId: userMod.id,
      status: AttendeeStatus.GOING,
    });
    assert.equal(res2.success, false);
    assert.equal(res2.code, 409);
    assert.match(res2.error!, /full capacity/i);
  });

  // -------------------------------------------------------------------------
  // 4. Private Community Enumeration Protection (Zero Information Leakage)
  // -------------------------------------------------------------------------
  test("13. Privacy Airgap: Non-member querying private community events returns 404", async () => {
    const req = await makeReq("http://localhost/api/communities/secret-research/events", "GET", userMember);
    const res = await getEvents(req, { params: Promise.resolve({ slug: "secret-research" }) });
    assert.equal(res.status, 404);
  });

  test("14. Privacy Airgap: Non-member querying private community announcements returns 404", async () => {
    const req = await makeReq("http://localhost/api/communities/secret-research/announcements", "GET", userMember);
    const res = await getAnnouncements(req, { params: Promise.resolve({ slug: "secret-research" }) });
    assert.equal(res.status, 404);
  });

  test("15. Privacy Airgap: Non-member querying private community resources returns 404", async () => {
    const req = await makeReq("http://localhost/api/communities/secret-research/resources", "GET", userMember);
    const res = await getResources(req, { params: Promise.resolve({ slug: "secret-research" }) });
    assert.equal(res.status, 404);
  });

  // -------------------------------------------------------------------------
  // 5. Link-Only Resources & Anti-SSRF Validation
  // -------------------------------------------------------------------------
  test("16. Resources: Rejects non-HTTPS and local network SSRF URLs", () => {
    assert.equal(validateResourceUrl("http://insecure.com").valid, false);
    assert.equal(validateResourceUrl("ftp://file.com").valid, false);
    assert.equal(validateResourceUrl("https://localhost:8080").valid, false);
    assert.equal(validateResourceUrl("https://127.0.0.1/admin").valid, false);
    assert.equal(validateResourceUrl("https://192.168.1.1").valid, false);
    assert.equal(validateResourceUrl("https://drive.google.com/folder/123").valid, true);
  });

  test("17. Resources: Active member can add verified HTTPS resource", async () => {
    const req = await makeReq("http://localhost/api/communities/ai-club/resources", "POST", userMember, {
      title: "Lecture 1 Slides",
      url: "https://drive.google.com/file/d/123/view",
    });
    const res = await postResource(req, { params: Promise.resolve({ slug: "ai-club" }) });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.resource.title, "Lecture 1 Slides");
  });

  // -------------------------------------------------------------------------
  // 6. Anti-Spam Notifications & Role Safety
  // -------------------------------------------------------------------------
  test("18. Notifications: Dispatches batch notification on new announcement without notifying author", async () => {
    await dispatchCommunityNotification(mockPrisma as any, {
      communityId: "comm-a",
      type: "COMMUNITY_ANNOUNCEMENT",
      title: "New Announcement",
      message: "Test message",
      initiatingUserId: userMod.id,
    });

    const notifs = mockState.notifications;
    assert.equal(notifs.some((n: any) => n.userId === userMod.id), false);
    assert.equal(notifs.some((n: any) => n.userId === userMember.id), true);
  });

  test("19. Role Hierarchy: Moderator cannot change roles (403), Admin cannot promote to Owner (400)", async () => {
    // 1. Moderator attempting to change roles -> 403
    const reqMod = await makeReq(
      "http://localhost/api/communities/ai-club/manage/members/cm-3",
      "PATCH",
      userMod,
      { role: MemberRole.MODERATOR }
    );
    const resMod = await patchMember(reqMod, { params: Promise.resolve({ slug: "ai-club", id: "cm-3" }) });
    assert.equal(resMod.status, 403);

    // 2. Admin attempting to promote to Owner -> 400 (must use transfer ownership)
    const reqAdmin = await makeReq(
      "http://localhost/api/communities/ai-club/manage/members/cm-3",
      "PATCH",
      userAdmin,
      { role: MemberRole.OWNER }
    );
    const resAdmin = await patchMember(reqAdmin, { params: Promise.resolve({ slug: "ai-club", id: "cm-3" }) });
    assert.equal(resAdmin.status, 400);
    const data = await resAdmin.json();
    assert.match(data.error, /transfer-ownership/i);
  });

  test("20. Ownership Transfer: Owner can atomically transfer ownership to active member", async () => {
    const req = await makeReq(
      "http://localhost/api/communities/ai-club/manage/transfer-ownership",
      "POST",
      userOwner,
      { targetUserId: userMember.id }
    );
    const res = await postTransferOwnership(req, { params: Promise.resolve({ slug: "ai-club" }) });
    assert.equal(res.status, 200);

    const oldOwner = mockState.communityMembers.find((m: any) => m.userId === userOwner.id);
    const newOwner = mockState.communityMembers.find((m: any) => m.userId === userMember.id);
    assert.equal(oldOwner.role, MemberRole.ADMIN);
    assert.equal(newOwner.role, MemberRole.OWNER);
  });

  // -------------------------------------------------------------------------
  // 7. Security Hardening & Concurrency Regression Tests
  // -------------------------------------------------------------------------
  test("21. Pinned Announcements: Concurrent pin attempts cannot produce more than 3 pinned announcements", async () => {
    // 1. Seed community with 2 pinned announcements
    mockState.communityAnnouncements.push(
      {
        id: "ann-p1",
        communityId: "comm-a",
        title: "Pinned 1",
        content: "Content 1",
        isPinned: true,
        createdByUserId: userOwner.id,
      },
      {
        id: "ann-p2",
        communityId: "comm-a",
        title: "Pinned 2",
        content: "Content 2",
        isPinned: true,
        createdByUserId: userOwner.id,
      },
      {
        id: "ann-unpinned-1",
        communityId: "comm-a",
        title: "Candidate 1",
        content: "Content 3",
        isPinned: false,
        createdByUserId: userOwner.id,
      },
      {
        id: "ann-unpinned-2",
        communityId: "comm-a",
        title: "Candidate 2",
        content: "Content 4",
        isPinned: false,
        createdByUserId: userOwner.id,
      }
    );

    // 2. Simulate two simultaneous requests attempting to pin different announcements
    const req1 = await makeReq(
      "http://localhost/api/communities/ai-club/announcements/ann-unpinned-1",
      "PATCH",
      userOwner,
      { isPinned: true }
    );
    const req2 = await makeReq(
      "http://localhost/api/communities/ai-club/announcements/ann-unpinned-2",
      "PATCH",
      userOwner,
      { isPinned: true }
    );

    const [res1, res2] = await Promise.all([
      patchAnnouncement(req1, { params: Promise.resolve({ slug: "ai-club", id: "ann-unpinned-1" }) }),
      patchAnnouncement(req2, { params: Promise.resolve({ slug: "ai-club", id: "ann-unpinned-2" }) }),
    ]);

    // One must succeed (200), and the second must be rejected (400) because limit of 3 is reached
    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [200, 400]);

    // Invariant check: total pinned announcements in DB must be exactly 3, NEVER 4!
    const totalPinned = mockState.communityAnnouncements.filter(
      (a: any) => a.communityId === "comm-a" && a.isPinned
    ).length;
    assert.equal(totalPinned, 3);
  });

  test("22. Pinned Announcements: Pinning already-pinned announcement is idempotent, unpinning and deletion free slots", async () => {
    // Seed 3 pinned announcements
    mockState.communityAnnouncements.push(
      {
        id: "ann-p1",
        communityId: "comm-a",
        title: "Pinned 1",
        content: "Content 1",
        isPinned: true,
        createdByUserId: userOwner.id,
      },
      {
        id: "ann-p2",
        communityId: "comm-a",
        title: "Pinned 2",
        content: "Content 2",
        isPinned: true,
        createdByUserId: userOwner.id,
      },
      {
        id: "ann-p3",
        communityId: "comm-a",
        title: "Pinned 3",
        content: "Content 3",
        isPinned: true,
        createdByUserId: userOwner.id,
      }
    );

    // Already pinned announcement ann-p1
    const reqSame = await makeReq(
      "http://localhost/api/communities/ai-club/announcements/ann-p1",
      "PATCH",
      userOwner,
      { isPinned: true }
    );
    const resSame = await patchAnnouncement(reqSame, { params: Promise.resolve({ slug: "ai-club", id: "ann-p1" }) });
    assert.equal(resSame.status, 200);

    // Unpin ann-p1 -> total pinned becomes 2
    const reqUnpin = await makeReq(
      "http://localhost/api/communities/ai-club/announcements/ann-p1",
      "PATCH",
      userOwner,
      { isPinned: false }
    );
    const resUnpin = await patchAnnouncement(reqUnpin, { params: Promise.resolve({ slug: "ai-club", id: "ann-p1" }) });
    assert.equal(resUnpin.status, 200);

    const pinnedCountAfterUnpin = mockState.communityAnnouncements.filter(
      (a: any) => a.communityId === "comm-a" && a.isPinned
    ).length;
    assert.equal(pinnedCountAfterUnpin, 2);
  });

  test("23. Role Hierarchy: Admin cannot modify another Admin; Mod cannot modify Mod or Admin", async () => {
    // Setup another admin in Community A
    const userAdmin2 = { id: "usr-admin-2", name: "Admin 2", email: "admin2@nust.edu.pk", universityId: "univ-1" };
    mockState.users.push(userAdmin2);
    mockState.communityMembers.push({
      id: "cm-admin-2",
      communityId: "comm-a",
      userId: userAdmin2.id,
      role: MemberRole.ADMIN,
      status: MembershipStatus.ACTIVE,
    });

    // 1. Admin 1 attempts to ban Admin 2 -> 403 (Only Owner can modify Admin)
    const reqAdminToAdmin = await makeReq(
      "http://localhost/api/communities/ai-club/manage/members/cm-admin-2",
      "PATCH",
      userAdmin,
      { status: MembershipStatus.BANNED }
    );
    const resAdminToAdmin = await patchMember(reqAdminToAdmin, {
      params: Promise.resolve({ slug: "ai-club", id: "cm-admin-2" }),
    });
    assert.equal(resAdminToAdmin.status, 403);
    const dataAdmin = await resAdminToAdmin.json();
    assert.match(dataAdmin.error, /owner can modify administrators/i);

    // 2. Mod attempts to ban Admin -> 403
    const reqModToAdmin = await makeReq(
      "http://localhost/api/communities/ai-club/manage/members/cm-admin-2",
      "PATCH",
      userMod,
      { status: MembershipStatus.BANNED }
    );
    const resModToAdmin = await patchMember(reqModToAdmin, {
      params: Promise.resolve({ slug: "ai-club", id: "cm-admin-2" }),
    });
    assert.equal(resModToAdmin.status, 403);

    // 3. Mod attempts to modify another Mod -> 403
    const userMod2 = { id: "usr-mod-2", name: "Mod 2", email: "mod2@nust.edu.pk", universityId: "univ-1" };
    mockState.users.push(userMod2);
    mockState.communityMembers.push({
      id: "cm-mod-2",
      communityId: "comm-a",
      userId: userMod2.id,
      role: MemberRole.MODERATOR,
      status: MembershipStatus.ACTIVE,
    });

    const reqModToMod = await makeReq(
      "http://localhost/api/communities/ai-club/manage/members/cm-mod-2",
      "PATCH",
      userMod,
      { status: MembershipStatus.BANNED }
    );
    const resModToMod = await patchMember(reqModToMod, {
      params: Promise.resolve({ slug: "ai-club", id: "cm-mod-2" }),
    });
    assert.equal(resModToMod.status, 403);
  });

  test("24. Role Hierarchy: Admin cannot promote members to Admin (Owner only)", async () => {
    const req = await makeReq(
      "http://localhost/api/communities/ai-club/manage/members/cm-3",
      "PATCH",
      userAdmin,
      { role: MemberRole.ADMIN }
    );
    const res = await patchMember(req, {
      params: Promise.resolve({ slug: "ai-club", id: "cm-3" }),
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.error, /owner can promote members to Admin/i);
  });

  test("25. Private Airgap: Non-member querying RSVP, attendees, or resources returns 404", async () => {
    // Seed an event in private community
    const privEvent = {
      id: "ev-priv",
      communityId: "comm-priv",
      title: "Classified Meeting",
      description: "Secret",
      startAt: new Date(),
      endAt: new Date(),
      status: EventStatus.SCHEDULED,
    };
    mockState.communityEvents.push(privEvent);

    // 1. Non-member RSVP -> 404
    const reqRsvp = await makeReq(
      "http://localhost/api/communities/secret-research/events/ev-priv/rsvp",
      "POST",
      userMember,
      { status: AttendeeStatus.GOING }
    );
    const resRsvp = await postRSVP(reqRsvp, {
      params: Promise.resolve({ slug: "secret-research", id: "ev-priv" }),
    });
    assert.equal(resRsvp.status, 404);

    // 2. Non-member attendees -> 404
    const reqAtt = await makeReq(
      "http://localhost/api/communities/secret-research/events/ev-priv/attendees",
      "GET",
      userMember
    );
    const resAtt = await getAttendees(reqAtt, {
      params: Promise.resolve({ slug: "secret-research", id: "ev-priv" }),
    });
    assert.equal(resAtt.status, 404);

    // 3. Non-member add resource -> 404
    const reqRes = await makeReq(
      "http://localhost/api/communities/secret-research/resources",
      "POST",
      userMember,
      { title: "Leak", url: "https://drive.google.com/test" }
    );
    const resRes = await postResource(reqRes, {
      params: Promise.resolve({ slug: "secret-research" }),
    });
    assert.equal(resRes.status, 404);
  });

  test("26. Private Airgap: Non-member querying manage reports on private community returns 404", async () => {
    const req = await makeReq(
      "http://localhost/api/communities/secret-research/manage/reports",
      "GET",
      userMember
    );
    const res = await getManageReports(req, {
      params: Promise.resolve({ slug: "secret-research" }),
    });
    assert.equal(res.status, 404);
  });

  test("27. SSRF Security: Rejects cloud metadata 169.254.169.254, IPv6 loopback, and internal addresses", () => {
    assert.equal(validateResourceUrl("https://169.254.169.254/latest/meta-data/").valid, false);
    assert.equal(validateResourceUrl("https://[::1]/secret").valid, false);
    assert.equal(validateResourceUrl("https://127.0.0.99:9000/").valid, false);
    assert.equal(validateResourceUrl("https://cluster.internal/admin").valid, false);
    assert.equal(validateResourceUrl("https://sub.localhost/test").valid, false);
    assert.equal(validateResourceUrl("https://0.0.0.0/").valid, false);
    assert.equal(validateResourceUrl("javascript:alert(1)").valid, false);
    assert.equal(validateResourceUrl("https://wikipedia.org/wiki/Computer_science").valid, true);
  });

  test("28. XSS/Markdown: Sanitizes dangerous HTML event handlers and schemes while preserving Markdown", () => {
    const dirty = `# Welcome to Study Group\n**Important:** Please review the materials.\n<img src="x" onerror="alert('pwned')">\n[Click here](javascript:alert(1))\n<script>alert('bad')</script>\n- Item 1\n- Item 2\n\`\`\`javascript\nconst a = 1;\n\`\`\``;
    const clean = sanitizeMarkdownContent(dirty);

    // Danger checks
    assert.equal(clean.includes("onerror"), false);
    assert.equal(clean.includes("<script>"), false);
    assert.equal(clean.includes("javascript:"), false);

    // Markdown preservation checks
    assert.equal(clean.includes("# Welcome to Study Group"), true);
    assert.equal(clean.includes("**Important:**"), true);
    assert.equal(clean.includes("- Item 1"), true);
    assert.equal(clean.includes("const a = 1;"), true);
  });

  test("29. RSVP Capacity: GOING -> MAYBE frees 1 capacity, enabling another user to RSVP GOING", async () => {
    const eventCap1 = {
      id: "ev-cap-1",
      communityId: "comm-a",
      title: "One Seat Lab",
      description: "Only one student allowed",
      startAt: new Date(Date.now() + 100000),
      endAt: new Date(Date.now() + 200000),
      capacity: 1,
      status: EventStatus.SCHEDULED,
    };
    mockState.communityEvents.push(eventCap1);

    // User 1 RSVPs GOING (capacity is full)
    const r1 = await handleEventRSVP(mockPrisma as any, {
      communityId: "comm-a",
      eventId: "ev-cap-1",
      userId: userMember.id,
      status: AttendeeStatus.GOING,
    });
    assert.equal(r1.success, true);

    // User 2 attempts GOING -> rejected 409
    const r2 = await handleEventRSVP(mockPrisma as any, {
      communityId: "comm-a",
      eventId: "ev-cap-1",
      userId: userMod.id,
      status: AttendeeStatus.GOING,
    });
    assert.equal(r2.success, false);
    assert.equal(r2.code, 409);

    // User 1 changes RSVP to MAYBE (frees the seat)
    const r1Maybe = await handleEventRSVP(mockPrisma as any, {
      communityId: "comm-a",
      eventId: "ev-cap-1",
      userId: userMember.id,
      status: AttendeeStatus.MAYBE,
    });
    assert.equal(r1Maybe.success, true);

    // User 2 can now successfully RSVP GOING
    const r2Going = await handleEventRSVP(mockPrisma as any, {
      communityId: "comm-a",
      eventId: "ev-cap-1",
      userId: userMod.id,
      status: AttendeeStatus.GOING,
    });
    assert.equal(r2Going.success, true);
  });

  test("30. IDOR Protection: Cannot access or mutate child entity of Community B using Community A slug", async () => {
    // Event belongs to Community B
    const eventB = {
      id: "ev-comm-b",
      communityId: "comm-b",
      title: "Robotics Workshop",
      description: "Hands-on",
      startAt: new Date(),
      endAt: new Date(),
      status: EventStatus.SCHEDULED,
    };
    mockState.communityEvents.push(eventB);

    // Attempting to RSVP to Community B event via Community A route -> 404
    const req = await makeReq(
      "http://localhost/api/communities/ai-club/events/ev-comm-b/rsvp",
      "POST",
      userMember,
      { status: AttendeeStatus.GOING }
    );
    const res = await postRSVP(req, {
      params: Promise.resolve({ slug: "ai-club", id: "ev-comm-b" }),
    });
    assert.equal(res.status, 404);
  });
});
