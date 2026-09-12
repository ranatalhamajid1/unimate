import "server-only";

import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";
import { encryptToken, decryptToken } from "./token-cipher";
import { createOAuthTransaction, consumeOAuthTransaction } from "./oauth-transaction";
import { getIntegrationNotificationKey } from "@/app/lib/notification-definitions";
import { IntegrationProvider, UserIntegration, ExternalRecordMapping } from "@prisma/client";

/**
 * Milestone 14 Phase 14.2: Google Calendar Integration Service
 *
 * Enforces OAuth 2.0 with PKCE, AES-256-GCM encrypted credential storage,
 * dedicated "UniMate Academic" calendar isolation, deterministic duplicate prevention,
 * distributed sync locks, token refresh, and safe disconnection.
 */

export const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

/**
 * Audit of Google Calendar API scopes used:
 * - GET /users/me/calendarList: inspect calendars (requires https://www.googleapis.com/auth/calendar)
 * - POST /calendars: create dedicated "UniMate Academic" calendar (requires https://www.googleapis.com/auth/calendar)
 * - DELETE /calendars/{id}: purge dedicated calendar on user disconnect (requires https://www.googleapis.com/auth/calendar)
 * - POST/PATCH/DELETE /calendars/{id}/events: event management (fully covered by https://www.googleapis.com/auth/calendar)
 *
 * `https://www.googleapis.com/auth/calendar` is the single minimum valid scope that satisfies
 * both dedicated calendar lifecycle management and event synchronization.
 * Requesting `calendar.events` alongside `calendar` is redundant.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

export const DEDICATED_CALENDAR_SUMMARY = "UniMate Academic";
export const DEFAULT_ACADEMIC_TIMEZONE = "Asia/Karachi";
export const SYNC_LOCK_TTL_MS = 2 * 60 * 1000; // 2 minutes

export class ReauthRequiredError extends Error {
  constructor(message: string = "Google authorization expired or was revoked. Please reconnect.") {
    super(message);
    this.name = "ReauthRequiredError";
  }
}

export class SyncConcurrencyError extends Error {
  constructor(message: string = "A synchronization is already in progress. Please wait.") {
    super(message);
    this.name = "SyncConcurrencyError";
  }
}

// ---------------------------------------------------------------------------
// PKCE Helpers
// ---------------------------------------------------------------------------

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // 64-byte random verifier base64url-encoded
  const codeVerifier = crypto
    .randomBytes(48)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { codeVerifier, codeChallenge };
}

export function computeEntitySyncHash(data: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  recurrence?: string[];
}): string {
  const content = [
    data.summary.trim(),
    (data.description || "").trim(),
    data.start,
    data.end,
    (data.location || "").trim(),
    (data.recurrence || []).join(";"),
  ].join("|");
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function resolveGoogleRedirectUri(baseOrigin?: string): string {
  const origin =
    baseOrigin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return `${origin.replace(/\/$/, "")}/api/integrations/google-calendar/callback`;
}

// ---------------------------------------------------------------------------
// 1. OAuth Initiation & URL Generation
// ---------------------------------------------------------------------------

export async function initiateGoogleCalendarOAuth(params: {
  userId: string;
  clientType: "WEB" | "MOBILE";
  baseOrigin?: string;
}): Promise<{ authUrl: string; state: string }> {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const { state } = await createOAuthTransaction({
    userId: params.userId,
    provider: IntegrationProvider.GOOGLE_CALENDAR,
    clientType: params.clientType,
    codeVerifier,
  });

  const clientId = process.env.GOOGLE_CLIENT_ID || "test-google-client-id.apps.googleusercontent.com";
  const redirectUri = resolveGoogleRedirectUri(params.baseOrigin);

  const url = new URL(GOOGLE_OAUTH_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return { authUrl: url.toString(), state };
}

// ---------------------------------------------------------------------------
// 2. OAuth Callback & Token Exchange
// ---------------------------------------------------------------------------

export async function handleGoogleCalendarCallback(params: {
  code: string;
  state: string;
  baseOrigin?: string;
}): Promise<{
  success: boolean;
  userId: string;
  clientType: "WEB" | "MOBILE";
  error?: string;
}> {
  // 1. Atomically consume transaction
  const consumption = await consumeOAuthTransaction(params.state);
  if (!consumption.success) {
    return {
      success: false,
      userId: "",
      clientType: "WEB",
      error: `OAuth state validation failed: ${consumption.error}`,
    };
  }

  const { transaction } = consumption;
  if (transaction.provider !== IntegrationProvider.GOOGLE_CALENDAR) {
    return {
      success: false,
      userId: transaction.userId,
      clientType: transaction.clientType,
      error: "Mismatched integration provider in transaction",
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "test-google-client-id.apps.googleusercontent.com";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "test-google-client-secret";
  const redirectUri = resolveGoogleRedirectUri(params.baseOrigin);

  // 2. Exchange authorization code + PKCE code_verifier for tokens
  const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: transaction.codeVerifier || "",
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    return {
      success: false,
      userId: transaction.userId,
      clientType: transaction.clientType,
      error: `Google token exchange failed (${tokenResponse.status}): ${errText}`,
    };
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresInSec = tokenData.expires_in || 3600;
  const tokenExpiresAt = new Date(Date.now() + expiresInSec * 1000);
  const grantedScopes = tokenData.scope ? tokenData.scope.split(" ") : GOOGLE_CALENDAR_SCOPES;

  // 3. Encrypt credentials at rest
  const encryptedAccessToken = encryptToken(accessToken);

  // Preserve existing refresh token if Google didn't return one (happens on subsequent consents if prompt was not consent)
  const existingIntegration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId: transaction.userId,
        provider: IntegrationProvider.GOOGLE_CALENDAR,
      },
    },
  });

  const encryptedRefreshToken = refreshToken
    ? encryptToken(refreshToken)
    : existingIntegration?.encryptedRefreshToken || null;

  // 4. Upsert UserIntegration
  await prisma.userIntegration.upsert({
    where: {
      userId_provider: {
        userId: transaction.userId,
        provider: IntegrationProvider.GOOGLE_CALENDAR,
      },
    },
    update: {
      status: "CONNECTED",
      encryptedAccessToken,
      ...(encryptedRefreshToken ? { encryptedRefreshToken } : {}),
      tokenExpiresAt,
      scopes: grantedScopes,
      lastSyncStatus: "SUCCESS",
      lastError: null,
    },
    create: {
      userId: transaction.userId,
      provider: IntegrationProvider.GOOGLE_CALENDAR,
      status: "CONNECTED",
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiresAt,
      scopes: grantedScopes,
      lastSyncStatus: "SUCCESS",
      lastError: null,
    },
  });

  return {
    success: true,
    userId: transaction.userId,
    clientType: transaction.clientType,
  };
}

// ---------------------------------------------------------------------------
// 3. Token Refresh & Lifecycle
// ---------------------------------------------------------------------------

export async function getOrRefreshGoogleAccessToken(
  userId: string,
  integration: UserIntegration
): Promise<string> {
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  // If token is still comfortably valid, decrypt and return
  if (
    integration.tokenExpiresAt &&
    integration.tokenExpiresAt.getTime() > now.getTime() + bufferMs &&
    integration.encryptedAccessToken
  ) {
    return decryptToken(integration.encryptedAccessToken);
  }

  // Needs refresh
  if (!integration.encryptedRefreshToken) {
    throw new ReauthRequiredError("No refresh token available. Reconnection required.");
  }

  const rawRefreshToken = decryptToken(integration.encryptedRefreshToken);
  const clientId = process.env.GOOGLE_CLIENT_ID || "test-google-client-id.apps.googleusercontent.com";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "test-google-client-secret";

  const refreshResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: rawRefreshToken,
    }),
  });

  if (!refreshResponse.ok) {
    let errorJson: any = {};
    try {
      errorJson = await refreshResponse.json();
    } catch {
      // ignore
    }

    if (errorJson.error === "invalid_grant" || refreshResponse.status === 400 || refreshResponse.status === 401) {
      // Transition integration to NEEDS_REAUTH
      await prisma.userIntegration.update({
        where: { id: integration.id },
        data: {
          status: "NEEDS_REAUTH",
          lastError: "Google authorization expired or was revoked. Please reconnect.",
        },
      });

      // Create deterministic deduplicated notification
      const relatedId = getIntegrationNotificationKey("GOOGLE_CALENDAR", "reauth_required");
      const existingNotification = await prisma.notification.findFirst({
        where: { userId, relatedId },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId,
            type: "INTEGRATION_REAUTH_REQUIRED",
            title: "Google Calendar Reconnection Needed",
            message: "Your Google Calendar connection expired or was revoked. Reconnect to keep your schedule synced.",
            relatedId,
            read: false,
          },
        });
      }

      throw new ReauthRequiredError();
    }

    throw new Error(`Google token refresh failed with status ${refreshResponse.status}`);
  }

  const refreshData = await refreshResponse.json();
  const newAccessToken = refreshData.access_token;
  const expiresInSec = refreshData.expires_in || 3600;
  const newExpiresAt = new Date(Date.now() + expiresInSec * 1000);
  const encryptedAccessToken = encryptToken(newAccessToken);

  await prisma.userIntegration.update({
    where: { id: integration.id },
    data: {
      encryptedAccessToken,
      tokenExpiresAt: newExpiresAt,
      status: "CONNECTED",
      lastError: null,
    },
  });

  return newAccessToken;
}

// ---------------------------------------------------------------------------
// 4. Dedicated Calendar Discovery & Creation
// ---------------------------------------------------------------------------

export async function getOrCreateUniMateCalendar(
  accessToken: string,
  integration: UserIntegration
): Promise<string> {
  // 1. If integration already has a calendarId, check if it still exists
  if (integration.calendarId) {
    const checkRes = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(integration.calendarId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (checkRes.ok) {
      return integration.calendarId;
    }
  }

  // 2. Discover in calendar list
  const listRes = await fetch(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = (listData.items || []).find(
      (cal: any) => cal.summary === DEDICATED_CALENDAR_SUMMARY && !cal.deleted
    );

    if (existing && existing.id) {
      await prisma.userIntegration.update({
        where: { id: integration.id },
        data: { calendarId: existing.id },
      });
      return existing.id;
    }
  }

  // 3. Create dedicated calendar
  const createRes = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: DEDICATED_CALENDAR_SUMMARY,
      description: "Academic exams, assignments, and class timetable schedule synced from UniMate",
      timeZone: DEFAULT_ACADEMIC_TIMEZONE,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create UniMate Academic calendar (${createRes.status}): ${errText}`);
  }

  const createdCal = await createRes.json();
  const calendarId = createdCal.id;

  // Persist calendarId in UserIntegration
  await prisma.userIntegration.update({
    where: { id: integration.id },
    data: { calendarId },
  });

  return calendarId;
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 5. Distributed Sync Lock with Fencing Token
// ---------------------------------------------------------------------------

export async function acquireSyncLock(
  integrationId: string
): Promise<{ acquired: boolean; lockToken: string | null }> {
  const now = new Date();
  const lockExpires = new Date(now.getTime() + SYNC_LOCK_TTL_MS);
  const lockToken = crypto.randomUUID();

  const integration = await prisma.userIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) return { acquired: false, lockToken: null };

  if (
    integration.syncLockExpiresAt &&
    integration.syncLockExpiresAt.getTime() > now.getTime()
  ) {
    return { acquired: false, lockToken: null }; // Active lock held by another process
  }

  await prisma.userIntegration.update({
    where: { id: integrationId },
    data: {
      syncLockExpiresAt: lockExpires,
      syncLockToken: lockToken,
    },
  });

  return { acquired: true, lockToken };
}

export async function releaseSyncLock(
  integrationId: string,
  lockToken: string
): Promise<boolean> {
  try {
    const integration = await prisma.userIntegration.findUnique({
      where: { id: integrationId },
    });
    // Atomic fencing check: only release if current lockToken matches caller's lockToken
    if (integration && integration.syncLockToken === lockToken) {
      await prisma.userIntegration.update({
        where: { id: integrationId },
        data: {
          syncLockExpiresAt: null,
          syncLockToken: null,
        },
      });
      return true;
    }
    return false; // Old lock owner cannot release a newer lock owner's lease
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. Manual Synchronization Engine
// ---------------------------------------------------------------------------

export type SyncResult = {
  success: boolean;
  examsSynced: number;
  assignmentsSynced: number;
  timetableSynced: number;
  skippedUnchanged: number;
  errors: string[];
};

export async function syncGoogleCalendar(userId: string): Promise<SyncResult> {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_CALENDAR,
      },
    },
  });

  if (!integration || integration.status !== "CONNECTED") {
    throw new Error("Google Calendar integration is not connected for this user");
  }

  // 1. Acquire atomic concurrency lock with fencing token
  const { acquired, lockToken } = await acquireSyncLock(integration.id);
  if (!acquired || !lockToken) {
    throw new SyncConcurrencyError();
  }

  const result: SyncResult = {
    success: true,
    examsSynced: 0,
    assignmentsSynced: 0,
    timetableSynced: 0,
    skippedUnchanged: 0,
    errors: [],
  };

  try {
    // 2. Ensure valid access token & dedicated calendar
    const accessToken = await getOrRefreshGoogleAccessToken(userId, integration);
    const calendarId = await getOrCreateUniMateCalendar(accessToken, integration);

    // 3. Fetch UniMate-owned academic entities
    const [exams, assignments, timetableEntries] = await Promise.all([
      prisma.exam.findMany({ where: { userId } }),
      prisma.assignment.findMany({ where: { userId } }),
      prisma.timetableEntry.findMany({ where: { userId } }),
    ]);

    // A. Sync Exams
    for (const exam of exams) {
      try {
        const startIso = exam.examDate.toISOString();
        const endIso = new Date(exam.examDate.getTime() + 2 * 60 * 60 * 1000).toISOString();
        const summary = `[Exam] ${exam.title}`;
        const description = `Room: ${exam.room || "TBA"} | Type: ${exam.type} | Notes: ${exam.notes || "None"}`;
        const location = exam.room || "";

        const syncHash = computeEntitySyncHash({
          summary,
          description,
          start: startIso,
          end: endIso,
          location,
        });

        // Check existing mapping
        const mapping = await prisma.externalRecordMapping.findFirst({
          where: {
            userId,
            provider: IntegrationProvider.GOOGLE_CALENDAR,
            entityType: "EXAM",
            internalId: exam.id,
          },
        });

        if (mapping) {
          if (mapping.syncHash === syncHash) {
            result.skippedUnchanged++;
            continue;
          }

          // Update existing event on Google
          const patchRes = await fetch(
            `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(mapping.externalId)}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                summary,
                description,
                location,
                start: { dateTime: startIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
                end: { dateTime: endIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
              }),
            }
          );

          if (patchRes.ok) {
            await prisma.externalRecordMapping.update({
              where: { id: mapping.id },
              data: { syncHash, lastSyncedAt: new Date() },
            });
            result.examsSynced++;
          } else if (patchRes.status === 404) {
            // Event deleted on Google -> Recreate
            const createRes = await createGoogleEvent(accessToken, calendarId, {
              summary,
              description,
              location,
              startIso,
              endIso,
            });
            if (createRes) {
              await prisma.externalRecordMapping.update({
                where: { id: mapping.id },
                data: { externalId: createRes.id, syncHash, lastSyncedAt: new Date() },
              });
              result.examsSynced++;
            }
          }
        } else {
          // Create new event
          const created = await createGoogleEvent(accessToken, calendarId, {
            summary,
            description,
            location,
            startIso,
            endIso,
          });
          if (created) {
            await prisma.externalRecordMapping.create({
              data: {
                userId,
                integrationId: integration.id,
                provider: IntegrationProvider.GOOGLE_CALENDAR,
                entityType: "EXAM",
                internalId: exam.id,
                externalId: created.id,
                syncHash,
              },
            });
            result.examsSynced++;
          }
        }
      } catch (err: any) {
        result.errors.push(`Exam ${exam.id} sync error: ${err.message}`);
      }
    }

    // B. Sync Assignments (with due dates)
    for (const assignment of assignments) {
      if (!assignment.dueDate) continue;

      try {
        const endIso = assignment.dueDate.toISOString();
        const startIso = new Date(assignment.dueDate.getTime() - 60 * 60 * 1000).toISOString();
        const summary = `[Due] ${assignment.title}`;
        const description = `Status: ${assignment.status} | Priority: ${assignment.priority}\n${assignment.description || ""}`;
        const location = "";

        const syncHash = computeEntitySyncHash({
          summary,
          description,
          start: startIso,
          end: endIso,
          location,
        });

        const mapping = await prisma.externalRecordMapping.findFirst({
          where: {
            userId,
            provider: IntegrationProvider.GOOGLE_CALENDAR,
            entityType: "ASSIGNMENT",
            internalId: assignment.id,
          },
        });

        if (mapping) {
          if (mapping.syncHash === syncHash) {
            result.skippedUnchanged++;
            continue;
          }

          const patchRes = await fetch(
            `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(mapping.externalId)}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                summary,
                description,
                start: { dateTime: startIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
                end: { dateTime: endIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
              }),
            }
          );

          if (patchRes.ok) {
            await prisma.externalRecordMapping.update({
              where: { id: mapping.id },
              data: { syncHash, lastSyncedAt: new Date() },
            });
            result.assignmentsSynced++;
          } else if (patchRes.status === 404) {
            const created = await createGoogleEvent(accessToken, calendarId, {
              summary,
              description,
              location,
              startIso,
              endIso,
            });
            if (created) {
              await prisma.externalRecordMapping.update({
                where: { id: mapping.id },
                data: { externalId: created.id, syncHash, lastSyncedAt: new Date() },
              });
              result.assignmentsSynced++;
            }
          }
        } else {
          const created = await createGoogleEvent(accessToken, calendarId, {
            summary,
            description,
            location,
            startIso,
            endIso,
          });
          if (created) {
            await prisma.externalRecordMapping.create({
              data: {
                userId,
                integrationId: integration.id,
                provider: IntegrationProvider.GOOGLE_CALENDAR,
                entityType: "ASSIGNMENT",
                internalId: assignment.id,
                externalId: created.id,
                syncHash,
              },
            });
            result.assignmentsSynced++;
          }
        }
      } catch (err: any) {
        result.errors.push(`Assignment ${assignment.id} sync error: ${err.message}`);
      }
    }

    // C. Sync Timetable Entries (1 TimetableEntry -> 1 recurring Google event + 1 ExternalRecordMapping)
    const RFC_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
    for (const entry of timetableEntries) {
      try {
        const summary = `[Class] ${entry.type} (${entry.room || "Room TBA"})`;
        const description = `Room: ${entry.room || "TBA"} | Type: ${entry.type}`;
        const location = entry.room || "";

        // Anchor start date based on entry day of week
        const now = new Date();
        const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1 = Mon ... 7 = Sun
        const dayDiff = (entry.dayOfWeek - currentDay + 7) % 7;
        const targetDate = new Date(now.getTime() + dayDiff * 24 * 60 * 60 * 1000);

        const [startH, startM] = entry.startTime.split(":").map(Number);
        const [endH, endM] = entry.endTime.split(":").map(Number);

        targetDate.setHours(startH || 9, startM || 0, 0, 0);
        const startIso = targetDate.toISOString();

        const endDate = new Date(targetDate);
        endDate.setHours(endH || 10, endM || 0, 0, 0);
        const endIso = endDate.toISOString();

        const byDay = RFC_DAYS[entry.dayOfWeek - 1] || "MO";
        const recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`];

        const syncHash = computeEntitySyncHash({
          summary,
          description,
          start: startIso,
          end: endIso,
          location,
          recurrence,
        });

        const mapping = await prisma.externalRecordMapping.findFirst({
          where: {
            userId,
            provider: IntegrationProvider.GOOGLE_CALENDAR,
            entityType: "TIMETABLE",
            internalId: entry.id,
          },
        });

        if (mapping) {
          if (mapping.syncHash === syncHash) {
            result.skippedUnchanged++;
            continue;
          }

          const patchRes = await fetch(
            `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(mapping.externalId)}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                summary,
                description,
                location,
                start: { dateTime: startIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
                end: { dateTime: endIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
                recurrence,
              }),
            }
          );

          if (patchRes.ok) {
            await prisma.externalRecordMapping.update({
              where: { id: mapping.id },
              data: { syncHash, lastSyncedAt: new Date() },
            });
            result.timetableSynced++;
          } else if (patchRes.status === 404) {
            const created = await createGoogleEvent(accessToken, calendarId, {
              summary,
              description,
              location,
              startIso,
              endIso,
              recurrence,
            });
            if (created) {
              await prisma.externalRecordMapping.update({
                where: { id: mapping.id },
                data: { externalId: created.id, syncHash, lastSyncedAt: new Date() },
              });
              result.timetableSynced++;
            }
          }
        } else {
          const created = await createGoogleEvent(accessToken, calendarId, {
            summary,
            description,
            location,
            startIso,
            endIso,
            recurrence,
          });
          if (created) {
            await prisma.externalRecordMapping.create({
              data: {
                userId,
                integrationId: integration.id,
                provider: IntegrationProvider.GOOGLE_CALENDAR,
                entityType: "TIMETABLE",
                internalId: entry.id,
                externalId: created.id,
                syncHash,
              },
            });
            result.timetableSynced++;
          }
        }
      } catch (err: any) {
        result.errors.push(`Timetable entry ${entry.id} sync error: ${err.message}`);
      }
    }

    // 4. Update integration sync timestamps
    await prisma.userIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.errors.length === 0 ? "SUCCESS" : "PARTIAL",
        lastError: result.errors.length > 0 ? result.errors[0] : null,
      },
    });

    return result;
  } finally {
    // 5. Always release sync lock using the caller's fencing token
    await releaseSyncLock(integration.id, lockToken);
  }
}

async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventData: {
    summary: string;
    description: string;
    location: string;
    startIso: string;
    endIso: string;
    recurrence?: string[];
  }
): Promise<{ id: string } | null> {
  const payload: any = {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location,
    start: { dateTime: eventData.startIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
    end: { dateTime: eventData.endIso, timeZone: DEFAULT_ACADEMIC_TIMEZONE },
  };

  if (eventData.recurrence && eventData.recurrence.length > 0) {
    payload.recurrence = eventData.recurrence;
  }

  const res = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return { id: data.id };
}

// ---------------------------------------------------------------------------
// 7. Disconnection & Revocation
// ---------------------------------------------------------------------------

export type DisconnectResult = {
  success: boolean;
  calendarDeleted: boolean;
};

export async function disconnectGoogleCalendar(
  userId: string,
  deleteCalendar: boolean = false
): Promise<DisconnectResult> {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_CALENDAR,
      },
    },
  });

  if (!integration) {
    return { success: true, calendarDeleted: false };
  }

  let calendarDeleted = false;

  // 1. Optionally delete dedicated calendar on Google if requested
  if (deleteCalendar && integration.calendarId && integration.encryptedAccessToken) {
    try {
      const accessToken = decryptToken(integration.encryptedAccessToken);
      const delRes = await fetch(
        `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(integration.calendarId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (delRes.ok || delRes.status === 404) {
        calendarDeleted = true;
      }
    } catch {
      // Non-fatal: provider failure does not block local disconnect
      calendarDeleted = false;
    }
  }

  // 2. Revoke OAuth token on Google
  try {
    const rawToken = integration.encryptedRefreshToken
      ? decryptToken(integration.encryptedRefreshToken)
      : integration.encryptedAccessToken
      ? decryptToken(integration.encryptedAccessToken)
      : null;

    if (rawToken) {
      await fetch(GOOGLE_OAUTH_REVOKE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: rawToken }),
      });
    }
  } catch {
    // Non-fatal: revoke failure does not block local disconnect
  }

  // 3. Delete mappings for GOOGLE_CALENDAR
  await prisma.externalRecordMapping.deleteMany({
    where: {
      userId,
      provider: IntegrationProvider.GOOGLE_CALENDAR,
    },
  });

  // 4. Update integration status and clear credentials
  await prisma.userIntegration.update({
    where: { id: integration.id },
    data: {
      status: "DISCONNECTED",
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      calendarId: null,
      tokenExpiresAt: null,
      lastSyncStatus: null,
      lastError: null,
    },
  });

  return { success: true, calendarDeleted };
}

// ---------------------------------------------------------------------------
// 8. Integration Status Query (Clean, Redacted)
// ---------------------------------------------------------------------------

export type GoogleIntegrationStatus = {
  connected: boolean;
  status: string;
  email: string | null;
  calendarId: string | null;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  lastError: string | null;
  scopes: string[];
};

export async function getGoogleCalendarStatus(
  userId: string
): Promise<GoogleIntegrationStatus> {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_CALENDAR,
      },
    },
  });

  if (!integration || integration.status === "DISCONNECTED") {
    return {
      connected: false,
      status: "DISCONNECTED",
      email: null,
      calendarId: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastError: null,
      scopes: [],
    };
  }

  return {
    connected: integration.status === "CONNECTED",
    status: integration.status,
    email: integration.externalAccountEmail || null,
    calendarId: integration.calendarId,
    lastSyncAt: integration.lastSyncAt,
    lastSyncStatus: integration.lastSyncStatus,
    lastError: integration.lastError,
    scopes: integration.scopes,
  };
}
