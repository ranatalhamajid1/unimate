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
import { Stack } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import type { MobileAssignmentItem, MobileCourse } from "@/lib/types";

const FILTER_TABS = [
  { value: "ALL", label: "All" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;

export default function AssignmentsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<MobileAssignmentItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [status, setStatus] = useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("NOT_STARTED");
  const [formError, setFormError] = useState("");

  const {
    data: assignments = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; assignments: MobileAssignmentItem[] }>(
        "/api/mobile/assignments"
      );
      return res.assignments;
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; courses: MobileCourse[] }>(
        "/api/mobile/courses"
      );
      return res.courses;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post<{ success: boolean; assignment: MobileAssignmentItem }>(
        "/api/mobile/assignments",
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create assignment.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.put<{ success: boolean; assignment: MobileAssignmentItem }>(
        `/api/mobile/assignments/${id}`,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update assignment.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTargetId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete assignment.");
      setDeleteTargetId(null);
    },
  });

  // Quick toggle status
  const cycleStatus = (assignment: MobileAssignmentItem) => {
    let nextStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS";
    if (assignment.status === "NOT_STARTED") nextStatus = "IN_PROGRESS";
    else if (assignment.status === "IN_PROGRESS") nextStatus = "COMPLETED";
    else nextStatus = "NOT_STARTED";

    updateMutation.mutate({
      id: assignment.id,
      payload: {
        title: assignment.title,
        courseId: assignment.courseId,
        description: assignment.description,
        dueDate: assignment.dueDate,
        priority: assignment.priority,
        status: nextStatus,
      },
    });
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setTitle("");
    setCourseId(courses[0]?.id || "");
    setDescription("");
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setDueDate(d.toISOString().split("T")[0]);
    setPriority("MEDIUM");
    setStatus("NOT_STARTED");
    setFormError("");
    setModalVisible(true);
  };

  const openEditModal = (a: MobileAssignmentItem) => {
    setEditingAssignment(a);
    setTitle(a.title);
    setCourseId(a.courseId);
    setDescription(a.description || "");
    setDueDate(new Date(a.dueDate).toISOString().split("T")[0]);
    setPriority(a.priority);
    setStatus(a.status);
    setFormError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAssignment(null);
    setFormError("");
  };

  const handleSave = () => {
    if (!title.trim() || title.length < 2) {
      setFormError("Title must be at least 2 characters.");
      return;
    }
    if (!courseId) {
      setFormError("Please select a course.");
      return;
    }
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      setFormError("Please provide a valid date (YYYY-MM-DD).");
      return;
    }

    const payload = {
      title: title.trim(),
      courseId,
      description: description.trim(),
      dueDate: parsedDate.toISOString(),
      priority,
      status,
    };

    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredAssignments = assignments.filter((a: MobileAssignmentItem) => {
    if (activeFilter === "ALL") return true;
    return a.status === activeFilter;
  });

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Assignments", headerBackTitle: "More" }} />
        <LoadingState message="Loading assignments..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Assignments", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load assignments." onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: "Assignments",
          headerBackTitle: "More",
          headerRight: () => (
            <TouchableOpacity onPress={openCreateModal} style={styles.headerAddBtn}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View>
          <AppText variant="h2">Assignments</AppText>
          <AppText colorRole="secondary" variant="caption">
            Homework & coursework deadlines
          </AppText>
        </View>
        <Button
          title="+ Add"
          variant="primary"
          onPress={openCreateModal}
          disabled={courses.length === 0}
        />
      </View>

      <SegmentedControl
        options={FILTER_TABS}
        selectedValue={activeFilter}
        onSelect={setActiveFilter}
      />

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
        {filteredAssignments.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="checkmark-done-circle-outline" size={48} color={colors.accent} />}
            title="No assignments found"
            description={
              activeFilter === "ALL"
                ? "You have no upcoming or pending assignments."
                : `No assignments matching "${activeFilter}".`
            }
          />
        ) : (
          filteredAssignments.map((a) => {
            const due = new Date(a.dueDate);
            const isCompleted = a.status === "COMPLETED";
            return (
              <Card key={a.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badges}>
                    <StatusChip
                      label={
                        a.status === "COMPLETED"
                          ? "Completed"
                          : a.status === "IN_PROGRESS"
                          ? "In Progress"
                          : "Not Started"
                      }
                      variant={
                        a.status === "COMPLETED"
                          ? "success"
                          : a.status === "IN_PROGRESS"
                          ? "primary"
                          : "muted"
                      }
                      size="sm"
                    />
                    <PriorityBadge priority={a.priority} />
                  </View>
                  <TouchableOpacity
                    onPress={() => cycleStatus(a)}
                    style={styles.cycleBtn}
                    accessibilityLabel="Toggle assignment status"
                  >
                    <Ionicons
                      name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={isCompleted ? colors.success : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <AppText
                  variant="h3"
                  style={[
                    styles.title,
                    isCompleted && { textDecorationLine: "line-through", opacity: 0.6 },
                  ]}
                >
                  {a.title}
                </AppText>

                {a.description ? (
                  <AppText variant="bodySmall" colorRole="secondary" numberOfLines={2}>
                    {a.description}
                  </AppText>
                ) : null}

                <View style={styles.metaRow}>
                  <View style={styles.courseChip}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: a.course?.color || colors.primary },
                      ]}
                    />
                    <AppText variant="caption" colorRole="secondary">
                      {a.course?.code || "Course"}
                    </AppText>
                  </View>
                  <View style={styles.dueRow}>
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <AppText variant="caption" colorRole="secondary">
                      {due.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </AppText>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(a)}
                    style={styles.actionBtn}
                    accessibilityLabel="Edit assignment"
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                    <AppText variant="caption" colorRole="secondary">
                      Edit
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteTargetId(a.id)}
                    style={styles.actionBtn}
                    accessibilityLabel="Delete assignment"
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <AppText variant="caption" style={{ color: colors.danger }}>
                      Delete
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">
                {editingAssignment ? "Edit Assignment" : "Add Assignment"}
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

            <FormInput
              label="Assignment Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Lab Report 2"
            />

            {/* Course Selector */}
            <AppText variant="caption" style={styles.fieldLabel}>
              COURSE
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {courses.map((c) => {
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

            <FormInput
              label="Due Date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-09-15"
            />

            <FormInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Instructions or links..."
              multiline
            />

            {/* Priority */}
            <AppText variant="caption" style={styles.fieldLabel}>
              PRIORITY
            </AppText>
            <View style={styles.chipGroup}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
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
                      style={{ color: isSelected ? "#fff" : colors.textPrimary, fontWeight: "600" }}
                    >
                      {p}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status */}
            <AppText variant="caption" style={styles.fieldLabel}>
              STATUS
            </AppText>
            <View style={styles.chipGroup}>
              {STATUSES.map((s) => {
                const isSelected = status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
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
                      style={{ color: isSelected ? "#fff" : colors.textPrimary, fontWeight: "600" }}
                    >
                      {s.replace("_", " ")}
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
                  title={editingAssignment ? "Update" : "Create"}
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
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment?"
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
  headerAddBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cycleBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  courseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.1)",
    marginTop: spacing.sm,
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
  chipGroup: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
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
