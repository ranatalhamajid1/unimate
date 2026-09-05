"use client";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type ExamFiltersProps = {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  courseFilter: string;
  onCourseChange: (courseId: string) => void;
  courses: CourseOption[];
};

export function ExamFilters({
  statusFilter,
  onStatusChange,
  courseFilter,
  onCourseChange,
  courses,
}: ExamFiltersProps) {
  const statusOptions = [
    { value: "ALL", label: "All Exams" },
    { value: "UPCOMING", label: "Upcoming" },
    { value: "COMPLETED", label: "Completed" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter Tabs */}
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

      {/* Course Filter Dropdown (if user has courses) */}
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
