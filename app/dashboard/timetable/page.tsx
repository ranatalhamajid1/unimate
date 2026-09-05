/**
 * Timetable Page — /dashboard/timetable
 *
 * Protected Server Component.
 * Fetches timetable entries and courses strictly scoped to the authenticated user.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getUserTimetable } from "@/app/lib/timetable";
import { getUserCourses } from "@/app/lib/courses";
import { TimetableView } from "@/components/timetable/timetable-view";

export const metadata = {
  title: "Timetable — UniMate",
  description: "Your weekly university class schedule.",
};

export default async function TimetablePage() {
  // 1. Verify session
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  // 2. Fetch authenticated user's timetable entries and courses
  const [entries, courses] = await Promise.all([
    getUserTimetable(session.userId),
    getUserCourses(session.userId),
  ]);

  const courseOptions = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    color: c.color,
  }));

  return (
    <TimetableView
      initialEntries={entries}
      courses={courseOptions}
    />
  );
}
