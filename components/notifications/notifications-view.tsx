"use client";

import { useState, useTransition } from "react";
import {
  CheckCheck,
  Inbox,
  Calendar,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  NotificationItem as NotificationItemType,
  NOTIFICATION_FILTERS,
  NotificationFilter,
  NOTIFICATION_TYPES,
} from "@/app/lib/notification-definitions";
import { NotificationItem } from "./notification-item";
import { markAllNotificationsRead } from "@/app/actions/notifications";

type NotificationsViewProps = {
  initialNotifications: NotificationItemType[];
  initialUnreadCount: number;
};

export function NotificationsView({
  initialNotifications,
  initialUnreadCount,
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [currentFilter, setCurrentFilter] = useState<NotificationFilter>(
    NOTIFICATION_FILTERS.ALL
  );
  const [isPending, startTransition] = useTransition();

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
      prev.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date() } : n
      )
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

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (currentFilter === NOTIFICATION_FILTERS.UNREAD) return !n.read;
    if (currentFilter === NOTIFICATION_FILTERS.ASSIGNMENTS) {
      return (
        n.type === NOTIFICATION_TYPES.ASSIGNMENT_DUE_SOON ||
        n.type === NOTIFICATION_TYPES.ASSIGNMENT_OVERDUE
      );
    }
    if (currentFilter === NOTIFICATION_FILTERS.EXAMS) {
      return (
        n.type === NOTIFICATION_TYPES.EXAM_DUE_SOON ||
        n.type === NOTIFICATION_TYPES.EXAM_TODAY ||
        n.type === NOTIFICATION_TYPES.EXAM_PREPARATION
      );
    }
    if (currentFilter === NOTIFICATION_FILTERS.ATTENDANCE) {
      return n.type === NOTIFICATION_TYPES.ATTENDANCE_WARNING;
    }
    return true;
  });

  // Filter counts
  const unreadFilterCount = notifications.filter((n) => !n.read).length;
  const assignmentsFilterCount = notifications.filter(
    (n) =>
      n.type === NOTIFICATION_TYPES.ASSIGNMENT_DUE_SOON ||
      n.type === NOTIFICATION_TYPES.ASSIGNMENT_OVERDUE
  ).length;
  const examsFilterCount = notifications.filter(
    (n) =>
      n.type === NOTIFICATION_TYPES.EXAM_DUE_SOON ||
      n.type === NOTIFICATION_TYPES.EXAM_TODAY ||
      n.type === NOTIFICATION_TYPES.EXAM_PREPARATION
  ).length;
  const attendanceFilterCount = notifications.filter(
    (n) => n.type === NOTIFICATION_TYPES.ATTENDANCE_WARNING
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--color-text)] sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-blue-700 dark:text-blue-400">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-[var(--color-text-2)]">
            Stay on top of your academic schedule, deadlines, and attendance.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-2)] shadow-xs transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* ── Filter Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCurrentFilter(NOTIFICATION_FILTERS.ALL)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors shrink-0 ${
            currentFilter === NOTIFICATION_FILTERS.ALL
              ? "bg-slate-900 dark:bg-blue-600 text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
          }`}
        >
          <span>All</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
              currentFilter === NOTIFICATION_FILTERS.ALL
                ? "bg-slate-800 dark:bg-blue-700 text-slate-200 dark:text-white"
                : "bg-slate-100 dark:bg-slate-800 text-[var(--color-text-2)]"
            }`}
          >
            {notifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentFilter(NOTIFICATION_FILTERS.UNREAD)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors shrink-0 ${
            currentFilter === NOTIFICATION_FILTERS.UNREAD
              ? "bg-blue-600 text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
          }`}
        >
          <span>Unread</span>
          {unreadFilterCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                currentFilter === NOTIFICATION_FILTERS.UNREAD
                  ? "bg-blue-700 text-white"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
              }`}
            >
              {unreadFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentFilter(NOTIFICATION_FILTERS.ASSIGNMENTS)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors shrink-0 ${
            currentFilter === NOTIFICATION_FILTERS.ASSIGNMENTS
              ? "bg-slate-900 dark:bg-blue-600 text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Assignments</span>
          {assignmentsFilterCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                currentFilter === NOTIFICATION_FILTERS.ASSIGNMENTS
                  ? "bg-slate-800 dark:bg-blue-700 text-slate-200 dark:text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-[var(--color-text-2)]"
              }`}
            >
              {assignmentsFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentFilter(NOTIFICATION_FILTERS.EXAMS)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors shrink-0 ${
            currentFilter === NOTIFICATION_FILTERS.EXAMS
              ? "bg-slate-900 dark:bg-blue-600 text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Exams</span>
          {examsFilterCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                currentFilter === NOTIFICATION_FILTERS.EXAMS
                  ? "bg-slate-800 dark:bg-blue-700 text-slate-200 dark:text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-[var(--color-text-2)]"
              }`}
            >
              {examsFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentFilter(NOTIFICATION_FILTERS.ATTENDANCE)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors shrink-0 ${
            currentFilter === NOTIFICATION_FILTERS.ATTENDANCE
              ? "bg-slate-900 dark:bg-blue-600 text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Attendance</span>
          {attendanceFilterCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                currentFilter === NOTIFICATION_FILTERS.ATTENDANCE
                  ? "bg-slate-800 dark:bg-blue-700 text-slate-200 dark:text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-[var(--color-text-2)]"
              }`}
            >
              {attendanceFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Notification List ─────────────────────────────────── */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text-3)] mb-3">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
              {currentFilter === NOTIFICATION_FILTERS.UNREAD
                ? "No unread notifications"
                : currentFilter === NOTIFICATION_FILTERS.ASSIGNMENTS
                ? "No assignment alerts"
                : currentFilter === NOTIFICATION_FILTERS.EXAMS
                ? "No exam reminders"
                : currentFilter === NOTIFICATION_FILTERS.ATTENDANCE
                ? "No attendance warnings"
                : "No notifications yet"}
            </h3>
            <p className="mt-1 text-[13px] text-[var(--color-text-2)] max-w-sm mx-auto">
              {currentFilter === NOTIFICATION_FILTERS.UNREAD
                ? "You have reviewed all your academic alerts and reminders."
                : "When deadlines or exam dates approach, alerts will automatically appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleItemRead}
              onDelete={handleItemDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
