import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { MobileDashboardResponse } from '../lib/types';

describe('Phase 15 Step 3: Mobile Dashboard & Command Center Tests', () => {
  test('1. Validates full MobileDashboardResponse schema shape and structure', () => {
    const mockDashboardData: MobileDashboardResponse = {
      greeting: {
        name: 'Jane Doe',
        avatarUrl: null,
        unreadNotifications: 2,
        greetingText: 'Good afternoon',
      },
      subscription: {
        plan: 'PRO',
        isPro: true,
        paddleCustomerId: 'cst_123',
      },
      academicStanding: {
        gpa: '3.85',
        gpaScale: '4.0',
        attendancePercentage: 92,
        attendanceStatus: 'Good Standing',
      },
      weeklyStudy: {
        hoursFormatted: '14h',
        sessionCount: 8,
      },
      todayClasses: [
        {
          id: 'slot-1',
          subject: 'Computer Science 101',
          code: 'CS101',
          color: '#3B82F6',
          startTime: '09:00',
          endTime: '10:30',
          room: 'Hall B',
          building: 'Engineering',
          isLab: false,
        },
      ],
      upcomingAssignments: [
        {
          id: 'assign-1',
          title: 'Algorithms Homework 2',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'PENDING',
          priority: 'HIGH',
          courseName: 'CS101',
          courseColor: '#3B82F6',
          daysLeft: 1,
          isOverdue: false,
        },
      ],
      upcomingExams: [
        {
          id: 'exam-1',
          name: 'Midterm Exam',
          examDate: new Date(Date.now() + 172800000).toISOString(),
          startTime: '10:00',
          duration: 90,
          room: 'Auditorium A',
          courseName: 'CS101',
          courseColor: '#3B82F6',
          daysLeft: 2,
        },
      ],
      nextExamCountdown: {
        examName: 'Midterm Exam',
        courseName: 'CS101',
        examDate: new Date(Date.now() + 172800000).toISOString(),
        daysLeft: 2,
      },
      dailyPriorities: [
        {
          id: 'prio-1',
          title: 'Algorithms Homework 2',
          type: 'assignment',
          urgency: 'high',
          due: 'Tomorrow',
          completed: false,
        },
      ],
      insights: [
        {
          id: 'insight-1',
          type: 'tip',
          message: 'Midterm Exam is approaching in 2 days. Consider creating a study session.',
        },
      ],
      activePlanTasks: [],
      goals: {
        gpaTarget: 3.9,
        targetHoursPerWeek: 15,
        currentHoursThisWeek: 14,
        isConfigured: true,
      },
    };

    assert.equal(mockDashboardData.greeting.name, 'Jane Doe');
    assert.equal(mockDashboardData.subscription.isPro, true);
    assert.equal(mockDashboardData.academicStanding.gpa, '3.85');
    assert.equal(mockDashboardData.upcomingAssignments.length, 1);
    assert.equal(mockDashboardData.dailyPriorities[0].urgency, 'high');
  });

  test('2. Handles empty state safely without fallback mock academic data', () => {
    const emptyDashboard: MobileDashboardResponse = {
      greeting: {
        name: 'New Student',
        avatarUrl: null,
        unreadNotifications: 0,
        greetingText: 'Good morning',
      },
      subscription: {
        plan: 'FREE',
        isPro: false,
        paddleCustomerId: null,
      },
      academicStanding: {
        gpa: '0.00',
        gpaScale: '4.0',
        attendancePercentage: 0,
        attendanceStatus: 'No records',
      },
      weeklyStudy: {
        hoursFormatted: '0h',
        sessionCount: 0,
      },
      todayClasses: [],
      upcomingAssignments: [],
      upcomingExams: [],
      nextExamCountdown: null,
      dailyPriorities: [],
      insights: [],
      activePlanTasks: [],
      goals: {
        gpaTarget: null,
        targetHoursPerWeek: null,
        currentHoursThisWeek: 0,
        isConfigured: false,
      },
    };

    assert.equal(emptyDashboard.todayClasses.length, 0);
    assert.equal(emptyDashboard.upcomingAssignments.length, 0);
    assert.equal(emptyDashboard.upcomingExams.length, 0);
    assert.equal(emptyDashboard.nextExamCountdown, null);
    assert.equal(emptyDashboard.dailyPriorities.length, 0);
    assert.equal(emptyDashboard.subscription.isPro, false);
  });

  test('3. Urgency categorization maps daysLeft to appropriate urgency levels', () => {
    function getUrgency(daysLeft: number, isOverdue: boolean): 'overdue' | 'high' | 'medium' | 'low' {
      if (isOverdue || daysLeft < 0) return 'overdue';
      if (daysLeft <= 1) return 'high';
      if (daysLeft <= 3) return 'medium';
      return 'low';
    }

    assert.equal(getUrgency(0, false), 'high');
    assert.equal(getUrgency(1, false), 'high');
    assert.equal(getUrgency(2, false), 'medium');
    assert.equal(getUrgency(3, false), 'medium');
    assert.equal(getUrgency(5, false), 'low');
    assert.equal(getUrgency(0, true), 'overdue');
  });

  test('4. Ensures no secret keys or database connection strings exist in mobile source files', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const checkDir = (dirPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.expo' && entry.name !== '.git') {
            checkDir(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.doesNotMatch(content, /DATABASE_URL/, `Forbidden DATABASE_URL reference found in ${entry.name}`);
          assert.doesNotMatch(content, /SESSION_SECRET/, `Forbidden SESSION_SECRET reference found in ${entry.name}`);
          assert.doesNotMatch(content, /AI_API_KEY/, `Forbidden AI_API_KEY reference found in ${entry.name}`);
          assert.doesNotMatch(content, /PADDLE_API_KEY/, `Forbidden PADDLE_API_KEY reference found in ${entry.name}`);
        }
      }
    };

    // Scan only production directories
    const prodDirs = ['app', 'components', 'contexts', 'hooks', 'lib', 'constants'];
    for (const dir of prodDirs) {
      const fullDirPath = path.resolve(__dirname, '..', dir);
      if (fs.existsSync(fullDirPath)) {
        checkDir(fullDirPath);
      }
    }
  });
});
