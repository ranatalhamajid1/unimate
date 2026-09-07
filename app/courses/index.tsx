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
import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import type { MobileCourse } from "@/lib/types";

const COLOR_PRESETS = [
  "#2563eb", // Blue
  "#4f46e5", // Indigo
  "#7c3aed", // Purple
  "#059669", // Emerald
  "#d97706", // Amber
  "#e11d48", // Rose
  "#0284c7", // Sky
  "#0d9488", // Teal
];

export default function CoursesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<MobileCourse | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [creditHours, setCreditHours] = useState("3");
  const [semester, setSemester] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [formError, setFormError] = useState("");

  const {
    data: courses = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
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
      return await apiClient.post<{ success: boolean; course: MobileCourse }>(
        "/api/mobile/courses",
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create course.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.put<{ success: boolean; course: MobileCourse }>(
        `/api/mobile/courses/${id}`,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update course.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTargetId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete course.");
      setDeleteTargetId(null);
    },
  });

  const openCreateModal = () => {
    setEditingCourse(null);
    setName("");
    setCode("");
    setInstructor("");
    setCreditHours("3");
    setSemester("");
    setColor(COLOR_PRESETS[0]);
    setFormError("");
    setModalVisible(true);
  };

  const openEditModal = (c: MobileCourse) => {
    setEditingCourse(c);
    setName(c.name);
    setCode(c.code);
    setInstructor(c.instructor || "");
    setCreditHours(String(c.creditHours));
    setSemester(c.semester || "");
    setColor(c.color || COLOR_PRESETS[0]);
    setFormError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCourse(null);
    setFormError("");
  };

  const handleSave = () => {
    if (!name.trim() || name.length < 2) {
      setFormError("Course name must be at least 2 characters.");
      return;
    }
    if (!code.trim() || code.length < 2) {
      setFormError("Course code must be at least 2 characters.");
      return;
    }
    const credits = Number(creditHours);
    if (isNaN(credits) || credits < 1 || credits > 6) {
      setFormError("Credit hours must be an integer between 1 and 6.");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      instructor: instructor.trim(),
      creditHours: credits,
      semester: semester.trim(),
      color,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Courses", headerBackTitle: "More" }} />
        <LoadingState message="Loading courses..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Courses", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load courses." onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: "Courses",
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
          <AppText variant="h2">Your Courses</AppText>
          <AppText colorRole="secondary" variant="caption">
            {courses.length} enrolled {courses.length === 1 ? "course" : "courses"}
          </AppText>
        </View>
        <Button title="+ Add Course" variant="primary" onPress={openCreateModal} />
      </View>

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
        {courses.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="book-outline" size={48} color={colors.accent} />}
            title="No courses yet"
            description="Add your enrolled semester courses to schedule classes, track assignments, and calculate your GPA."
          />
        ) : (
          courses.map((course: MobileCourse) => (
            <Card key={course.id} style={styles.courseCard}>
              <View style={styles.cardTop}>
                <View style={[styles.codeBadge, { backgroundColor: course.color + "1A" }]}>
                  <AppText variant="caption" style={{ color: course.color, fontWeight: "700" }}>
                    {course.code}
                  </AppText>
                </View>
                <AppText variant="caption" colorRole="secondary">
                  {course.creditHours} {course.creditHours === 1 ? "Credit" : "Credits"}
                </AppText>
              </View>

              <AppText variant="h3" style={{ marginBottom: 4 }}>
                {course.name}
              </AppText>

              {course.instructor ? (
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                  <AppText variant="caption" colorRole="secondary">
                    {course.instructor}
                  </AppText>
                </View>
              ) : null}

              {course.semester ? (
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <AppText variant="caption" colorRole="secondary">
                    {course.semester}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => openEditModal(course)}
                  style={styles.actionBtn}
                  accessibilityLabel="Edit course"
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                  <AppText variant="caption" colorRole="secondary">
                    Edit
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDeleteTargetId(course.id)}
                  style={styles.actionBtn}
                  accessibilityLabel="Delete course"
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

      {/* Course Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">{editingCourse ? "Edit Course" : "Add Course"}</AppText>
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
              label="Course Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Data Structures & Algorithms"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Course Code"
                  value={code}
                  onChangeText={setCode}
                  placeholder="e.g. CS201"
                  autoCapitalize="characters"
                />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Credit Hours"
                  value={creditHours}
                  onChangeText={setCreditHours}
                  placeholder="3"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <FormInput
              label="Instructor (Optional)"
              value={instructor}
              onChangeText={setInstructor}
              placeholder="e.g. Prof. Alan Turing"
            />

            <FormInput
              label="Semester (Optional)"
              value={semester}
              onChangeText={setSemester}
              placeholder="e.g. Spring 2026"
            />

            {/* Color Presets */}
            <AppText variant="caption" style={styles.fieldLabel}>
              COLOR ACCENT
            </AppText>
            <View style={styles.colorRow}>
              {COLOR_PRESETS.map((c) => {
                const isSelected = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      isSelected && styles.colorDotSelected,
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
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
                  title={editingCourse ? "Update" : "Save Course"}
                  variant="primary"
                  onPress={handleSave}
                  loading={createMutation.isPending || updateMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDeleteModal
        visible={!!deleteTargetId}
        title="Delete Course"
        message="Deleting this course will also delete associated timetable slots, assignments, and exam records."
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
  courseCard: {
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  codeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
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
  row: {
    flexDirection: "row",
  },
  colorRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
