"use client";

import { BookOpen, User, Award, Calendar, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Course } from "@/app/lib/course-definitions";

type CourseCardProps = {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
};

export function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-200 hover:shadow-md">
      {/* Top row: Code badge & actions */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Color dot */}
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: course.color || "#2563eb" }}
              aria-hidden
            />
            {/* Course Code badge */}
            <span
              className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${course.color || "#2563eb"}15`,
                color: course.color || "#2563eb",
              }}
            >
              {course.code}
            </span>
          </div>

          {/* Action menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-80 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
              aria-label="Course actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(course);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  Edit course
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(course);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Course Name */}
        <h3 className="mt-3.5 text-[16px] font-semibold text-slate-900 leading-snug line-clamp-2">
          {course.name}
        </h3>

        {/* Course Meta */}
        <div className="mt-4 space-y-2 text-[13px] text-slate-500">
          {course.instructor ? (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{course.instructor}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 italic">
              <User className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span>No instructor assigned</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Award className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{course.creditHours} {course.creditHours === 1 ? "Credit Hour" : "Credit Hours"}</span>
          </div>

          {course.semester && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{course.semester}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <button
          onClick={() => onEdit(course)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:text-blue-600"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          onClick={() => onDelete(course)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-400 transition-colors hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
