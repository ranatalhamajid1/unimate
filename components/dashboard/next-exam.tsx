/**
 * NextExam — prominent exam countdown card.
 * Connected to live database with graceful empty state.
 */

import Link from "next/link";
import { Timer, BookMarked, ArrowRight } from "lucide-react";

export type NextExamData = {
  id: string;
  courseName: string;
  courseCode: string;
  courseColor?: string;
  title: string;
  type: string;
  date: string;
  time: string;
  room?: string;
  countdown: string;
  daysRemaining: number;
  preparationProgress: number;
};

type NextExamProps = {
  exam?: NextExamData | null;
};

export function NextExam({ exam }: NextExamProps) {
  if (!exam) {
    return (
      <div className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-blue-500" />
            <h2 className="text-[14px] font-semibold text-slate-900">Next exam</h2>
          </div>
          <Link
            href="/dashboard/exams"
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/70 text-blue-600">
            <Timer className="h-5 w-5" />
          </div>
          <p className="text-[13.5px] font-semibold text-slate-800">No upcoming exams.</p>
          <p className="mt-1 max-w-[200px] text-[12px] text-slate-500">
            Stay prepared by scheduling your upcoming midterms and finals.
          </p>
          <Link
            href="/dashboard/exams"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Add an exam
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  const prep = Math.min(100, Math.max(0, exam.preparationProgress || 0));

  return (
    <div className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-blue-500" />
          <h2 className="text-[14px] font-semibold text-slate-900">Next exam</h2>
        </div>
        <Link
          href="/dashboard/exams"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </div>

      {/* Exam info */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
            {exam.courseCode}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
            {exam.type}
          </span>
        </div>
        <p className="text-[15px] font-semibold text-slate-900 leading-snug">{exam.courseName}</p>
        <p className="mt-0.5 text-[13px] text-slate-700 font-medium">{exam.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-slate-500">
          <span>{exam.date} · {exam.time}</span>
          {exam.room ? <span>• Room {exam.room}</span> : null}
        </div>
      </div>

      {/* Countdown pill */}
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5">
        <span className="text-[13px] font-semibold text-white">
          {exam.countdown}
        </span>
      </div>

      {/* Preparation progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
            <BookMarked className="h-3.5 w-3.5 text-slate-400" />
            Preparation
          </span>
          <span className="text-[12px] font-semibold text-blue-700">
            {prep}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${prep}%` }}
          />
        </div>
      </div>
    </div>
  );
}
