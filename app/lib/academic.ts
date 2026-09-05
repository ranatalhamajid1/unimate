import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  AcademicOverview,
  CourseAcademicItem,
  calculateGPA,
  calculateOverallAttendance,
  calculateCoursePercentage,
  getAttendanceStatus,
  getGradePoints,
} from "@/app/lib/academic-definitions";

/**
 * Fetch all grades for a user.
 */
export async function getUserGrades(userId: string) {
  try {
    return await prisma.courseGrade.findMany({
      where: { userId },
      include: { course: true },
    });
  } catch (error) {
    console.error("Database error in getUserGrades:", error);
    return [];
  }
}

/**
 * Fetch all attendance records for a user.
 */
export async function getUserAttendance(userId: string) {
  try {
    return await prisma.attendance.findMany({
      where: { userId },
      include: { course: true },
    });
  } catch (error) {
    console.error("Database error in getUserAttendance:", error);
    return [];
  }
}

/**
 * Fetch complete academic performance overview for a user.
 * Joins user courses with their 1-to-1 grade and attendance records,
 * and calculates weighted GPA and overall weighted attendance.
 */
export async function getAcademicOverview(userId: string): Promise<AcademicOverview> {
  try {
    const courses = await prisma.course.findMany({
      where: { userId },
      include: {
        grades: true,
        attendance: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const items: CourseAcademicItem[] = courses.map((c) => {
      const gradeRecord = c.grades[0] || null;
      const attendanceRecord = c.attendance[0] || null;

      const totalClasses = attendanceRecord ? attendanceRecord.totalClasses : 0;
      const attendedClasses = attendanceRecord ? attendanceRecord.attendedClasses : 0;
      const pct = attendanceRecord && totalClasses > 0
        ? calculateCoursePercentage(attendedClasses, totalClasses)
        : null;

      return {
        courseId: c.id,
        courseName: c.name,
        courseCode: c.code,
        creditHours: c.creditHours,
        semester: c.semester,
        color: c.color,

        gradeId: gradeRecord?.id,
        grade: gradeRecord?.grade ?? null,
        gradePoints: gradeRecord?.gradePoints ?? null,

        attendanceId: attendanceRecord?.id,
        totalClasses,
        attendedClasses,
        attendancePercentage: pct,
        attendanceStatus: getAttendanceStatus(pct),
      };
    });

    const gpaResult = calculateGPA(
      items.map((i) => ({
        creditHours: i.creditHours,
        gradePoints: i.gradePoints,
      }))
    );

    const attendanceRecords = items
      .filter((i) => i.attendanceId !== undefined && i.totalClasses > 0)
      .map((i) => ({
        totalClasses: i.totalClasses,
        attendedClasses: i.attendedClasses,
      }));

    const attendanceResult = calculateOverallAttendance(attendanceRecords);

    return {
      gpa: gpaResult.gpa,
      gpaString: gpaResult.gpaString,
      gpaSub: gpaResult.gpa !== null ? "Cumulative GPA" : "No grades added",
      overallAttendance: attendanceResult.percentage,
      attendanceString: attendanceResult.percentageString,
      attendanceSub: attendanceResult.percentage !== null ? "Overall attendance" : "No attendance added",
      attendanceStatus: attendanceResult.status,
      totalCredits: gpaResult.totalCredits,
      gradedCredits: gpaResult.gradedCredits,
      coursesCount: items.length,
      gradedCoursesCount: gpaResult.coursesWithGradesCount,
      courses: items,
    };
  } catch (error) {
    console.error("Database error in getAcademicOverview:", error);
    return {
      gpa: null,
      gpaString: "—",
      gpaSub: "No grades added",
      overallAttendance: null,
      attendanceString: "—",
      attendanceSub: "No attendance added",
      attendanceStatus: getAttendanceStatus(null),
      totalCredits: 0,
      gradedCredits: 0,
      coursesCount: 0,
      gradedCoursesCount: 0,
      courses: [],
    };
  }
}

/**
 * Fetch academic data for a single course.
 */
export async function getCourseAcademicData(userId: string, courseId: string) {
  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      include: {
        grades: true,
        attendance: true,
      },
    });

    if (!course) return null;

    const gradeRecord = course.grades[0] || null;
    const attendanceRecord = course.attendance[0] || null;

    return {
      course,
      grade: gradeRecord,
      attendance: attendanceRecord,
    };
  } catch (error) {
    console.error("Database error in getCourseAcademicData:", error);
    return null;
  }
}

/**
 * Upsert a grade for a course owned by the user.
 */
export async function upsertCourseGrade(userId: string, courseId: string, grade: string) {
  const gradePoints = getGradePoints(grade);

  return await prisma.courseGrade.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {
      grade,
      gradePoints,
    },
    create: {
      userId,
      courseId,
      grade,
      gradePoints,
    },
  });
}

/**
 * Upsert attendance for a course owned by the user.
 */
export async function upsertAttendance(
  userId: string,
  courseId: string,
  totalClasses: number,
  attendedClasses: number
) {
  return await prisma.attendance.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {
      totalClasses,
      attendedClasses,
    },
    create: {
      userId,
      courseId,
      totalClasses,
      attendedClasses,
    },
  });
}

/**
 * Delete a grade for a course.
 */
export async function deleteCourseGrade(userId: string, courseId: string) {
  return await prisma.courseGrade.deleteMany({
    where: {
      userId,
      courseId,
    },
  });
}

/**
 * Delete attendance for a course.
 */
export async function deleteAttendance(userId: string, courseId: string) {
  return await prisma.attendance.deleteMany({
    where: {
      userId,
      courseId,
    },
  });
}
