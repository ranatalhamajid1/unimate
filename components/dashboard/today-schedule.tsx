/**
 * TodaySchedule — today's class list with time indicators.
 *
 * Receives ScheduleClass[] as props. Highlights the current/upcoming class
 * based on the current hour (server-side rendered, so it uses the build-time
 * hour; for live highlighting wire up a client clock later).
 */

import { Clock, FlaskConical, BookOpen } from "lucide-react";
import type { ScheduleClass } from "@/app/lib/dashboard-data";

type Props = { classes: ScheduleClass[]; currentHour: number };

function parseHour(time: string): number {
  const [rawHour, period] = time.split(" ");
  let hour = parseInt(rawHour.split(":")[0], 10);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour;
}

export function TodaySchedule({ classes, currentHour }: Props) {
  // Find the first class that hasn't ended yet
  const upcomingIdx = classes.findIndex(
    (c) => c.type !== "free" && parseHour(c.time) >= currentHour
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-400" />
        <h2 className="text-[14px] font-semibold text-slate-900">
          Today&apos;s schedule
        </h2>
        <span className="ml-auto text-[11.5px] text-slate-400">
          {classes.filter((c) => c.type !== "free").length} classes
        </span>
      </div>

      {/* Class list */}
      {classes.length === 0 ? (
        <div className="py-7 text-center">
          <p className="text-[13px] text-slate-400 font-medium">
            Nothing scheduled today.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
        {classes.map((cls, idx) => {
          const isUpcoming = idx === upcomingIdx;
          const isPast =
            cls.type !== "free" &&
            parseHour(cls.time) < currentHour &&
            idx < upcomingIdx;
          const isFree = cls.type === "free";

          return (
            <li
              key={cls.id}
              className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 transition-all duration-200 ${
                isUpcoming
                  ? "border border-blue-100 bg-blue-50/70"
                  : isPast
                    ? "opacity-40"
                    : isFree
                      ? "border border-dashed border-slate-200 bg-slate-50/50"
                      : "border border-slate-100 bg-slate-50/40"
              }`}
            >
              {/* Time */}
              <span
                className={`w-[68px] shrink-0 text-[12px] tabular-nums ${
                  isUpcoming
                    ? "font-semibold text-blue-700"
                    : "text-slate-400"
                }`}
              >
                {cls.time}
              </span>

              {/* Type icon */}
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  isFree
                    ? "bg-slate-200/60 text-slate-400"
                    : cls.type === "lab"
                      ? "bg-violet-100 text-violet-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {isFree ? (
                  <Clock className="h-3 w-3" />
                ) : cls.type === "lab" ? (
                  <FlaskConical className="h-3 w-3" />
                ) : (
                  <BookOpen className="h-3 w-3" />
                )}
              </span>

              {/* Name + room */}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[13px] font-medium ${
                    isUpcoming ? "text-blue-900" : isFree ? "text-slate-400" : "text-slate-700"
                  }`}
                >
                  {cls.name}
                </p>
                {cls.room && (
                  <p className="text-[11.5px] text-slate-400">{cls.room}</p>
                )}
              </div>

              {/* Badge */}
              {isUpcoming && (
                <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Next
                </span>
              )}
            </li>
          );
        })}
      </ol>
      )}
    </div>
  );
}
