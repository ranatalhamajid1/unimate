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
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import type { MobileExamItem, MobileCourse } from "@/lib/types";

const EXAM_TABS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ALL", label: "All" },
];

const EXAM_TYPES = ["MIDTERM", "FINAL", "QUIZ", "OTHER"] as const;

export default function ExamsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("UPCOMING");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState<MobileExamItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [room, setRoom] = useState("");
  const [type, setType] = useState<string>("MIDTERM");
  const [progress, setProgress] = useState("50");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const {
    data: exams = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; exams: MobileExamItem[] }>(
        "/api/mobile/exams"
      );
      return res.exams;
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
      return await apiClient.post<{ success: boolean; exam: MobileExamItem }>("/api/mobile/exams", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create exam.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.put<{ success: boolean; exam: MobileExamItem }>(`/api/mobile/exams/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update exam.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTargetId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete exam.");
      setDeleteTargetId(null);
    },
  });

  const openCreateModal = () => {
    setEditingExam(null);
    setTitle("");
    setCourseId(courses[0]?.id || "");
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setExamDate(d.toISOString().split("T")[0]);
    setRoom("");
    setType("MIDTERM");
    setProgress("50");
    setNotes("");
    setFormError("");
    setModalVisible(true);
  };

  const openEditModal = (e: MobileExamItem) => {
    setEditingExam(e);
    setTitle(e.title);
    setCourseId(e.courseId);
    setExamDate(new Date(e.examDate).toISOString().split("T")[0]);
    setRoom(e.room || "");
    setType(e.type || "MIDTERM");
    setProgress(String(e.preparationProgress ?? 0));
    setNotes(e.notes || "");
    setFormError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingExam(null);
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
    const parsedDate = new Date(examDate);
    if (isNaN(parsedDate.getTime())) {
      setFormError("Please enter a valid date (YYYY-MM-DD).");
      return;
    }
    const prepNum = Number(progress);
    if (isNaN(prepNum) || prepNum < 0 || prepNum > 100) {
      setFormError("Preparation progress must be between 0 and 100.");
      return;
    }

    const payload = {
      title: title.trim(),
      courseId,
      examDate: parsedDate.toISOString(),
      room: room.trim(),
      type,
      preparationProgress: Math.round(prepNum),
      notes: notes.trim(),
    };

    if (editingExam) {
      updateMutation.mutate({ id: editingExam.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredExams = exams.filter((e: MobileExamItem) => {
    if (activeTab === "ALL") return true;
    return e.status === activeTab;
  });

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Exams", headerBackTitle: "More" }} />
        <LoadingState message="Loading exams..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Exams", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load exams." onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: "Exams",
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
          <AppText variant="h2">Exams</AppText>
          <AppText colorRole="secondary" variant="caption">
            Midterms, finals & test schedules
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
        options={EXAM_TABS}
        selectedValue={activeTab}
        onSelect={setActiveTab}
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
        {filteredExams.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="school-outline" size={48} color={colors.accent} />}
            title="No exams scheduled"
            description={
              activeTab === "UPCOMING"
                ? "You have no upcoming midterms or finals."
                : "No exams found in this category."
            }
          />
        ) : (
          filteredExams.map((exam: MobileExamItem) => {
            const dateObj = new Date(exam.examDate);
            const now = new Date();
            const daysLeft = Math.ceil(
              (dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            const isCompleted = exam.status === "COMPLETED";

            return (
              <Card key={exam.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badges}>
                    <StatusChip
                      label={exam.type}
                      variant={
                        exam.type === "FINAL"
                          ? "danger"
                          : exam.type === "MIDTERM"
                          ? "primary"
                          : "warning"
                      }
                      size="sm"
                    />
                    <StatusChip
                      label={isCompleted ? "Completed" : daysLeft <= 1 ? "Urgent" : `${daysLeft}d left`}
                      variant={isCompleted ? "success" : daysLeft <= 1 ? "danger" : "default"}
                      size="sm"
                    />
                  </View>
                </View>

                <AppText variant="h3" style={styles.title}>
                  {exam.title}
                </AppText>

                <View style={styles.metaRow}>
                  <View style={styles.courseChip}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: exam.course?.color || colors.primary },
                      ]}
                    />
                    <AppText variant="caption" colorRole="secondary">
                      {exam.course?.name || "Course"} ({exam.course?.code})
                    </AppText>
                  </View>

                  <View style={styles.dueRow}>
                    <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                    <AppText variant="caption" colorRole="secondary">
                      {dateObj.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </AppText>
                  </View>
                </View>

                {exam.room ? (
                  <View style={styles.roomRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                    <AppText variant="caption" colorRole="secondary">
                      {exam.room}
                    </AppText>
                  </View>
                ) : null}

                {/* Preparation Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <AppText variant="caption" colorRole="secondary">
                      Preparation
                    </AppText>
                    <AppText variant="caption" style={{ fontWeight: "700" }}>
                      {exam.preparationProgress}%
                    </AppText>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceHover }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, exam.preparationProgress))}%`,
                          backgroundColor:
                            exam.preparationProgress >= 80
                              ? colors.success
                              : exam.preparationProgress >= 50
                              ? colors.primary
                              : colors.warning,
                        },
                      ]}
                    />
                  </View>
                </View>

                {exam.notes ? (
                  <AppText variant="caption" colorRole="secondary" style={styles.notes}>
                    Note: {exam.notes}
                  </AppText>
                ) : null}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(exam)}
                    style={styles.actionBtn}
                    accessibilityLabel="Edit exam"
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                    <AppText variant="caption" colorRole="secondary">
                      Edit
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteTargetId(exam.id)}
                    style={styles.actionBtn}
                    accessibilityLabel="Delete exam"
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
              <AppText variant="h3">{editingExam ? "Edit Exam" : "Add Exam"}</AppText>
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
              label="Exam Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Midterm Examination"
            />

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

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Exam Date (YYYY-MM-DD)"
                  value={examDate}
                  onChangeText={setExamDate}
                  placeholder="2026-09-20"
                />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Progress % (0-100)"
                  value={progress}
                  onChangeText={setProgress}
                  placeholder="50"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <FormInput
              label="Room / Location (Optional)"
              value={room}
              onChangeText={setRoom}
              placeholder="e.g. Auditorium Hall B"
            />

            {/* Exam Type */}
            <AppText variant="caption" style={styles.fieldLabel}>
              EXAM TYPE
            </AppText>
            <View style={styles.chipGroup}>
              {EXAM_TYPES.map((t) => {
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
                      style={{ color: isSelected ? "#fff" : colors.textPrimary, fontWeight: "600" }}
                    >
                      {t}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FormInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Topics covered, syllabus..."
            />

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="outline" onPress={closeModal} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={editingExam ? "Update" : "Save Exam"}
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
        title="Delete Exam"
        message="Are you sure you want to delete this exam record?"
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
  title: {
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
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
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  notes: {
    marginTop: spacing.sm,
    fontStyle: "italic",
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
  row: {
    flexDirection: "row",
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
