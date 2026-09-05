/**
 * Settings page — /dashboard/settings
 *
 * Minimal profile overview + theme control + logout.
 * No password change (not needed for MVP).
 */

import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";

export const metadata = {
  title: "Settings — UniMate",
  description: "Manage your UniMate account settings, appearance, and preferences.",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <SettingsClient name={session.name} email={session.email} />
  );
}
