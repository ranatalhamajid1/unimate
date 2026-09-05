/**
 * DashboardHeader — the top content header inside the main area.
 * Shows greeting, date, and the interactive NotificationCenter.
 */

import { NotificationCenter } from "@/components/notifications/notification-center";
import { NotificationItem } from "@/app/lib/notification-definitions";

type DashboardHeaderProps = {
  name: string;
  greeting: string;
  dateString: string;
  notifications?: NotificationItem[];
  unreadCount?: number;
};

export function DashboardHeader({
  name,
  greeting,
  dateString,
  notifications = [],
  unreadCount = 0,
}: DashboardHeaderProps) {
  const firstName = name.split(" ")[0];

  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-widest text-[var(--color-text-3)] mb-2">
          {dateString}
        </p>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--color-text)] sm:text-3xl">
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1.5 text-[14.5px] text-[var(--color-text-2)]">
          Here&apos;s what&apos;s happening with your university life today.
        </p>
      </div>

      {/* Desktop Notification Center — hidden on mobile */}
      <div className="hidden lg:block shrink-0">
        <NotificationCenter
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
