import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { triggerSelectionFeedback } from "@/lib/haptics";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type {
  MobileWeeklyReviewData,
  MobileScorecardRating,
} from "@/lib/types";

export default function WeeklyReviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState<number>(-1); // default to last completed week

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<MobileWeeklyReviewData>({
    queryKey: ["weekly-review", weekOffset],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: MobileWeeklyReviewData }>(
        `/api/mobile/intelligence/weekly-review?weekOffset=${weekOffset}`
      );
      return res.data;
    },
  });

  const handlePrevWeek = () => {
    triggerSelectionFeedback();
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    if (weekOffset >= 0) return;
    triggerSelectionFeedback();
    setWeekOffset((prev) => prev + 1);
  };

  const getRatingVariant = (rating: MobileScorecardRating): "success" | "neutral" | "warning" => {
    switch (rating) {
      case "STRONG":
        return "success";
      case "ON_TRACK":
        return "neutral";
      case "NEEDS_ATTENTION":
        return "warning";
      default:
        return "neutral";
    }
  };

  const getRatingLabel = (rating: MobileScorecardRating): string => {
    switch (rating) {
      case "STRONG":
        return "Strong";
      case "ON_TRACK":
        return "On Track";
      case "NEEDS_ATTENTION":
        return "Attention";
      default:
        return "No Data";
    }
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Weekly Review",
          headerBackTitle: "Back",
        }}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Week Selector Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={handlePrevWeek}
            activeOpacity={0.7}
            style={[styles.navBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.weekTitleBox}>
            <AppText variant="h3" style={{ fontWeight: "700" }}>
              {data?.weekLabel || "Weekly Debrief"}
            </AppText>
            <AppText variant="caption" colorRole="secondary">
              {weekOffset === 0 ? "Current Week" : `Completed Week (${weekOffset})`}
            </AppText>
          </View>

          <TouchableOpacity
            onPress={handleNextWeek}
            activeOpacity={0.7}
            disabled={weekOffset >= 0}
            style={[
              styles.navBtn,
              { borderColor: colors.border, opacity: weekOffset >= 0 ? 0.3 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Next week"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <LoadingState message="Calculating weekly performance metrics..." />
        ) : isError || !data ? (
          <ErrorState message="Could not load weekly review." onRetry={refetch} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {/* Overall Grade Banner */}
            <Card style={styles.gradeCard}>
              <View style={styles.gradeRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="school" size={16} color={colors.primary} />
                    <AppText variant="caption" style={{ fontWeight: "700", color: colors.primary }}>
                      ACADEMIC PERFORMANCE
                    </AppText>
                  </View>
                  <AppText variant="h2" style={{ fontWeight: "800", marginTop: 4 }}>
                    Overall Grade: {data.scorecard.overallGrade}
                  </AppText>
                  <AppText variant="caption" colorRole="secondary" style={{ marginTop: 2 }}>
                    {(data.metrics.totalFocusMinutes / 60).toFixed(1)}h focus • {data.metrics.attendanceRate}% attendance • {data.metrics.assignmentsCompleted} deliverables done
                  </AppText>
                </View>
              </View>
            </Card>

            {/* AI Executive Coach Summary */}
            {Boolean(data.aiExecutiveSummary) && (
              <Card style={[styles.aiCard, { borderColor: colors.accent }]}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={16} color={colors.accent} />
                  <AppText variant="caption" style={{ fontWeight: "700", color: colors.accent }}>
                    ACADEMIC COACH DEBRIEF
                  </AppText>
                </View>
                <AppText variant="body" style={{ marginTop: 6, lineHeight: 20 }}>
                  {data.aiExecutiveSummary}
                </AppText>
              </Card>
            )}

            {/* 4-Dimension Scorecard */}
            <View>
              <AppText variant="caption" style={styles.sectionHeader}>
                4-DIMENSION SCORECARD
              </AppText>
              <View style={styles.scorecardGrid}>
                {/* 1. Execution */}
                <Card style={styles.scoreCard}>
                  <View style={styles.scoreHeader}>
                    <AppText variant="caption" style={{ fontWeight: "700" }}>Execution</AppText>
                    <StatusChip
                      label={getRatingLabel(data.scorecard.execution.rating)}
                      variant={getRatingVariant(data.scorecard.execution.rating)}
                      size="sm"
                    />
                  </View>
                  <AppText variant="h3" style={{ fontWeight: "800", marginTop: 4 }}>
                    {data.scorecard.execution.scorePercentage}%
                  </AppText>
                  <AppText variant="caption" colorRole="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
                    {data.scorecard.execution.summary}
                  </AppText>
                </Card>

                {/* 2. Planning */}
                <Card style={styles.scoreCard}>
                  <View style={styles.scoreHeader}>
                    <AppText variant="caption" style={{ fontWeight: "700" }}>Planning</AppText>
                    <StatusChip
                      label={getRatingLabel(data.scorecard.planning.rating)}
                      variant={getRatingVariant(data.scorecard.planning.rating)}
                      size="sm"
                    />
                  </View>
                  <AppText variant="h3" style={{ fontWeight: "800", marginTop: 4 }}>
                    {data.scorecard.planning.scorePercentage}%
                  </AppText>
                  <AppText variant="caption" colorRole="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
                    {data.scorecard.planning.summary}
                  </AppText>
                </Card>

                {/* 3. Focus */}
                <Card style={styles.scoreCard}>
                  <View style={styles.scoreHeader}>
                    <AppText variant="caption" style={{ fontWeight: "700" }}>Focus</AppText>
                    <StatusChip
                      label={getRatingLabel(data.scorecard.focus.rating)}
                      variant={getRatingVariant(data.scorecard.focus.rating)}
                      size="sm"
                    />
                  </View>
                  <AppText variant="h3" style={{ fontWeight: "800", marginTop: 4 }}>
                    {(data.metrics.totalFocusMinutes / 60).toFixed(1)}h
                  </AppText>
                  <AppText variant="caption" colorRole="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
                    {data.scorecard.focus.summary}
                  </AppText>
                </Card>

                {/* 4. Academic Health */}
                <Card style={styles.scoreCard}>
                  <View style={styles.scoreHeader}>
                    <AppText variant="caption" style={{ fontWeight: "700" }}>Attendance</AppText>
                    <StatusChip
                      label={getRatingLabel(data.scorecard.academicHealth.rating)}
                      variant={getRatingVariant(data.scorecard.academicHealth.rating)}
                      size="sm"
                    />
                  </View>
                  <AppText variant="h3" style={{ fontWeight: "800", marginTop: 4 }}>
                    {data.metrics.attendanceRate}%
                  </AppText>
                  <AppText variant="caption" colorRole="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
                    {data.scorecard.academicHealth.summary}
                  </AppText>
                </Card>
              </View>
            </View>

            {/* Strategic Recommendations */}
            {data.recommendations.length > 0 && (
              <View>
                <AppText variant="caption" style={styles.sectionHeader}>
                  NEXT-WEEK STRATEGY
                </AppText>
                <Card style={{ padding: spacing.md, gap: spacing.sm }}>
                  {data.recommendations.map((rec, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      <AppText variant="body" style={{ flex: 1, fontSize: 13 }}>
                        {rec}
                      </AppText>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={() => router.push("/study-plans")}
                    activeOpacity={0.8}
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel="Open study planner"
                  >
                    <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                    <AppText variant="caption" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      Plan Next Week
                    </AppText>
                  </TouchableOpacity>
                </Card>
              </View>
            )}

            {/* Course Performance Breakdown */}
            {data.courseSummaries.length > 0 && (
              <View>
                <AppText variant="caption" style={styles.sectionHeader}>
                  COURSE BREAKDOWN
                </AppText>
                {data.courseSummaries.map((c) => (
                  <Card key={c.courseId} style={styles.courseCard}>
                    <View style={styles.courseHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: c.courseColor || colors.primary },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <AppText variant="body" style={{ fontWeight: "700" }}>
                            {c.courseCode}
                          </AppText>
                          <AppText variant="caption" colorRole="secondary" numberOfLines={1}>
                            {c.courseName}
                          </AppText>
                        </View>
                      </View>
                      {c.grade && (
                        <View style={{ alignItems: "flex-end" }}>
                          <StatusChip
                            label={`${c.grade.letter} (${c.grade.points})`}
                            variant="neutral"
                            size="sm"
                          />
                          <AppText variant="caption" colorRole="tertiary" style={{ fontSize: 9, marginTop: 2 }}>
                            Current Academic GPA
                          </AppText>
                        </View>
                      )}
                    </View>

                    <View style={styles.courseMetricsRow}>
                      <View style={styles.courseMetric}>
                        <AppText variant="caption" colorRole="secondary">Attendance</AppText>
                        <AppText variant="body" style={{ fontWeight: "600" }}>
                          {c.attendance.percentage}% ({c.attendance.attended}/{c.attendance.scheduled})
                        </AppText>
                      </View>
                      <View style={styles.courseMetric}>
                        <AppText variant="caption" colorRole="secondary">Deadlines</AppText>
                        <AppText variant="body" style={{ fontWeight: "600" }}>
                          {c.assignments.completed}/{c.assignments.due}
                        </AppText>
                      </View>
                      <View style={styles.courseMetric}>
                        <AppText variant="caption" colorRole="secondary">Focus Time</AppText>
                        <AppText variant="body" style={{ fontWeight: "600" }}>
                          {(c.focusMinutes / 60).toFixed(1)}h
                        </AppText>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekTitleBox: {
    alignItems: "center",
  },
  gradeCard: {
    padding: spacing.md,
  },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiCard: {
    padding: spacing.md,
    borderWidth: 1,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionHeader: {
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  scorecardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  scoreCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: spacing.sm,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginTop: spacing.xs,
  },
  courseCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  courseMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150, 150, 150, 0.2)",
  },
  courseMetric: {
    alignItems: "flex-start",
  },
});
