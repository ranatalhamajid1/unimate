/**
 * Mobile Study Hub & Execution Command Center.
 * Calibrated for M16.2: God-Level Mobile App Visual Experience 2.0.
 * Apple Vision Pro × Linear × Notion spatial hub.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/use-theme";
import { triggerImpactFeedback } from "@/lib/haptics";
import { BorderRadius } from "@/constants/layout";

export default function StudyScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const handleNavigate = (route: string) => {
    triggerImpactFeedback("light");
    router.push(route as any);
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {/* Hub Header */}
      <View style={styles.header}>
        <AppText variant="h2" style={styles.title}>
          Study & Focus
        </AppText>
        <AppText colorRole="secondary" variant="caption" style={styles.subtitle}>
          Deep Work Execution • Adaptive Plans • Academic Intelligence
        </AppText>
      </View>

      {/* Spatial Feature Cards */}
      <View style={styles.cardList}>
        {/* 1. Deep Focus Timer */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleNavigate("/focus-session")}
          accessibilityRole="button"
          accessibilityLabel="Launch Focus Session"
        >
          <Card
            variant="floating"
            style={[
              styles.hubCard,
              {
                borderColor: `${colors.accent}40`,
                backgroundColor: isDark ? "rgba(99, 102, 241, 0.10)" : "rgba(99, 102, 241, 0.05)",
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${colors.accent}20` },
                ]}
              >
                <Ionicons name="timer" size={24} color={colors.accent} />
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.accent}20` }]}>
                <AppText style={[styles.badgeText, { color: colors.accent }]}>IMMERSIVE</AppText>
              </View>
            </View>

            <AppText variant="h3" style={styles.cardTitle}>
              Focus Session
            </AppText>
            <AppText colorRole="secondary" variant="caption" style={styles.cardDesc}>
              Concentric countdown ring, breathing aura, and distraction-free Pomodoro intervals.
            </AppText>
            <View style={styles.actionRow}>
              <AppText variant="label" style={{ color: colors.accent, fontWeight: "700" }}>
                Start Deep Focus →
              </AppText>
            </View>
          </Card>
        </TouchableOpacity>

        {/* 2. Structured Study Plans */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleNavigate("/study-plans")}
          accessibilityRole="button"
          accessibilityLabel="View Study Plans"
        >
          <Card variant="primary" style={styles.hubCard}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${colors.cyan}18` },
                ]}
              >
                <Ionicons name="calendar" size={24} color={colors.cyan} />
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.cyan}18` }]}>
                <AppText style={[styles.badgeText, { color: colors.cyan }]}>ADAPTIVE</AppText>
              </View>
            </View>

            <AppText variant="h3" style={styles.cardTitle}>
              Study Plans
            </AppText>
            <AppText colorRole="secondary" variant="caption" style={styles.cardDesc}>
              Balanced daily study allocations, course workload distributions, and capacity guardrails.
            </AppText>
            <View style={styles.actionRow}>
              <AppText variant="label" style={{ color: colors.cyan, fontWeight: "700" }}>
                Manage Schedule →
              </AppText>
            </View>
          </Card>
        </TouchableOpacity>

        {/* 3. AI Study Buddy */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleNavigate("/ai-buddy")}
          accessibilityRole="button"
          accessibilityLabel="Open AI Study Buddy"
        >
          <Card variant="primary" style={styles.hubCard}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${colors.secondary}18` },
                ]}
              >
                <Ionicons name="sparkles" size={24} color={colors.secondary} />
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.secondary}18` }]}>
                <AppText style={[styles.badgeText, { color: colors.secondary }]}>SOCRATIC</AppText>
              </View>
            </View>

            <AppText variant="h3" style={styles.cardTitle}>
              AI Study Buddy
            </AppText>
            <AppText colorRole="secondary" variant="caption" style={styles.cardDesc}>
              Course-grounded contextual explanations, revision quizzes, and academic synthesis.
            </AppText>
            <View style={styles.actionRow}>
              <AppText variant="label" style={{ color: colors.secondary, fontWeight: "700" }}>
                Ask Question →
              </AppText>
            </View>
          </Card>
        </TouchableOpacity>

        {/* 4. Weekly Review */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleNavigate("/review")}
          accessibilityRole="button"
          accessibilityLabel="Open Weekly Review"
        >
          <Card variant="primary" style={styles.hubCard}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${colors.success}18` },
                ]}
              >
                <Ionicons name="analytics" size={24} color={colors.success} />
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.success}18` }]}>
                <AppText style={[styles.badgeText, { color: colors.success }]}>REPORT</AppText>
              </View>
            </View>

            <AppText variant="h3" style={styles.cardTitle}>
              Weekly Review
            </AppText>
            <AppText colorRole="secondary" variant="caption" style={styles.cardDesc}>
              4-dimension scorecards, academic health index, completed study debriefs, and GPA stability.
            </AppText>
            <View style={styles.actionRow}>
              <AppText variant="label" style={{ color: colors.success, fontWeight: "700" }}>
                View Health Report →
              </AppText>
            </View>
          </Card>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  cardList: {
    gap: 14,
  },
  hubCard: {
    padding: 18,
    borderRadius: BorderRadius.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: {
    lineHeight: 18,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
