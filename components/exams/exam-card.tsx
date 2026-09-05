"use client";

import { Calendar, Clock, MapPin, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import {
  Exam,
  EXAM_TYPE_CONFIG,
  ExamType,
  formatCountdown,
  formatExamDate,
  formatExamTime,
} from "@/app/lib/exam-definitions";

type ExamCardProps = {
  exam: Exam;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
};

export function ExamCard({ exam, onEdit, onDelete }: ExamCardProps) {
  const courseColor = exam.course?.color || "#2563eb";
  const courseName = exam.course?.name || "Course";
  const courseCode = exam.course?.code || "";

  const typeConfig =
    EXAM_TYPE_CONFIG[exam.type as ExamType] || EXAM_TYPE_CONFIG.FINAL;

  const countdown = formatCountdown(new Date(exam.examDate), exam.status);
  const formattedDate = formatExamDate(new Date(exam.examDate));
  const formattedTime = formatExamTime(new Date(exam.examDate));

  return (
    <div
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-200 hover:shadow-md"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: courseColor,
      }}
    >
      <div>
        {/* Top: Course code + Countdown badge + Type */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${courseColor}15`,
                color: courseColor,
              }}
            >
              {courseCode || "General"}
            </span>
            <span className="text-[12px] text-slate-400 font-medium truncate max-w-[140px]">
              {courseName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Type badge */}
            <span
              className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-medium ${typeConfig.badgeClass}`}
            >
              {typeConfig.label}
            </span>

            {/* Countdown / Status badge */}
            {countdown.isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </span>
            ) : (
              <span
                className={`rounded-lg px-2 py-0.5 text-[10.5px] font-semibold ${
                  countdown.isUrgent
                    ? "bg-red-50 text-red-700 border border-red-200/60"
                    : "bg-blue-50 text-blue-700 border border-blue-200/60"
                }`}
              >
                {countdown.text}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3.5 text-[16px] font-semibold text-slate-900 leading-snug">
          {exam.title}
        </h3>

        {/* Meta Info: Date, Time, Room */}
        <div className="mt-3.5 space-y-1.5 text-[12.5px] text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium text-slate-700">{formattedDate}</span>
            <span className="text-slate-300">·</span>
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{formattedTime}</span>
          </div>

          {exam.room ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{exam.room}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 italic">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span>Room TBA</span>
            </div>
          )}
        </div>

        {/* Preparation Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-slate-500 font-medium">Preparation</span>
            <span className="font-semibold text-slate-800">
              {exam.preparationProgress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                exam.preparationProgress >= 80
                  ? "bg-emerald-500"
                  : exam.preparationProgress >= 50
                    ? "bg-blue-600"
                    : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, exam.preparationProgress))}%` }}
            />
          </div>
        </div>

        {/* Optional notes */}
        {exam.notes && (
          <p className="mt-2 text-[12px] text-slate-400 italic line-clamp-1">
            &ldquo;{exam.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          onClick={() => onEdit(exam)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:text-blue-600"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          onClick={() => onDelete(exam)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-400 transition-colors hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
