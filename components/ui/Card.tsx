/**
 * Theme-aware Card surface container.
 */

import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: "surface" | "secondary";
}

export function Card({
  children,
  style,
  onPress,
  variant = "surface",
}: CardProps) {
  const { colors, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: variant === "secondary" ? colors.surfaceSecondary : colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: isDark ? "#000" : colors.cardShadow,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.card, containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});
