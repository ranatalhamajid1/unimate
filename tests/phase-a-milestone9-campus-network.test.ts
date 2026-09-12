import "./setup-prisma";
import test from "node:test";
import assert from "node:assert/strict";
import { mockState, resetMockState, mockPrisma } from "./setup-prisma";
import {
  normalizeCommunityName,
  toBaseSlug,
  generateUniqueSlug,
  checkOfficialImpersonation,
  validateCommunityScope,
  checkDuplicateCommunity,
  handleCreatorDeletion,
  CommunityScope,
  CommunityType,
  CommunityVisibility,
  MemberRole,
  MembershipStatus,
  sanitizeMemberUser,
} from "../app/lib/communities";
import { GET as getCommunities, POST as createCommunity } from "../app/api/communities/route";
import { GET as getCommunityDetail, PATCH as updateCommunity } from "../app/api/communities/[slug]/route";
import { POST as joinCommunity } from "../app/api/communities/[slug]/join/route";
import { POST as leaveCommunity } from "../app/api/communities/[slug]/leave/route";
import { GET as getMembers } from "../app/api/communities/[slug]/members/route";
import { PATCH as updateMember, DELETE as removeMember } from "../app/api/communities/[slug]/members/[memberId]/route";
import { NextRequest } from "next/server";
import { generateMobileToken } from "../app/lib/mobile-auth";

function createMockRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const { method = "GET", body, headers = {} } = options;
  const init: any = { method, headers: new Headers(headers) };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers.set("content-type", "application/json");
  }
  return new NextRequest(url, init);
}

test("Milestone 9: Campus & Student Network Foundation Suite", async (t) => {
  resetMockState();

  // Seed fixture universities and campuses
  const univ1 = { id: "univ-nust", name: "National University of Sciences & Technology", shortName: "NUST" };
  const univ2 = { id: "univ-fast", name: "FAST National University", shortName: "FAST-NUCES" };
  mockState.universities.push(univ1, univ2);

  const campus1_h12 = { id: "camp-h12", universityId: univ1.id, name: "H-12 Main Campus" };
  const campus1_ceme = { id: "camp-ceme", universityId: univ1.id, name: "CEME Campus" };
  const campus2_isb = { id: "camp-fast-isb", universityId: univ2.id, name: "Islamabad Campus" };
  mockState.campuses.push(campus1_h12, campus1_ceme, campus2_isb);

  const dept1_se = { id: "dept-se", universityId: univ1.id, name: "Software Engineering" };
  const dept2_cs = { id: "dept-fast-cs", universityId: univ2.id, name: "Computer Science" };
  mockState.departments.push(dept1_se, dept2_cs);

  // Seed users
  const user1 = {
    id: "user-1",
    name: "Talha Student",
    email: "talha@nust.edu.pk",
    username: "talha_dev",
    universityId: univ1.id,
    campusId: campus1_h12.id,
    departmentId: dept1_se.id,
    degreeProgram: "BS Software Engineering",
    currentSemester: "6th",
    isPublicProfile: true,
  };
  const user2 = {
    id: "user-2",
    name: "Ayesha Scholar",
    email: "ayesha@nust.edu.pk",
    username: "ayesha_s",
    universityId: univ1.id,
    campusId: campus1_ceme.id, // Different campus in same university
    departmentId: dept1_se.id,
    degreeProgram: "BS Software Engineering",
    currentSemester: "4th",
    isPublicProfile: false, // Private profile
  };
  const user3 = {
    id: "user-3",
    name: "Fastian Coder",
    email: "fastian@fast.edu.pk",
    username: "fast_coder",
    universityId: univ2.id, // Different university
    campusId: campus2_isb.id,
    departmentId: dept2_cs.id,
    degreeProgram: "BS Computer Science",
    currentSemester: "8th",
    isPublicProfile: true,
  };
  mockState.users.push(user1, user2, user3);

  // Generate tokens for test auth
  const token1 = await generateMobileToken({ userId: user1.id, name: user1.name, email: user1.email });
  const token2 = await generateMobileToken({ userId: user2.id, name: user2.name, email: user2.email });
  const token3 = await generateMobileToken({ userId: user3.id, name: user3.name, email: user3.email });

  await t.test("1. Duplicate detection: Normalization catches punctuation, whitespace, hyphens, and case", () => {
    const n1 = normalizeCommunityName("FAST Computing Society");
    const n2 = normalizeCommunityName("FAST-Computing-Society");
    const n3 = normalizeCommunityName("fast.computing.society");
    const n4 = normalizeCommunityName("  fast  computing  society!  ");

    assert.equal(n1, "fastcomputingsociety");
    assert.equal(n2, "fastcomputingsociety");
    assert.equal(n3, "fastcomputingsociety");
    assert.equal(n4, "fastcomputingsociety");
    assert.equal(n1, n2);
    assert.equal(n2, n3);
    assert.equal(n3, n4);
  });

  await t.test("2. Slugs: Generates kebab-case and collision suffixes (name, name-2, name-3)", async () => {
    assert.equal(toBaseSlug("FAST Computing Society"), "fast-computing-society");
    assert.equal(toBaseSlug("ACM / IEEE Chapter 2026!"), "acm-ieee-chapter-2026");

    const slug1 = await generateUniqueSlug(mockPrisma as any, "Data Science Club");
    assert.equal(slug1, "data-science-club");

    // Add first community with this slug
    mockState.communities.push({
      id: "comm-1",
      slug: slug1,
      name: "Data Science Club",
      universityId: univ1.id,
      moderationStatus: "APPROVED",
    });

    const slug2 = await generateUniqueSlug(mockPrisma as any, "Data Science Club");
    assert.equal(slug2, "data-science-club-2");

    mockState.communities.push({
      id: "comm-2",
      slug: slug2,
      name: "Data Science Club 2",
      universityId: univ1.id,
      moderationStatus: "APPROVED",
    });

    const slug3 = await generateUniqueSlug(mockPrisma as any, "Data Science Club");
    assert.equal(slug3, "data-science-club-3");
  });

  await t.test("3. Anti-impersonation: Unverified communities cannot use reserved administrative titles", () => {
    const res1 = checkOfficialImpersonation("Office of the Registrar", false);
    assert.equal(res1.isImpersonating, true);

    const res2 = checkOfficialImpersonation("Vice-Chancellor Student Advisory", false);
    assert.equal(res2.isImpersonating, true);

    const res3 = checkOfficialImpersonation("Dean of Engineering Student Body", false);
    assert.equal(res3.isImpersonating, true);

    // Legitimate student communities are allowed
    const res4 = checkOfficialImpersonation("NUST Artificial Intelligence Club", false);
    assert.equal(res4.isImpersonating, false);

    const res5 = checkOfficialImpersonation("ACM Student Chapter", false);
    assert.equal(res5.isImpersonating, false);

    // Verified official bodies can use reserved titles
    const res6 = checkOfficialImpersonation("Office of the Registrar", true);
    assert.equal(res6.isImpersonating, false);
  });

  await t.test("4. Scope Integrity: Validates UNIVERSITY, CAMPUS, and DEPARTMENT scope constraints", async () => {
    // 4.1 UNIVERSITY scope must not have campusId or departmentId
    const univOk = await validateCommunityScope(mockPrisma as any, {
      scope: CommunityScope.UNIVERSITY,
      universityId: univ1.id,
      campusId: null,
      departmentId: null,
    });
    assert.equal(univOk.valid, true);

    const univFailCampus = await validateCommunityScope(mockPrisma as any, {
      scope: CommunityScope.UNIVERSITY,
      universityId: univ1.id,
      campusId: campus1_h12.id,
    });
    assert.equal(univFailCampus.valid, false);

    // 4.2 CAMPUS scope requires campusId and campus must belong to university
    const campOk = await validateCommunityScope(mockPrisma as any, {
      scope: CommunityScope.CAMPUS,
      universityId: univ1.id,
      campusId: campus1_h12.id,
    });
    assert.equal(campOk.valid, true);

    const campFailMismatchedUniv = await validateCommunityScope(mockPrisma as any, {
      scope: CommunityScope.CAMPUS,
      universityId: univ1.id,
      campusId: campus2_isb.id, // FAST campus with NUST university!
    });
    assert.equal(campFailMismatchedUniv.valid, false);
    assert.match(campFailMismatchedUniv.error!, /does not belong to the specified university/i);

    // 4.3 DEPARTMENT scope requires departmentId and department must belong to university
    const deptOk = await validateCommunityScope(mockPrisma as any, {
      scope: CommunityScope.DEPARTMENT,
      universityId: univ1.id,
      departmentId: dept1_se.id,
    });
    assert.equal(deptOk.valid, true);

    const deptFailMismatchedUniv = await validateCommunityScope(mockPrisma as any, {
      scope: CommunityScope.DEPARTMENT,
      universityId: univ1.id,
      departmentId: dept2_cs.id, // FAST department with NUST university!
    });
    assert.equal(deptFailMismatchedUniv.valid, false);
    assert.match(deptFailMismatchedUniv.error!, /does not belong to the specified university/i);
  });

  await t.test("5. Privacy Airgap: Sanitization strictly excludes academic and private credentials", () => {
    const sensitiveUser = {
      id: "user-sensitive",
      name: "Secret Student",
      username: "sec_student",
      avatarUrl: "https://avatar.com/1.png",
      degreeProgram: "BS CS",
      currentSemester: "5th",
      isPublicProfile: true,
      gpa: 3.95,
      attendance: 95,
      passwordHash: "secret_bcrypt_hash",
      subscription: { plan: "PRO" },
      expenses: [{ amount: 500 }],
      university: { id: "univ-1", name: "NUST", shortName: "NUST" },
    };

    const sanitizedPublic = sanitizeMemberUser(sensitiveUser);
    assert.ok(sanitizedPublic);
    assert.equal(sanitizedPublic.id, "user-sensitive");
    assert.equal(sanitizedPublic.name, "Secret Student");
    assert.equal(sanitizedPublic.username, "sec_student");
    assert.equal(sanitizedPublic.degreeProgram, "BS CS");
    assert.equal(sanitizedPublic.currentSemester, "5th");
    assert.equal((sanitizedPublic as any).gpa, undefined);
    assert.equal((sanitizedPublic as any).passwordHash, undefined);
    assert.equal((sanitizedPublic as any).subscription, undefined);
    assert.equal((sanitizedPublic as any).expenses, undefined);

    // When isPublicProfile is false, redact degree program and semester
    sensitiveUser.isPublicProfile = false;
    const sanitizedPrivate = sanitizeMemberUser(sensitiveUser);
    assert.ok(sanitizedPrivate);
    assert.equal(sanitizedPrivate.degreeProgram, null);
    assert.equal(sanitizedPrivate.currentSemester, null);
    assert.equal(sanitizedPrivate.isPublicProfile, false);
  });

  await t.test("6. API POST /api/communities: Creates community, enforces scope, creates OWNER membership", async () => {
    const req = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: {
        name: "NUST Cyber Security Society",
        description: "Official student cybersecurity interest group",
        type: "TECH",
        scope: "CAMPUS",
        campusId: campus1_h12.id,
        visibility: "PUBLIC",
        requiresApproval: false,
      },
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });

    const res = await createCommunity(req);
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.community.name, "NUST Cyber Security Society");
    assert.equal(body.community.slug, "nust-cyber-security-society");
    assert.equal(body.community.isVerified, false); // Student cannot grant verified status
    assert.equal(body.community.currentUserRole, "OWNER");
    assert.equal(body.community.memberCount, 1);

    // Verify creator member was added as OWNER
    const membership = mockState.communityMembers.find(
      (m: any) => m.communityId === body.community.id && m.userId === user1.id
    );
    assert.ok(membership);
    assert.equal(membership.role, "OWNER");
    assert.equal(membership.status, "ACTIVE");
  });

  await t.test("7. API POST /api/communities: Rejects duplicate normalized community name in same university", async () => {
    const req = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: {
        name: "nust-cyber-security-society", // duplicate under normalization!
        scope: "CAMPUS",
        campusId: campus1_h12.id,
      },
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });

    const res = await createCommunity(req);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /already exists in your university/i);
  });

  await t.test("8. API POST /api/communities: Rejects mismatched campus and anti-impersonation titles", async () => {
    // 8.1 Mismatched campus (FAST campus for NUST user)
    const req1 = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: {
        name: "NUST Robotics Club",
        scope: "CAMPUS",
        campusId: campus2_isb.id, // Belonging to FAST!
      },
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const res1 = await createCommunity(req1);
    assert.equal(res1.status, 400);

    // 8.2 Anti-impersonation check
    const req2 = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: {
        name: "Office of the Vice-Chancellor Student Union",
        scope: "UNIVERSITY",
      },
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const res2 = await createCommunity(req2);
    assert.equal(res2.status, 400);
    const body2 = await res2.json();
    assert.match(body2.error, /reserved administrative keyword/i);
  });

  await t.test("9. API Membership Lifecycle: Join, requiresApproval, banned rejoin prevention", async () => {
    // Create an approval-required community
    const commReq = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: {
        name: "NUST Competitive Programming",
        type: "ACADEMIC",
        scope: "UNIVERSITY",
        visibility: "PUBLIC",
        requiresApproval: true,
      },
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const commRes = await createCommunity(commReq);
    assert.equal(commRes.status, 201);
    const { community } = await commRes.json();

    // User 2 joins (requiresApproval = true -> PENDING)
    const joinReq = createMockRequest(`http://localhost/api/communities/${community.slug}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });
    const joinRes = await joinCommunity(joinReq, { params: Promise.resolve({ slug: community.slug }) });
    assert.equal(joinRes.status, 200);
    const joinBody = await joinRes.json();
    assert.equal(joinBody.status, "PENDING");

    // Approve user 2 by user 1 (OWNER)
    const memberRecord = mockState.communityMembers.find(
      (m: any) => m.communityId === community.id && m.userId === user2.id
    );
    assert.ok(memberRecord);

    const approveReq = createMockRequest(
      `http://localhost/api/communities/${community.slug}/members/${memberRecord.id}`,
      {
        method: "PATCH",
        body: { status: "ACTIVE" },
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      }
    );
    const approveRes = await updateMember(approveReq, {
      params: Promise.resolve({ slug: community.slug, memberId: memberRecord.id }),
    });
    assert.equal(approveRes.status, 200);
    const approveBody = await approveRes.json();
    assert.equal(approveBody.member.status, "ACTIVE");

    // Ban user 2 by user 1 (OWNER)
    const banReq = createMockRequest(
      `http://localhost/api/communities/${community.slug}/members/${memberRecord.id}`,
      {
        method: "PATCH",
        body: { status: "BANNED" },
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      }
    );
    const banRes = await updateMember(banReq, {
      params: Promise.resolve({ slug: community.slug, memberId: memberRecord.id }),
    });
    assert.equal(banRes.status, 200);

    // Banned user attempts to rejoin -> must be rejected with 403
    const rejoinReq = createMockRequest(`http://localhost/api/communities/${community.slug}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });
    const rejoinRes = await joinCommunity(rejoinReq, { params: Promise.resolve({ slug: community.slug }) });
    assert.equal(rejoinRes.status, 403);
    const rejoinBody = await rejoinRes.json();
    assert.match(rejoinBody.error, /banned from this community/i);
  });

  await t.test("10. API Owner Protection: Owner cannot leave without transferring ownership", async () => {
    // User 1 is OWNER of "nust-cyber-security-society"
    // Add User 2 as active member
    const comm = mockState.communities.find((c: any) => c.slug === "nust-cyber-security-society")!;
    mockState.communityMembers.push({
      id: "cm-user2-active",
      communityId: comm.id,
      userId: user2.id,
      role: "MEMBER",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const leaveReq = createMockRequest("http://localhost/api/communities/nust-cyber-security-society/leave", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const leaveRes = await leaveCommunity(leaveReq, {
      params: Promise.resolve({ slug: "nust-cyber-security-society" }),
    });
    assert.equal(leaveRes.status, 400);
    const leaveBody = await leaveRes.json();
    assert.match(leaveBody.error, /cannot leave the community without transferring ownership/i);
  });

  await t.test("11. API Ownership Transfer: Atomic transfer from current owner to active member", async () => {
    const comm = mockState.communities.find((c: any) => c.slug === "nust-cyber-security-society")!;
    const user2Member = mockState.communityMembers.find(
      (m: any) => m.communityId === comm.id && m.userId === user2.id
    )!;

    const transferReq = createMockRequest(
      `http://localhost/api/communities/${comm.slug}/members/${user2Member.id}`,
      {
        method: "PATCH",
        body: { role: "OWNER" },
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      }
    );

    const transferRes = await updateMember(transferReq, {
      params: Promise.resolve({ slug: comm.slug, memberId: user2Member.id }),
    });
    assert.equal(transferRes.status, 200);

    // Verify User 2 is now OWNER and User 1 was demoted to ADMIN
    const user2Updated = mockState.communityMembers.find(
      (m: any) => m.communityId === comm.id && m.userId === user2.id
    );
    const user1Updated = mockState.communityMembers.find(
      (m: any) => m.communityId === comm.id && m.userId === user1.id
    );
    assert.equal(user2Updated?.role, "OWNER");
    assert.equal(user1Updated?.role, "ADMIN");
  });

  await t.test("12. Role Escalation Prevention: ADMIN cannot promote to OWNER or alter fellow ADMIN", async () => {
    const comm = mockState.communities.find((c: any) => c.slug === "nust-cyber-security-society")!;
    // User 1 is now ADMIN, User 2 is OWNER. Add User 3 as another ADMIN.
    mockState.communityMembers.push({
      id: "cm-user3-admin",
      communityId: comm.id,
      userId: user3.id,
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // User 1 (ADMIN) attempts to promote member to OWNER
    const escalateReq = createMockRequest(
      `http://localhost/api/communities/${comm.slug}/members/cm-user3-admin`,
      {
        method: "PATCH",
        body: { role: "OWNER" },
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      }
    );
    const escalateRes = await updateMember(escalateReq, {
      params: Promise.resolve({ slug: comm.slug, memberId: "cm-user3-admin" }),
    });
    assert.equal(escalateRes.status, 403);
    const body = await escalateRes.json();
    assert.match(body.error, /only the current community owner/i);

    // User 1 (ADMIN) attempts to ban fellow ADMIN (User 3)
    const banAdminReq = createMockRequest(
      `http://localhost/api/communities/${comm.slug}/members/cm-user3-admin`,
      {
        method: "PATCH",
        body: { status: "BANNED" },
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      }
    );
    const banAdminRes = await updateMember(banAdminReq, {
      params: Promise.resolve({ slug: comm.slug, memberId: "cm-user3-admin" }),
    });
    assert.equal(banAdminRes.status, 403);
    const banBody = await banAdminRes.json();
    assert.match(banBody.error, /administrators cannot ban fellow administrators/i);
  });

  await t.test("13. Privacy & Enumeration Protection: PRIVATE communities return 404 to non-members", async () => {
    // Create a PRIVATE community owned by User 1
    const privateComm = {
      id: "comm-private-1",
      slug: "nust-secret-society",
      name: "NUST Secret Society",
      description: "Classified group",
      visibility: "PRIVATE",
      scope: "UNIVERSITY",
      type: "STUDY_GROUP",
      universityId: univ1.id,
      moderationStatus: "APPROVED",
      createdByUserId: user1.id,
      requiresApproval: false,
      maxMembers: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockState.communities.push(privateComm);

    // User 1 is member
    mockState.communityMembers.push({
      id: "cm-private-owner",
      communityId: privateComm.id,
      userId: user1.id,
      role: "OWNER",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // User 3 (FAST student, non-member) requests direct slug
    const reqNonMember = createMockRequest(`http://localhost/api/communities/${privateComm.slug}`, {
      headers: {
        Authorization: `Bearer ${token3}`,
      },
    });
    const resNonMember = await getCommunityDetail(reqNonMember, {
      params: Promise.resolve({ slug: privateComm.slug }),
    });
    // MUST return 404 (NOT 403) to prevent slug enumeration!
    assert.equal(resNonMember.status, 404);

    // User 1 (ACTIVE member) requests direct slug
    const reqMember = createMockRequest(`http://localhost/api/communities/${privateComm.slug}`, {
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const resMember = await getCommunityDetail(reqMember, {
      params: Promise.resolve({ slug: privateComm.slug }),
    });
    assert.equal(resMember.status, 200);
    const memberBody = await resMember.json();
    assert.equal(memberBody.community.slug, "nust-secret-society");
  });

  await t.test("14. Creator Deletion Safety: Atomic transfer to oldest ADMIN -> oldest MEMBER -> ownerless", async () => {
    // Test creator deletion promotion logic in handleCreatorDeletion
    const commId = "comm-test-deletion";
    const creatorId = "user-to-be-deleted";
    const adminOld = {
      id: "cm-admin-old",
      communityId: commId,
      userId: "user-admin-old",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date("2026-01-01"),
    };
    const adminNew = {
      id: "cm-admin-new",
      communityId: commId,
      userId: "user-admin-new",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date("2026-02-01"),
    };
    const creatorMember = {
      id: "cm-creator-owner",
      communityId: commId,
      userId: creatorId,
      role: "OWNER",
      status: "ACTIVE",
      createdAt: new Date("2025-12-01"),
    };
    mockState.communities.push({
      id: commId,
      slug: "comm-deletion-test",
      name: "Deletion Test Comm",
      universityId: univ1.id,
      createdByUserId: creatorId,
    });
    mockState.communityMembers.push(creatorMember, adminOld, adminNew);

    // Call handleCreatorDeletion
    const result = await handleCreatorDeletion(mockPrisma as any, commId, creatorId);
    assert.equal(result.transferredToUserId, "user-admin-old");
    assert.equal(result.ownerless, false);

    const promotedAdmin = mockState.communityMembers.find((m: any) => m.id === "cm-admin-old");
    assert.equal(promotedAdmin?.role, "OWNER");
  });

  await t.test("15. Mass Assignment Prevention: PATCH /api/communities/[slug] rejects mutating protected fields", async () => {
    const comm = mockState.communities.find((c: any) => c.slug === "nust-cyber-security-society")!;

    // User 2 is OWNER. Attempts to set isVerified=true and change universityId
    const patchReq = createMockRequest(`http://localhost/api/communities/${comm.slug}`, {
      method: "PATCH",
      body: {
        description: "Updated legitimate description",
        isVerified: true, // Prohibited
        universityId: "univ-fast", // Prohibited
        moderationStatus: "SUSPENDED", // Prohibited
      },
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });

    const patchRes = await updateCommunity(patchReq, {
      params: Promise.resolve({ slug: comm.slug }),
    });
    assert.equal(patchRes.status, 200);

    const updated = mockState.communities.find((c: any) => c.id === comm.id);
    assert.equal(updated.description, "Updated legitimate description");
    assert.equal(updated.isVerified, false); // Must remain false!
    assert.equal(updated.universityId, univ1.id); // Must remain unchanged!
  });

  await t.test("16. Member Roster Airgap & Privacy: GET /api/communities/[slug]/members does not leak private records", async () => {
    const comm = mockState.communities.find((c: any) => c.slug === "nust-cyber-security-society")!;

    const membersReq = createMockRequest(`http://localhost/api/communities/${comm.slug}/members`, {
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });

    const membersRes = await getMembers(membersReq, {
      params: Promise.resolve({ slug: comm.slug }),
    });
    assert.equal(membersRes.status, 200);
    const { members } = await membersRes.json();
    assert.ok(Array.isArray(members));
    assert.ok(members.length > 0);

    for (const m of members) {
      assert.ok(m.id);
      assert.ok(m.user.id);
      assert.ok(m.user.name);
      // Ensure zero academic/financial fields exist in the response
      assert.equal(m.user.gpa, undefined);
      assert.equal(m.user.grades, undefined);
      assert.equal(m.user.attendance, undefined);
      assert.equal(m.user.timetable, undefined);
      assert.equal(m.user.assignments, undefined);
      assert.equal(m.user.exams, undefined);
      assert.equal(m.user.expenses, undefined);
      assert.equal(m.user.passwordHash, undefined);
      assert.equal(m.user.aiUsages, undefined);
      assert.equal(m.user.subscriptions, undefined);
    }
  });

  await t.test("17. Discovery Tabs: Explore All shows PUBLIC communities across universities", async () => {
    // Add a public FAST community
    mockState.communities.push({
      id: "comm-fast-pub",
      slug: "fast-acm-chapter",
      name: "FAST ACM Student Chapter",
      description: "ACM chapter at FAST",
      type: "TECH",
      scope: "UNIVERSITY",
      visibility: "PUBLIC",
      universityId: univ2.id,
      moderationStatus: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createMockRequest("http://localhost/api/communities?tab=explore");
    const res = await getCommunities(req);
    assert.equal(res.status, 200);
    const { communities } = await res.json();

    const slugs = communities.map((c: any) => c.slug);
    assert.ok(slugs.includes("fast-acm-chapter"));
    assert.ok(slugs.includes("nust-cyber-security-society"));
    // PRIVATE community must never appear in Explore All
    assert.equal(slugs.includes("nust-secret-society"), false);
  });

  await t.test("18. Cross-University Isolation: Student cannot create community in another university", async () => {
    // User 3 (FAST student) attempts to create community in NUST
    const req = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: {
        name: "FAST Fake Society in NUST",
        universityId: univ1.id, // Trying to inject NUST university ID!
        scope: "UNIVERSITY",
      },
      headers: {
        Authorization: `Bearer ${token3}`,
      },
    });

    const res = await createCommunity(req);
    assert.equal(res.status, 201);
    const body = await res.json();
    // The server must enforce student's actual university (univ2), ignoring the client-supplied universityId
    assert.equal(body.community.universityId, univ2.id);
  });

  await t.test("19. Cross-Campus Isolation: CAMPUS_ONLY returns 404 to students from different campus", async () => {
    // Community scoped to campus1_h12 with CAMPUS_ONLY visibility
    const campusOnlyComm = {
      id: "comm-campus-only-1",
      slug: "nust-h12-residents",
      name: "H-12 Residents Club",
      description: "Only for H-12 hostelites",
      visibility: "CAMPUS_ONLY",
      scope: "CAMPUS",
      campusId: campus1_h12.id,
      universityId: univ1.id,
      moderationStatus: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockState.communities.push(campusOnlyComm);

    // User 2 is at campus1_ceme (different campus in NUST)
    const reqOtherCampus = createMockRequest(`http://localhost/api/communities/${campusOnlyComm.slug}`, {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });
    const resOtherCampus = await getCommunityDetail(reqOtherCampus, {
      params: Promise.resolve({ slug: campusOnlyComm.slug }),
    });
    // Must return 404 for isolation
    assert.equal(resOtherCampus.status, 404);

    // User 1 is at campus1_h12 (same campus)
    const reqSameCampus = createMockRequest(`http://localhost/api/communities/${campusOnlyComm.slug}`, {
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const resSameCampus = await getCommunityDetail(reqSameCampus, {
      params: Promise.resolve({ slug: campusOnlyComm.slug }),
    });
    assert.equal(resSameCampus.status, 200);
  });

  await t.test("20. Malicious Input & Boundary Validation: Rejects invalid fields and enforces length limits", async () => {
    // 20.1 Name too short
    const shortReq = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: { name: "ab" },
      headers: { Authorization: `Bearer ${token1}` },
    });
    const shortRes = await createCommunity(shortReq);
    assert.equal(shortRes.status, 400);

    // 20.2 Description too long (> 500 chars)
    const longReq = createMockRequest("http://localhost/api/communities", {
      method: "POST",
      body: {
        name: "Valid Community Name",
        description: "a".repeat(501),
      },
      headers: { Authorization: `Bearer ${token1}` },
    });
    const longRes = await createCommunity(longReq);
    assert.equal(longRes.status, 400);
  });
});
