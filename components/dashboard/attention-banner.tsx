import React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

export interface AttentionItem {
  id: string;
  type: "ATTENDANCE" | "OVERDUE" | "EXAM";
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  severity: "CRITICAL" | "WARNING";
}

interface AttentionBannerProps {
  items: AttentionItem[];
}

export function AttentionBanner({ items }: AttentionBannerProps) {
  if (!items || items.length === 0) {
    return null;
  }

  // Show top 2 highest-severity items
  const displayItems = items.slice(0, 2);

  return (
    <div className="space-y-2.5 mb-6 animate-fade-in" role="region" aria-label="Items requiring immediate attention">
      {displayItems.map((item) => {
        const isCritical = item.severity === "CRITICAL";

        return (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all ${
              isCritical
                ? "bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200"
                : "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`p-1.5 rounded-xl shrink-0 ${
                  isCritical
                    ? "bg-rose-500 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {item.type === "ATTENDANCE" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : item.type === "OVERDUE" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/40 dark:bg-black/20">
                    Needs Attention
                  </span>
                  <p className="text-xs sm:text-sm font-semibold truncate">{item.title}</p>
                </div>
                <p className="text-xs opacity-90 truncate mt-0.5">{item.message}</p>
              </div>
            </div>

            <Link
              href={item.actionHref}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-micro cursor-pointer ${
                isCritical
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              <span>{item.actionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
