import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Switch,
  Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ModalKeyboardContainer } from "@/components/ui/ModalKeyboardContainer";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import {
  triggerSelectionFeedback,
  triggerSuccessFeedback,
  triggerDestructiveFeedback,
} from "@/lib/haptics";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type {
  MobileGoogleCalendarStatusResponse,
  MobileSyncResultResponse,
} from "@/lib/types";

export default function IntegrationsScreen() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Disconnect Modal State
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [deleteCalendarOnDisconnect, setDeleteCalendarOnDisconnect] = useState(false);

  // Status Query
  const {
    data: statusData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<MobileGoogleCalendarStatusResponse>({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      return await apiClient.get<MobileGoogleCalendarStatusResponse>(
        "/api/mobile/integrations/google-calendar/status"
      );
    },
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      await triggerSelectionFeedback();
      return await apiClient.post<MobileSyncResultResponse>(
        "/api/mobile/integrations/google-calendar/sync"
      );
    },
    onSuccess: async (data) => {
      await triggerSuccessFeedback();
      const res = data.result || {
        examsSynced: 0,
        assignmentsSynced: 0,
        timetableSynced: 0,
        skippedUnchanged: 0,
      };
      const total = res.examsSynced + res.assignmentsSynced + res.timetableSynced;
      setSyncFeedback({
        type: "success",
        text: `Successfully synced ${total} item${total === 1 ? "" : "s"} (${res.examsSynced} exams, ${res.assignmentsSynced} assignments, ${res.timetableSynced} classes).`,
      });
      queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
    },
    onError: (err: any) => {
      if (err.status === 409) {
        setSyncFeedback({
          type: "info",
          text: "A synchronization is already running. Please wait a moment.",
        });
      } else if (err.status === 401 && err.code === "NEEDS_REAUTH") {
        setSyncFeedback({
          type: "error",
          text: "Google Calendar authorization has expired. Please reconnect.",
        });
        queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
      } else {
        setSyncFeedback({
          type: "error",
          text: err.message || "Failed to synchronize Google Calendar.",
        });
      }
    },
  });

  // Disconnect Mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post<{ success: boolean; calendarDeleted?: boolean }>(
        "/api/mobile/integrations/google-calendar/disconnect",
        { deleteCalendar: deleteCalendarOnDisconnect }
      );
    },
    onSuccess: async () => {
      await triggerDestructiveFeedback();
      setIsDisconnectModalOpen(false);
      setDeleteCalendarOnDisconnect(false);
      setSyncFeedback({
        type: "info",
        text: "Google Calendar disconnected. Your UniMate academic records remain intact.",
      });
      queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
    },
    onError: (err: any) => {
      setSyncFeedback({
        type: "error",
        text: err.message || "Failed to disconnect Google Calendar.",
      });
    },
  });

  // Connect Flow
  const handleConnect = async () => {
    try {
      await triggerSelectionFeedback();
      setSyncFeedback(null);

      const res = await apiClient.post<{ authUrl: string; state: string }>(
        "/api/mobile/integrations/google-calendar/auth-url"
      );

      if (!res.authUrl) {
        throw new Error("No authorization URL returned from server.");
      }

      // Open in browser session expecting redirect back to unimate:// scheme
      const result = await WebBrowser.openAuthSessionAsync(
        res.authUrl,
        "unimate://"
      );

      if (result.type === "success") {
        await triggerSuccessFeedback();
        setSyncFeedback({
          type: "success",
          text: "Google Calendar connected successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        text: err.message || "Failed to initiate Google Calendar connection.",
      });
    }
  };

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Integrations", headerShown: true }} />
        <LoadingState message="Loading integration status..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Integrations", headerShown: true }} />
        <ErrorState message="Failed to load integrations." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const status = statusData?.status || "DISCONNECTED";
  const email = statusData?.email;
  const lastSyncAt = statusData?.lastSyncAt
    ? new Date(statusData.lastSyncAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Never";

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: "Integrations",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Intro */}
        <View style={styles.header}>
          <AppText variant="h2" style={styles.title}>
            Integration Center
          </AppText>
          <AppText colorRole="secondary" variant="bodySmall" style={styles.subtitle}>
            Connect external academic services to synchronize schedules and calendar events.
          </AppText>
        </View>

        {/* Global Feedback Banner */}
        {syncFeedback && (
          <View
            accessibilityRole="alert"
            style={[
              styles.feedbackBanner,
              {
                backgroundColor:
                  syncFeedback.type === "success"
                    ? colors.successSubtle
                    : syncFeedback.type === "error"
                    ? colors.destructiveSubtle
                    : colors.accentSubtle,
                borderColor:
                  syncFeedback.type === "success"
                    ? colors.success
                    : syncFeedback.type === "error"
                    ? colors.danger
                    : colors.accent,
              },
            ]}
          >
            <Ionicons
              name={
                syncFeedback.type === "success"
                  ? "checkmark-circle"
                  : syncFeedback.type === "error"
                  ? "alert-circle"
                  : "information-circle"
              }
              size={18}
              color={
                syncFeedback.type === "success"
                  ? colors.success
                  : syncFeedback.type === "error"
                  ? colors.danger
                  : colors.accent
              }
              style={{ marginRight: 8 }}
            />
            <AppText
              variant="caption"
              style={{
                flex: 1,
                color:
                  syncFeedback.type === "success"
                    ? colors.success
                    : syncFeedback.type === "error"
                    ? colors.danger
                    : colors.accent,
                fontWeight: "600",
              }}
            >
              {syncFeedback.text}
            </AppText>
            <TouchableOpacity
              onPress={() => setSyncFeedback(null)}
              accessibilityLabel="Dismiss message"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Primary Integration: Google Calendar */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="calendar-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <View style={styles.titleRow}>
                <AppText variant="h3" style={styles.integrationName}>
                  Google Calendar
                </AppText>
                {status === "CONNECTED" && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.successSubtle }]}>
                    <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                    <AppText
                      variant="caption"
                      style={[styles.statusText, { color: colors.success }]}
                    >
                      Connected
                    </AppText>
                  </View>
                )}
                {status === "NEEDS_REAUTH" && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.warningSubtle }]}>
                    <Ionicons name="warning-outline" size={12} color={colors.warning} />
                    <AppText
                      variant="caption"
                      style={[styles.statusText, { color: colors.warning, marginLeft: 4 }]}
                    >
                      Reauth Required
                    </AppText>
                  </View>
                )}
                {status === "ERROR" && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.destructiveSubtle }]}>
                    <Ionicons name="alert-circle-outline" size={12} color={colors.danger} />
                    <AppText
                      variant="caption"
                      style={[styles.statusText, { color: colors.danger, marginLeft: 4 }]}
                    >
                      Sync Error
                    </AppText>
                  </View>
                )}
                {status === "DISCONNECTED" && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <AppText
                      variant="caption"
                      style={[styles.statusText, { color: colors.textSecondary }]}
                    >
                      Not Connected
                    </AppText>
                  </View>
                )}
              </View>
              <AppText colorRole="secondary" variant="caption" style={styles.desc}>
                Syncs exams, assignment deadlines, and weekly classes to a dedicated "UniMate Academic" calendar.
              </AppText>
            </View>
          </View>

          {/* Connected Details */}
          {status !== "DISCONNECTED" && (
            <View style={[styles.detailsBox, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={styles.detailRow}>
                <AppText colorRole="tertiary" variant="caption">
                  Google Account
                </AppText>
                <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
                  {email || "Connected Account"}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText colorRole="tertiary" variant="caption">
                  Target Calendar
                </AppText>
                <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
                  UniMate Academic
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText colorRole="tertiary" variant="caption">
                  Last Sync
                </AppText>
                <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
                  {lastSyncAt}
                </AppText>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {status === "CONNECTED" && (
              <>
                <Button
                  title="Sync Now"
                  onPress={() => syncMutation.mutate()}
                  loading={syncMutation.isPending}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                  icon={<Ionicons name="sync-outline" size={16} color="#FFFFFF" />}
                />
                <Button
                  title="Disconnect"
                  onPress={() => {
                    triggerSelectionFeedback();
                    setIsDisconnectModalOpen(true);
                  }}
                  variant="destructive"
                  size="md"
                  style={{ minWidth: 110 }}
                />
              </>
            )}

            {(status === "NEEDS_REAUTH" || status === "ERROR") && (
              <>
                <Button
                  title="Reconnect Account"
                  onPress={handleConnect}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Disconnect"
                  onPress={() => setIsDisconnectModalOpen(true)}
                  variant="secondary"
                  size="md"
                  style={{ minWidth: 100 }}
                />
              </>
            )}

            {status === "DISCONNECTED" && (
              <Button
                title="Connect with Google Calendar"
                onPress={handleConnect}
                variant="primary"
                size="md"
                style={{ width: "100%" }}
                icon={<Ionicons name="logo-google" size={16} color="#FFFFFF" />}
              />
            )}
          </View>
        </Card>

        {/* Privacy & Scope Card */}
        <Card style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            <AppText variant="bodyMedium" style={[styles.privacyTitle, { color: colors.textPrimary }]}>
              Privacy & Data Sovereignty
            </AppText>
          </View>
          <View style={styles.privacyBullet}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} style={{ marginTop: 2 }} />
            <AppText colorRole="secondary" variant="caption" style={styles.privacyBulletText}>
              <strong>Dedicated Calendar Isolation:</strong> UniMate creates and accesses ONLY the "UniMate Academic" secondary calendar. Your personal events are never read or modified.
            </AppText>
          </View>
          <View style={styles.privacyBullet}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} style={{ marginTop: 2 }} />
            <AppText colorRole="secondary" variant="caption" style={styles.privacyBulletText}>
              <strong>Local Data Preservation:</strong> Disconnecting or provider errors never delete your internal UniMate courses, grades, notes, or timetables.
            </AppText>
          </View>
          <View style={styles.privacyBullet}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} style={{ marginTop: 2 }} />
            <AppText colorRole="secondary" variant="caption" style={styles.privacyBulletText}>
              <strong>Encrypted at Rest:</strong> OAuth tokens are encrypted with versioned AES-256-GCM. Client apps never receive or store raw tokens.
            </AppText>
          </View>
        </Card>

        {/* Coming Soon Section */}
        <View style={styles.comingSoonSection}>
          <AppText variant="label" colorRole="tertiary" style={styles.sectionHeader}>
            Upcoming Institutional Integrations
          </AppText>

          <Card style={styles.comingSoonCard}>
            <View style={styles.comingSoonRow}>
              <View style={[styles.miniIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="school-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText variant="bodyMedium" style={{ fontWeight: "600" }}>
                    Canvas LMS
                  </AppText>
                  <View style={[styles.soonBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <AppText variant="caption" colorRole="tertiary" style={{ fontSize: 10, fontWeight: "600" }}>
                      Coming Soon
                    </AppText>
                  </View>
                </View>
                <AppText colorRole="secondary" variant="caption" style={{ marginTop: 2 }}>
                  Direct institutional import for syllabus, assignments, and grades.
                </AppText>
              </View>
            </View>
          </Card>

          <Card style={styles.comingSoonCard}>
            <View style={styles.comingSoonRow}>
              <View style={[styles.miniIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="layers-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText variant="bodyMedium" style={{ fontWeight: "600" }}>
                    Moodle
                  </AppText>
                  <View style={[styles.soonBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <AppText variant="caption" colorRole="tertiary" style={{ fontSize: 10, fontWeight: "600" }}>
                      Coming Soon
                    </AppText>
                  </View>
                </View>
                <AppText colorRole="secondary" variant="caption" style={{ marginTop: 2 }}>
                  Fetch course materials, submission portals, and professor notices.
                </AppText>
              </View>
            </View>
          </Card>

          <Card style={styles.comingSoonCard}>
            <View style={styles.comingSoonRow}>
              <View style={[styles.miniIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="book-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText variant="bodyMedium" style={{ fontWeight: "600" }}>
                    Blackboard Learn
                  </AppText>
                  <View style={[styles.soonBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <AppText variant="caption" colorRole="tertiary" style={{ fontSize: 10, fontWeight: "600" }}>
                      Coming Soon
                    </AppText>
                  </View>
                </View>
                <AppText colorRole="secondary" variant="caption" style={{ marginTop: 2 }}>
                  Institutional calendar sync for assessment timelines and lectures.
                </AppText>
              </View>
            </View>
          </Card>

          <Card style={styles.comingSoonCard}>
            <View style={styles.comingSoonRow}>
              <View style={[styles.miniIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="mail-unread-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText variant="bodyMedium" style={{ fontWeight: "600" }}>
                    University (.edu) Email Verification
                  </AppText>
                  <View style={[styles.soonBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <AppText variant="caption" colorRole="tertiary" style={{ fontSize: 10, fontWeight: "600" }}>
                      Coming Soon
                    </AppText>
                  </View>
                </View>
                <AppText colorRole="secondary" variant="caption" style={{ marginTop: 2 }}>
                  Verify campus affiliation to unlock verified badges and networking.
                </AppText>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Disconnect Modal */}
      <Modal
        visible={isDisconnectModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDisconnectModalOpen(false)}
      >
        <ModalKeyboardContainer cardStyle={{ padding: spacing.lg }}>
          <View style={styles.modalHeader}>
            <Ionicons name="warning-outline" size={24} color={colors.danger} />
            <AppText variant="h3" style={{ color: colors.textPrimary, marginLeft: 8 }}>
              Disconnect Google Calendar?
            </AppText>
          </View>

          <AppText colorRole="secondary" variant="bodySmall" style={styles.modalBody}>
            Disconnecting will revoke UniMate's sync authorization. Your internal UniMate courses, timetable, exams, and assignments will remain 100% untouched.
          </AppText>

          {/* Toggle for deleting calendar */}
          <View style={[styles.switchRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
                Also delete "UniMate Academic" calendar
              </AppText>
              <AppText colorRole="tertiary" variant="caption" style={{ marginTop: 2 }}>
                Removes the secondary calendar from your Google account.
              </AppText>
            </View>
            <Switch
              value={deleteCalendarOnDisconnect}
              onValueChange={setDeleteCalendarOnDisconnect}
              trackColor={{ false: colors.border, true: colors.danger }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setIsDisconnectModalOpen(false)}
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
              disabled={disconnectMutation.isPending}
            />
            <Button
              title={disconnectMutation.isPending ? "Disconnecting..." : "Confirm Disconnect"}
              onPress={() => disconnectMutation.mutate()}
              loading={disconnectMutation.isPending}
              variant="destructive"
              size="md"
              style={{ flex: 1 }}
            />
          </View>
        </ModalKeyboardContainer>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    lineHeight: 18,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  integrationName: {
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  desc: {
    marginTop: 4,
    lineHeight: 17,
  },
  detailsBox: {
    marginTop: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  privacyCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: 8,
  },
  privacyTitle: {
    fontWeight: "600",
  },
  privacyBullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xs,
    gap: 8,
  },
  privacyBulletText: {
    flex: 1,
    lineHeight: 17,
  },
  comingSoonSection: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  comingSoonCard: {
    padding: spacing.sm + 2,
    opacity: 0.85,
    marginBottom: spacing.xs,
  },
  comingSoonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  soonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalBody: {
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
