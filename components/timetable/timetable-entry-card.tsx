"use client";

import { Clock, MapPin, Edit2, Trash2, Tag } from "lucide-react";
import { TimetableEntry, formatTimeRange } from "@/app/lib/timetable-definitions";

type TimetableEntryCardProps = {
  entry: TimetableEntry;
  onEdit: (entry: TimetableEntry) => void;
  onDelete: (entry: TimetableEntry) => void;
};

export function TimetableEntryCard({
  entry,
  onEdit,
  onDelete,
}: TimetableEntryCardProps) {
  const courseColor = entry.course?.color || "#2563eb";
  const courseName = entry.course?.name || "Unknown Course";
  const courseCode = entry.course?.code || "";

  return (
    <div
      className="group relative flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-3.5 shadow-xs transition-all duration-150 hover:border-slate-200 hover:shadow-sm"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: courseColor,
      }}
    >
      <div>
        {/* Top: Code & Type badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: `${courseColor}18`,
              color: courseColor,
            }}
          >
            {courseCode}
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            <Tag className="h-2.5 w-2.5 text-slate-400" />
            {entry.type}
          </span>
        </div>

        {/* Course Name */}
        <h4 className="mt-2 text-[13.5px] font-semibold text-slate-900 leading-snug line-clamp-2">
          {courseName}
        </h4>

        {/* Meta: Time & Room */}
        <div className="mt-2.5 space-y-1 text-[12px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium text-slate-700">
              {formatTimeRange(entry.startTime, entry.endTime)}
            </span>
          </div>

          {entry.room ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{entry.room}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 italic">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span>Room TBA</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-50 pt-2 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          title="Edit class"
          aria-label="Edit class"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(entry)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Delete class"
          aria-label="Delete class"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
