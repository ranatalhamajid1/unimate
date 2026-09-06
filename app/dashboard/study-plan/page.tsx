import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getUserActiveStudyPlan } from "@/app/lib/study-plans";
import { getUserCourses } from "@/app/lib/courses";
import { StudyPlanView } from "@/components/study-plan/study-plan-view";

export const metadata = {
  title: "Study Planner | UniMate",
  description: "Organize your study sessions and generate intelligent daily plans.",
};

export default async function StudyPlanPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [plan, courses] = await Promise.all([
    getUserActiveStudyPlan(session.userId),
    getUserCourses(session.userId),
  ]);

  const courseOptions = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    color: c.color,
  }));

  return <StudyPlanView plan={plan} courses={courseOptions} />;
}
