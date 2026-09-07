import React from "react";
import { Modal, View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { useTheme } from "../../hooks/use-theme";
import { spacing } from "../../constants/spacing";

interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  message: string;
  isDeleting?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  visible,
  title,
  message,
  isDeleting = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const { colors } = useTheme();
  const loading = isDeleting || isLoading;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText variant="h3" style={{ marginBottom: spacing.xs, color: colors.danger }}>
                {title}
              </AppText>
              <AppText variant="body" style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
                {message}
              </AppText>
              <View style={styles.actions}>
                <View style={styles.btnWrapper}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={onCancel}
                    disabled={loading}
                  />
                </View>
                <View style={styles.btnWrapper}>
                  <Button
                    title="Delete"
                    variant="danger"
                    onPress={onConfirm}
                    loading={loading}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  btnWrapper: {
    flex: 1,
  },
});
