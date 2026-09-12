"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  Lock,
  Calendar,
  Bell,
  FileText,
  ExternalLink,
  MapPin,
  Building2,
  School,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

export type CommunityItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  type: string;
  scope: string;
  visibility: string;
  isVerified: boolean;
  courseCode?: string | null;
  maxMembers: number;
  requiresApproval: boolean;
  createdAt: string;
  university?: { id: string; name: string; shortName?: string | null } | null;
  campus?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  memberCount: number;
  currentUserRole?: string | null;
  currentUserStatus?: string | null;
  isMember?: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  isOnline: boolean;
  meetingUrl?: string | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  community: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    university?: { name: string; shortName?: string | null } | null;
    campus?: { name: string } | null;
  };
  attendeeCount: number;
  currentUserRsvp?: string | null;
  isAttending: boolean;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  community: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  };
  author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    degreeProgram?: string | null;
  };
};

export type ResourceItem = {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  type: string;
  courseCode?: string | null;
  createdAt: string;
  community: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  };
  verifiedDomain: boolean;
  domainName: string | null;
  badgeLabel: string | null;
};

export type CampusIntelligenceSummary = {
  stats: {
    upcomingEventsThisWeek: number;
    newAnnouncementsCount: number;
    newDepartmentResourcesCount: number;
    activeCommunitiesJoinedCount: number;
  };
  highlights: {
    nextEvent: {
      id: string;
      title: string;
      startDate: string;
      communityName: string;
      communitySlug: string;
      isAttending: boolean;
    } | null;
    latestAnnouncement: {
      id: string;
      title: string;
      publishedAt: string;
      communityName: string;
      communitySlug: string;
      isPinned: boolean;
    } | null;
    topResource: {
      id: string;
      title: string;
      url: string;
      communityName: string;
      isVerifiedDomain: boolean;
      courseCode: string | null;
    } | null;
  };
};

interface CommunitiesViewProps {
  userUniversityName?: string | null;
  userCampusName?: string | null;
  userDepartmentName?: string | null;
}

export function CommunitiesView({
  userUniversityName,
  userCampusName,
  userDepartmentName,
}: CommunitiesViewProps) {
  // Content view segment: Communities, Events, Announcements, Resources
  const [contentSection, setContentSection] = useState<
    "communities" | "events" | "announcements" | "resources"
  >("communities");

  // Institutional scope tabs
  const [activeScope, setActiveScope] = useState<
    "university" | "campus" | "department" | "joined" | "explore"
  >("university");

  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Event specific timeline filter
  const [eventTimeline, setEventTimeline] = useState<
    "upcoming" | "today" | "this_week" | "past"
  >("upcoming");

  // Data states
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [intelligence, setIntelligence] = useState<CampusIntelligenceSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State for Community
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("ACADEMIC");
  const [formScope, setFormScope] = useState("UNIVERSITY");
  const [formVisibility, setFormVisibility] = useState("PUBLIC");
  const [formCourseCode, setFormCourseCode] = useState("");
  const [formRequiresApproval, setFormRequiresApproval] = useState(false);

  // Fetch deterministic campus intelligence once on load
  useEffect(() => {
    async function loadIntelligence() {
      try {
        const res = await fetch("/api/discovery/intelligence");
        if (res.ok) {
          const data = await res.json();
          setIntelligence(data.campusIntelligence);
        }
      } catch {
        // Fallback silently if unauthenticated or network error
      }
    }
    loadIntelligence();
  }, []);

  // Fetch active section content
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (contentSection === "communities") {
        const params = new URLSearchParams();
        params.set("tab", activeScope);
        if (selectedType !== "ALL") params.set("type", selectedType);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (verifiedOnly) params.set("verifiedOnly", "true");

        const res = await fetch(`/api/discovery/communities?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load communities");
        setCommunities(data.communities || []);
      } else if (contentSection === "events") {
        const params = new URLSearchParams();
        params.set("scope", activeScope === "explore" ? "all" : activeScope);
        params.set("timeline", eventTimeline);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const res = await fetch(`/api/discovery/events?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load events");
        setEvents(data.events || []);
      } else if (contentSection === "announcements") {
        const params = new URLSearchParams();
        params.set("scope", activeScope === "explore" ? "all" : activeScope);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const res = await fetch(`/api/discovery/announcements?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load announcements");
        setAnnouncements(data.announcements || []);
      } else if (contentSection === "resources") {
        const params = new URLSearchParams();
        params.set("scope", activeScope === "explore" ? "all" : activeScope);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (verifiedOnly) params.set("verifiedDomainOnly", "true");

        const res = await fetch(`/api/discovery/resources?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load resources");
        setResources(data.resources || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contentSection, activeScope, selectedType, verifiedOnly, eventTimeline]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Join action
  const handleJoin = async (community: CommunityItem) => {
    try {
      const res = await fetch(`/api/communities/${community.slug}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to join");
        return;
      }
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === community.id
            ? {
                ...c,
                currentUserStatus: data.status,
                currentUserRole: data.role || "MEMBER",
                isMember: data.status === "ACTIVE",
                memberCount: data.status === "ACTIVE" ? c.memberCount + 1 : c.memberCount,
              }
            : c
        )
      );
    } catch {
      alert("Failed to join community");
    }
  };

  // RSVP toggle for events
  const handleRsvp = async (event: EventItem) => {
    try {
      const newStatus = event.isAttending ? "NOT_GOING" : "GOING";
      const res = await fetch(
        `/api/communities/${event.community.slug}/events/${event.id}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update RSVP");
        return;
      }
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                isAttending: newStatus === "GOING",
                currentUserRsvp: newStatus,
                attendeeCount:
                  newStatus === "GOING"
                    ? e.attendeeCount + 1
                    : Math.max(0, e.attendeeCount - 1),
              }
            : e
        )
      );
    } catch {
      alert("Failed to update RSVP");
    }
  };

  // Create community submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          type: formType,
          scope: formScope,
          visibility: formVisibility,
          courseCode: formCourseCode.trim() || undefined,
          requiresApproval: formRequiresApproval,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create community");

      setIsCreateOpen(false);
      setFormName("");
      setFormDescription("");
      setFormCourseCode("");
      setFormRequiresApproval(false);
      fetchData();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create community");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Campus Intelligence & Discovery
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Student Network 3.0
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Discover verified clubs, campus events, department announcements, and academic resources.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Community
        </button>
      </div>

      {/* Deterministic Campus Intelligence Bar */}
      {intelligence && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="p-3">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Events This Week
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {intelligence.stats.upcomingEventsThisWeek}
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              New Announcements
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {intelligence.stats.newAnnouncementsCount}
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Dept Resources
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {intelligence.stats.newDepartmentResourcesCount}
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Joined Communities
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {intelligence.stats.activeCommunitiesJoinedCount}
            </div>
          </div>
        </div>
      )}

      {/* Content Section Segments (Communities, Events, Announcements, Resources) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <button
          onClick={() => setContentSection("communities")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            contentSection === "communities"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Communities & Clubs
        </button>
        <button
          onClick={() => setContentSection("events")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            contentSection === "events"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Campus Events
        </button>
        <button
          onClick={() => setContentSection("announcements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            contentSection === "announcements"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          Announcements
        </button>
        <button
          onClick={() => setContentSection("resources")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            contentSection === "resources"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          Academic Resources
        </button>
      </div>

      {/* Institutional Scope Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveScope("university")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeScope === "university"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            My University {userUniversityName ? `(${userUniversityName})` : ""}
          </button>
          <button
            onClick={() => setActiveScope("campus")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeScope === "campus"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            My Campus {userCampusName ? `(${userCampusName})` : ""}
          </button>
          <button
            onClick={() => setActiveScope("department")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeScope === "department"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            My Department {userDepartmentName ? `(${userDepartmentName})` : ""}
          </button>
          <button
            onClick={() => setActiveScope("joined")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeScope === "joined"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Joined
          </button>
          <button
            onClick={() => setActiveScope("explore")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeScope === "explore"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Explore Public
          </button>
        </div>

        {/* Timeline options for events */}
        {contentSection === "events" && (
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setEventTimeline("upcoming")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                eventTimeline === "upcoming"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setEventTimeline("today")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                eventTimeline === "today"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setEventTimeline("this_week")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                eventTimeline === "this_week"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setEventTimeline("past")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                eventTimeline === "past"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Past
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${contentSection}...`}
            className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {contentSection === "communities" && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-auto text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-hidden"
            >
              <option value="ALL">All Categories</option>
              <option value="ACADEMIC">Academic</option>
              <option value="STUDY_GROUP">Study Groups</option>
              <option value="TECH">Technology</option>
              <option value="CLUB">Clubs</option>
              <option value="SOCIETY">Societies</option>
              <option value="SPORTS">Sports</option>
              <option value="CAREER">Career & Professional</option>
              <option value="CULTURAL">Cultural</option>
              <option value="OTHER">Other</option>
            </select>
          )}

          {(contentSection === "communities" || contentSection === "resources") && (
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300"
              />
              {contentSection === "communities" ? "Verified Only" : "Recognized Domains Only"}
            </label>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Section Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl bg-neutral-100 dark:bg-neutral-800/50 animate-pulse border border-neutral-200/60 dark:border-neutral-800/60"
            />
          ))}
        </div>
      ) : contentSection === "communities" ? (
        communities.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <Users className="w-12 h-12 text-neutral-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              No communities found
            </h3>
            <p className="text-neutral-500 text-sm max-w-md mx-auto mt-1 mb-6">
              There are currently no active communities matching your selected scope and filters.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Community
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((comm) => (
              <div
                key={comm.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {comm.type.replace("_", " ")}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {comm.scope}
                      </span>
                      {comm.visibility === "PRIVATE" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Lock className="w-2.5 h-2.5" />
                          Private
                        </span>
                      )}
                    </div>

                    {comm.isVerified && (
                      <span
                        title="Verified Community Organization"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/communities/${comm.slug}`}
                    className="block font-bold text-lg text-neutral-900 dark:text-neutral-50 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {comm.name}
                  </Link>

                  {comm.courseCode && (
                    <div className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {comm.courseCode}
                    </div>
                  )}

                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2 line-clamp-2">
                    {comm.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {comm.memberCount} / {comm.maxMembers}
                    </span>
                  </div>

                  {comm.currentUserStatus === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Member
                    </span>
                  ) : comm.currentUserStatus === "PENDING" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Approval
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoin(comm)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold transition cursor-pointer"
                    >
                      {comm.requiresApproval ? "Request to Join" : "Join"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : contentSection === "events" ? (
        events.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              No campus events scheduled
            </h3>
            <p className="text-neutral-500 text-sm max-w-md mx-auto mt-1">
              There are no upcoming events under the selected scope and timeline.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {event.isOnline ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600">
                        Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        In-Person
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    {event.title}
                  </h3>

                  <div className="mt-1 text-xs text-neutral-500 flex items-center gap-1">
                    <span>Host:</span>
                    <Link
                      href={`/dashboard/communities/${event.community.slug}`}
                      className="font-medium hover:underline text-neutral-700 dark:text-neutral-300"
                    >
                      {event.community.name}
                    </Link>
                  </div>

                  <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-3 line-clamp-2">
                    {event.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="text-xs text-neutral-500">
                    {event.attendeeCount} going
                  </div>
                  <button
                    onClick={() => handleRsvp(event)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      event.isAttending
                        ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {event.isAttending ? "Going ✓" : "RSVP"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : contentSection === "announcements" ? (
        announcements.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <Bell className="w-12 h-12 text-neutral-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              No announcements published
            </h3>
            <p className="text-neutral-500 text-sm max-w-md mx-auto mt-1">
              There are no announcements currently published under this scope.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600">
                        Pinned
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">
                      From{" "}
                      <Link
                        href={`/dashboard/communities/${ann.community.slug}`}
                        className="font-medium hover:underline text-neutral-700 dark:text-neutral-300"
                      >
                        {ann.community.name}
                      </Link>
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 mb-2">
                  {ann.title}
                </h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Academic Resources Section */
        resources.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              No academic resources found
            </h3>
            <p className="text-neutral-500 text-sm max-w-md mx-auto mt-1">
              There are no shared study guides or academic resources matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <div
                key={res.id}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {res.type}
                    </span>
                    {res.verifiedDomain && (
                      <span
                        title={res.badgeLabel || "Recognized Academic Source"}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Verified Domain
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    {res.title}
                  </h3>

                  {res.courseCode && (
                    <div className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {res.courseCode}
                    </div>
                  )}

                  <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-2 line-clamp-2">
                    {res.description || res.domainName || res.url}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    By {res.community.name}
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition"
                  >
                    Visit Link
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Create New Community
            </h2>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Community Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. ACM Student Chapter"
                  className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What is this community about?"
                  className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="STUDY_GROUP">Study Group</option>
                    <option value="TECH">Technology</option>
                    <option value="CLUB">Club</option>
                    <option value="SOCIETY">Society</option>
                    <option value="SPORTS">Sports</option>
                    <option value="CAREER">Career</option>
                    <option value="CULTURAL">Cultural</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Scope
                  </label>
                  <select
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="UNIVERSITY">My University</option>
                    <option value="CAMPUS">My Campus</option>
                    <option value="DEPARTMENT">My Department</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Visibility
                  </label>
                  <select
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="CAMPUS_ONLY">Campus Only</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formCourseCode}
                    onChange={(e) => setFormCourseCode(e.target.value)}
                    placeholder="e.g. CS101"
                    className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequiresApproval}
                    onChange={(e) => setFormRequiresApproval(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  Require admin approval to join
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
