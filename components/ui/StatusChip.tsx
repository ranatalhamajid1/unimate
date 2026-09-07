import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { useTheme } from "../../hooks/use-theme";
import { spacing } from "../../constants/spacing";

interface StatusChipProps {
  label: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "muted" | "accent" | "neutral";
  size?: "sm" | "md";
}

export function StatusChip({ label, variant = "default", size = "md" }: StatusChipProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: colors.primary + "1A", text: colors.primary };
      case "accent":
        return { bg: colors.accent + "1A", text: colors.accent };
      case "success":
        return { bg: colors.success + "1A", text: colors.success };
      case "warning":
        return { bg: colors.warning + "1A", text: colors.warning };
      case "danger":
        return { bg: colors.danger + "1A", text: colors.danger };
      case "muted":
        return { bg: colors.surfaceHover, text: colors.textTertiary };
      case "neutral":
      default:
        return { bg: colors.surfaceHover, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          paddingHorizontal: isSm ? spacing.sm : spacing.md,
          paddingVertical: isSm ? 2 : 4,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: text,
          fontWeight: "600",
          fontSize: isSm ? 11 : 12,
        }}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 9999,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
});
