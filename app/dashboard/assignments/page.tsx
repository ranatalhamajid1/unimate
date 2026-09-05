/**
 * Assignments Page — /dashboard/assignments
 *
 * Protected Server Component.
 * Fetches assignments and user courses strictly scoped to the authenticated user.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getUserAssignments } from "@/app/lib/assignments";
import { getUserCourses } from "@/app/lib/courses";
import { AssignmentsView } from "@/components/assignments/assignments-view";

export const metadata = {
  title: "Assignments — UniMate",
  description: "Manage coursework, projects, and upcoming submission deadlines.",
};

export default async function AssignmentsPage() {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  // 2. Fetch authenticated user's assignments and courses
  const [assignments, courses] = await Promise.all([
    getUserAssignments(session.userId),
    getUserCourses(session.userId),
  ]);

  const courseOptions = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    color: c.color,
  }));

  return (
    <AssignmentsView
      initialAssignments={assignments}
      courses={courseOptions}
    />
  );
}
