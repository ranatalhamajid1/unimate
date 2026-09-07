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
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type {
  MobileStudyPlan,
  MobileStudyPlanItem,
  MobileDraftStudyPlan,
} from "@/lib/types";

export default function StudyPlansScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [availableHours, setAvailableHours] = useState("3");
  const [preferredStartTime, setPreferredStartTime] = useState("18:00");
  const [focusInstruction, setFocusInstruction] = useState("");
  const [draftPlan, setDraftPlan] = useState<MobileDraftStudyPlan | null>(null);
  const [aiError, setAiError] = useState("");
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["study-plans"],
    queryFn: async () => {
      return await apiClient.get<{ success: boolean; plan: MobileStudyPlan | null }>(
        "/api/mobile/study-plans"
      );
    },
  });

  // Complete Item Mutation
  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      return await apiClient.patch<{ success: boolean; completed: boolean }>(
        `/api/mobile/study-plans/items/${itemId}/complete`,
        { completed, autoLogSession: true }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update task.");
    },
  });

  // Delete Plan Mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/study-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeletePlanId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete plan.");
      setDeletePlanId(null);
    },
  });

  // AI Generation Mutation (Draft only - does not persist)
  const generateAiMutation = useMutation({
    mutationFn: async (payload: {
      availableHours: number;
      preferredStartTime: string;
      focusInstruction?: string;
    }) => {
      return await apiClient.post<{ success: boolean; plan: MobileDraftStudyPlan; isFallback: boolean }>(
        "/api/mobile/study-plans/generate",
        payload
      );
    },
    onSuccess: (res) => {
      setDraftPlan(res.plan);
      setAiError("");
    },
    onError: (err: any) => {
      setAiError(err.message || "Failed to generate AI study plan.");
    },
  });

  // Confirm & Persist Plan Mutation
  const savePlanMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      startDate: string;
      endDate: string;
      items: any[];
    }) => {
      return await apiClient.post<{ success: boolean; plan: MobileStudyPlan }>(
        "/api/mobile/study-plans",
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeAiModal();
    },
    onError: (err: any) => {
      setAiError(err.message || "Failed to save study plan.");
    },
  });

  const closeAiModal = () => {
    setAiModalVisible(false);
    setDraftPlan(null);
    setAiError("");
    setFocusInstruction("");
  };

  const handleGenerateAi = () => {
    const hrs = Number(availableHours);
    if (isNaN(hrs) || hrs < 0.5 || hrs > 12) {
      setAiError("Available study hours must be between 0.5 and 12.");
      return;
    }
    setAiError("");
    generateAiMutation.mutate({
      availableHours: hrs,
      preferredStartTime,
      focusInstruction: focusInstruction.trim() || undefined,
    });
  };

  const handleConfirmPlan = () => {
    if (!draftPlan) return;
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const items = draftPlan.items.map((it, idx) => {
      const [hh, mm] = (it.suggestedTime || preferredStartTime || "19:00").split(":");
      const sched = new Date(now);
      sched.setHours(Number(hh) || 19, Number(mm) || 0, 0, 0);

      return {
        courseId: it.courseId || null,
        title: it.title,
        description: it.reason || "",
        scheduledAt: sched.toISOString(),
        duration: it.duration,
        order: idx,
      };
    });

    savePlanMutation.mutate({
      title: draftPlan.title,
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      items,
    });
  };

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Study Plans", headerBackTitle: "More" }} />
        <LoadingState message="Loading active study plan..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Study Plans", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load study plan." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const activePlan = data?.plan;

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Study Plans", headerBackTitle: "More" }} />

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="h2">Study Plans</AppText>
            <AppText variant="caption" colorRole="secondary">
              Structured daily study sessions & AI planning
            </AppText>
          </View>
          <Button
            title="✨ AI Plan"
            size="sm"
            onPress={() => setAiModalVisible(true)}
            style={styles.aiButton}
          />
        </View>

        {!activePlan ? (
          <EmptyState
            icon={<Ionicons name="calendar-outline" size={48} color={colors.accent} />}
            title="No active study plan"
            description="Generate a personalized daily study plan with AI, prioritized by your nearest exams and deadlines."
            actionLabel="Generate with AI"
            onAction={() => setAiModalVisible(true)}
          />
        ) : (
          <View>
            {/* Active Plan Overview Card */}
            <Card style={styles.planOverviewCard}>
              <View style={styles.planTitleRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="h3">{activePlan.title}</AppText>
                  <AppText variant="caption" colorRole="secondary">
                    {activePlan.items.length} tasks · {Math.round(activePlan.totalDurationMinutes / 60 * 10) / 10}h total study
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={() => setDeletePlanId(activePlan.id)}
                  style={styles.trashBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Delete plan"
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>

              {/* Progress */}
              <View style={styles.progressHeader}>
                <AppText variant="caption" colorRole="secondary">
                  Completion Progress
                </AppText>
                <AppText variant="caption" style={{ color: colors.primary, fontWeight: "600" }}>
                  {activePlan.progressPercentage}%
                </AppText>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSecondary }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${activePlan.progressPercentage}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </Card>

            {/* Task list */}
            <AppText variant="h3" style={styles.tasksSectionTitle}>
              Scheduled Tasks ({activePlan.items.length})
            </AppText>

            {activePlan.items.map((task: MobileStudyPlanItem) => {
              const sched = new Date(task.scheduledAt);
              const timeFormatted = sched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <Card key={task.id} style={[styles.taskCard, task.completed && { opacity: 0.7 }]}>
                  <View style={styles.taskRow}>
                    <TouchableOpacity
                      onPress={() =>
                        toggleItemMutation.mutate({
                          itemId: task.id,
                          completed: !task.completed,
                        })
                      }
                      style={[
                        styles.checkbox,
                        {
                          borderColor: task.completed ? colors.primary : colors.border,
                          backgroundColor: task.completed ? colors.primary : "transparent",
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: task.completed }}
                    >
                      {task.completed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.taskInfo}>
                      <View style={styles.taskTopLine}>
                        <AppText
                          variant="body"
                          style={[
                            styles.taskTitle,
                            task.completed && styles.taskCompletedText,
                          ]}
                        >
                          {task.title}
                        </AppText>
                        <StatusChip
                          label={`${task.duration}m`}
                          variant="neutral"
                          size="sm"
                        />
                      </View>

                      {Boolean(task.description) && (
                        <AppText
                          variant="caption"
                          colorRole="secondary"
                          numberOfLines={2}
                          style={styles.taskDesc}
                        >
                          {task.description}
                        </AppText>
                      )}

                      <View style={styles.taskMetaRow}>
                        <AppText variant="caption" colorRole="tertiary">
                          ⏰ {timeFormatted}
                        </AppText>
                        {task.course && (
                          <StatusChip
                            label={task.course.code}
                            variant="primary"
                            size="sm"
                          />
                        )}
                        {task.completed && (
                          <StatusChip
                            label="Session Logged"
                            variant="accent"
                            size="sm"
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* AI Study Plan Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAiModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="sparkles" size={20} color={colors.accent} />
                <AppText variant="h3">AI Study Plan</AppText>
              </View>
              <TouchableOpacity onPress={closeAiModal}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {!draftPlan ? (
              <View>
                <AppText variant="caption" colorRole="secondary" style={{ marginBottom: spacing.md }}>
                  UniMate analyzes your course deadlines, exams, and free time to build a customized study schedule.
                </AppText>

                <AppText variant="caption" style={styles.modalFieldLabel}>
                  AVAILABLE STUDY HOURS TODAY
                </AppText>
                <View style={styles.hourButtonsRow}>
                  {["1", "2", "3", "4", "5"].map((h) => {
                    const isSelected = availableHours === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        onPress={() => setAvailableHours(h)}
                        style={[
                          styles.hourChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          style={{
                            color: isSelected ? "#FFFFFF" : colors.textPrimary,
                            fontWeight: isSelected ? "600" : "400",
                          }}
                        >
                          {h}h
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <FormInput
                  label="PREFERRED START TIME"
                  value={preferredStartTime}
                  onChangeText={setPreferredStartTime}
                  placeholder="18:00"
                />

                <FormInput
                  label="SPECIAL FOCUS OR REQUEST (OPTIONAL)"
                  value={focusInstruction}
                  onChangeText={setFocusInstruction}
                  placeholder="e.g. Focus on algorithms midterm revision"
                />

                {Boolean(aiError) && (
                  <AppText variant="caption" style={{ color: colors.danger, marginVertical: spacing.xs }}>
                    {aiError}
                  </AppText>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={closeAiModal}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Generate Draft"
                    onPress={handleGenerateAi}
                    loading={generateAiMutation.isPending}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              // Draft preview before persistence
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.draftBanner, { backgroundColor: colors.accentSubtle }]}>
                  <AppText variant="h3" colorRole="accent">
                    {draftPlan.title}
                  </AppText>
                  <AppText variant="caption" colorRole="secondary" style={{ marginTop: 4 }}>
                    {draftPlan.summary}
                  </AppText>
                </View>

                <AppText variant="caption" style={styles.modalFieldLabel}>
                  PROPOSED SESSIONS ({draftPlan.items.length})
                </AppText>

                {draftPlan.items.map((it, idx) => (
                  <Card key={idx} style={styles.draftItemCard}>
                    <View style={styles.draftItemHeader}>
                      <AppText variant="body" style={{ fontWeight: "600", flex: 1 }}>
                        {it.title}
                      </AppText>
                      <StatusChip label={`${it.duration}m`} variant="neutral" size="sm" />
                    </View>
                    <AppText variant="caption" colorRole="secondary" style={{ marginTop: 2 }}>
                      {it.reason}
                    </AppText>
                    <View style={styles.draftItemMeta}>
                      <StatusChip label={it.courseCode || "GEN"} variant="primary" size="sm" />
                      <AppText variant="caption" colorRole="tertiary">
                        Suggested: {it.suggestedTime || "19:00"}
                      </AppText>
                    </View>
                  </Card>
                ))}

                {Boolean(aiError) && (
                  <AppText variant="caption" style={{ color: colors.danger, marginVertical: spacing.xs }}>
                    {aiError}
                  </AppText>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title="Back"
                    variant="outline"
                    onPress={() => setDraftPlan(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save & Activate"
                    onPress={handleConfirmPlan}
                    loading={savePlanMutation.isPending}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={Boolean(deletePlanId)}
        title="Delete Study Plan"
        message="Are you sure you want to delete this study plan and all its scheduled tasks?"
        onConfirm={() => {
          if (deletePlanId) {
            deletePlanMutation.mutate(deletePlanId);
          }
        }}
        onCancel={() => setDeletePlanId(null)}
        isLoading={deletePlanMutation.isPending}
      />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  aiButton: {
    minHeight: 38,
  },
  planOverviewCard: {
    marginBottom: spacing.lg,
  },
  planTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trashBtn: {
    padding: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  tasksSectionTitle: {
    marginBottom: spacing.sm,
  },
  taskCard: {
    marginBottom: spacing.sm,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.xs,
  },
  taskCompletedText: {
    textDecorationLine: "line-through",
    color: "#888888",
  },
  taskDesc: {
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    borderRadius: BorderRadius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalFieldLabel: {
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  hourButtonsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  hourChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  draftBanner: {
    padding: spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: spacing.md,
  },
  draftItemCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  draftItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  draftItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
});
