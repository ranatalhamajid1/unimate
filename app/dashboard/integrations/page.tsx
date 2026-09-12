import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { getGoogleCalendarStatus } from "@/app/lib/integrations/google-calendar";
import { IntegrationsView, GoogleCalendarStatusData } from "@/components/integrations/integrations-view";

export const metadata = {
  title: "Integrations — UniMate",
  description: "Connect and synchronize Google Calendar, institutional services, and academic resources.",
};

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect("/login?next=/dashboard/integrations");
  }

  const rawStatus = await getGoogleCalendarStatus(session.userId);

  const initialGoogleStatus: GoogleCalendarStatusData = {
    connected: rawStatus.connected,
    status: rawStatus.status as any,
    email: rawStatus.email,
    calendarId: rawStatus.calendarId,
    lastSyncAt: rawStatus.lastSyncAt ? rawStatus.lastSyncAt.toISOString() : null,
    lastSyncStatus: rawStatus.lastSyncStatus,
    lastError: rawStatus.lastError,
  };

  return (
    <div className="p-6 sm:p-8">
      <IntegrationsView initialGoogleStatus={initialGoogleStatus} />
    </div>
  );
}
