/**
 * Immersive Spatial Focus Timer Ring with concentric depth & breathing aura.
 * Calibrated for M16.2: God-Level Visual Experience 2.0.
 * Lightweight opacity + scale transform breathing aura, respects reduced-motion.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/use-theme";

interface MobileFocusTimerRingProps {
  progress: number; // 0 to 1
  remainingText: string;
  elapsedText: string;
  status: "ACTIVE" | "PAUSED";
  courseColor?: string;
}

export function MobileFocusTimerRing({
  progress,
  remainingText,
  elapsedText,
  status,
  courseColor,
}: MobileFocusTimerRingProps) {
  const { colors, isDark } = useTheme();
  const ringColor = courseColor || colors.accent;
  const isPaused = status === "PAUSED";

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const breathAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) setIsReducedMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        setIsReducedMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (isReducedMotion || isPaused) {
      breathAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [breathAnim, isReducedMotion, isPaused]);

  const auraScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const auraOpacity = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.65],
  });

  return (
    <View style={styles.container}>
      {/* 1. Ambient Breathing Aura Ring (Layer 0) */}
      {!isReducedMotion && !isPaused && (
        <Animated.View
          style={[
            styles.auraRing,
            {
              borderColor: ringColor,
              backgroundColor: isDark
                ? "rgba(99, 102, 241, 0.08)"
                : "rgba(99, 102, 241, 0.04)",
              transform: [{ scale: auraScale }],
              opacity: auraOpacity,
            },
          ]}
        />
      )}

      {/* 2. Concentric Outer Spatial Bezel (Layer 1) */}
      <View
        style={[
          styles.outerRing,
          {
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : colors.borderSubtle,
            backgroundColor: isDark ? "rgba(16, 21, 34, 0.72)" : colors.surfaceSecondary,
            shadowColor: ringColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowRadius: 20,
            elevation: 8,
          },
        ]}
      >
        {/* 3. Middle Accent Track Ring (Layer 2) */}
        <View
          style={[
            styles.middleRing,
            {
              borderColor: isPaused ? `${colors.warning}40` : `${ringColor}35`,
            },
          ]}
        >
          {/* 4. Active Accent Core Ring (Layer 3) */}
          <View
            style={[
              styles.innerRing,
              {
                borderColor: isPaused ? colors.warning : ringColor,
                backgroundColor: isDark ? "#0D111A" : colors.surface,
              },
            ]}
          >
            {/* Status Pill Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isPaused ? `${colors.warning}18` : `${colors.success}18`,
                  borderColor: isPaused ? `${colors.warning}50` : `${colors.success}50`,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isPaused ? colors.warning : colors.success },
                ]}
              />
              <AppText
                variant="label"
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  color: isPaused ? colors.warning : colors.success,
                }}
              >
                {isPaused ? "PAUSED" : "DEEP FOCUS"}
              </AppText>
            </View>

            {/* Large Tabular Countdown */}
            <AppText variant="h1" style={[styles.timeText, { color: colors.textPrimary }]}>
              {remainingText}
            </AppText>

            {/* Subtitle Elapsed */}
            <View style={styles.elapsedRow}>
              <AppText colorRole="tertiary" variant="caption" style={styles.elapsedText}>
                {elapsedText}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 28,
    position: "relative",
  },
  auraRing: {
    position: "absolute",
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1.5,
    zIndex: 0,
  },
  outerRing: {
    width: 268,
    height: 268,
    borderRadius: 134,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    zIndex: 1,
  },
  middleRing: {
    width: 246,
    height: 246,
    borderRadius: 123,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  innerRing: {
    width: 226,
    height: 226,
    borderRadius: 113,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeText: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.5,
    fontVariant: ["tabular-nums"],
  },
  elapsedRow: {
    marginTop: 6,
  },
  elapsedText: {
    fontSize: 12,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
});
