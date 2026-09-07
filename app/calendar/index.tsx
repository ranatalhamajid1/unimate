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
import { Stack } from "expo-router";
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
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type { MobileCalendarData, MobileCalendarEvent } from "@/lib/types";

const FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "CLASS", label: "Classes" },
  { value: "ASSIGNMENT", label: "Deadlines" },
  { value: "EXAM", label: "Exams" },
  { value: "STUDY", label: "Study" },
];

export default function CalendarScreen() {
  const { colors } = useTheme();

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
            style={[styles.navBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCurrentMonth} style={styles.monthTitleBox}>
            <AppText variant="h2">{calendar?.monthLabel || "Calendar"}</AppText>
            <AppText variant="caption" colorRole="tertiary">
              Asia/Karachi (PKT)
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={[styles.navBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={selectedFilter}
            onChange={setSelectedFilter}
          />
        </View>

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
            const dateObj = new Date(`${dateKey}T12:00:00`);
            const dayName = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

            return (
              <View key={dateKey} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <AppText variant="label" style={{ color: colors.primary, fontWeight: "600" }}>
                    {dayName}
                  </AppText>
                  <AppText variant="caption" colorRole="tertiary">
                    {dayEvents.length} {dayEvents.length === 1 ? "item" : "items"}
                  </AppText>
                </View>

                {dayEvents.map((ev: MobileCalendarEvent) => (
                  <Card key={ev.id} style={styles.eventCard}>
                    <View style={styles.eventRow}>
                      <View style={[styles.courseColorIndicator, { backgroundColor: ev.courseColor || colors.primary }]} />
                      <View style={styles.eventInfo}>
                        <View style={styles.eventTitleRow}>
                          <AppText variant="body" style={{ fontWeight: "600", flex: 1 }}>
                            {ev.title}
                          </AppText>
                          {getEventBadge(ev.eventType)}
                        </View>

                        <View style={styles.eventMetaRow}>
                          <AppText variant="caption" colorRole="secondary">
                            ⏰ {ev.timeStr || "All Day"}
                          </AppText>
                          {Boolean(ev.courseCode) && (
                            <StatusChip label={ev.courseCode} variant="neutral" size="sm" />
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
});
