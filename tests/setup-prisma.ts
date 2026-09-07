import { Prisma } from "@prisma/client";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "default_test_session_secret_at_least_32_chars_long!";

export const mockState: Record<string, any> = {};

export function resetMockState() {
  mockState.courses = [];
  mockState.courseGrades = [];
  mockState.attendance = [];
  mockState.timetable = [];
  mockState.assignments = [];
  mockState.exams = [];
  mockState.expenses = [];
  mockState.notifications = [];
  mockState.users = [];
  mockState.studySessions = [];
  mockState.studentGoals = [];
  mockState.studyPlans = [];
  mockState.studyPlanItems = [];
  mockState.subscriptions = [];
  mockState.aiUsages = [];
  mockState.devicePushTokens = [];
}

resetMockState();

export const mockPrisma = {
  course: {
    findFirst: async ({ where }: any) => {
      return (
        mockState.courses.find((c: any) => {
          if (where.id && c.id !== where.id) return false;
          if (where.userId && c.userId !== where.userId) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where, include }: any) => {
      let list = mockState.courses.filter((c: any) => {
        if (where?.userId && c.userId !== where.userId) return false;
        if (where?.id?.in && !where.id.in.includes(c.id)) return false;
        return true;
      });
      if (include?.grades) {
        list = list.map((c: any) => ({
          ...c,
          grades: mockState.courseGrades.filter((g: any) => g.courseId === c.id),
        }));
      }
      if (include?.attendance) {
        list = list.map((c: any) => ({
          ...c,
          attendance: mockState.attendance.filter((a: any) => a.courseId === c.id),
        }));
      }
      return list;
    },
    create: async ({ data }: any) => {
      const record = { id: `course-${Date.now()}-${Math.random()}`, ...data };
      mockState.courses.push(record);
      return record;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const c of mockState.courses) {
        if (c.id === where.id && c.userId === where.userId) {
          Object.assign(c, data);
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initialLen = mockState.courses.length;
      mockState.courses = mockState.courses.filter(
        (c: any) => !(c.id === where.id && c.userId === where.userId)
      );
      return { count: initialLen - mockState.courses.length };
    },
  },
  courseGrade: {
    upsert: async ({ where, update, create }: any) => {
      const idx = mockState.courseGrades.findIndex(
        (g: any) =>
          g.userId === where.userId_courseId.userId &&
          g.courseId === where.userId_courseId.courseId
      );
      if (idx >= 0) {
        Object.assign(mockState.courseGrades[idx], update);
        return mockState.courseGrades[idx];
      } else {
        const record = { id: `grade-${Date.now()}`, ...create };
        mockState.courseGrades.push(record);
        return record;
      }
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.courseGrades.length;
      mockState.courseGrades = mockState.courseGrades.filter(
        (g: any) => !(g.userId === where.userId && g.courseId === where.courseId)
      );
      return { count: initial - mockState.courseGrades.length };
    },
    findMany: async ({ where }: any) => {
      return mockState.courseGrades.filter((g: any) => {
        if (where?.userId && g.userId !== where.userId) return false;
        if (where?.courseId && g.courseId !== where.courseId) return false;
        return true;
      });
    },
  },
  attendance: {
    findMany: async ({ where }: any) => {
      return mockState.attendance.filter((a: any) => {
        if (where?.userId && a.userId !== where.userId) return false;
        if (where?.courseId && a.courseId !== where.courseId) return false;
        return true;
      });
    },
    upsert: async ({ where, update, create }: any) => {
      const idx = mockState.attendance.findIndex(
        (a: any) =>
          a.userId === where.userId_courseId.userId &&
          a.courseId === where.userId_courseId.courseId
      );
      if (idx >= 0) {
        Object.assign(mockState.attendance[idx], update);
        return mockState.attendance[idx];
      } else {
        const record = { id: `att-${Date.now()}`, ...create };
        mockState.attendance.push(record);
        return record;
      }
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.attendance.length;
      mockState.attendance = mockState.attendance.filter(
        (a: any) => !(a.userId === where.userId && a.courseId === where.courseId)
      );
      return { count: initial - mockState.attendance.length };
    },
  },
  timetableEntry: {
    findMany: async ({ where, include }: any) => {
      let list = mockState.timetable.filter((t: any) => {
        if (where?.userId && t.userId !== where.userId) return false;
        if (where?.dayOfWeek !== undefined && t.dayOfWeek !== where.dayOfWeek) return false;
        return true;
      });
      if (include?.course) {
        list = list.map((t: any) => ({
          ...t,
          course: mockState.courses.find((c: any) => c.id === t.courseId) || null,
        }));
      }
      return list;
    },
    create: async ({ data }: any) => {
      const record = { id: `tt-${Date.now()}-${Math.random()}`, ...data };
      mockState.timetable.push(record);
      return { ...record, course: { id: record.courseId, name: "Test", code: "CS101", color: "#2563eb" } };
    },
    findFirst: async ({ where }: any) => {
      const item = mockState.timetable.find((t: any) => {
        if (where.id && t.id !== where.id) return false;
        if (where.userId && t.userId !== where.userId) return false;
        return true;
      });
      if (!item) return null;
      return { ...item, course: { id: item.courseId, name: "Test", code: "CS101", color: "#2563eb" } };
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const t of mockState.timetable) {
        if (t.id === where.id && t.userId === where.userId) {
          Object.assign(t, data);
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.timetable.length;
      mockState.timetable = mockState.timetable.filter(
        (t: any) => !(t.id === where.id && t.userId === where.userId)
      );
      return { count: initial - mockState.timetable.length };
    },
  },
  assignment: {
    findMany: async ({ where, include, orderBy, take }: any) => {
      let list = mockState.assignments.filter((a: any) => {
        if (where?.userId && a.userId !== where.userId) return false;
        if (where?.dueDate?.gte && a.dueDate < where.dueDate.gte) return false;
        if (where?.dueDate?.lte && a.dueDate > where.dueDate.lte) return false;
        return true;
      });
      if (include?.course) {
        list = list.map((a: any) => ({
          ...a,
          course: mockState.courses.find((c: any) => c.id === a.courseId) || null,
        }));
      }
      return list;
    },
    create: async ({ data }: any) => {
      const record = { id: `asgn-${Date.now()}-${Math.random()}`, ...data };
      mockState.assignments.push(record);
      return { ...record, course: { id: record.courseId, name: "Test", code: "CS101", color: "#2563eb" } };
    },
    findFirst: async ({ where }: any) => {
      const item = mockState.assignments.find((a: any) => {
        if (where.id && a.id !== where.id) return false;
        if (where.userId && a.userId !== where.userId) return false;
        return true;
      });
      if (!item) return null;
      return { ...item, course: { id: item.courseId, name: "Test", code: "CS101", color: "#2563eb" } };
    },
    count: async ({ where }: any) => {
      return mockState.assignments.filter((a: any) => {
        if (where?.userId && a.userId !== where.userId) return false;
        if (where?.status?.not && a.status === where.status.not) return false;
        if (where?.dueDate?.gte && a.dueDate < where.dueDate.gte) return false;
        if (where?.dueDate?.lte && a.dueDate > where.dueDate.lte) return false;
        return true;
      }).length;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const a of mockState.assignments) {
        if (a.id === where.id && a.userId === where.userId) {
          Object.assign(a, data);
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.assignments.length;
      mockState.assignments = mockState.assignments.filter(
        (a: any) => !(a.id === where.id && a.userId === where.userId)
      );
      return { count: initial - mockState.assignments.length };
    },
  },
  exam: {
    findMany: async ({ where, include, orderBy, take }: any) => {
      let list = mockState.exams.filter((e: any) => {
        if (where?.userId && e.userId !== where.userId) return false;
        if (where?.examDate?.gte && e.examDate < where.examDate.gte) return false;
        if (where?.examDate?.lte && e.examDate > where.examDate.lte) return false;
        return true;
      });
      if (include?.course) {
        list = list.map((e: any) => ({
          ...e,
          course: mockState.courses.find((c: any) => c.id === e.courseId) || null,
        }));
      }
      return list;
    },
    create: async ({ data }: any) => {
      const record = { id: `exam-${Date.now()}-${Math.random()}`, ...data };
      mockState.exams.push(record);
      const course = mockState.courses.find((c: any) => c.id === record.courseId) || { id: record.courseId, name: "Test", code: "CS101", color: "#2563eb" };
      return { ...record, course };
    },
    findFirst: async ({ where, include, orderBy }: any) => {
      let list = mockState.exams.filter((e: any) => {
        if (where?.id && e.id !== where.id) return false;
        if (where?.userId && e.userId !== where.userId) return false;
        if (where?.status?.not && e.status === where.status.not) return false;
        if (typeof where?.status === "string" && e.status !== where.status) return false;
        if (where?.examDate?.gte && e.examDate < where.examDate.gte) return false;
        if (where?.examDate?.lte && e.examDate > where.examDate.lte) return false;
        return true;
      });
      if (orderBy?.examDate === "asc") {
        list.sort((a: any, b: any) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
      }
      const item = list[0];
      if (!item) return null;
      const course = mockState.courses.find((c: any) => c.id === item.courseId) || { id: item.courseId, name: "Test", code: "CS101", color: "#2563eb" };
      return { ...item, course };
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const e of mockState.exams) {
        if (e.id === where.id && e.userId === where.userId) {
          Object.assign(e, data);
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.exams.length;
      mockState.exams = mockState.exams.filter(
        (e: any) => !(e.id === where.id && e.userId === where.userId)
      );
      return { count: initial - mockState.exams.length };
    },
  },
  expense: {
    findMany: async ({ where }: any) => {
      return mockState.expenses
        .filter((exp: any) => exp.userId === where.userId)
        .map((exp: any) => ({
          ...exp,
          amount: new Prisma.Decimal(exp.amount),
        }));
    },
    findFirst: async ({ where }: any) => {
      const exp = mockState.expenses.find((e: any) => {
        if (where.id && e.id !== where.id) return false;
        if (where.userId && e.userId !== where.userId) return false;
        return true;
      });
      if (!exp) return null;
      return { ...exp, amount: new Prisma.Decimal(exp.amount) };
    },
    create: async ({ data }: any) => {
      const record = { id: `exp-${Date.now()}-${Math.random()}`, ...data };
      mockState.expenses.push(record);
      return record;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const exp of mockState.expenses) {
        if (exp.id === where.id && exp.userId === where.userId) {
          Object.assign(exp, data);
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.expenses.length;
      mockState.expenses = mockState.expenses.filter(
        (e: any) => !(e.id === where.id && e.userId === where.userId)
      );
      return { count: initial - mockState.expenses.length };
    },
  },
  notification: {
    findMany: async ({ where, select }: any) => {
      return mockState.notifications.filter((n: any) => {
        if (where?.userId && n.userId !== where.userId) return false;
        if (where?.read !== undefined && n.read !== where.read) return false;
        return true;
      });
    },
    count: async ({ where }: any) => {
      return mockState.notifications.filter((n: any) => {
        if (where?.userId && n.userId !== where.userId) return false;
        if (where?.read !== undefined && n.read !== where.read) return false;
        return true;
      }).length;
    },
    createMany: async ({ data }: any) => {
      const records = data.map((d: any) => ({
        id: `notif-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        read: false,
        ...d,
      }));
      mockState.notifications.push(...records);
      return { count: records.length };
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const n of mockState.notifications) {
        if (n.id === where.id && n.userId === where.userId) {
          Object.assign(n, data);
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.notifications.length;
      mockState.notifications = mockState.notifications.filter(
        (n: any) => !(n.id === where.id && n.userId === where.userId)
      );
      return { count: initial - mockState.notifications.length };
    },
  },
  user: {
    findUnique: async ({ where }: any) => {
      if (where.email) {
        return mockState.users.find((u: any) => u.email === where.email) || null;
      }
      if (where.id) {
        return mockState.users.find((u: any) => u.id === where.id) || null;
      }
      return null;
    },
    create: async ({ data }: any) => {
      const record = {
        id: `user-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.users.push(record);
      return record;
    },
  },
  $transaction: async (fnOrArray: any) => {
    if (typeof fnOrArray === "function") {
      return await fnOrArray(mockPrisma);
    }
    return Promise.all(fnOrArray);
  },
  studySession: {
    findMany: async ({ where, include, orderBy, take, skip }: any) => {
      let list = mockState.studySessions.filter((s: any) => {
        if (where?.userId && s.userId !== where.userId) return false;
        if (where?.courseId && s.courseId !== where.courseId) return false;
        if (where?.completed !== undefined && s.completed !== where.completed) return false;
        if (where?.sessionDate?.gte && s.sessionDate < where.sessionDate.gte) return false;
        if (where?.sessionDate?.lte && s.sessionDate > where.sessionDate.lte) return false;
        return true;
      });
      if (include?.course) {
        list = list.map((s: any) => ({
          ...s,
          course: mockState.courses.find((c: any) => c.id === s.courseId) || null,
        }));
      }
      return list;
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.studySessions.find((s: any) => {
          if (where.id && s.id !== where.id) return false;
          if (where.userId && s.userId !== where.userId) return false;
          return true;
        }) || null
      );
    },
    create: async ({ data, include }: any) => {
      const record = {
        id: `sess-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.studySessions.push(record);
      if (include?.course) {
        return {
          ...record,
          course: mockState.courses.find((c: any) => c.id === record.courseId) || null,
        };
      }
      return record;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const s of mockState.studySessions) {
        if (s.id === where.id && s.userId === where.userId) {
          Object.assign(s, data, { updatedAt: new Date() });
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.studySessions.length;
      mockState.studySessions = mockState.studySessions.filter(
        (s: any) => !(s.id === where.id && s.userId === where.userId)
      );
      return { count: initial - mockState.studySessions.length };
    },
    count: async ({ where }: any) => {
      return mockState.studySessions.filter((s: any) => {
        if (where?.userId && s.userId !== where.userId) return false;
        if (where?.completed !== undefined && s.completed !== where.completed) return false;
        return true;
      }).length;
    },
  },
  studentGoal: {
    findMany: async ({ where }: any) => {
      return mockState.studentGoals.filter((g: any) => {
        if (where?.userId && g.userId !== where.userId) return false;
        if (where?.active !== undefined && g.active !== where.active) return false;
        return true;
      });
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.studentGoals.find((g: any) => {
          if (where.id && g.id !== where.id) return false;
          if (where.userId && g.userId !== where.userId) return false;
          if (where.type && g.type !== where.type) return false;
          if (where.active !== undefined && g.active !== where.active) return false;
          return true;
        }) || null
      );
    },
    create: async ({ data }: any) => {
      const record = {
        id: `goal-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.studentGoals.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const goal = mockState.studentGoals.find((g: any) => g.id === where.id);
      if (goal) {
        Object.assign(goal, data, { updatedAt: new Date() });
        return goal;
      }
      throw new Error("Goal not found");
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.studentGoals.length;
      mockState.studentGoals = mockState.studentGoals.filter(
        (g: any) => !(g.id === where.id && g.userId === where.userId)
      );
      return { count: initial - mockState.studentGoals.length };
    },
  },
  studyPlan: {
    findMany: async ({ where }: any) => {
      return mockState.studyPlans.filter((p: any) => {
        if (where?.userId && p.userId !== where.userId) return false;
        return true;
      });
    },
    findFirst: async ({ where, include }: any) => {
      const plan = mockState.studyPlans.find((p: any) => {
        if (where.id && p.id !== where.id) return false;
        if (where.userId && p.userId !== where.userId) return false;
        if (where.status && p.status !== where.status) return false;
        return true;
      });
      if (!plan) return null;
      if (include?.items) {
        let items = mockState.studyPlanItems.filter((it: any) => it.studyPlanId === plan.id);
        if (include.items.include?.course) {
          items = items.map((it: any) => ({
            ...it,
            course: mockState.courses.find((c: any) => c.id === it.courseId) || null,
          }));
        }
        return { ...plan, items };
      }
      return plan;
    },
    create: async ({ data, include }: any) => {
      const planId = `plan-${Date.now()}-${Math.random()}`;
      const plan = {
        id: planId,
        userId: data.userId,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockState.studyPlans.push(plan);

      let items: any[] = [];
      if (data.items?.create) {
        items = data.items.create.map((it: any, idx: number) => {
          const item = {
            id: `plan-item-${Date.now()}-${idx}-${Math.random()}`,
            studyPlanId: planId,
            courseId: it.courseId || null,
            title: it.title,
            description: it.description || "",
            scheduledAt: it.scheduledAt,
            duration: it.duration,
            order: it.order ?? idx,
            completed: it.completed || false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockState.studyPlanItems.push(item);
          return item;
        });
      }

      if (include?.items) {
        return {
          ...plan,
          items: items.map((it) => ({
            ...it,
            course: mockState.courses.find((c: any) => c.id === it.courseId) || null,
          })),
        };
      }
      return plan;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const p of mockState.studyPlans) {
        if (where?.userId && p.userId !== where.userId) continue;
        if (where?.status && p.status !== where.status) continue;
        Object.assign(p, data, { updatedAt: new Date() });
        count++;
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.studyPlans.length;
      const plansToDelete = mockState.studyPlans.filter(
        (p: any) => p.id === where.id && p.userId === where.userId
      );
      const planIds = new Set(plansToDelete.map((p: any) => p.id));
      mockState.studyPlans = mockState.studyPlans.filter((p: any) => !planIds.has(p.id));
      mockState.studyPlanItems = mockState.studyPlanItems.filter(
        (it: any) => !planIds.has(it.studyPlanId)
      );
      return { count: initial - mockState.studyPlans.length };
    },
  },
  studyPlanItem: {
    findMany: async ({ where, include }: any) => {
      let list = mockState.studyPlanItems.filter((it: any) => {
        if (where?.studyPlanId && it.studyPlanId !== where.studyPlanId) return false;
        if (where?.completed !== undefined && it.completed !== where.completed) return false;
        if (where?.scheduledAt?.gte && it.scheduledAt < where.scheduledAt.gte) return false;
        if (where?.scheduledAt?.lte && it.scheduledAt > where.scheduledAt.lte) return false;
        if (where?.studyPlan?.userId) {
          const parent = mockState.studyPlans.find((p: any) => p.id === it.studyPlanId);
          if (!parent || parent.userId !== where.studyPlan.userId) return false;
        }
        return true;
      });
      if (include?.course) {
        list = list.map((it: any) => ({
          ...it,
          course: mockState.courses.find((c: any) => c.id === it.courseId) || null,
        }));
      }
      return list;
    },
    findFirst: async ({ where, include }: any) => {
      const it = mockState.studyPlanItems.find((item: any) => {
        if (where.id && item.id !== where.id) return false;
        if (where.studyPlan?.userId) {
          const parent = mockState.studyPlans.find((p: any) => p.id === item.studyPlanId);
          if (!parent || parent.userId !== where.studyPlan.userId) return false;
        }
        return true;
      });
      if (!it) return null;
      if (include?.studyPlan) {
        const parent = mockState.studyPlans.find((p: any) => p.id === it.studyPlanId);
        return { ...it, studyPlan: parent };
      }
      return it;
    },
    create: async ({ data }: any) => {
      const record = {
        id: `plan-item-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.studyPlanItems.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const it = mockState.studyPlanItems.find((item: any) => item.id === where.id);
      if (it) {
        Object.assign(it, data, { updatedAt: new Date() });
        return it;
      }
      throw new Error("Study plan item not found");
    },
    delete: async ({ where }: any) => {
      const idx = mockState.studyPlanItems.findIndex((item: any) => item.id === where.id);
      if (idx >= 0) {
        const [deleted] = mockState.studyPlanItems.splice(idx, 1);
        return deleted;
      }
      throw new Error("Study plan item not found");
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.studyPlanItems.length;
      mockState.studyPlanItems = mockState.studyPlanItems.filter(
        (it: any) => it.studyPlanId !== where?.studyPlanId
      );
      return { count: initial - mockState.studyPlanItems.length };
    },
  },
  subscription: {
    findUnique: async ({ where }: any) => {
      return (
        mockState.subscriptions.find((s: any) => {
          if (where.userId && s.userId !== where.userId) return false;
          if (where.id && s.id !== where.id) return false;
          return true;
        }) || null
      );
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.subscriptions.find((s: any) => {
          if (where.userId && s.userId !== where.userId) return false;
          if (where.providerCustomerId && s.providerCustomerId !== where.providerCustomerId) return false;
          if (where.providerSubscriptionId && s.providerSubscriptionId !== where.providerSubscriptionId) return false;
          return true;
        }) || null
      );
    },
    upsert: async ({ where, create, update }: any) => {
      const idx = mockState.subscriptions.findIndex(
        (s: any) => s.userId === where.userId
      );
      if (idx >= 0) {
        Object.assign(mockState.subscriptions[idx], update, { updatedAt: new Date() });
        return mockState.subscriptions[idx];
      } else {
        const record = {
          id: `sub-${Date.now()}-${Math.random()}`,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockState.subscriptions.push(record);
        return record;
      }
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.subscriptions.length;
      mockState.subscriptions = mockState.subscriptions.filter(
        (s: any) => !(where.userId && s.userId === where.userId)
      );
      return { count: initial - mockState.subscriptions.length };
    },
  },
  aIUsage: {
    findUnique: async ({ where }: any) => {
      const target = where.userId_date;
      if (!target) return null;
      return (
        mockState.aiUsages.find(
          (u: any) => u.userId === target.userId && u.date === target.date
        ) || null
      );
    },
    upsert: async ({ where, create, update }: any) => {
      const target = where.userId_date;
      const idx = mockState.aiUsages.findIndex(
        (u: any) => u.userId === target.userId && u.date === target.date
      );
      if (idx >= 0) {
        if (update.requestCount?.increment) {
          mockState.aiUsages[idx].requestCount += update.requestCount.increment;
        } else if (typeof update.requestCount === "number") {
          mockState.aiUsages[idx].requestCount = update.requestCount;
        }
        mockState.aiUsages[idx].updatedAt = new Date();
        return mockState.aiUsages[idx];
      } else {
        const record = {
          id: `ai-use-${Date.now()}-${Math.random()}`,
          userId: create.userId,
          date: create.date,
          requestCount: create.requestCount || 0,
          tokenCount: create.tokenCount || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockState.aiUsages.push(record);
        return record;
      }
    },
  },
  devicePushToken: {
    findUnique: async ({ where }: any) => {
      return (
        mockState.devicePushTokens.find((t: any) => t.token === where.token) || null
      );
    },
    upsert: async ({ where, create, update }: any) => {
      const idx = mockState.devicePushTokens.findIndex(
        (t: any) => t.token === where.token
      );
      if (idx >= 0) {
        Object.assign(mockState.devicePushTokens[idx], update, { updatedAt: new Date() });
        return mockState.devicePushTokens[idx];
      } else {
        const record = {
          id: `push-token-${Date.now()}-${Math.random()}`,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockState.devicePushTokens.push(record);
        return record;
      }
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.devicePushTokens.length;
      mockState.devicePushTokens = mockState.devicePushTokens.filter(
        (t: any) => !(t.userId === where.userId && (!where.token || t.token === where.token))
      );
      return { count: initial - mockState.devicePushTokens.length };
    },
  },
};

(globalThis as any).prisma = mockPrisma;

