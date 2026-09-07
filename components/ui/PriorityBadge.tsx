import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { useTheme } from "../../hooks/use-theme";
import { spacing } from "../../constants/spacing";

interface PriorityBadgeProps {
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { colors } = useTheme();

  const getStyle = () => {
    switch (priority.toUpperCase()) {
      case "HIGH":
        return {
          bg: colors.danger + "15",
          text: colors.danger,
          label: "High Priority",
        };
      case "MEDIUM":
        return {
          bg: colors.warning + "15",
          text: colors.warning,
          label: "Medium Priority",
        };
      case "LOW":
      default:
        return {
          bg: colors.surfaceHover,
          text: colors.textSecondary,
          label: "Low Priority",
        };
    }
  };

  const { bg, text, label } = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <AppText variant="caption" style={{ color: text, fontWeight: "600", fontSize: 11 }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: "flex-start",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
