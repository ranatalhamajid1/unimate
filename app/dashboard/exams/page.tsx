/**
 * Exams Page — /dashboard/exams
 *
 * Protected Server Component.
 * Fetches exams and courses strictly scoped to the authenticated user.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getUserExams } from "@/app/lib/exams";
import { getUserCourses } from "@/app/lib/courses";
import { ExamsView } from "@/components/exams/exams-view";

export const metadata = {
  title: "Exams — UniMate",
  description: "Track midterms, finals, exam locations, and preparation progress.",
};

export default async function ExamsPage() {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  // 2. Fetch authenticated user's exams and courses
  const [exams, courses] = await Promise.all([
    getUserExams(session.userId),
    getUserCourses(session.userId),
  ]);

  const courseOptions = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    color: c.color,
  }));

  return (
    <ExamsView
      initialExams={exams}
      courses={courseOptions}
    />
  );
}
