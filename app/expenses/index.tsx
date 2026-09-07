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
import type { MobileExpenseItem, MobileExpenseSummary } from "@/lib/types";

const CATEGORIES = [
  "TUITION",
  "BOOKS",
  "TRANSPORT",
  "FOOD",
  "HOSTEL",
  "STATIONERY",
  "HEALTH",
  "ENTERTAINMENT",
  "OTHER",
] as const;

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("FOOD");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        expenses: MobileExpenseItem[];
        summary: MobileExpenseSummary;
      }>("/api/mobile/expenses");
      return res;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post<{ success: boolean; expense: MobileExpenseItem }>("/api/mobile/expenses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to add expense.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDeleteTargetId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete expense.");
      setDeleteTargetId(null);
    },
  });

  const openCreateModal = () => {
    setAmount("");
    setCategory("FOOD");
    setDescription("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setFormError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormError("");
  };

  const handleSave = () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }

    const d = new Date(expenseDate);
    if (isNaN(d.getTime())) {
      setFormError("Please enter a valid date (YYYY-MM-DD).");
      return;
    }

    createMutation.mutate({
      amount: num,
      category,
      description: description.trim(),
      expenseDate: d.toISOString(),
    });
  };

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Expenses", headerBackTitle: "More" }} />
        <LoadingState message="Loading expenses..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Expenses", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load expenses." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const expenses = data?.expenses || [];
  const summary = data?.summary;

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: "Expenses",
          headerBackTitle: "More",
          headerRight: () => (
            <TouchableOpacity onPress={openCreateModal} style={styles.headerAddBtn}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

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
        <View style={styles.header}>
          <View>
            <AppText variant="h2">Student Budget</AppText>
            <AppText colorRole="secondary" variant="caption">
              Expense tracker & financial overview
            </AppText>
          </View>
          <Button title="+ Add" variant="primary" onPress={openCreateModal} />
        </View>

        {/* Summary Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <AppText variant="caption" colorRole="secondary">
              This Month
            </AppText>
            <AppText variant="h2" style={{ marginTop: 2, color: colors.primary }}>
              {summary?.thisMonthSpendingString || "—"}
            </AppText>
          </Card>
          <Card style={styles.statCard}>
            <AppText variant="caption" colorRole="secondary">
              Total Spending
            </AppText>
            <AppText variant="h2" style={{ marginTop: 2 }}>
              {summary?.totalSpendingString || "—"}
            </AppText>
          </Card>
        </View>

        {/* Expenses List */}
        <AppText variant="h3" style={styles.sectionTitle}>
          Transactions ({expenses.length})
        </AppText>

        {expenses.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="wallet-outline" size={48} color={colors.accent} />}
            title="No expenses logged"
            description="Track your tuition, books, transport, and food expenses to maintain your monthly student budget."
          />
        ) : (
          expenses.map((exp: MobileExpenseItem) => {
            const expDate = new Date(exp.expenseDate);
            return (
              <Card key={exp.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.infoCol}>
                    <View style={styles.categoryRow}>
                      <StatusChip label={exp.category} variant="primary" size="sm" />
                      <AppText variant="caption" colorRole="secondary">
                        {expDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </AppText>
                    </View>
                    {exp.description ? (
                      <AppText variant="body" style={{ marginTop: 4 }}>
                        {exp.description}
                      </AppText>
                    ) : (
                      <AppText variant="body" colorRole="secondary" style={{ marginTop: 4 }}>
                        {exp.category.toLowerCase()}
                      </AppText>
                    )}
                  </View>

                  <View style={styles.amountCol}>
                    <AppText variant="h3" style={{ fontWeight: "700" }}>
                      Rs. {exp.amount.toLocaleString()}
                    </AppText>
                    <TouchableOpacity
                      onPress={() => setDeleteTargetId(exp.id)}
                      style={styles.delBtn}
                      accessibilityLabel="Delete expense"
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Add Expense</AppText>
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
              label="Amount (PKR)"
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 1500"
              keyboardType="numeric"
            />

            {/* Category Selector */}
            <AppText variant="caption" style={styles.fieldLabel}>
              CATEGORY
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
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
                      style={{ color: isSelected ? "#fff" : colors.textPrimary, fontWeight: "600" }}
                    >
                      {cat}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <FormInput
              label="Date (YYYY-MM-DD)"
              value={expenseDate}
              onChangeText={setExpenseDate}
              placeholder="2026-09-07"
            />

            <FormInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Semester project hardware"
            />

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="outline" onPress={closeModal} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Add Expense"
                  variant="primary"
                  onPress={handleSave}
                  loading={createMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDeleteModal
        visible={!!deleteTargetId}
        title="Delete Expense"
        message="Are you sure you want to remove this expense transaction?"
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  amountCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  delBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
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
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
