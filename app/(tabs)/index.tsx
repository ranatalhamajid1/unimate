/**
 * UniMate Mobile Command Center Dashboard.
 * 100% database-backed real student intelligence layer.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { apiGet } from "@/lib/api-client";
import { MobileDashboardData } from "@/lib/types";
import { BorderRadius } from "@/constants/layout";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["mobile-dashboard"],
    queryFn: () => apiGet<MobileDashboardData>("/api/mobile/dashboard"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  if (isLoading) {
    return (
      <Screen style={styles.centerContainer}>
        <LoadingState message="Loading your Command Center..." />
      </Screen>
    );
  }

  if (isError || !dashboard) {
    return (
      <Screen style={styles.centerContainer}>
        <ErrorState
          title="Command Center Unavailable"
          message={
            (error as any)?.message ||
            "Unable to connect to your UniMate academic database."
          }
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const {
    greeting,
    dateString,
    unreadNotificationCount,
    subscription,
    stats,
    priorities,
    todaySchedule,
    upcomingAssignments,
    nextExam,
    activeStudyPlan,
    academicInsights,
    goals,
    weeklyStudyProgress,
  } = dashboard;

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { bg: colors.destructiveSubtle, text: colors.destructive, border: colors.destructive };
      case "HIGH":
        return { bg: colors.warningSubtle, text: colors.warning, border: colors.warning };
      case "MEDIUM":
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
      {/* ── 1. Top Header ────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <AppText colorRole="secondary" variant="caption">
            {dateString}
          </AppText>
          <View style={styles.nameRow}>
            <AppText variant="h2" style={styles.greetingTitle}>
              {greeting},{" "}
              <AppText variant="h2" colorRole="accent">
                {user?.name?.split(" ")[0] || "Student"}
              </AppText>
            </AppText>
          </View>
        </View>

        <View style={styles.topActions}>
          {/* Plan badge */}
          <View
            style={[
              styles.planBadge,
              {
                backgroundColor: subscription.isPro
                  ? colors.accentSubtle
                  : colors.surfaceSecondary,
                borderColor: subscription.isPro ? colors.accent : colors.border,
              },
            ]}
          >
            <AppText
              variant="label"
              colorRole={subscription.isPro ? "accent" : "secondary"}
              style={styles.planText}
            >
              {subscription.plan}
            </AppText>
          </View>

          {/* Notifications Button with unread badge */}
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Notifications (${unreadNotificationCount} unread)`}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textPrimary}
            />
            {unreadNotificationCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  { backgroundColor: colors.destructive },
                ]}
              >
                <AppText style={styles.badgeCount}>
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </AppText>
              </View>
            )}
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Daily Priorities Section (Intelligence Layer) ──────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Ionicons name="flash" size={18} color={colors.accent} />
            <AppText variant="h3" style={styles.sectionTitle}>
              Daily Priorities
            </AppText>
          </View>
          {priorities.criticalCount > 0 && (
            <View
              style={[
                styles.criticalBadge,
                { backgroundColor: colors.destructiveSubtle },
              ]}
            >
              <AppText variant="caption" colorRole="destructive" style={styles.boldText}>
                {priorities.criticalCount} Critical
              </AppText>
            </View>
          )}
        </View>

        {priorities.items.length === 0 || priorities.isCaughtUp ? (
          <Card style={styles.caughtUpCard}>
            <View style={styles.caughtUpContent}>
              <View
                style={[
                  styles.caughtUpIcon,
                  { backgroundColor: colors.successSubtle },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              </View>
              <View style={styles.caughtUpText}>
                <AppText variant="bodyMedium">All caught up!</AppText>
                <AppText colorRole="secondary" variant="caption">
                  No urgent deadlines, exam alerts, or attendance warnings.
                </AppText>
              </View>
            </View>
          </Card>
        ) : (
          <View style={styles.priorityList}>
            {priorities.items.map((priority) => {
              const badge = getSeverityBadgeColor(priority.severity);
              return (
                <Card key={priority.id} style={styles.priorityCard}>
                  <View style={styles.priorityHeader}>
                    <View
                      style={[
                        styles.severityPill,
                        { backgroundColor: badge.bg, borderColor: badge.border },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={[styles.severityText, { color: badge.text }]}
                      >
                        {priority.severity}
                      </AppText>
                    </View>
                    {Boolean(priority.courseCode) && (
                      <AppText colorRole="secondary" variant="caption" style={styles.courseTag}>
                        {priority.courseCode}
                      </AppText>
                    )}
                  </View>
                  <AppText variant="bodyMedium" style={styles.priorityTitle}>
                    {priority.title}
                  </AppText>
                  <AppText colorRole="secondary" variant="caption">
                    {priority.description}
                  </AppText>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {/* ── 3. Overview Stat Cards ───────────────────────────────────── */}
      <View style={styles.statsGrid}>
        {/* GPA Card */}
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="ribbon-outline" size={16} color={colors.accent} />
            <AppText variant="label" colorRole="tertiary">
              GPA
            </AppText>
          </View>
          <AppText variant="h2" colorRole="accent" style={styles.statValue}>
            {stats.gpa.value}
          </AppText>
          <AppText colorRole="secondary" variant="caption" numberOfLines={1}>
            {stats.gpa.sub}
          </AppText>
        </Card>

        {/* Attendance Card */}
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="checkmark-done-circle-outline" size={16} color={colors.success} />
            <AppText variant="label" colorRole="tertiary">
              Attendance
            </AppText>
          </View>
          <AppText variant="h2" colorRole="success" style={styles.statValue}>
            {stats.attendance.value}
          </AppText>
          <AppText colorRole="secondary" variant="caption" numberOfLines={1}>
            {stats.attendance.sub}
          </AppText>
        </Card>

        {/* Assignments Due */}
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="document-text-outline" size={16} color={colors.warning} />
            <AppText variant="label" colorRole="tertiary">
              Due This Week
            </AppText>
          </View>
          <AppText variant="h2" style={styles.statValue}>
            {stats.assignmentsDue.count}
          </AppText>
          <AppText colorRole="secondary" variant="caption" numberOfLines={1}>
            {stats.assignmentsDue.sub}
          </AppText>
        </Card>

        {/* Study Hours */}
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="time-outline" size={16} color={colors.accent} />
            <AppText variant="label" colorRole="tertiary">
              Study Hours
            </AppText>
          </View>
          <AppText variant="h2" style={styles.statValue}>
            {stats.studyHours.formatted}
          </AppText>
          <AppText colorRole="secondary" variant="caption" numberOfLines={1}>
            {stats.studyHours.sub}
          </AppText>
        </Card>
      </View>

      {/* ── 4. Today's Schedule ──────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent} />
            <AppText variant="h3" style={styles.sectionTitle}>
              Today's Schedule
            </AppText>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/schedule")}>
            <AppText colorRole="accent" variant="caption" style={styles.boldText}>
              View All
            </AppText>
          </TouchableOpacity>
        </View>

        {todaySchedule.length === 0 ? (
          <Card style={styles.emptyScheduleCard}>
            <Ionicons name="sunny-outline" size={28} color={colors.textTertiary} />
            <AppText variant="bodyMedium" style={styles.emptyTitle}>
              No classes scheduled for today
            </AppText>
            <AppText colorRole="secondary" variant="caption" align="center">
              Enjoy your free day or use this time for structured study sessions.
            </AppText>
          </Card>
        ) : (
          <View style={styles.scheduleList}>
            {todaySchedule.map((cls) => (
              <Card key={cls.id} style={styles.classCard}>
                <View style={styles.classTimeBox}>
                  <AppText variant="bodyMedium" style={styles.classTimeText}>
                    {cls.startTime}
                  </AppText>
                  <AppText colorRole="secondary" variant="caption">
                    {cls.endTime}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.classColorStrip,
                    { backgroundColor: cls.color || colors.accent },
                  ]}
                />
                <View style={styles.classDetails}>
                  <View style={styles.classHeader}>
                    <AppText variant="bodyMedium" numberOfLines={1} style={styles.className}>
                      {cls.code ? `${cls.code} · ${cls.name}` : cls.name}
                    </AppText>
                    <View style={[styles.classTypeBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <AppText variant="label" colorRole="secondary" style={styles.classType}>
                        {cls.type}
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.roomRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                    <AppText colorRole="secondary" variant="caption" style={styles.roomText}>
                      {cls.room}
                    </AppText>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* ── 5. Active Study Plan Tasks (if present) ─────────────────── */}
      {activeStudyPlan && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <Ionicons name="checkbox-outline" size={18} color={colors.accent} />
              <AppText variant="h3" style={styles.sectionTitle}>
                {activeStudyPlan.title}
              </AppText>
            </View>
            <AppText colorRole="secondary" variant="caption">
              {activeStudyPlan.completedItems}/{activeStudyPlan.totalItems} done
            </AppText>
          </View>

          <Card style={styles.planCard}>
            {/* Progress bar */}
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${
                      activeStudyPlan.totalItems > 0
                        ? (activeStudyPlan.completedItems / activeStudyPlan.totalItems) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>

            <View style={styles.taskList}>
              {activeStudyPlan.items.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.taskRow}>
                  <Ionicons
                    name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={item.completed ? colors.success : colors.textTertiary}
                  />
                  <View style={styles.taskText}>
                    <AppText
                      variant="body"
                      style={[
                        item.completed && {
                          textDecorationLine: "line-through",
                          color: colors.textTertiary,
                        },
                      ]}
                    >
                      {item.title}
                    </AppText>
                    <AppText colorRole="secondary" variant="caption">
                      {item.duration} mins {item.courseName ? `· ${item.courseName}` : ""}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}

      {/* ── 6. Next Upcoming Exam Countdown ──────────────────────────── */}
      {nextExam && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <Ionicons name="alarm-outline" size={18} color={colors.warning} />
              <AppText variant="h3" style={styles.sectionTitle}>
                Next Exam
              </AppText>
            </View>
          </View>

          <Card style={styles.examCard}>
            <View style={styles.examTopRow}>
              <View style={styles.examTitleBlock}>
                <View
                  style={[
                    styles.examTypeBadge,
                    { backgroundColor: colors.warningSubtle },
                  ]}
                >
                  <AppText variant="label" colorRole="warning">
                    {nextExam.type}
                  </AppText>
                </View>
                <AppText variant="h3" style={styles.examTitle}>
                  {nextExam.title}
                </AppText>
                <AppText colorRole="secondary" variant="body">
                  {nextExam.courseCode} · {nextExam.courseName}
                </AppText>
              </View>

              <View
                style={[
                  styles.countdownBadge,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <AppText variant="h2" colorRole="warning" style={styles.countdownDays}>
                  {nextExam.daysRemaining}
                </AppText>
                <AppText variant="label" colorRole="secondary" style={styles.countdownLabel}>
                  {nextExam.daysRemaining === 1 ? "day left" : "days left"}
                </AppText>
              </View>
            </View>

            <View style={styles.examDetailsRow}>
              <View style={styles.examDetail}>
                <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                <AppText colorRole="secondary" variant="caption">
                  {nextExam.date} at {nextExam.time}
                </AppText>
              </View>
              <View style={styles.examDetail}>
                <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                <AppText colorRole="secondary" variant="caption">
                  {nextExam.room}
                </AppText>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ── 7. Upcoming Assignments ─────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Ionicons name="document-text-outline" size={18} color={colors.accent} />
            <AppText variant="h3" style={styles.sectionTitle}>
              Upcoming Assignments
            </AppText>
          </View>
          <AppText colorRole="secondary" variant="caption">
            {upcomingAssignments.length} pending
          </AppText>
        </View>

        {upcomingAssignments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-done" size={24} color={colors.success} />
            <AppText variant="bodyMedium" style={styles.emptyTitle}>
              No upcoming assignments
            </AppText>
            <AppText colorRole="secondary" variant="caption">
              All coursework submissions are up to date.
            </AppText>
          </Card>
        ) : (
          <View style={styles.assignmentList}>
            {upcomingAssignments.map((assignment) => (
              <Card key={assignment.id} style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <AppText colorRole="secondary" variant="caption">
                    {assignment.courseCode || assignment.courseName}
                  </AppText>
                  <View
                    style={[
                      styles.dueSoonBadge,
                      {
                        backgroundColor: assignment.dueSoon
                          ? colors.destructiveSubtle
                          : colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <AppText
                      variant="label"
                      colorRole={assignment.dueSoon ? "destructive" : "secondary"}
                      style={styles.dueSoonText}
                    >
                      {assignment.dueLabel}
                    </AppText>
                  </View>
                </View>
                <AppText variant="bodyMedium" style={styles.assignmentTitle}>
                  {assignment.title}
                </AppText>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* ── 8. Academic Goals ─────────────────────────────────────────── */}
      {goals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <Ionicons name="flag-outline" size={18} color={colors.accent} />
              <AppText variant="h3" style={styles.sectionTitle}>
                Academic Goals
              </AppText>
            </View>
          </View>

          <Card style={styles.goalsCard}>
            {goals.map((g, idx) => (
              <View
                key={g.type}
                style={[
                  styles.goalRow,
                  idx !== goals.length - 1 && {
                    borderBottomColor: colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    paddingBottom: 12,
                    marginBottom: 12,
                  },
                ]}
              >
                <View style={styles.goalInfo}>
                  <AppText variant="bodyMedium">{g.label}</AppText>
                  <AppText colorRole="secondary" variant="caption">
                    Current: {g.currentValue} / Target: {g.targetValue} {g.unit}
                  </AppText>
                </View>
                <View style={styles.goalPercentBlock}>
                  <AppText variant="bodyMedium" colorRole="accent" style={styles.boldText}>
                    {Math.round(g.percentage)}%
                  </AppText>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* ── 9. Academic Insights ─────────────────────────────────────── */}
      {academicInsights.length > 0 && (
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <Ionicons name="bulb-outline" size={18} color={colors.warning} />
              <AppText variant="h3" style={styles.sectionTitle}>
                Academic Insights
              </AppText>
            </View>
          </View>

          <View style={styles.insightsList}>
            {academicInsights.map((insight) => (
              <Card key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color={
                      insight.severity === "CRITICAL" || insight.severity === "WARNING"
                        ? colors.warning
                        : colors.accent
                    }
                  />
                  <AppText variant="bodyMedium" style={styles.insightTitle}>
                    {insight.title}
                  </AppText>
                </View>
                <AppText colorRole="secondary" variant="caption">
                  {insight.description}
                </AppText>
              </Card>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  nameRow: {
    marginTop: 2,
  },
  greetingTitle: {
    letterSpacing: -0.4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  planText: {
    fontWeight: "700",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCount: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    letterSpacing: -0.3,
  },
  boldText: {
    fontWeight: "600",
  },
  criticalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  caughtUpCard: {
    padding: 16,
  },
  caughtUpContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  caughtUpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  caughtUpText: {
    flex: 1,
  },
  priorityList: {
    gap: 10,
  },
  priorityCard: {
    padding: 14,
  },
  priorityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  severityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  severityText: {
    fontWeight: "700",
  },
  courseTag: {
    fontWeight: "500",
  },
  priorityTitle: {
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: "48.5%",
    padding: 14,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statValue: {
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  emptyScheduleCard: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    marginTop: 4,
    fontWeight: "600",
  },
  scheduleList: {
    gap: 10,
  },
  classCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  classTimeBox: {
    width: 58,
    alignItems: "flex-start",
  },
  classTimeText: {
    fontWeight: "600",
  },
  classColorStrip: {
    width: 3.5,
    height: "100%",
    borderRadius: 2,
    marginHorizontal: 12,
  },
  classDetails: {
    flex: 1,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  className: {
    flex: 1,
    marginRight: 8,
  },
  classTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  classType: {
    fontSize: 9,
    textTransform: "capitalize",
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roomText: {
    fontSize: 12,
  },
  planCard: {
    padding: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  taskList: {
    gap: 10,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  taskText: {
    flex: 1,
  },
  examCard: {
    padding: 16,
  },
  examTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  examTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  examTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginBottom: 6,
  },
  examTitle: {
    marginBottom: 2,
  },
  countdownBadge: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 64,
  },
  countdownDays: {
    lineHeight: 28,
  },
  countdownLabel: {
    fontSize: 9,
  },
  examDetailsRow: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
    paddingTop: 10,
  },
  examDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  emptyCard: {
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  assignmentList: {
    gap: 10,
  },
  assignmentCard: {
    padding: 14,
  },
  assignmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dueSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  dueSoonText: {
    fontSize: 9,
  },
  assignmentTitle: {
    fontWeight: "500",
  },
  goalsCard: {
    padding: 16,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalInfo: {
    flex: 1,
  },
  goalPercentBlock: {
    marginLeft: 12,
  },
  insightsList: {
    gap: 10,
  },
  insightCard: {
    padding: 14,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  insightTitle: {
    fontWeight: "600",
  },
});
