import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { AvatarFallback } from "@/components/ui/AvatarFallback";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { apiGet } from "@/lib/api-client";
import { BorderRadius } from "@/constants/layout";
import { MobileAttentionBanner } from "@/components/dashboard/MobileAttentionBanner";
import { MobileTodayTimeline } from "@/components/dashboard/MobileTodayTimeline";
import { MobileActiveFocusBar } from "@/components/focus/MobileActiveFocusBar";
import { MobileDashboardKpiStrip } from "@/components/dashboard/MobileDashboardKpiStrip";
import type {
  MobileAdaptiveTodayWorkspaceData,
  MobileTodayActionItem,
  MobileActiveFocusSession,
  MobileAcademicData,
} from "@/lib/types";

type TabType = "TODAY" | "NEXT" | "LATER";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("TODAY");
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const {
    data: todayResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["mobile-today"],
    queryFn: () => apiGet<{ success: boolean; data: MobileAdaptiveTodayWorkspaceData }>("/api/mobile/today"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: academicsRes } = useQuery({
    queryKey: ["mobile-dashboard-academics"],
    queryFn: () => apiGet<{ success: boolean; academics: MobileAcademicData }>("/api/mobile/academics"),
    staleTime: 1000 * 60 * 5,
  });
  const academicData = academicsRes?.academics;

  const { data: profileRes } = useQuery({
    queryKey: ["mobile-dashboard-profile"],
    queryFn: () => apiGet<{ success: boolean; profileCompletion?: number }>("/api/mobile/user/profile"),
    staleTime: 1000 * 60 * 5,
  });
  const profileCompletion = profileRes?.profileCompletion ?? 75;

  const { data: activeFocusRes, refetch: refetchActiveFocus } = useQuery({
    queryKey: ["mobile-active-focus"],
    queryFn: () =>
      apiGet<{ success: boolean; activeSession: MobileActiveFocusSession | null }>(
        "/api/study-sessions/active"
      ),
    staleTime: 1000 * 15, // 15 seconds
  });

  const activeFocusSession = activeFocusRes?.activeSession || null;

  const handleStartFocus = (task: MobileTodayActionItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/focus-session",
      params: {
        id: task.id,
        title: task.title,
        courseId: task.courseId || "",
        courseCode: task.courseCode,
        courseName: task.courseName,
        courseColor: task.courseColor,
        estimatedMinutes: task.estimatedMinutes.toString(),
        entityType: task.entityType,
      },
    });
  };

  const workspace = todayResponse?.data;

  if (isLoading) {
    return (
      <Screen scrollable>
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (isError || !workspace) {
    return (
      <Screen style={styles.centerContainer}>
        <ErrorState
          title="Today Workspace Unavailable"
          message={
            (error as any)?.message ||
            "Unable to connect to your UniMate academic workspace."
          }
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const { capacity, attention, today, next, later, completedToday, emptyState } = workspace;

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleTaskPress = (actionHref: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (actionHref.includes("assignments")) router.push("/assignments" as any);
    else if (actionHref.includes("exams")) router.push("/exams" as any);
    else if (actionHref.includes("academics")) router.push("/academics" as any);
    else if (actionHref.includes("timetable")) router.push("/calendar" as any);
  };

  const getUrgencyBadge = (tier: MobileTodayActionItem["urgencyTier"]) => {
    switch (tier) {
      case "OVERDUE":
        return { bg: colors.destructiveSubtle, text: colors.destructive, border: colors.destructive };
      case "CRITICAL":
        return { bg: colors.warningSubtle, text: colors.warning, border: colors.warning };
      case "HIGH":
        return { bg: colors.accentSubtle, text: colors.accent, border: colors.accent };
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary, border: colors.border };
    }
  };

  return (
    <Screen
      scrollable
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── 1. Top Header with Student Identity ────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            activeOpacity={0.8}
            style={styles.avatarButton}
            accessibilityRole="button"
            accessibilityLabel="View profile settings"
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.headerAvatar}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <AvatarFallback name={user?.name} size={42} />
            )}
          </TouchableOpacity>

          <View style={styles.headerTitleMeta}>
            <AppText variant="h3" style={styles.greetingTitle}>
              Today's Plan,{" "}
              <AppText variant="h3" colorRole="accent">
                {user?.name?.split(" ")[0] || "Student"}
              </AppText>
            </AppText>

            {user?.university ? (
              <View style={styles.affiliationRow}>
                <Ionicons
                  name={user.university.isVerified ? "checkmark-circle" : "school-outline"}
                  size={12}
                  color={user.university.isVerified ? colors.accent : colors.textTertiary}
                />
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={{ color: colors.textSecondary }}
                >
                  {user.university.shortName || user.university.name}
                </AppText>
                {user.currentSemester ? (
                  <View
                    style={[
                      styles.semesterPill,
                      { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{ color: colors.textSecondary, fontSize: 10, fontWeight: "600" }}
                    >
                      {user.currentSemester}
                    </AppText>
                  </View>
                ) : null}
              </View>
            ) : (
              <AppText colorRole="tertiary" variant="caption">
                {workspace.dateString}
              </AppText>
            )}
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[
              styles.completionPill,
              {
                backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
                borderColor: `${colors.accent}30`,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Profile completion: ${profileCompletion}%`}
          >
            <Ionicons name="sparkles" size={12} color={colors.accent} />
            <AppText style={[styles.completionText, { color: colors.accent }]}>
              {profileCompletion}%
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Attention Alerts (Immediate Urgency) ────────────────── */}
      <MobileAttentionBanner
        items={attention.items}
        attendanceWarning={attention.attendanceWarning}
        timetableConflictCount={attention.timetableConflictCount}
      />

      {/* ── 2b. Fintech Academic KPI Strip ───────────────────────── */}
      <MobileDashboardKpiStrip
        gpa={academicData?.gpaString}
        attendance={academicData?.attendanceString}
        plannedMinutes={capacity.allocatedWorkMinutes}
        tasksCount={today.allocatedTasks.length}
        onPressGpa={() => router.push("/academics" as any)}
        onPressAttendance={() => router.push("/academics" as any)}
        onPressTasks={() => handleTabChange("TODAY")}
      />

      {/* ── 3. Segmented Control: Today | Next | Later ─────────────── */}
      <View style={[styles.segmentedContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <TouchableOpacity
          onPress={() => handleTabChange("TODAY")}
          style={[
            styles.segmentButton,
            activeTab === "TODAY" && [
              styles.segmentActive,
              { backgroundColor: colors.surface, shadowColor: "#000" },
            ],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "TODAY" }}
        >
          <AppText
            variant="label"
            colorRole={activeTab === "TODAY" ? "accent" : "secondary"}
            style={styles.segmentText}
          >
            Today ({today.allocatedTasks.length})
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange("NEXT")}
          style={[
            styles.segmentButton,
            activeTab === "NEXT" && [
              styles.segmentActive,
              { backgroundColor: colors.surface, shadowColor: "#000" },
            ],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "NEXT" }}
        >
          <AppText
            variant="label"
            colorRole={activeTab === "NEXT" ? "accent" : "secondary"}
            style={styles.segmentText}
          >
            Next ({next.length})
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange("LATER")}
          style={[
            styles.segmentButton,
            activeTab === "LATER" && [
              styles.segmentActive,
              { backgroundColor: colors.surface, shadowColor: "#000" },
            ],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "LATER" }}
        >
          <AppText
            variant="label"
            colorRole={activeTab === "LATER" ? "accent" : "secondary"}
            style={styles.segmentText}
          >
            Later ({later.length})
          </AppText>
        </TouchableOpacity>
      </View>

      {/* ── TAB: TODAY ─────────────────────────────────────────────── */}
      {activeTab === "TODAY" && (
        <View style={styles.tabContent}>
          {/* Capacity Guardrail Header Card */}
          <Card
            style={[
              styles.capacityCard,
              {
                backgroundColor: capacity.isOverCapacity
                  ? colors.warningSubtle
                  : colors.accentSubtle,
                borderColor: capacity.isOverCapacity ? colors.warning : colors.accent,
              },
            ]}
          >
            <View style={styles.capacityHeader}>
              <Ionicons
                name={capacity.isOverCapacity ? "alert-circle" : "time"}
                size={16}
                color={capacity.isOverCapacity ? colors.warning : colors.accent}
              />
              <AppText
                variant="label"
                style={{
                  color: capacity.isOverCapacity ? colors.warning : colors.accent,
                  fontWeight: "700",
                }}
              >
                CAPACITY: ~{Math.round(capacity.allocatedWorkMinutes / 60)}h PLANNED / ~{(capacity.availableStudyMinutes / 60).toFixed(1)}h FREE
              </AppText>
            </View>
            <AppText variant="caption" style={{ color: colors.textPrimary, marginTop: 4 }}>
              {capacity.notice}
            </AppText>
          </Card>

          {/* Today's Schedule & Study Gaps Timeline */}
          <MobileTodayTimeline
            schedule={today.schedule}
            dayName={workspace.dayName}
          />

          {/* Allocated Focus Tasks Queue */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flash" size={18} color={colors.accent} />
              <AppText variant="h3">Recommended Focus Queue</AppText>
            </View>
            <AppText colorRole="tertiary" variant="caption">
              {today.allocatedTasks.length} task{today.allocatedTasks.length !== 1 ? "s" : ""}
            </AppText>
          </View>

          {today.allocatedTasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <AppText variant="bodyMedium" style={{ marginTop: 6, fontWeight: "600" }}>
                All caught up for today!
              </AppText>
              <AppText colorRole="secondary" variant="caption" align="center">
                No urgent deadlines or imminent exams requiring today's focus.
              </AppText>
            </Card>
          ) : (
            <View style={styles.taskList}>
              {today.allocatedTasks.map((task, idx) => {
                const badge = getUrgencyBadge(task.urgencyTier);

                return (
                  <TouchableOpacity
                    key={task.id}
                    activeOpacity={0.8}
                    onPress={() => handleTaskPress(task.actionHref)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${task.title}`}
                  >
                    <Card style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <View style={styles.badgeRow}>
                          <AppText colorRole="tertiary" variant="caption" style={{ fontWeight: "700" }}>
                            #{idx + 1}
                          </AppText>
                          <View
                            style={[
                              styles.pillBadge,
                              { backgroundColor: badge.bg, borderColor: badge.border },
                            ]}
                          >
                            <AppText
                              variant="label"
                              style={{ color: badge.text, fontSize: 10, fontWeight: "700" }}
                            >
                              {task.deadlineLabel}
                            </AppText>
                          </View>
                          <AppText colorRole="secondary" variant="caption" style={{ fontWeight: "600" }}>
                            {task.courseCode}
                          </AppText>
                        </View>
                        <AppText colorRole="tertiary" variant="caption">
                          {task.estimatedLabel}
                        </AppText>
                      </View>

                      <AppText variant="bodyMedium" numberOfLines={1} style={styles.taskTitle}>
                        {task.title}
                      </AppText>

                      <AppText colorRole="secondary" variant="caption" numberOfLines={1}>
                        {task.reason}
                      </AppText>

                      <View style={styles.taskActionRow}>
                        <TouchableOpacity
                          onPress={() => handleStartFocus(task)}
                          activeOpacity={0.8}
                          style={[styles.focusPillButton, { backgroundColor: `${colors.accent}15`, borderColor: `${colors.accent}40` }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Start focus on ${task.title}`}
                        >
                          <Ionicons name="flash" size={12} color={colors.accent} style={{ marginRight: 4 }} />
                          <AppText style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>
                            Focus
                          </AppText>
                        </TouchableOpacity>

                        <AppText colorRole="accent" variant="caption" style={{ fontWeight: "700" }}>
                          {task.actionLabel} →
                        </AppText>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Completed Today (Reflection Card) */}
          {completedToday.count > 0 && (
            <Card
              style={[
                styles.completedCard,
                { backgroundColor: colors.successSubtle, borderColor: colors.success },
              ]}
            >
              <TouchableOpacity
                onPress={() => setCompletedExpanded(!completedExpanded)}
                activeOpacity={0.8}
                style={styles.completedHeader}
              >
                <View style={styles.completedHeaderLeft}>
                  <Ionicons name="checkmark-done-circle" size={20} color={colors.success} />
                  <AppText variant="bodyMedium" style={{ fontWeight: "700", color: colors.success }}>
                    Completed Today ({completedToday.count})
                  </AppText>
                </View>
                <Ionicons
                  name={completedExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.success}
                />
              </TouchableOpacity>

              {completedExpanded && (
                <View style={styles.completedList}>
                  {completedToday.items.map((c) => (
                    <View key={c.id} style={styles.completedItemRow}>
                      <Ionicons name="checkmark" size={14} color={colors.success} />
                      <AppText
                        variant="caption"
                        style={{ textDecorationLine: "line-through", color: colors.textSecondary }}
                      >
                        {c.title} ({c.courseCode})
                      </AppText>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}
        </View>
      )}

      {/* ── TAB: NEXT ──────────────────────────────────────────────── */}
      {activeTab === "NEXT" && (
        <View style={styles.tabContent}>
          <AppText colorRole="secondary" variant="caption" style={styles.tabSubtitle}>
            Upcoming work in days 2 to 5 or deferred from today.
          </AppText>

          {next.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar" size={28} color={colors.textTertiary} />
              <AppText variant="bodyMedium" style={{ marginTop: 4 }}>
                No work upcoming in days 2–5
              </AppText>
            </Card>
          ) : (
            <View style={styles.taskList}>
              {next.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleTaskPress(item.actionHref)}
                >
                  <Card key={item.id} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <AppText colorRole="accent" variant="label" style={{ fontWeight: "700" }}>
                        {item.courseCode}
                      </AppText>
                      <AppText colorRole="tertiary" variant="caption">
                        {item.deadlineLabel} • {item.estimatedLabel}
                      </AppText>
                    </View>
                    <AppText variant="bodyMedium" numberOfLines={1} style={styles.taskTitle}>
                      {item.title}
                    </AppText>
                    {item.deferredReason ? (
                      <AppText variant="caption" style={{ color: colors.warning, marginTop: 2 }}>
                        • {item.deferredReason}
                      </AppText>
                    ) : null}
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── TAB: LATER ─────────────────────────────────────────────── */}
      {activeTab === "LATER" && (
        <View style={styles.tabContent}>
          <AppText colorRole="secondary" variant="caption" style={styles.tabSubtitle}>
            Future backlog tasks, exams beyond 7 days, and long-range goals.
          </AppText>

          {later.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="albums-outline" size={28} color={colors.textTertiary} />
              <AppText variant="bodyMedium" style={{ marginTop: 4 }}>
                No long-range backlog tasks
              </AppText>
            </Card>
          ) : (
            <View style={styles.taskList}>
              {later.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleTaskPress(item.actionHref)}
                >
                  <Card key={item.id} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <AppText colorRole="secondary" variant="label" style={{ fontWeight: "600" }}>
                        {item.courseCode}
                      </AppText>
                      <AppText colorRole="tertiary" variant="caption">
                        {item.deadlineLabel}
                      </AppText>
                    </View>
                    <AppText variant="bodyMedium" numberOfLines={1} style={styles.taskTitle}>
                      {item.title}
                    </AppText>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Active Focus Session Floating Mini-Bar ── */}
      <MobileActiveFocusBar
        activeSession={activeFocusSession}
        onRefresh={refetchActiveFocus}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarButton: {
    borderRadius: 22,
    overflow: "hidden",
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerTitleMeta: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  affiliationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  semesterPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  completionText: {
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  segmentActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontWeight: "600",
  },
  tabContent: {
    gap: 12,
  },
  tabSubtitle: {
    marginBottom: 4,
  },
  capacityCard: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  capacityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  taskTitle: {
    fontWeight: "700",
    marginTop: 2,
  },
  taskActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  focusPillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  completedCard: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: 12,
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completedList: {
    marginTop: 10,
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  completedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
