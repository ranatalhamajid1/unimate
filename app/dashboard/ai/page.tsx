/**
 * AI Study Buddy Page — /dashboard/ai
 *
 * Protected Server Component.
 * Session guard authenticates the student and loads the interactive AI assistant.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { getDailyAiUsage } from "@/app/lib/ai-limits";
import { StudyBuddyView } from "@/components/study-buddy/study-buddy-view";

export const metadata = {
  title: "AI Study Buddy — UniMate",
  description: "Personalized AI academic assistant connected to your university data.",
};

export default async function AIStudyBuddyPage(props: {
  searchParams?: Promise<{ prompt?: string }>;
}) {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const [user, quota] = await Promise.all([
    prisma.user
      .findUnique({
        where: { id: session.userId },
        select: { name: true },
      })
      .catch(() => null),
    getDailyAiUsage(session.userId),
  ]);

  const studentName = user?.name || session.name || "Student";

  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const initialPrompt = searchParams?.prompt;

  return (
    <div className="space-y-4">
      <StudyBuddyView
        studentName={studentName}
        initialPrompt={initialPrompt}
        initialQuota={{
          currentCount: quota.currentCount,
          limit: quota.limit,
          remaining: quota.remaining,
          plan: quota.plan,
        }}
      />
    </div>
  );
}
