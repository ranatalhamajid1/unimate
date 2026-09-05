/**
 * QuickActions — compact row of quick-action buttons linked to active modules.
 */

import Link from "next/link";
import { FileText, BookOpen, Calendar, Receipt, Zap } from "lucide-react";

const ACTIONS = [
  { id: "add-assignment", label: "Add assignment", Icon: FileText, color: "amber", href: "/dashboard/assignments" },
  { id: "add-exam", label: "Add exam", Icon: BookOpen, color: "blue", href: "/dashboard/exams" },
  { id: "add-class", label: "Add class", Icon: Calendar, color: "emerald", href: "/dashboard/timetable" },
  { id: "track-expense", label: "Track expense", Icon: Receipt, color: "violet", href: "/dashboard/expenses" },
] as const;

const COLOR_MAP: Record<string, string> = {
  amber: "hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 [&_svg]:hover:text-amber-600",
  blue:  "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 [&_svg]:hover:text-blue-600",
  emerald: "hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 [&_svg]:hover:text-emerald-600",
  violet: "hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 [&_svg]:hover:text-violet-600",
};

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-slate-400" />
        <h2 className="text-[14px] font-semibold text-slate-900">
          Quick actions
        </h2>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map(({ id, label, Icon, color, href }) => (
          <Link
            key={id}
            href={href}
            aria-label={label}
            className={`group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3.5 text-[12.5px] font-medium text-slate-600 transition-all duration-200 ${COLOR_MAP[color]}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-200 group-hover:shadow-[0_2px_8px_rgba(15,23,42,0.10)]">
              <Icon className="h-4 w-4 text-slate-400 transition-colors duration-200" />
            </span>
            <span className="text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
