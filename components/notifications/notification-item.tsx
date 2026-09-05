"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  AlertCircle,
  Calendar,
  Sparkles,
  Timer,
  AlertTriangle,
  Bell,
  Check,
  Trash2,
  ArrowRight,
} from "lucide-react";
import {
  NotificationItem as NotificationItemType,
  getTypeConfig,
  formatRelativeTime,
  NOTIFICATION_TYPES,
} from "@/app/lib/notification-definitions";
import {
  markNotificationRead,
  deleteNotificationAction,
} from "@/app/actions/notifications";

type NotificationItemProps = {
  notification: NotificationItemType;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
};

export function NotificationItem({
  notification,
  onRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const [isPending, startTransition] = useTransition();
  const config = getTypeConfig(notification.type);

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.ASSIGNMENT_OVERDUE:
        return AlertCircle;
      case NOTIFICATION_TYPES.ASSIGNMENT_DUE_SOON:
        return FileText;
      case NOTIFICATION_TYPES.EXAM_TODAY:
        return Sparkles;
      case NOTIFICATION_TYPES.EXAM_DUE_SOON:
        return Calendar;
      case NOTIFICATION_TYPES.EXAM_PREPARATION:
        return Timer;
      case NOTIFICATION_TYPES.ATTENDANCE_WARNING:
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const IconComponent = getIcon();

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (notification.read || isPending) return;

    onRead?.(notification.id);
    startTransition(async () => {
      await markNotificationRead(notification.id);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    onDelete?.(notification.id);
    startTransition(async () => {
      await deleteNotificationAction(notification.id);
    });
  };

  const handleClickCard = () => {
    if (!notification.read) {
      onRead?.(notification.id);
      startTransition(async () => {
        await markNotificationRead(notification.id);
      });
    }
  };

  return (
    <div
      onClick={handleClickCard}
      className={`group relative rounded-2xl border transition-all duration-150 ${
        notification.read
          ? "border-slate-200/80 bg-white hover:border-slate-300"
          : "border-blue-200/80 bg-blue-50/20 hover:border-blue-300 shadow-xs"
      } ${compact ? "p-3.5" : "p-4 sm:p-5"}`}
    >
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Icon */}
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl border ${
            config.iconBgClass
          } ${compact ? "h-8 w-8" : "h-10 w-10"}`}
        >
          <IconComponent className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-medium ${config.badgeClass}`}
            >
              {config.badgeLabel}
            </span>

            <span className="text-[11.5px] text-slate-400">
              {formatRelativeTime(notification.createdAt)}
            </span>

            {!notification.read && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
            )}
          </div>

          <h3
            className={`text-[14px] leading-snug ${
              notification.read
                ? "font-medium text-slate-800"
                : "font-semibold text-slate-900"
            }`}
          >
            {notification.title}
          </h3>

          <p
            className={`mt-1 leading-relaxed text-slate-600 ${
              compact ? "text-[12.5px] line-clamp-2" : "text-[13.5px]"
            }`}
          >
            {notification.message}
          </p>

          {/* Action Footer */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <Link
              href={config.actionUrl}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {config.actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>

            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <button
                  type="button"
                  onClick={handleMarkAsRead}
                  disabled={isPending}
                  title="Mark as read"
                  aria-label="Mark as read"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                title="Dismiss notification"
                aria-label="Dismiss notification"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
