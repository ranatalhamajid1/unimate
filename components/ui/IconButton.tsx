/**
 * Accessible, theme-aware IconButton component with minimum touch target.
 */

import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius, Layout } from "@/constants/layout";

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel: string;
  variant?: "ghost" | "surface";
}

export function IconButton({
  icon,
  onPress,
  style,
  accessibilityLabel,
  variant = "ghost",
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        variant === "surface" && {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: Layout.minTouchTarget,
    minHeight: Layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
  },
});
