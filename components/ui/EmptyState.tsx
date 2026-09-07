/**
 * Empty state display with icon, title, description, and optional action.
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";

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
  const btnTitle = actionTitle || actionLabel;
  return (
    <View style={[styles.container, style]}>
      {Boolean(icon) && <View style={styles.icon}>{icon}</View>}
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
  icon: {
    marginBottom: 16,
    opacity: 0.85,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    maxWidth: 320,
  },
  button: {
    marginTop: 8,
  },
});
