/**
 * Theme-aware Text component with consistent typographic scale.
 */

import React from "react";
import { Text, StyleSheet, TextStyle, TextProps, StyleProp } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { FontSize, FontWeight } from "@/constants/typography";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "subtitle"
  | "body"
  | "bodyMedium"
  | "bodySmall"
  | "caption"
  | "label";

export type TextColorRole = "primary" | "secondary" | "tertiary" | "accent" | "destructive" | "success" | "warning";

interface AppTextProps extends TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  colorRole?: TextColorRole;
  style?: StyleProp<TextStyle>;
  align?: "left" | "center" | "right";
}

export function AppText({
  children,
  variant = "body",
  colorRole = "primary",
  style,
  align = "left",
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const getColor = () => {
    switch (colorRole) {
      case "secondary":
        return colors.textSecondary;
      case "tertiary":
        return colors.textTertiary;
      case "accent":
        return colors.accent;
      case "destructive":
        return colors.destructive;
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
      case "primary":
      default:
        return colors.textPrimary;
    }
  };

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color: getColor(), textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: -0.2,
  },
  h1: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  h2: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    lineHeight: 26,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: 18,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
