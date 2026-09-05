"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Trash2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { ChatMessageBubble, MessageItem } from "./chat-message";
import { ChatInput } from "./chat-input";
import { StarterPrompts } from "./starter-prompts";

type StudyBuddyViewProps = {
  studentName: string;
  initialPrompt?: string;
};

export function StudyBuddyView({
  studentName,
  initialPrompt,
}: StudyBuddyViewProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialPromptFiredRef = useRef(false);

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading, scrollToBottom]);

  // Send a message to /api/ai/study-buddy
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setErrorMessage(null);

      const userMsg: MessageItem = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      // Append user message immediately
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Send history (last 6 items before this message)
        const historyPayload = messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/study-buddy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text.trim(),
            history: historyPayload,
          }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            setErrorMessage("Your session has expired. Please refresh the page or log in again.");
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get AI response");
        }

        const data = await res.json();
        const aiResponseContent =
          data.response ||
          "Sorry, I couldn't reach the Study Buddy right now. Please try again.";

        const aiMsg: MessageItem = {
          id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: "model",
          content: aiResponseContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        console.error("Study Buddy error:", err);
        setErrorMessage(
          "Sorry, I couldn't reach the Study Buddy right now. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  // Auto-fire initial prompt if passed via URL param
  useEffect(() => {
    if (initialPrompt && !initialPromptFiredRef.current && messages.length === 0) {
      initialPromptFiredRef.current = true;
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, handleSendMessage, messages.length]);

  const handleClearChat = () => {
    if (messages.length > 0) {
      setMessages([]);
      setErrorMessage(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[550px] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 shadow-xs overflow-hidden">
      {/* ── Chat Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-semibold text-[var(--color-text)]">
                AI Study Buddy
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-[12.5px] text-[var(--color-text-2)]">
              Your personalized academic assistant
            </p>
          </div>
        </div>

        {/* Clear / Status actions */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isLoading}
              title="Clear conversation"
              className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-2)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear chat</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Messages Area ─────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div className="mx-auto max-w-2xl pt-4 sm:pt-8 space-y-6">
            {/* Welcome card */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
                Welcome, {studentName}!
              </h2>
              <p className="text-[13.5px] leading-relaxed text-[var(--color-text-2)] max-w-lg mx-auto">
                I am connected directly to your enrolled courses, today&apos;s timetable,
                upcoming exams, pending assignments, and attendance records.
              </p>

              {/* Privacy badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 px-3 py-1 text-[11.5px] text-[var(--color-text-2)]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Private &amp; Secure — Your financial data is never shared</span>
              </div>
            </div>

            {/* Starter prompts */}
            <div className="space-y-2.5">
              <p className="text-[12.5px] font-medium text-[var(--color-text-3)] uppercase tracking-wider px-1">
                Suggested questions to get started
              </p>
              <StarterPrompts
                onSelectPrompt={handleSendMessage}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                studentName={studentName}
              />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-xs border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
                    <span
                      className="h-2 w-2 rounded-full bg-blue-600 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-blue-600 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <span className="ml-2 text-[12.5px] text-[var(--color-text-2)]">
                      Study Buddy is reviewing your courses and schedule...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="mx-auto max-w-3xl rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3.5 text-[13px] text-red-700 dark:text-red-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                if (lastUserMsg) {
                  handleSendMessage(lastUserMsg.content);
                }
              }}
              className="flex items-center gap-1 font-semibold text-red-800 dark:text-red-300 hover:underline shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Input Bar ─────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
