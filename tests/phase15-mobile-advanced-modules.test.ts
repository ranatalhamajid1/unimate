import "./setup-prisma";
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { mockState, resetMockState } from "./setup-prisma";
import { generateMobileToken } from '../app/lib/mobile-auth';
import { GET as getGoals, POST as postGoals } from '../app/api/mobile/goals/route';
import { PUT as putGoal, DELETE as deleteGoal } from '../app/api/mobile/goals/[id]/route';
import { GET as getStudyPlans, POST as postStudyPlans } from '../app/api/mobile/study-plans/route';
import { GET as getStudyPlan, DELETE as deleteStudyPlanRoute } from '../app/api/mobile/study-plans/[id]/route';
import { PATCH as completeStudyPlanItem } from '../app/api/mobile/study-plans/items/[id]/complete/route';
import { GET as getCalendar } from '../app/api/mobile/calendar/route';
import { POST as postAiStudyBuddy } from '../app/api/mobile/ai/study-buddy/route';
import { GET as getAiQuota } from '../app/api/mobile/ai/quota/route';
import { GET as getInsights } from '../app/api/mobile/insights/route';
import { GET as getBilling } from '../app/api/mobile/billing/route';
import { prisma } from '../app/lib/prisma';

describe('Phase 15 Step 5: Mobile Advanced Productivity Modules Test Suite', () => {
  const user1 = { userId: 'test-adv-u1', email: 'adv-u1@example.com', name: 'User One' };
  const user2 = { userId: 'test-adv-u2', email: 'adv-u2@example.com', name: 'User Two' };

  let token1: string;
  let token2: string;

  test('0. Setup test users and tokens', async () => {
    mockState.users.push(
      {
        id: user1.userId,
        email: user1.email,
        name: user1.name,
        passwordHash: "hash1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user2.userId,
        email: user2.email,
        name: user2.name,
        passwordHash: "hash2",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    token1 = await generateMobileToken(user1);
    token2 = await generateMobileToken(user2);

    assert.ok(token1);
    assert.ok(token2);
  });

  // 1. Unauthenticated Rejection (401)
  test('1. Unauthenticated requests across all advanced endpoints return 401', async () => {
    const endpoints = [
      () => getGoals(new NextRequest('http://localhost/api/mobile/goals')),
      () => postGoals(new NextRequest('http://localhost/api/mobile/goals', { method: 'POST', body: '{}' })),
      () => putGoal(new NextRequest('http://localhost/api/mobile/goals/123', { method: 'PUT', body: '{}' }), { params: Promise.resolve({ id: '123' }) }),
      () => deleteGoal(new NextRequest('http://localhost/api/mobile/goals/123', { method: 'DELETE' }), { params: Promise.resolve({ id: '123' }) }),
      () => getStudyPlans(new NextRequest('http://localhost/api/mobile/study-plans')),
      () => postStudyPlans(new NextRequest('http://localhost/api/mobile/study-plans', { method: 'POST', body: '{}' })),
      () => getStudyPlan(new NextRequest('http://localhost/api/mobile/study-plans/123'), { params: Promise.resolve({ id: '123' }) }),
      () => deleteStudyPlanRoute(new NextRequest('http://localhost/api/mobile/study-plans/123', { method: 'DELETE' }), { params: Promise.resolve({ id: '123' }) }),
      () => completeStudyPlanItem(new NextRequest('http://localhost/api/mobile/study-plans/items/123/complete', { method: 'PATCH', body: '{}' }), { params: Promise.resolve({ id: '123' }) }),
      () => getCalendar(new NextRequest('http://localhost/api/mobile/calendar')),
      () => postAiStudyBuddy(new NextRequest('http://localhost/api/mobile/ai/study-buddy', { method: 'POST', body: '{}' })),
      () => getAiQuota(new NextRequest('http://localhost/api/mobile/ai/quota')),
      () => getInsights(new NextRequest('http://localhost/api/mobile/insights')),
      () => getBilling(new NextRequest('http://localhost/api/mobile/billing')),
    ];

    for (const ep of endpoints) {
      const res = await ep();
      assert.equal(res.status, 401, 'Expected 401 for unauthenticated request');
      const json = await res.json();
      assert.ok(json.error && json.error.includes('Unauthorized'));
    }
  });

  // 2. Token Tampering Rejection
  test('2. Tampered or malformed Bearer tokens reject with 401', async () => {
    const tamperedHeader = {
      headers: { Authorization: `Bearer ${token1}tampered` },
    };

    const res = await getGoals(new NextRequest('http://localhost/api/mobile/goals', tamperedHeader));
    assert.equal(res.status, 401);
  });

  // 3. Goals CRUD & User Isolation
  test('3. Goals: User 1 can CRUD goals; User 2 cannot access or mutate them', async () => {
    // User 1 creates a TARGET_GPA goal
    const createReq = new NextRequest('http://localhost/api/mobile/goals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'TARGET_GPA',
        targetValue: 3.85,
        period: 'SEMESTER',
      }),
    });

    const createRes = await postGoals(createReq);
    assert.equal(createRes.status, 200);
    const createJson = await createRes.json();
    assert.equal(createJson.success, true);
    assert.equal(createJson.goal.type, 'TARGET_GPA');
    assert.equal(createJson.goal.targetValue, 3.85);
    const goalId = createJson.goal.id;

    // User 1 lists goals
    const listReq1 = new NextRequest('http://localhost/api/mobile/goals', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const listRes1 = await getGoals(listReq1);
    assert.equal(listRes1.status, 200);
    const listJson1 = await listRes1.json();
    assert.ok(listJson1.goals.some((g: any) => g.id === goalId));
    assert.ok(listJson1.progress.length > 0);

    // User 2 cannot see User 1's goal
    const listReq2 = new NextRequest('http://localhost/api/mobile/goals', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const listRes2 = await getGoals(listReq2);
    const listJson2 = await listRes2.json();
    assert.ok(!listJson2.goals.some((g: any) => g.id === goalId));

    // User 2 cannot update User 1's goal
    const putReq2 = new NextRequest(`http://localhost/api/mobile/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token2}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetValue: 3.9 }),
    });
    const putRes2 = await putGoal(putReq2, { params: Promise.resolve({ id: goalId }) });
    assert.equal(putRes2.status, 404);

    // User 2 cannot delete User 1's goal
    const delReq2 = new NextRequest(`http://localhost/api/mobile/goals/${goalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    const delRes2 = await deleteGoal(delReq2, { params: Promise.resolve({ id: goalId }) });
    assert.equal(delRes2.status, 404);

    // User 1 can delete own goal
    const delReq1 = new NextRequest(`http://localhost/api/mobile/goals/${goalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const delRes1 = await deleteGoal(delReq1, { params: Promise.resolve({ id: goalId }) });
    assert.equal(delRes1.status, 200);
  });

  // 4. Study Plans Creation, Task Toggle & User Isolation
  test('4. Study Plans: Creates plan, toggles task, and enforces user isolation', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const createReq = new NextRequest('http://localhost/api/mobile/study-plans', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Weekly Finals Prep',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        items: [
          {
            title: 'Review Chapter 1 Algorithms',
            description: 'Focus on Big-O and divide-and-conquer',
            scheduledAt: new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            duration: 60,
          },
          {
            title: 'Practice Dynamic Programming',
            description: 'Solve 3 LeetCode medium problems',
            scheduledAt: new Date(startDate.getTime() + 5 * 60 * 60 * 1000).toISOString(),
            duration: 90,
          },
        ],
      }),
    });

    const createRes = await postStudyPlans(createReq);
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    assert.equal(createJson.success, true);
    assert.equal(createJson.plan.title, 'Weekly Finals Prep');
    assert.equal(createJson.plan.items.length, 2);

    const planId = createJson.plan.id;
    const itemId = createJson.plan.items[0].id;

    // User 1 fetches active plan
    const activeReq1 = new NextRequest('http://localhost/api/mobile/study-plans', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const activeRes1 = await getStudyPlans(activeReq1);
    assert.equal(activeRes1.status, 200);
    const activeJson1 = await activeRes1.json();
    assert.equal(activeJson1.plan.id, planId);

    // User 2 cannot access User 1's plan by ID
    const getReq2 = new NextRequest(`http://localhost/api/mobile/study-plans/${planId}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const getRes2 = await getStudyPlan(getReq2, { params: Promise.resolve({ id: planId }) });
    assert.equal(getRes2.status, 404);

    // User 2 cannot complete User 1's task
    const completeReq2 = new NextRequest(`http://localhost/api/mobile/study-plans/items/${itemId}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token2}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed: true }),
    });
    const completeRes2 = await completeStudyPlanItem(completeReq2, { params: Promise.resolve({ id: itemId }) });
    assert.equal(completeRes2.status, 400);

    // User 1 completes own task (auto-logs StudySession)
    const completeReq1 = new NextRequest(`http://localhost/api/mobile/study-plans/items/${itemId}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed: true, autoLogSession: true }),
    });
    const completeRes1 = await completeStudyPlanItem(completeReq1, { params: Promise.resolve({ id: itemId }) });
    assert.equal(completeRes1.status, 200);
    const completeJson1 = await completeRes1.json();
    assert.equal(completeJson1.completed, true);
    assert.equal(completeJson1.sessionLogged, true);

    // Clean up
    const delReq1 = new NextRequest(`http://localhost/api/mobile/study-plans/${planId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const delRes1 = await deleteStudyPlanRoute(delReq1, { params: Promise.resolve({ id: planId }) });
    assert.equal(delRes1.status, 200);
  });

  // 5. Calendar Unified Events
  test('5. Calendar: Returns unified academic calendar events in PKT', async () => {
    const calReq = new NextRequest('http://localhost/api/mobile/calendar?date=2026-09-01', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const calRes = await getCalendar(calReq);
    assert.equal(calRes.status, 200);
    const calJson = await calRes.json();
    assert.equal(calJson.success, true);
    assert.ok(calJson.calendar);
    assert.equal(typeof calJson.calendar.year, 'number');
    assert.equal(typeof calJson.calendar.month, 'number');
    assert.ok(Array.isArray(calJson.calendar.events));
  });

  // 6. AI Quota Check & Study Buddy Input Validation
  test('6. AI Quota: Returns remaining daily quota for user', async () => {
    const quotaReq = new NextRequest('http://localhost/api/mobile/ai/quota', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const quotaRes = await getAiQuota(quotaReq);
    assert.equal(quotaRes.status, 200);
    const quotaJson = await quotaRes.json();
    assert.equal(quotaJson.success, true);
    assert.equal(typeof quotaJson.quota.limit, 'number');
    assert.equal(typeof quotaJson.quota.remaining, 'number');
  });

  test('7. AI Study Buddy: Validates input length and rejects empty message', async () => {
    // Empty message
    const emptyReq = new NextRequest('http://localhost/api/mobile/ai/study-buddy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: '   ' }),
    });
    const emptyRes = await postAiStudyBuddy(emptyReq);
    assert.equal(emptyRes.status, 400);

    // Over-length message (>1000 chars)
    const longMsg = 'a'.repeat(1005);
    const longReq = new NextRequest('http://localhost/api/mobile/ai/study-buddy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: longMsg }),
    });
    const longRes = await postAiStudyBuddy(longReq);
    assert.equal(longRes.status, 400);
  });

  // 8. Academic Insights & Billing
  test('8. Insights: Returns factual academic insights for user', async () => {
    const req = new NextRequest('http://localhost/api/mobile/insights', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const res = await getInsights(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.insights));
  });

  test('9. Billing: Returns plan info without exposing server secrets or webhook data', async () => {
    const req = new NextRequest('http://localhost/api/mobile/billing', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const res = await getBilling(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.subscription);
    assert.ok(json.limits);
    assert.ok(json.notice);

    // Zero secret leakage
    const str = JSON.stringify(json);
    assert.ok(!str.includes('PADDLE_API_KEY'));
    assert.ok(!str.includes('PADDLE_WEBHOOK_SECRET'));
    assert.ok(!str.includes('SESSION_SECRET'));
    assert.ok(!str.includes('DATABASE_URL'));
  });
});
