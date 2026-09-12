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
  mockState.universities = [];
  mockState.campuses = [];
  mockState.departments = [];
  mockState.communities = [];
  mockState.communityMembers = [];
  mockState.communityAnnouncements = [];
  mockState.communityEvents = [];
  mockState.communityEventAttendees = [];
  mockState.communityResources = [];
  mockState.communityReports = [];
  mockState.userIntegrations = [];
  mockState.externalRecordMappings = [];
  mockState.oauthTransactions = [];
  mockState.emailVerificationChallenges = [];
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
    findMany: async ({ where, include, take }: any) => {
      let list = mockState.courses.filter((c: any) => {
        if (where?.userId && c.userId !== where.userId) return false;
        if (where?.id?.in && !where.id.in.includes(c.id)) return false;
        if (where?.OR && Array.isArray(where.OR)) {
          const matches = where.OR.some((clause: any) => {
            if (clause.name?.contains && !c.name.toLowerCase().includes(clause.name.contains.toLowerCase())) return false;
            if (clause.code?.contains && !c.code.toLowerCase().includes(clause.code.contains.toLowerCase())) return false;
            return true;
          });
          if (!matches) return false;
        }
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
      if (take) list = list.slice(0, take);
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
    update: async ({ where, data }: any) => {
      const item = mockState.timetable.find((t: any) => t.id === where.id);
      if (!item) throw new Error("TimetableEntry not found");
      Object.assign(item, data);
      return item;
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
        if (where?.status?.in && !where.status.in.includes(a.status)) return false;
        if (where?.status?.notIn && where.status.notIn.includes(a.status)) return false;
        if (where?.status?.not && a.status === where.status.not) return false;
        if (typeof where?.status === "string" && a.status !== where.status) return false;
        if (where?.dueDate?.gte && a.dueDate < where.dueDate.gte) return false;
        if (where?.dueDate?.lte && a.dueDate > where.dueDate.lte) return false;
        if (where?.dueDate?.lt && a.dueDate >= where.dueDate.lt) return false;
        if (where?.updatedAt?.gte && a.updatedAt < where.updatedAt.gte) return false;
        if (where?.updatedAt?.lte && a.updatedAt > where.updatedAt.lte) return false;
        if (where?.OR && Array.isArray(where.OR)) {
          const matches = where.OR.some((clause: any) => {
            if (clause.title?.contains && !a.title.toLowerCase().includes(clause.title.contains.toLowerCase())) return false;
            if (clause.description?.contains && !(a.description || "").toLowerCase().includes(clause.description.contains.toLowerCase())) return false;
            return true;
          });
          if (!matches) return false;
        }
        return true;
      });
      if (include?.course) {
        list = list.map((a: any) => ({
          ...a,
          course: mockState.courses.find((c: any) => c.id === a.courseId) || null,
        }));
      }
      if (take) list = list.slice(0, take);
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
        if (where?.OR && Array.isArray(where.OR)) {
          const matches = where.OR.some((clause: any) => {
            if (clause.title?.contains && !e.title.toLowerCase().includes(clause.title.contains.toLowerCase())) return false;
            return true;
          });
          if (!matches) return false;
        }
        return true;
      });
      if (include?.course) {
        list = list.map((e: any) => ({
          ...e,
          course: mockState.courses.find((c: any) => c.id === e.courseId) || null,
        }));
      }
      if (take) list = list.slice(0, take);
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
    findFirst: async ({ where }: any) => {
      return (
        mockState.notifications.find((n: any) => {
          if (where?.id && n.id !== where.id) return false;
          if (where?.userId && n.userId !== where.userId) return false;
          if (where?.read !== undefined && n.read !== where.read) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where, select }: any) => {
      return mockState.notifications.filter((n: any) => {
        if (where?.userId && n.userId !== where.userId) return false;
        if (where?.read !== undefined && n.read !== where.read) return false;
        if (where?.type && typeof where.type === "string" && n.type !== where.type) return false;
        return true;
      });
    },
    count: async ({ where }: any) => {
      return mockState.notifications.filter((n: any) => {
        if (where?.userId && n.userId !== where.userId) return false;
        if (where?.read !== undefined && n.read !== where.read) return false;
        if (where?.type && typeof where.type === "string" && n.type !== where.type) return false;
        return true;
      }).length;
    },
    create: async ({ data }: any) => {
      const record = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        read: false,
        ...data,
      };
      mockState.notifications.push(record);
      return record;
    },
    createMany: async ({ data }: any) => {
      const records = data.map((d: any) => ({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
        if (where?.userId && n.userId !== where.userId) continue;
        if (where?.id && n.id !== where.id) continue;
        if (where?.read !== undefined && n.read !== where.read) continue;
        Object.assign(n, data);
        count++;
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
    findUnique: async ({ where, include, select }: any) => {
      let u = null;
      if (where.email) {
        u = mockState.users.find((user: any) => user.email === where.email) || null;
      } else if (where.id) {
        u = mockState.users.find((user: any) => user.id === where.id) || null;
      } else if (where.username) {
        u = mockState.users.find((user: any) => user.username === where.username) || null;
      }
      if (!u) return null;

      let res = { ...u };
      if (include?.university) {
        res.university = mockState.universities.find((univ: any) => univ.id === u.universityId) || null;
      }
      if (include?.campus) {
        res.campus = mockState.campuses.find((camp: any) => camp.id === u.campusId) || null;
      }
      if (include?.department) {
        res.department = mockState.departments.find((dept: any) => dept.id === u.departmentId) || null;
      }
      return res;
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
    update: async ({ where, data }: any) => {
      const u = mockState.users.find((user: any) => (where.id && user.id === where.id) || (where.email && user.email === where.email));
      if (!u) throw new Error("User not found");
      Object.assign(u, data, { updatedAt: new Date() });
      return u;
    },
  },
  university: {
    findUnique: async ({ where, include }: any) => {
      let u = null;
      if (where.id) {
        u = mockState.universities.find((univ: any) => univ.id === where.id) || null;
      }
      if (!u) return null;
      let res = { ...u };
      if (include?.campuses) {
        res.campuses = mockState.campuses.filter((c: any) => c.universityId === u.id);
      }
      if (include?.departments) {
        res.departments = mockState.departments.filter((d: any) => d.universityId === u.id);
      }
      return res;
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.universities.find((u: any) => {
          if (where?.name?.equals && u.name.toLowerCase() !== where.name.equals.toLowerCase()) return false;
          if (where?.country?.equals && u.country.toLowerCase() !== where.country.equals.toLowerCase()) return false;
          if (where?.countryCode?.equals && u.countryCode?.toLowerCase() !== where.countryCode.equals.toLowerCase()) return false;
          if (where?.countryCode && typeof where.countryCode === "string" && u.countryCode?.toLowerCase() !== where.countryCode.toLowerCase()) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where, include, orderBy, take, skip }: any) => {
      let list = [...mockState.universities];
      if (where?.country) {
        list = list.filter((u: any) => u.country.toLowerCase() === where.country.toLowerCase());
      }
      if (where?.countryCode) {
        list = list.filter((u: any) => u.countryCode?.toLowerCase() === where.countryCode.toLowerCase());
      }
      if (where?.isVerified !== undefined) {
        list = list.filter((u: any) => u.isVerified === where.isVerified);
      }
      if (where?.OR) {
        // Simple search query match on name, shortName, city
        list = list.filter((u: any) => {
          return where.OR.some((clause: any) => {
            if (clause.name?.contains) {
              return u.name.toLowerCase().includes(clause.name.contains.toLowerCase());
            }
            if (clause.shortName?.contains) {
              return u.shortName?.toLowerCase().includes(clause.shortName.contains.toLowerCase());
            }
            if (clause.city?.contains) {
              return u.city?.toLowerCase().includes(clause.city.contains.toLowerCase());
            }
            if (clause.country) {
              const target = clause.country.equals || clause.country;
              if (typeof target === "string" && u.country.toLowerCase() === target.toLowerCase()) return true;
            }
            if (clause.countryCode) {
              const target = clause.countryCode.equals || clause.countryCode;
              if (typeof target === "string" && u.countryCode?.toLowerCase() === target.toLowerCase()) return true;
            }
            return false;
          });
        });
      }
      if (include?.campuses) {
        list = list.map((u: any) => ({
          ...u,
          campuses: mockState.campuses.filter((c: any) => c.universityId === u.id),
        }));
      }
      if (include?.departments) {
        list = list.map((u: any) => ({
          ...u,
          departments: mockState.departments.filter((d: any) => d.universityId === u.id),
        }));
      }
      if (skip) list = list.slice(skip);
      if (take) list = list.slice(0, take);
      return list;
    },
    count: async ({ where }: any) => {
      let list = [...mockState.universities];
      if (where?.country) {
        list = list.filter((u: any) => u.country.toLowerCase() === where.country.toLowerCase());
      }
      if (where?.countryCode) {
        list = list.filter((u: any) => u.countryCode?.toLowerCase() === where.countryCode.toLowerCase());
      }
      if (where?.isVerified !== undefined) {
        list = list.filter((u: any) => u.isVerified === where.isVerified);
      }
      return list.length;
    },
    create: async ({ data, select, include }: any) => {
      const { campuses, departments, ...univData } = data;
      const record = {
        id: `univ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
        timezone: "UTC",
        ...univData,
      };
      mockState.universities.push(record);

      let createdCampuses: any[] = [];
      if (campuses?.create) {
        const toCreate = Array.isArray(campuses.create) ? campuses.create : [campuses.create];
        for (const c of toCreate) {
          const campRecord = {
            id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            universityId: record.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isMain: false,
            ...c,
          };
          mockState.campuses.push(campRecord);
          createdCampuses.push(campRecord);
        }
      }

      let res: any = { ...record };
      if (select?.campuses || include?.campuses) {
        res.campuses = createdCampuses;
      }
      return res;
    },
    update: async ({ where, data }: any) => {
      const idx = mockState.universities.findIndex((u: any) => u.id === where.id);
      if (idx >= 0) {
        Object.assign(mockState.universities[idx], data, { updatedAt: new Date() });
        return mockState.universities[idx];
      }
      throw new Error("University not found");
    },
    upsert: async ({ where, create, update }: any) => {
      let existing = null;
      if (where.id) {
        existing = mockState.universities.find((u: any) => u.id === where.id);
      }
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const record = {
        id: where.id || `univ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
        timezone: "UTC",
        ...create,
      };
      mockState.universities.push(record);
      return record;
    },
  },
  campus: {
    findUnique: async ({ where }: any) => {
      if (where.id) {
        return mockState.campuses.find((c: any) => c.id === where.id) || null;
      }
      if (where.universityId_name) {
        return mockState.campuses.find((c: any) => c.universityId === where.universityId_name.universityId && c.name === where.universityId_name.name) || null;
      }
      return null;
    },
    findMany: async ({ where }: any) => {
      return mockState.campuses.filter((c: any) => {
        if (where?.universityId && c.universityId !== where.universityId) return false;
        return true;
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isMain: false,
        ...data,
      };
      mockState.campuses.push(record);
      return record;
    },
    upsert: async ({ where, create, update }: any) => {
      let existing = null;
      if (where.universityId_name) {
        existing = mockState.campuses.find(
          (c: any) => c.universityId === where.universityId_name.universityId && c.name === where.universityId_name.name
        );
      }
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const record = {
        id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isMain: false,
        ...create,
      };
      mockState.campuses.push(record);
      return record;
    },
  },
  department: {
    findUnique: async ({ where }: any) => {
      if (where.id) {
        return mockState.departments.find((d: any) => d.id === where.id) || null;
      }
      if (where.universityId_name) {
        return mockState.departments.find((d: any) => d.universityId === where.universityId_name.universityId && d.name === where.universityId_name.name) || null;
      }
      return null;
    },
    findMany: async ({ where }: any) => {
      return mockState.departments.filter((d: any) => {
        if (where?.universityId && d.universityId !== where.universityId) return false;
        return true;
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `dept-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.departments.push(record);
      return record;
    },
    upsert: async ({ where, create, update }: any) => {
      let existing = null;
      if (where.universityId_name) {
        existing = mockState.departments.find(
          (d: any) => d.universityId === where.universityId_name.universityId && d.name === where.universityId_name.name
        );
      }
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const record = {
        id: `dept-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...create,
      };
      mockState.departments.push(record);
      return record;
    },
  },
  $transaction: async (fnOrArray: any) => {
    if (typeof fnOrArray === "function") {
      return await fnOrArray(mockPrisma);
    }
    return Promise.all(fnOrArray);
  },
  $queryRaw: async (strings: any, ...values: any[]) => {
    // If querying community_events FOR UPDATE
    const queryStr = Array.isArray(strings) ? strings.join(" ") : String(strings);
    if (queryStr.includes("community_events") || queryStr.includes("CommunityEvent")) {
      const eventId = values[0];
      const communityId = values[1];
      const ev = mockState.communityEvents.find(
        (e: any) => e.id === eventId && (!communityId || e.communityId === communityId)
      );
      if (ev) {
        return [{ id: ev.id, communityId: ev.communityId, capacity: ev.capacity, status: ev.status }];
      }
      return [];
    }
    return [];
  },
  studySession: {
    findMany: async ({ where, include, orderBy, take, skip }: any) => {
      let list = mockState.studySessions.filter((s: any) => {
        if (where?.userId && s.userId !== where.userId) return false;
        // courseId: plain equality or { not: null }
        if (where?.courseId !== undefined) {
          if (where.courseId === null) { if (s.courseId !== null) return false; }
          else if (typeof where.courseId === "object" && where.courseId?.not !== undefined) {
            if (where.courseId.not === null && s.courseId === null) return false;
          } else if (s.courseId !== where.courseId) return false;
        }
        if (where?.completed !== undefined && s.completed !== where.completed) return false;
        if (where?.status && typeof where.status === "string" && s.status !== where.status) return false;
        if (where?.status?.in && Array.isArray(where.status.in) && !where.status.in.includes(s.status)) return false;
        if (where?.sessionDate?.gte && s.sessionDate < where.sessionDate.gte) return false;
        if (where?.sessionDate?.lte && s.sessionDate > where.sessionDate.lte) return false;
        // targetType: plain equality filter
        if (where?.targetType !== undefined && where.targetType !== null && typeof where.targetType === "string") {
          if (s.targetType !== where.targetType) return false;
        }
        // targetId: { not: null } filter
        if (where?.targetId !== undefined) {
          if (typeof where.targetId === "object" && where.targetId?.not !== undefined) {
            if (where.targetId.not === null && s.targetId === null) return false;
          } else if (s.targetId !== where.targetId) return false;
        }
        // OR clause: each element is an AND-clause; at least one must match
        if (where?.OR && Array.isArray(where.OR)) {
          const orMatch = where.OR.some((clause: any) => {
            if (clause.targetType !== undefined) {
              if (clause.targetType === null) return s.targetType === null;
              return s.targetType === clause.targetType;
            }
            return true;
          });
          if (!orMatch) return false;
        }
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
    findUnique: async ({ where, include }: any) => {
      const sess = mockState.studySessions.find((s: any) => {
        if (where.id && s.id !== where.id) return false;
        return true;
      });
      if (!sess) return null;
      if (include?.course) {
        return {
          ...sess,
          course: mockState.courses.find((c: any) => c.id === sess.courseId) || null,
        };
      }
      return sess;
    },
    findFirst: async ({ where, include }: any) => {
      const sess = mockState.studySessions.find((s: any) => {
        if (where.id && s.id !== where.id) return false;
        if (where.userId && s.userId !== where.userId) return false;
        if (where.status && typeof where.status === "string" && s.status !== where.status) return false;
        if (where.status?.in && Array.isArray(where.status.in) && !where.status.in.includes(s.status)) return false;
        if (where.completed !== undefined && s.completed !== where.completed) return false;
        return true;
      });
      if (!sess) return null;
      if (include?.course) {
        return {
          ...sess,
          course: mockState.courses.find((c: any) => c.id === sess.courseId) || null,
        };
      }
      return sess;
    },
    create: async ({ data, include }: any) => {
      // Check partial unique index constraint: unique active/paused session per userId
      if (data.status === "ACTIVE" || data.status === "PAUSED") {
        const hasActive = mockState.studySessions.some(
          (s: any) => s.userId === data.userId && (s.status === "ACTIVE" || s.status === "PAUSED")
        );
        if (hasActive) {
          const err: any = new Error("Unique constraint failed on the fields: (`userId`)");
          err.code = "P2002";
          throw err;
        }
      }
      const record = {
        id: `sess-${Date.now()}-${Math.random()}`,
        status: "COMPLETED",
        targetType: null,
        targetId: null,
        plannedDuration: null,
        pausedAt: null,
        totalPausedSeconds: 0,
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
    update: async ({ where, data, include }: any) => {
      const sess = mockState.studySessions.find((s: any) => s.id === where.id);
      if (!sess) throw new Error("Study session not found");
      Object.assign(sess, data, { updatedAt: new Date() });
      if (include?.course) {
        return {
          ...sess,
          course: mockState.courses.find((c: any) => c.id === sess.courseId) || null,
        };
      }
      return sess;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const s of mockState.studySessions) {
        if (s.id !== where.id || s.userId !== where.userId) continue;
        // Evaluate status filter in WHERE (required for atomic conditional-write pattern)
        if (where.status !== undefined) {
          if (typeof where.status === "string" && s.status !== where.status) continue;
          if (where.status?.in && Array.isArray(where.status.in) && !where.status.in.includes(s.status)) continue;
          if (where.status?.notIn && Array.isArray(where.status.notIn) && where.status.notIn.includes(s.status)) continue;
        }
        Object.assign(s, data, { updatedAt: new Date() });
        count++;
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.studySessions.length;
      mockState.studySessions = mockState.studySessions.filter((s: any) => {
        if (!(s.id === where.id && s.userId === where.userId)) return true; // keep
        // Evaluate status filter in WHERE (required for atomic conditional-delete pattern)
        if (where.status?.notIn && Array.isArray(where.status.notIn) && where.status.notIn.includes(s.status)) return true; // keep
        return false; // delete
      });
      return { count: initial - mockState.studySessions.length };
    },
    count: async ({ where }: any) => {
      return mockState.studySessions.filter((s: any) => {
        if (where?.userId && s.userId !== where.userId) return false;
        if (where?.completed !== undefined && s.completed !== where.completed) return false;
        if (where?.status && typeof where.status === "string" && s.status !== where.status) return false;
        if (where?.status?.in && Array.isArray(where.status.in) && !where.status.in.includes(s.status)) return false;
        return true;
      }).length;
    },
  },
  studentGoal: {
    findMany: async ({ where, take }: any) => {
      let list = mockState.studentGoals.filter((g: any) => {
        if (where?.userId && g.userId !== where.userId) return false;
        if (where?.active !== undefined && g.active !== where.active) return false;
        if (where?.OR && Array.isArray(where.OR)) {
          const matches = where.OR.some((clause: any) => {
            if (clause.title?.contains && !(g.title || "").toLowerCase().includes(clause.title.contains.toLowerCase())) return false;
            if (clause.type?.contains && !(g.type || "").toLowerCase().includes(clause.type.contains.toLowerCase())) return false;
            return true;
          });
          if (!matches) return false;
        }
        return true;
      });
      if (take) list = list.slice(0, take);
      return list;
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
        if (where?.status && p.status !== where.status) return false;
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
      const status = data.status || "ACTIVE";
      if (status === "ACTIVE") {
        const hasActive = mockState.studyPlans.some(
          (p: any) => p.userId === data.userId && p.status === "ACTIVE"
        );
        if (hasActive) {
          const err: any = new Error("Unique constraint failed on the fields: (`userId`)");
          err.code = "P2002";
          throw err;
        }
      }

      const planId = `plan-${Date.now()}-${Math.random()}`;
      const plan = {
        id: planId,
        userId: data.userId,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        status,
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
            targetType: it.targetType || null,
            targetId: it.targetId || null,
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
        if (where?.targetType !== undefined && it.targetType !== where.targetType) return false;
        if (where?.targetId !== undefined && it.targetId !== where.targetId) return false;
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
        if (where.targetType !== undefined && item.targetType !== where.targetType) return false;
        if (where.targetId !== undefined && item.targetId !== where.targetId) return false;
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
        targetType: null,
        targetId: null,
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
  community: {
    findUnique: async ({ where, include }: any) => {
      const comm = mockState.communities.find((c: any) => {
        if (where.id && c.id === where.id) return true;
        if (where.slug && c.slug === where.slug) return true;
        return false;
      });
      if (!comm) return null;
      const res = { ...comm };
      if (include?.university) {
        res.university = mockState.universities.find((u: any) => u.id === comm.universityId) || null;
      }
      if (include?.campus) {
        res.campus = mockState.campuses.find((c: any) => c.id === comm.campusId) || null;
      }
      if (include?.department) {
        res.department = mockState.departments.find((d: any) => d.id === comm.departmentId) || null;
      }
      if (include?.creator) {
        res.creator = mockState.users.find((u: any) => u.id === comm.createdByUserId) || null;
      }
      if (include?._count?.select?.members) {
        res._count = {
          members: mockState.communityMembers.filter((m: any) => m.communityId === comm.id && m.status === "ACTIVE").length,
        };
      }
      return res;
    },
    findFirst: async ({ where, include }: any) => {
      const comm = mockState.communities.find((c: any) => {
        if (where?.id && c.id !== where.id) return false;
        if (where?.slug && c.slug !== where.slug) return false;
        if (where?.universityId && c.universityId !== where.universityId) return false;
        if (where?.campusId && c.campusId !== where.campusId) return false;
        if (where?.departmentId && c.departmentId !== where.departmentId) return false;
        if (where?.moderationStatus && typeof where.moderationStatus === "string" && c.moderationStatus !== where.moderationStatus) return false;
        if (where?.moderationStatus?.not && c.moderationStatus === where.moderationStatus.not) return false;
        return true;
      });
      if (!comm) return null;
      const res = { ...comm };
      if (include?.university) {
        res.university = mockState.universities.find((u: any) => u.id === comm.universityId) || null;
      }
      if (include?.campus) {
        res.campus = mockState.campuses.find((c: any) => c.id === comm.campusId) || null;
      }
      if (include?.department) {
        res.department = mockState.departments.find((d: any) => d.id === comm.departmentId) || null;
      }
      return res;
    },
    findMany: async ({ where, include, select, orderBy, take, skip }: any) => {
      let list = mockState.communities.filter((c: any) => {
        if (where?.universityId && c.universityId !== where.universityId) return false;
        if (where?.campusId && c.campusId !== where.campusId) return false;
        if (where?.departmentId && c.departmentId !== where.departmentId) return false;
        if (where?.type && c.type !== where.type) return false;
        if (where?.scope && c.scope !== where.scope) return false;
        if (where?.visibility && c.visibility !== where.visibility) return false;
        if (where?.isVerified !== undefined && c.isVerified !== where.isVerified) return false;
        if (where?.moderationStatus && typeof where.moderationStatus === "string" && c.moderationStatus !== where.moderationStatus) return false;
        if (where?.moderationStatus?.not && c.moderationStatus === where.moderationStatus.not) return false;
        if (where?.id?.in && !where.id.in.includes(c.id)) return false;
        if (where?.id?.not && c.id === where.id.not) return false;
        if (where?.AND && Array.isArray(where.AND)) {
          const matchesAnd = where.AND.every((clause: any) => {
            if (clause.OR && Array.isArray(clause.OR)) {
              return clause.OR.some((sub: any) => {
                if (sub.visibility) {
                  if (sub.visibility === "PUBLIC" && c.visibility === "PUBLIC") return true;
                  if (sub.visibility === "CAMPUS_ONLY" && c.visibility === "CAMPUS_ONLY" && (!sub.campusId || c.campusId === sub.campusId)) return true;
                  if (sub.visibility === "PRIVATE" && c.visibility === "PRIVATE" && sub.id?.in && sub.id.in.includes(c.id)) return true;
                  return false;
                }
                if (sub.name?.contains) {
                  const q = sub.name.contains.toLowerCase();
                  return (c.name || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q) || (c.courseCode || "").toLowerCase().includes(q);
                }
                if (sub.description?.contains) {
                  const q = sub.description.contains.toLowerCase();
                  return (c.description || "").toLowerCase().includes(q);
                }
                if (sub.courseCode?.contains) {
                  const q = sub.courseCode.contains.toLowerCase();
                  return (c.courseCode || "").toLowerCase().includes(q);
                }
                return true;
              });
            }
            return true;
          });
          if (!matchesAnd) return false;
        }
        if (where?.OR && Array.isArray(where.OR)) {
          const matchesOr = where.OR.some((subWhere: any) => {
            if (subWhere.visibility) {
              if (subWhere.visibility === "PUBLIC" && c.visibility === "PUBLIC") return true;
              if (subWhere.visibility === "CAMPUS_ONLY" && c.visibility === "CAMPUS_ONLY" && (!subWhere.campusId || c.campusId === subWhere.campusId)) return true;
              if (subWhere.visibility === "PRIVATE" && c.visibility === "PRIVATE" && subWhere.id?.in && subWhere.id.in.includes(c.id)) return true;
              return false;
            }
            if (subWhere.name?.contains) {
              const q = subWhere.name.contains.toLowerCase();
              return (c.name || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q) || (c.courseCode || "").toLowerCase().includes(q);
            }
            if (subWhere.description?.contains) {
              const q = subWhere.description.contains.toLowerCase();
              return (c.description || "").toLowerCase().includes(q);
            }
            if (subWhere.courseCode?.contains) {
              const q = subWhere.courseCode.contains.toLowerCase();
              return (c.courseCode || "").toLowerCase().includes(q);
            }
            return true;
          });
          if (!matchesOr) return false;
        }
        return true;
      });

      if (skip) {
        list = list.slice(skip);
      }
      if (take) {
        list = list.slice(0, take);
      }

      return list.map((c: any) => {
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (key === "university" && select.university) {
              const u = mockState.universities.find((univ: any) => univ.id === c.universityId);
              res.university = u ? { id: u.id, name: u.name, shortName: u.shortName } : null;
            } else if (key === "campus" && select.campus) {
              const cp = mockState.campuses.find((camp: any) => camp.id === c.campusId);
              res.campus = cp ? { id: cp.id, name: cp.name } : null;
            } else if (key === "department" && select.department) {
              const d = mockState.departments.find((dep: any) => dep.id === c.departmentId);
              res.department = d ? { id: d.id, name: d.name } : null;
            } else if (key === "_count") {
              res._count = {
                members: mockState.communityMembers.filter((m: any) => m.communityId === c.id && m.status === "ACTIVE").length,
              };
            } else if (key in c) {
              res[key] = c[key];
            }
          }
          return res;
        }

        const res = { ...c };
        if (include?.university) {
          res.university = mockState.universities.find((u: any) => u.id === c.universityId) || null;
        }
        if (include?.campus) {
          res.campus = mockState.campuses.find((cp: any) => cp.id === c.campusId) || null;
        }
        if (include?.department) {
          res.department = mockState.departments.find((d: any) => d.id === c.departmentId) || null;
        }
        if (include?._count?.select?.members) {
          res._count = {
            members: mockState.communityMembers.filter((m: any) => m.communityId === c.id && m.status === "ACTIVE").length,
          };
        }
        return res;
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `comm-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        description: "",
        avatarUrl: null,
        bannerUrl: null,
        type: "ACADEMIC",
        scope: "UNIVERSITY",
        visibility: "PUBLIC",
        campusId: null,
        departmentId: null,
        isVerified: false,
        moderationStatus: "APPROVED",
        createdByUserId: null,
        courseCode: null,
        maxMembers: 500,
        requiresApproval: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.communities.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const idx = mockState.communities.findIndex((c: any) => {
        if (where.id && c.id === where.id) return true;
        if (where.slug && c.slug === where.slug) return true;
        return false;
      });
      if (idx === -1) throw new Error("Community not found for update");
      Object.assign(mockState.communities[idx], data, { updatedAt: new Date() });
      return mockState.communities[idx];
    },
    delete: async ({ where }: any) => {
      const idx = mockState.communities.findIndex((c: any) => c.id === where.id);
      if (idx === -1) throw new Error("Community not found for delete");
      const [deleted] = mockState.communities.splice(idx, 1);
      // Cascade delete members
      mockState.communityMembers = mockState.communityMembers.filter((m: any) => m.communityId !== where.id);
      return deleted;
    },
    count: async ({ where }: any) => {
      return mockState.communities.filter((c: any) => {
        if (where?.universityId && c.universityId !== where.universityId) return false;
        if (where?.moderationStatus && c.moderationStatus !== where.moderationStatus) return false;
        return true;
      }).length;
    },
  },
  communityMember: {
    findUnique: async ({ where, include, select }: any) => {
      const mem = mockState.communityMembers.find((m: any) => {
        if (where.id && m.id === where.id) return true;
        if (where.communityId_userId) {
          return m.communityId === where.communityId_userId.communityId && m.userId === where.communityId_userId.userId;
        }
        return false;
      });
      if (!mem) return null;
      const res = { ...mem };
      if (include?.user || select?.user) {
        const u = mockState.users.find((usr: any) => usr.id === mem.userId);
        res.user = u
          ? {
              id: u.id,
              name: u.name,
              username: u.username,
              avatarUrl: u.avatarUrl,
              degreeProgram: u.degreeProgram,
              currentSemester: u.currentSemester,
              isPublicProfile: u.isPublicProfile,
              university: u.universityId
                ? mockState.universities.find((univ: any) => univ.id === u.universityId) || null
                : null,
            }
          : null;
      }
      if (include?.community) {
        res.community = mockState.communities.find((c: any) => c.id === mem.communityId) || null;
      }
      return res;
    },
    findFirst: async ({ where, orderBy, include, select }: any) => {
      let list = mockState.communityMembers.filter((m: any) => {
        if (where?.id && m.id !== where.id) return false;
        if (where?.communityId && m.communityId !== where.communityId) return false;
        if (where?.userId) {
          if (typeof where.userId === "string" && m.userId !== where.userId) return false;
          if (where.userId.not && m.userId === where.userId.not) return false;
          if (where.userId.in && !where.userId.in.includes(m.userId)) return false;
        }
        if (where?.role && typeof where.role === "string" && m.role !== where.role) return false;
        if (where?.role?.in && !where.role.in.includes(m.role)) return false;
        if (where?.status && typeof where.status === "string" && m.status !== where.status) return false;
        if (where?.status?.in && !where.status.in.includes(m.status)) return false;
        return true;
      });
      if (orderBy?.createdAt === "asc") {
        list.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (orderBy?.createdAt === "desc") {
        list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      const mem = list[0] || null;
      if (!mem) return null;
      const res = { ...mem };
      if (include?.user || select?.user) {
        const u = mockState.users.find((usr: any) => usr.id === mem.userId);
        res.user = u
          ? {
              id: u.id,
              name: u.name,
              username: u.username,
              avatarUrl: u.avatarUrl,
              degreeProgram: u.degreeProgram,
              currentSemester: u.currentSemester,
              isPublicProfile: u.isPublicProfile,
              university: u.universityId
                ? mockState.universities.find((univ: any) => univ.id === u.universityId) || null
                : null,
            }
          : null;
      }
      return res;
    },
    findMany: async ({ where, include, select, orderBy }: any) => {
      let list = mockState.communityMembers.filter((m: any) => {
        if (where?.communityId) {
          if (typeof where.communityId === "string" && m.communityId !== where.communityId) return false;
          if (where.communityId.in && !where.communityId.in.includes(m.communityId)) return false;
        }
        if (where?.userId) {
          if (typeof where.userId === "string" && m.userId !== where.userId) return false;
          if (where.userId.not && m.userId === where.userId.not) return false;
          if (where.userId.in && !where.userId.in.includes(m.userId)) return false;
        }
        if (where?.role && typeof where.role === "string" && m.role !== where.role) return false;
        if (where?.role?.in && !where.role.in.includes(m.role)) return false;
        if (where?.status && typeof where.status === "string" && m.status !== where.status) return false;
        if (where?.status?.in && !where.status.in.includes(m.status)) return false;
        return true;
      });
      if (orderBy?.createdAt === "asc") {
        list.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      return list.map((m: any) => {
        const res = { ...m };
        if (include?.user || select?.user) {
          const u = mockState.users.find((usr: any) => usr.id === m.userId);
          res.user = u
            ? {
                id: u.id,
                name: u.name,
                username: u.username,
                avatarUrl: u.avatarUrl,
                degreeProgram: u.degreeProgram,
                currentSemester: u.currentSemester,
                isPublicProfile: u.isPublicProfile,
                university: u.universityId
                  ? mockState.universities.find((univ: any) => univ.id === u.universityId) || null
                  : null,
              }
            : null;
        }
        if (include?.community) {
          res.community = mockState.communities.find((c: any) => c.id === m.communityId) || null;
        }
        return res;
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `cm-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        role: "MEMBER",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.communityMembers.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const idx = mockState.communityMembers.findIndex((m: any) => {
        if (where.id && m.id === where.id) return true;
        if (where.communityId_userId) {
          return m.communityId === where.communityId_userId.communityId && m.userId === where.communityId_userId.userId;
        }
        return false;
      });
      if (idx === -1) throw new Error("Member not found for update");
      Object.assign(mockState.communityMembers[idx], data, { updatedAt: new Date() });
      return mockState.communityMembers[idx];
    },
    delete: async ({ where }: any) => {
      const idx = mockState.communityMembers.findIndex((m: any) => {
        if (where.id && m.id === where.id) return true;
        if (where.communityId_userId) {
          return m.communityId === where.communityId_userId.communityId && m.userId === where.communityId_userId.userId;
        }
        return false;
      });
      if (idx === -1) throw new Error("Member not found for delete");
      const [deleted] = mockState.communityMembers.splice(idx, 1);
      return deleted;
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.communityMembers.length;
      mockState.communityMembers = mockState.communityMembers.filter((m: any) => {
        if (where.communityId && m.communityId === where.communityId) return false;
        if (where.userId && m.userId === where.userId) return false;
        return true;
      });
      return { count: initial - mockState.communityMembers.length };
    },
    count: async ({ where }: any) => {
      return mockState.communityMembers.filter((m: any) => {
        if (where?.communityId && m.communityId !== where.communityId) return false;
        if (where?.status && m.status !== where.status) return false;
        return true;
      }).length;
    },
  },
  communityAnnouncement: {
    findUnique: async ({ where }: any) => {
      return mockState.communityAnnouncements.find((a: any) => a.id === where.id) || null;
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.communityAnnouncements.find((a: any) => {
          if (where.id && a.id !== where.id) return false;
          if (where.communityId && a.communityId !== where.communityId) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where, orderBy, take, skip }: any) => {
      let list = mockState.communityAnnouncements.filter((a: any) => {
        if (where?.communityId && a.communityId !== where.communityId) return false;
        if (where?.isPinned !== undefined && a.isPinned !== where.isPinned) return false;
        return true;
      });
      // Sort pinned first, then by createdAt desc
      list.sort((a: any, b: any) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      if (skip) list = list.slice(skip);
      if (take) list = list.slice(0, take);
      return list.map((a: any) => {
        const creator = a.createdByUserId
          ? mockState.users.find((u: any) => u.id === a.createdByUserId)
          : null;
        const comm = a.communityId
          ? mockState.communities.find((c: any) => c.id === a.communityId)
          : null;
        return {
          ...a,
          createdByUser: creator
            ? { id: creator.id, name: creator.name, avatarUrl: creator.avatarUrl }
            : null,
          community: comm
            ? { id: comm.id, name: comm.name, slug: comm.slug, isVerified: comm.isVerified }
            : null,
        };
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `ann-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.communityAnnouncements.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const a = mockState.communityAnnouncements.find((item: any) => item.id === where.id);
      if (!a) throw new Error("Announcement not found");
      Object.assign(a, data, { updatedAt: new Date() });
      return a;
    },
    delete: async ({ where }: any) => {
      const idx = mockState.communityAnnouncements.findIndex((item: any) => item.id === where.id);
      if (idx === -1) throw new Error("Announcement not found");
      const [deleted] = mockState.communityAnnouncements.splice(idx, 1);
      return deleted;
    },
    count: async ({ where }: any) => {
      return mockState.communityAnnouncements.filter((a: any) => {
        if (where?.communityId && a.communityId !== where.communityId) return false;
        if (where?.isPinned !== undefined && a.isPinned !== where.isPinned) return false;
        return true;
      }).length;
    },
  },
  communityEvent: {
    findUnique: async ({ where }: any) => {
      return mockState.communityEvents.find((e: any) => e.id === where.id) || null;
    },
    findFirst: async ({ where }: any) => {
      const e = mockState.communityEvents.find((item: any) => {
        if (where?.id && item.id !== where.id) return false;
        if (where?.communityId && item.communityId !== where.communityId) return false;
        if (where?.status && item.status !== where.status) return false;
        if (where?.startAt?.gte && new Date(item.startAt) < new Date(where.startAt.gte)) return false;
        return true;
      });
      if (!e) return null;
      const comm = e.communityId
        ? mockState.communities.find((c: any) => c.id === e.communityId)
        : null;
      const attendees = mockState.communityEventAttendees.filter((a: any) => a.eventId === e.id);
      return {
        ...e,
        community: comm ? { id: comm.id, name: comm.name, slug: comm.slug, isVerified: comm.isVerified } : null,
        attendees,
      };
    },
    findMany: async ({ where, orderBy, take, skip }: any) => {
      let list = mockState.communityEvents.filter((e: any) => {
        if (where?.communityId && e.communityId !== where.communityId) return false;
        if (where?.status && e.status !== where.status) return false;
        if (where?.startAt?.gte && new Date(e.startAt) < new Date(where.startAt.gte)) return false;
        if (where?.startAt?.lt && new Date(e.startAt) >= new Date(where.startAt.lt)) return false;
        return true;
      });
      list.sort((a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      if (skip) list = list.slice(skip);
      if (take) list = list.slice(0, take);
      return list.map((e: any) => {
        const creator = e.createdByUserId
          ? mockState.users.find((u: any) => u.id === e.createdByUserId)
          : null;
        const goingCount = mockState.communityEventAttendees.filter(
          (att: any) => att.eventId === e.id && att.status === "GOING"
        ).length;
        const comm = e.communityId
          ? mockState.communities.find((c: any) => c.id === e.communityId)
          : null;
        return {
          ...e,
          createdByUser: creator
            ? { id: creator.id, name: creator.name, avatarUrl: creator.avatarUrl }
            : null,
          community: comm
            ? { id: comm.id, name: comm.name, slug: comm.slug, isVerified: comm.isVerified }
            : null,
          _count: {
            attendees: goingCount,
          },
        };
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `event-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: "SCHEDULED",
        timezone: "Asia/Karachi",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.communityEvents.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const e = mockState.communityEvents.find((item: any) => item.id === where.id);
      if (!e) throw new Error("Event not found");
      Object.assign(e, data, { updatedAt: new Date() });
      return e;
    },
    delete: async ({ where }: any) => {
      const idx = mockState.communityEvents.findIndex((item: any) => item.id === where.id);
      if (idx === -1) throw new Error("Event not found");
      const [deleted] = mockState.communityEvents.splice(idx, 1);
      return deleted;
    },
    count: async ({ where }: any) => {
      return mockState.communityEvents.filter((e: any) => {
        if (where?.communityId && e.communityId !== where.communityId) return false;
        if (where?.status && e.status !== where.status) return false;
        return true;
      }).length;
    },
  },
  communityEventAttendee: {
    findUnique: async ({ where }: any) => {
      if (where.eventId_userId) {
        return (
          mockState.communityEventAttendees.find(
            (a: any) => a.eventId === where.eventId_userId.eventId && a.userId === where.eventId_userId.userId
          ) || null
        );
      }
      return mockState.communityEventAttendees.find((a: any) => a.id === where.id) || null;
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.communityEventAttendees.find((a: any) => {
          if (where.eventId && a.eventId !== where.eventId) return false;
          if (where.userId && a.userId !== where.userId) return false;
          if (where.status && a.status !== where.status) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where, select, include }: any) => {
      let list = mockState.communityEventAttendees.filter((a: any) => {
        if (where?.eventId && a.eventId !== where.eventId) return false;
        if (where?.userId && a.userId !== where.userId) return false;
        if (where?.status && typeof where.status === "string" && a.status !== where.status) return false;
        if (where?.status?.in && !where.status.in.includes(a.status)) return false;
        return true;
      });
      return list.map((a: any) => {
        const u = mockState.users.find((usr: any) => usr.id === a.userId);
        return {
          ...a,
          user: u
            ? {
                id: u.id,
                name: u.name,
                username: u.username,
                avatarUrl: u.avatarUrl,
                degreeProgram: u.isPublicProfile ? u.degreeProgram : null,
                currentSemester: u.isPublicProfile ? u.currentSemester : null,
                isPublicProfile: Boolean(u.isPublicProfile),
                university: u.universityId
                  ? mockState.universities.find((univ: any) => univ.id === u.universityId) || null
                  : null,
              }
            : null,
        };
      });
    },
    upsert: async ({ where, create, update }: any) => {
      const idx = mockState.communityEventAttendees.findIndex(
        (a: any) => a.eventId === where.eventId_userId.eventId && a.userId === where.eventId_userId.userId
      );
      if (idx >= 0) {
        Object.assign(mockState.communityEventAttendees[idx], update, { updatedAt: new Date() });
        return mockState.communityEventAttendees[idx];
      } else {
        const record = {
          id: `att-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          status: "GOING",
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        mockState.communityEventAttendees.push(record);
        return record;
      }
    },
    count: async ({ where }: any) => {
      return mockState.communityEventAttendees.filter((a: any) => {
        if (where?.eventId && a.eventId !== where.eventId) return false;
        if (where?.status && a.status !== where.status) return false;
        if (where?.NOT?.userId && a.userId === where.NOT.userId) return false;
        return true;
      }).length;
    },
  },
  communityResource: {
    findUnique: async ({ where }: any) => {
      return mockState.communityResources.find((r: any) => r.id === where.id) || null;
    },
    findFirst: async ({ where }: any) => {
      const r = mockState.communityResources.find((item: any) => {
        if (where?.id && item.id !== where.id) return false;
        if (where?.communityId && item.communityId !== where.communityId) return false;
        return true;
      });
      if (!r) return null;
      const comm = r.communityId
        ? mockState.communities.find((c: any) => c.id === r.communityId)
        : null;
      return {
        ...r,
        community: comm ? { id: comm.id, name: comm.name, slug: comm.slug } : null,
      };
    },
    findMany: async ({ where }: any) => {
      let list = mockState.communityResources.filter((r: any) => {
        if (where?.communityId && r.communityId !== where.communityId) return false;
        if (where?.type && r.type !== where.type) return false;
        return true;
      });
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list.map((r: any) => {
        const creator = r.createdByUserId
          ? mockState.users.find((u: any) => u.id === r.createdByUserId)
          : null;
        const comm = r.communityId
          ? mockState.communities.find((c: any) => c.id === r.communityId)
          : null;
        return {
          ...r,
          createdByUser: creator
            ? { id: creator.id, name: creator.name, avatarUrl: creator.avatarUrl }
            : null,
          community: comm
            ? { id: comm.id, name: comm.name, slug: comm.slug, isVerified: comm.isVerified }
            : null,
        };
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `res-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type: "LINK",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.communityResources.push(record);
      return record;
    },
    delete: async ({ where }: any) => {
      const idx = mockState.communityResources.findIndex((item: any) => item.id === where.id);
      if (idx === -1) throw new Error("Resource not found");
      const [deleted] = mockState.communityResources.splice(idx, 1);
      return deleted;
    },
    count: async ({ where }: any) => {
      return mockState.communityResources.filter((r: any) => {
        if (where?.communityId && r.communityId !== where.communityId) return false;
        return true;
      }).length;
    },
  },
  communityReport: {
    findUnique: async ({ where }: any) => {
      return mockState.communityReports.find((rep: any) => rep.id === where.id) || null;
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.communityReports.find((rep: any) => {
          if (where.id && rep.id !== where.id) return false;
          if (where.communityId && rep.communityId !== where.communityId) return false;
          if (where.reporterUserId && rep.reporterUserId !== where.reporterUserId) return false;
          if (where.targetType && rep.targetType !== where.targetType) return false;
          if (where.targetId && rep.targetId !== where.targetId) return false;
          if (where.status && rep.status !== where.status) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where }: any) => {
      let list = mockState.communityReports.filter((rep: any) => {
        if (where?.communityId && rep.communityId !== where.communityId) return false;
        if (where?.status && rep.status !== where.status) return false;
        return true;
      });
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list.map((rep: any) => {
        const reporter = mockState.users.find((u: any) => u.id === rep.reporterUserId);
        const resolver = rep.resolvedByUserId
          ? mockState.users.find((u: any) => u.id === rep.resolvedByUserId)
          : null;
        return {
          ...rep,
          reporterUser: reporter
            ? { id: reporter.id, name: reporter.name, username: reporter.username, avatarUrl: reporter.avatarUrl }
            : null,
          resolvedByUser: resolver
            ? { id: resolver.id, name: resolver.name, username: resolver.username }
            : null,
        };
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `rep-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.communityReports.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const rep = mockState.communityReports.find((item: any) => item.id === where.id);
      if (!rep) throw new Error("Report not found");
      Object.assign(rep, data, { updatedAt: new Date() });
      return rep;
    },
    count: async ({ where }: any) => {
      return mockState.communityReports.filter((rep: any) => {
        if (where?.communityId && rep.communityId !== where.communityId) return false;
        if (where?.status && rep.status !== where.status) return false;
        return true;
      }).length;
    },
  },
  userIntegration: {
    findUnique: async ({ where }: any) => {
      return (
        mockState.userIntegrations.find((item: any) => {
          if (where.id && item.id === where.id) return true;
          if (
            where.userId_provider &&
            item.userId === where.userId_provider.userId &&
            item.provider === where.userId_provider.provider
          ) {
            return true;
          }
          return false;
        }) || null
      );
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.userIntegrations.find((item: any) => {
          if (where.id && item.id !== where.id) return false;
          if (where.userId && item.userId !== where.userId) return false;
          if (where.provider && item.provider !== where.provider) return false;
          if (where.status && item.status !== where.status) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where }: any) => {
      return mockState.userIntegrations.filter((item: any) => {
        if (where?.userId && item.userId !== where.userId) return false;
        if (where?.provider && item.provider !== where.provider) return false;
        if (where?.status && item.status !== where.status) return false;
        return true;
      });
    },
    create: async ({ data }: any) => {
      const record = {
        id: `uint-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: "DISCONNECTED",
        scopes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      mockState.userIntegrations.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const item = mockState.userIntegrations.find((u: any) => {
        if (where.id && u.id === where.id) return true;
        if (
          where.userId_provider &&
          u.userId === where.userId_provider.userId &&
          u.provider === where.userId_provider.provider
        ) {
          return true;
        }
        return false;
      });
      if (!item) throw new Error("UserIntegration not found");
      Object.assign(item, data, { updatedAt: new Date() });
      return item;
    },
    upsert: async ({ where, update, create }: any) => {
      let item = mockState.userIntegrations.find((u: any) => {
        if (where.id && u.id === where.id) return true;
        if (
          where.userId_provider &&
          u.userId === where.userId_provider.userId &&
          u.provider === where.userId_provider.provider
        ) {
          return true;
        }
        return false;
      });
      if (item) {
        Object.assign(item, update, { updatedAt: new Date() });
        return item;
      }
      const record = {
        id: `uint-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: "DISCONNECTED",
        scopes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...create,
      };
      mockState.userIntegrations.push(record);
      return record;
    },
    delete: async ({ where }: any) => {
      const idx = mockState.userIntegrations.findIndex((u: any) => {
        if (where.id && u.id === where.id) return true;
        if (
          where.userId_provider &&
          u.userId === where.userId_provider.userId &&
          u.provider === where.userId_provider.provider
        ) {
          return true;
        }
        return false;
      });
      if (idx !== -1) {
        return mockState.userIntegrations.splice(idx, 1)[0];
      }
      return null;
    },
  },
  externalRecordMapping: {
    findUnique: async ({ where }: any) => {
      return (
        mockState.externalRecordMappings.find((m: any) => {
          if (where.id && m.id === where.id) return true;
          if (where.userId_provider_entityType_externalId) {
            const k = where.userId_provider_entityType_externalId;
            return (
              m.userId === k.userId &&
              m.provider === k.provider &&
              m.entityType === k.entityType &&
              m.externalId === k.externalId
            );
          }
          if (where.userId_provider_entityType_internalId) {
            const k = where.userId_provider_entityType_internalId;
            return (
              m.userId === k.userId &&
              m.provider === k.provider &&
              m.entityType === k.entityType &&
              m.internalId === k.internalId
            );
          }
          return false;
        }) || null
      );
    },
    findFirst: async ({ where }: any) => {
      return (
        mockState.externalRecordMappings.find((m: any) => {
          if (where.userId && m.userId !== where.userId) return false;
          if (where.provider && m.provider !== where.provider) return false;
          if (where.entityType && m.entityType !== where.entityType) return false;
          if (where.internalId && m.internalId !== where.internalId) return false;
          if (where.externalId && m.externalId !== where.externalId) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where }: any) => {
      return mockState.externalRecordMappings.filter((m: any) => {
        if (where?.userId && m.userId !== where.userId) return false;
        if (where?.integrationId && m.integrationId !== where.integrationId) return false;
        if (where?.provider && m.provider !== where.provider) return false;
        if (where?.entityType && m.entityType !== where.entityType) return false;
        return true;
      });
    },
    create: async ({ data }: any) => {
      // Bi-directional uniqueness validation
      const externalExists = mockState.externalRecordMappings.some(
        (m: any) =>
          m.userId === data.userId &&
          m.provider === data.provider &&
          m.entityType === data.entityType &&
          m.externalId === data.externalId
      );
      if (externalExists) {
        throw new Error("Unique constraint violation: externalId already mapped for this user and provider");
      }

      const internalExists = mockState.externalRecordMappings.some(
        (m: any) =>
          m.userId === data.userId &&
          m.provider === data.provider &&
          m.entityType === data.entityType &&
          m.internalId === data.internalId
      );
      if (internalExists) {
        throw new Error("Unique constraint violation: internalId already mapped for this user and provider");
      }

      const record = {
        id: `map-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
        ...data,
      };
      mockState.externalRecordMappings.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const mapping = mockState.externalRecordMappings.find((m: any) => m.id === where.id);
      if (!mapping) throw new Error("Mapping not found");
      Object.assign(mapping, data);
      return mapping;
    },
    delete: async ({ where }: any) => {
      const idx = mockState.externalRecordMappings.findIndex((m: any) => m.id === where.id);
      if (idx !== -1) {
        return mockState.externalRecordMappings.splice(idx, 1)[0];
      }
      return null;
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.externalRecordMappings.length;
      mockState.externalRecordMappings = mockState.externalRecordMappings.filter((m: any) => {
        if (where?.userId && m.userId === where.userId) return false;
        if (where?.integrationId && m.integrationId === where.integrationId) return false;
        return true;
      });
      return { count: initial - mockState.externalRecordMappings.length };
    },
  },
  oAuthTransaction: {
    findUnique: async ({ where }: any) => {
      return (
        mockState.oauthTransactions.find((tx: any) => {
          if (where.state && tx.state === where.state) return true;
          if (where.id && tx.id === where.id) return true;
          return false;
        }) || null
      );
    },
    create: async ({ data }: any) => {
      const record = {
        id: `oatx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        createdAt: new Date(),
        ...data,
      };
      mockState.oauthTransactions.push(record);
      return record;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const tx of mockState.oauthTransactions) {
        if (where.state && tx.state !== where.state) continue;
        if (where.consumedAt === null && tx.consumedAt !== null) continue;
        if (where.expiresAt?.gt && tx.expiresAt <= where.expiresAt.gt) continue;
        Object.assign(tx, data);
        count++;
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      const initial = mockState.oauthTransactions.length;
      mockState.oauthTransactions = mockState.oauthTransactions.filter((tx: any) => {
        if (where?.userId && tx.userId === where.userId) return false;
        if (where?.expiresAt?.lt && tx.expiresAt < where.expiresAt.lt) return false;
        return true;
      });
      return { count: initial - mockState.oauthTransactions.length };
    },
  },
  emailVerificationChallenge: {
    findFirst: async ({ where, orderBy }: any) => {
      let matches = mockState.emailVerificationChallenges.filter((ch: any) => {
        if (where?.userId && ch.userId !== where.userId) return false;
        if (where?.email && ch.email !== where.email) return false;
        if (where?.consumedAt === null && ch.consumedAt !== null) return false;
        if (where?.expiresAt?.gt && ch.expiresAt <= where.expiresAt.gt) return false;
        return true;
      });
      if (orderBy?.createdAt === "desc") {
        matches.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return matches[0] || null;
    },
    create: async ({ data }: any) => {
      const record = {
        id: `evc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        attempts: 0,
        consumedAt: null,
        createdAt: new Date(),
        ...data,
      };
      mockState.emailVerificationChallenges.push(record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const ch = mockState.emailVerificationChallenges.find((item: any) => item.id === where.id);
      if (!ch) throw new Error("Challenge not found");
      Object.assign(ch, data);
      return ch;
    },
  },
};

(globalThis as any).prisma = mockPrisma;


