"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Layers } from "lucide-react";
import { Course } from "@/app/lib/course-definitions";
import { CourseCard } from "@/components/courses/course-card";
import { CourseDialog } from "@/components/courses/course-dialog";
import { DeleteCourseDialog } from "@/components/courses/delete-course-dialog";

type CoursesViewProps = {
  initialCourses: Course[];
};

export function CoursesView({ initialCourses }: CoursesViewProps) {
  const router = useRouter();

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Handlers
  function handleOpenAdd() {
    setCourseToEdit(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(course: Course) {
    setCourseToEdit(course);
    setIsDialogOpen(true);
  }

  function handleOpenDelete(course: Course) {
    setCourseToDelete(course);
  }

  function handleSuccess() {
    router.refresh();
  }

  const totalCredits = initialCourses.reduce((acc, c) => acc + c.creditHours, 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
              Courses
            </h1>
            {initialCourses.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">
                {initialCourses.length} {initialCourses.length === 1 ? "course" : "courses"}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Manage your current semester courses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {initialCourses.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-2 text-[13px] text-slate-600 shadow-xs">
              <Layers className="h-4 w-4 text-slate-400" />
              <span>Total: <strong className="font-semibold text-slate-900">{totalCredits}</strong> Credits</span>
            </div>
          )}

          <button
            onClick={handleOpenAdd}
            id="add-course-btn"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-sm active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 stroke-[2.25]" />
            Add Course
          </button>
        </div>
      </div>

      {/* ── Content: Empty State vs Grid ────────────────────────────────── */}
      {initialCourses.length === 0 ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
            <BookOpen className="h-7 w-7" strokeWidth={1.75} />
          </div>

          <h3 className="mt-4 text-[16px] font-semibold text-slate-900">
            Your courses will appear here.
          </h3>
          <p className="mt-1 max-w-sm text-[13.5px] text-slate-500">
            Add your first course to get started. Track instructors, credit hours, and semester progress.
          </p>

          <button
            onClick={handleOpenAdd}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {initialCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <CourseDialog
        isOpen={isDialogOpen}
        courseToEdit={courseToEdit}
        onClose={() => {
          setIsDialogOpen(false);
          setCourseToEdit(null);
        }}
        onSuccess={handleSuccess}
      />

      <DeleteCourseDialog
        isOpen={Boolean(courseToDelete)}
        course={courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
