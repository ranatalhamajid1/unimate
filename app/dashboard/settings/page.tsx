/**
 * Settings page — /dashboard/settings
 *
 * Profile overview + current plan status + theme control + logout.
 */

import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/app/lib/entitlements";
import { SettingsClient } from "@/components/settings/settings-client";

export const metadata = {
  title: "Settings — UniMate",
  description: "Manage your UniMate account settings, appearance, and preferences.",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const subscription = await getUserSubscription(session.userId);

  return (
    <SettingsClient
      name={session.name}
      email={session.email}
      plan={subscription.plan}
      isPro={subscription.isPro}
    />
  );
}
