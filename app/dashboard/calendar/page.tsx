import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getMonthCalendarEvents } from "@/app/lib/calendar";
import { getCalendarIntelligence } from "@/app/lib/calendar-intelligence";
import { hasEntitlement } from "@/app/lib/entitlements";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata = {
  title: "Academic Calendar | UniMate",
  description: "Unified university calendar with classes, assignments, exams, and study sessions.",
};

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isPro = await hasEntitlement(session.userId, "AI_STUDY_PLAN");

  const [calendarData, intelligenceData] = await Promise.all([
    getMonthCalendarEvents(session.userId),
    getCalendarIntelligence(session.userId, { isPro }),
  ]);

  return <CalendarView initialData={calendarData} intelligenceData={intelligenceData} isPro={isPro} />;
}
