"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ArrowRight, Inbox } from "lucide-react";
import { NotificationItem as NotificationItemType } from "@/app/lib/notification-definitions";
import { NotificationItem } from "./notification-item";
import { markAllNotificationsRead } from "@/app/actions/notifications";

type NotificationCenterProps = {
  initialNotifications: NotificationItemType[];
  initialUnreadCount: number;
};

export function NotificationCenter({
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "ACADEMIC" | "CAMPUS">("ALL");
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.read;
    if (activeTab === "ACADEMIC") {
      return [
        "ASSIGNMENT_DUE_SOON",
        "ASSIGNMENT_OVERDUE",
        "EXAM_DUE_SOON",
        "EXAM_TODAY",
        "EXAM_PREPARATION",
        "ATTENDANCE_WARNING",
      ].includes(n.type);
    }
    if (activeTab === "CAMPUS") {
      return ["COMMUNITY_ANNOUNCEMENT", "COMMUNITY_EVENT", "SYSTEM"].includes(n.type);
    }
    return true;
  });

  // Sync state with props when revalidated
  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  // Handle outside click & escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || isPending) return;

    // Optimistic update
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
    );

    startTransition(async () => {
      await markAllNotificationsRead();
    });
  };

  const handleItemRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleItemDelete = (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (item && !item.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-2)] transition-all duration-150 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus:outline-hidden focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50 duration-150">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] overflow-x-auto scrollbar-none">
            {(["ALL", "UNREAD", "ACADEMIC", "CAMPUS"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-micro cursor-pointer ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                }`}
              >
                {tab === "ALL" ? "All" : tab === "UNREAD" ? "Unread" : tab === "ACADEMIC" ? "Academic" : "Campus"}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/50 text-[var(--color-text-3)] mb-2">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-medium text-[var(--color-text)]">
                  All caught up!
                </p>
                <p className="text-[11.5px] text-[var(--color-text-3)] mt-0.5">
                  {activeTab === "UNREAD" ? "No unread notifications." : "No notifications in this category."}
                </p>
              </div>
            ) : (
              filteredNotifications.slice(0, 6).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleItemRead}
                  onDelete={handleItemDelete}
                  compact
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/50 p-2 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl py-1.5 text-[12.5px] font-semibold text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
            >
              <span>View all notifications</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
