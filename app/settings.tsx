/**
 * Settings & Profile Screen.
 * Includes user profile summary, interactive theme switcher, subscription badge, and secure logout.
 */

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme, ThemePreference } from "@/hooks/use-theme";
import { API_BASE_URL } from "@/lib/config";
import { BorderRadius, Layout } from "@/constants/layout";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, subscription, logout } = useAuth();
  const { colors, themePreference, setThemePreference } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of UniMate?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
            router.replace("/(auth)/login");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const themeOptions: { label: string; value: ThemePreference; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: "System", value: "system", icon: "phone-portrait-outline" },
    { label: "Light", value: "light", icon: "sunny-outline" },
    { label: "Dark", value: "dark", icon: "moon-outline" },
  ];

  return (
    <Screen scrollable>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h2" style={styles.title}>
          Settings
        </AppText>
      </View>

      {/* Profile Card */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Account Profile
        </AppText>
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSubtle }]}>
            <AppText variant="h3" colorRole="accent">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </AppText>
          </View>
          <View style={styles.profileInfo}>
            <AppText variant="h3">{user?.name || "Student"}</AppText>
            <AppText colorRole="secondary" variant="body">
              {user?.email}
            </AppText>
            {Boolean(user?.createdAt) && (
              <AppText colorRole="tertiary" variant="caption" style={styles.createdDate}>
                Member since {new Date(user!.createdAt!).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </AppText>
            )}
          </View>
        </Card>
      </View>

      {/* Theme / Appearance Section */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Appearance
        </AppText>
        <Card style={styles.themeCard}>
          <View style={styles.themeOptionsRow}>
            {themeOptions.map((opt) => {
              const isSelected = themePreference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  onPress={() => setThemePreference(opt.value)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected ? colors.surfaceSecondary : "transparent",
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${opt.label} theme`}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={isSelected ? colors.accent : colors.textSecondary}
                  />
                  <AppText
                    variant="caption"
                    style={[
                      styles.themeLabel,
                      isSelected ? { color: colors.accent, fontWeight: "600" } : undefined,
                    ]}
                  >
                    {opt.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </View>

      {/* Subscription Card */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Plan & Entitlements
        </AppText>
        <Card style={styles.subscriptionCard}>
          <View style={styles.subHeader}>
            <View style={styles.subLeft}>
              <View style={[styles.subIcon, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
              </View>
              <View>
                <AppText variant="bodyMedium">
                  {subscription?.plan === "PRO" ? "UniMate Pro" : "UniMate Free"}
                </AppText>
                <AppText colorRole="secondary" variant="caption">
                  Status: {subscription?.status || "Active"}
                </AppText>
              </View>
            </View>

            <View style={[styles.badge, { backgroundColor: subscription?.isPro ? colors.accentSubtle : colors.surfaceSecondary }]}>
              <AppText
                variant="label"
                colorRole={subscription?.isPro ? "accent" : "secondary"}
                style={styles.badgeText}
              >
                {subscription?.plan || "FREE"}
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      {/* About & Legal */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          About & Legal
        </AppText>
        <Card style={styles.serverCard}>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => {
              if (API_BASE_URL) {
                WebBrowser.openBrowserAsync(`${API_BASE_URL}/privacy`);
              } else {
                Alert.alert("Privacy Policy", "Visit unimate.app/privacy for the full Privacy Policy.");
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Privacy Policy"
          >
            <View style={styles.legalLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
              <AppText variant="body" style={{ marginLeft: 10 }}>Privacy Policy</AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.legalDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => {
              if (API_BASE_URL) {
                WebBrowser.openBrowserAsync(`${API_BASE_URL}/terms`);
              } else {
                Alert.alert("Terms of Service", "Visit unimate.app/terms for the full Terms of Service.");
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Terms of Service"
          >
            <View style={styles.legalLeft}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <AppText variant="body" style={{ marginLeft: 10 }}>Terms of Service</AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.legalDivider, { backgroundColor: colors.border }]} />

          <View style={styles.serverRow}>
            <AppText colorRole="secondary" variant="caption">
              Version
            </AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              1.0.0 (Build 1)
            </AppText>
          </View>
        </Card>
      </View>

      {/* Backend Connection Info */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Server Connection
        </AppText>
        <Card style={styles.serverCard}>
          <View style={styles.serverRow}>
            <AppText colorRole="secondary" variant="caption">
              API Endpoint
            </AppText>
            <AppText variant="caption" numberOfLines={1} style={styles.serverUrl}>
              {API_BASE_URL || "Not configured (Set EXPO_PUBLIC_API_URL)"}
            </AppText>
          </View>
        </Card>
      </View>

      {/* Sign Out Button */}
      <View style={styles.logoutSection}>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          isLoading={isLoggingOut}
          icon={<Ionicons name="log-out-outline" size={18} color={colors.destructive} />}
          textStyle={{ color: colors.destructive }}
          style={[styles.logoutButton, { borderColor: colors.destructive }]}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    marginBottom: 20,
  },
  backButton: {
    minWidth: Layout.minTouchTarget,
    minHeight: Layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  createdDate: {
    marginTop: 4,
  },
  themeCard: {
    padding: 12,
  },
  themeOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  themeLabel: {
    marginTop: 6,
  },
  subscriptionCard: {
    padding: 16,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontWeight: "700",
  },
  serverCard: {
    padding: 14,
  },
  serverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serverUrl: {
    maxWidth: 220,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    minHeight: Layout.minTouchTarget,
  },
  legalLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  legalDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  logoutSection: {
    marginTop: 12,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "transparent",
  },
});
