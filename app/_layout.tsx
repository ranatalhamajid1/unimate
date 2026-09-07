/**
 * Root Layout for UniMate Mobile Application.
 * Configures QueryClient, ThemeProvider, AuthProvider, and Root Stack.
 */

import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";
import { useAuth } from "@/hooks/use-auth";

function RootNavigation() {
  const { isDark, colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="courses/index" options={{ headerShown: false }} />
        <Stack.Screen name="assignments/index" options={{ headerShown: false }} />
        <Stack.Screen name="exams/index" options={{ headerShown: false }} />
        <Stack.Screen name="academics/index" options={{ headerShown: false }} />
        <Stack.Screen name="expenses/index" options={{ headerShown: false }} />
        <Stack.Screen name="goals/index" options={{ headerShown: false }} />
        <Stack.Screen name="study-plans/index" options={{ headerShown: false }} />
        <Stack.Screen name="calendar/index" options={{ headerShown: false }} />
        <Stack.Screen name="ai-buddy/index" options={{ headerShown: false }} />
        <Stack.Screen name="insights/index" options={{ headerShown: false }} />
        <Stack.Screen name="billing/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigation />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
