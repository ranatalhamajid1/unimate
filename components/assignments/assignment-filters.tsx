"use client";

import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_PRIORITIES,
} from "@/app/lib/assignment-definitions";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type AssignmentFiltersProps = {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  courseFilter: string;
  onCourseChange: (courseId: string) => void;
  courses: CourseOption[];
};

export function AssignmentFilters({
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  courseFilter,
  onCourseChange,
  courses,
}: AssignmentFiltersProps) {
  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: ASSIGNMENT_STATUSES.NOT_STARTED, label: "Not Started" },
    { value: ASSIGNMENT_STATUSES.IN_PROGRESS, label: "In Progress" },
    { value: ASSIGNMENT_STATUSES.COMPLETED, label: "Completed" },
  ];

  const priorityOptions = [
    { value: "ALL", label: "All Priority" },
    { value: ASSIGNMENT_PRIORITIES.HIGH, label: "High" },
    { value: ASSIGNMENT_PRIORITIES.MEDIUM, label: "Medium" },
    { value: ASSIGNMENT_PRIORITIES.LOW, label: "Low" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter Tabs / Buttons */}
      <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
        {statusOptions.map((opt) => {
          const isSelected = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onStatusChange(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all ${
                isSelected
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                  : "text-[var(--color-text-2)] hover:text-[var(--color-text)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Priority Dropdown */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text)] focus:border-blue-600 focus:outline-none shadow-xs"
        aria-label="Filter by priority"
      >
        {priorityOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Course Dropdown Filter (if user has courses) */}
      {courses.length > 0 && (
        <select
          value={courseFilter}
          onChange={(e) => onCourseChange(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text)] focus:border-blue-600 focus:outline-none shadow-xs max-w-[180px] truncate"
          aria-label="Filter by course"
        >
          <option value="ALL">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
