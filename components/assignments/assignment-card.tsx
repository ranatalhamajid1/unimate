"use client";

import { Calendar, Edit2, Trash2, AlertCircle } from "lucide-react";
import {
  Assignment,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  AssignmentStatus,
  AssignmentPriority,
  formatDueLabel,
} from "@/app/lib/assignment-definitions";

type AssignmentCardProps = {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
};

export function AssignmentCard({
  assignment,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const courseColor = assignment.course?.color || "#2563eb";
  const courseName = assignment.course?.name || "Course";
  const courseCode = assignment.course?.code || "";

  const statusInfo =
    STATUS_CONFIG[assignment.status as AssignmentStatus] ||
    STATUS_CONFIG.NOT_STARTED;
  const priorityInfo =
    PRIORITY_CONFIG[assignment.priority as AssignmentPriority] ||
    PRIORITY_CONFIG.MEDIUM;

  const dueInfo = formatDueLabel(
    new Date(assignment.dueDate),
    assignment.status
  );

  return (
    <div
      className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: courseColor,
      }}
    >
      <div>
        {/* Top: Course Info + Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${courseColor}20`,
                color: courseColor,
              }}
            >
              {courseCode || "General"}
            </span>
            <span className="text-[12px] text-[var(--color-text-3)] font-medium truncate max-w-[150px]">
              {courseName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Priority Badge */}
            <span
              className={`rounded-lg px-2 py-0.5 text-[10.5px] font-medium ${priorityInfo.badgeClass}`}
            >
              {priorityInfo.label}
            </span>

            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10.5px] font-medium ${statusInfo.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3.5 text-[16px] font-semibold text-[var(--color-text)] leading-snug">
          {assignment.title}
        </h3>

        {/* Optional Description */}
        {assignment.description && (
          <p className="mt-1.5 text-[13px] text-[var(--color-text-2)] leading-relaxed line-clamp-2">
            {assignment.description}
          </p>
        )}

        {/* Meta: Due Date */}
        <div className="mt-4 flex items-center gap-2 text-[12.5px]">
          {dueInfo.isOverdue ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-md">
              <AlertCircle className="h-3.5 w-3.5" />
              {dueInfo.text}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-text-2)] font-medium">
              <Calendar className="h-3.5 w-3.5 text-[var(--color-text-3)]" />
              {dueInfo.text}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3.5">
        <button
          onClick={() => onEdit(assignment)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-2)] transition-colors hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          onClick={() => onDelete(assignment)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-3)] transition-colors hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
