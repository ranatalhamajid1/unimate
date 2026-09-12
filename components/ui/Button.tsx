/**
 * Theme-aware accessible Button component.
 * Calibrated for Milestone 16: God-Level Visual Experience 2.0:
 * - Restrained 8px radius (BorderRadius.md)
 * - Fixed heights (sm: 36, md: 44, lg: 50) preventing layout shifts during loading
 * - Tactile press feedback using transform: [{ scale: 0.98 }] and opacity: 0.85
 * - Support for primary, secondary, outline, ghost, destructive variants
 */

import React from "react";
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { AppText } from "@/components/ui/AppText";
import { BorderRadius, Layout } from "@/constants/layout";
import { FontSize, FontWeight } from "@/constants/typography";

import { triggerImpactFeedback, triggerSuccessFeedback } from "@/lib/haptics";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  disabled?: boolean;
  haptic?: "light" | "medium" | "success" | "none";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  loading = false,
  disabled = false,
  haptic,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const effectiveLoading = isLoading || loading;
  const effectiveVariant = variant === "danger" ? "destructive" : variant;

  const handlePress = () => {
    if (disabled || effectiveLoading) return;
    if (haptic === "none") {
      // no haptic
    } else if (haptic === "success") {
      triggerSuccessFeedback();
    } else if (haptic === "medium" || (!haptic && (effectiveVariant === "primary" || effectiveVariant === "destructive"))) {
      triggerImpactFeedback("medium");
    } else {
      triggerImpactFeedback("light");
    }
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (effectiveVariant) {
      case "secondary":
        return {
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      case "destructive":
        return {
          backgroundColor: colors.destructive,
          shadowColor: colors.destructive,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.35 : 0.2,
          shadowRadius: 6,
          elevation: 2,
        };
      case "primary":
      default:
        return {
          backgroundColor: colors.accent,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.4 : 0.22,
          shadowRadius: 8,
          elevation: 3,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textTertiary;
    switch (effectiveVariant) {
      case "secondary":
      case "outline":
      case "ghost":
        return colors.textPrimary;
      case "destructive":
      case "primary":
      default:
        return "#FFFFFF";
    }
  };

  const getHeight = () => {
    switch (size) {
      case "sm":
        return 36;
      case "lg":
        return 50;
      case "md":
      default:
        return 44;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return FontSize.sm;
      case "lg":
        return FontSize.md;
      case "md":
      default:
        return FontSize.base;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || effectiveLoading}
      style={({ pressed }) => [
        styles.button,
        getContainerStyle(),
        { height: getHeight() },
        pressed && !disabled && !effectiveLoading && {
          transform: [{ scale: 0.98 }],
          opacity: 0.85,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || effectiveLoading, busy: effectiveLoading }}
    >
      {effectiveLoading ? (
        <ActivityIndicator
          size="small"
          color={effectiveVariant === "primary" || effectiveVariant === "destructive" ? "#FFFFFF" : colors.accent}
        />
      ) : (
        <>
          {icon}
          <AppText
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getTextSize() },
              icon ? { marginLeft: 8 } : undefined,
              textStyle,
            ]}
          >
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: Layout.minTouchTarget,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
