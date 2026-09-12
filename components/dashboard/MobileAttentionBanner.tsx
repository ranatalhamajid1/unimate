import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

export interface MobileAttentionItem {
  id: string;
  title: string;
  courseCode: string;
  deadlineLabel: string;
  urgencyTier: "OVERDUE" | "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";
  actionHref: string;
  actionLabel: string;
}

interface Props {
  items: MobileAttentionItem[];
  attendanceWarning?: {
    courseCode: string;
    percentageString: string;
    thresholdPercentage: number;
    recoveryClassesRequired: number;
  } | null;
  timetableConflictCount?: number;
}

export function MobileAttentionBanner({
  items,
  attendanceWarning,
  timetableConflictCount = 0,
}: Props) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const hasItems = items && items.length > 0;
  const hasAttendance = Boolean(attendanceWarning);
  const hasConflicts = timetableConflictCount > 0;

  if (!hasItems && !hasAttendance && !hasConflicts) {
    return null;
  }

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Route map to existing mobile screens
    if (route.includes("assignments")) router.push("/assignments" as any);
    else if (route.includes("academics")) router.push("/academics" as any);
    else if (route.includes("exams")) router.push("/exams" as any);
    else if (route.includes("timetable")) router.push("/calendar" as any);
  };

  return (
    <View style={styles.container}>
      {/* Attendance Warning */}
      {attendanceWarning && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress("/academics")}
          accessibilityRole="button"
          accessibilityLabel={`Attendance alert for ${attendanceWarning.courseCode}`}
        >
          <Card
            variant="floating"
            style={[
              styles.card,
              {
                borderColor: `${colors.destructive}40`,
                backgroundColor: isDark ? "rgba(244, 63, 94, 0.10)" : "rgba(244, 63, 94, 0.06)",
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <View style={[styles.glowDot, { backgroundColor: colors.destructive }]} />
                <AppText
                  variant="label"
                  style={[styles.badgeText, { color: colors.destructive }]}
                >
                  ATTENDANCE ALERT • {attendanceWarning.courseCode}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.destructive} />
            </View>
            <AppText variant="bodySmall" style={{ color: colors.textPrimary, marginTop: 4 }}>
              Current: {attendanceWarning.percentageString} (Target: {attendanceWarning.thresholdPercentage}%). Attend next {attendanceWarning.recoveryClassesRequired} classes to recover.
            </AppText>
          </Card>
        </TouchableOpacity>
      )}

      {/* Schedule Conflict */}
      {hasConflicts && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress("/timetable")}
          accessibilityRole="button"
          accessibilityLabel="Timetable schedule conflict alert"
        >
          <Card
            variant="floating"
            style={[
              styles.card,
              {
                borderColor: `${colors.warning}40`,
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.10)" : "rgba(245, 158, 11, 0.06)",
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <View style={[styles.glowDot, { backgroundColor: colors.warning }]} />
                <AppText
                  variant="label"
                  style={[styles.badgeText, { color: colors.warning }]}
                >
                  SCHEDULE CONFLICT
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.warning} />
            </View>
            <AppText variant="bodySmall" style={{ color: colors.textPrimary, marginTop: 4 }}>
              {timetableConflictCount} overlapping class period{timetableConflictCount > 1 ? "s" : ""} detected in today's timetable.
            </AppText>
          </Card>
        </TouchableOpacity>
      )}

      {/* Urgent Task Items */}
      {items.map((item) => {
        const isOverdue = item.urgencyTier === "OVERDUE";
        const tintColor = isOverdue ? colors.destructive : colors.warning;
        const cardBg = isDark
          ? isOverdue ? "rgba(244, 63, 94, 0.10)" : "rgba(245, 158, 11, 0.10)"
          : isOverdue ? "rgba(244, 63, 94, 0.06)" : "rgba(245, 158, 11, 0.06)";

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handlePress(item.actionHref)}
            accessibilityRole="button"
            accessibilityLabel={`${item.deadlineLabel}: ${item.title}`}
          >
            <Card
              variant="floating"
              style={[
                styles.card,
                {
                  borderColor: `${tintColor}35`,
                  backgroundColor: cardBg,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <View style={[styles.glowDot, { backgroundColor: tintColor }]} />
                  <AppText
                    variant="label"
                    style={[styles.badgeText, { color: tintColor }]}
                  >
                    {item.deadlineLabel.toUpperCase()} • {item.courseCode}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={14} color={tintColor} />
              </View>
              <AppText
                variant="bodyMedium"
                numberOfLines={1}
                style={[styles.itemTitle, { color: colors.textPrimary }]}
              >
                {item.title}
              </AppText>
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  card: {
    padding: 14,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  itemTitle: {
    marginTop: 4,
    fontWeight: "600",
  },
});
