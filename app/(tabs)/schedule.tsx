import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { StatusChip } from "@/components/ui/StatusChip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import type { MobileTimetableEntry, MobileCourse } from "@/lib/types";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

const TYPES = ["Lecture", "Lab", "Tutorial", "Other"] as const;

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  });

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MobileTimetableEntry | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [courseId, setCourseId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [room, setRoom] = useState("");
  const [type, setType] = useState<string>("Lecture");
  const [formError, setFormError] = useState("");

  // Fetch timetable
  const {
    data: timetableData,
    isLoading: isTimetableLoading,
    isError: isTimetableError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["timetable"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; timetable: MobileTimetableEntry[] }>(
        "/api/mobile/timetable"
      );
      return res.timetable;
    },
  });

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; courses: MobileCourse[] }>(
        "/api/mobile/courses"
      );
      return res.courses;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post<{ success: boolean; entry: MobileTimetableEntry }>(
        "/api/mobile/timetable",
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create class slot.");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.put<{ success: boolean; entry: MobileTimetableEntry }>(
        `/api/mobile/timetable/${id}`,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update class slot.");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/timetable/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTargetId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete slot.");
      setDeleteTargetId(null);
    },
  });

  const openCreateModal = () => {
    setEditingEntry(null);
    setCourseId(courses[0]?.id || "");
    setStartTime("09:00");
    setEndTime("10:30");
    setRoom("");
    setType("Lecture");
    setFormError("");
    setModalVisible(true);
  };

  const openEditModal = (entry: MobileTimetableEntry) => {
    setEditingEntry(entry);
    setCourseId(entry.courseId);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setRoom(entry.room || "");
    setType(entry.type || "Lecture");
    setFormError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingEntry(null);
    setFormError("");
  };

  const handleSave = () => {
    if (!courseId) {
      setFormError("Please select a course.");
      return;
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      setFormError("Times must be in HH:MM format (24h).");
      return;
    }

    const payload = {
      courseId,
      dayOfWeek: selectedDay,
      startTime,
      endTime,
      room,
      type,
    };

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const dayEntries = (timetableData || [])
    .filter((e: MobileTimetableEntry) => e.dayOfWeek === selectedDay)
    .sort((a: MobileTimetableEntry, b: MobileTimetableEntry) => a.startTime.localeCompare(b.startTime));

  if (isTimetableLoading && !isRefetching) {
    return (
      <Screen>
        <LoadingState message="Loading your schedule..." />
      </Screen>
    );
  }

  if (isTimetableError) {
    return (
      <Screen>
        <ErrorState message="Could not load timetable." onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <View>
          <AppText variant="h2">Schedule</AppText>
          <AppText colorRole="secondary" variant="caption">
            Weekly timetable & lectures
          </AppText>
        </View>
        <Button
          title="+ Add Class"
          variant="primary"
          onPress={openCreateModal}
          disabled={courses.length === 0}
        />
      </View>

      {/* Day Selector */}
      <SegmentedControl
        options={DAYS}
        selectedValue={selectedDay}
        onSelect={setSelectedDay}
        scrollable
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="book-outline" size={48} color={colors.accent} />}
          title="No courses created yet"
          description="You need to add a course before adding class slots to your schedule."
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {dayEntries.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="sunny-outline" size={48} color={colors.accent} />}
              title="No classes scheduled"
              description={`No lectures or labs scheduled for ${
                DAYS.find((d) => d.value === selectedDay)?.label
              }.`}
            />
          ) : (
            dayEntries.map((entry: MobileTimetableEntry) => (
              <Card key={entry.id} style={styles.classCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <AppText variant="caption" style={{ color: colors.primary, fontWeight: "700" }}>
                      {entry.startTime} – {entry.endTime}
                    </AppText>
                  </View>
                  <StatusChip
                    label={entry.type}
                    variant={entry.type.toLowerCase() === "lab" ? "warning" : "primary"}
                    size="sm"
                  />
                </View>

                <View style={styles.courseInfo}>
                  <View
                    style={[
                      styles.colorBar,
                      { backgroundColor: entry.course?.color || colors.primary },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText variant="h3">{entry.course?.name || "Course"}</AppText>
                    <AppText variant="caption" colorRole="secondary">
                      {entry.course?.code} {entry.room ? `• ${entry.room}` : ""}
                    </AppText>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(entry)}
                    style={styles.actionBtn}
                    accessibilityLabel="Edit class slot"
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                    <AppText variant="caption" colorRole="secondary">
                      Edit
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteTargetId(entry.id)}
                    style={styles.actionBtn}
                    accessibilityLabel="Delete class slot"
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <AppText variant="caption" style={{ color: colors.danger }}>
                      Delete
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">
                {editingEntry ? "Edit Class Slot" : "Add Class Slot"}
              </AppText>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <AppText variant="caption" style={{ color: colors.danger, marginBottom: spacing.sm }}>
                {formError}
              </AppText>
            ) : null}

            {/* Course Selector */}
            <AppText variant="caption" style={styles.fieldLabel}>
              COURSE
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {courses.map((c: MobileCourse) => {
                const isSelected = c.id === courseId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCourseId(c.id)}
                    style={[
                      styles.selectableChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceHover,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: isSelected ? "#fff" : colors.textPrimary,
                        fontWeight: "600",
                      }}
                    >
                      {c.code}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time row */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Start Time (24h)"
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  autoCapitalize="none"
                />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <FormInput
                  label="End Time (24h)"
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:30"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Room */}
            <FormInput
              label="Room / Hall"
              value={room}
              onChangeText={setRoom}
              placeholder="e.g. Lab 2, Hall A"
            />

            {/* Class Type */}
            <AppText variant="caption" style={styles.fieldLabel}>
              CLASS TYPE
            </AppText>
            <View style={styles.typeRow}>
              {TYPES.map((t) => {
                const isSelected = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceHover,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: isSelected ? "#fff" : colors.textPrimary,
                        fontWeight: "600",
                      }}
                    >
                      {t}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="outline" onPress={closeModal} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={editingEntry ? "Update" : "Create"}
                  variant="primary"
                  onPress={handleSave}
                  loading={createMutation.isPending || updateMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDeleteModal
        visible={!!deleteTargetId}
        title="Delete Class Slot"
        message="Are you sure you want to remove this class slot from your timetable?"
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  classCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  courseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.1)",
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  selectableChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: spacing.sm,
    minHeight: 36,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
