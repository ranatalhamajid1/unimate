import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

interface QuickActionsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickActionsSheet({ visible, onClose }: QuickActionsSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const actions = [
    {
      id: "assignment",
      title: "Add Assignment",
      subtitle: "Track upcoming deadline or homework",
      icon: "clipboard-outline" as const,
      route: "/(tabs)/assignments",
    },
    {
      id: "study",
      title: "Log Study Session",
      subtitle: "Record minutes spent preparing",
      icon: "timer-outline" as const,
      route: "/study-sessions",
    },
    {
      id: "ai",
      title: "Ask AI Study Buddy",
      subtitle: "Get instant academic advisory or study help",
      icon: "sparkles-outline" as const,
      route: "/(tabs)/ai-buddy",
    },
    {
      id: "academics",
      title: "View Academic Standing",
      subtitle: "Check cumulative GPA & attendance",
      icon: "school-outline" as const,
      route: "/academics",
    },
    {
      id: "gpa-sim",
      title: "GPA Simulator",
      subtitle: "Forecast target grades & feasibility",
      icon: "trending-up-outline" as const,
      route: "/academics",
    },
    {
      id: "communities",
      title: "Campus Network",
      subtitle: "Join student communities & study groups",
      icon: "people-outline" as const,
      route: "/communities",
    },
  ];

  function handleSelect(route: string) {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                <View style={styles.headerRow}>
                  <AppText variant="h3" style={styles.sheetTitle}>
                    Quick Actions
                  </AppText>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Close sheet"
                  >
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsList}>
                {actions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelect(item.route)}
                    style={[
                      styles.actionRow,
                      { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: colors.accentSubtle },
                      ]}
                    >
                      <Ionicons name={item.icon} size={20} color={colors.accent} />
                    </View>
                    <View style={styles.textContainer}>
                      <AppText variant="body" style={styles.actionTitle}>
                        {item.title}
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.textSecondary }}>
                        {item.subtitle}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  sheetHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontWeight: "700",
  },
  actionsList: {
    gap: 10,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
});
