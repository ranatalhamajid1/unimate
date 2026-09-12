import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Linking,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalKeyboardContainer } from "@/components/ui/ModalKeyboardContainer";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import { triggerSelectionFeedback, triggerSuccessFeedback, triggerDestructiveFeedback } from "@/lib/haptics";

export interface MobileCommunity {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  scope: string;
  visibility: string;
  isVerified: boolean;
  courseCode?: string | null;
  maxMembers: number;
  requiresApproval?: boolean;
  memberCount: number;
  currentUserRole?: string | null;
  currentUserStatus?: string | null;
  isMember?: boolean;
  university?: { id: string; name: string; shortName?: string | null } | null;
  campus?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

export interface MobileEvent {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  isOnline: boolean;
  startDate: string;
  status: string;
  community: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  };
  attendeeCount: number;
  currentUserRsvp?: string | null;
  isAttending: boolean;
}

export interface MobileAnnouncement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  community: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  };
}

export interface MobileResource {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  type: string;
  courseCode?: string | null;
  verifiedDomain: boolean;
  badgeLabel?: string | null;
  community: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function CommunitiesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Content segment: communities, events, announcements, resources
  const [contentSection, setContentSection] = useState<
    "communities" | "events" | "announcements" | "resources"
  >("communities");

  // Institutional scope tabs
  const [activeTab, setActiveTab] = useState<
    "university" | "campus" | "department" | "joined" | "explore"
  >("university");

  const [search, setSearch] = useState("");

  // Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("ACADEMIC");
  const [scope, setScope] = useState("UNIVERSITY");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [courseCode, setCourseCode] = useState("");
  const [formError, setFormError] = useState("");

  // Query Communities
  const communitiesQuery = useQuery<{ communities: MobileCommunity[] }>({
    queryKey: ["discovery-communities", activeTab, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("tab", activeTab);
      if (search.trim()) params.set("q", search.trim());
      return apiClient.get(`/api/discovery/communities?${params.toString()}`);
    },
    enabled: contentSection === "communities",
  });

  // Query Events
  const eventsQuery = useQuery<{ events: MobileEvent[] }>({
    queryKey: ["discovery-events", activeTab, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("scope", activeTab === "explore" ? "all" : activeTab);
      if (search.trim()) params.set("q", search.trim());
      return apiClient.get(`/api/discovery/events?${params.toString()}`);
    },
    enabled: contentSection === "events",
  });

  // Query Announcements
  const announcementsQuery = useQuery<{ announcements: MobileAnnouncement[] }>({
    queryKey: ["discovery-announcements", activeTab, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("scope", activeTab === "explore" ? "all" : activeTab);
      if (search.trim()) params.set("q", search.trim());
      return apiClient.get(`/api/discovery/announcements?${params.toString()}`);
    },
    enabled: contentSection === "announcements",
  });

  // Query Resources
  const resourcesQuery = useQuery<{ resources: MobileResource[] }>({
    queryKey: ["discovery-resources", activeTab, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("scope", activeTab === "explore" ? "all" : activeTab);
      if (search.trim()) params.set("q", search.trim());
      return apiClient.get(`/api/discovery/resources?${params.toString()}`);
    },
    enabled: contentSection === "resources",
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: (slug: string) => apiClient.post(`/api/communities/${slug}/join`, {}),
    onSuccess: () => {
      triggerSuccessFeedback();
      queryClient.invalidateQueries({ queryKey: ["discovery-communities"] });
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      Alert.alert("Unable to join", err.message || "An error occurred");
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: (slug: string) => apiClient.post(`/api/communities/${slug}/leave`, {}),
    onSuccess: () => {
      triggerSuccessFeedback();
      queryClient.invalidateQueries({ queryKey: ["discovery-communities"] });
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      Alert.alert("Unable to leave", err.message || "An error occurred");
    },
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: ({ slug, eventId, status }: { slug: string; eventId: string; status: string }) =>
      apiClient.post(`/api/communities/${slug}/events/${eventId}/rsvp`, { status }),
    onSuccess: () => {
      triggerSuccessFeedback();
      queryClient.invalidateQueries({ queryKey: ["discovery-events"] });
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      Alert.alert("RSVP Failed", err.message || "Could not update RSVP status");
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post("/api/communities", payload),
    onSuccess: () => {
      triggerSuccessFeedback();
      queryClient.invalidateQueries({ queryKey: ["discovery-communities"] });
      setModalVisible(false);
      setName("");
      setDescription("");
      setCourseCode("");
      setFormError("");
    },
    onError: (err: any) => {
      triggerDestructiveFeedback();
      setFormError(err.message || "Failed to create community");
    },
  });

  const handleCreateSubmit = () => {
    if (!name.trim() || name.trim().length < 3) {
      setFormError("Community name must be at least 3 characters.");
      return;
    }
    setFormError("");
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      type,
      scope,
      visibility,
      courseCode: courseCode.trim() ? courseCode.trim().toUpperCase() : undefined,
    });
  };

  const currentQuery =
    contentSection === "communities"
      ? communitiesQuery
      : contentSection === "events"
      ? eventsQuery
      : contentSection === "announcements"
      ? announcementsQuery
      : resourcesQuery;

  return (
    <Screen style={{ paddingHorizontal: spacing.md }}>
      <Stack.Screen
        options={{
          title: "Campus Network 3.0",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                triggerSelectionFeedback();
                setModalVisible(true);
              }}
              style={styles.headerButton}
              accessibilityLabel="Create Community"
            >
              <Ionicons name="add-circle" size={26} color={colors.accent} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Content Section Pills */}
      <View style={styles.sectionTabsRow}>
        {(
          [
            { key: "communities", label: "Communities", icon: "people" },
            { key: "events", label: "Events", icon: "calendar" },
            { key: "announcements", label: "Announcements", icon: "megaphone" },
            { key: "resources", label: "Resources", icon: "document-text" },
          ] as const
        ).map((sec) => {
          const isSelected = contentSection === sec.key;
          return (
            <TouchableOpacity
              key={sec.key}
              onPress={() => {
                triggerSelectionFeedback();
                setContentSection(sec.key);
              }}
              style={[
                styles.sectionTabButton,
                { backgroundColor: isSelected ? colors.accent : colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name={sec.icon as any}
                size={14}
                color={isSelected ? "#ffffff" : colors.textSecondary}
              />
              <AppText
                variant="caption"
                style={{
                  color: isSelected ? "#ffffff" : colors.textPrimary,
                  fontWeight: isSelected ? "700" : "500",
                  fontSize: 11,
                }}
              >
                {sec.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Institutional Scope Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {(
            [
              { key: "university", label: "My University" },
              { key: "campus", label: "My Campus" },
              { key: "department", label: "My Department" },
              { key: "joined", label: "Joined" },
              { key: "explore", label: "Explore All" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  triggerSelectionFeedback();
                  setActiveTab(tab.key);
                }}
                style={[
                  styles.tabButton,
                  { backgroundColor: isActive ? colors.surfaceSecondary : "transparent" },
                  isActive && { borderColor: colors.accent, borderWidth: 1 },
                ]}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: isActive ? colors.accent : colors.textSecondary,
                    fontWeight: isActive ? "700" : "500",
                  }}
                >
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          placeholder={`Search ${contentSection}...`}
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Rendering */}
      {currentQuery.isLoading ? (
        <LoadingState message={`Discovering ${contentSection}...`} />
      ) : currentQuery.isError ? (
        <ErrorState message={`Failed to load ${contentSection}.`} onRetry={() => currentQuery.refetch()} />
      ) : contentSection === "communities" ? (
        (communitiesQuery.data?.communities || []).length === 0 ? (
          <EmptyState
            icon={<Ionicons name="people-outline" size={48} color={colors.textTertiary} />}
            title="No Communities Found"
            description="No active student communities matched your search. Be the first to build a group!"
            actionLabel="Create Community"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            refreshControl={
              <RefreshControl
                refreshing={communitiesQuery.isRefetching}
                onRefresh={() => communitiesQuery.refetch()}
              />
            }
          >
            {(communitiesQuery.data?.communities || []).map((comm) => {
              const isOwner = comm.currentUserRole === "OWNER";
              const isActive = comm.currentUserStatus === "ACTIVE";
              const isPending = comm.currentUserStatus === "PENDING";

              return (
                <Card
                  key={comm.id}
                  style={styles.communityCard}
                  onPress={() => router.push(`/communities/${comm.slug}` as any)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.pillsRow}>
                      <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
                        <AppText variant="caption" style={{ color: colors.textSecondary, fontSize: 10 }}>
                          {comm.type}
                        </AppText>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
                        <AppText variant="caption" style={{ color: colors.accent, fontSize: 10 }}>
                          {comm.scope}
                        </AppText>
                      </View>
                      {comm.visibility === "PRIVATE" && (
                        <View style={[styles.badge, { backgroundColor: "#f59e0b1A" }]}>
                          <Ionicons name="lock-closed" size={10} color="#f59e0b" style={{ marginRight: 2 }} />
                          <AppText variant="caption" style={{ color: "#f59e0b", fontSize: 10 }}>
                            Private
                          </AppText>
                        </View>
                      )}
                    </View>

                    {comm.isVerified && (
                      <View style={[styles.badge, { backgroundColor: "#10b9811A" }]}>
                        <Ionicons name="checkmark-circle" size={12} color="#10b981" style={{ marginRight: 2 }} />
                        <AppText variant="caption" style={{ color: "#10b981", fontSize: 10, fontWeight: "700" }}>
                          Verified
                        </AppText>
                      </View>
                    )}
                  </View>

                  <AppText variant="h3" style={{ marginTop: spacing.xs }}>
                    {comm.name}
                  </AppText>

                  {comm.courseCode && (
                    <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600", marginTop: 2 }}>
                      {comm.courseCode}
                    </AppText>
                  )}

                  <AppText
                    variant="body"
                    style={{ color: colors.textSecondary, marginTop: spacing.xs }}
                    numberOfLines={2}
                  >
                    {comm.description || "No description provided."}
                  </AppText>

                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.memberCountRow}>
                      <Ionicons name="people-outline" size={14} color={colors.textTertiary} style={{ marginRight: 4 }} />
                      <AppText variant="caption" style={{ color: colors.textTertiary }}>
                        {comm.memberCount} / {comm.maxMembers}
                      </AppText>
                    </View>

                    {isOwner ? (
                      <AppText variant="caption" style={{ color: colors.accent, fontWeight: "700" }}>
                        Owner
                      </AppText>
                    ) : isActive ? (
                      <TouchableOpacity
                        onPress={() => leaveMutation.mutate(comm.slug)}
                        disabled={leaveMutation.isPending}
                      >
                        <AppText variant="caption" style={{ color: colors.textTertiary }}>
                          Leave Group
                        </AppText>
                      </TouchableOpacity>
                    ) : isPending ? (
                      <AppText variant="caption" style={{ color: "#f59e0b", fontWeight: "600" }}>
                        Pending Approval
                      </AppText>
                    ) : (
                      <Button
                        title={comm.requiresApproval ? "Request" : "Join"}
                        variant="secondary"
                        size="sm"
                        loading={joinMutation.isPending}
                        onPress={() => joinMutation.mutate(comm.slug)}
                      />
                    )}
                  </View>
                </Card>
              );
            })}
          </ScrollView>
        )
      ) : contentSection === "events" ? (
        (eventsQuery.data?.events || []).length === 0 ? (
          <EmptyState
            icon={<Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />}
            title="No Events Found"
            description="There are no upcoming campus events matching this scope."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            refreshControl={
              <RefreshControl refreshing={eventsQuery.isRefetching} onRefresh={() => eventsQuery.refetch()} />
            }
          >
            {(eventsQuery.data?.events || []).map((event) => (
              <Card key={event.id} style={styles.communityCard}>
                <View style={styles.cardHeader}>
                  <AppText variant="caption" style={{ color: colors.accent, fontWeight: "700" }}>
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </AppText>
                  <View style={[styles.badge, { backgroundColor: event.isOnline ? "#10b9811A" : colors.surfaceSecondary }]}>
                    <AppText
                      variant="caption"
                      style={{ color: event.isOnline ? "#10b981" : colors.textSecondary, fontSize: 10 }}
                    >
                      {event.isOnline ? "Online" : "In-Person"}
                    </AppText>
                  </View>
                </View>

                <AppText variant="h3" style={{ marginTop: spacing.xs }}>
                  {event.title}
                </AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Host: {event.community.name}
                </AppText>

                <AppText variant="body" style={{ color: colors.textSecondary, marginTop: spacing.xs }} numberOfLines={2}>
                  {event.description || "No description provided."}
                </AppText>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <AppText variant="caption" style={{ color: colors.textTertiary }}>
                    {event.attendeeCount} going
                  </AppText>
                  <Button
                    title={event.isAttending ? "Going ✓" : "RSVP"}
                    variant={event.isAttending ? "secondary" : "primary"}
                    size="sm"
                    loading={rsvpMutation.isPending}
                    onPress={() =>
                      rsvpMutation.mutate({
                        slug: event.community.slug,
                        eventId: event.id,
                        status: event.isAttending ? "NOT_GOING" : "GOING",
                      })
                    }
                  />
                </View>
              </Card>
            ))}
          </ScrollView>
        )
      ) : contentSection === "announcements" ? (
        (announcementsQuery.data?.announcements || []).length === 0 ? (
          <EmptyState
            icon={<Ionicons name="megaphone-outline" size={48} color={colors.textTertiary} />}
            title="No Announcements"
            description="No announcements published under this scope."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            refreshControl={
              <RefreshControl
                refreshing={announcementsQuery.isRefetching}
                onRefresh={() => announcementsQuery.refetch()}
              />
            }
          >
            {(announcementsQuery.data?.announcements || []).map((ann) => (
              <Card key={ann.id} style={styles.communityCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.pillsRow}>
                    {ann.isPinned && (
                      <View style={[styles.badge, { backgroundColor: "#f59e0b1A" }]}>
                        <AppText variant="caption" style={{ color: "#f59e0b", fontSize: 10, fontWeight: "700" }}>
                          Pinned
                        </AppText>
                      </View>
                    )}
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      {ann.community.name}
                    </AppText>
                  </View>
                  <AppText variant="caption" style={{ color: colors.textTertiary }}>
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </AppText>
                </View>

                <AppText variant="h3" style={{ marginTop: spacing.xs }}>
                  {ann.title}
                </AppText>
                <AppText variant="body" style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                  {ann.content}
                </AppText>
              </Card>
            ))}
          </ScrollView>
        )
      ) : (
        /* Resources section */
        (resourcesQuery.data?.resources || []).length === 0 ? (
          <EmptyState
            icon={<Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />}
            title="No Resources Found"
            description="No academic links or materials shared under this scope."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            refreshControl={
              <RefreshControl
                refreshing={resourcesQuery.isRefetching}
                onRefresh={() => resourcesQuery.refetch()}
              />
            }
          >
            {(resourcesQuery.data?.resources || []).map((res) => (
              <Card key={res.id} style={styles.communityCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
                    <AppText variant="caption" style={{ color: colors.textSecondary, fontSize: 10 }}>
                      {res.type}
                    </AppText>
                  </View>
                  {res.verifiedDomain && (
                    <View style={[styles.badge, { backgroundColor: "#10b9811A" }]}>
                      <Ionicons name="checkmark-circle" size={12} color="#10b981" style={{ marginRight: 2 }} />
                      <AppText variant="caption" style={{ color: "#10b981", fontSize: 10, fontWeight: "700" }}>
                        Verified Domain
                      </AppText>
                    </View>
                  )}
                </View>

                <AppText variant="h3" style={{ marginTop: spacing.xs }}>
                  {res.title}
                </AppText>
                {res.courseCode && (
                  <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600", marginTop: 2 }}>
                    {res.courseCode}
                  </AppText>
                )}

                <AppText variant="body" style={{ color: colors.textSecondary, marginTop: spacing.xs }} numberOfLines={2}>
                  {res.description || res.url}
                </AppText>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <AppText variant="caption" style={{ color: colors.textTertiary }}>
                    By {res.community.name}
                  </AppText>
                  <Button
                    title="Open Link"
                    variant="secondary"
                    size="sm"
                    onPress={() => Linking.openURL(res.url)}
                  />
                </View>
              </Card>
            ))}
          </ScrollView>
        )
      )}

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <ModalKeyboardContainer>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Create Community</AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={[styles.errorBanner, { backgroundColor: "#ef44441A", borderColor: "#ef444433" }]}>
                <AppText variant="caption" style={{ color: "#ef4444" }}>
                  {formError}
                </AppText>
              </View>
            ) : null}

            <FormInput
              label="Community Name *"
              placeholder="e.g. ACM Student Chapter"
              value={name}
              onChangeText={setName}
            />

            <FormInput
              label="Description"
              placeholder="Purpose and vision for members"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <FormInput
              label="Course Code (Optional)"
              placeholder="e.g. CS201"
              value={courseCode}
              onChangeText={setCourseCode}
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button
                title="Create Group"
                loading={createMutation.isPending}
                onPress={handleCreateSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </ModalKeyboardContainer>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: spacing.xs,
  },
  sectionTabsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  tabsContainer: {
    marginBottom: spacing.sm,
  },
  tabsScroll: {
    gap: spacing.xs,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: BorderRadius.full,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    height: 38,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  communityCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pillsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  memberCountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalCard: {
    padding: spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  errorBanner: {
    padding: spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
