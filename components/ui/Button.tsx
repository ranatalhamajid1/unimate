/**
 * Theme-aware accessible Button component.
 */

import React from "react";
import {
  TouchableOpacity,
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
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const effectiveLoading = isLoading || loading;
  const effectiveVariant = variant === "danger" ? "destructive" : variant;

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
        };
      case "primary":
      default:
        return {
          backgroundColor: colors.accent,
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
        return 38;
      case "lg":
        return 52;
      case "md":
      default:
        return 46;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || effectiveLoading}
      activeOpacity={0.8}
      style={[
        styles.button,
        getContainerStyle(),
        { height: getHeight() },
        disabled && styles.disabled,
        style,
      ]}
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
              { color: getTextColor() },
              icon ? { marginLeft: 8 } : undefined,
              textStyle,
            ]}
          >
            {title}
          </AppText>
        </>
      )}
    </TouchableOpacity>
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
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
