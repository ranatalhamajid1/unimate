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
import type { MobileGoalProgressItem, MobileStudentGoalItem } from "@/lib/types";

const GOAL_OPTIONS = [
  {
    type: "TARGET_GPA",
    label: "Target GPA",
    min: 1.0,
    max: 4.0,
    unit: "GPA",
    suggested: "3.5",
    defaultPeriod: "SEMESTER",
  },
  {
    type: "WEEKLY_STUDY_HOURS",
    label: "Weekly Study Target",
    min: 1,
    max: 80,
    unit: "hours",
    suggested: "15",
    defaultPeriod: "WEEKLY",
  },
  {
    type: "ATTENDANCE",
    label: "Attendance Target",
    min: 50,
    max: 100,
    unit: "%",
    suggested: "85",
    defaultPeriod: "CURRENT",
  },
  {
    type: "ASSIGNMENT_COMPLETION",
    label: "Assignment Completion",
    min: 50,
    max: 100,
    unit: "%",
    suggested: "90",
    defaultPeriod: "SEMESTER",
  },
];

export default function GoalsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(GOAL_OPTIONS[0].type);
  const [targetValue, setTargetValue] = useState(GOAL_OPTIONS[0].suggested);
  const [period, setPeriod] = useState(GOAL_OPTIONS[0].defaultPeriod);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      return await apiClient.get<{
        success: boolean;
        goals: MobileStudentGoalItem[];
        progress: MobileGoalProgressItem[];
      }>("/api/mobile/goals");
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: { type: string; targetValue: number; period?: string }) => {
      return await apiClient.post<{ success: boolean; goal: MobileStudentGoalItem }>(
        "/api/mobile/goals",
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setModalVisible(false);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to save goal.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTargetId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to reset goal.");
      setDeleteTargetId(null);
    },
  });

  const openSetGoalModal = (item?: MobileGoalProgressItem) => {
    if (item) {
      setSelectedType(item.type);
      setTargetValue(String(item.targetValue));
      setPeriod(item.period || "SEMESTER");
    } else {
      setSelectedType(GOAL_OPTIONS[0].type);
      setTargetValue(GOAL_OPTIONS[0].suggested);
      setPeriod(GOAL_OPTIONS[0].defaultPeriod);
    }
    setFormError("");
    setModalVisible(true);
  };

  const handleSaveGoal = () => {
    const num = Number(targetValue);
    const opt = GOAL_OPTIONS.find((o) => o.type === selectedType);
    if (!opt) return;

    if (isNaN(num) || num < opt.min || num > opt.max) {
      setFormError(`${opt.label} must be between ${opt.min} and ${opt.max} ${opt.unit}.`);
      return;
    }

    upsertMutation.mutate({
      type: selectedType,
      targetValue: num,
      period,
    });
  };

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academic Goals", headerBackTitle: "More" }} />
        <LoadingState message="Loading goals and progress..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academic Goals", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load goals." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const progressList = data?.progress || [];
  const configuredCount = progressList.filter((g) => g.isConfigured).length;
  const atRiskCount = progressList.filter((g) => g.isConfigured && g.isAtRisk).length;

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Academic Goals", headerBackTitle: "More" }} />

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
        {/* Header Summary */}
        <View style={styles.header}>
          <View>
            <AppText variant="h2">Student Goals</AppText>
            <AppText variant="caption" colorRole="secondary">
              Track and maintain your semester targets
            </AppText>
          </View>
          <Button
            title="+ Set Goal"
            size="sm"
            onPress={() => openSetGoalModal()}
            style={styles.addButton}
          />
        </View>

        {/* Overview Stats */}
        <View style={styles.summaryRow}>
          <Card style={[styles.statBox, { borderColor: colors.border }]}>
            <AppText variant="caption" colorRole="secondary">
              Configured Goals
            </AppText>
            <AppText variant="h2" style={{ color: colors.primary, marginTop: 4 }}>
              {configuredCount} / {progressList.length}
            </AppText>
          </Card>
          <Card style={[styles.statBox, { borderColor: colors.border }]}>
            <AppText variant="caption" colorRole="secondary">
              Goals At Risk
            </AppText>
            <AppText
              variant="h2"
              style={{
                color: atRiskCount > 0 ? colors.danger : colors.accent,
                marginTop: 4,
              }}
            >
              {atRiskCount}
            </AppText>
          </Card>
        </View>

        {/* Goal Cards */}
        {progressList.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="flag-outline" size={48} color={colors.accent} />}
            title="No goals tracked"
            description="Set your target GPA, attendance threshold, and study hour benchmarks."
          />
        ) : (
          progressList.map((item: MobileGoalProgressItem) => {
            const cappedPercent = Math.min(100, Math.max(0, item.percentage));
            const isExceeded = item.percentage >= 100;

            return (
              <Card key={item.type} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <AppText variant="h3">{item.label}</AppText>
                    <View style={styles.chipRow}>
                      <StatusChip
                        label={item.period}
                        variant="neutral"
                        size="sm"
                      />
                      {item.isAtRisk && (
                        <StatusChip
                          label="At Risk"
                          variant="danger"
                          size="sm"
                        />
                      )}
                      {isExceeded && (
                        <StatusChip
                          label="Target Achieved"
                          variant="accent"
                          size="sm"
                        />
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => openSetGoalModal(item)}
                    style={styles.editIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.label}`}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <AppText variant="caption" colorRole="secondary" style={styles.descriptionText}>
                  {item.description}
                </AppText>

                {/* Progress Metric Values */}
                <View style={styles.valuesRow}>
                  <View>
                    <AppText variant="caption" colorRole="secondary">
                      Current
                    </AppText>
                    <AppText variant="h3">{item.formattedCurrent}</AppText>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <AppText variant="caption" colorRole="secondary">
                      Target
                    </AppText>
                    <AppText variant="h3" style={{ color: colors.primary }}>
                      {item.formattedTarget}
                    </AppText>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSecondary }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${cappedPercent}%`,
                        backgroundColor: item.isAtRisk
                          ? colors.danger
                          : isExceeded
                          ? colors.accent
                          : colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.cardFooter}>
                  <AppText variant="caption" colorRole="tertiary">
                    {item.percentage}% achieved
                  </AppText>
                  {item.goalId && (
                    <TouchableOpacity
                      onPress={() => setDeleteTargetId(item.goalId!)}
                      style={styles.resetBtn}
                    >
                      <AppText variant="caption" style={{ color: colors.danger }}>
                        Reset Goal
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Goal Configure Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Configure Target</AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <AppText variant="caption" style={styles.modalFieldLabel}>
              GOAL TYPE
            </AppText>
            <View style={styles.typeSelectorRow}>
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => {
                      setSelectedType(opt.type);
                      setTargetValue(opt.suggested);
                      setPeriod(opt.defaultPeriod);
                    }}
                    style={[
                      styles.typeChip,
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
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target Value Input */}
            <FormInput
              label="TARGET VALUE"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="decimal-pad"
              placeholder={`e.g. ${GOAL_OPTIONS.find((o) => o.type === selectedType)?.suggested}`}
            />

            {/* Period Selector */}
            <AppText variant="caption" style={styles.modalFieldLabel}>
              EVALUATION PERIOD
            </AppText>
            <View style={styles.periodRow}>
              {["CURRENT", "WEEKLY", "MONTHLY", "SEMESTER"].map((p) => {
                const isSelected = period === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={[
                      styles.periodChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.accent : colors.border,
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
                      {p}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {Boolean(formError) && (
              <AppText variant="caption" style={{ color: colors.danger, marginTop: spacing.sm }}>
                {formError}
              </AppText>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Target"
                onPress={handleSaveGoal}
                loading={upsertMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={Boolean(deleteTargetId)}
        title="Reset Goal"
        message="Are you sure you want to reset this goal? Your progress tracking for this metric will return to the default suggested benchmark."
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMutation.mutate(deleteTargetId);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
        isLoading={deleteMutation.isPending}
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
  addButton: {
    minHeight: 38,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  editIconBtn: {
    padding: spacing.xs,
  },
  descriptionText: {
    marginTop: spacing.xs,
  },
  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginVertical: spacing.xs,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  resetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
  typeSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
