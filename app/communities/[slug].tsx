import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import { triggerSuccessFeedback, triggerDestructiveFeedback } from "@/lib/haptics";
import type { MobileCommunity } from "./index";

export interface CommunityMember {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
    degreeProgram?: string | null;
    currentSemester?: string | null;
    isPublicProfile: boolean;
  };
}

export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  isOnline: boolean;
  meetingUrl?: string | null;
  startAt: string;
  endAt: string;
  capacity?: number | null;
  status: string;
  userRsvp?: "GOING" | "MAYBE" | "NOT_GOING" | null;
  goingCount?: number;
  _count?: { attendees: number };
}

export interface CommunityResource {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  url: string;
  createdAt: string;
}

export default function CommunityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "announcements" | "events" | "resources" | "members" | "about"
  >("announcements");

  // Query community details
  const {
    data: detailData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<{ community: MobileCommunity }>({
    queryKey: ["community", slug],
    queryFn: () => apiClient.get(`/api/communities/${slug}`),
    enabled: !!slug,
  });

  // Query community announcements
  const { data: announcementsData, refetch: refetchAnnouncements } = useQuery<{
    announcements: CommunityAnnouncement[];
  }>({
    queryKey: ["community-announcements", slug],
    queryFn: () => apiClient.get(`/api/communities/${slug}/announcements`),
    enabled: !!slug && activeTab === "announcements",
  });

  // Query community events
  const { data: eventsData, refetch: refetchEvents } = useQuery<{
    events: CommunityEvent[];
  }>({
    queryKey: ["community-events", slug],
    queryFn: () => apiClient.get(`/api/communities/${slug}/events`),
    enabled: !!slug && activeTab === "events",
  });

  // Query community resources
  const { data: resourcesData, refetch: refetchResources } = useQuery<{
    resources: CommunityResource[];
  }>({
    queryKey: ["community-resources", slug],
    queryFn: () => apiClient.get(`/api/communities/${slug}/resources`),
    enabled: !!slug && activeTab === "resources",
  });

  // Query community members
  const { data: membersData, refetch: refetchMembers } = useQuery<{ members: CommunityMember[] }>({
    queryKey: ["community-members", slug],
    queryFn: () => apiClient.get(`/api/communities/${slug}/members?status=ACTIVE`),
    enabled: !!slug && activeTab === "members",
  });

  const community = detailData?.community;
  const announcements = announcementsData?.announcements || [];
  const events = eventsData?.events || [];
  const resources = resourcesData?.resources || [];
  const members = membersData?.members || [];

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/communities/${slug}/join`, {}),
    onSuccess: () => {
      triggerSuccessFeedback();
      queryClient.invalidateQueries({ queryKey: ["community", slug] });
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      Alert.alert("Unable to join", err.message || "An error occurred");
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/communities/${slug}/leave`, {}),
    onSuccess: () => {
      triggerSuccessFeedback();
      queryClient.invalidateQueries({ queryKey: ["community", slug] });
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      Alert.alert("Unable to leave", err.message || "An error occurred");
    },
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: ({
      eventId,
      status,
    }: {
      eventId: string;
      status: "GOING" | "MAYBE" | "NOT_GOING";
    }) => apiClient.post(`/api/communities/${slug}/events/${eventId}/rsvp`, { status }),
    onSuccess: () => {
      triggerSuccessFeedback();
      queryClient.invalidateQueries({ queryKey: ["community-events", slug] });
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      Alert.alert("RSVP Error", err.message || "Failed to submit RSVP");
    },
  });

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: (data: { targetType: string; targetId: string; reason: string; description: string }) =>
      apiClient.post(`/api/communities/${slug}/reports`, data),
    onSuccess: () => {
      triggerSuccessFeedback();
      Alert.alert("Report Submitted", "Thank you. Community organizers will review your report.");
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      Alert.alert("Report Error", err.message || "Failed to submit report");
    },
  });

  const handleReport = (targetType: string, targetId: string) => {
    Alert.prompt(
      `Report ${targetType}`,
      "Please describe the issue or community standard violation:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Report",
          onPress: (desc?: string) => {
            if (!desc || desc.length < 5) {
              Alert.alert("Error", "Description must be at least 5 characters.");
              return;
            }
            reportMutation.mutate({
              targetType,
              targetId,
              reason: "INAPPROPRIATE_CONTENT",
              description: desc,
            });
          },
        },
      ],
      "plain-text"
    );
  };

  const handleRefresh = () => {
    refetch();
    if (activeTab === "announcements") refetchAnnouncements();
    if (activeTab === "events") refetchEvents();
    if (activeTab === "resources") refetchResources();
    if (activeTab === "members") refetchMembers();
  };

  if (isLoading) {
    return (
      <Screen style={{ paddingHorizontal: spacing.md }}>
        <LoadingState message="Loading community details..." />
      </Screen>
    );
  }

  if (isError || !community) {
    return (
      <Screen style={{ paddingHorizontal: spacing.md }}>
        <ErrorState message="Community not found or unavailable." onRetry={refetch} />
      </Screen>
    );
  }

  const isOwner = community.currentUserRole === "OWNER";
  const isActive = community.currentUserStatus === "ACTIVE";
  const isPending = community.currentUserStatus === "PENDING";
  const isModerator =
    community.currentUserRole === "MODERATOR" ||
    community.currentUserRole === "ADMIN" ||
    isOwner;

  return (
    <Screen style={{ paddingHorizontal: spacing.md }}>
      <Stack.Screen
        options={{
          title: community.name,
          headerBackTitle: "Network",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => handleReport("COMMUNITY", community.id)}
              style={{ padding: 4 }}
            >
              <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.badgeRow}>
            {community.isVerified && (
              <View style={[styles.badge, { backgroundColor: colors.accent + "1A" }]}>
                <Ionicons name="shield-checkmark" size={13} color={colors.accent} />
                <AppText
                  variant="caption"
                  style={{ color: colors.accent, marginLeft: 4, fontWeight: "600" }}
                >
                  Verified
                </AppText>
              </View>
            )}

            <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
              <AppText variant="caption" colorRole="secondary">
                {community.type}
              </AppText>
            </View>

            <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
              <AppText variant="caption" colorRole="secondary">
                {community.visibility}
              </AppText>
            </View>
          </View>

          <AppText variant="h2" style={{ marginTop: spacing.sm }}>
            {community.name}
          </AppText>

          {community.university && (
            <AppText variant="bodySmall" colorRole="secondary" style={{ marginTop: 2 }}>
              {community.university.name}
              {community.campus ? ` • ${community.campus.name}` : ""}
            </AppText>
          )}

          {/* Membership Actions */}
          <View style={[styles.actionRow, { borderColor: colors.border }]}>
            <View style={styles.membersStats}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <AppText variant="bodySmall" colorRole="secondary" style={{ marginLeft: 6 }}>
                {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
              </AppText>
            </View>

            {isActive ? (
              <Button
                title="Leave"
                variant="outline"
                size="sm"
                loading={leaveMutation.isPending}
                onPress={() => leaveMutation.mutate()}
              />
            ) : isPending ? (
              <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
                <AppText variant="caption" colorRole="secondary">
                  Request Pending
                </AppText>
              </View>
            ) : (
              <Button
                title={community.requiresApproval ? "Request to Join" : "Join"}
                size="sm"
                loading={joinMutation.isPending}
                onPress={() => joinMutation.mutate()}
              />
            )}
          </View>
        </Card>

        {/* Segmented Navigation Tabs */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceSecondary }]}>
          {(["announcements", "events", "resources", "members", "about"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.segmentButton,
                activeTab === tab && { backgroundColor: colors.surface },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
                  fontWeight: activeTab === tab ? "700" : "500",
                  textTransform: "capitalize",
                }}
              >
                {tab === "members" ? `Members (${community.memberCount})` : tab}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab: Announcements */}
        {activeTab === "announcements" && (
          <View style={{ gap: spacing.sm }}>
            {announcements.length === 0 ? (
              <Card style={{ padding: spacing.lg, alignItems: "center" }}>
                <Ionicons name="megaphone-outline" size={28} color={colors.textSecondary} />
                <AppText variant="body" colorRole="secondary" style={{ marginTop: spacing.xs }}>
                  No announcements yet.
                </AppText>
              </Card>
            ) : (
              announcements.map((a) => (
                <Card key={a.id} style={styles.sectionCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {a.isPinned && (
                        <View style={[styles.badge, { backgroundColor: colors.accent + "1A" }]}>
                          <Ionicons name="pin" size={12} color={colors.accent} />
                          <AppText variant="caption" style={{ color: colors.accent, marginLeft: 3, fontWeight: "700" }}>
                            Pinned
                          </AppText>
                        </View>
                      )}
                      <AppText variant="h3">{a.title}</AppText>
                    </View>
                    <TouchableOpacity onPress={() => handleReport("ANNOUNCEMENT", a.id)}>
                      <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <AppText variant="caption" colorRole="secondary" style={{ marginTop: 2 }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </AppText>
                  <AppText variant="body" colorRole="secondary" style={{ marginTop: spacing.sm, lineHeight: 20 }}>
                    {a.content}
                  </AppText>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Tab: Events */}
        {activeTab === "events" && (
          <View style={{ gap: spacing.sm }}>
            {events.length === 0 ? (
              <Card style={{ padding: spacing.lg, alignItems: "center" }}>
                <Ionicons name="calendar-outline" size={28} color={colors.textSecondary} />
                <AppText variant="body" colorRole="secondary" style={{ marginTop: spacing.xs }}>
                  No upcoming events scheduled.
                </AppText>
              </Card>
            ) : (
              events.map((ev) => (
                <Card key={ev.id} style={styles.sectionCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <AppText variant="h3">{ev.title}</AppText>
                    <TouchableOpacity onPress={() => handleReport("EVENT", ev.id)}>
                      <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xs }}>
                    <Ionicons name="time-outline" size={14} color={colors.accent} />
                    <AppText variant="caption" colorRole="secondary">
                      {new Date(ev.startAt).toLocaleString()}
                    </AppText>
                  </View>

                  {ev.isOnline ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Ionicons name="videocam-outline" size={14} color="#8b5cf6" />
                      <AppText variant="caption" style={{ color: "#8b5cf6" }}>
                        Online Meeting
                      </AppText>
                      {ev.meetingUrl && (
                        <TouchableOpacity onPress={() => Linking.openURL(ev.meetingUrl!)}>
                          <AppText variant="caption" style={{ color: colors.accent, textDecorationLine: "underline" }}>
                            Join Link
                          </AppText>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    ev.location && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <Ionicons name="location-outline" size={14} color="#10b981" />
                        <AppText variant="caption" colorRole="secondary">
                          {ev.location}
                        </AppText>
                      </View>
                    )
                  )}

                  <AppText variant="bodySmall" colorRole="secondary" style={{ marginTop: spacing.sm }}>
                    {ev.description}
                  </AppText>

                  {/* RSVP Selector */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: spacing.md,
                      paddingTop: spacing.sm,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                    }}
                  >
                    <AppText variant="caption" colorRole="secondary">
                      {ev._count?.attendees ?? 0} {ev.capacity ? `/ ${ev.capacity}` : ""} Going
                    </AppText>

                    {isActive && (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => rsvpMutation.mutate({ eventId: ev.id, status: "GOING" })}
                          style={[
                            styles.rsvpBtn,
                            ev.userRsvp === "GOING"
                              ? { backgroundColor: "#10b981" }
                              : { backgroundColor: colors.surfaceSecondary },
                          ]}
                        >
                          <AppText
                            variant="caption"
                            style={{
                              color: ev.userRsvp === "GOING" ? "#fff" : colors.textSecondary,
                              fontWeight: "700",
                            }}
                          >
                            Going
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => rsvpMutation.mutate({ eventId: ev.id, status: "MAYBE" })}
                          style={[
                            styles.rsvpBtn,
                            ev.userRsvp === "MAYBE"
                              ? { backgroundColor: "#f59e0b" }
                              : { backgroundColor: colors.surfaceSecondary },
                          ]}
                        >
                          <AppText
                            variant="caption"
                            style={{
                              color: ev.userRsvp === "MAYBE" ? "#fff" : colors.textSecondary,
                              fontWeight: "700",
                            }}
                          >
                            Maybe
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => rsvpMutation.mutate({ eventId: ev.id, status: "NOT_GOING" })}
                          style={[
                            styles.rsvpBtn,
                            ev.userRsvp === "NOT_GOING"
                              ? { backgroundColor: colors.textSecondary }
                              : { backgroundColor: colors.surfaceSecondary },
                          ]}
                        >
                          <AppText
                            variant="caption"
                            style={{
                              color: ev.userRsvp === "NOT_GOING" ? "#fff" : colors.textSecondary,
                              fontWeight: "700",
                            }}
                          >
                            Can't Go
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Tab: Resources */}
        {activeTab === "resources" && (
          <View style={{ gap: spacing.sm }}>
            {resources.length === 0 ? (
              <Card style={{ padding: spacing.lg, alignItems: "center" }}>
                <Ionicons name="link-outline" size={28} color={colors.textSecondary} />
                <AppText variant="body" colorRole="secondary" style={{ marginTop: spacing.xs }}>
                  No shared resources yet.
                </AppText>
              </Card>
            ) : (
              resources.map((res) => (
                <Card key={res.id} style={styles.sectionCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(res.url)}
                      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.xs }}
                    >
                      <Ionicons name="open-outline" size={16} color={colors.accent} />
                      <AppText variant="bodyMedium" style={{ color: colors.accent, fontWeight: "600" }}>
                        {res.title}
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReport("RESOURCE", res.id)}>
                      <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {res.description ? (
                    <AppText variant="caption" colorRole="secondary" style={{ marginTop: 4 }}>
                      {res.description}
                    </AppText>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        )}

        {/* Tab: About */}
        {activeTab === "about" && (
          <Card style={styles.sectionCard}>
            <AppText variant="h3" style={{ marginBottom: spacing.xs }}>
              Description
            </AppText>
            <AppText variant="body" colorRole="secondary">
              {community.description || "No description provided."}
            </AppText>
          </Card>
        )}

        {/* Tab: Members */}
        {activeTab === "members" && (
          <View style={styles.membersList}>
            {members.length === 0 ? (
              <Card style={{ padding: spacing.lg, alignItems: "center" }}>
                <AppText variant="body" colorRole="secondary">
                  No active members to display.
                </AppText>
              </Card>
            ) : (
              members.map((m) => (
                <Card key={m.id} style={styles.memberCard}>
                  <View style={styles.memberRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceSecondary }]}>
                      <AppText variant="caption" style={{ fontWeight: "700", color: colors.accent }}>
                        {m.user.name.slice(0, 2).toUpperCase()}
                      </AppText>
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <AppText variant="bodyMedium">{m.user.name}</AppText>
                        {m.role !== "MEMBER" && (
                          <View style={[styles.roleBadge, { backgroundColor: colors.accent + "1A" }]}>
                            <AppText variant="caption" style={{ color: colors.accent, fontSize: 9, fontWeight: "700" }}>
                              {m.role}
                            </AppText>
                          </View>
                        )}
                      </View>
                      {m.user.degreeProgram ? (
                        <AppText variant="caption" colorRole="secondary">
                          {m.user.degreeProgram}
                        </AppText>
                      ) : null}
                    </View>

                    <TouchableOpacity onPress={() => handleReport("MEMBER", m.id)}>
                      <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  membersStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  segmentContainer: {
    flexDirection: "row",
    padding: 3,
    borderRadius: BorderRadius.lg,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  sectionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  membersList: {
    gap: spacing.sm,
  },
  memberCard: {
    padding: spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  rsvpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
});
