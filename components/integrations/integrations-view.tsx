"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Lock,
  Trash2,
  X,
  Clock,
  Sparkles,
  Layers,
  GraduationCap,
  MailCheck,
} from "lucide-react";

export type GoogleCalendarStatusData = {
  connected: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "NEEDS_REAUTH" | "ERROR";
  email: string | null;
  calendarId: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
};

type IntegrationsViewProps = {
  initialGoogleStatus: GoogleCalendarStatusData;
};

export function IntegrationsView({ initialGoogleStatus }: IntegrationsViewProps) {
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatusData>(initialGoogleStatus);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Disconnect Modal State
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [deleteCalendarOnDisconnect, setDeleteCalendarOnDisconnect] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  // Connect / Reconnect State
  const [isConnecting, setIsConnecting] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleConnect = async () => {
    setIsConnecting(true);
    setSyncFeedback(null);
    try {
      const res = await fetch("/api/integrations/google-calendar/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate Google Calendar authorization");
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("No authorization URL received.");
      }
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.message || "Failed to start Google Calendar connection.",
      });
      setIsConnecting(false);
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await fetch("/api/integrations/google-calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.status === 409) {
        setSyncFeedback({
          type: "info",
          message: "A synchronization is already in progress. Please wait a moment.",
        });
        setIsSyncing(false);
        return;
      }

      if (res.status === 401 && data.code === "NEEDS_REAUTH") {
        setGoogleStatus((prev) => ({
          ...prev,
          status: "NEEDS_REAUTH",
          lastError: "Google authorization expired or was revoked. Please reconnect.",
        }));
        setSyncFeedback({
          type: "error",
          message: "Authorization expired. Please re-authenticate your Google account.",
        });
        setIsSyncing(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Calendar synchronization encountered an issue.");
      }

      // Success
      const result = data.result || {};
      const syncedCount = (result.examsSynced || 0) + (result.assignmentsSynced || 0) + (result.timetableSynced || 0);
      const skippedCount = result.skippedUnchanged || 0;

      setGoogleStatus((prev) => ({
        ...prev,
        status: "CONNECTED",
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: "SUCCESS",
        lastError: null,
      }));

      setSyncFeedback({
        type: "success",
        message: `Synced ${syncedCount} item${syncedCount === 1 ? "" : "s"} (${result.examsSynced || 0} exams, ${result.assignmentsSynced || 0} assignments, ${result.timetableSynced || 0} classes). ${skippedCount} unchanged.`,
      });
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.message || "Failed to synchronize calendar.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    setDisconnectError(null);

    try {
      const res = await fetch("/api/integrations/google-calendar/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteCalendar: deleteCalendarOnDisconnect }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to disconnect Google Calendar.");
      }

      setGoogleStatus({
        connected: false,
        status: "DISCONNECTED",
        email: null,
        calendarId: null,
        lastSyncAt: null,
        lastSyncStatus: null,
        lastError: null,
      });

      setIsDisconnectModalOpen(false);
      setDeleteCalendarOnDisconnect(false);
      setSyncFeedback({
        type: "info",
        message: "Google Calendar has been disconnected. Your UniMate academic records remain intact.",
      });
    } catch (err: any) {
      setDisconnectError(err.message || "Failed to complete disconnection.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatTimestamp = (isoString: string | null) => {
    if (!isoString) return "Never";
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Integration Center
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect external services to seamlessly synchronize schedules, exams, and institutional resources.
            </p>
          </div>
        </div>
      </div>

      {/* Global Sync Feedback Banner */}
      {syncFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
            syncFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : syncFeedback.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {syncFeedback.type === "error" && <AlertCircle className="w-5 h-5 shrink-0" />}
            {syncFeedback.type === "info" && <RefreshCw className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-muted-foreground hover:text-foreground transition-colors ml-4 p-1"
            aria-label="Dismiss feedback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Integration: Google Calendar */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-semibold text-foreground">Google Calendar</h2>
                {googleStatus.status === "CONNECTED" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </span>
                )}
                {googleStatus.status === "NEEDS_REAUTH" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Reauth Required
                  </span>
                )}
                {googleStatus.status === "ERROR" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Sync Error
                  </span>
                )}
                {googleStatus.status === "DISCONNECTED" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Synchronize your exams, assignment due dates, and weekly timetable into a dedicated "UniMate Academic" calendar.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {googleStatus.status === "CONNECTED" && (
              <>
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
                <button
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </>
            )}

            {(googleStatus.status === "NEEDS_REAUTH" || googleStatus.status === "ERROR") && (
              <>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 ${isConnecting ? "animate-spin" : ""}`} />
                  <span>{isConnecting ? "Connecting..." : "Reconnect Account"}</span>
                </button>
                <button
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border border-border transition-all active:scale-95"
                >
                  <span>Disconnect</span>
                </button>
              </>
            )}

            {googleStatus.status === "DISCONNECTED" && (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm active:scale-95"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>{isConnecting ? "Redirecting..." : "Connect with Google Calendar"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Integration Details / Diagnostics */}
        {googleStatus.status !== "DISCONNECTED" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Google Account
              </span>
              <p className="text-sm font-semibold text-foreground mt-1 truncate">
                {googleStatus.email || "Unknown Account"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Target Calendar
              </span>
              <p className="text-sm font-semibold text-foreground mt-1 truncate">
                UniMate Academic
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Synchronized
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  {formatTimestamp(googleStatus.lastSyncAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error / Reauth Diagnostic Box */}
        {googleStatus.lastError && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice: </span>
              {googleStatus.lastError}
            </div>
          </div>
        )}
      </div>

      {/* Scope, Privacy & Tenant Isolation Guarantee */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Privacy & Permission Guardrails</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Dedicated Calendar Isolation</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              UniMate creates and manages only a dedicated secondary calendar named <strong>"UniMate Academic"</strong>. It never reads, edits, or deletes your personal calendars.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data Sovereignty</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Your UniMate academic records (courses, grades, notes, exams) are stored locally in UniMate. External sync errors or disconnection never alter or remove your internal records.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>AES-256-GCM Encryption</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              OAuth access and refresh tokens are encrypted at rest with versioned AES-256-GCM keys. Tokens are never logged or exposed in client responses.
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Integrations */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Upcoming Institutional Integrations</h3>
          <p className="text-xs text-muted-foreground">
            Direct institutional connectivity under development for upcoming releases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Canvas LMS */}
          <div className="rounded-xl border border-border/80 bg-card/40 p-5 space-y-2 opacity-85 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-semibold text-foreground text-sm">Canvas LMS</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Direct institutional integration for automatic syllabus synchronization, homework deadlines, and grade announcements.
            </p>
          </div>

          {/* Moodle */}
          <div className="rounded-xl border border-border/80 bg-card/40 p-5 space-y-2 opacity-85 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-semibold text-foreground text-sm">Moodle</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect to your university Moodle instance to fetch course modules, submission deadlines, and instructor notices.
            </p>
          </div>

          {/* Blackboard */}
          <div className="rounded-xl border border-border/80 bg-card/40 p-5 space-y-2 opacity-85 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-500/10 border border-neutral-500/20 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-semibold text-foreground text-sm">Blackboard Learn</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Import course schedules, discussion assignments, and exam calendars directly into your unified dashboard.
            </p>
          </div>

          {/* University Email Verification */}
          <div className="rounded-xl border border-border/80 bg-card/40 p-5 space-y-2 opacity-85 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <MailCheck className="w-4 h-4" />
                </div>
                <span className="font-semibold text-foreground text-sm">University (.edu) Email</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify your academic email address via secure OTP to unlock verified campus community badges and student discounts.
            </p>
          </div>
        </div>
      </div>

      {/* Accessible Disconnect Confirmation Modal */}
      {isDisconnectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disconnect-modal-title"
          aria-describedby="disconnect-modal-desc"
          onKeyDown={(e) => {
            if (e.key === "Escape" && !isDisconnecting) setIsDisconnectModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h4 id="disconnect-modal-title" className="text-lg font-semibold">
                  Disconnect Google Calendar?
                </h4>
              </div>
              <button
                onClick={() => !isDisconnecting && setIsDisconnectModalOpen(false)}
                disabled={isDisconnecting}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p id="disconnect-modal-desc" className="text-sm text-muted-foreground leading-relaxed">
              Disconnecting will revoke UniMate's access to your Google account and remove external calendar sync mappings.
              Your internal courses, exams, assignments, and timetable entries will remain completely intact.
            </p>

            {/* Optional Calendar Deletion Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deleteCalendarOnDisconnect}
                onChange={(e) => setDeleteCalendarOnDisconnect(e.target.checked)}
                disabled={isDisconnecting}
                className="mt-0.5 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-foreground leading-snug">
                <strong>Also delete the "UniMate Academic" calendar</strong> from my Google Calendar account.
                <span className="block text-muted-foreground mt-0.5">
                  If unchecked, the calendar remains on your Google account but UniMate will stop syncing to it.
                </span>
              </span>
            </label>

            {disconnectError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                {disconnectError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDisconnectModalOpen(false)}
                disabled={isDisconnecting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {isDisconnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <span>Confirm Disconnect</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
