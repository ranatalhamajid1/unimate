import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { StatusChip } from "@/components/ui/StatusChip";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/layout";
import type { MobileAiQuota } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "What assignments are due this week?",
  "How is my attendance across my courses?",
  "How should I prepare for my upcoming exams?",
  "Give me a strategy to raise my GPA",
];

export default function AiBuddyScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro-1",
      role: "model",
      content:
        "Hello! I'm your UniMate AI Study Buddy. I have secure, real-time context about your enrolled courses, deadlines, and schedule. How can I help you excel today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: quotaData, refetch: refetchQuota } = useQuery({
    queryKey: ["ai-quota"],
    queryFn: async () => {
      return await apiClient.get<{ success: boolean; quota: MobileAiQuota }>("/api/mobile/ai/quota");
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (userText: string) => {
      const history = messages
        .filter((m) => m.id !== "intro-1")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      return await apiClient.post<{
        success: boolean;
        response: string;
        quota: { currentCount: number; limit: number; remaining: number };
      }>("/api/mobile/ai/study-buddy", {
        message: userText,
        history,
      });
    },
    onSuccess: (res) => {
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "model",
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, modelMsg]);
      refetchQuota();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to reach AI Study Buddy. Please try again.");
    },
  });

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, sendMutation.isPending]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sendMutation.isPending) return;

    setErrorMessage("");
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    sendMutation.mutate(text);
  };

  const quota = quotaData?.quota;

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "AI Study Buddy", headerBackTitle: "More" }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Quota Indicator Bar */}
        <View style={[styles.quotaBanner, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.quotaInfo}>
            <Ionicons name="sparkles" size={16} color={colors.accent} />
            <AppText variant="caption" colorRole="secondary">
              Daily AI Quota:{" "}
              <AppText variant="caption" style={{ fontWeight: "600", color: colors.textPrimary }}>
                {quota ? `${quota.remaining} / ${quota.limit} left today` : "Loading..."}
              </AppText>
            </AppText>
          </View>
          {quota && quota.plan === "PRO" ? (
            <StatusChip label="PRO 50/day" variant="accent" size="sm" />
          ) : (
            <StatusChip label="FREE 5/day" variant="neutral" size="sm" />
          )}
        </View>

        {/* Message Thread */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userMessageRow : styles.modelMessageRow,
                ]}
              >
                {!isUser && (
                  <View style={[styles.avatarBox, { backgroundColor: colors.accentSubtle }]}>
                    <Ionicons name="sparkles" size={16} color={colors.accent} />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [styles.modelBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                  ]}
                >
                  <AppText
                    variant="body"
                    style={{
                      color: isUser ? "#FFFFFF" : colors.textPrimary,
                      lineHeight: 22,
                    }}
                  >
                    {msg.content}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{
                      color: isUser ? "rgba(255,255,255,0.7)" : colors.textTertiary,
                      fontSize: 10,
                      marginTop: 4,
                      alignSelf: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg.timestamp}
                  </AppText>
                </View>
              </View>
            );
          })}

          {/* Pending Thinking Indicator */}
          {sendMutation.isPending && (
            <View style={[styles.messageRow, styles.modelMessageRow]}>
              <View style={[styles.avatarBox, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="sparkles" size={16} color={colors.accent} />
              </View>
              <View
                style={[
                  styles.bubble,
                  styles.modelBubble,
                  { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 12 },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <AppText variant="caption" colorRole="secondary">
                    Thinking with course context...
                  </AppText>
                </View>
              </View>
            </View>
          )}

          {/* Error Message */}
          {Boolean(errorMessage) && (
            <View style={[styles.errorBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.danger }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <AppText variant="caption" style={{ color: colors.danger, flex: 1 }}>
                {errorMessage}
              </AppText>
            </View>
          )}

          {/* Quick Prompts (shown when thread is short) */}
          {messages.length <= 3 && !sendMutation.isPending && (
            <View style={styles.quickPromptsSection}>
              <AppText variant="caption" colorRole="tertiary" style={styles.quickPromptsTitle}>
                SUGGESTED QUESTIONS
              </AppText>
              <View style={styles.quickPromptsRow}>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSendMessage(prompt)}
                    style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <AppText variant="caption" style={{ color: colors.textPrimary }}>
                      {prompt}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surfaceSecondary,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder="Ask anything about your courses & deadlines..."
            placeholderTextColor={colors.textTertiary}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
            multiline={false}
            editable={!sendMutation.isPending}
          />
          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputMessage.trim() || sendMutation.isPending}
            style={[
              styles.sendButton,
              {
                backgroundColor: inputMessage.trim() ? colors.primary : colors.surfaceSecondary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputMessage.trim() ? "#FFFFFF" : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  quotaBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  quotaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatScroll: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  chatScrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    alignItems: "flex-end",
    gap: 8,
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  modelMessageRow: {
    justifyContent: "flex-start",
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  quickPromptsSection: {
    marginTop: spacing.md,
  },
  quickPromptsTitle: {
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  quickPromptsRow: {
    gap: spacing.xs,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
