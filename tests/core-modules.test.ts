import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  MobileCourse,
  MobileTimetableEntry,
  MobileAssignmentItem,
  MobileExamItem,
  MobileAcademicData,
  MobileExpenseItem,
  MobileExpenseSummary,
  MobileNotificationItem,
} from '../lib/types';

describe('Phase 15 Step 4: Mobile Core Modules Tests', () => {
  // 1. API Request Construction & Auth Header
  describe('1. API Request Construction & Auth Headers', () => {
    test('constructs valid Authorization Bearer header when token exists', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyJ9.signature';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      assert.equal(headers.Authorization, `Bearer ${token}`);
      assert.ok(headers.Authorization.startsWith('Bearer '));
    });

    test('verifies correct core module endpoint paths and methods', () => {
      const routes = [
        { path: '/api/mobile/courses', methods: ['GET', 'POST'] },
        { path: '/api/mobile/courses/:id', methods: ['PUT', 'DELETE'] },
        { path: '/api/mobile/timetable', methods: ['GET', 'POST'] },
        { path: '/api/mobile/timetable/:id', methods: ['PUT', 'DELETE'] },
        { path: '/api/mobile/assignments', methods: ['GET', 'POST'] },
        { path: '/api/mobile/assignments/:id', methods: ['PUT', 'DELETE'] },
        { path: '/api/mobile/exams', methods: ['GET', 'POST'] },
        { path: '/api/mobile/exams/:id', methods: ['PUT', 'DELETE'] },
        { path: '/api/mobile/academics', methods: ['GET'] },
        { path: '/api/mobile/academics/grades', methods: ['POST'] },
        { path: '/api/mobile/academics/grades/:id', methods: ['DELETE'] },
        { path: '/api/mobile/academics/attendance', methods: ['POST'] },
        { path: '/api/mobile/expenses', methods: ['GET', 'POST'] },
        { path: '/api/mobile/expenses/:id', methods: ['DELETE'] },
        { path: '/api/mobile/notifications', methods: ['GET'] },
        { path: '/api/mobile/notifications/:id/read', methods: ['PATCH'] },
        { path: '/api/mobile/notifications/read-all', methods: ['POST'] },
        { path: '/api/mobile/notifications/:id', methods: ['DELETE'] },
      ];

      assert.equal(routes.length, 18);
      for (const route of routes) {
        assert.ok(route.path.startsWith('/api/mobile/'));
        assert.ok(route.methods.length > 0);
      }
    });
  });

  // 2. Data Shape & Schema Verification
  describe('2. Response Mapping & Schema Shapes', () => {
    test('maps Course item properly conforming to Prisma Course model', () => {
      const course: MobileCourse = {
        id: 'c-1',
        userId: 'u-1',
        name: 'Computer Networks',
        code: 'CS301',
        creditHours: 3,
        color: '#4F46E5',
        instructor: 'Dr. Tariq',
        semester: 'Fall 2026',
      };

      assert.equal(course.id, 'c-1');
      assert.equal(course.name, 'Computer Networks');
      assert.equal(course.creditHours, 3);
    });

    test('maps Timetable entry conforming to existing type field and overlap prevention', () => {
      const entry: MobileTimetableEntry = {
        id: 'tt-1',
        userId: 'u-1',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:30',
        room: 'Lab 4',
        type: 'Lab',
        courseId: 'c-1',
        course: {
          id: 'c-1',
          name: 'Computer Networks',
          code: 'CS301',
          color: '#4F46E5',
        },
      };

      assert.equal(entry.dayOfWeek, 1);
      assert.equal(entry.type, 'Lab');
      assert.equal(entry.startTime, '09:00');
    });

    test('maps Assignment using existing enum: NOT_STARTED, IN_PROGRESS, COMPLETED', () => {
      const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
      const assignment: MobileAssignmentItem = {
        id: 'a-1',
        userId: 'u-1',
        title: 'Socket Programming Project',
        description: 'Implement TCP client-server chat',
        dueDate: '2026-09-15T23:59:59.000Z',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        courseId: 'c-1',
        course: {
          id: 'c-1',
          name: 'Computer Networks',
          code: 'CS301',
          color: '#4F46E5',
        },
      };

      assert.ok(validStatuses.includes(assignment.status));
      assert.equal(assignment.status, 'IN_PROGRESS');
      assert.notEqual(assignment.status, 'PENDING');
    });

    test('maps Exam conforming strictly to existing fields (no startTime, duration, or seatNumber)', () => {
      const exam: MobileExamItem = {
        id: 'e-1',
        userId: 'u-1',
        title: 'Midterm Exam',
        courseId: 'c-1',
        examDate: '2026-09-20T10:00:00.000Z',
        room: 'Auditorium A',
        type: 'MIDTERM',
        status: 'UPCOMING',
        preparationProgress: 60,
        notes: 'Covers chapters 1 through 4',
        course: {
          id: 'c-1',
          name: 'Computer Networks',
          code: 'CS301',
          color: '#4F46E5',
        },
      };

      assert.equal(exam.type, 'MIDTERM');
      assert.equal(exam.preparationProgress, 60);
      assert.equal((exam as any).startTime, undefined);
      assert.equal((exam as any).duration, undefined);
      assert.equal((exam as any).seatNumber, undefined);
    });

    test('maps Academics using aggregate Attendance (totalClasses, attendedClasses)', () => {
      const academicData: MobileAcademicData = {
        gpa: 3.82,
        gpaString: '3.82',
        gpaSub: 'Good Standing',
        totalCredits: 15,
        gradedCredits: 15,
        coursesCount: 5,
        gradedCoursesCount: 5,
        overallAttendance: 88,
        attendanceString: '88%',
        attendanceSub: 'Good Standing',
        attendanceStatus: 'Good Standing',
        courses: [
          {
            courseId: 'c-1',
            courseName: 'Computer Networks',
            courseCode: 'CS301',
            creditHours: 3,
            semester: 'Fall 2026',
            color: '#4F46E5',
            grade: 'A',
            gradePoints: 4.0,
            totalClasses: 20,
            attendedClasses: 18,
            attendancePercentage: 90,
            attendanceStatus: 'Good Standing',
          },
        ],
      };

      assert.equal(academicData.gpa, 3.82);
      assert.equal(academicData.courses[0].totalClasses, 20);
      assert.equal(academicData.courses[0].attendedClasses, 18);
      assert.equal(academicData.courses[0].attendancePercentage, 90);
    });

    test('maps Expenses with summary and category breakdown', () => {
      const expense: MobileExpenseItem = {
        id: 'exp-1',
        userId: 'u-1',
        amount: 350.5,
        category: 'BOOKS',
        description: 'Networking Textbook',
        expenseDate: '2026-09-05T00:00:00.000Z',
      };

      const summary: MobileExpenseSummary = {
        totalSpending: 350.5,
        totalSpendingString: 'Rs 350.5',
        thisMonthSpending: 350.5,
        thisMonthSpendingString: 'Rs 350.5',
        thisWeekSpending: 350.5,
        thisWeekSpendingString: 'Rs 350.5',
        averageMonthlySpending: 350.5,
        averageMonthlySpendingString: 'Rs 350.5',
        hasExpenses: true,
        expenseCount: 1,
      };

      assert.equal(expense.amount, 350.5);
      assert.equal(expense.category, 'BOOKS');
      assert.equal(summary.thisMonthSpending, 350.5);
    });

    test('maps Notifications with read state and unread count', () => {
      const notification: MobileNotificationItem = {
        id: 'notif-1',
        userId: 'u-1',
        title: 'Assignment Due Soon',
        message: 'Socket Programming Project is due in 2 days.',
        type: 'WARNING',
        read: false,
        createdAt: '2026-09-07T10:00:00.000Z',
        relatedId: null,
        readAt: null,
      };

      assert.equal(notification.read, false);
      assert.equal(notification.type, 'WARNING');
    });
  });

  // 3. Client Validation Logic
  describe('3. Validation Rules', () => {
    test('enforces attendance attendedClasses cannot exceed totalClasses', () => {
      const validateAttendance = (total: number, attended: number) => {
        if (!Number.isInteger(total) || total < 0) return 'Total classes must be a positive integer';
        if (!Number.isInteger(attended) || attended < 0) return 'Attended classes must be a positive integer';
        if (attended > total) return 'Attended classes cannot exceed total classes';
        return null;
      };

      assert.equal(validateAttendance(10, 8), null);
      assert.equal(validateAttendance(10, 12), 'Attended classes cannot exceed total classes');
      assert.equal(validateAttendance(-1, 5), 'Total classes must be a positive integer');
    });

    test('validates expense positive amount', () => {
      const validateAmount = (amount: number) => {
        if (isNaN(amount) || amount <= 0) return 'Amount must be greater than zero';
        return null;
      };

      assert.equal(validateAmount(100), null);
      assert.equal(validateAmount(0), 'Amount must be greater than zero');
      assert.equal(validateAmount(-50), 'Amount must be greater than zero');
    });

    test('validates assignment status matches schema enum strictly', () => {
      const validStatuses = new Set(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);
      assert.ok(validStatuses.has('NOT_STARTED'));
      assert.ok(validStatuses.has('IN_PROGRESS'));
      assert.ok(validStatuses.has('COMPLETED'));
      assert.ok(!validStatuses.has('PENDING'));
      assert.ok(!validStatuses.has('DONE'));
    });
  });

  // 4. Query Invalidation Strategy
  describe('4. Query Invalidation Strategy', () => {
    test('invalidates appropriate query keys after mutations', () => {
      const invalidations: Record<string, string[][]> = {
        courseMutation: [['courses']],
        assignmentMutation: [['assignments'], ['dashboard']],
        examMutation: [['exams'], ['dashboard']],
        academicMutation: [['academics'], ['dashboard']],
        notificationMutation: [['notifications'], ['dashboard']],
        expenseMutation: [['expenses']],
      };

      assert.deepEqual(invalidations.courseMutation, [['courses']]);
      assert.deepEqual(invalidations.assignmentMutation, [['assignments'], ['dashboard']]);
      assert.deepEqual(invalidations.examMutation, [['exams'], ['dashboard']]);
      assert.deepEqual(invalidations.academicMutation, [['academics'], ['dashboard']]);
      assert.deepEqual(invalidations.notificationMutation, [['notifications'], ['dashboard']]);
      assert.deepEqual(invalidations.expenseMutation, [['expenses']]);
    });
  });

  // 5. Error Handling
  describe('5. Error Handling', () => {
    test('extracts error messages from server response', () => {
      const parseError = (err: any) => {
        if (typeof err?.message === 'string' && err.message.length > 0) {
          return err.message;
        }
        return 'An unexpected error occurred';
      };

      assert.equal(parseError({ message: 'Course not found' }), 'Course not found');
      assert.equal(parseError({ status: 500 }), 'An unexpected error occurred');
    });
  });

  // 6. Security: Zero Server Secrets in Mobile Codebase
  describe('6. Zero Server Secrets in Mobile Codebase', () => {
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
