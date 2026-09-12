/**
 * DashboardHeader — the top content header inside the main area.
 * Shows greeting, date, avatar, university metadata, and profile completion badge.
 */

import { NotificationCenter } from "@/components/notifications/notification-center";
import { NotificationItem } from "@/app/lib/notification-definitions";
import { Building2, ShieldCheck, Command } from "lucide-react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

type DashboardHeaderProps = {
  name: string;
  greeting: string;
  dateString: string;
  notifications?: NotificationItem[];
  unreadCount?: number;
  avatarUrl?: string | null;
  universityName?: string | null;
  universityVerified?: boolean;
  degreeProgram?: string | null;
  currentSemester?: string | null;
  profileCompletionPercentage?: number;
};

export function DashboardHeader({
  name,
  greeting,
  dateString,
  notifications = [],
  unreadCount = 0,
  avatarUrl,
  universityName,
  universityVerified,
  degreeProgram,
  currentSemester,
  profileCompletionPercentage = 100,
}: DashboardHeaderProps) {
  const firstName = name.split(" ")[0];

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        {/* Student Avatar Glass Capsule */}
        <div className="shrink-0 relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name}'s avatar`}
              className="h-14 w-14 rounded-2xl object-cover border border-[var(--color-glass-border)] shadow-xs"
            />
          ) : (
            <div className="relative">
              <AvatarFallback name={name} size="md" className="h-14 w-14 text-base font-semibold rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xs" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--color-surface)] bg-emerald-500" />
            </div>
          )}
        </div>

        <div>
          {/* Quieter secondary metadata strip */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11.5px] font-medium tracking-wide text-[var(--color-text-3)]">
              {dateString}
            </span>

            {/* University Identity Pill with Electric Indigo tint */}
            {universityName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                <Building2 className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                <span className="truncate max-w-[200px]">{universityName}</span>
                {universityVerified && <ShieldCheck className="h-3 w-3 text-indigo-500" />}
              </span>
            )}

            {currentSemester && (
              <span className="rounded-full border border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase text-[var(--color-text-2)]">
                {currentSemester}
              </span>
            )}

            {profileCompletionPercentage < 100 && (
              <a
                href="/dashboard/settings"
                title="Complete remaining profile checkpoints"
                className="rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{profileCompletionPercentage}% Profile</span>
                <span className="opacity-70">· Complete</span>
              </a>
            )}
          </div>

          {/* Visually dominant greeting */}
          <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-[var(--color-text)]">
            {greeting}, {firstName}
          </h1>

          <p className="mt-0.5 text-[13px] text-[var(--color-text-2)]">
            {degreeProgram
              ? `${degreeProgram} · Your academic command center for today.`
              : "Your academic command center for today."}
          </p>
        </div>
      </div>

      {/* Header controls: Command palette hint + Notification Center */}
      <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
        {/* Command palette hint */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/80 backdrop-blur-md text-xs text-[var(--color-text-3)] shadow-xs">
          <span className="text-[11.5px] font-medium">Command</span>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-mono border border-[var(--color-border)] text-[var(--color-text-2)]">
            ⌘K
          </kbd>
        </div>

        {/* Desktop Notification Center */}
        <div className="hidden lg:block shrink-0">
          <NotificationCenter
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
        </div>
      </div>
    </div>
  );
}
