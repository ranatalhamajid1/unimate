/**
 * Study Screen Placeholder (Foundation).
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/use-theme";

export default function StudyScreen() {
  const { colors } = useTheme();

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h2">Study</AppText>
        <AppText colorRole="secondary" variant="caption">
          Sessions, Focus Timer & Structured Plans
        </AppText>
      </View>

      <View style={styles.content}>
        <EmptyState
          icon={<Ionicons name="book-outline" size={54} color={colors.accent} />}
          title="Study sessions and plans will appear here"
          description="Focus timers, study plan items, and weekly progress statistics will connect to your UniMate database in Step 5."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  header: {
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
});
