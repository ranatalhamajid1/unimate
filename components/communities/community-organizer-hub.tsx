"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Settings,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Shield,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

interface CommunityOrganizerHubProps {
  community: {
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
    memberCount: number;
    currentUserRole: string | null;
    isOwner: boolean;
    isAdmin: boolean;
    isModerator: boolean;
  };
  currentUserId: string;
}

export function CommunityOrganizerHub({
  community,
  currentUserId,
}: CommunityOrganizerHubProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"reports" | "roster" | "settings">("reports");

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: string]: string }>({});

  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Ownership transfer state
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  // Load reports
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch(
        `/api/communities/${community.slug}/manage/reports${reportFilter ? `?status=${reportFilter}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Load members
  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const [activeRes, pendingRes] = await Promise.all([
        fetch(`/api/communities/${community.slug}/members?status=ACTIVE`),
        fetch(`/api/communities/${community.slug}/members?status=PENDING`),
      ]);
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setMembers(activeData.members || []);
      }
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingMembers(pendingData.members || []);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    } else if (activeTab === "roster") {
      fetchMembers();
    }
  }, [activeTab, reportFilter]);

  // Report resolution handler
  const handleResolveReport = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    try {
      setActionLoading(reportId);
      const notes = resolutionNotes[reportId] || "";
      const res = await fetch(`/api/communities/${community.slug}/manage/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNotes: notes }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update report");
      }
    } catch (err) {
      alert("Error resolving report");
    } finally {
      setActionLoading(null);
    }
  };

  // Member status/role update handler
  const handleUpdateMember = async (memberId: string, updates: { role?: string; status?: string }) => {
    try {
      setActionLoading(memberId);
      const res = await fetch(`/api/communities/${community.slug}/manage/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update member");
      }
    } catch (err) {
      alert("Error updating member");
    } finally {
      setActionLoading(null);
    }
  };

  // Ownership transfer handler
  const handleTransferOwnership = async () => {
    if (!transferTargetId) return;
    if (!confirm("Are you certain you want to transfer ownership of this community? You will become an administrator.")) return;
    try {
      setTransferLoading(true);
      setTransferMessage(null);
      const res = await fetch(`/api/communities/${community.slug}/manage/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: transferTargetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTransferMessage(data.error || "Failed to transfer ownership");
      } else {
        alert("Ownership transferred successfully");
        router.push(`/dashboard/communities/${community.slug}`);
      }
    } catch (err: any) {
      setTransferMessage(err.message || "Failed to transfer ownership");
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href={`/dashboard/communities/${community.slug}`}
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {community.name}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-4">
          <AvatarFallback name={community.name} size="md" />
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
              Organizer Hub: {community.name}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Community management, member approvals, and scoped moderation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Role: {community.currentUserRole}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === "reports"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Moderation Reports
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 relative ${
            activeTab === "roster"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Roster & Approvals
          {pendingMembers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {pendingMembers.length}
            </span>
          )}
        </button>
        {community.isOwner && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === "settings"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Ownership Transfer
          </button>
        )}
      </div>

      {/* Tab: Moderation Reports */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  reportFilter === "PENDING"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setReportFilter("RESOLVED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  reportFilter === "RESOLVED"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setReportFilter("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  reportFilter === ""
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                All
              </button>
            </div>

            <button
              onClick={fetchReports}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
              title="Refresh reports"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingReports ? (
            <div className="py-12 text-center text-sm text-neutral-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <ShieldAlert className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No reports found
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Community content is clean and safe.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                          {report.reason}
                        </span>
                        <span className="text-xs text-neutral-400">
                          Target: {report.targetType} ({report.targetId})
                        </span>
                        <span className="text-xs text-neutral-400">• {new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                        "{report.description}"
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        report.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : report.status === "DISMISSED"
                          ? "bg-neutral-500/10 text-neutral-500"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {report.status === "PENDING" && (
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Optional resolution notes..."
                        value={resolutionNotes[report.id] || ""}
                        onChange={(e) =>
                          setResolutionNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          disabled={actionLoading === report.id}
                          onClick={() => handleResolveReport(report.id, "RESOLVED")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                        >
                          Resolve
                        </button>
                        <button
                          disabled={actionLoading === report.id}
                          onClick={() => handleResolveReport(report.id, "DISMISSED")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 transition cursor-pointer disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {report.resolutionNotes && (
                    <p className="text-xs text-neutral-500 italic">
                      Resolution: {report.resolutionNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Roster & Approvals */}
      {activeTab === "roster" && (
        <div className="space-y-6">
          {/* Pending Requests Section */}
          {pendingMembers.length > 0 && (
            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Pending Join Requests ({pendingMembers.length})
              </h3>
              <div className="divide-y divide-amber-500/10">
                {pendingMembers.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AvatarFallback name={m.user?.name || "Member"} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {m.user?.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {m.user?.university?.shortName || m.user?.degreeProgram || "Student"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoading === m.id}
                        onClick={() => handleUpdateMember(m.id, { status: "ACTIVE" })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        disabled={actionLoading === m.id}
                        onClick={() => handleUpdateMember(m.id, { status: "BANNED" })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-red-500 hover:text-white transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Members Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Active Members ({members.length})
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

                    {/* Manage Role & Bans */}
                    {m.role !== "OWNER" && m.user?.id !== currentUserId && (
                      <div className="flex items-center gap-2">
                        {community.isOwner && m.role !== "ADMIN" && (
                          <button
                            disabled={actionLoading === m.id}
                            onClick={() => handleUpdateMember(m.id, { role: "ADMIN" })}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition cursor-pointer"
                          >
                            Make Admin
                          </button>
                        )}
                        {community.isAdmin && m.role === "MEMBER" && (
                          <button
                            disabled={actionLoading === m.id}
                            onClick={() => handleUpdateMember(m.id, { role: "MODERATOR" })}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition cursor-pointer"
                          >
                            Make Mod
                          </button>
                        )}
                        {community.isAdmin && (m.role === "MODERATOR" || m.role === "ADMIN") && (
                          <button
                            disabled={actionLoading === m.id}
                            onClick={() => handleUpdateMember(m.id, { role: "MEMBER" })}
                            className="px-2.5 py-1 rounded text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                          >
                            Demote
                          </button>
                        )}
                        <button
                          disabled={actionLoading === m.id}
                          onClick={() => {
                            if (confirm(`Ban ${m.user?.name} from this community?`)) {
                              handleUpdateMember(m.id, { status: "BANNED" });
                            }
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 transition cursor-pointer"
                          title="Ban member"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Ownership Transfer */}
      {activeTab === "settings" && community.isOwner && (
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Transfer Community Ownership
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Transfer full ownership rights of this community to another active member. You will automatically become an administrator.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Select Active Member
              </label>
              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
              >
                <option value="">Select a member...</option>
                {members
                  .filter((m) => m.user?.id !== currentUserId)
                  .map((m) => (
                    <option key={m.id} value={m.user?.id}>
                      {m.user?.name} ({m.role})
                    </option>
                  ))}
              </select>
            </div>

            {transferMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-medium">
                {transferMessage}
              </div>
            )}

            <button
              disabled={!transferTargetId || transferLoading}
              onClick={handleTransferOwnership}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
            >
              {transferLoading ? "Transferring..." : "Transfer Ownership"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
