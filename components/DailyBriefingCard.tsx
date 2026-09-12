import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

export type MobileBriefingData = {
  headline: string;
  dayStatus: "CALM" | "MANAGEABLE" | "HEAVY";
  summary: string;
  whyTheseMatter: string;
  todayClassesCount: number;
  topPriorities: Array<{
    id: string;
    action: string;
    reason: string;
    courseCode: string;
    courseName: string;
    urgencyTier: string;
    deadlineLabel: string;
  }>;
  upcomingExams: Array<any>;
  scheduleGaps: Array<{
    startTime: string;
    endTime: string;
    durationMinutes: number;
    label: string;
  }>;
  isPro: boolean;
};

type Props = {
  briefing: MobileBriefingData | null;
  isLoading?: boolean;
};

export function DailyBriefingCard({ briefing, isLoading }: Props) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [showStrategy, setShowStrategy] = useState(true);

  if (isLoading || !briefing) {
    return null;
  }

  const isAttentionNeeded = briefing.dayStatus === "HEAVY" || briefing.topPriorities.some((p) => p.urgencyTier === "OVERDUE");
  const statusBadgeColor = isAttentionNeeded
    ? { bg: colors.destructiveSubtle, text: colors.destructive }
    : { bg: colors.successSubtle, text: colors.success };

  return (
    <Card style={[styles.card, { borderColor: colors.border }]}>
      {/* Header Accent Bar */}
      <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />

      {/* Title & Status */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isDark ? "#2E1065" : "#F5F3FF" }]}>
              <Ionicons name="sparkles" size={12} color={colors.ai} />
              <AppText variant="caption" style={{ color: colors.ai, fontWeight: "600", fontSize: 11 }}>
                Daily Briefing
              </AppText>
            </View>
            <View style={[styles.badge, { backgroundColor: statusBadgeColor.bg }]}>
              <AppText variant="caption" style={{ color: statusBadgeColor.text, fontWeight: "600", fontSize: 11 }}>
                {briefing.dayStatus === "HEAVY" ? "Attention Needed" : "Manageable Day"}
              </AppText>
            </View>
          </View>
          <AppText variant="bodyMedium" style={{ fontWeight: "700", color: colors.textPrimary, marginTop: 4 }}>
            {briefing.headline}
          </AppText>
          <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 1 }}>
            {briefing.summary}
          </AppText>
        </View>
      </View>

      {/* Top Priority Tasks (What should you do next?) */}
      <View style={styles.tasksContainer}>
        <AppText variant="caption" style={styles.sectionLabel}>
          WHAT SHOULD YOU DO NEXT?
        </AppText>

        {briefing.topPriorities.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <AppText variant="body" style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>
              All caught up! No urgent assignments or exams approaching.
            </AppText>
          </View>
        ) : (
          briefing.topPriorities.slice(0, 3).map((task, idx) => {
            const isOverdue = task.urgencyTier === "OVERDUE";
            const isCritical = task.urgencyTier === "CRITICAL";

            return (
              <View
                key={task.id || idx}
                style={[
                  styles.taskRow,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.taskContent}>
                  <View style={styles.taskTitleRow}>
                    <AppText variant="bodyMedium" style={{ color: colors.textPrimary, fontWeight: "600", flex: 1 }} numberOfLines={1}>
                      {idx + 1}. {task.action}
                    </AppText>
                    <View
                      style={[
                        styles.tierBadge,
                        {
                          backgroundColor: isOverdue
                            ? colors.destructiveSubtle
                            : isCritical
                              ? colors.warningSubtle
                              : colors.accentSubtle,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={{
                          color: isOverdue ? colors.destructive : isCritical ? colors.warning : colors.accent,
                          fontWeight: "700",
                          fontSize: 10,
                        }}
                      >
                        {task.deadlineLabel}
                      </AppText>
                    </View>
                  </View>

                  <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {task.reason}
                  </AppText>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Explainable Strategy note */}
      {briefing.whyTheseMatter ? (
        <View style={[styles.strategyCard, { backgroundColor: isDark ? "#1E1338" : "#FBF8FF", borderColor: isDark ? "#3B1E6D" : "#E9D5FF" }]}>
          <View style={styles.strategyHeader}>
            <Ionicons name="bulb-outline" size={14} color={colors.ai} />
            <AppText variant="caption" style={{ color: colors.ai, fontWeight: "700", fontSize: 11 }}>
              Why this matters:
            </AppText>
          </View>
          <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2, lineHeight: 16 }}>
            {briefing.whyTheseMatter}
          </AppText>
        </View>
      ) : null}

      {/* Footer link to AI Study Buddy */}
      <TouchableOpacity
        onPress={() => router.push("/ai-buddy")}
        style={[styles.footerButton, { borderTopColor: colors.borderSubtle }]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ask AI Academic Advisor"
      >
        <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600" }}>
          Ask Academic Advisor for study strategy
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={colors.accent} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    position: "relative",
    overflow: "hidden",
    marginBottom: 16,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tasksContainer: {
    marginTop: 12,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  emptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  taskRow: {
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  taskContent: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  strategyCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  strategyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
