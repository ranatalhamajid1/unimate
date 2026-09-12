import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getAcademicOverview } from "@/app/lib/academic";
import { getUserSubscription } from "@/app/lib/entitlements";
import { getStudentAttendanceIntelligence } from "@/app/lib/intelligence/attendance-intel";
import { prisma } from "@/app/lib/prisma";
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

  const [overview, subscription, attendanceIntel, targetGpaGoal] = await Promise.all([
    getAcademicOverview(session.userId),
    getUserSubscription(session.userId),
    getStudentAttendanceIntelligence(session.userId, 0.75),
    prisma.studentGoal.findFirst({
      where: {
        userId: session.userId,
        type: "TARGET_GPA",
        active: true,
      },
      select: { targetValue: true },
    }),
  ]);

  return (
    <AcademicsView
      overview={overview}
      isPro={subscription.isPro}
      targetGpa={targetGpaGoal ? targetGpaGoal.targetValue : null}
      attendanceIntelligence={attendanceIntel}
    />
  );
}
