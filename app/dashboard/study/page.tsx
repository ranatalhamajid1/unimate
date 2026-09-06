import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getWeeklyStudySummary, getUserStudySessions } from "@/app/lib/study-sessions";
import { getUserCourses } from "@/app/lib/courses";
import { StudyView } from "@/components/study/study-view";

export const metadata = {
  title: "Study Tracking | UniMate",
  description: "Track your focused study hours and weekly consistency.",
};

export default async function StudyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [summary, sessions, courses] = await Promise.all([
    getWeeklyStudySummary(session.userId),
    getUserStudySessions(session.userId, { limit: 50 }),
    getUserCourses(session.userId),
  ]);

  const courseOptions = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    color: c.color,
  }));

  return (
    <StudyView
      summary={summary}
      sessions={sessions}
      courses={courseOptions}
    />
  );
}
