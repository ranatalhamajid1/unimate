/**
 * Loading state display with centered activity indicator.
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { AppText } from "@/components/ui/AppText";

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export function LoadingState({ message = "Loading...", style }: LoadingStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={colors.accent} />
      {Boolean(message) && (
        <AppText colorRole="secondary" variant="caption" style={styles.text}>
          {message}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    marginTop: 12,
  },
});
