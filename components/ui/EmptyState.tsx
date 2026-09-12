/**
 * Empty state display with icon, title, description, and optional action.
 * Calibrated for Milestone 16: God-Level Visual Experience 2.0.
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const btnTitle = actionTitle || actionLabel;

  return (
    <View style={[styles.container, style]}>
      {Boolean(icon) && (
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {icon}
        </View>
      )}
      <AppText variant="h3" align="center" style={styles.title}>
        {title}
      </AppText>
      {Boolean(description) && (
        <AppText colorRole="secondary" variant="body" align="center" style={styles.description}>
          {description}
        </AppText>
      )}
      {Boolean(btnTitle && onAction) && (
        <Button
          title={btnTitle!}
          onPress={onAction!}
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: "700",
  },
  description: {
    marginBottom: 16,
    maxWidth: 320,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
  },
});
