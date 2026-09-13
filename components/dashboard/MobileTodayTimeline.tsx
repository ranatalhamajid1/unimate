import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

export interface MobileTimelineSlot {
  id: string;
  type: "CLASS" | "STUDY_GAP";
  title: string;
  subtitle?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  room?: string;
  color?: string;
  hasConflict?: boolean;
  suggestedAction?: string;
}

interface Props {
  schedule: MobileTimelineSlot[];
  dayName: string;
}

export function MobileTodayTimeline({ schedule, dayName }: Props) {
  const { colors, isDark } = useTheme();

  if (!schedule || schedule.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Ionicons name="sunny-outline" size={32} color={colors.textTertiary} />
        <AppText variant="h3" style={styles.emptyTitle}>
          No classes for {dayName}
        </AppText>
        <AppText colorRole="secondary" variant="caption" align="center">
          Enjoy your free day or use this time for self-paced study.
        </AppText>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="calendar-outline" size={18} color={colors.accent} />
        <AppText variant="h3">Schedule & Study Windows</AppText>
      </View>

      <View style={styles.timelineList}>
        {schedule.map((slot, index) => {
          const isGap = slot.type === "STUDY_GAP";
          const isLast = index === schedule.length - 1;
          const nodeColor = isGap ? colors.accent : (slot.color || colors.accent);

          return (
            <View key={slot.id} style={styles.timelineRow}>
              {/* Vertical connector spine */}
              <View style={styles.spineColumn}>
                <View
                  style={[
                    styles.nodeDot,
                    {
                      borderColor: nodeColor,
                      backgroundColor: isGap ? colors.surface : nodeColor,
                    },
                  ]}
                />
                {!isLast && (
                  <View
                    style={[
                      styles.connectorLine,
                      { backgroundColor: isGap ? `${colors.accent}30` : colors.border },
                    ]}
                  />
                )}
              </View>

              {/* Slot Content Card */}
              <View style={styles.cardContainer}>
                {isGap ? (
                  <Card
                    variant="floating"
                    style={[
                      styles.gapCard,
                      {
                        borderColor: `${colors.accent}30`,
                        backgroundColor: isDark ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.04)",
                      },
                    ]}
                  >
                    <View style={styles.gapHeader}>
                      <View style={styles.gapTitleRow}>
                        <Ionicons name="sparkles" size={14} color={colors.accent} />
                        <AppText
                          variant="label"
                          style={[styles.gapTitle, { color: colors.accent }]}
                        >
                          {slot.title}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.gapTimeBadge,
                          {
                            backgroundColor: isDark
                              ? "rgba(99, 102, 241, 0.15)"
                              : "rgba(99, 102, 241, 0.08)",
                          },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color={colors.accent}
                          style={{ marginRight: 3 }}
                        />
                        <AppText
                          variant="caption"
                          style={[styles.gapTimeText, { color: colors.accent }]}
                        >
                          {slot.startTime} - {slot.endTime} ({slot.durationMinutes}m)
                        </AppText>
                      </View>
                    </View>
                    {slot.suggestedAction && (
                      <AppText
                        variant="caption"
                        style={{ color: colors.textSecondary, marginTop: 4 }}
                      >
                        {slot.suggestedAction}
                      </AppText>
                    )}
                  </Card>
                ) : (
                  <Card variant="primary" style={styles.classCard}>
                    <View style={styles.classContent}>
                      <View
                        style={[
                          styles.colorIndicator,
                          { backgroundColor: slot.color || colors.accent },
                        ]}
                      />
                      <View style={styles.classDetails}>
                        <AppText variant="bodyMedium" style={styles.className}>
                          {slot.title}
                        </AppText>
                        {slot.subtitle ? (
                          <AppText colorRole="secondary" variant="caption" numberOfLines={1}>
                            {slot.subtitle}
                          </AppText>
                        ) : null}
                      </View>
                      <View style={styles.timeDetails}>
                        <AppText variant="label" style={{ fontWeight: "700" }}>
                          {slot.startTime} - {slot.endTime}
                        </AppText>
                        {slot.room ? (
                          <View style={styles.roomRow}>
                            <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                            <AppText colorRole="tertiary" variant="caption">
                              {slot.room}
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {slot.hasConflict && (
                      <View
                        style={[
                          styles.conflictBanner,
                          { backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : colors.warningSubtle },
                        ]}
                      >
                        <Ionicons name="alert-circle" size={12} color={colors.warning} />
                        <AppText
                          variant="caption"
                          style={{ color: colors.warning, fontSize: 11 }}
                        >
                          Overlaps with another class slot
                        </AppText>
                      </View>
                    )}
                  </Card>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  spineColumn: {
    width: 20,
    alignItems: "center",
    marginRight: 10,
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 18,
    zIndex: 2,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginTop: -2,
    marginBottom: -2,
  },
  cardContainer: {
    flex: 1,
    marginBottom: 10,
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  emptyTitle: {
    marginTop: 4,
  },
  gapCard: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 6,
  },
  gapHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  gapTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 140,
  },
  gapTitle: {
    fontWeight: "700",
    flexShrink: 1,
  },
  gapTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  gapTimeText: {
    fontWeight: "600",
    fontSize: 11,
  },
  classCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
  },
  classContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  classDetails: {
    flex: 1,
  },
  className: {
    fontWeight: "600",
  },
  timeDetails: {
    alignItems: "flex-end",
    flexShrink: 0,
    marginLeft: 8,
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  conflictBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
