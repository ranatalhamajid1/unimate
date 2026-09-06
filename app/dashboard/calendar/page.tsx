import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getMonthCalendarEvents } from "@/app/lib/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata = {
  title: "Academic Calendar | UniMate",
  description: "Unified university calendar with classes, assignments, exams, and study sessions.",
};

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const calendarData = await getMonthCalendarEvents(session.userId);

  return <CalendarView initialData={calendarData} />;
}
