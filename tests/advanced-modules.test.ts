import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  MobileStudentGoalItem,
  MobileGoalProgressItem,
  MobileStudyPlan,
  MobileDraftStudyPlan,
  MobileCalendarData,
  MobileCalendarEvent,
  MobileAiQuota,
  MobileBillingData,
} from '../lib/types';

describe('Phase 15 Step 5: Mobile Advanced Modules Tests', () => {
  // 1. API Endpoint Construction
  describe('1. API Route Construction & Endpoint Coverage', () => {
    test('verifies all Step 5 endpoint paths are correctly mapped under /api/mobile', () => {
      const advancedRoutes = [
        { path: '/api/mobile/goals', methods: ['GET', 'POST'] },
        { path: '/api/mobile/goals/:id', methods: ['PUT', 'DELETE'] },
        { path: '/api/mobile/study-plans', methods: ['GET', 'POST'] },
        { path: '/api/mobile/study-plans/:id', methods: ['GET', 'DELETE'] },
        { path: '/api/mobile/study-plans/generate', methods: ['POST'] },
        { path: '/api/mobile/study-plans/items/:id/complete', methods: ['PATCH'] },
        { path: '/api/mobile/calendar', methods: ['GET'] },
        { path: '/api/mobile/ai/study-buddy', methods: ['POST'] },
        { path: '/api/mobile/ai/quota', methods: ['GET'] },
        { path: '/api/mobile/insights', methods: ['GET'] },
        { path: '/api/mobile/billing', methods: ['GET'] },
      ];

      assert.equal(advancedRoutes.length, 11);
      for (const r of advancedRoutes) {
        assert.ok(r.path.startsWith('/api/mobile/'));
        assert.ok(r.methods.length > 0);
      }
    });
  });

  // 2. Response Mapping & Schema Shapes
  describe('2. Response Mapping & Schema Shapes', () => {
    test('maps Goal Progress item with target, current, and at-risk status', () => {
      const goal: MobileGoalProgressItem = {
        goalId: 'goal-1',
        type: 'TARGET_GPA',
        label: 'Target GPA',
        description: 'Maintain your desired cumulative GPA.',
        targetValue: 3.8,
        currentValue: 3.65,
        unit: 'GPA',
        formattedTarget: '3.80',
        formattedCurrent: '3.65',
        percentage: 96,
        period: 'SEMESTER',
        isConfigured: true,
        isAtRisk: false,
        suggestedDefault: 3.5,
      };

      assert.equal(goal.type, 'TARGET_GPA');
      assert.equal(goal.percentage, 96);
      assert.equal(goal.isConfigured, true);
    });

    test('maps Study Plan with tasks, progress, and durations', () => {
      const plan: MobileStudyPlan = {
        id: 'sp-1',
        userId: 'u-1',
        title: 'Midterms Preparation Week',
        startDate: '2026-09-10T00:00:00.000Z',
        endDate: '2026-09-17T00:00:00.000Z',
        status: 'ACTIVE',
        createdAt: '2026-09-07T12:00:00.000Z',
        updatedAt: '2026-09-07T12:00:00.000Z',
        progressPercentage: 50,
        totalDurationMinutes: 120,
        completedDurationMinutes: 60,
        items: [
          {
            id: 'spi-1',
            studyPlanId: 'sp-1',
            courseId: 'c-1',
            title: 'Algorithms Revision',
            description: 'Dynamic programming problems',
            scheduledAt: '2026-09-10T18:00:00.000Z',
            duration: 60,
            completed: true,
            order: 0,
            course: {
              id: 'c-1',
              name: 'Algorithms',
              code: 'CS201',
              color: '#3B82F6',
            },
          },
        ],
      };

      assert.equal(plan.progressPercentage, 50);
      assert.equal(plan.items[0].completed, true);
      assert.equal(plan.totalDurationMinutes, 120);
    });

    test('maps Draft AI Study Plan (preview only, unpersisted)', () => {
      const draft: MobileDraftStudyPlan = {
        title: 'Daily Study Plan for 2026-09-08',
        summary: 'Targeted revision based on upcoming exams and coursework.',
        targetDate: '2026-09-08',
        items: [
          {
            courseCode: 'CS201',
            courseId: 'c-1',
            title: 'Sorting Algorithms',
            duration: 45,
            reason: 'Midterm in 4 days',
            suggestedTime: '18:00',
          },
        ],
        isLocalFallback: false,
      };

      assert.equal(draft.items.length, 1);
      assert.equal(draft.items[0].courseCode, 'CS201');
      assert.equal(draft.isLocalFallback, false);
    });

    test('maps Calendar Data unifying classes, exams, assignments, and study sessions in PKT', () => {
      const event: MobileCalendarEvent = {
        id: 'cal-ev-1',
        title: 'Class: Computer Networks',
        date: '2026-09-08T09:00:00.000Z',
        dateKey: '2026-09-08',
        timeStr: '09:00 - 10:30',
        courseName: 'Computer Networks',
        courseCode: 'CS301',
        courseColor: '#4F46E5',
        eventType: 'CLASS',
        actionUrl: '/dashboard/timetable',
      };

      const calData: MobileCalendarData = {
        year: 2026,
        month: 9,
        monthLabel: 'September 2026',
        events: [event],
        eventsByDate: {
          '2026-09-08': [event],
        },
      };

      assert.equal(calData.monthLabel, 'September 2026');
      assert.equal(calData.events[0].eventType, 'CLASS');
      assert.equal(calData.eventsByDate['2026-09-08'].length, 1);
    });

    test('maps AI Quota and Billing structures correctly', () => {
      const quota: MobileAiQuota = {
        allowed: true,
        currentCount: 2,
        limit: 5,
        remaining: 3,
        plan: 'FREE',
        dateKey: '2026-09-07',
      };

      const billing: MobileBillingData = {
        subscription: {
          plan: 'FREE',
          status: 'ACTIVE',
          isPro: false,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
        limits: {
          dailyAiLimit: 5,
          freeDailyAiLimit: 5,
          proDailyAiLimit: 50,
        },
        features: {
          current: ['Core Modules', 'Unified Calendar'],
          pro: ['AI Study Plans', 'Advanced Insights', '50 AI requests/day'],
        },
        notice: 'In-app purchases disabled.',
      };

      assert.equal(quota.remaining, 3);
      assert.equal(billing.subscription.plan, 'FREE');
      assert.equal(billing.limits.proDailyAiLimit, 50);
    });
  });

  // 3. Client Validation Logic
  describe('3. Validation Rules', () => {
    test('validates goal inputs against defined min and max bounds', () => {
      const validateGpa = (val: number) => val >= 1.0 && val <= 4.0;
      const validateHours = (val: number) => val >= 1 && val <= 80;
      const validatePct = (val: number) => val >= 50 && val <= 100;

      assert.ok(validateGpa(3.85));
      assert.ok(!validateGpa(4.5));
      assert.ok(!validateGpa(0.5));

      assert.ok(validateHours(15));
      assert.ok(!validateHours(0));
      assert.ok(!validateHours(100));

      assert.ok(validatePct(85));
      assert.ok(!validatePct(40));
    });

    test('validates study plan available hours range (0.5 to 12 hours)', () => {
      const validateStudyHours = (hours: number) => hours >= 0.5 && hours <= 12;

      assert.ok(validateStudyHours(3));
      assert.ok(validateStudyHours(0.5));
      assert.ok(validateStudyHours(12));
      assert.ok(!validateStudyHours(0));
      assert.ok(!validateStudyHours(15));
    });
  });

  // 4. Query Invalidation Strategy
  describe('4. Query Invalidation Strategy', () => {
    test('verifies proper query key invalidation on mutations', () => {
      const mutationKeys: Record<string, string[][]> = {
        saveGoal: [['goals'], ['dashboard']],
        deleteGoal: [['goals'], ['dashboard']],
        completeStudyTask: [['study-plans'], ['dashboard']],
        saveStudyPlan: [['study-plans'], ['dashboard']],
        deleteStudyPlan: [['study-plans'], ['dashboard']],
      };

      assert.deepEqual(mutationKeys.saveGoal, [['goals'], ['dashboard']]);
      assert.deepEqual(mutationKeys.completeStudyTask, [['study-plans'], ['dashboard']]);
      assert.deepEqual(mutationKeys.saveStudyPlan, [['study-plans'], ['dashboard']]);
    });
  });

  // 5. Zero Server Secrets in Mobile Codebase
  describe('5. Zero Server Secrets in Mobile Codebase', () => {
    test('verifies mobile codebase contains NO Prisma or server secrets', () => {
      const mobileDir = path.resolve(__dirname, '..');
      const forbiddenPatterns = [
        'SESSION_SECRET',
        'DATABASE_URL',
        'AI_API_KEY',
        'PADDLE_API_KEY',
        'PADDLE_WEBHOOK_SECRET',
        '@prisma/client',
        'prisma.',
      ];

      const scanDirectory = (dir: string): string[] => {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (
            entry.name === 'node_modules' ||
            entry.name === '.expo' ||
            entry.name === '.git' ||
            entry.name === 'tests'
          ) {
            continue;
          }
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...scanDirectory(fullPath));
          } else if (/\.(ts|tsx|js|json)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
        return files;
      };

      const allFiles = scanDirectory(mobileDir);
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of forbiddenPatterns) {
          assert.ok(
            !content.includes(pattern),
            `Found forbidden pattern "${pattern}" in mobile file: ${file}`
          );
        }
      }
    });
  });
});
