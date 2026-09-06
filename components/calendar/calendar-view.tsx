"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  FileText,
  Timer,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  CalendarEvent,
  CalendarEventType,
  MonthCalendarData,
} from "@/app/lib/calendar";

type Props = {
  initialData: MonthCalendarData;
};

export function CalendarView({ initialData }: Props) {
  const [currentYear, setCurrentYear] = useState(initialData.year);
  const [currentMonth, setCurrentMonth] = useState(initialData.month); // 0-indexed
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"MONTH" | "AGENDA">("MONTH");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  }

  // Calculate calendar grid days for currentMonth
  const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1)).getUTCDay();
  // Adjust so Monday = 0 ... Sunday = 6
  const startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

  const calendarDays: Array<{
    dayNumber: number;
    dateKey: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Padding days from previous month
  const prevMonthDays = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarDays.push({
      dayNumber: day,
      dateKey: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarDays.push({
      dayNumber: day,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
    });
  }

  // Padding days for next month
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarDays.push({
      dayNumber: day,
      dateKey: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Filter events
  function filterEvents(events: CalendarEvent[]) {
    if (activeFilter === "ALL") return events;
    return events.filter((e) => e.eventType === activeFilter);
  }

  const selectedDayEvents = filterEvents(initialData.eventsByDate[selectedDate] || []);

  function getBadgeIcon(type: CalendarEventType) {
    switch (type) {
      case "CLASS":
        return <BookOpen className="h-3 w-3" />;
      case "ASSIGNMENT":
        return <FileText className="h-3 w-3" />;
      case "EXAM":
        return <Timer className="h-3 w-3" />;
      case "STUDY":
        return <Layers className="h-3 w-3" />;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
              Academic Calendar
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-3)]">
            Unified schedule combining timetable classes, assignments, exams, and study sessions (Asia/Karachi).
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-[var(--color-text)] min-w-[130px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filter Tabs & View Toggle */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "CLASS", "ASSIGNMENT", "EXAM", "STUDY"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                activeFilter === filter
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {filter === "ALL" ? "All Events" : filter.charAt(0) + filter.slice(1).toLowerCase() + "s"}
            </button>
          ))}
        </div>

        {/* View mode toggle for mobile/desktop */}
        <div className="flex items-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-0.5 sm:hidden">
          <button
            onClick={() => setViewMode("MONTH")}
            className={`flex-1 rounded-lg py-1 text-xs font-semibold ${
              viewMode === "MONTH" ? "bg-blue-500/10 text-blue-600" : "text-[var(--color-text-3)]"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("AGENDA")}
            className={`flex-1 rounded-lg py-1 text-xs font-semibold ${
              viewMode === "AGENDA" ? "bg-blue-500/10 text-blue-600" : "text-[var(--color-text-3)]"
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* Main Layout: Month Grid + Selected Day Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Month Calendar Grid (2 cols on desktop) */}
        <div
          className={`lg:col-span-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs ${
            viewMode === "AGENDA" ? "hidden sm:block" : "block"
          }`}
        >
          {/* Day of week headers */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="text-[11px] font-bold text-[var(--color-text-3)] py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((calDay, idx) => {
              const dayEvents = filterEvents(initialData.eventsByDate[calDay.dateKey] || []);
              const isSelected = selectedDate === calDay.dateKey;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(calDay.dateKey)}
                  className={`min-h-[72px] sm:min-h-[88px] rounded-xl p-1.5 flex flex-col text-left transition-all border ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/40 dark:bg-blue-500/10"
                      : calDay.isToday
                      ? "border-blue-300 dark:border-blue-800 bg-[var(--color-surface)]"
                      : "border-transparent bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)]"
                  } ${!calDay.isCurrentMonth ? "opacity-35" : ""}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] font-bold ${
                        calDay.isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
                          : isSelected
                          ? "text-blue-600 dark:text-blue-400 font-extrabold"
                          : "text-[var(--color-text)]"
                      }`}
                    >
                      {calDay.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9.5px] font-bold text-[var(--color-text-3)]">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny event indicator pills */}
                  <div className="mt-1 space-y-0.5 w-full overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        style={{ backgroundColor: `${ev.courseColor}20`, color: ev.courseColor }}
                        className="truncate rounded px-1 py-0.5 text-[9px] font-semibold"
                      >
                        {ev.courseCode} · {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-[var(--color-text-3)] font-medium pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day / Agenda Detail Panel (1 col on desktop, always visible or toggle on mobile) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text)]">
                  {selectedDate === todayStr ? "Today's Schedule" : "Selected Day"}
                </h2>
                <p className="text-[11px] text-[var(--color-text-3)] mt-0.5">
                  {selectedDate}
                </p>
              </div>
              <span className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold">
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "Event" : "Events"}
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarIcon className="mx-auto h-8 w-8 text-[var(--color-text-3)] opacity-40 mb-2" />
                <p className="text-xs font-semibold text-[var(--color-text-2)]">
                  No events scheduled for this day.
                </p>
                <p className="text-[11px] text-[var(--color-text-3)] mt-1">
                  Enjoy your free time or schedule a study session.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3 transition-all hover:border-[var(--color-border)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            style={{
                              backgroundColor: `${event.courseColor}15`,
                              color: event.courseColor,
                              borderColor: `${event.courseColor}30`,
                            }}
                            className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold"
                          >
                            {getBadgeIcon(event.eventType)}
                            {event.courseCode}
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--color-text-3)]">
                            {event.eventType}
                          </span>
                        </div>
                        <h3 className="mt-1 text-xs font-semibold text-[var(--color-text)]">
                          {event.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-text-3)]">
                          <Clock className="h-3 w-3" />
                          <span>{event.timeStr}</span>
                        </p>
                      </div>

                      <Link
                        href={event.actionUrl}
                        className="rounded-lg p-1 text-[var(--color-text-3)] hover:bg-[var(--color-surface)] hover:text-blue-600 transition-colors shrink-0"
                        aria-label={`View ${event.title}`}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
