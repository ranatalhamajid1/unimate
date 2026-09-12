/**
 * Main Authenticated Bottom Tabs Navigator for UniMate Mobile.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { Layout } from "@/constants/layout";
import { FontSize } from "@/constants/typography";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(8, insets.bottom);
  const barHeight = Layout.tabBarHeight + (insets.bottom > 0 ? insets.bottom - 6 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: isDark ? "rgba(16, 21, 34, 0.92)" : "rgba(255, 255, 255, 0.94)",
          borderTopColor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(99, 102, 241, 0.10)",
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "Study",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
