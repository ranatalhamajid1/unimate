/**
 * Safe haptics utility for UniMate Mobile.
 * Restrained haptic feedback:
 * - Selection (e.g. university chosen, tab switch)
 * - Success (e.g. save/submit, onboarding completion)
 * - Destructive (e.g. delete confirmation)
 * Never triggered for normal scrolling, typing, or general button presses.
 */

import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export async function triggerSelectionFeedback() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Graceful fallback for simulators or unsupported devices
  }
}

export async function triggerSuccessFeedback() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Graceful fallback
  }
}

export async function triggerDestructiveFeedback() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Graceful fallback
  }
}

export async function triggerImpactFeedback(style: "light" | "medium" = "light") {
  if (Platform.OS === "web") return;
  try {
    const feedbackStyle =
      style === "medium"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    await Haptics.impactAsync(feedbackStyle);
  } catch {
    // Graceful fallback
  }
}
