import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/use-theme";
import { apiGet, apiPost } from "@/lib/api-client";
import {
  triggerSelectionFeedback,
  triggerSuccessFeedback,
  triggerDestructiveFeedback,
} from "@/lib/haptics";
import { MobileFocusTimerRing } from "@/components/focus/MobileFocusTimerRing";
import type { MobileActiveFocusSession } from "@/lib/types";

const DURATION_PRESETS = [25, 50, 90] as const;

export default function FocusSessionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    courseId?: string;
    courseCode?: string;
    courseName?: string;
    courseColor?: string;
    estimatedMinutes?: string;
    entityType?: string;
  }>();

  const [activeSession, setActiveSession] = useState<MobileActiveFocusSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(
    params.estimatedMinutes ? Number(params.estimatedMinutes) || 50 : 50
  );
  const [markComplete, setMarkComplete] = useState(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // 1. Fetch active session on mount
  const fetchActive = async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; activeSession: MobileActiveFocusSession | null }>(
        "/api/study-sessions/active"
      );
      if (res.success && res.activeSession) {
        setActiveSession(res.activeSession);
      } else {
        setActiveSession(null);
      }
    } catch {
      // Offline / error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  // 2. Timer interval ticker
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Elapsed / remaining time math
  const plannedMins = activeSession?.plannedDuration || selectedDuration;
  const plannedSecs = plannedMins * 60;

  let elapsedSecs = 0;
  if (activeSession) {
    const startMs = new Date(activeSession.sessionDate).getTime();
    const pausedMs = activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() : null;
    const totalPaused = activeSession.totalPausedSeconds || 0;

    if (pausedMs) {
      elapsedSecs = Math.max(0, Math.floor((pausedMs - startMs) / 1000) - totalPaused);
    } else {
      elapsedSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000) - totalPaused);
    }
  }

  const remainingSecs = Math.max(0, plannedSecs - elapsedSecs);
  const progress = Math.min(1, elapsedSecs / plannedSecs);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Actions
  const handleStart = async () => {
    try {
      setActionLoading(true);
      await triggerSelectionFeedback();
      const res = await apiPost<{ success: boolean; activeSession: MobileActiveFocusSession }>(
        "/api/study-sessions/start",
        {
          title: params.title || "Independent Focus",
          courseId: params.courseId || null,
          targetType: params.entityType || "GENERAL",
          targetId: params.id || null,
          plannedMinutes: selectedDuration,
        }
      );
      if (res.success && res.activeSession) {
        setActiveSession(res.activeSession);
      }
    } catch (err: any) {
      Alert.alert("Unable to Start", err.message || "An active focus session may already exist.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (!activeSession) return;
    try {
      setActionLoading(true);
      await triggerSelectionFeedback();
      const res = await apiPost<{ success: boolean; activeSession: MobileActiveFocusSession }>(
        `/api/study-sessions/${activeSession.id}/pause`,
        {}
      );
      if (res.success && res.activeSession) {
        setActiveSession(res.activeSession);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to pause session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!activeSession) return;
    try {
      setActionLoading(true);
      await triggerSelectionFeedback();
      const res = await apiPost<{ success: boolean; activeSession: MobileActiveFocusSession }>(
        `/api/study-sessions/${activeSession.id}/resume`,
        {}
      );
      if (res.success && res.activeSession) {
        setActiveSession(res.activeSession);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to resume session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    try {
      setActionLoading(true);
      await triggerSuccessFeedback();
      const res = await apiPost<{
        success: boolean;
        data: { actualDuration: number; targetMarkedComplete: boolean };
      }>(`/api/study-sessions/${activeSession.id}/complete`, {
        markTargetComplete: markComplete,
      });

      if (res.success) {
        Alert.alert(
          "Focus Completed!",
          `Recorded ${res.data.actualDuration} focused minute${
            res.data.actualDuration === 1 ? "" : "s"
          } to your academic statistics.`,
          [{ text: "Done", onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to complete session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (!activeSession) return;
    Alert.alert(
      "Cancel Session?",
      "Genuine focused time (if >= 1m) will still be recorded, but the session will be marked cancelled.",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "Cancel Session",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await triggerDestructiveFeedback();
              await apiPost(`/api/study-sessions/${activeSession.id}/cancel`, {});
              router.back();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to cancel session.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const isPaused = activeSession?.status === "PAUSED";
  const hasActive = Boolean(activeSession);

  return (
    <Screen style={[styles.screen, isDark && { backgroundColor: "#080B12" }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to Today Workspace"
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <AppText variant="h3" style={styles.headerTitle}>
          {hasActive ? "Focus Mode" : "Start Focus"}
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Target Task Card */}
          <Card variant="floating" style={styles.taskCard}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.courseBadge,
                  {
                    backgroundColor: `${
                      activeSession?.courseColor || params.courseColor || colors.accent
                    }15`,
                    borderColor: `${
                      activeSession?.courseColor || params.courseColor || colors.accent
                    }40`,
                  },
                ]}
              >
                <AppText
                  variant="label"
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: activeSession?.courseColor || params.courseColor || colors.accent,
                  }}
                >
                  {activeSession?.courseCode || params.courseCode || "STUDY"}
                </AppText>
              </View>

              <AppText
                variant="caption"
                colorRole="secondary"
                numberOfLines={1}
                style={styles.courseName}
              >
                {activeSession?.courseName || params.courseName || "Academic Work"}
              </AppText>
            </View>

            <AppText variant="h3" style={styles.taskTitle} numberOfLines={2}>
              {activeSession?.title || params.title || "Independent Focus"}
            </AppText>
          </Card>

          {/* If NO active session: select preset */}
          {!hasActive && (
            <View style={styles.presetSection}>
              <AppText variant="label" style={styles.sectionLabel}>
                SELECT FOCUS DURATION
              </AppText>

              <View style={styles.presetGrid}>
                {DURATION_PRESETS.map((mins) => {
                  const isSelected = selectedDuration === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => {
                        triggerSelectionFeedback();
                        setSelectedDuration(mins);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.presetCard,
                        {
                          borderColor: isSelected ? colors.accent : (colors.borderSubtle || colors.border),
                          backgroundColor: isSelected
                            ? `${colors.accent}18`
                            : isDark
                            ? "rgba(23, 30, 46, 0.7)"
                            : colors.surface,
                        },
                      ]}
                    >
                      <AppText
                        variant="h3"
                        style={{ color: isSelected ? colors.accent : colors.textPrimary }}
                      >
                        {mins}m
                      </AppText>
                      <AppText variant="caption" colorRole="tertiary">
                        {mins === 25 ? "Sprint" : mins === 50 ? "Standard" : "Deep Work"}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                title={`Begin Focus (${selectedDuration} min)`}
                variant="primary"
                size="lg"
                onPress={handleStart}
                loading={actionLoading}
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          {/* If ACTIVE session exists: show timer and lifecycle controls */}
          {hasActive && (
            <View style={styles.activeSection}>
              <MobileFocusTimerRing
                progress={progress}
                remainingText={formatTime(remainingSecs)}
                elapsedText={`${formatTime(elapsedSecs)} elapsed of ${plannedMins}m`}
                status={activeSession?.status === "PAUSED" ? "PAUSED" : "ACTIVE"}
                courseColor={activeSession?.courseColor}
              />

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                {isPaused ? (
                  <Button
                    title="Resume"
                    variant="primary"
                    size="md"
                    onPress={handleResume}
                    loading={actionLoading}
                    style={styles.flexButton}
                  />
                ) : (
                  <Button
                    title="Pause"
                    variant="secondary"
                    size="md"
                    onPress={handlePause}
                    loading={actionLoading}
                    style={styles.flexButton}
                  />
                )}

                <Button
                  title="Complete"
                  variant="primary"
                  size="md"
                  onPress={handleComplete}
                  loading={actionLoading}
                  style={styles.flexButton}
                />
              </View>

              {/* Mark Task Complete Switch */}
              {activeSession?.targetId && (
                <View style={[styles.switchRow, { borderColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <AppText variant="bodyMedium" style={{ fontWeight: "600" }}>
                      Mark task complete
                    </AppText>
                    <AppText variant="caption" colorRole="secondary">
                      Mark the linked assignment or study item as finished
                    </AppText>
                  </View>
                  <Switch
                    value={markComplete}
                    onValueChange={setMarkComplete}
                    trackColor={{ false: colors.borderSubtle, true: colors.accent }}
                  />
                </View>
              )}

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={handleCancel}
                activeOpacity={0.7}
                style={styles.cancelLink}
              >
                <AppText style={{ color: colors.destructive, fontSize: 13, fontWeight: "600" }}>
                  Cancel Session
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  taskCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  courseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  courseName: {
    flex: 1,
    fontSize: 12,
  },
  taskTitle: {
    fontWeight: "700",
  },
  presetSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  presetGrid: {
    flexDirection: "row",
    gap: 10,
  },
  presetCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  activeSection: {
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 12,
  },
  flexButton: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cancelLink: {
    marginTop: 24,
    padding: 8,
  },
});
