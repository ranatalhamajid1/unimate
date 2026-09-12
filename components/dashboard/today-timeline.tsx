import React from "react";
import { BookOpen, Sparkles, MapPin, AlertCircle, Sun } from "lucide-react";
import type { TodayTimelineSlot } from "@/app/lib/today-workspace";

interface TodayTimelineProps {
  schedule: TodayTimelineSlot[];
  dayName: string;
}

export function TodayTimeline({ schedule, dayName }: TodayTimelineProps) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-6 text-center [box-shadow:var(--shadow-xs),var(--specular-top)]">
        <div className="mx-auto w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 border border-indigo-500/20">
          <Sun className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          No classes scheduled for {dayName}
        </h3>
        <p className="text-xs text-[var(--color-text-3)] mt-1 max-w-sm mx-auto">
          Enjoy your open schedule or use this window for self-directed study and assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl p-5 sm:p-6 [box-shadow:var(--shadow-xs),var(--specular-top)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <BookOpen className="h-3.5 w-3.5" />
            </span>
            <span>Schedule & Study Windows</span>
          </h3>
          <p className="text-[11.5px] text-[var(--color-text-3)] mt-0.5">
            Chronological academic timeline for {dayName}
          </p>
        </div>
      </div>

      {/* Spatial Timeline Rail with Thin Connector */}
      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-indigo-500/40 before:via-violet-500/25 before:to-transparent">
        {schedule.map((slot) => {
          const isGap = slot.type === "STUDY_GAP";

          if (isGap) {
            return (
              <div key={slot.id} className="relative group">
                {/* Timeline Node — study gap */}
                <span className="absolute -left-[27px] top-3.5 w-3 h-3 rounded-full border-2 border-emerald-500 bg-[var(--color-surface)] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                <div className="p-3 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 backdrop-blur-xs transition-standard">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="h-3 w-3" />
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {slot.title}
                      </span>
                    </div>
                    <span className="kpi-numeric text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {slot.startTime} – {slot.endTime} ({slot.durationMinutes}m)
                    </span>
                  </div>
                  {slot.suggestedAction && (
                    <p className="text-[11.5px] text-emerald-800/80 dark:text-emerald-200/80 mt-1 pl-6">
                      {slot.suggestedAction}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          const accentColor = slot.color || "#6366f1";

          return (
            <div key={slot.id} className="relative group">
              {/* Timeline Node — course accent dot with luminous halo */}
              <span
                className="absolute -left-[27px] top-4 w-3 h-3 rounded-full border-2 bg-[var(--color-surface)]"
                style={{
                  borderColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}40`,
                }}
              />

              {/* Floating Timeline Object */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/60 backdrop-blur-md spatial-interactive transition-standard hover:border-indigo-500/30 [box-shadow:var(--shadow-xs),var(--specular-top)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <h4 className="text-[13.5px] font-semibold text-[var(--color-text)]">
                        {slot.title}
                      </h4>
                    </div>
                    {slot.subtitle && (
                      <p className="text-[11.5px] text-[var(--color-text-3)] mt-0.5 pl-4">
                        {slot.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="kpi-numeric text-xs font-semibold text-[var(--color-text)]">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    {slot.room && (
                      <div className="flex items-center justify-end gap-1 text-[11px] text-[var(--color-text-3)] mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{slot.room}</span>
                      </div>
                    )}
                  </div>
                </div>

                {slot.hasConflict && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25">
                    <AlertCircle className="h-3 w-3" />
                    <span>Time overlap detected with another class</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
