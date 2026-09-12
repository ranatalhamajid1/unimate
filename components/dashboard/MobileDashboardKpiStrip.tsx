/**
 * Fintech-grade KPI Strip for UniMate Mobile Dashboard.
 * Calibrated for M16.2: God-Level Visual Experience 2.0.
 * Features large tabular numerals, subtle status indicators, and spatial depth.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/use-theme";
import { triggerImpactFeedback } from "@/lib/haptics";

interface KpiStripProps {
  gpa?: string | null;
  attendance?: string | null;
  plannedMinutes?: number;
  tasksCount?: number;
  onPressGpa?: () => void;
  onPressAttendance?: () => void;
  onPressTasks?: () => void;
}

export function MobileDashboardKpiStrip({
  gpa,
  attendance,
  plannedMinutes = 0,
  tasksCount = 0,
  onPressGpa,
  onPressAttendance,
  onPressTasks,
}: KpiStripProps) {
  const { colors, isDark } = useTheme();

  const handlePress = (callback?: () => void) => {
    if (!callback) return;
    triggerImpactFeedback("light");
    callback();
  };

  const plannedHours = (plannedMinutes / 60).toFixed(1);

  return (
    <View style={styles.grid}>
      {/* 1. Cumulative GPA */}
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.85}
        onPress={() => handlePress(onPressGpa)}
        accessibilityRole="button"
        accessibilityLabel={`Cumulative GPA: ${gpa || "Not set"}`}
      >
        <Card variant="primary" style={styles.kpiCard}>
          <View style={styles.cardTop}>
            <AppText variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
              ACADEMIC GPA
            </AppText>
            <Ionicons name="trending-up" size={14} color={colors.accent} />
          </View>
          <View style={styles.valueRow}>
            <AppText style={[styles.value, { color: colors.textPrimary }]}>
              {gpa || "3.80"}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textTertiary, marginBottom: 2 }}>
              /4.0
            </AppText>
          </View>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)" },
            ]}
          >
            <View style={[styles.chipDot, { backgroundColor: colors.accent }]} />
            <AppText variant="caption" style={[styles.chipText, { color: colors.accent }]}>
              Target: 3.8+
            </AppText>
          </View>
        </Card>
      </TouchableOpacity>

      {/* 2. Overall Attendance */}
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.85}
        onPress={() => handlePress(onPressAttendance)}
        accessibilityRole="button"
        accessibilityLabel={`Overall Attendance: ${attendance || "100%"}`}
      >
        <Card variant="primary" style={styles.kpiCard}>
          <View style={styles.cardTop}>
            <AppText variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
              ATTENDANCE
            </AppText>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
          </View>
          <View style={styles.valueRow}>
            <AppText style={[styles.value, { color: colors.textPrimary }]}>
              {attendance || "94%"}
            </AppText>
          </View>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)" },
            ]}
          >
            <View style={[styles.chipDot, { backgroundColor: colors.success }]} />
            <AppText variant="caption" style={[styles.chipText, { color: colors.success }]}>
              Good Standing
            </AppText>
          </View>
        </Card>
      </TouchableOpacity>

      {/* 3. Study Load */}
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.85}
        onPress={() => handlePress(onPressTasks)}
        accessibilityRole="button"
        accessibilityLabel={`Today study workload: ${plannedHours} hours`}
      >
        <Card variant="primary" style={styles.kpiCard}>
          <View style={styles.cardTop}>
            <AppText variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
              PLANNED STUDY
            </AppText>
            <Ionicons name="time-outline" size={14} color={colors.cyan} />
          </View>
          <View style={styles.valueRow}>
            <AppText style={[styles.value, { color: colors.textPrimary }]}>
              {plannedHours}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textTertiary, marginBottom: 2 }}>
              hrs
            </AppText>
          </View>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: isDark ? "rgba(34, 211, 238, 0.15)" : "rgba(34, 211, 238, 0.08)" },
            ]}
          >
            <View style={[styles.chipDot, { backgroundColor: colors.cyan }]} />
            <AppText variant="caption" style={[styles.chipText, { color: colors.cyan }]}>
              Optimal Flow
            </AppText>
          </View>
        </Card>
      </TouchableOpacity>

      {/* 4. Action Queue */}
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.85}
        onPress={() => handlePress(onPressTasks)}
        accessibilityRole="button"
        accessibilityLabel={`Focus queue: ${tasksCount} items`}
      >
        <Card variant="primary" style={styles.kpiCard}>
          <View style={styles.cardTop}>
            <AppText variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
              FOCUS QUEUE
            </AppText>
            <Ionicons name="flash-outline" size={14} color={colors.secondary} />
          </View>
          <View style={styles.valueRow}>
            <AppText style={[styles.value, { color: colors.textPrimary }]}>
              {tasksCount}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textTertiary, marginBottom: 2 }}>
              tasks
            </AppText>
          </View>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.08)" },
            ]}
          >
            <View style={[styles.chipDot, { backgroundColor: colors.secondary }]} />
            <AppText variant="caption" style={[styles.chipText, { color: colors.secondary }]}>
              Prioritized
            </AppText>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  cardWrapper: {
    width: "48.5%",
  },
  kpiCard: {
    padding: 12,
    borderRadius: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
