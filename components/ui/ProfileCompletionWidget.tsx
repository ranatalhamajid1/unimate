import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { AppText } from "@/components/ui/AppText";
import { spacing } from "@/constants/spacing";

interface ProfileCompletionWidgetProps {
  percentage?: number;
  missingFieldPrompt?: string | null;
  onPress?: () => void;
  compact?: boolean;
}

export function ProfileCompletionWidget({
  percentage = 0,
  missingFieldPrompt,
  onPress,
  compact = false,
}: ProfileCompletionWidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const safePercentage = Math.min(100, Math.max(0, Math.round(percentage)));

  const nextAction =
    missingFieldPrompt ||
    (safePercentage < 20
      ? "Select your university & campus"
      : safePercentage < 40
      ? "Add your degree program & semester"
      : safePercentage < 60
      ? "Choose an @handle & bio"
      : safePercentage < 80
      ? "Upload a profile photo"
      : safePercentage < 100
      ? "Add graduation year & skills"
      : "Profile complete!");

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/settings");
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.compactContainer,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.compactRow}>
          <Ionicons name="sparkles" size={13} color={colors.accent} />
          <AppText variant="caption" style={{ color: colors.textSecondary, marginLeft: 4, fontWeight: "600", fontSize: 11 }}>
            {safePercentage}%
          </AppText>
        </View>
        <View style={[styles.compactTrack, { backgroundColor: colors.borderSubtle }]}>
          <View
            style={[
              styles.compactBar,
              { width: `${safePercentage}%`, backgroundColor: colors.accent },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconPill, { backgroundColor: colors.accentSubtle }]}>
            <Ionicons name="sparkles" size={13} color={colors.accent} />
          </View>
          <AppText variant="caption" style={{ color: colors.textPrimary, fontWeight: "700", marginLeft: 6 }}>
            STUDENT IDENTITY
          </AppText>
        </View>
        <AppText variant="caption" style={{ color: colors.accent, fontWeight: "700" }}>
          {safePercentage}% Complete
        </AppText>
      </View>

      {/* Progress Track */}
      <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
        <View
          style={[
            styles.bar,
            {
              width: `${safePercentage}%`,
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>

      {/* Next Step Info */}
      {safePercentage < 100 ? (
        <View style={styles.footer}>
          <AppText variant="caption" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
            <AppText variant="caption" style={{ color: colors.textPrimary, fontWeight: "600" }}>
              Next:{" "}
            </AppText>
            {nextAction}
          </AppText>
          <View style={styles.arrowRow}>
            <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600", marginRight: 2 }}>
              Update
            </AppText>
            <Ionicons name="chevron-forward" size={12} color={colors.accent} />
          </View>
        </View>
      ) : (
        <View style={styles.footer}>
          <AppText variant="caption" style={{ color: colors.success, fontWeight: "600" }}>
            Academic profile is complete!
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.xs,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactTrack: {
    width: 36,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  compactBar: {
    height: "100%",
    borderRadius: 2,
  },
});
