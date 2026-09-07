import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { Layout } from "@/constants/layout";
import type { MobileNotificationItem } from "@/lib/types";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        notifications: MobileNotificationItem[];
        unreadCount: number;
      }>("/api/mobile/notifications");
      return res;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.patch<{ success: boolean }>(`/api/mobile/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post<{ success: boolean }>("/api/mobile/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to mark notifications as read.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete notification.");
    },
  });

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <LoadingState message="Loading notifications..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState message="Failed to load notifications." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Screen style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <AppText variant="h2">Notifications</AppText>
            {unreadCount > 0 ? (
              <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600" }}>
                {unreadCount} unread
              </AppText>
            ) : null}
          </View>
        </View>

        {unreadCount > 0 ? (
          <Button
            title="Mark all read"
            variant="outline"
            size="sm"
            onPress={() => markAllReadMutation.mutate()}
            isLoading={markAllReadMutation.isPending}
          />
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="notifications-outline" size={54} color={colors.accent} />}
            title="No notifications yet"
            description="Academic alerts, assignment deadlines, and exam reminders will appear here."
          />
        ) : (
          notifications.map((notif: MobileNotificationItem) => {
            const createdAt = new Date(notif.createdAt);
            return (
              <Card
                key={notif.id}
                style={StyleSheet.flatten([
                  styles.card,
                  !notif.read && {
                    borderColor: colors.accent + "4D",
                    backgroundColor: colors.surfaceSecondary,
                  },
                ])}
              >
                <TouchableOpacity
                  onPress={() => !notif.read && markReadMutation.mutate(notif.id)}
                  activeOpacity={notif.read ? 1 : 0.7}
                  style={styles.notifBody}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.titleRow}>
                      {!notif.read ? (
                        <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                      ) : null}
                      <AppText variant="h3" style={{ flex: 1 }}>
                        {notif.title}
                      </AppText>
                    </View>

                    <TouchableOpacity
                      onPress={() => deleteMutation.mutate(notif.id)}
                      style={styles.delBtn}
                      accessibilityLabel="Delete notification"
                    >
                      <Ionicons name="close" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  <AppText variant="body" colorRole="secondary" style={styles.message}>
                    {notif.message}
                  </AppText>

                  <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 6 }}>
                    {createdAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </AppText>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backButton: {
    minWidth: Layout.minTouchTarget,
    minHeight: Layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.sm,
  },
  notifBody: {
    minHeight: 44,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  delBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: 4,
  },
});
