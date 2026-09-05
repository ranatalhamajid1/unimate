"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Clock, PlusCircle } from "lucide-react";
import {
  TimetableEntry,
  DAYS_OF_WEEK,
} from "@/app/lib/timetable-definitions";
import { TimetableEntryCard } from "@/components/timetable/timetable-entry-card";
import { TimetableDialog } from "@/components/timetable/timetable-dialog";
import { DeleteTimetableDialog } from "@/components/timetable/delete-timetable-dialog";

type CourseOption = {
  id: string;
  name: string;
  code: string;
  color: string;
};

type TimetableProps = {
  initialEntries: TimetableEntry[];
  courses: CourseOption[];
};

export function TimetableView({ initialEntries, courses }: TimetableProps) {
  const router = useRouter();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimetableEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<TimetableEntry | null>(null);
  const [selectedDayToAdd, setSelectedDayToAdd] = useState<number>(1);

  // Active day for mobile tab view (defaults to today or Monday)
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat. Convert to 1=Mon .. 7=Sun
  const todayDayIndex = (() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
  })();
  const [activeMobileDay, setActiveMobileDay] = useState<number>(todayDayIndex);

  // Handlers
  function handleOpenAdd(day: number = 1) {
    setEntryToEdit(null);
    setSelectedDayToAdd(day);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(entry: TimetableEntry) {
    setEntryToEdit(entry);
    setSelectedDayToAdd(entry.dayOfWeek);
    setIsDialogOpen(true);
  }

  function handleOpenDelete(entry: TimetableEntry) {
    setEntryToDelete(entry);
  }

  function handleSuccess() {
    router.refresh();
  }

  // Group entries by day of week
  const entriesByDay: Record<number, TimetableEntry[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  };

  for (const entry of initialEntries) {
    if (entriesByDay[entry.dayOfWeek]) {
      entriesByDay[entry.dayOfWeek].push(entry);
    }
  }

  const totalClasses = initialEntries.length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
              Timetable
            </h1>
            {totalClasses > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">
                {totalClasses} {totalClasses === 1 ? "class" : "classes"} / week
              </span>
            )}
          </div>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Your weekly university schedule.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd(activeMobileDay)}
          id="add-class-btn"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-sm active:scale-[0.99]"
        >
          <Plus className="h-4 w-4 stroke-[2.25]" />
          Add Class
        </button>
      </div>

      {/* ── Global Empty State (0 classes in the whole week) ─────────── */}
      {totalClasses === 0 ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
            <Calendar className="h-7 w-7" strokeWidth={1.75} />
          </div>

          <h3 className="mt-4 text-[16px] font-semibold text-slate-900">
            Your weekly schedule will appear here.
          </h3>
          <p className="mt-1 max-w-sm text-[13.5px] text-slate-500">
            Add your first class to build your university timetable. Connect lectures and labs with your courses.
          </p>

          <button
            onClick={() => handleOpenAdd(1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        </div>
      ) : (
        <>
          {/* ── Mobile Day-by-Day View (< 1024px) ────────────────────────── */}
          <div className="lg:hidden space-y-4">
            {/* Horizontal Day Tabs Selector (Contained, no page overflow) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = activeMobileDay === day.id;
                const count = entriesByDay[day.id]?.length || 0;
                const isToday = day.id === todayDayIndex;

                return (
                  <button
                    key={day.id}
                    onClick={() => setActiveMobileDay(day.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <span>{day.shortName}</span>
                    {count > 0 && (
                      <span
                        className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    {isToday && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Classes for the Active Mobile Day */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-[15px] font-semibold text-slate-900">
                  {DAYS_OF_WEEK.find((d) => d.id === activeMobileDay)?.name}
                </h3>
                <button
                  onClick={() => handleOpenAdd(activeMobileDay)}
                  className="inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add to {DAYS_OF_WEEK.find((d) => d.id === activeMobileDay)?.shortName}
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {entriesByDay[activeMobileDay]?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                    <p className="mt-2 text-[13px] text-slate-400">
                      No classes scheduled for this day.
                    </p>
                    <button
                      onClick={() => handleOpenAdd(activeMobileDay)}
                      className="mt-3 text-[12.5px] font-medium text-blue-600 hover:underline"
                    >
                      + Add a class
                    </button>
                  </div>
                ) : (
                  entriesByDay[activeMobileDay].map((entry) => (
                    <TimetableEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Desktop Weekly Grid (lg: 1024px+) ────────────────────────── */}
          <div className="hidden lg:grid lg:grid-cols-7 lg:gap-3 items-start">
            {DAYS_OF_WEEK.map((day) => {
              const dayEntries = entriesByDay[day.id] || [];
              const isToday = day.id === todayDayIndex;

              return (
                <div
                  key={day.id}
                  className={`flex flex-col rounded-2xl border bg-white p-3 shadow-xs transition-all ${
                    isToday
                      ? "border-blue-200 ring-1 ring-blue-100 shadow-sm"
                      : "border-slate-100"
                  }`}
                >
                  {/* Column Day Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[13px] font-semibold ${
                          isToday ? "text-blue-600" : "text-slate-800"
                        }`}
                      >
                        {day.shortName}
                      </span>
                      {isToday && (
                        <span className="rounded-md bg-blue-50 px-1 py-0.2 text-[9px] font-semibold text-blue-600 uppercase">
                          Today
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenAdd(day.id)}
                      className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      title={`Add class on ${day.name}`}
                      aria-label={`Add class on ${day.name}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Day's Classes */}
                  <div className="space-y-2.5 min-h-[120px]">
                    {dayEntries.length === 0 ? (
                      <div className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-slate-100 text-center">
                        <span className="text-[11px] text-slate-300">Free day</span>
                      </div>
                    ) : (
                      dayEntries.map((entry) => (
                        <TimetableEntryCard
                          key={entry.id}
                          entry={entry}
                          onEdit={handleOpenEdit}
                          onDelete={handleOpenDelete}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <TimetableDialog
        isOpen={isDialogOpen}
        courses={courses}
        entryToEdit={entryToEdit}
        defaultDay={selectedDayToAdd}
        onClose={() => {
          setIsDialogOpen(false);
          setEntryToEdit(null);
        }}
        onSuccess={handleSuccess}
      />

      <DeleteTimetableDialog
        isOpen={Boolean(entryToDelete)}
        entry={entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
