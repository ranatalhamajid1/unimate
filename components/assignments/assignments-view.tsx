"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  SearchX,
} from "lucide-react";
import {
  Assignment,
  ASSIGNMENT_STATUSES,
  isAssignmentDueThisWeek,
} from "@/app/lib/assignment-definitions";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { AssignmentDialog } from "@/components/assignments/assignment-dialog";
import { DeleteAssignmentDialog } from "@/components/assignments/delete-assignment-dialog";
import { AssignmentFilters } from "@/components/assignments/assignment-filters";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type AssignmentsViewProps = {
  initialAssignments: Assignment[];
  courses: CourseOption[];
};

export function AssignmentsView({
  initialAssignments,
  courses,
}: AssignmentsViewProps) {
  const router = useRouter();

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  // Summary Metrics
  const totalCount = initialAssignments.length;
  const inProgressCount = initialAssignments.filter(
    (a) => a.status === ASSIGNMENT_STATUSES.IN_PROGRESS
  ).length;
  const completedCount = initialAssignments.filter(
    (a) => a.status === ASSIGNMENT_STATUSES.COMPLETED
  ).length;
  const dueThisWeekCount = initialAssignments.filter((a) =>
    isAssignmentDueThisWeek(new Date(a.dueDate), a.status)
  ).length;

  // Filtered List
  const filteredAssignments = useMemo(() => {
    return initialAssignments.filter((a) => {
      // Status filter
      if (statusFilter !== "ALL" && a.status !== statusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== "ALL" && a.priority !== priorityFilter) {
        return false;
      }
      // Course filter
      if (courseFilter !== "ALL" && a.courseId !== courseFilter) {
        return false;
      }
      return true;
    });
  }, [initialAssignments, statusFilter, priorityFilter, courseFilter]);

  function handleOpenAdd() {
    setAssignmentToEdit(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(assignment: Assignment) {
    setAssignmentToEdit(assignment);
    setIsDialogOpen(true);
  }

  function handleOpenDelete(assignment: Assignment) {
    setAssignmentToDelete(assignment);
  }

  function handleSuccess() {
    router.refresh();
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
            Assignments
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Stay on top of your coursework and deadlines.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          id="add-assignment-btn"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-sm active:scale-[0.99]"
        >
          <Plus className="h-4 w-4 stroke-[2.25]" />
          Add Assignment
        </button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">
              Total Assignments
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <FileText className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-slate-900">
            {totalCount}
          </p>
        </div>

        {/* Due This Week */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">
              Due This Week
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-amber-700">
            {dueThisWeekCount}
          </p>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">
              In Progress
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-blue-700">
            {inProgressCount}
          </p>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">
              Completed
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-emerald-700">
            {completedCount}
          </p>
        </div>
      </div>

      {/* ── Filters Bar ─────────────────────────────────────────────── */}
      {totalCount > 0 && (
        <AssignmentFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          courseFilter={courseFilter}
          onCourseChange={setCourseFilter}
          courses={courses}
        />
      )}

      {/* ── Main Content: Empty States vs Grid ──────────────────────── */}
      {totalCount === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
            <FileText className="h-7 w-7" strokeWidth={1.75} />
          </div>

          <h3 className="mt-4 text-[16px] font-semibold text-slate-900">
            No assignments yet.
          </h3>
          <p className="mt-1 max-w-sm text-[13.5px] text-slate-500">
            Add coursework, lab reports, and projects to keep track of upcoming deadlines.
          </p>

          <button
            onClick={handleOpenAdd}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
          <SearchX className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
          <h3 className="mt-3 text-[15px] font-semibold text-slate-800">
            No assignments match the selected filters
          </h3>
          <p className="mt-1 text-[13px] text-slate-500">
            Try resetting your status, priority, or course filter.
          </p>
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setPriorityFilter("ALL");
              setCourseFilter("ALL");
            }}
            className="mt-4 text-[13px] font-medium text-blue-600 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AssignmentDialog
        isOpen={isDialogOpen}
        courses={courses}
        assignmentToEdit={assignmentToEdit}
        onClose={() => {
          setIsDialogOpen(false);
          setAssignmentToEdit(null);
        }}
        onSuccess={handleSuccess}
      />

      <DeleteAssignmentDialog
        isOpen={Boolean(assignmentToDelete)}
        assignment={assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
