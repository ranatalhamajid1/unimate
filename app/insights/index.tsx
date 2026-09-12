import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient, apiGet, apiPost } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import { triggerSelectionFeedback, triggerSuccessFeedback } from "@/lib/haptics";
import type { MobileAcademicInsight, MobileAiQuota } from "@/lib/types";

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // 1. Deterministic Academic Advisor Overview (Zero quota consumed)
  const {
    data: advisorData,
    isLoading: isAdvisorLoading,
    isError: isAdvisorError,
    refetch: refetchAdvisor,
    isRefetching: isAdvisorRefetching,
  } = useQuery({
    queryKey: ["advisor-overview"],
    queryFn: async () => {
      return await apiGet<{ success: boolean; data: any }>("/api/intelligence/advisor");
    },
  });

  // 2. Academic Insights & Trends
  const {
    data: insightsData,
    isLoading: isInsightsLoading,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      return await apiClient.get<{ success: boolean; insights: MobileAcademicInsight[] }>(
        "/api/mobile/insights"
      );
    },
  });

  // 3. AI Quota Status
  const { data: quotaData, refetch: refetchQuota } = useQuery({
    queryKey: ["ai-quota"],
    queryFn: async () => {
      return await apiClient.get<{ success: boolean; quota: MobileAiQuota }>("/api/mobile/ai/quota");
    },
  });

  // 4. On-Demand AI Advisor Mutation
  const advisorMutation = useMutation({
    mutationFn: async () => {
      return await apiPost<{ success: boolean; data: any }>("/api/intelligence/advisor", {
        focusArea: "COMPREHENSIVE",
      });
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        setAiReport(res.data);
        triggerSuccessFeedback();
        refetchQuota();
        refetchAdvisor();
      }
    },
  });

  const handleOpenAiAdvisor = () => {
    triggerSelectionFeedback();
    setAiModalVisible(true);
    if (!aiReport) {
      advisorMutation.mutate();
    }
  };

  const handleRefreshAll = () => {
    refetchAdvisor();
    refetchInsights();
    refetchQuota();
  };

  if (isAdvisorLoading && !isAdvisorRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Student Intelligence", headerBackTitle: "More" }} />
        <LoadingState message="Analyzing academic health & forecast..." />
      </Screen>
    );
  }

  if (isAdvisorError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Student Intelligence", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load intelligence data." onRetry={handleRefreshAll} />
      </Screen>
    );
  }

  const overview = advisorData?.data;
  const insights = insightsData?.insights || [];
  const quota = quotaData?.quota;

  const getHealthChip = (health: string) => {
    switch (health) {
      case "EXCELLENT":
        return { label: "Exceptional", variant: "success" as const };
      case "GOOD":
        return { label: "On Track", variant: "primary" as const };
      case "NEEDS_ATTENTION":
        return { label: "Action Needed", variant: "warning" as const };
      case "CRITICAL":
        return { label: "Critical Attention", variant: "danger" as const };
      case "INSUFFICIENT_DATA":
      default:
        return { label: "Setup Records", variant: "neutral" as const };
    }
  };

  const healthChip = getHealthChip(overview?.academicHealth || "INSUFFICIENT_DATA");

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Student Intelligence", headerBackTitle: "More" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isAdvisorRefetching}
            onRefresh={handleRefreshAll}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="h2">Student Intelligence 2.0</AppText>
          <AppText variant="caption" colorRole="secondary">
            AI Academic Advisor & Predictive Analytics
          </AppText>
        </View>

        {/* ── 1. Academic Health & AI Advisor Card ─────────────────── */}
        <Card style={styles.advisorCard}>
          <View style={styles.advisorCardTop}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" style={styles.cardSuperLabel}>
                ACADEMIC HEALTH STATUS
              </AppText>
              <AppText variant="h3" style={{ marginTop: 2 }}>
                {overview?.academicHealthLabel || "Academic Standing"}
              </AppText>
            </View>
            <StatusChip label={healthChip.label} variant={healthChip.variant} size="sm" />
          </View>

          {/* Primary Focus Callout */}
          {overview?.primaryFocus && (
            <View
              style={[
                styles.focusBox,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.focusHeader}>
                <Ionicons name="flash" size={14} color={colors.accent} />
                <AppText variant="caption" style={{ color: colors.accent, fontWeight: "700" }}>
                  PRIMARY FOCUS TODAY
                </AppText>
              </View>
              <AppText variant="bodyMedium" style={{ fontWeight: "600", marginTop: 2 }}>
                {overview.primaryFocus.action}
              </AppText>
              <AppText variant="caption" colorRole="secondary" style={{ marginTop: 1 }}>
                {overview.primaryFocus.reason}
              </AppText>
            </View>
          )}

          {/* Metrics Quick Strip */}
          <View style={styles.metricsStrip}>
            {/* GPA */}
            <View style={[styles.miniMetric, { backgroundColor: colors.surfaceSecondary }]}>
              <AppText variant="caption" colorRole="secondary">
                Cumulative GPA
              </AppText>
              <AppText variant="h3" style={{ marginTop: 2 }}>
                {overview?.gpaStanding?.currentGpaString || "N/A"}
              </AppText>
              {overview?.gpaStanding?.targetGpa ? (
                <AppText variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>
                  Target: {overview.gpaStanding.targetGpaString}
                </AppText>
              ) : null}
            </View>

            {/* Attendance */}
            <View style={[styles.miniMetric, { backgroundColor: colors.surfaceSecondary }]}>
              <AppText variant="caption" colorRole="secondary">
                Overall Attendance
              </AppText>
              <AppText variant="h3" style={{ marginTop: 2 }}>
                {overview?.attendanceSummary?.overallPercentageString || "N/A"}
              </AppText>
              <AppText
                variant="caption"
                style={{
                  fontSize: 10,
                  color:
                    (overview?.attendanceSummary?.atRiskCount ?? 0) > 0
                      ? colors.danger
                      : (overview?.attendanceSummary?.watchCount ?? 0) > 0
                      ? "#F59E0B"
                      : colors.success,
                }}
              >
                {(overview?.attendanceSummary?.atRiskCount ?? 0) > 0
                  ? `${overview.attendanceSummary.atRiskCount} at risk`
                  : (overview?.attendanceSummary?.watchCount ?? 0) > 0
                  ? `${overview.attendanceSummary.watchCount} on watch`
                  : "Safe buffer"}
              </AppText>
            </View>
          </View>

          {/* AI Advisor Button & Quota Counter */}
          <View style={[styles.advisorFooter, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.quotaPill}>
              <Ionicons name="sparkles" size={12} color={colors.accent} />
              <AppText variant="caption" style={{ fontSize: 11, color: colors.textSecondary }}>
                {quota ? `${quota.remaining} / ${quota.limit} AI requests left` : "AI Advisor"}
              </AppText>
            </View>

            <TouchableOpacity
              onPress={handleOpenAiAdvisor}
              style={[styles.aiButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="bulb-outline" size={14} color="#fff" />
              <AppText variant="caption" style={{ color: "#fff", fontWeight: "700" }}>
                Ask Advisor
              </AppText>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── 2. Attendance Forecasting Section ───────────────────── */}
        {overview?.attendanceSummary?.warnings?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <AppText variant="h3">Attendance Forecast</AppText>
            </View>

            {overview.attendanceSummary.warnings.map((w: any) => (
              <Card key={w.courseCode} style={styles.forecastCard}>
                <View style={styles.forecastHeader}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" style={{ fontWeight: "700" }}>
                      {w.courseName} ({w.courseCode})
                    </AppText>
                    <AppText variant="caption" colorRole="secondary">
                      Current: {w.attendancePercentage !== null ? `${w.attendancePercentage}%` : "N/A"}
                    </AppText>
                  </View>
                  <StatusChip
                    label={w.status === "AT_RISK" ? "At Risk" : "Watch"}
                    variant={w.status === "AT_RISK" ? "danger" : "warning"}
                    size="sm"
                  />
                </View>
                <AppText variant="caption" style={styles.recommendationText}>
                  {w.recommendation}
                </AppText>
              </Card>
            ))}
          </View>
        )}

        {/* ── 3. Target GPA Feasibility ────────────────────────────── */}
        {overview?.gpaStanding?.targetFeasibility && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
              <AppText variant="h3">GPA Target Feasibility</AppText>
            </View>

            <Card style={styles.forecastCard}>
              <View style={styles.forecastHeader}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" colorRole="secondary">
                    Target Goal: {overview.gpaStanding.targetGpaString}
                  </AppText>
                  <AppText variant="bodyMedium" style={{ fontWeight: "700", marginTop: 2 }}>
                    Status: {overview.gpaStanding.targetFeasibility.status.replace("_", " ")}
                  </AppText>
                </View>
                <StatusChip
                  label={overview.gpaStanding.targetFeasibility.status.replace("_", " ")}
                  variant={
                    overview.gpaStanding.targetFeasibility.status === "ALREADY_MET"
                      ? "success"
                      : overview.gpaStanding.targetFeasibility.status === "ACHIEVABLE"
                      ? "primary"
                      : overview.gpaStanding.targetFeasibility.status === "CHALLENGING"
                      ? "warning"
                      : "danger"
                  }
                  size="sm"
                />
              </View>
              <AppText variant="caption" style={styles.recommendationText}>
                {overview.gpaStanding.targetFeasibility.explanation}
              </AppText>
            </Card>
          </View>
        )}

        {/* ── 4. Weekly Trend Findings ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={18} color={colors.primary} />
            <AppText variant="h3">Academic Insights & Trends</AppText>
          </View>

          {insights.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="bulb-outline" size={48} color={colors.accent} />}
              title="No trends found"
              description="Enroll in courses and record your attendance to unlock predictive trend findings."
            />
          ) : (
            insights.map((item: MobileAcademicInsight) => (
              <Card key={item.id} style={styles.insightCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerInfo}>
                    <AppText variant="h3">{item.title}</AppText>
                    <View style={styles.chipRow}>
                      <StatusChip
                        label={item.severity}
                        variant={
                          item.severity === "CRITICAL"
                            ? "danger"
                            : item.severity === "WARNING"
                            ? "warning"
                            : item.severity === "POSITIVE"
                            ? "accent"
                            : "primary"
                        }
                        size="sm"
                      />
                      <StatusChip label={item.category} variant="neutral" size="sm" />
                    </View>
                  </View>
                </View>
                <AppText variant="body" colorRole="secondary" style={styles.description}>
                  {item.description}
                </AppText>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── AI Advisor Strategy Modal ───────────────────────────────── */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.aiIconWrapper, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons name="bulb" size={18} color={colors.primary} />
                </View>
                <View>
                  <AppText variant="h3">AI Academic Advisor</AppText>
                  <AppText variant="caption" colorRole="secondary">
                    {aiReport?.source === "ai" ? "Personalized Strategy" : "Deterministic Action Plan"}
                  </AppText>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {advisorMutation.isPending ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText variant="body" style={{ marginTop: spacing.md, textAlign: "center" }}>
                  Analyzing academic records & synthesizing strategy...
                </AppText>
              </View>
            ) : aiReport ? (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Executive Summary */}
                <View
                  style={[
                    styles.executiveBox,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle },
                  ]}
                >
                  <AppText variant="caption" style={{ color: colors.primary, fontWeight: "700" }}>
                    EXECUTIVE BRIEFING
                  </AppText>
                  <AppText variant="bodyMedium" style={{ marginTop: 4, lineHeight: 20 }}>
                    {aiReport.executiveSummary}
                  </AppText>
                </View>

                {/* Primary Recommendation */}
                <View style={styles.modalSection}>
                  <AppText variant="caption" style={styles.modalSectionLabel}>
                    TOP PRIORITY
                  </AppText>
                  <AppText variant="body" style={{ fontWeight: "700", marginTop: 2 }}>
                    {aiReport.primaryRecommendation}
                  </AppText>
                </View>

                {/* Strategic Action Steps */}
                <View style={styles.modalSection}>
                  <AppText variant="caption" style={styles.modalSectionLabel}>
                    ACTION PLAN
                  </AppText>
                  {aiReport.strategicActionPlan?.map((step: string, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.stepRow,
                        { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle },
                      ]}
                    >
                      <View style={[styles.stepNum, { backgroundColor: colors.primary + "20" }]}>
                        <AppText variant="caption" style={{ color: colors.primary, fontWeight: "700" }}>
                          {idx + 1}
                        </AppText>
                      </View>
                      <AppText variant="bodySmall" style={{ flex: 1, lineHeight: 18 }}>
                        {step}
                      </AppText>
                    </View>
                  ))}
                </View>

                {/* Schedule Optimization */}
                {aiReport.studyStrategy ? (
                  <View style={styles.modalSection}>
                    <AppText variant="caption" style={styles.modalSectionLabel}>
                      DAILY SCHEDULE STRATEGY
                    </AppText>
                    <AppText variant="bodySmall" colorRole="secondary" style={{ lineHeight: 18 }}>
                      {aiReport.studyStrategy}
                    </AppText>
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View style={styles.modalLoadingBox}>
                <AppText variant="body">Unable to load advisor report.</AppText>
              </View>
            )}

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <Button title="Close" variant="outline" onPress={() => setAiModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  advisorCard: {
    marginBottom: spacing.md,
  },
  advisorCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardSuperLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  focusBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  focusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricsStrip: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  miniMetric: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: BorderRadius.md,
  },
  advisorFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quotaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  forecastCard: {
    marginBottom: spacing.xs,
  },
  forecastHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  recommendationText: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  insightCard: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerInfo: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "85%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
  },
  aiIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLoadingBox: {
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    marginVertical: spacing.sm,
  },
  executiveBox: {
    padding: spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  modalSection: {
    marginBottom: spacing.md,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
