import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getWeeklyReview } from "@/app/lib/weekly-review";
import { hasEntitlement } from "@/app/lib/entitlements";
import { WeeklyReviewView } from "@/components/review/weekly-review-view";

export const metadata = {
  title: "Weekly Academic Review | UniMate",
  description: "Comprehensive weekly academic debrief, 4-dimension performance scorecard, and strategic focus recommendations.",
};

export default async function WeeklyReviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isPro = await hasEntitlement(session.userId, "AI_STUDY_PLAN");
  const reviewData = await getWeeklyReview(session.userId, { isPro, weekOffset: -1 });

  return <WeeklyReviewView initialData={reviewData} isPro={isPro} />;
}
