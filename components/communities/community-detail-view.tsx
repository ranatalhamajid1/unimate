"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Lock,
  School,
  Settings,
  UserCheck,
  UserX,
  AlertCircle,
  MoreVertical,
  ShieldAlert,
  Pin,
  Calendar,
  MapPin,
  Video,
  Link as LinkIcon,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  HelpCircle,
  X,
  Flag,
} from "lucide-react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

export type CommunityDetail = {
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

export type CommunityMemberItem = {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
    degreeProgram?: string | null;
    currentSemester?: string | null;
    isPublicProfile: boolean;
    university?: { id: string; name: string; shortName?: string | null } | null;
  };
};

interface CommunityDetailViewProps {
  initialCommunity: CommunityDetail;
  currentUserId: string;
}

export function CommunityDetailView({
  initialCommunity,
  currentUserId,
}: CommunityDetailViewProps) {
  const router = useRouter();
  const [community, setCommunity] = useState<CommunityDetail>(initialCommunity);
  const [activeTab, setActiveTab] = useState<
    "about" | "announcements" | "events" | "resources" | "members" | "pending" | "settings"
  >("announcements");

  const [members, setMembers] = useState<CommunityMemberItem[]>([]);
  const [pendingMembers, setPendingMembers] = useState<CommunityMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState("");
  const [newAnnounceContent, setNewAnnounceContent] = useState("");
  const [newAnnouncePinned, setNewAnnouncePinned] = useState(false);
  const [announceSubmitting, setAnnounceSubmitting] = useState(false);

  // Events State
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventOnline, setNewEventOnline] = useState(false);
  const [newEventUrl, setNewEventUrl] = useState("");
  const [newEventCapacity, setNewEventCapacity] = useState("");

  // Resources State
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceSubmitting, setResourceSubmitting] = useState(false);
  const [newResTitle, setNewResTitle] = useState("");
  const [newResDesc, setNewResDesc] = useState("");
  const [newResUrl, setNewResUrl] = useState("");

  // Universal Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<string>("COMMUNITY");
  const [reportTargetId, setReportTargetId] = useState<string>(community.id);
  const [reportReason, setReportReason] = useState<string>("SPAM");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Settings form state
  const [settingsDescription, setSettingsDescription] = useState(community.description);
  const [settingsCourseCode, setSettingsCourseCode] = useState(community.courseCode || "");
  const [settingsRequiresApproval, setSettingsRequiresApproval] = useState(community.requiresApproval);
  const [settingsMaxMembers, setSettingsMaxMembers] = useState(community.maxMembers);
  const [settingsName, setSettingsName] = useState(community.name);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const isOwner = community.currentUserRole === "OWNER";
  const isAdmin = community.currentUserRole === "ADMIN" || isOwner;
  const isModerator = community.currentUserRole === "MODERATOR" || isAdmin;
  const isActiveMember = community.currentUserStatus === "ACTIVE";

  // Data Fetchers
  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await fetch(`/api/communities/${community.slug}/announcements`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch(`/api/communities/${community.slug}/events?status=${eventFilter}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const res = await fetch(`/api/communities/${community.slug}/resources`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error("Failed to load resources:", err);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await fetch(`/api/communities/${community.slug}/members?status=ACTIVE`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }

      if (isModerator) {
        const pendingRes = await fetch(`/api/communities/${community.slug}/members?status=PENDING`);
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingMembers(pendingData.members || []);
        }
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "announcements") fetchAnnouncements();
    if (activeTab === "events") fetchEvents();
    if (activeTab === "resources") fetchResources();
    if (activeTab === "members" || activeTab === "pending") fetchMembers();
  }, [activeTab, eventFilter]);

  // Join & Leave
  const handleJoin = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/communities/${community.slug}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to join");
        return;
      }
      setCommunity((prev) => ({
        ...prev,
        currentUserStatus: data.status,
        currentUserRole: data.role || "MEMBER",
        isMember: data.status === "ACTIVE",
        memberCount: data.status === "ACTIVE" ? prev.memberCount + 1 : prev.memberCount,
      }));
    } catch (err) {
      alert("Failed to join");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(`Are you sure you want to leave ${community.name}?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/communities/${community.slug}/leave`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to leave");
        return;
      }
      setCommunity((prev) => ({
        ...prev,
        currentUserStatus: null,
        currentUserRole: null,
        isMember: false,
        memberCount: Math.max(0, prev.memberCount - 1),
      }));
    } catch (err) {
      alert("Failed to leave");
    } finally {
      setActionLoading(false);
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceTitle || !newAnnounceContent) return;
    try {
      setAnnounceSubmitting(true);
      const res = await fetch(`/api/communities/${community.slug}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAnnounceTitle,
          content: newAnnounceContent,
          isPinned: newAnnouncePinned,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to post announcement");
        return;
      }
      setShowAnnounceModal(false);
      setNewAnnounceTitle("");
      setNewAnnounceContent("");
      setNewAnnouncePinned(false);
      fetchAnnouncements();
    } catch (err) {
      alert("Error posting announcement");
    } finally {
      setAnnounceSubmitting(false);
    }
  };

  // Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDesc || !newEventStart || !newEventEnd) return;
    try {
      setEventSubmitting(true);
      const res = await fetch(`/api/communities/${community.slug}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDesc,
          startAt: newEventStart,
          endAt: newEventEnd,
          location: newEventLocation || null,
          isOnline: newEventOnline,
          meetingUrl: newEventOnline ? newEventUrl : null,
          capacity: newEventCapacity ? parseInt(newEventCapacity, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to schedule event");
        return;
      }
      setShowEventModal(false);
      setNewEventTitle("");
      setNewEventDesc("");
      setNewEventStart("");
      setNewEventEnd("");
      setNewEventLocation("");
      setNewEventUrl("");
      setNewEventCapacity("");
      fetchEvents();
    } catch (err) {
      alert("Error scheduling event");
    } finally {
      setEventSubmitting(false);
    }
  };

  // RSVP Action
  const handleRSVP = async (eventId: string, status: "GOING" | "MAYBE" | "NOT_GOING") => {
    if (!isActiveMember) {
      alert("You must be an active member to RSVP.");
      return;
    }
    try {
      const res = await fetch(`/api/communities/${community.slug}/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to RSVP");
        return;
      }
      fetchEvents();
    } catch (err) {
      alert("Error submitting RSVP");
    }
  };

  // Add Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle || !newResUrl) return;
    try {
      setResourceSubmitting(true);
      const res = await fetch(`/api/communities/${community.slug}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newResTitle,
          description: newResDesc || null,
          url: newResUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add resource");
        return;
      }
      setShowResourceModal(false);
      setNewResTitle("");
      setNewResDesc("");
      setNewResUrl("");
      fetchResources();
    } catch (err) {
      alert("Error adding resource");
    } finally {
      setResourceSubmitting(false);
    }
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc || reportDesc.length < 5) {
      alert("Please provide at least 5 characters for the description.");
      return;
    }
    try {
      setReportSubmitting(true);
      const res = await fetch(`/api/communities/${community.slug}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: reportTargetType,
          targetId: reportTargetId,
          reason: reportReason,
          description: reportDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit report");
        return;
      }
      alert("Report submitted successfully. Community moderators will review it.");
      setShowReportModal(false);
      setReportDesc("");
    } catch (err) {
      alert("Error submitting report");
    } finally {
      setReportSubmitting(false);
    }
  };

  const openReportModal = (type: string, id: string) => {
    setReportTargetType(type);
    setReportTargetId(id);
    setShowReportModal(true);
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/dashboard/communities"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campus Network
      </Link>

      {/* Community Banner & Overview Card */}
      <div className="relative rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border-b border-neutral-100 dark:border-neutral-800" />

        <div className="p-6 md:p-8 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <AvatarFallback name={community.name} size="lg" className="ring-4 ring-white dark:ring-neutral-900" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    {community.name}
                  </h1>
                  {community.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
                  {community.university && (
                    <span className="inline-flex items-center gap-1">
                      <School className="w-4 h-4" />
                      {community.university.name}
                    </span>
                  )}
                  {community.campus && <span>• {community.campus.name}</span>}
                  {community.department && <span>• {community.department.name}</span>}
                  {community.courseCode && (
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      • {community.courseCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {isModerator && (
                <Link
                  href={`/dashboard/communities/${community.slug}/manage`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Organizer Hub
                </Link>
              )}

              {isActiveMember ? (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-red-50 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
                >
                  Leave
                </button>
              ) : community.currentUserStatus === "PENDING" ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                  Request Pending
                </span>
              ) : community.currentUserStatus === "BANNED" ? (
                <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-600">
                  Suspended
                </span>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {community.requiresApproval ? "Request to Join" : "Join Community"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "announcements"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "events"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          Events
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "resources"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          Resources
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "about"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "members"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          Members ({community.memberCount})
        </button>
      </div>

      {/* Tab: Announcements */}
      {activeTab === "announcements" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Community Announcements
              </h2>
              <p className="text-xs text-neutral-500">
                Official notices and updates from community organizers
              </p>
            </div>

            {isModerator && (
              <button
                onClick={() => setShowAnnounceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Announcement
              </button>
            )}
          </div>

          {loadingAnnouncements ? (
            <div className="py-12 text-center text-sm text-neutral-500">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <Pin className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No announcements posted yet
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                When organizers publish updates, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border transition ${
                    a.isPinned
                      ? "border-blue-500/40 dark:border-blue-500/30 ring-1 ring-blue-500/20 shadow-xs"
                      : "border-neutral-200/80 dark:border-neutral-800 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {a.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                          {a.title}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400">
                        Posted {new Date(a.createdAt).toLocaleDateString()}
                        {a.createdByUser && ` by ${a.createdByUser.name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openReportModal("ANNOUNCEMENT", a.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                        title="Report announcement"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                    {a.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Events */}
      {activeTab === "events" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEventFilter("upcoming")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  eventFilter === "upcoming"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setEventFilter("past")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  eventFilter === "past"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setEventFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  eventFilter === "all"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                All Events
              </button>
            </div>

            {isModerator && (
              <button
                onClick={() => setShowEventModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule Event
              </button>
            )}
          </div>

          {loadingEvents ? (
            <div className="py-12 text-center text-sm text-neutral-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No events found
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Stay tuned for study sessions, workshops, and campus meetups.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {ev.title}
                      </h3>
                      <button
                        onClick={() => openReportModal("EVENT", ev.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                        title="Report event"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{new Date(ev.startAt).toLocaleString()}</span>
                      </div>
                      {ev.isOnline ? (
                        <div className="flex items-center gap-2">
                          <Video className="w-3.5 h-3.5 text-purple-600" />
                          <span>Online Meet</span>
                          {ev.meetingUrl && (
                            <a
                              href={ev.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Join Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        ev.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{ev.location}</span>
                          </div>
                        )
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  {/* Attendance & RSVP Selector */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
                    <div className="text-xs text-neutral-500">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {ev._count?.attendees ?? 0}
                      </span>
                      {ev.capacity ? ` / ${ev.capacity}` : ""} Going
                    </div>

                    {isActiveMember && ev.status !== "CANCELLED" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRSVP(ev.id, "GOING")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            ev.userRsvp === "GOING"
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-600"
                          }`}
                        >
                          Going
                        </button>
                        <button
                          onClick={() => handleRSVP(ev.id, "MAYBE")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            ev.userRsvp === "MAYBE"
                              ? "bg-amber-600 text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-amber-500/10 hover:text-amber-600"
                          }`}
                        >
                          Maybe
                        </button>
                        <button
                          onClick={() => handleRSVP(ev.id, "NOT_GOING")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            ev.userRsvp === "NOT_GOING"
                              ? "bg-neutral-600 text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-600"
                          }`}
                        >
                          Can't Go
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Resources */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Curated Academic Resources
              </h2>
              <p className="text-xs text-neutral-500">
                Verified links, course materials, syllabi, and study notes
              </p>
            </div>

            {isActiveMember && (
              <button
                onClick={() => setShowResourceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Resource
              </button>
            )}
          </div>

          {loadingResources ? (
            <div className="py-12 text-center text-sm text-neutral-500">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <LinkIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No resources shared yet
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Members can share Drive links, lecture slides, and GitHub repositories.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 transition flex items-center gap-1"
                      >
                        {res.title}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {res.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {res.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openReportModal("RESOURCE", res.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                      title="Report resource"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: About */}
      {activeTab === "about" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              About This Community
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
              {community.description || "No detailed description provided by the organizers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Membership Policy
              </span>
              <p className="text-sm text-neutral-800 dark:text-neutral-200">
                {community.requiresApproval
                  ? "Moderated — join requests require organizer approval."
                  : "Open — any eligible student can join instantly."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Visibility Scope
              </span>
              <p className="text-sm text-neutral-800 dark:text-neutral-200">
                {community.visibility === "PUBLIC"
                  ? "Public — discoverable by verified students in Explore."
                  : community.visibility === "CAMPUS_ONLY"
                  ? "Campus Only — restricted to students on this specific campus."
                  : "Private — hidden from non-members."}
              </p>
            </div>
          </div>

          {/* Report Community Button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => openReportModal("COMMUNITY", community.id)}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-600 transition cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              Report this Community
            </button>
          </div>
        </div>
      )}

      {/* Tab: Members */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Community Members ({members.length})
            </h3>
            {loadingMembers ? (
              <div className="py-8 text-center text-sm text-neutral-500">Loading members...</div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {members.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AvatarFallback name={m.user?.name || "Member"} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {m.user?.name}
                          </p>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {m.role}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          {m.user?.university?.name || "Verified Student"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openReportModal("MEMBER", m.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                      title="Report member"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Post Announcement */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                New Announcement
              </h3>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={newAnnounceTitle}
                  onChange={(e) => setNewAnnounceTitle(e.target.value)}
                  placeholder="e.g. Midterm Review Session Rescheduled"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Content (Safe Markdown supported)
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={5000}
                  value={newAnnounceContent}
                  onChange={(e) => setNewAnnounceContent(e.target.value)}
                  placeholder="Details, instructions, and dates..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={newAnnouncePinned}
                  onChange={(e) => setNewAnnouncePinned(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="pinCheck" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Pin announcement to top (maximum 3 pinned items allowed)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={announceSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {announceSubmitting ? "Publishing..." : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Event */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Schedule Community Event
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Data Structures Workshop"
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={5000}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Event agenda and prerequisites..."
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onlineCheck"
                  checked={newEventOnline}
                  onChange={(e) => setNewEventOnline(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="onlineCheck" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Online Event
                </label>
              </div>

              {newEventOnline ? (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Meeting URL (HTTPS)
                  </label>
                  <input
                    type="url"
                    value={newEventUrl}
                    onChange={(e) => setNewEventUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Campus Location
                  </label>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="e.g. CS Lab 3, SEECS"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Capacity (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newEventCapacity}
                  onChange={(e) => setNewEventCapacity(e.target.value)}
                  placeholder="Unlimited if left empty"
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {eventSubmitting ? "Scheduling..." : "Schedule Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Resource */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Share Resource Link
              </h3>
              <button
                onClick={() => setShowResourceModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={newResTitle}
                  onChange={(e) => setNewResTitle(e.target.value)}
                  placeholder="e.g. Lecture Slide Deck 04"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={newResDesc}
                  onChange={(e) => setNewResDesc(e.target.value)}
                  placeholder="Brief note about the resource..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Resource URL (Secure HTTPS only)
                </label>
                <input
                  type="url"
                  required
                  maxLength={1000}
                  value={newResUrl}
                  onChange={(e) => setNewResUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resourceSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {resourceSubmitting ? "Sharing..." : "Share Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Universal Content & Community Report */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 text-red-600">
                <Flag className="w-4 h-4" />
                Report {reportTargetType}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                >
                  <option value="SPAM">Spam or Advertising</option>
                  <option value="HARASSMENT">Harassment or Bullying</option>
                  <option value="IMPERSONATION">Impersonation</option>
                  <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                  <option value="FRAUD">Scam or Academic Dishonesty</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Description of Violation (min 5 chars)
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Explain why this content violates community standards..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
