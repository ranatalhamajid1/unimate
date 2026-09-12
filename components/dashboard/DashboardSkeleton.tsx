import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

export function DashboardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]} />
        <View style={styles.headerText}>
          <View style={[styles.pill, { backgroundColor: colors.surfaceSecondary }]} />
          <View style={[styles.title, { backgroundColor: colors.surfaceSecondary }]} />
        </View>
      </View>

      {/* Daily Briefing Skeleton */}
      <View style={[styles.briefingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.pill, { width: 100, backgroundColor: colors.surfaceSecondary }]} />
        <View style={[styles.title, { width: "80%", marginTop: 8, backgroundColor: colors.surfaceSecondary }]} />
        <View style={[styles.line, { width: "95%", marginTop: 12, backgroundColor: colors.surfaceSecondary }]} />
        <View style={[styles.line, { width: "70%", marginTop: 6, backgroundColor: colors.surfaceSecondary }]} />
      </View>

      {/* Quick Metrics Grid Skeleton */}
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.pill, { width: 40, backgroundColor: colors.surfaceSecondary }]} />
            <View style={[styles.statValue, { backgroundColor: colors.surfaceSecondary }]} />
          </View>
        ))}
      </View>

      {/* Section Skeleton */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.pill, { width: 120, backgroundColor: colors.surfaceSecondary }]} />
        <View style={[styles.taskRow, { backgroundColor: colors.surfaceSecondary }]} />
        <View style={[styles.taskRow, { backgroundColor: colors.surfaceSecondary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  pill: {
    width: 80,
    height: 14,
    borderRadius: BorderRadius.md,
  },
  title: {
    width: 160,
    height: 22,
    borderRadius: BorderRadius.md,
  },
  line: {
    height: 14,
    borderRadius: BorderRadius.md,
  },
  briefingCard: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  statValue: {
    width: 60,
    height: 20,
    borderRadius: BorderRadius.md,
  },
  sectionCard: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 12,
  },
  taskRow: {
    height: 48,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
});
