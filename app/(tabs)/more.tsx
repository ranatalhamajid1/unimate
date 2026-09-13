/**
 * More Screen — Hub for secondary UniMate modules and app settings.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";
import { BrandLogo } from "@/components/ui/BrandLogo";
import appConfig from "@/app.json";

interface ModuleItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  isAvailable?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const academicModules: ModuleItem[] = [
    {
      id: "courses",
      title: "Courses",
      description: "Manage enrolled university courses",
      icon: "school-outline",
      route: "/courses",
      isAvailable: true,
    },
    {
      id: "assignments",
      title: "Assignments",
      description: "Tasks, deadlines, and submission status",
      icon: "document-text-outline",
      route: "/assignments",
      isAvailable: true,
    },
    {
      id: "exams",
      title: "Exams",
      description: "Upcoming exams and preparation countdown",
      icon: "alarm-outline",
      route: "/exams",
      isAvailable: true,
    },
    {
      id: "academics",
      title: "Academics",
      description: "GPA calculation, grades, and attendance",
      icon: "ribbon-outline",
      route: "/academics",
      isAvailable: true,
    },
  ];

  const productivityModules: ModuleItem[] = [
    {
      id: "expenses",
      title: "Expenses",
      description: "Monthly budget and PKR expense tracker",
      icon: "wallet-outline",
      route: "/expenses",
      isAvailable: true,
    },
    {
      id: "goals",
      title: "Goals",
      description: "GPA, attendance, and study hour targets",
      icon: "flag-outline",
      route: "/goals",
      isAvailable: true,
    },
    {
      id: "study-plans",
      title: "Study Plans",
      description: "AI & structured daily study schedules",
      icon: "list-outline",
      route: "/study-plans",
      isAvailable: true,
    },
    {
      id: "calendar",
      title: "Calendar",
      description: "Unified academic events in Asia/Karachi (PKT)",
      icon: "calendar-clear-outline",
      route: "/calendar",
      isAvailable: true,
    },
    {
      id: "weekly-review",
      title: "Weekly Review",
      description: "Performance scorecard, study volume, and weekly debrief",
      icon: "trending-up-outline",
      route: "/review",
      isAvailable: true,
    },
    {
      id: "insights",
      title: "Smart Insights",
      description: "Academic trend warnings and performance streaks",
      icon: "bulb-outline",
      route: "/insights",
      isAvailable: true,
    },
  ];

  const appModules: ModuleItem[] = [
    {
      id: "ai-buddy",
      title: "AI Study Buddy",
      description: "Contextual assistant for your enrolled courses",
      icon: "sparkles-outline",
      route: "/ai-buddy",
      isAvailable: true,
    },
    {
      id: "billing",
      title: "Subscription & Billing",
      description: "Free & Pro tier entitlements and allowances",
      icon: "card-outline",
      route: "/billing",
      isAvailable: true,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Academic reminders and alerts",
      icon: "notifications-outline",
      route: "/notifications",
      isAvailable: true,
    },
    {
      id: "settings",
      title: "Settings & Profile",
      description: "Appearance, theme, plan & account sign out",
      icon: "settings-outline",
      route: "/settings",
      isAvailable: true,
    },
  ];

  const renderSection = (title: string, items: ModuleItem[]) => (
    <View style={styles.section} key={title}>
      <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
        {title}
      </AppText>
      <Card style={styles.cardContainer}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              disabled={!item.isAvailable}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as any);
                }
              }}
              style={[
                styles.row,
                !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                !item.isAvailable && styles.disabledRow,
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.isAvailable ? colors.accent : colors.textTertiary}
                />
              </View>
              <View style={styles.rowText}>
                <View style={styles.titleLine}>
                  <AppText
                    variant="bodyMedium"
                    style={!item.isAvailable ? { color: colors.textTertiary } : undefined}
                  >
                    {item.title}
                  </AppText>
                  {!item.isAvailable && (
                    <View style={[styles.upcomingBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <AppText variant="label" colorRole="tertiary" style={styles.upcomingText}>
                        Step 5
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText
                  colorRole="secondary"
                  variant="caption"
                  numberOfLines={1}
                  style={!item.isAvailable ? { color: colors.textTertiary } : undefined}
                >
                  {item.description}
                </AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={item.isAvailable ? colors.textTertiary : "transparent"}
              />
            </TouchableOpacity>
          );
        })}
      </Card>
    </View>
  );

  const networkModules: ModuleItem[] = [
    {
      id: "communities",
      title: "Campus Network",
      description: "Student communities, societies, and study groups",
      icon: "people-outline",
      route: "/communities",
      isAvailable: true,
    },
  ];

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <AppText variant="h2">More</AppText>
        <AppText colorRole="secondary" variant="caption">
          All UniMate Modules & Settings
        </AppText>
      </View>

      {renderSection("Student Network", networkModules)}
      {renderSection("Academic Hub", academicModules)}
      {renderSection("Productivity & Finance", productivityModules)}
      {renderSection("Assistant & Settings", appModules)}

      {/* Brand Identity Footer */}
      <View style={styles.brandFooter}>
        <BrandLogo variant="horizontal" size="sm" />
        <AppText colorRole="tertiary" variant="caption" style={styles.brandFooterText}>
          Version {appConfig.expo.version} • Plan • Focus • Achieve
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
  },
  cardContainer: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  disabledRow: {
    opacity: 0.75,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  upcomingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  upcomingText: {
    fontSize: 9,
  },
  brandFooter: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  brandFooterText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
