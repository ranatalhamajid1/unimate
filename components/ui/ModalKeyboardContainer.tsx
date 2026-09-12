/**
 * Reusable modal wrapper with keyboard avoidance and scrollable content.
 * Prevents modal form inputs and action buttons from being occluded by the soft keyboard.
 */

import React from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/constants/spacing";

interface ModalKeyboardContainerProps {
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ModalKeyboardContainer({
  children,
  cardStyle,
  contentContainerStyle,
}: ModalKeyboardContainerProps) {
  const { colors, isDark } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.modalOverlay}
    >
      <View
        style={[
          styles.modalCard,
          {
            backgroundColor: isDark ? colors.elevated : colors.surface,
            borderTopColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(99, 102, 241, 0.15)",
          },
          cardStyle,
        ]}
      >
        <View style={styles.grabberContainer}>
          <View
            style={[
              styles.grabber,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)" },
            ]}
          />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: "90%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  grabberContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
});
