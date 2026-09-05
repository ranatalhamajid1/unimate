/**
 * Dashboard layout — Server Component.
 *
 * Reads the session on the server, passes name/email into the
 * DashboardShell client component. All child pages inherit this layout.
 * Secondary auth guard: proxy.ts is the primary guard.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell name={session.name} email={session.email}>
      {children}
    </DashboardShell>
  );
}
