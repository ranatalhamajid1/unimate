/**
 * Courses Page — /dashboard/courses
 *
 * Protected Server Component.
 * Fetches courses strictly scoped to the authenticated user from PostgreSQL via Prisma.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getUserCourses } from "@/app/lib/courses";
import { CoursesView } from "@/components/courses/courses-view";

export const metadata = {
  title: "Courses — UniMate",
  description: "Manage your university courses, instructors, and credit hours.",
};

export default async function CoursesPage() {
  // 1. Verify session (secondary server guard, layout.tsx and proxy.ts are primary)
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  // 2. Fetch authenticated user's courses ONLY
  const courses = await getUserCourses(session.userId);

  return <CoursesView initialCourses={courses} />;
}
