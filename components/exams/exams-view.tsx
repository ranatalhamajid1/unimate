"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Timer,
  Calendar,
  CheckCircle2,
  TrendingUp,
  SearchX,
} from "lucide-react";
import {
  Exam,
  EXAM_STATUSES,
} from "@/app/lib/exam-definitions";
import { ExamCard } from "@/components/exams/exam-card";
import { ExamDialog } from "@/components/exams/exam-dialog";
import { DeleteExamDialog } from "@/components/exams/delete-exam-dialog";
import { ExamFilters } from "@/components/exams/exam-filters";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type ExamsViewProps = {
  initialExams: Exam[];
  courses: CourseOption[];
};

export function ExamsView({ initialExams, courses }: ExamsViewProps) {
  const router = useRouter();

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  // Summary Metrics
  const totalCount = initialExams.length;
  const upcomingCount = initialExams.filter(
    (e) => e.status === EXAM_STATUSES.UPCOMING
  ).length;
  const completedCount = initialExams.filter(
    (e) => e.status === EXAM_STATUSES.COMPLETED
  ).length;

  // This Week count
  const thisWeekCount = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now);
    const day = now.getDay();
    const diffToSunday = day === 0 ? 0 : 7 - day;
    endOfWeek.setDate(now.getDate() + diffToSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    return initialExams.filter((e) => {
      if (e.status === EXAM_STATUSES.COMPLETED) return false;
      const d = new Date(e.examDate);
      return d >= now && d <= endOfWeek;
    }).length;
  }, [initialExams]);

  // Average Preparation
  const avgPreparation = useMemo(() => {
    if (initialExams.length === 0) return 0;
    const total = initialExams.reduce((acc, e) => acc + e.preparationProgress, 0);
    return Math.round(total / initialExams.length);
  }, [initialExams]);

  // Filtered List
  const filteredExams = useMemo(() => {
    return initialExams.filter((e) => {
      // Status filter
      if (statusFilter !== "ALL" && e.status !== statusFilter) {
        return false;
      }
      // Course filter
      if (courseFilter !== "ALL" && e.courseId !== courseFilter) {
        return false;
      }
      return true;
    });
  }, [initialExams, statusFilter, courseFilter]);

  function handleOpenAdd() {
    setExamToEdit(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(exam: Exam) {
    setExamToEdit(exam);
    setIsDialogOpen(true);
  }

  function handleOpenDelete(exam: Exam) {
    setExamToDelete(exam);
  }

  function handleSuccess() {
    router.refresh();
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--color-text)]">
            Exams
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--color-text-2)]">
            Keep track of your exams and prepare with confidence.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          id="add-exam-btn"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-sm active:scale-[0.99]"
        >
          <Plus className="h-4 w-4 stroke-[2.25]" />
          Add Exam
        </button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Upcoming Exams */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[var(--color-text-3)]">
              Upcoming Exams
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Timer className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-[var(--color-text)]">
            {upcomingCount}
          </p>
        </div>

        {/* This Week */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[var(--color-text-3)]">
              This Week
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Calendar className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {thisWeekCount}
          </p>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[var(--color-text-3)]">
              Completed
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </p>
        </div>

        {/* Average Preparation */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[var(--color-text-3)]">
              Avg Preparation
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-violet-600 dark:text-violet-400">
            {avgPreparation}%
          </p>
        </div>
      </div>

      {/* ── Filters Bar ─────────────────────────────────────────────── */}
      {totalCount > 0 && (
        <ExamFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          courseFilter={courseFilter}
          onCourseChange={setCourseFilter}
          courses={courses}
        />
      )}

      {/* ── Main Content: Empty States vs Grid ──────────────────────── */}
      {totalCount === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs">
            <Timer className="h-7 w-7" strokeWidth={1.75} />
          </div>

          <h3 className="mt-4 text-[16px] font-semibold text-[var(--color-text)]">
            No exams scheduled yet.
          </h3>
          <p className="mt-1 max-w-sm text-[13.5px] text-[var(--color-text-2)]">
            Add midterms, finals, and quizzes to track countdowns, rooms, and your study preparation progress.
          </p>

          <button
            onClick={handleOpenAdd}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Exam
          </button>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-xs">
          <SearchX className="h-10 w-10 text-[var(--color-text-3)]" strokeWidth={1.5} />
          <h3 className="mt-3 text-[15px] font-semibold text-[var(--color-text)]">
            No exams match the selected filters
          </h3>
          <p className="mt-1 text-[13px] text-[var(--color-text-2)]">
            Try switching between Upcoming, Completed, or Course filters.
          </p>
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setCourseFilter("ALL");
            }}
            className="mt-4 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <ExamDialog
        isOpen={isDialogOpen}
        courses={courses}
        examToEdit={examToEdit}
        onClose={() => {
          setIsDialogOpen(false);
          setExamToEdit(null);
        }}
        onSuccess={handleSuccess}
      />

      <DeleteExamDialog
        isOpen={Boolean(examToDelete)}
        exam={examToDelete}
        onClose={() => setExamToDelete(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
