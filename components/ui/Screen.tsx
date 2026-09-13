/**
 * Theme-aware Screen container with Safe Area handling and optional scroll view.
 */

import React from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: readonly ("top" | "bottom" | "left" | "right")[];
  keyboardAvoiding?: boolean;
}

export function Screen({
  children,
  scrollable = false,
  onRefresh,
  refreshing = false,
  style,
  contentContainerStyle,
  edges = ["top", "left", "right"],
  keyboardAvoiding = true,
}: ScreenProps) {
  const { colors } = useTheme();

  const combinedContentStyle = React.useMemo(
    () => [styles.content, contentContainerStyle],
    [contentContainerStyle]
  );

  const content = scrollable ? (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={combinedContentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        ) : undefined
      }
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <View style={[styles.container, combinedContentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safeArea, { backgroundColor: colors.background }, style]}
    >
      {keyboardAvoiding && !scrollable ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
