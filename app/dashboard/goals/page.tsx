import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { calculateStudentGoalsProgress } from "@/app/lib/goals";
import { GoalsView } from "@/components/goals/goals-view";

export const metadata = {
  title: "Academic & Study Goals | UniMate",
  description: "Track your GPA, attendance, and weekly study targets.",
};

export default async function GoalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const goals = await calculateStudentGoalsProgress(session.userId);

  return <GoalsView goals={goals} />;
}
