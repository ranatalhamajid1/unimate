import React from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type { MobileBillingData } from "@/lib/types";

export default function BillingScreen() {
  const { colors } = useTheme();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      return await apiClient.get<MobileBillingData>("/api/mobile/billing");
    },
  });

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Plan & Billing", headerBackTitle: "More" }} />
        <LoadingState message="Loading subscription details..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Plan & Billing", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load subscription status." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const sub = data?.subscription;
  const isPro = sub?.isPro || sub?.plan === "PRO";
  const limits = data?.limits;

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Plan & Billing", headerBackTitle: "More" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Current Plan Card */}
        <Card style={[styles.planCard, { borderColor: isPro ? colors.accent : colors.border }]}>
          <View style={styles.planHeader}>
            <View>
              <AppText variant="caption" colorRole="secondary">
                CURRENT SUBSCRIPTION
              </AppText>
              <AppText variant="h2" style={{ color: isPro ? colors.accent : colors.textPrimary, marginTop: 2 }}>
                UniMate {sub?.plan || "FREE"}
              </AppText>
            </View>
            <StatusChip
              label={sub?.status || "ACTIVE"}
              variant={isPro ? "accent" : "primary"}
              size="md"
            />
          </View>

          {isPro && sub?.currentPeriodEnd && (
            <AppText variant="caption" colorRole="secondary" style={styles.periodText}>
              Renews on {new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </AppText>
          )}

          {/* AI Allowance Bar */}
          <View style={[styles.allowanceBox, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={styles.allowanceRow}>
              <AppText variant="caption" colorRole="secondary">
                Daily AI Assistance Allowance
              </AppText>
              <AppText variant="caption" style={{ fontWeight: "700", color: colors.primary }}>
                {limits?.dailyAiLimit || 5} requests / day
              </AppText>
            </View>
          </View>
        </Card>

        {/* Feature Comparison */}
        <AppText variant="h3" style={styles.sectionTitle}>
          Entitlements & Features
        </AppText>

        <Card style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            <View style={styles.featureTextCol}>
              <AppText variant="body" style={{ fontWeight: "600" }}>
                Complete Academic Core Modules
              </AppText>
              <AppText variant="caption" colorRole="secondary">
                Courses, timetable, assignments, exams, and attendance tracking
              </AppText>
            </View>
            <StatusChip label="Free & Pro" variant="neutral" size="sm" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            <View style={styles.featureTextCol}>
              <AppText variant="body" style={{ fontWeight: "600" }}>
                Unified Academic Calendar
              </AppText>
              <AppText variant="caption" colorRole="secondary">
                Integrated classes, study sessions, exams, and homework deadlines
              </AppText>
            </View>
            <StatusChip label="Free & Pro" variant="neutral" size="sm" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.featureItem}>
            <Ionicons
              name={isPro ? "checkmark-circle" : "sparkles"}
              size={20}
              color={isPro ? colors.accent : colors.primary}
            />
            <View style={styles.featureTextCol}>
              <AppText variant="body" style={{ fontWeight: "600" }}>
                AI Study Plan Generation
              </AppText>
              <AppText variant="caption" colorRole="secondary">
                Personalized study schedules based on exam urgency and deadlines
              </AppText>
            </View>
            <StatusChip label="Pro Only" variant="accent" size="sm" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.featureItem}>
            <Ionicons
              name={isPro ? "checkmark-circle" : "sparkles"}
              size={20}
              color={isPro ? colors.accent : colors.primary}
            />
            <View style={styles.featureTextCol}>
              <AppText variant="body" style={{ fontWeight: "600" }}>
                10x AI Study Buddy Allowance
              </AppText>
              <AppText variant="caption" colorRole="secondary">
                50 daily requests for proactive course advice and problem-solving
              </AppText>
            </View>
            <StatusChip label="Pro Only" variant="accent" size="sm" />
          </View>
        </Card>

        {/* Notice Card */}
        <Card style={[styles.noticeCard, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.noticeRow}>
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" colorRole="secondary" style={{ lineHeight: 18 }}>
                {data?.notice ||
                  "In-app mobile purchases are currently disabled. Subscriptions and plan upgrades can be managed via the UniMate Web App."}
              </AppText>
            </View>
          </View>
        </Card>
      </ScrollView>
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
  planCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodText: {
    marginTop: spacing.xs,
  },
  allowanceBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: BorderRadius.md,
  },
  allowanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  featuresCard: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  featureTextCol: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  noticeCard: {
    padding: spacing.md,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
});
