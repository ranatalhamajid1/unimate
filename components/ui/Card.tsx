/**
 * Theme-aware Card surface container.
 * Calibrated for Milestone 16: God-Level Visual Experience 2.0.
 */

import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

export type CardVariant = "primary" | "secondary" | "floating" | "surface";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: CardVariant;
  activeOpacity?: number;
}

export function Card({
  children,
  style,
  onPress,
  variant = "primary",
}: CardProps) {
  const { colors, isDark } = useTheme();

  // Normalize legacy "surface" to "primary"
  const resolvedVariant = variant === "surface" ? "primary" : variant;

  const getContainerStyle = (): ViewStyle => {
    switch (resolvedVariant) {
      case "floating":
        return {
          backgroundColor: isDark ? "rgba(32, 42, 61, 0.85)" : "rgba(255, 255, 255, 0.92)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(99, 102, 241, 0.14)",
          borderWidth: 1,
          shadowColor: isDark ? "#000000" : colors.cardShadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.38 : 0.12,
          shadowRadius: 16,
          elevation: 5,
        };
      case "secondary":
        return {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.borderSubtle || colors.border,
          borderWidth: 1,
          shadowColor: isDark ? "#000000" : colors.cardShadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.16 : 0.04,
          shadowRadius: 4,
          elevation: 1,
        };
      case "primary":
      default:
        return {
          backgroundColor: isDark ? colors.elevated : colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: isDark ? "#000000" : colors.cardShadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.28 : 0.08,
          shadowRadius: 8,
          elevation: 3,
        };
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          getContainerStyle(),
          pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, getContainerStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: 16,
  },
});
