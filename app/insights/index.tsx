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
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type { MobileAcademicInsight } from "@/lib/types";

export default function InsightsScreen() {
  const { colors } = useTheme();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      return await apiClient.get<{ success: boolean; insights: MobileAcademicInsight[] }>(
        "/api/mobile/insights"
      );
    },
  });

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academic Insights", headerBackTitle: "More" }} />
        <LoadingState message="Analyzing student trends & risks..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academic Insights", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load academic insights." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const insights = data?.insights || [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Ionicons name="alert-circle" size={22} color={colors.danger} />;
      case "WARNING":
        return <Ionicons name="warning-outline" size={22} color="#F59E0B" />;
      case "POSITIVE":
        return <Ionicons name="sparkles" size={22} color={colors.accent} />;
      default:
        return <Ionicons name="information-circle-outline" size={22} color={colors.primary} />;
    }
  };

  const getSeverityChipVariant = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "danger";
      case "WARNING":
        return "warning";
      case "POSITIVE":
        return "accent";
      default:
        return "primary";
    }
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Academic Insights", headerBackTitle: "More" }} />

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
        <View style={styles.header}>
          <AppText variant="h2">Smart Insights</AppText>
          <AppText variant="caption" colorRole="secondary">
            Deterministic findings based on your attendance, exams, and grades
          </AppText>
        </View>

        {insights.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="bulb-outline" size={48} color={colors.accent} />}
            title="No insights available"
            description="Add your enrolled courses, timetable, and attendance records to unlock trend insights."
          />
        ) : (
          insights.map((item: MobileAcademicInsight) => (
            <Card key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>{getSeverityIcon(item.severity)}</View>
                <View style={styles.headerInfo}>
                  <AppText variant="h3">{item.title}</AppText>
                  <View style={styles.chipRow}>
                    <StatusChip
                      label={item.severity}
                      variant={getSeverityChipVariant(item.severity)}
                      size="sm"
                    />
                    <StatusChip
                      label={item.category}
                      variant="neutral"
                      size="sm"
                    />
                  </View>
                </View>
              </View>

              <AppText variant="body" colorRole="secondary" style={styles.description}>
                {item.description}
              </AppText>
            </Card>
          ))
        )}
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
  header: {
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  iconBox: {
    marginTop: 2,
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
});
