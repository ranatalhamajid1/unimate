import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/use-theme";
import { triggerSelectionFeedback } from "@/lib/haptics";
import type { MobileActiveFocusSession } from "@/lib/types";

interface MobileActiveFocusBarProps {
  activeSession: MobileActiveFocusSession | null;
  onRefresh?: () => void;
}

export function MobileActiveFocusBar({
  activeSession,
  onRefresh,
}: MobileActiveFocusBarProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const startDate = new Date(activeSession.sessionDate).getTime();
  const pausedDate = activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() : null;
  const totalPaused = activeSession.totalPausedSeconds || 0;

  let activeSec = 0;
  if (pausedDate) {
    activeSec = Math.max(0, Math.floor((pausedDate - startDate) / 1000) - totalPaused);
  } else {
    activeSec = Math.max(0, Math.floor((nowMs - startDate) / 1000) - totalPaused);
  }

  const plannedSec = (activeSession.plannedDuration || 50) * 60;
  const remainingSec = Math.max(0, plannedSec - activeSec);
  const m = Math.floor(remainingSec / 60);
  const s = remainingSec % 60;
  const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  const isPaused = activeSession.status === "PAUSED";

  const handlePress = async () => {
    await triggerSelectionFeedback();
    router.push("/focus-session");
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[
        styles.bar,
        {
          backgroundColor: isDark ? "rgba(23, 30, 46, 0.94)" : "rgba(255, 255, 255, 0.96)",
          borderColor: isDark ? "rgba(99, 102, 241, 0.35)" : "rgba(99, 102, 241, 0.25)",
          shadowColor: isDark ? "#000000" : colors.accent,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Active focus session: ${activeSession.title}, ${timeStr} remaining`}
    >
      <View style={styles.leftRow}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isPaused ? colors.warning : colors.accent,
              shadowColor: isPaused ? colors.warning : colors.accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        />
        <AppText variant="label" style={[styles.timeText, { color: colors.accent }]}>
          {timeStr}
        </AppText>
        <AppText
          variant="caption"
          colorRole="secondary"
          numberOfLines={1}
          style={styles.titleText}
        >
          • {activeSession.title}
        </AppText>
      </View>

      <View style={styles.rightRow}>
        <Ionicons name="chevron-forward" size={16} color={colors.accent} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 99,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  timeText: {
    fontWeight: "700",
    fontSize: 14,
    marginRight: 6,
    fontVariant: ["tabular-nums"],
  },
  titleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  rightRow: {
    paddingLeft: 4,
  },
});
