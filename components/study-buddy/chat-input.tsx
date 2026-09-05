"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
};

export function ChatInput({
  onSendMessage,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 140);
    el.style.height = `${newHeight}px`;
  }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isOverWarning = text.length > 800;

  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          placeholder="Ask Study Buddy about your courses, exams, assignments, or plan..."
          aria-label="Message to AI Study Buddy"
          rows={1}
          maxLength={1000}
          className="max-h-[140px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:opacity-50"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading || disabled}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition-all duration-150 hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Helper text / character limit */}
      <div className="mt-1 flex items-center justify-between px-3 pb-1 text-[11px] text-slate-400">
        <span>Enter to send, Shift+Enter for new line</span>
        {isOverWarning && (
          <span className="text-amber-600 font-mono">
            {text.length}/1000
          </span>
        )}
      </div>
    </div>
  );
}
