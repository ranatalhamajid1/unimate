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
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { triggerSelectionFeedback } from "@/lib/haptics";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type {
  MobileCalendarData,
  MobileCalendarEvent,
  MobileCalendarIntelligenceData,
  MobileRecommendedStudyWindow,
} from "@/lib/types";

const FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "CLASS", label: "Classes" },
  { value: "ASSIGNMENT", label: "Deadlines" },
  { value: "EXAM", label: "Exams" },
  { value: "STUDY", label: "Study" },
];

export default function CalendarScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const dateQueryStr = `${year}-${String(month).padStart(2, "0")}-01`;

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["calendar", dateQueryStr],
    queryFn: async () => {
      return await apiClient.get<{ success: boolean; calendar: MobileCalendarData }>(
        `/api/mobile/calendar?date=${dateQueryStr}`
      );
    },
  });

  const { data: intelRes } = useQuery({
    queryKey: ["calendar-intelligence", dateQueryStr],
    queryFn: async () => {
      return await apiClient.get<{ success: boolean; data: MobileCalendarIntelligenceData }>(
        `/api/mobile/intelligence/calendar?date=${dateQueryStr}`
      );
    },
  });
  const intelligence = intelRes?.data;

  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academic Calendar", headerBackTitle: "More" }} />
        <LoadingState message="Loading academic schedule..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academic Calendar", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load calendar." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const calendar = data?.calendar;
  const events = calendar?.events || [];

  const filteredEvents = events.filter((e: MobileCalendarEvent) => {
    if (selectedFilter === "ALL") return true;
    return e.eventType === selectedFilter;
  });

  // Group events by dateKey
  const groupedEvents: Record<string, MobileCalendarEvent[]> = {};
  for (const ev of filteredEvents) {
    if (!groupedEvents[ev.dateKey]) {
      groupedEvents[ev.dateKey] = [];
    }
    groupedEvents[ev.dateKey].push(ev);
  }
  const dateKeys = Object.keys(groupedEvents).sort();

  const getEventBadge = (type: string) => {
    switch (type) {
      case "CLASS":
        return <StatusChip label="Class" variant="primary" size="sm" />;
      case "ASSIGNMENT":
        return <StatusChip label="Deadline" variant="danger" size="sm" />;
      case "EXAM":
        return <StatusChip label="Exam" variant="warning" size="sm" />;
      case "STUDY":
        return <StatusChip label="Study" variant="accent" size="sm" />;
      default:
        return <StatusChip label={type} variant="neutral" size="sm" />;
    }
  };

  const handleStartFocus = (win: MobileRecommendedStudyWindow) => {
    triggerSelectionFeedback();
    router.push({
      pathname: "/focus-session",
      params: {
        id: win.suggestedFocus.targetId || "",
        entityType: win.suggestedFocus.targetType,
        title: win.suggestedFocus.title,
        courseCode: win.suggestedFocus.courseCode || "",
        courseName: win.suggestedFocus.courseName || "",
        courseColor: win.suggestedFocus.courseColor || "",
        estimatedMinutes: String(win.durationMinutes),
      },
    });
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Academic Calendar", headerBackTitle: "More" }} />

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
        {/* Month Navigator */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            activeOpacity={0.7}
            style={[styles.navBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCurrentMonth} activeOpacity={0.7} style={styles.monthTitleBox}>
            <AppText variant="h2">{calendar?.monthLabel || "Calendar"}</AppText>
            <AppText variant="caption" colorRole="tertiary">
              Asia/Karachi (PKT)
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNextMonth}
            activeOpacity={0.7}
            style={[styles.navBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Intelligence Summary Banner */}
        {Boolean(intelligence) && (
          <Card style={styles.intelCard}>
            <View style={styles.intelHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                <Ionicons name="sparkles" size={16} color={colors.accent} />
                <StatusChip
                  label={`${intelligence?.weekWorkload.overallTier} WEEK`}
                  variant={
                    intelligence?.weekWorkload.overallTier === "OVERLOADED"
                      ? "danger"
                      : intelligence?.weekWorkload.overallTier === "BUSY"
                      ? "warning"
                      : intelligence?.weekWorkload.overallTier === "LIGHT"
                      ? "success"
                      : "primary"
                  }
                  size="sm"
                />
              </View>
              <StatusChip
                label={intelligence?.googleCalendar.connected ? "Google Synced" : "Google Sync Off"}
                variant={intelligence?.googleCalendar.connected ? "success" : "neutral"}
                size="sm"
              />
            </View>
            <AppText variant="caption" colorRole="secondary" style={{ marginTop: 6 }}>
              {intelligence?.weekWorkload.summary}
            </AppText>

            {/* Deadline Clusters */}
            {intelligence && intelligence.deadlineClusters.length > 0 && (
              <View style={styles.clustersContainer}>
                {intelligence.deadlineClusters.map((cl) => (
                  <View key={cl.id} style={[styles.clusterBox, { borderColor: colors.warning }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="alert-circle" size={16} color={colors.warning} />
                      <AppText variant="caption" style={{ fontWeight: "700", color: colors.warning }}>
                        {cl.label}
                      </AppText>
                    </View>
                    <AppText variant="caption" colorRole="secondary" style={{ marginTop: 2 }}>
                      {cl.recommendedAction}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={selectedFilter}
            onChange={setSelectedFilter}
          />
        </View>

        {/* Suggested Study Windows */}
        {intelligence && intelligence.recommendedStudyWindows.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <View style={styles.sectionHeader}>
              <AppText variant="caption" style={styles.sectionTitle}>
                SUGGESTED STUDY WINDOWS
              </AppText>
              <AppText variant="caption" colorRole="tertiary">
                UniMate Academic
              </AppText>
            </View>

            {intelligence.recommendedStudyWindows.slice(0, 3).map((win) => (
              <Card key={win.id} style={styles.studyWindowCard}>
                <View style={styles.studyWindowRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption" style={{ fontWeight: "700", color: colors.primary }}>
                      ⏰ {win.startTime} – {win.endTime} ({win.durationMinutes}m)
                    </AppText>
                    <AppText variant="body" numberOfLines={1} style={{ fontWeight: "600", marginTop: 2 }}>
                      {win.suggestedFocus.title}
                    </AppText>
                    {win.suggestedFocus.courseCode && (
                      <AppText variant="caption" colorRole="secondary">
                        {win.suggestedFocus.courseCode}
                      </AppText>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleStartFocus(win)}
                    activeOpacity={0.8}
                    style={[styles.focusBtn, { backgroundColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Start focus session for ${win.suggestedFocus.title}`}
                  >
                    <Ionicons name="play" size={14} color="#FFFFFF" />
                    <AppText variant="caption" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      Focus
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Unified Events List */}
        {dateKeys.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="calendar-clear-outline" size={48} color={colors.accent} />}
            title="No events found"
            description={`There are no ${selectedFilter === "ALL" ? "" : selectedFilter.toLowerCase() + " "}events scheduled for ${calendar?.monthLabel || "this month"}.`}
          />
        ) : (
          dateKeys.map((dateKey) => {
            const dayEvents = groupedEvents[dateKey];
            const dateObj = new Date(dateKey + "T00:00:00");
            const dateHeading = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const isToday = dateKey === new Date().toISOString().split("T")[0];

            return (
              <View key={dateKey} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <AppText
                    variant="caption"
                    style={{
                      fontWeight: isToday ? "700" : "600",
                      color: isToday ? colors.primary : colors.textPrimary,
                    }}
                  >
                    {isToday ? `Today · ${dateHeading}` : dateHeading}
                  </AppText>
                  <AppText variant="caption" colorRole="tertiary">
                    {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                  </AppText>
                </View>

                {dayEvents.map((event: MobileCalendarEvent) => (
                  <Card key={event.id} style={styles.eventCard}>
                    <View style={styles.eventRow}>
                      <View
                        style={[
                          styles.courseColorIndicator,
                          { backgroundColor: event.courseColor || colors.primary },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <AppText variant="body" style={{ fontWeight: "600", flex: 1, marginRight: spacing.xs }}>
                            {event.title}
                          </AppText>
                          {getEventBadge(event.eventType)}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 4 }}>
                          <AppText variant="caption" colorRole="secondary">
                            ⏰ {event.timeStr}
                          </AppText>
                          {Boolean(event.courseCode) && (
                            <AppText variant="caption" colorRole="tertiary">
                              · {event.courseCode}
                            </AppText>
                          )}
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            );
          })
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
  monthNavRow: {
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
  monthTitleBox: {
    alignItems: "center",
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  dayGroup: {
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  eventCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  courseColorIndicator: {
    width: 4,
    height: "100%",
    borderRadius: 2,
    minHeight: 40,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  intelCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  intelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clustersContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  clusterBox: {
    padding: spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    backgroundColor: "rgba(245, 158, 11, 0.05)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  studyWindowCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  studyWindowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  focusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
});
