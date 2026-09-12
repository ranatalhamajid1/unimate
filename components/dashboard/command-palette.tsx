"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Calendar,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Wallet,
  Clock,
  Target,
  GraduationCap,
  Settings,
  Plus,
  ArrowRight,
  X,
  Users,
  Bell,
  FileText,
  ExternalLink,
} from "lucide-react";

interface ActionItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Quick Action" | "Course" | "Assignment" | "Exam" | "Goal" | "Community" | "Event" | "Announcement" | "Resource";
  icon: typeof Search;
  href?: string;
  shortcut?: string;
  isExternal?: boolean;
  perform?: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [discoveryResults, setDiscoveryResults] = useState<ActionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const staticActions: ActionItem[] = [
    // Quick Actions
    {
      id: "new-assignment",
      title: "Add New Assignment",
      subtitle: "Track coursework or homework deadline",
      category: "Quick Action",
      icon: Plus,
      href: "/dashboard/assignments",
    },
    {
      id: "log-study-session",
      title: "Log Study Session",
      subtitle: "Record minutes studied for your courses",
      category: "Quick Action",
      icon: Clock,
      href: "/dashboard/study-sessions",
    },
    {
      id: "run-gpa-simulator",
      title: "Run GPA What-If Simulation",
      subtitle: "Forecast semester grades and target feasibility",
      category: "Quick Action",
      icon: TrendingUp,
      href: "/dashboard/academics",
    },
    {
      id: "new-goal",
      title: "Create Student Goal",
      subtitle: "Set Target GPA or weekly study hours target",
      category: "Quick Action",
      icon: Target,
      href: "/dashboard/goals",
    },
    {
      id: "ask-ai",
      title: "Ask AI Study Buddy",
      subtitle: "Personalized syllabus explanations and summaries",
      category: "Quick Action",
      icon: Sparkles,
      href: "/dashboard/ai-buddy",
    },

    // Navigation
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      subtitle: "Main academic command center",
      category: "Navigation",
      icon: GraduationCap,
      href: "/dashboard",
    },
    {
      id: "nav-communities",
      title: "Campus Network & Communities",
      subtitle: "Discover university clubs, study groups & events",
      category: "Navigation",
      icon: Users,
      href: "/dashboard/communities",
    },
    {
      id: "nav-academics",
      title: "View Academic Standing & GPA",
      subtitle: "Attendance forecasts and GPA analytics",
      category: "Navigation",
      icon: TrendingUp,
      href: "/dashboard/academics",
    },
    {
      id: "nav-timetable",
      title: "View Timetable & Schedule",
      subtitle: "Weekly class schedule and timings",
      category: "Navigation",
      icon: Calendar,
      href: "/dashboard/timetable",
    },
    {
      id: "nav-weekly-review",
      title: "Weekly Academic Review",
      subtitle: "Performance scorecard, study focus volume, and next-week strategy",
      category: "Navigation",
      icon: TrendingUp,
      href: "/dashboard/review",
    },
    {
      id: "nav-assignments",
      title: "View Assignments",
      subtitle: "Upcoming tasks and deadlines",
      category: "Navigation",
      icon: CheckSquare,
      href: "/dashboard/assignments",
    },
    {
      id: "nav-exams",
      title: "View Upcoming Exams",
      subtitle: "Exam countdown and readiness tracking",
      category: "Navigation",
      icon: BookOpen,
      href: "/dashboard/exams",
    },
    {
      id: "nav-expenses",
      title: "View Student Expenses",
      subtitle: "Tuition and personal university expense log",
      category: "Navigation",
      icon: Wallet,
      href: "/dashboard/expenses",
    },
    {
      id: "nav-settings",
      title: "Profile & Settings",
      subtitle: "Student identity, university affiliation & preferences",
      category: "Navigation",
      icon: Settings,
      href: "/dashboard/settings",
    },
    {
      id: "nav-integrations",
      title: "Integration Center",
      subtitle: "Connect and sync Google Calendar, institutional tools, and schedules",
      category: "Navigation",
      icon: Calendar,
      href: "/dashboard/integrations",
    },
  ];

  // Debounced server Universal Search (Personal + Campus)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setDiscoveryResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=3`);
        if (!res.ok) return;
        const data = await res.json();
        const items: ActionItem[] = [];

        // 1. Personal Items
        if (data.personal) {
          // Courses
          for (const c of data.personal.courses || []) {
            items.push({
              id: `personal-course-${c.id}`,
              title: c.title,
              subtitle: `${c.subtitle} · Enrolled Course`,
              category: "Course",
              icon: BookOpen,
              href: c.href,
            });
          }

          // Assignments
          for (const a of data.personal.assignments || []) {
            items.push({
              id: `personal-asgn-${a.id}`,
              title: a.title,
              subtitle: a.subtitle,
              category: "Assignment",
              icon: CheckSquare,
              href: a.href,
            });
          }

          // Exams
          for (const e of data.personal.exams || []) {
            items.push({
              id: `personal-exam-${e.id}`,
              title: e.title,
              subtitle: e.subtitle,
              category: "Exam",
              icon: Calendar,
              href: e.href,
            });
          }

          // Goals
          for (const g of data.personal.goals || []) {
            items.push({
              id: `personal-goal-${g.id}`,
              title: g.title,
              subtitle: g.subtitle,
              category: "Goal",
              icon: Target,
              href: g.href,
            });
          }
        }

        // 2. Campus Network Items
        if (data.campus) {
          // Communities
          for (const c of data.campus.communities || []) {
            items.push({
              id: `comm-${c.id}`,
              title: c.title,
              subtitle: c.subtitle,
              category: "Community",
              icon: Users,
              href: c.href,
            });
          }

          // Events
          for (const e of data.campus.events || []) {
            items.push({
              id: `event-${e.id}`,
              title: e.title,
              subtitle: e.subtitle,
              category: "Event",
              icon: Calendar,
              href: e.href,
            });
          }

          // Announcements
          for (const a of data.campus.announcements || []) {
            items.push({
              id: `ann-${a.id}`,
              title: a.title,
              subtitle: a.subtitle,
              category: "Announcement",
              icon: Bell,
              href: a.href,
            });
          }

          // Resources
          for (const r of data.campus.resources || []) {
            items.push({
              id: `res-${r.id}`,
              title: r.title,
              subtitle: r.subtitle,
              category: "Resource",
              icon: FileText,
              href: r.href,
              isExternal: true,
            });
          }
        }

        setDiscoveryResults(items);
      } catch {
        // Silently fail network error
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Combine static actions and discovery results
  const filteredStatic =
    query.trim() === ""
      ? staticActions
      : staticActions.filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

  const combinedItems = [...discoveryResults, ...filteredStatic];

  // Keyboard shortcut listener (Ctrl/Cmd + K, /, Escape)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === "/" && !isOpen) {
        const activeEl = document.activeElement;
        const isInput =
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            activeEl.tagName === "SELECT" ||
            (activeEl as HTMLElement).isContentEditable ||
            activeEl.getAttribute("role") === "combobox");

        if (!isInput) {
          e.preventDefault();
          setIsOpen(true);
          return;
        }
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setDiscoveryResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (combinedItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % (combinedItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (combinedItems[selectedIndex]) {
        executeAction(combinedItems[selectedIndex]);
      }
    }
  }

  function executeAction(item: ActionItem) {
    setIsOpen(false);
    if (item.perform) {
      item.perform();
    } else if (item.href) {
      if (item.isExternal) {
        window.open(item.href, "_blank", "noopener,noreferrer");
      } else {
        startTransition(() => {
          router.push(item.href!);
        });
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/40 animate-fade-in"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className={[
          "w-full max-w-xl overflow-hidden rounded-2xl",
          // Glass-modal treatment (Layer 4 — floating panel)
          "[background:var(--color-glass-bg)]",
          "[backdrop-filter:blur(24px)]",
          "[-webkit-backdrop-filter:blur(24px)]",
          "[border:1px_solid_var(--color-glass-border)]",
          "[box-shadow:var(--shadow-spatial),var(--specular-top)]",
          // Scale-in entry for premium feel
          "animate-scale-in",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border-subtle)]">
          <Search className="w-5 h-5 text-[var(--color-text-3)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search courses, assignments, exams, campus communities..."
            className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder-[var(--color-text-3)] focus:outline-hidden"
          />
          {isSearching && (
            <span className="text-xs text-[var(--color-text-3)] animate-pulse">Searching...</span>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-micro cursor-pointer"
            aria-label="Close Command Palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Federated Results */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--color-border-subtle)]"
        >
          {combinedItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-text-3)]">
              No matching commands or campus network results found.
            </div>
          ) : (
            <div className="space-y-1">
              {combinedItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => executeAction(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-micro cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[var(--color-surface-2)] text-[var(--color-text-2)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        {item.subtitle && (
                          <div
                            className={`text-xs truncate ${
                              isSelected ? "text-blue-100" : "text-[var(--color-text-3)]"
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10.5px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[var(--color-surface-2)] text-[var(--color-text-3)]"
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.isExternal ? (
                        <ExternalLink
                          className={`w-3.5 h-3.5 ${
                            isSelected ? "text-white" : "text-[var(--color-text-3)]"
                          }`}
                        />
                      ) : (
                        <ArrowRight
                          className={`w-3.5 h-3.5 ${
                            isSelected ? "text-white" : "text-[var(--color-text-3)]"
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between px-4 py-2.5 text-xs text-[var(--color-text-3)] border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/50">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
              ↑↓
            </span>
            <span>to navigate</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] ml-1">
              ↵
            </span>
            <span>to select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
              ESC
            </span>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
