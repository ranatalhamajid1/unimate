import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getAcademicOverview } from "@/app/lib/academic";
import { AcademicsView } from "@/components/academic/academics-view";

export const metadata: Metadata = {
  title: "Academic Performance | UniMate",
  description: "Track your GPA, course grades, and class attendance across all enrolled courses.",
};

export default async function AcademicsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const overview = await getAcademicOverview(session.userId);

  return <AcademicsView overview={overview} />;
}
